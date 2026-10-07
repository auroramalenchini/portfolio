import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect, type Page, type Response } from '@playwright/test';

// Los datos de las pruebas salen de las carpetas de contenido, igual que la
// página: si el proyecto cambia, la prueba lo sigue sin tocarla.
const CONTENIDO = new URL('../../src/content/foto', import.meta.url).pathname;
const PREVIEW_MAX = 6;

interface Proyecto {
  slug: string;
  order: number;
  title: string;
  fotos: number;
  preview?: number[];
  mobileLimit?: number;
}

function proyectos(): Proyecto[] {
  return readdirSync(CONTENIDO, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => {
      const dir = join(CONTENIDO, e.name);
      const md = readFileSync(join(dir, 'index.md'), 'utf8');
      const dato = (clave: string) => new RegExp(`^${clave}:\\s*(.+)$`, 'm').exec(md)?.[1]?.trim();
      const preview = dato('preview');
      return {
        slug: e.name,
        order: Number(dato('order')),
        title: (dato('title') ?? '').replace(/^"|"$/g, ''),
        fotos: readdirSync(dir).filter((f) => f.endsWith('.jpg')).length,
        preview: preview
          ? preview.replace(/[[\]]/g, '').split(',').map((n) => Number(n.trim()))
          : undefined,
        mobileLimit: dato('mobileLimit') ? Number(dato('mobileLimit')) : undefined,
      };
    })
    .sort((a, b) => a.order - b.order);
}

const PROYECTOS = proyectos();

/** Cuántas placas tiene que mostrar la vista de conjunto de un proyecto. */
function cuantasEnLaPrevia(p: Proyecto): number {
  return p.preview ? p.preview.length : Math.min(p.fotos, PREVIEW_MAX);
}

/** Anota los pedidos que fallan, para revisarlos al final de la prueba. */
function vigilarPedidos(page: Page): string[] {
  const fallidos: string[] = [];
  page.on('response', (res: Response) => {
    if (res.status() >= 400) fallidos.push(`${res.url()} (${res.status()})`);
  });
  return fallidos;
}

async function revisarImagenes(page: Page) {
  const imgs = await page.locator('.mosaic img').all();
  expect(imgs.length).toBeGreaterThan(0);
  for (const img of imgs) {
    for (const atributo of ['width', 'height', 'srcset', 'sizes']) {
      expect(await img.getAttribute(atributo), `a la imagen le falta ${atributo}`).toBeTruthy();
    }
  }
}

test.describe('/foto/', () => {
  test('un bloque por proyecto, en orden', async ({ page }) => {
    await page.goto('/foto/');
    const titulos = await page.locator('.project .project-info h3').allInnerTexts();
    expect(titulos).toHaveLength(PROYECTOS.length);
    // Los títulos van en versalitas hechas a mano: se comparan sin distinguir
    // mayúsculas de minúsculas.
    expect(titulos.map((t) => t.toLowerCase())).toEqual(
      PROYECTOS.map((p) => p.title.toLowerCase())
    );
  });

  test('cada vista de conjunto muestra las placas elegidas', async ({ page }) => {
    await page.goto('/foto/');
    for (const [i, proyecto] of PROYECTOS.entries()) {
      const bloque = page.locator('.project').nth(i);
      await expect(
        bloque.locator('.card'),
        `${proyecto.slug} en la vista de conjunto`
      ).toHaveCount(cuantasEnLaPrevia(proyecto));
    }
  });

  test('el link a todas las fotos aparece sólo si falta alguna', async ({ page }) => {
    await page.goto('/foto/');
    // De 800px para abajo, el tope del teléfono también esconde fotos.
    const angosto = page.viewportSize()!.width <= 800;
    for (const [i, proyecto] of PROYECTOS.entries()) {
      const link = page.locator('.project').nth(i).locator('.see-all');
      const enLaPrevia = cuantasEnLaPrevia(proyecto);
      const aLaVista = angosto && proyecto.mobileLimit ? Math.min(proyecto.mobileLimit, enLaPrevia) : enLaPrevia;
      if (aLaVista < proyecto.fotos) {
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute('href', `/foto/${proyecto.slug}/`);
        await expect(link).toContainText(`Ver las ${proyecto.fotos} fotos`);
      } else {
        await expect(link).toBeHidden();
      }
    }
  });

  test('las imágenes vienen medidas y con srcset, y ninguna falta', async ({ page }) => {
    const fallidos = vigilarPedidos(page);
    await page.goto('/foto/', { waitUntil: 'load' });
    await revisarImagenes(page);
    expect(fallidos).toEqual([]);
  });
});

test.describe('/foto/<slug>/', () => {
  for (const proyecto of PROYECTOS) {
    test(`${proyecto.slug}: una placa por archivo`, async ({ page }) => {
      const fallidos = vigilarPedidos(page);
      await page.goto(`/foto/${proyecto.slug}/`, { waitUntil: 'load' });
      await expect(page.locator('.mosaic .card')).toHaveCount(proyecto.fotos);
      await expect(page.locator('.sub')).toContainText(`${proyecto.fotos} fotos`);
      await expect(page.locator('.back a')).toHaveAttribute('href', '/foto/');
      await revisarImagenes(page);
      expect(fallidos).toEqual([]);
    });
  }
});

// El mosaico se mide igual en las tres páginas que lo usan y en los tres
// proyectos. Es la prueba que faltaba: la vieja sólo medía el ancho de la fila
// en escritorio, y una fila de una sola foto estirada al ancho entero —el
// defecto— también llena el ancho, así que pasaba con el mosaico roto.
const CON_MOSAICO = ['/video/', '/foto/', `/foto/${PROYECTOS[0].slug}/`];

/** Una placa apaisada: la forma que dejaba de entrar de a dos. */
const APAISADA = 1.3;

interface Fila {
  n: number;
  /** Ancho usado por la fila, separaciones incluidas. */
  ancho: number;
  ars: number[];
  /** La placa más ancha de la fila. */
  mayor: number;
  /** El alto de cada placa. */
  altos: number[];
}

/** Un mosaico por proyecto: las filas de cada uno, agrupadas por offsetTop. */
async function medirMosaicos(page: Page): Promise<{ col: number; filas: Fila[] }[]> {
  return page.evaluate(() => {
    const salida: { col: number; filas: Fila[] }[] = [];
    for (const mosaico of document.querySelectorAll<HTMLElement>('.mosaic')) {
      const gap = Number.parseFloat(getComputedStyle(mosaico).columnGap) || 0;
      const porFila = new Map<number, { w: number; h: number; ar: number }[]>();
      for (const placa of mosaico.querySelectorAll<HTMLElement>('.card-wrap')) {
        // El tope de pantalla angosta esconde placas: no son fila.
        if (getComputedStyle(placa).display === 'none') continue;
        const top = Math.round(placa.offsetTop);
        porFila.set(top, [
          ...(porFila.get(top) ?? []),
          {
            w: placa.getBoundingClientRect().width,
            h: placa.getBoundingClientRect().height,
            ar: Number(getComputedStyle(placa).getPropertyValue('--ar')),
          },
        ]);
      }
      salida.push({
        col: mosaico.getBoundingClientRect().width,
        filas: [...porFila.entries()]
          .sort((a, b) => a[0] - b[0])
          .map(([, placas]) => ({
            n: placas.length,
            ancho: placas.reduce((s, p) => s + p.w, 0) + gap * (placas.length - 1),
            ars: placas.map((p) => p.ar),
            mayor: Math.max(...placas.map((p) => p.w)),
            altos: placas.map((p) => p.h),
          })),
      });
    }
    return salida;
  });
}

/** Revisa las tres reglas del mosaico a un ancho dado. */
async function revisarMosaico(page: Page, ruta: string, ancho: number) {
  const mosaicos = await medirMosaicos(page);
  expect(mosaicos.length, `${ruta} a ${ancho}px no tiene mosaicos`).toBeGreaterThan(0);

  for (const [i, { col, filas }] of mosaicos.entries()) {
    const donde = `${ruta} a ${ancho}px, mosaico ${i} (columna de ${Math.round(col)}px)`;
    expect(filas.length, `${donde}: sin filas`).toBeGreaterThan(0);

    for (const [k, fila] of filas.entries()) {
      const ultima = k === filas.length - 1;
      const cual = `${donde}, fila ${k} de ${fila.n} placa(s)`;

      // Todas llenan el ancho, la última también: ninguna foto queda suelta.
      expect(Math.abs(fila.ancho - col), `${cual}: usa ${Math.round(fila.ancho)}px`)
        .toBeLessThanOrEqual(2);

      // Y dentro de la fila todas las fotos miden lo mismo de alto.
      expect(
        Math.max(...fila.altos) - Math.min(...fila.altos),
        `${cual}: altos ${fila.altos.map(Math.round).join('/')}`
      ).toBeLessThanOrEqual(2);

      // En /video/, de 1024 para arriba, los fotogramas apaisados van de a dos
      // o más: uno solo estirado al ancho entero es justo el defecto. En las
      // páginas de foto no se pide, al contrario: ahí la apaisada va sola a
      // propósito, como en el sitio viejo (lo cuida la prueba de más abajo).
      if (ruta === '/video/' && ancho >= 1024 && !ultima) {
        if (fila.ars.every((ar) => ar >= APAISADA)) {
          expect(fila.n, `${cual}: apaisada sola, ars=${fila.ars.join(' ')}`)
            .toBeGreaterThanOrEqual(2);
        }
      }

      // En el teléfono ninguna placa se pasa de la columna.
      if (ancho <= 390) {
        expect(Math.round(fila.mayor), `${cual}: placa de ${Math.round(fila.mayor)}px`)
          .toBeLessThanOrEqual(Math.round(col));
      }
    }
  }
}

test.describe('el mosaico', () => {
  test('las filas llenan el ancho y empacan las apaisadas de a dos', async ({ page }, info) => {
    // En escritorio se recorren además los dos anchos de notebook que caían
    // del lado roto: 1280 y 1340.
    const anchos =
      info.project.name === 'desktop' ? [1440, 1340, 1280] : [page.viewportSize()!.width];

    for (const ancho of anchos) {
      if (ancho !== page.viewportSize()!.width) {
        await page.setViewportSize({ width: ancho, height: 900 });
      }
      for (const ruta of CON_MOSAICO) {
        await page.goto(ruta, { waitUntil: 'load' });
        await revisarMosaico(page, ruta, ancho);
      }
    }
  });

  test('en /foto/ la apaisada de la vista de conjunto va sola y grande', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'se mide a 1440');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/foto/', { waitUntil: 'load' });

    // El motor viejo daba 527px a la primera foto de Oruga en la columna de
    // 948: una sola apaisada por fila, no dos chicas.
    const alto = await page
      .locator('.project')
      .first()
      .locator('.card-wrap')
      .first()
      .evaluate((el) => el.getBoundingClientRect().height);
    expect(Math.round(alto), `la primera placa de la previa mide ${Math.round(alto)}px`)
      .toBeGreaterThanOrEqual(480);
  });

  test('/video/ a 1024 no se estira a lo largo', async ({ page }, info) => {
    test.skip(info.project.name !== 'tablet-touch', 'el proyecto que mide 1024 de ancho');
    await page.goto('/video/', { waitUntil: 'load' });
    // El baseline mide 7965px; con el mosaico roto eran 22000.
    const alto = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(alto, `/video/ a 1024 mide ${alto}px`).toBeLessThan(10_000);
  });

  test('no se va de ancho en el teléfono', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'phone', 'se mide en el teléfono');
    for (const ruta of ['/foto/', `/foto/${PROYECTOS[0].slug}/`]) {
      await page.goto(ruta, { waitUntil: 'load' });
      const medidas = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        ancho: window.innerWidth,
      }));
      expect(medidas.scroll, `${ruta}: ${medidas.scroll} > ${medidas.ancho}`)
        .toBeLessThanOrEqual(medidas.ancho);
    }
  });
});
