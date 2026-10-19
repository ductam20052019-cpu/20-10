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
  test(`${profile}: complete story, music, sharing, and gift dialogs`, { timeout: 180_000 }, async () => {
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
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
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
      assert.equal(await page.locator('#share-copy-manual').getAttribute('href'), base + '/');
      await page.waitForTimeout(1200);
      await screenshot('share');
      await page.locator('#share-fuel-button').click();
      await page.waitForFunction(() => document.querySelector('.tiny-copy-toast')?.textContent.includes('Đã sao chép'));
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), base + '/');
      await page.waitForSelector('#tiny-reality-scene.reality-visible.reality-cute', { state: 'attached', timeout: 15_000 });
      await tapBackground();
      await page.waitForSelector('#tiny-shop-scene.shop-visible', { state: 'attached' });
      await page.waitForTimeout(1800);
      assert.equal(await page.locator('.shop-product').count(), 9);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await screenshot('shop');

      for (const gender of ['girls', 'boys']) {
        const product = page.locator(`.shop-product[data-shop-gender="${gender}"]`).first();
        const title = await product.getAttribute('data-product-title');
        const href = await product.getAttribute('href');
        await product.click();
        await page.waitForSelector('#shop-product-modal.show', { state: 'attached' });
        assert.equal(await page.locator('#shop-modal-title').textContent(), title);
        assert.equal(await page.locator('#shop-modal-buy').getAttribute('href'), href);
        await page.waitForFunction(() => document.querySelector('#shop-modal-thumb img')?.naturalWidth > 0);
        await screenshot(`product-${gender}`);
        if (gender === 'girls') await page.locator('.shop-modal-close').click();
        else await page.keyboard.press('Escape');
        assert.equal(await page.locator('#shop-product-modal').getAttribute('aria-hidden'), 'true');
      }

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
