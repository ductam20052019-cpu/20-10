import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { chromium, devices } from 'playwright';
import { createSiteServer } from '../scripts/server.mjs';

let server;
let browser;
let base;
before(async () => {
  await mkdir(new URL('../test-results/', import.meta.url), { recursive: true });
  server = createSiteServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox'],
  });
});
after(async () => {
  await browser?.close();
  if (server) await new Promise(resolve => server.close(resolve));
});

for (const mobile of [false, true]) {
  const profile = mobile ? 'mobile' : 'desktop';
  test(`${profile}: complete story, music, gift flight, and personal letter`, { timeout: 180_000 }, async () => {
    const context = await browser.newContext(mobile
      ? devices['iPhone 13']
      : { viewport: { width: 1440, height: 900 } });
    const errors = [];
    const failedRequests = [];
    const externalRequests = [];
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('requestfailed', request => failedRequests.push(request.url()));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    // No remote page, font, or media request is required by the copy.
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (['http:', 'https:'].includes(url.protocol) && url.origin !== base) {
        externalRequests.push(url.href);
        return route.abort();
      }
      return route.continue();
    });
    const tapBackground = () => mobile ? page.touchscreen.tap(12, 12) : page.mouse.click(12, 12);
    const screenshot = name => page.screenshot({ path: new URL(`../test-results/${profile}-${name}.png`, import.meta.url).pathname });

    try {
      await page.goto(base, { waitUntil: 'load' });
      await page.waitForFunction(() => document.fonts.check('16px "Courier Prime"'));
      assert.equal(await page.title(), 'Sự thức giấc của Tiny - Ngày 20/10');
      assert.equal(await page.locator('#text-1.hien-thi').textContent(), 'này cậu gì ơi');
      await screenshot('intro');

      for (let next = 1; next <= 13; next++) {
        await page.waitForFunction(() => canClick, undefined, { timeout: 15_000 });
        await tapBackground();
        await page.waitForFunction(expected => clickCount === expected, next, { timeout: 15_000 });
        if (next === 2) {
          // A rapid click cannot skip the original 9.7-second music intro.
          await tapBackground();
          assert.equal(await page.evaluate(() => clickCount), 2);
          await page.waitForFunction(() => musicGateClosed, undefined, { timeout: 15_000 });
          assert.ok(await page.locator('#tiny-soundtrack').evaluate(audio => audio.currentTime >= 9.65));
        }
        if (next < 13) {
          await page.waitForSelector(`#text-${next + 1}.hien-thi`, { state: 'attached', timeout: 15_000 });
        }
        if (next === 3) {
          await page.waitForFunction(() => {
            const audio = document.getElementById('tiny-soundtrack');
            return !audio.paused && audio.currentTime > 9.7 && audio.volume > 0.5;
          }, undefined, { timeout: 5000 });
        }
        if ([4, 7, 8, 11, 12].includes(next)) {
          await page.waitForTimeout(1100);
          await screenshot(`scene-${next}`);
        }
        if (next === 8) {
          await page.waitForFunction(() => {
            const video = document.getElementById('waguri-smile-video');
            return video.readyState >= 2 && !video.paused && video.currentTime > 0;
          }, undefined, { timeout: 15_000 });
        }
      }

      await page.waitForSelector('#share-flight-scene.share-visible', { state: 'attached' });
      assert.equal(await page.locator('#gift-invitation-title').innerText(), 'Có một món quà nhỏ\nđang trên đường đến với cậu.\nCậu nhận giúp tớ nhé?');
      assert.equal(await page.locator('#share-fuel-meter').textContent(), '80%');
      await page.waitForTimeout(1200);
      await screenshot('gift-invitation');
      await page.evaluate(() => {
        window.giftChargeSamples = [80];
        const meter = document.getElementById('share-fuel-meter');
        new MutationObserver(() => window.giftChargeSamples.push(Number(meter.getAttribute('aria-valuenow'))))
          .observe(meter, { attributes: true, attributeFilter: ['aria-valuenow'] });
      });
      await page.getByRole('button', { name: 'Nhận quà 💌', exact: true }).click();
      assert.equal(await page.locator('#share-flight-status').textContent(), 'Đang nạp thêm một chút can đảm…');
      assert.ok(await page.locator('#share-fuel-button').isDisabled());
      // Extra background taps must not skip charging or open the old shop scene.
      await tapBackground();
      await page.waitForFunction(() => Number(document.getElementById('share-fuel-meter').getAttribute('aria-valuenow')) > 80);
      await screenshot('gift-charging');
      await page.waitForFunction(() => document.getElementById('share-fuel-meter').textContent === '100%');
      const samples = await page.evaluate(() => window.giftChargeSamples);
      assert.equal(samples.at(-1), 100);
      assert.ok(samples.length > 2);
      assert.ok(samples.every((value, i) => value >= 80 && value <= 100 && (!i || value >= samples[i - 1])));
      await page.waitForSelector('#share-aircraft-stand.share-takeoff', { state: 'attached' });
      assert.equal(await page.locator('.gift-flight-banner').textContent(), 'Điểm đến: chỗ cậu ✈️');
      await screenshot('gift-takeoff');

      await page.waitForSelector('#gift-letter-scene[data-stage="envelope"]', { state: 'visible', timeout: 10_000 });
      await page.waitForFunction(() => getComputedStyle(document.getElementById('gift-letter-scene')).opacity === '1');
      assert.equal(await page.locator('.gift-envelope-message').innerText(), 'Tớ không giỏi nói mấy lời dễ thương,\nnên thử làm một điều dễ thương vậy.');
      assert.equal(await page.locator('#gift-open-letter').evaluate(button => button === document.activeElement), true);
      await screenshot('gift-envelope');
      await page.getByRole('button', { name: 'Mở thư', exact: true }).click();
      await page.waitForSelector('#gift-letter-content', { state: 'visible' });
      await page.waitForFunction(() => getComputedStyle(document.getElementById('gift-letter-content')).opacity === '1');
      assert.equal(await page.locator('.gift-letter-body').textContent(), 'Chẳng cần dịp gì đặc biệt cả. Tớ chỉ muốn làm một điều nho nhỏ dành riêng cho cậu. Mong là khi mở món quà này, cậu sẽ vui thêm một chút. Và nếu hôm nay hơi mệt, cứ ở đây chơi một lát nhé.');
      assert.equal(await page.locator('.gift-ending').innerText(), 'Giữa bao nhiêu người,\nmón quà này chỉ có một người nhận.\nLà cậu đó.');
      await screenshot('gift-letter');
      await page.getByRole('button', { name: 'Cất vào túi ♡', exact: true }).click();
      assert.equal(await page.locator('#gift-delivered-message').textContent(), 'Đã giao tận tay người tớ muốn tặng.');
      await tapBackground();
      assert.equal(await page.locator('#gift-letter-scene').getAttribute('data-stage'), 'delivered');
      await page.waitForFunction(() => getComputedStyle(document.getElementById('gift-delivered-view')).opacity === '1');
      assert.equal(await page.locator('#tiny-shop-scene').getAttribute('aria-hidden'), 'true');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await screenshot('gift-delivered');

      assert.deepEqual(externalRequests, [], 'copy must work without remote assets');
      assert.deepEqual(failedRequests, [], 'all requested files must load');
      assert.deepEqual(errors, [], 'no browser errors');
    } catch (error) {
      await screenshot('failure');
      console.error(`${profile}: ${error.message}`);
      throw error;
    } finally {
      await context.close();
    }
  });
}

test('reduced motion: letter delivery works with a keyboard on a short screen', { timeout: 20_000 }, async () => {
  const context = await browser.newContext({ viewport: { width: 320, height: 568 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(base);
    // Isolate the finale here; the desktop/mobile cases above cover the full story.
    await page.evaluate(() => startShareFlightScene());
    await page.getByRole('button', { name: 'Nhận quà 💌', exact: true }).focus();
    await page.keyboard.press('Enter');
    await page.waitForSelector('#gift-letter-scene[data-stage="envelope"]', { state: 'visible' });
    assert.equal(await page.locator('#share-fuel-meter').textContent(), '100%');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'gift-open-letter');
    await page.keyboard.press('Enter');
    await page.waitForSelector('#gift-letter-content', { state: 'visible' });
    assert.ok(await page.locator('#gift-letter-scene').evaluate(scene => scene.scrollHeight > scene.clientHeight));
    await page.screenshot({ path: new URL('../test-results/compact-gift-letter.png', import.meta.url).pathname });
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'gift-pocket-button');
    const button = await page.locator('#gift-pocket-button').boundingBox();
    assert.ok(button.y >= 0 && button.y + button.height <= 568, 'the pocket button scrolls into view');
    await page.keyboard.press('Enter');
    await page.waitForSelector('#gift-delivered-view', { state: 'visible' });
    assert.equal(await page.locator('#gift-delivered-message').textContent(), 'Đã giao tận tay người tớ muốn tặng.');
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
});
