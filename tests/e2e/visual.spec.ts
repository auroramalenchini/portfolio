import { expect, test, type Locator, type Page } from '@playwright/test';

// Capturas de referencia contra el sitio construido, una por cada tramo de
// pantalla de las cinco páginas en los tres proyectos. Para regenerarlas
// después de un cambio de diseño intencional:
//
//   PW_PORT=4401 npx playwright test tests/e2e/visual.spec.ts --update-snapshots
//
// No se usa `fullPage`: en Chromium una captura de página entera apaga la
// emulación táctil a mitad de camino (ver QA-fase7.md, nota 4) y el
// `tablet-touch` termina mostrando la variante de mouse. Se captura de a una
// pantalla, scrolleando de a un alto de viewport por vez.
//
// Tampoco se deja `animations` en su valor por omisión: `toHaveScreenshot`
// lo pone en 'disabled' si no se lo pisa, y eso fuerza la apertura de la
// portada en escritorio -atada al scroll con `animation-timeline: view()`,
// no al tiempo- a su estado final (puertas nítidas, velo abierto) sin
// importar la posición real del scroll. Por eso acá va 'allow'. El resto de
// las transiciones (los `.reveal`, 0,9s) ya terminaron de sobra para cuando
// se captura, porque se disparan en el recorrido previo de
// `pasarPorTodoElAlto`.

// Las capturas de referencia se generan en la Mac: macOS y Linux dibujan
// las letras con distinto suavizado, así que en la integración continua
// (Linux) no hay contra qué comparar. Esta prueba corre sólo en local.
test.skip(!!process.env.CI, 'las capturas de referencia son de macOS');

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'video', path: '/video/' },
  { name: 'foto', path: '/foto/' },
  { name: 'proyecto', path: '/foto/oruga/' },
  { name: '404', path: '/404.html' },
];

// Tope de capturas por página. El plan permite hasta 8; se usan menos para
// que las páginas de mosaico (bien largas) no inflen el peso del repo.
const TOPE = 5;

// Lo que cambia solo entre corridas y no tiene que ensuciar el diff: el pase
// de fotos y el recorte de video de las puertas de la portada, y el año del
// pie (© {año}).
function tapados(page: Page): Locator[] {
  return [page.locator('.door'), page.locator('.site-footer')];
}

async function estadoListo(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('networkidle');
}

/** Baja de a una pantalla hasta el fondo -para que disparen los .reveal y
 *  cualquier revelado en scroll- y vuelve arriba: siempre se arranca desde el
 *  mismo estado antes de capturar. */
async function pasarPorTodoElAlto(page: Page) {
  const vh = page.viewportSize()!.height;
  const alto = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < alto; y += vh) {
    await page.evaluate((t) => window.scrollTo({ top: t, behavior: 'instant' }), y);
    await page.waitForTimeout(150);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(150);
}

for (const p of PAGES) {
  test(`visual: ${p.name}`, async ({ page }) => {
    await page.goto(p.path, { waitUntil: 'load' });
    await estadoListo(page);
    await pasarPorTodoElAlto(page);

    const vh = page.viewportSize()!.height;
    const alto = await page.evaluate(() => document.documentElement.scrollHeight);
    const maxScroll = Math.max(0, alto - vh);

    // Top, y después de a un alto de viewport hasta el fondo. Si con un paso
    // por viewport no alcanza el tope, se reparten las posiciones parejas
    // entre el techo y el piso, para no perderse la segunda mitad de las
    // páginas de mosaico.
    const necesarios = maxScroll === 0 ? 1 : Math.ceil(alto / vh);
    const pasos = Math.min(TOPE, necesarios);
    const posiciones: number[] = Array.from({ length: pasos }, (_, i) =>
      pasos === 1 ? 0 : Math.round((maxScroll * i) / (pasos - 1))
    );

    for (let i = 0; i < posiciones.length; i++) {
      await page.evaluate((t) => window.scrollTo({ top: t, behavior: 'instant' }), posiciones[i]);
      await page.waitForTimeout(150);
      await expect(page).toHaveScreenshot(`${p.name}-${i}.png`, {
        animations: 'allow',
        mask: tapados(page),
        maxDiffPixelRatio: 0.002,
      });
    }
  });
}
