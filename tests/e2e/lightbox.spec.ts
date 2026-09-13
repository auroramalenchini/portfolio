import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Único lugar donde se dice contra qué se prueba: el visor se prueba contra
// las páginas reales. El grupo del play de un video tiene una sola pieza, así
// que sirve para el iframe y también para las flechas escondidas.
const OBJETIVO = {
  fotos: '/foto/anantara/',
  grupoMulti: 'anantara',
  video: '/video/',
  grupoVideo: 'video:gusto-a-sal:QOTH0P_PPqc',
};

const VISOR = 'dialog.lightbox';

function tarjetas(page: Page, grupo: string) {
  return page.locator(`[data-lb="${grupo}"]`);
}

/** Ni un pedido real a YouTube: lo que se prueba es el iframe, no el video. */
async function sinYoutube(page: Page) {
  await page.route(/youtube-nocookie\.com/, (ruta) => ruta.abort());
}

async function abrirPrimera(page: Page) {
  await sinYoutube(page);
  await page.goto(OBJETIVO.fotos);
  const card = tarjetas(page, OBJETIVO.grupoMulti).first();
  await card.click();
  await expect(page.locator(VISOR)).toBeVisible();
  return card;
}

const contador = (page: Page) => page.locator(`${VISOR} .caption-count`);

/** Cuántas piezas tiene el grupo, contadas en la página y no a mano. */
const cuantas = (page: Page) => tarjetas(page, OBJETIVO.grupoMulti).count();

/** El visor entra con un fundido: hasta que termina, todo se ve más claro. */
async function quieto(page: Page) {
  await page
    .locator(VISOR)
    .evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)));
}

test('abre la primera tarjeta con foco, imagen y pie', async ({ page }) => {
  await sinYoutube(page);
  await page.goto(OBJETIVO.fotos);

  const total = await cuantas(page);
  expect(total, 'el grupo tiene que tener más de una pieza').toBeGreaterThan(1);

  const card = tarjetas(page, OBJETIVO.grupoMulti).first();
  const src = await card.getAttribute('data-lb-src');
  const title = await card.getAttribute('data-lb-title');
  await card.click();

  const visor = page.locator(VISOR);
  expect(await visor.evaluate((d) => (d as HTMLDialogElement).open)).toBe(true);

  const foco = await page.evaluate(
    (sel) => document.querySelector(sel)!.contains(document.activeElement),
    VISOR
  );
  expect(foco, 'el foco tiene que quedar adentro del visor').toBe(true);

  const img = page.locator(`${VISOR} .stage img`);
  await expect(img).toHaveCount(1);
  expect(await img.getAttribute('src')).toBe(src);

  await expect(page.locator(`${VISOR} .caption strong`)).toHaveText(title!);
  await expect(contador(page)).toHaveText(`1 / ${total}`);
});

test('las flechas del teclado se detienen en el borde del grupo', async ({ page }) => {
  const card = await abrirPrimera(page);
  const visor = page.locator(VISOR);
  const total = await cuantas(page);

  // Hasta la última pieza, una por una.
  for (let i = 2; i <= total; i++) {
    await page.keyboard.press('ArrowRight');
    await expect(contador(page)).toHaveText(`${i} / ${total}`);
  }

  // Al final del grupo cierra: no da la vuelta ni salta al proyecto siguiente.
  await page.keyboard.press('ArrowRight');
  await expect(visor).toBeHidden();

  // Y al principio, igual.
  await card.click();
  await expect(contador(page)).toHaveText(`1 / ${total}`);
  await page.keyboard.press('ArrowLeft');
  await expect(visor).toBeHidden();
});

test('Escape cierra y el foco vuelve a la tarjeta', async ({ page }) => {
  const card = await abrirPrimera(page);
  await page.keyboard.press('Escape');
  await expect(page.locator(VISOR)).toBeHidden();
  expect(await card.evaluate((el) => el === document.activeElement)).toBe(true);
});

test('el clic en el fondo cierra, el clic en la foto no', async ({ page }) => {
  await abrirPrimera(page);
  const visor = page.locator(VISOR);

  await page.locator(`${VISOR} .stage img`).click();
  await expect(visor).toBeVisible();

  // Arriba a la izquierda no hay ningún botón: ahí el blanco es el visor.
  await visor.click({ position: { x: 20, y: 20 } });
  await expect(visor).toBeHidden();
});

test('el botón de cerrar cierra', async ({ page }) => {
  await abrirPrimera(page);
  await page.locator(`${VISOR} .lb-close`).click();
  await expect(page.locator(VISOR)).toBeHidden();
});

test('un grupo de una sola pieza no muestra flechas', async ({ page }) => {
  await sinYoutube(page);
  await page.goto(OBJETIVO.video);
  // El play de un proyecto es su propio grupo, de una sola pieza.
  await expect(tarjetas(page, OBJETIVO.grupoVideo)).toHaveCount(1);
  await tarjetas(page, OBJETIVO.grupoVideo).first().click();

  await expect(page.locator(VISOR)).toBeVisible();
  await expect(page.locator(`${VISOR} .lb-prev`)).toBeHidden();
  await expect(page.locator(`${VISOR} .lb-next`)).toBeHidden();
  await expect(contador(page)).toHaveText('1 / 1');
});

test('el video entra en un iframe sin cookies y se corta al cerrar', async ({ page }) => {
  await sinYoutube(page);
  await page.goto(OBJETIVO.video);
  await tarjetas(page, OBJETIVO.grupoVideo).first().click();

  const iframe = page.locator(`${VISOR} .stage iframe`);
  await expect(iframe).toHaveCount(1);
  const src = (await iframe.getAttribute('src'))!;
  expect(src).toContain('youtube-nocookie.com');
  expect(src).toContain('autoplay=1');

  await page.locator(`${VISOR} .lb-close`).click();
  await expect(page.locator(VISOR)).toBeHidden();
  await expect(page.locator(`${VISOR} .stage iframe`)).toHaveCount(0);
});

test('el header no se transparenta a través del visor', async ({ page }) => {
  await abrirPrimera(page);
  await expect(page.locator('.site-header')).toBeHidden();
  await page.locator(`${VISOR} .lb-close`).click();
  await expect(page.locator(VISOR)).toBeHidden();
  await expect(page.locator('.site-header')).toBeVisible();
});

// Los hosts que arrastra el reproductor de YouTube y nada más. Sin abrir un
// video el sitio no pide nada a nadie: eso lo cuida smoke.spec.ts. Al abrirlo
// entra el iframe, y con él sus propias dependencias: las siete que listó el
// QA de la fase 7 —googlevideo, ytimg, ggpht, google, gstatic, googleapis y
// fonts.gstatic— más el dominio del propio embed.
const HOSTS_DEL_REPRODUCTOR =
  /(^|\.)(youtube-nocookie\.com|youtube\.com|ytimg\.com|ggpht\.com|googlevideo\.com|googleapis\.com|gstatic\.com|google\.com|doubleclick\.net)$/;

test('al abrir un video no entra ningún host ajeno al reproductor', async ({ page }) => {
  const ajenos: string[] = [];
  page.on('request', (req) => {
    if (!/^https?:/.test(req.url())) return;
    const host = new URL(req.url()).hostname;
    if (host === 'localhost' || host === '127.0.0.1') return;
    if (!HOSTS_DEL_REPRODUCTOR.test(host)) ajenos.push(host);
  });

  await page.goto(OBJETIVO.video, { waitUntil: 'load' });
  await tarjetas(page, OBJETIVO.grupoVideo).first().click();
  await expect(page.locator(`${VISOR} .stage iframe`)).toHaveCount(1);
  // El reproductor sigue pidiendo cosas después de aparecer.
  await page.waitForTimeout(4000);

  expect([...new Set(ajenos)].sort()).toEqual([]);
});

test('el cuerpo no scrollea mientras el visor está abierto', async ({ page }) => {
  await abrirPrimera(page);
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden');


  await page.locator(`${VISOR} .lb-close`).click();
  await expect(page.locator(VISOR)).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.body).overflow))
    .toBe('visible');
});

test('el visor abierto no tiene problemas graves de accesibilidad', async ({ page }) => {
  await abrirPrimera(page);
  await quieto(page);
  const { violations } = await new AxeBuilder({ page }).analyze();
  const graves = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(graves.map((v) => `${v.impact}: ${v.id}`)).toEqual([]);
});

test.describe('deslizar con el dedo', () => {
  test.skip(({ hasTouch }) => !hasTouch, 'sólo tiene sentido con pantalla táctil');

  // Los eventos se fabrican a mano porque page.touchscreen sólo sabe tocar, y
  // WebKit no expone el constructor de Touch. El handler lee clientX/clientY
  // de touches y changedTouches, así que con eso alcanza.
  async function deslizar(page: Page, dx: number, clickFinal: 'fondo' | 'foto') {
    await page.evaluate(
      ([dx, clickFinal]) => {
        const visor = document.querySelector('dialog.lightbox') as HTMLElement;
        const media = visor.querySelector('.stage img, .stage .frame') as HTMLElement;
        const caja = media.getBoundingClientRect();
        const x = caja.left + caja.width / 2;
        const y = caja.top + caja.height / 2;

        const toque = (tipo: string, cx: number) => {
          const ev = new Event(tipo, { bubbles: true, cancelable: true });
          const t = { identifier: 0, target: visor, clientX: cx, clientY: y };
          Object.defineProperty(ev, 'touches', { value: tipo === 'touchend' ? [] : [t] });
          Object.defineProperty(ev, 'changedTouches', { value: [t] });
          visor.dispatchEvent(ev);
        };

        toque('touchstart', x);
        toque('touchmove', x + (dx as number) / 2);
        toque('touchmove', x + (dx as number));
        toque('touchend', x + (dx as number));

        // El navegador tira un click después del touchend. Si cae en el fondo
        // cerraría el visor, y el deslizamiento tiene que descartarlo.
        const blanco = clickFinal === 'fondo' ? visor : media;
        blanco.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      },
      [dx, clickFinal] as [number, string]
    );
  }

  test('80px pasan a la siguiente sin cerrar', async ({ page }) => {
    await abrirPrimera(page);
    await deslizar(page, -80, 'fondo');
    await expect(contador(page)).toHaveText(`2 / ${await cuantas(page)}`);
    await expect(page.locator(VISOR)).toBeVisible();
  });

  test('20px no pasan ni cierran', async ({ page }) => {
    await abrirPrimera(page);
    await deslizar(page, -20, 'foto');
    await expect(page.locator(VISOR)).toBeVisible();
    await expect(contador(page)).toHaveText(`1 / ${await cuantas(page)}`);
  });
});
