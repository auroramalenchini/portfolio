// Astro copia a dist/_astro el original de cada imagen importada, además de
// las versiones que sí usa el HTML (480/960/1600 en avif y jpeg). Los
// originales son ~60 MB que nadie descarga nunca. Esto los borra.
//
// La regla es una sola: se borra un archivo de imagen de dist/_astro sólo si
// su nombre no aparece en ninguna referencia del sitio construido. La lista de
// referencias se arma de los atributos (src, srcset, poster, href, content) y
// de los url() de las hojas de estilo.

import { readdir, readFile, stat, unlink } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const ASTRO_DIR = '_astro';
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
// El HTML y el CSS son los que mandan; los demás se leen igual por si alguna
// referencia vive en un script, en el sitemap o en un svg.
const TEXT_EXT = new Set(['.html', '.css', '.js', '.xml', '.json', '.svg', '.txt']);
const ATTRS = /(?:src|srcset|poster|href|content)\s*=\s*("([^"]*)"|'([^']*)')/gi;
const CSS_URL = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)'"]+))\s*\)/gi;
// Red de seguridad: cualquier mención literal de un archivo de _astro cuenta
// como referencia, aunque no esté en un atributo que conozcamos.
const LITERAL = /_astro\/[A-Za-z0-9@%._-]+\.(?:jpg|jpeg|png|webp|avif)/gi;

async function walk(dir, base = '') {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...(await walk(join(dir, entry.name), rel)));
    else out.push(rel);
  }
  return out;
}

/** El nombre de archivo al que apunta una referencia, o null si no es de _astro. */
function referencedName(value) {
  const limpio = value.trim().split(/[?#]/)[0];
  if (!limpio) return null;
  let decodificado = limpio;
  try {
    decodificado = decodeURIComponent(limpio);
  } catch {
    /* una referencia mal codificada se toma tal cual */
  }
  if (!/(^|\/)_astro\//.test(decodificado)) return null;
  return basename(decodificado);
}

function collectFrom(text, referencias) {
  const anotar = (valor) => {
    const nombre = referencedName(valor);
    if (nombre) referencias.add(nombre);
  };

  for (const m of text.matchAll(ATTRS)) {
    const valor = m[2] ?? m[3] ?? '';
    // srcset trae varias con su descriptor de ancho: "a.avif 480w, b.avif 960w"
    for (const parte of valor.split(',')) anotar(parte.trim().split(/\s+/)[0]);
  }
  for (const m of text.matchAll(CSS_URL)) anotar(m[1] ?? m[2] ?? m[3] ?? '');
  for (const m of text.matchAll(LITERAL)) referencias.add(basename(m[0]));
}

const archivos = await walk(DIST);
const referencias = new Set();
for (const rel of archivos) {
  if (!TEXT_EXT.has(extname(rel).toLowerCase())) continue;
  collectFrom(await readFile(join(DIST, rel), 'utf8'), referencias);
}

const candidatos = archivos.filter((rel) => {
  const partes = rel.split('/');
  return (
    partes.length === 2 &&
    partes[0] === ASTRO_DIR &&
    IMAGE_EXT.has(extname(rel).toLowerCase())
  );
});

let borrados = 0;
let bytes = 0;
for (const rel of candidatos) {
  if (referencias.has(basename(rel))) continue;
  const ruta = join(DIST, rel);
  bytes += (await stat(ruta)).size;
  await unlink(ruta);
  borrados += 1;
}

const mb = (bytes / 1024 / 1024).toFixed(1);
console.log(
  `[prune-dist] ${borrados} de ${candidatos.length} imágenes de _astro sin uso: ${mb} MB menos.`
);
