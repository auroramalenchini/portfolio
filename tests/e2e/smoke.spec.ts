import AxeBuilder from '@axe-core/playwright';
import { test, expect, type ConsoleMessage, type Request, type Response } from '@playwright/test';

// Lo mínimo que tiene que cumplir toda página del sitio, en los tres tamaños.
const PAGES = [
  { name: 'portada', path: '/', status: 200 },
  { name: 'video', path: '/video/', status: 200 },
  { name: 'foto', path: '/foto/', status: 200 },
  { name: 'proyecto', path: '/foto/oruga/', status: 200 },
  { name: '404', path: '/404.html', status: 200 },
];

// Sin abrir un video, el sitio no pide nada a nadie: ni placeholders, ni
// tipografías de Google, ni analítica, ni nada. Se mira el host y no una lista
// de prohibidos, así la prueba no se queda vieja cuando aparece un tercero
// nuevo. Los pedidos data: y blob: no salen a la red y no cuentan.
const PROPIOS = ['localhost', '127.0.0.1', '[::1]'];

function esDeAfuera(url: string): boolean {
  if (!/^https?:/.test(url)) return false;
  return !PROPIOS.includes(new URL(url).hostname);
}

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
      if (esDeAfuera(req.url())) externos.push(req.url());
    });

    const res = await page.goto(p.path, { waitUntil: 'load' });
    expect(res?.status(), `estado de ${p.path}`).toBe(p.status);

    // Hasta el fondo: así entran también los pedidos que salen al scrollear
    // (las placas diferidas y el pase de fotos de la puerta).
    await page.evaluate(() => window.scrollTo({ top: 99_999, behavior: 'instant' }));
    await page.waitForTimeout(400);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));

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

// axe en las cinco páginas y en los tres anchos, no sólo en la portada a
// 1440: el contraste y los nombres accesibles cambian con el ancho.
for (const p of PAGES) {
  test(`${p.name}: accesibilidad, nada grave ni crítico`, async ({ page }) => {
    await page.goto(p.path, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const { violations } = await new AxeBuilder({ page }).analyze();
    const graves = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(
      graves.map((v) => `${v.impact} ${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
      `axe en ${p.path}`
    ).toEqual([]);
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
