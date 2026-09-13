import { test, expect, type ConsoleMessage, type Request, type Response } from '@playwright/test';

// Lo mínimo que tiene que cumplir toda página del sitio, en los tres tamaños.
const PAGES = [
  { name: 'portada', path: '/', status: 200 },
  { name: 'video', path: '/video/', status: 200 },
  { name: 'foto', path: '/foto/', status: 200 },
  { name: 'proyecto', path: '/foto/anantara/', status: 200 },
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

    // El pie va abajo, también en una página más corta que la pantalla.
    const pie = await page.evaluate(() => {
      const caja = document.querySelector('.site-footer')!.getBoundingClientRect();
      return { fin: Math.round(caja.bottom), pantalla: window.innerHeight };
    });
    expect(
      pie.fin,
      `${p.path}: el pie termina a ${pie.fin}px de ${pie.pantalla}px de pantalla`
    ).toBeGreaterThanOrEqual(pie.pantalla - 1);

    expect(errores, `errores de consola en ${p.path}`).toEqual([]);
    expect(fallidos, `pedidos fallados en ${p.path}`).toEqual([]);
    expect(externos, `pedidos externos en ${p.path}`).toEqual([]);
  });
}

// Destinos táctiles: con el dedo ninguno baja de los 40px de alto. El botón
// de "Volver a todo en Foto" lleva la clase .back, no .volver.
const TOCABLES = '.site-header a, .site-header button, .see-all, .back a, .contact-link';

test('en el teléfono ningún destino táctil queda chico', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone', 'se mide con el dedo');

  for (const ruta of ['/', '/video/', '/foto/', '/foto/anantara/']) {
    await page.goto(ruta, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);

    const chicos = await page.evaluate((sel) => {
      return [...document.querySelectorAll<HTMLElement>(sel)]
        .map((el) => {
          const caja = el.getBoundingClientRect();
          return { alto: Math.round(caja.height), texto: (el.textContent ?? '').trim().slice(0, 24) };
        })
        .filter((x) => x.alto < 40);
    }, TOCABLES);

    expect(chicos, `destinos chicos en ${ruta}`).toEqual([]);
  }
});

test('el header marca la página actual', async ({ page }) => {
  await page.goto('/video/');
  await expect(page.locator('.nav a[aria-current="page"]')).toHaveText('Video');
  await page.goto('/foto/');
  await expect(page.locator('.nav a[aria-current="page"]')).toHaveText('Foto');
});
