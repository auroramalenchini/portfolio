import type { ImageMetadata } from 'astro';
import { site } from './site';

// site.json nombra las fotos de las puertas por referencia corta:
//   "video/gusto-a-sal/09"      -> src/content/video/gusto-a-sal/09.jpg
//   "foto/anantara/01"          -> src/content/foto/anantara/01.jpg
//   "doors/portada-gusto-a-sal.jpg" -> src/assets/doors/portada-gusto-a-sal.jpg
// Acá se convierten en los ImageMetadata que necesita <Picture>. Si una
// referencia no existe, el build falla: mejor eso que publicar un hueco.

const DE_CONTENIDO = import.meta.glob<ImageMetadata>('/src/content/{foto,video}/*/*.jpg', {
  eager: true,
  import: 'default',
});

const DE_ASSETS = import.meta.glob<ImageMetadata>('/src/assets/doors/*.jpg', {
  eager: true,
  import: 'default',
});

/** Los recortes de video se copian a public/doors y se sirven por ruta. */
const CLIP = /^doors\/(.+\.(?:mp4|webm))$/i;

function resolverFoto(ref: string): ImageMetadata {
  const ruta = ref.startsWith('doors/')
    ? `/src/assets/${ref}`
    : `/src/content/${ref}.jpg`;
  const imagen = ref.startsWith('doors/') ? DE_ASSETS[ruta] : DE_CONTENIDO[ruta];
  if (!imagen) {
    throw new Error(
      `La puerta apunta a "${ref}" y el archivo ${ruta} no existe. ` +
        'Revisá src/content/site.json.'
    );
  }
  return imagen;
}

function resolverClip(ref: string): string {
  const m = CLIP.exec(ref);
  if (!m) {
    throw new Error(`"${ref}" no es un recorte de video de las puertas (mp4 o webm).`);
  }
  return `/doors/${m[1]}`;
}

export interface Door {
  /** Etiqueta grande de la puerta. */
  label: string;
  /** Bajada, copiada del sitio viejo. */
  sub: string;
  href: string;
  /** Las fotos que se van pasando; la primera va en el HTML. */
  photos: ImageMetadata[];
  /** Recorte mudo para la puerta de Video, si lo hay. */
  clip?: { mp4: string; webm?: string; };
}

const videoClip = site.doors.videoClip
  ? {
      mp4: resolverClip(site.doors.videoClip),
      webm: site.doors.videoClipWebm ? resolverClip(site.doors.videoClipWebm) : undefined,
    }
  : undefined;

export const doors: Door[] = [
  {
    label: 'Video',
    sub: 'Videoclips, visualizers, fashion films y sesiones musicales',
    href: '/video/',
    photos: site.doors.video.map(resolverFoto),
    clip: videoClip,
  },
  {
    label: 'Foto',
    sub: 'Eventos, restaurantes, rodajes, foto producto y más',
    href: '/foto/',
    photos: site.doors.photo.map(resolverFoto),
  },
];
