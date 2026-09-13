import { z } from 'zod';
import raw from '../content/site.json';

// Los datos del sitio (nombre, contacto, puertas de la portada) viven en
// src/content/site.json. Se validan una sola vez, al importar: si falta un
// campo, el build falla en vez de publicar una página a medias.
export const siteSchema = z.object({
  name: z.string().min(1),
  tagline: z.string().min(1),
  location: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  instagram: z.string().url(),
  doors: z.object({
    video: z.array(z.string()).min(1),
    videoClip: z.string().optional(),
    videoClipWebm: z.string().optional(),
    photo: z.array(z.string()).min(1),
  }),
});

export type Site = z.infer<typeof siteSchema>;

export const site: Site = siteSchema.parse(raw);

/** Link directo a WhatsApp: wa.me sólo acepta dígitos. */
export const whatsappHref = `https://wa.me/${site.phone.replace(/\D/g, '')}`;
export const mailtoHref = `mailto:${site.email}`;
