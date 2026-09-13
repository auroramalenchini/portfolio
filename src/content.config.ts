import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { fotoSchema, videoSchema } from './lib/schemas';

// Una carpeta por proyecto: index.md con estos datos y las fotos al lado
// (01.jpg, 02.jpg, ...). Sumar una foto es sumar un archivo.
// Los esquemas están en src/lib/schemas.ts para que vitest pueda usarlos.

const foto = defineCollection({
  loader: glob({ pattern: '*/index.md', base: './src/content/foto' }),
  schema: fotoSchema,
});

const video = defineCollection({
  loader: glob({ pattern: '*/index.md', base: './src/content/video' }),
  schema: videoSchema,
});

export const collections = { foto, video };
