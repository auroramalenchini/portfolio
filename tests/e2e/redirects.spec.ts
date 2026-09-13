import { test, expect } from '@playwright/test';

// Las direcciones del sitio anterior siguen existiendo: una página mínima que
// manda a la nueva. Los links que alguien haya compartido no se rompen.
const MUDANZAS = [
  { vieja: '/photo.html', nueva: '/foto/' },
  { vieja: '/video.html', nueva: '/video/' },
  // proyecto.html llevaba el slug en la query, que no se puede redirigir:
  // cae en la vista de conjunto de foto.
  { vieja: '/proyecto.html', nueva: '/foto/' },
];

for (const { vieja, nueva } of MUDANZAS) {
  test(`${vieja} manda a ${nueva}`, async ({ request }) => {
    const res = await request.get(vieja);
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toContain(`<meta http-equiv="refresh" content="0; url=${nueva}">`);
    expect(html).toContain(`href="${nueva}"`);
    expect(html).toContain(`<link rel="canonical" href="https://aurora.malenchini.ar${nueva}">`);
  });
}

test('el navegador sigue la mudanza de photo.html', async ({ page }) => {
  await page.goto('/photo.html');
  await page.waitForURL('**/foto/');
  await expect(page.locator('h1')).toHaveCount(1);
});
