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
    for (const [i, proyecto] of PROYECTOS.entries()) {
      const link = page.locator('.project').nth(i).locator('.see-all');
      if (cuantasEnLaPrevia(proyecto) < proyecto.fotos) {
        await expect(link).toHaveAttribute('href', `/foto/${proyecto.slug}/`);
        await expect(link).toContainText(`Ver las ${proyecto.fotos} fotos`);
      } else {
        await expect(link).toHaveCount(0);
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

test.describe('el mosaico', () => {
  test('las filas llenan el ancho, menos la última', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'se mide en escritorio');
    await page.goto('/foto/oruga/', { waitUntil: 'load' });

    const filas = await page.evaluate(() => {
      const mosaico = document.querySelector('.mosaic') as HTMLElement;
      const placas = [...mosaico.querySelectorAll<HTMLElement>('.card-wrap')];
      const gap = Number.parseFloat(getComputedStyle(mosaico).columnGap) || 0;
      const porFila = new Map<number, number[]>();
      for (const placa of placas) {
        const top = Math.round(placa.offsetTop);
        porFila.set(top, [...(porFila.get(top) ?? []), placa.getBoundingClientRect().width]);
      }
      return {
        ancho: mosaico.getBoundingClientRect().width,
        gap,
        filas: [...porFila.entries()]
          .sort((a, b) => a[0] - b[0])
          .map(([, anchos]) => anchos.reduce((s, w) => s + w, 0) + gap * (anchos.length - 1)),
      };
    });

    expect(filas.filas.length).toBeGreaterThan(1);
    // La última queda en su tamaño natural: es la única que puede no llenar.
    for (const usado of filas.filas.slice(0, -1)) {
      expect(Math.abs(usado - filas.ancho), `fila de ${usado}px en ${filas.ancho}px`)
        .toBeLessThanOrEqual(2);
    }
    expect(filas.filas.at(-1)!).toBeLessThanOrEqual(filas.ancho + 2);
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
