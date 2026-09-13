import { test } from '@playwright/test';

// Fase 0 del plan: referencia visual del sitio v1 en vivo. No corre con
// `npm test`; se ejecuta a mano con `npm run baseline`.
const SITE = 'https://aurora.malenchini.ar';

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'video', path: '/video.html' },
  { name: 'photo', path: '/photo.html' },
  { name: 'proyecto', path: '/proyecto.html?p=oruga' },
];

// Baja despacio hasta el final para que se disparen las animaciones de
// aparición, y después vuelve arriba antes de la captura.
async function recorrer(page: import('@playwright/test').Page) {
  const alto = await page.evaluate(() => document.documentElement.scrollHeight);
  const paso = Math.max(200, Math.round((page.viewportSize()?.height ?? 800) * 0.6));
  for (let y = 0; y < alto; y += paso) {
    await page.evaluate((to) => window.scrollTo(0, to), y);
    await page.waitForTimeout(320);
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1200);
}

for (const p of PAGES) {
  test(`baseline ${p.name}`, async ({ page }, testInfo) => {
    await page.goto(SITE + p.path, { waitUntil: 'load' });
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1500);
    await recorrer(page);
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.screenshot({
      path: `tests/baseline/${p.name}-${testInfo.project.name}.png`,
      fullPage: true,
    });
  });
}
