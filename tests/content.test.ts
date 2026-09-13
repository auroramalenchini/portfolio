import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// `yaml` viene con astro y trae sus propios tipos: alcanza para leer el
// frontmatter sin sumar una dependencia al proyecto.
import { parse as parseYaml } from 'yaml';
import { site, siteSchema } from '../src/lib/site';
import raw from '../src/content/site.json';
import { fotoSchema, videoSchema, youtubeId } from '../src/lib/schemas';

describe('site.json', () => {
  it('pasa el esquema', () => {
    expect(() => siteSchema.parse(raw)).not.toThrow();
  });

  it('tiene nombre', () => {
    expect(site.name.trim().length).toBeGreaterThan(0);
  });
});

// Las colecciones son carpetas: se revisan como carpetas. Si alguien suma un
// proyecto con una foto salteada o un `preview` que apunta a un archivo que no
// está, estas pruebas lo dicen antes de publicar.
const RAIZ = new URL('../src/content', import.meta.url).pathname;

interface Proyecto {
  collection: 'foto' | 'video';
  slug: string;
  dir: string;
  data: Record<string, unknown>;
  jpgs: string[];
}

function leer(collection: 'foto' | 'video'): Proyecto[] {
  const base = join(RAIZ, collection);
  return readdirSync(base, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => {
      const dir = join(base, e.name);
      const md = readFileSync(join(dir, 'index.md'), 'utf8');
      const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(md);
      if (!frontmatter) throw new Error(`${collection}/${e.name}: index.md sin frontmatter`);
      return {
        collection,
        slug: e.name,
        dir,
        data: (parseYaml(frontmatter[1]) ?? {}) as Record<string, unknown>,
        jpgs: readdirSync(dir)
          .filter((f) => f.endsWith('.jpg'))
          .sort(),
      };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

const foto = leer('foto');
const video = leer('video');
const todos = [...foto, ...video];

describe('carpetas de proyecto', () => {
  it('hay proyectos en las dos colecciones', () => {
    expect(foto.length).toBeGreaterThan(0);
    expect(video.length).toBeGreaterThan(0);
  });

  it.each(todos.map((p) => [`${p.collection}/${p.slug}`, p] as const))(
    '%s: el frontmatter pasa el esquema',
    (_nombre, proyecto) => {
      const esquema = proyecto.collection === 'foto' ? fotoSchema : videoSchema;
      const resultado = esquema.safeParse(proyecto.data);
      expect(resultado.success ? null : resultado.error.issues).toBe(null);
    }
  );

  it.each(todos.map((p) => [`${p.collection}/${p.slug}`, p] as const))(
    '%s: tiene fotos numeradas de 01 en adelante, sin saltos',
    (_nombre, proyecto) => {
      expect(proyecto.jpgs.length).toBeGreaterThan(0);
      const esperados = proyecto.jpgs.map((_f, i) => String(i + 1).padStart(2, '0') + '.jpg');
      expect(proyecto.jpgs).toEqual(esperados);
    }
  );

  it.each(foto.map((p) => [p.slug, p] as const))(
    'foto/%s: cada número de preview existe',
    (_slug, proyecto) => {
      const preview = (proyecto.data.preview as number[] | undefined) ?? [];
      for (const n of preview) {
        expect(n, 'el número tiene que ser positivo').toBeGreaterThan(0);
        expect(n, `no hay una foto ${n} en ${proyecto.slug}`).toBeLessThanOrEqual(
          proyecto.jpgs.length
        );
      }
      // Repetir una foto en la previa sería un descuido, no una decisión.
      expect(new Set(preview).size).toBe(preview.length);
    }
  );
});

describe('orden de los proyectos', () => {
  it.each([
    ['foto', foto],
    ['video', video],
  ] as const)('%s: no hay dos proyectos con el mismo order', (_nombre, proyectos) => {
    const ordenes = proyectos.map((p) => p.data.order as number);
    expect(new Set(ordenes).size, `orders: ${ordenes.join(', ')}`).toBe(ordenes.length);
  });
});

describe('videos', () => {
  it.each(video.map((p) => [p.slug, p] as const))(
    'video/%s: los id de YouTube tienen forma de id',
    (_slug, proyecto) => {
      const propio = proyecto.data.youtube as string | undefined;
      const piezas = (proyecto.data.pieces as { title: string; youtube: string }[] | undefined) ?? [];
      if (propio) expect(youtubeId.safeParse(propio).success, propio).toBe(true);
      for (const pieza of piezas) {
        expect(youtubeId.safeParse(pieza.youtube).success, pieza.youtube).toBe(true);
        expect(pieza.title?.trim().length ?? 0, 'toda pieza necesita título').toBeGreaterThan(0);
      }
      // Sin video propio ni piezas no habría nada para reproducir.
      expect(Boolean(propio) || piezas.length > 0, `${proyecto.slug} no tiene video`).toBe(true);
    }
  );

  it.each(video.map((p) => [p.slug, p] as const))(
    'video/%s: el tope de pantalla angosta cabe en los fotogramas',
    (_slug, proyecto) => {
      const tope = proyecto.data.mobileLimit as number | undefined;
      if (tope === undefined) return;
      expect(tope).toBeGreaterThan(0);
      // Un tope mayor que la cantidad de fotogramas no esconde nada: es un
      // dato viejo que quedó en el index.md.
      expect(tope).toBeLessThanOrEqual(proyecto.jpgs.length);
      // Y hasta 16, que son las reglas que trae Mosaic.astro.
      expect(tope).toBeLessThanOrEqual(16);
    }
  );
});
