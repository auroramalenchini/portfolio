import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';
import { MAX_PER_ROW, ROW_TARGET, partitionRows, rowEnds, type MosaicLayout } from '../src/lib/rows';

const suma = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe('partitionRows', () => {
  it('reparte todas las fotos, en orden y sin pasarse del máximo por fila', () => {
    const ratios = [0.67, 1.5, 1.5, 0.67, 0.56, 1.78, 0.67, 0.67, 0.67, 1.33, 0.75];
    const filas = partitionRows(ratios, 0.44);
    expect(suma(filas)).toBe(ratios.length);
    expect(filas.every((n) => n >= 1 && n <= MAX_PER_ROW)).toBe(true);
  });

  it('elige la fila más cercana al alto buscado', () => {
    // Dos 16:9 a 0,28 del ancho contra una sola a 0,56: con 0,26 van juntas,
    // con 0,5 va cada una en su fila.
    expect(partitionRows([1.78, 1.78], 0.26)).toEqual([2]);
    expect(partitionRows([1.78, 1.78], 0.5)).toEqual([1, 1]);
  });

  it('no deja una vertical sola al final', () => {
    const filas = partitionRows([1.5, 1.5, 1.5, 1.5, 0.67], 0.44);
    expect(filas[filas.length - 1]).toBeGreaterThan(1);
  });

  it('una lista vacía no tiene filas y una proporción inválida es un error', () => {
    expect(partitionRows([], 0.4)).toEqual([]);
    expect(() => partitionRows([1, 0], 0.4)).toThrow();
    expect(() => partitionRows([1], 0)).toThrow();
  });

  it('rowEnds marca la última foto de cada fila menos la final', () => {
    expect([...rowEnds([2, 3, 1])]).toEqual([1, 4]);
    expect([...rowEnds([4])]).toEqual([]);
  });
});

// Con las fotos reales: ninguna fila del sitio se aleja demasiado del alto
// buscado, en pantalla ancha ni en angosta. Es la garantía de que no aparece
// una foto gigante ni una fila de miniaturas cuando alguien suma fotos.
const RAIZ = new URL('../src/content', import.meta.url).pathname;
const MIN = 0.6;
const MAX = 1.6;
// Igual que PREVIEW_MAX en src/lib/images.ts, que vitest no puede importar
// porque usa astro:assets.
const PREVIEW_MAX = 6;

interface Mosaico { donde: string; layout: MosaicLayout; ratios: number[]; mobileLimit?: number }

async function proporciones(dir: string, archivos: string[]) {
  return Promise.all(
    archivos.map(async (f) => {
      const { width, height } = await sharp(join(dir, f)).metadata();
      return (width as number) / (height as number);
    })
  );
}

async function mosaicos(): Promise<Mosaico[]> {
  const out: Mosaico[] = [];
  for (const collection of ['foto', 'video'] as const) {
    const base = join(RAIZ, collection);
    for (const slug of readdirSync(base, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name)) {
      const dir = join(base, slug);
      const md = readFileSync(join(dir, 'index.md'), 'utf8');
      const data = (parseYaml(/^---\r?\n([\s\S]*?)\r?\n---/.exec(md)![1]) ?? {}) as Record<string, unknown>;
      const jpgs = readdirSync(dir).filter((f) => f.endsWith('.jpg')).sort();
      const todas = await proporciones(dir, jpgs);
      if (collection === 'video') {
        out.push({ donde: `/video/ ${slug}`, layout: 'video', ratios: todas, mobileLimit: data.mobileLimit as number | undefined });
        continue;
      }
      out.push({ donde: `/foto/${slug}/`, layout: 'proyecto', ratios: todas });
      const preview = data.preview as number[] | undefined;
      const elegidas = preview?.length
        ? preview.map((n) => todas[jpgs.findIndex((f) => Number.parseInt(f, 10) === n)])
        : todas.slice(0, PREVIEW_MAX);
      out.push({ donde: `/foto/ ${slug}`, layout: 'foto', ratios: elegidas });
    }
  }
  return out;
}

describe('las filas con las fotos del sitio', async () => {
  const lista = await mosaicos();
  it.each(lista.flatMap((m) => (['wide', 'narrow'] as const).map((band) => ({ ...m, band }))))(
    '$donde en pantalla $band',
    ({ layout, ratios, mobileLimit, band }) => {
      const visibles = band === 'narrow' && mobileLimit ? ratios.slice(0, mobileLimit) : ratios;
      const target = ROW_TARGET[layout][band];
      let i = 0;
      for (const n of partitionRows(visibles, target)) {
        const alto = 1 / suma(visibles.slice(i, i + n)) / target;
        expect(alto, `fila de ${n} foto(s) desde la ${i + 1}`).toBeGreaterThanOrEqual(MIN);
        expect(alto, `fila de ${n} foto(s) desde la ${i + 1}`).toBeLessThanOrEqual(MAX);
        i += n;
      }
    }
  );
});
