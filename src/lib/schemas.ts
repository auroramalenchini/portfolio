import { z } from 'zod';

// Los esquemas viven acá y no en content.config.ts porque las pruebas de
// vitest no pueden importar `astro:content`, pero sí este archivo: así la
// forma que valida el build es exactamente la que revisan las pruebas.

/** Un id de YouTube: once caracteres, letras, números, guión y guión bajo. */
export const youtubeId = z.string().regex(/^[\w-]{11}$/);

export const fotoSchema = z.object({
  title: z.string(),
  category: z.string(),
  order: z.number(),
  // Opcional: qué fotos se ven en la vista de conjunto, y en qué orden.
  // Por defecto, las primeras seis.
  preview: z.array(z.number().int().positive()).optional(),
  // Opcional: cuántas fotos de la previa se ven en pantalla angosta.
  mobileLimit: z.number().int().positive().optional(),
});

export const videoSchema = z.object({
  title: z.string(),
  client: z.string().optional(),
  category: z.string(),
  youtube: youtubeId.optional(),
  order: z.number(),
  award: z.string().optional(),
  credits: z
    .object({
      direccion: z.string().optional(),
      fotografia: z.string().optional(),
      arte: z.string().optional(),
    })
    .optional(),
  // Opcional: cuántos fotogramas se ven en pantalla angosta.
  mobileLimit: z.number().int().positive().optional(),
  // Opcional: proyectos con más de un video.
  pieces: z
    .array(
      z.object({
        title: z.string(),
        youtube: youtubeId,
      })
    )
    .optional(),
});

export type FotoData = z.infer<typeof fotoSchema>;
export type VideoData = z.infer<typeof videoSchema>;
