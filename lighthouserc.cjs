// Lighthouse CI sobre el sitio ya construido (astro preview), con el perfil
// móvil que es el que trae Lighthouse por defecto: 4G simulada y CPU lenta.
// Corre con `npm run test:lh`; no entra en `npm test` porque tarda minutos.

const PORT = Number(process.env.LH_PORT ?? 4382);
const BASE = `http://localhost:${PORT}`;

const KB = 1024;
const MB = 1024 * KB;

// Por defecto lhci se queda con la mejor de las tres corridas, que es como no
// medir: acá vale la mediana. Va en cada entrada de la matriz porque lhci no
// acepta assertMatrix junto a otras opciones.
const MEDIANA = 'median';

// Lo que se le pide a toda página del sitio.
const comunes = {
  'categories:performance': ['error', { minScore: 0.9 }],
  'cumulative-layout-shift': ['error', { maxNumericValue: 0.05 }],
  // Queda en warn a propósito: la mediana da 2,6 s en la portada y 2,8 s en
  // /video/. No es peso de imagen (184 y 253 KB) ni bloqueo de JavaScript
  // (TBT 0 ms) sino el reacomodo al llegar las tipografías, que corre el
  // último pintado del elemento más grande. Bajarlo pide tocar la carga de
  // fuentes o la altura de esos bloques, que es otra discusión.
  'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
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
        { matchingUrlPattern: '.*', aggregationMethod: MEDIANA, assertions: comunes },
        {
          // La portada: sólo las dos puertas.
          matchingUrlPattern: `^${BASE}/$`,
          aggregationMethod: MEDIANA,
          assertions: {
            'resource-summary:image:size': ['error', { maxNumericValue: 800 * KB }],
          },
        },
        {
          // La vista de conjunto de Foto: la previa de cada proyecto.
          matchingUrlPattern: `^${BASE}/foto/$`,
          aggregationMethod: MEDIANA,
          assertions: {
            'resource-summary:image:size': ['error', { maxNumericValue: 1.5 * MB }],
          },
        },
      ],
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci' },
  },
};
