// Las fotos de cada proyecto salen de la carpeta, no de una lista a mano:
// el orden es el de los nombres (01.jpg, 02.jpg, ...) y el ancho, el alto y
// la proporción los lee el build de cada archivo.

import { getImage } from 'astro:assets';

export type Collection = 'foto' | 'video';

export interface ProjectImage {
  /** El número del archivo: 01.jpg es 1. Es el que usa `preview`. */
  n: number;
  image: ImageMetadata;
}

/** Cuántas fotos entran en la vista de conjunto cuando el proyecto no elige. */
export const PREVIEW_MAX = 6;

// Vite resuelve este glob en el build y nos entrega los metadatos (ancho,
// alto, formato) de cada archivo. Una sola pasada para las dos colecciones.
const todas = import.meta.glob<ImageMetadata>('/src/content/{foto,video}/*/*.jpg', {
  eager: true,
  import: 'default',
});

/** La proporción de una foto: mayor que 1 es apaisada. */
export function aspectRatio(image: ImageMetadata): number {
  return image.width / image.height;
}

/** Las fotos de un proyecto, ordenadas por nombre de archivo. */
export function projectImages(collection: Collection, slug: string): ProjectImage[] {
  const prefijo = `/src/content/${collection}/${slug}/`;
  return Object.keys(todas)
    .filter((ruta) => ruta.startsWith(prefijo))
    .sort((a, b) => a.localeCompare(b))
    .map((ruta) => ({
      n: Number.parseInt(ruta.slice(prefijo.length), 10),
      image: todas[ruta] as ImageMetadata,
    }));
}

interface PreviewProject {
  collection: string;
  id: string;
  data: { preview?: number[] };
}

/**
 * Las fotos que se muestran en la vista de conjunto: las que elige el
 * proyecto en `preview` (en ese orden) o, si no elige, las primeras seis.
 * Un proyecto de seis o menos se muestra entero.
 */
export function previewOf(project: PreviewProject): ProjectImage[] {
  const todasLasFotos = projectImages(project.collection as Collection, project.id);
  const elegidas = project.data.preview;
  if (!elegidas?.length) return todasLasFotos.slice(0, PREVIEW_MAX);
  // `preview` nombra números de archivo, no posiciones: si alguno no existe
  // queda afuera en vez de romper la página.
  return elegidas
    .map((n) => todasLasFotos.find((foto) => foto.n === n))
    .filter((foto): foto is ProjectImage => Boolean(foto));
}

/**
 * La imagen para compartir de una página: 1200 px de ancho en jpeg, que es lo
 * que piden WhatsApp, Instagram y las tarjetas de Twitter. Devuelve la ruta
 * dentro del sitio; `Seo.astro` la convierte en absoluta.
 */
export async function ogImagePath(image: ImageMetadata): Promise<string> {
  const { src } = await getImage({ src: image, width: 1200, format: 'jpeg' });
  return src;
}
