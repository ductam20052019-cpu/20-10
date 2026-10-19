import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createSiteServer } from '../scripts/server.mjs';

let server;
let base;
before(async () => {
  server = createSiteServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => server.close(resolve)));

test('serves the story and its local scripts and stylesheet', async () => {
  const page = await fetch(base);
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /này cậu gì ơi/);
  assert.match(html, /id="share-fuel-button"/);
  assert.match(html, /id="gift-letter-scene"/);
  for (const [, path] of html.matchAll(/(?:src|href)="((?:scripts|styles|assets)\/[^"#]+)"/g)) {
    const asset = await fetch(`${base}/${path}`, { method: 'HEAD' });
    assert.equal(asset.status, 200, path);
    assert.ok(Number(asset.headers.get('content-length')) > 0, path);
  }
});

test('supports audio seeking with an exact byte range', async () => {
  const audio = await fetch(`${base}/assets/audio/soundtrack.mp3`, { headers: { Range: 'bytes=0-99' } });
  assert.equal(audio.status, 206);
  assert.equal(audio.headers.get('content-type'), 'audio/mpeg');
  assert.match(audio.headers.get('content-range'), /^bytes 0-99\/\d+$/);
  assert.equal((await audio.arrayBuffer()).byteLength, 100);
});

test('supports video suffix ranges and rejects invalid ranges', async () => {
  const video = `${base}/assets/video/waguri-smile.webm`;
  const suffix = await fetch(video, { headers: { Range: 'bytes=-64' } });
  assert.equal(suffix.status, 206);
  assert.equal(suffix.headers.get('content-type'), 'video/webm');
  assert.equal((await suffix.arrayBuffer()).byteLength, 64);
  for (const range of ['bytes=999999999-', 'bytes=99-4', 'bytes=-0', 'bytes=-', 'garbage']) {
    const result = await fetch(video, { headers: { Range: range } });
    assert.equal(result.status, 416, range);
  }
});

test('does not expose Git metadata, server code, or unrelated files', async () => {
  for (const path of ['/.git/config', '/package.json', '/scripts/server.mjs', '/assets/%2e%2e/package.json', '/assets/missing.png']) {
    const result = await fetch(base + path);
    assert.equal(result.status, 404, path);
  }
});

test('rejects writes to the static site', async () => {
  const result = await fetch(base, { method: 'POST', body: 'test' });
  assert.equal(result.status, 405);
});
