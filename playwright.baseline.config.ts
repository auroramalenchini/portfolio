import { defineConfig, devices } from '@playwright/test';

// Config aparte, a propósito: las capturas del sitio viejo en vivo no deben
// correr con `npm test`. Se usan con `npm run baseline`.
export default defineConfig({
  testDir: 'tests',
  testMatch: 'baseline.ts',
  timeout: 180_000,
  workers: 1,
  retries: 1,
  reporter: [['list']],
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'tablet-touch',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1024, height: 768 },
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      // deviceScaleFactor 1 a propósito: con el 3 del iPhone los PNG de página
      // completa pesaban 40 MB cada uno y no se ve nada más.
      name: 'phone',
      use: { ...devices['iPhone 13'], deviceScaleFactor: 1 },
    },
  ],
});
