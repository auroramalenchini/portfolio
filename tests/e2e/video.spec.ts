import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect, type Page, type Response } from '@playwright/test';

const CONTENIDO = new URL('../../src/content/video', import.meta.url).pathname;

interface Proyecto {
  slug: string;
  order: number;
  title: string;
  stills: number;
  youtube?: string;
  pieces: string[];
  mobileLimit?: number;
}

function proyectos(): Proyecto[] {
  return readdirSync(CONTENIDO, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => {
      const dir = join(CONTENIDO, e.name);
      const md = readFileSync(join(dir, 'index.md'), 'utf8');
      const dato = (clave: string) => new RegExp(`^${clave}:\\s*(.+)$`, 'm').exec(md)?.[1]?.trim();
      const limpio = (v?: string) => v?.replace(/^"|"$/g, '');
      // Los id de las piezas van indentados, en la lista `pieces`.
      const piezas = [...md.matchAll(/^\s+-?\s*youtube:\s*"?([\w-]{11})"?/gm)].map((m) => m[1]);
      return {
        slug: e.name,
        order: Number(dato('order')),
        title: limpio(dato('title')) ?? '',
        stills: readdirSync(dir).filter((f) => f.endsWith('.jpg')).length,
        youtube: limpio(dato('youtube')),
        pieces: piezas,
        mobileLimit: dato('mobileLimit') ? Number(dato('mobileLimit')) : undefined,
      };
    })
    .sort((a, b) => a.order - b.order);
}

const PROYECTOS = proyectos();

function vigilarPedidos(page: Page): string[] {
  const fallidos: string[] = [];
  page.on('response', (res: Response) => {
    if (res.status() >= 400) fallidos.push(`${res.url()} (${res.status()})`);
  });
  return fallidos;
}

test.describe('/video/', () => {
  test('un bloque por proyecto, en orden', async ({ page }) => {
    await page.goto('/video/');
    const titulos = await page.locator('.project .project-info h3').allInnerTexts();
    expect(titulos).toHaveLength(PROYECTOS.length);
    expect(titulos.map((t) => t.toLowerCase())).toEqual(
      PROYECTOS.map((p) => p.title.toLowerCase())
    );
  });

  test('los fotogramas de cada proyecto son placas', async ({ page }) => {
    const fallidos = vigilarPedidos(page);
    await page.goto('/video/', { waitUntil: 'load' });
    for (const [i, proyecto] of PROYECTOS.entries()) {
      await expect(
        page.locator('.project').nth(i).locator('.card'),
        `fotogramas de ${proyecto.slug}`
      ).toHaveCount(proyecto.stills);
    }
    const imgs = await page.locator('.mosaic img').all();
    for (const img of imgs) {
      for (const atributo of ['width', 'height', 'srcset', 'sizes']) {
        expect(await img.getAttribute(atributo), `falta ${atributo}`).toBeTruthy();
      }
    }
    expect(fallidos).toEqual([]);
  });

  test('cada proyecto tiene un play con nombre y su video', async ({ page }) => {
    await page.goto('/video/');
    await expect(page.locator('.play')).toHaveCount(PROYECTOS.length);
    for (const [i, proyecto] of PROYECTOS.entries()) {
      const play = page.locator('.project').nth(i).locator('.play');
      await expect(play).toHaveAccessibleName(`Ver el video: ${proyecto.title}`);
      // Sin video propio, el play abre la primera pieza.
      const esperado = proyecto.youtube ?? proyecto.pieces[0];
      await expect(play).toHaveAttribute('data-lb-youtube', esperado);
      await expect(play).toHaveAttribute('data-lb', `video:${proyecto.slug}:${esperado}`);
    }
  });

  test('el play es hermano de la placa, no está adentro', async ({ page }) => {
    await page.goto('/video/');
    const anidados = await page.evaluate(() =>
      [...document.querySelectorAll('.play')].filter(
        (play) => play.parentElement?.closest('button') !== null
      ).length
    );
    expect(anidados, 'un botón adentro de otro botón').toBe(0);
  });

  test('los links de YouTube apuntan a youtu.be y se abren aparte', async ({ page }) => {
    await page.goto('/video/');
    for (const [i, proyecto] of PROYECTOS.entries()) {
      const links = page.locator('.project').nth(i).locator('.see-all');
      const ids = proyecto.pieces.length ? proyecto.pieces : [proyecto.youtube!];
      await expect(links, `links de ${proyecto.slug}`).toHaveCount(ids.length);
      for (const [k, id] of ids.entries()) {
        await expect(links.nth(k)).toHaveAttribute('href', `https://youtu.be/${id}`);
        await expect(links.nth(k)).toHaveAttribute('rel', 'noopener');
        await expect(links.nth(k)).toHaveAttribute('target', '_blank');
        await expect(links.nth(k)).toHaveAccessibleName(/Ver en YouTube/);
      }
    }
  });

  /** Los proyectos que declaran un tope, con su índice en la página. */
  const CON_TOPE = PROYECTOS.map((p, i) => ({ ...p, i })).filter((p) => p.mobileLimit);

  test('el tope de pantalla angosta esconde fotogramas', async ({ page }, testInfo) => {
    // A 1024 el tope no corre: la regla es de 800px para abajo.
    test.skip(testInfo.project.name === 'tablet-touch', 'el tope es de 800px para abajo');
    expect(CON_TOPE.length, 'nadie declara mobileLimit').toBeGreaterThan(0);

    const ancho = page.viewportSize()!.width;
    const angosto = ancho <= 800;
    await page.goto('/video/', { waitUntil: 'load' });

    for (const proyecto of CON_TOPE) {
      await expect(
        page.locator('.project').nth(proyecto.i).locator('.card:visible'),
        `${proyecto.slug} a ${ancho}px`
      ).toHaveCount(angosto ? proyecto.mobileLimit! : proyecto.stills);
    }
  });

  test('y los devuelve al agrandar la ventana', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'cambia el ancho a mano');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/video/', { waitUntil: 'load' });
    for (const proyecto of CON_TOPE) {
      await expect(
        page.locator('.project').nth(proyecto.i).locator('.card:visible'),
        `${proyecto.slug} en 390px`
      ).toHaveCount(proyecto.mobileLimit!);
    }

    await page.setViewportSize({ width: 1440, height: 900 });
    for (const proyecto of CON_TOPE) {
      await expect(
        page.locator('.project').nth(proyecto.i).locator('.card:visible'),
        `${proyecto.slug} en 1440px`
      ).toHaveCount(proyecto.stills);
    }
  });
});
