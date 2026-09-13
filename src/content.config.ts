import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Una carpeta por proyecto: index.md con estos datos y las fotos al lado
// (01.jpg, 02.jpg, ...). Sumar una foto es sumar un archivo.

const foto = defineCollection({
  loader: glob({ pattern: '*/index.md', base: './src/content/foto' }),
  schema: z.object({
    title: z.string(),
    category: z.string(),
    order: z.number(),
    // Opcional: qué fotos se ven en la vista de conjunto. Por defecto, las
    // primeras seis.
    preview: z.array(z.number()).optional(),
  }),
});

const video = defineCollection({
  loader: glob({ pattern: '*/index.md', base: './src/content/video' }),
  schema: z.object({
    title: z.string(),
    client: z.string().optional(),
    category: z.string(),
    youtube: z.string().regex(/^[\w-]{11}$/).optional(),
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
    mobileLimit: z.number().optional(),
    // Opcional: proyectos con más de un video.
    pieces: z
      .array(
        z.object({
          title: z.string(),
          youtube: z.string().regex(/^[\w-]{11}$/),
        })
      )
      .optional(),
  }),
});

export const collections = { foto, video };
