// Lighthouse CI sobre el sitio ya construido (astro preview), con el perfil
// móvil que es el que trae Lighthouse por defecto: 4G simulada y CPU lenta.
// Corre con `npm run test:lh`; no entra en `npm test` porque tarda minutos.

const PORT = Number(process.env.LH_PORT ?? 4382);
const BASE = `http://localhost:${PORT}`;

const KB = 1024;
const MB = 1024 * KB;

// Lo que se le pide a toda página del sitio.
const comunes = {
  'categories:performance': ['error', { minScore: 0.9 }],
  'cumulative-layout-shift': ['error', { maxNumericValue: 0.05 }],
  'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
};

module.exports = {
  ci: {
    collect: {
      startServerCommand: `npx astro preview --port ${PORT}`,
      startServerReadyPattern: 'localhost',
      url: [`${BASE}/`, `${BASE}/foto/`, `${BASE}/video/`, `${BASE}/foto/oruga/`],
      numberOfRuns: 3,
    },
    assert: {
      // Cada patrón que coincide suma sus reglas: las comunes van a todas y el
      // presupuesto de imágenes cambia según la página.
      assertMatrix: [
        { matchingUrlPattern: '.*', assertions: comunes },
        {
          // La portada: sólo las dos puertas.
          matchingUrlPattern: `^${BASE}/$`,
          assertions: {
            'resource-summary:image:size': ['error', { maxNumericValue: 800 * KB }],
          },
        },
        {
          // La vista de conjunto de Foto: la previa de cada proyecto.
          matchingUrlPattern: `^${BASE}/foto/$`,
          assertions: {
            'resource-summary:image:size': ['error', { maxNumericValue: 1.5 * MB }],
          },
        },
      ],
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci' },
  },
};
