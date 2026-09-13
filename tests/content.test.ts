import { describe, expect, it } from 'vitest';
import { site, siteSchema } from '../src/lib/site';
import raw from '../src/content/site.json';

// Las fases 2 y 3 suman acá las pruebas de las colecciones foto y video.
describe('site.json', () => {
  it('pasa el esquema', () => {
    expect(() => siteSchema.parse(raw)).not.toThrow();
  });

  it('tiene nombre', () => {
    expect(site.name.trim().length).toBeGreaterThan(0);
  });
});
