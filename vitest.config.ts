import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // Playwright se ocupa de tests/e2e y de la captura de referencia.
    exclude: ['tests/e2e/**', 'tests/baseline.ts', 'node_modules/**', 'dist/**'],
  },
});
