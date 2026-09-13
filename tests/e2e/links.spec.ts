import { test, expect } from '@playwright/test';

// Recorre el sitio entero desde la portada siguiendo todos los href internos y
// se asegura de que ninguno termine en un 404. Las direcciones del sitio viejo
// no están linkeadas desde ningún lado, así que entran como puntos de partida.
const SEMILLAS = ['/', '/404.html', '/photo.html', '/video.html', '/proyecto.html'];

const HREF = /href\s*=\s*"([^"]*)"/gi;

test('todos los links internos responden 200', async ({ request, baseURL }) => {
  // Basta con recorrerlo una vez: los links no cambian con el tamaño de pantalla.
  test.skip(test.info().project.name !== 'desktop', 'un recorrido alcanza');

  const origen = new URL(baseURL!).origin;
  const pendientes = SEMILLAS.map((ruta) => new URL(ruta, origen).href);
  const vistas = new Set<string>(pendientes);
  const roto: string[] = [];
  let paginas = 0;

  while (pendientes.length) {
    const url = pendientes.shift()!;
    const res = await request.get(url, { maxRedirects: 5 });
    if (res.status() !== 200) {
      roto.push(`${url} (${res.status()})`);
      continue;
    }
    if (!(res.headers()['content-type'] ?? '').includes('text/html')) continue;

    paginas += 1;
    const html = await res.text();
    for (const m of html.matchAll(HREF)) {
      const bruto = m[1].trim();
      if (!bruto || bruto.startsWith('#')) continue;
      // mailto, tel, wa.me, Instagram, YouTube: fuera del sitio, no se prueban.
      if (/^[a-z][a-z0-9+.-]*:/i.test(bruto) && !/^https?:/i.test(bruto)) continue;

      let destino: URL;
      try {
        destino = new URL(bruto, url);
      } catch {
        roto.push(`${bruto} (dirección inválida, en ${url})`);
        continue;
      }
      if (destino.origin !== origen) continue;
      destino.hash = '';
      if (vistas.has(destino.href)) continue;
      vistas.add(destino.href);
      pendientes.push(destino.href);
    }
  }

  expect(roto, `links rotos:\n${roto.join('\n')}`).toEqual([]);
  // La portada, video, foto, las 12 de proyecto, el 404 y las tres mudanzas.
  expect(paginas).toBeGreaterThanOrEqual(15);
});
