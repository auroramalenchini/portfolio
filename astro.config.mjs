// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://aurora.malenchini.ar',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  image: {
    // sharp lee el ancho y el alto de cada archivo y genera los tamaños.
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
  build: {
    format: 'directory',
  },
});
