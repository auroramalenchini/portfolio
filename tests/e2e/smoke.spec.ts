import { test, expect, type ConsoleMessage, type Request, type Response } from '@playwright/test';

// Lo mínimo que tiene que cumplir toda página del sitio, en los tres tamaños.
const PAGES = [
  { name: 'portada', path: '/', status: 200 },
  { name: 'video', path: '/video/', status: 200 },
  { name: 'foto', path: '/foto/', status: 200 },
  { name: '404', path: '/404.html', status: 200 },
];

// Nada de placeholders ni de tipografías traídas de afuera.
const PROHIBIDOS = ['picsum.photos', 'fonts.googleapis.com'];

for (const p of PAGES) {
  test(`${p.name}: carga limpia`, async ({ page }) => {
    const errores: string[] = [];
    const fallidos: string[] = [];
    const externos: string[] = [];

    page.on('console', (msg: ConsoleMessage) => {
      if (msg.type() === 'error') errores.push(msg.text());
    });
    page.on('pageerror', (err) => errores.push(err.message));
    page.on('requestfailed', (req: Request) => {
      fallidos.push(`${req.url()} (${req.failure()?.errorText ?? 'sin motivo'})`);
    });
    page.on('response', (res: Response) => {
      if (res.status() >= 400) fallidos.push(`${res.url()} (${res.status()})`);
    });
    page.on('request', (req: Request) => {
      if (PROHIBIDOS.some((host) => req.url().includes(host))) externos.push(req.url());
    });

    const res = await page.goto(p.path, { waitUntil: 'load' });
    expect(res?.status(), `estado de ${p.path}`).toBe(p.status);

    await expect(page.locator('h1')).toHaveCount(1);

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(
      overflow.scrollWidth,
      `${p.path} se va de ancho: ${overflow.scrollWidth} > ${overflow.innerWidth}`
    ).toBeLessThanOrEqual(overflow.innerWidth);

    expect(errores, `errores de consola en ${p.path}`).toEqual([]);
    expect(fallidos, `pedidos fallados en ${p.path}`).toEqual([]);
    expect(externos, `pedidos externos en ${p.path}`).toEqual([]);
  });
}

test('el header marca la página actual', async ({ page }) => {
  await page.goto('/video/');
  await expect(page.locator('.nav a[aria-current="page"]')).toHaveText('Video');
  await page.goto('/foto/');
  await expect(page.locator('.nav a[aria-current="page"]')).toHaveText('Foto');
});
