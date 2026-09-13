// Después de podar dist/_astro no puede quedar ninguna imagen apuntando a un
// archivo que no existe. Corre sobre el sitio ya construido.

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

const DIST = resolve(import.meta.dirname, '..', 'dist');

function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const ruta = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(ruta);
    return entry.name.endsWith('.html') ? [ruta] : [];
  });
}

/** Las rutas que pide un <img> o un <source>: src, srcset y poster. */
function imageRefs(html: string): string[] {
  const refs: string[] = [];
  for (const tag of html.matchAll(/<(?:img|source|video)\b[^>]*>/gi)) {
    for (const attr of tag[0].matchAll(/(?:src|srcset|poster)\s*=\s*"([^"]*)"/gi)) {
      for (const parte of attr[1].split(',')) {
        const ruta = parte.trim().split(/\s+/)[0];
        if (ruta && !/^(?:data:|https?:|\/\/)/i.test(ruta)) refs.push(ruta);
      }
    }
  }
  return refs;
}

describe('imágenes del sitio construido', () => {
  if (!existsSync(join(DIST, 'index.html'))) {
    it('necesita dist', () => {
      throw new Error('Corré `npm run build` antes de estas pruebas.');
    });
    return;
  }

  const paginas = htmlFiles(DIST);

  it('hay páginas para revisar', () => {
    expect(paginas.length).toBeGreaterThan(5);
  });

  for (const pagina of paginas) {
    const url = '/' + pagina.slice(DIST.length + 1);
    it(`${url}: todas las imágenes existen`, () => {
      const html = readFileSync(pagina, 'utf8');
      const faltan = imageRefs(html).filter((ref) => {
        const destino = ref.startsWith('/')
          ? join(DIST, ref.slice(1))
          : resolve(dirname(pagina), ref);
        return !existsSync(destino) || !statSync(destino).isFile();
      });
      expect(faltan, `faltan en ${url}: ${faltan.join(', ')}`).toEqual([]);
    });
  }
});
