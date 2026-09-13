import { expect, test, type Page, type Request } from '@playwright/test';

// La portada: la apertura, las dos puertas, "Sobre mí" y "Contacto".
//
// El caso que más commits costó es el primero: con el dedo, un solo toque en
// una puerta tiene que navegar. Antes hacían falta dos, porque al tocar se
// aplicaba el ensanchado de hover y el objetivo se corría de abajo del dedo.

const esTactil = (nombre: string) => nombre === 'tablet-touch' || nombre === 'phone';

/** La puerta de Video o la de Foto, por su etiqueta. */
function puerta(page: Page, etiqueta: 'Video' | 'Foto') {
  return page.locator('.door', { has: page.locator('.door-label', { hasText: etiqueta }) });
}

/** Espera a que la apertura esté quieta antes de medir o de tocar. */
async function apertutaLista(page: Page) {
  await page.goto('/');
  await expect(puerta(page, 'Video')).toBeVisible();
  await expect(puerta(page, 'Foto')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

test.describe('las dos puertas', () => {
  test('con el dedo, un solo toque en Video va a /video/', async ({ page }, info) => {
    test.skip(!esTactil(info.project.name), 'sólo con pantalla táctil');
    await apertutaLista(page);
    await puerta(page, 'Video').tap();
    await page.waitForURL(/\/video\/?$/);
    expect(new URL(page.url()).pathname).toBe('/video/');
  });

  test('con el dedo, un solo toque en Foto va a /foto/', async ({ page }, info) => {
    test.skip(!esTactil(info.project.name), 'sólo con pantalla táctil');
    await apertutaLista(page);
    await puerta(page, 'Foto').tap();
    await page.waitForURL(/\/foto\/?$/);
    expect(new URL(page.url()).pathname).toBe('/foto/');
  });

  test('en la computadora van lado a lado; con el dedo, apiladas', async ({ page }, info) => {
    await apertutaLista(page);
    const v = await puerta(page, 'Video').boundingBox();
    const f = await puerta(page, 'Foto').boundingBox();
    expect(v).not.toBeNull();
    expect(f).not.toBeNull();

    if (info.project.name === 'desktop') {
      expect(Math.abs(v!.y - f!.y), 'mismo techo').toBeLessThanOrEqual(2);
      expect(f!.x, 'Foto a la derecha de Video').toBeGreaterThan(v!.x + v!.width / 2);
    } else {
      expect(Math.abs(v!.x - f!.x), 'misma izquierda').toBeLessThanOrEqual(2);
      expect(f!.y, 'Foto abajo de Video').toBeGreaterThan(v!.y + v!.height / 2);
    }
  });

  test('en la computadora, al final de la apertura las puertas se pueden clickear', async ({
    page,
  }, info) => {
    test.skip(info.project.name !== 'desktop', 'sólo con el escenario fijo');
    await apertutaLista(page);

    // Arrancan borrosas y detrás del nombre: ahí todavía no se tocan.
    await expect
      .poll(() => page.locator('.opening-back').evaluate((el) => getComputedStyle(el).pointerEvents))
      .toBe('none');

    // Hasta el fondo de la apertura: ahí las puertas ya están nítidas.
    await page.evaluate(() => {
      const sec = document.querySelector('.opening') as HTMLElement;
      window.scrollTo({ top: sec.offsetTop + sec.offsetHeight - window.innerHeight, behavior: 'instant' });
    });
    await expect
      .poll(() => page.locator('.opening-back').evaluate((el) => getComputedStyle(el).pointerEvents))
      .toBe('auto');

    await puerta(page, 'Video').click();
    await page.waitForURL(/\/video\/?$/);
    expect(new URL(page.url()).pathname).toBe('/video/');
  });

  test('en la computadora, el nombre y las puertas quedan centrados debajo del header', async ({
    page,
  }, info) => {
    test.skip(info.project.name !== 'desktop', 'sólo con el escenario fijo');
    // Pantallas comunes de notebook y de escritorio: el escenario empezaba
    // debajo del header y medía la pantalla entera, así que todo quedaba 36px
    // abajo del centro y las puertas se cortaban.
    for (const [width, height] of [[1280, 720], [1440, 900], [1920, 1080]]) {
      await page.setViewportSize({ width, height });
      await page.goto('/', { waitUntil: 'load' });
      for (const fraccion of [0, 0.3, 0.9]) {
        await page.evaluate((f) => window.scrollTo(0, window.innerHeight * f), fraccion);
        await page.waitForTimeout(100);
        const m = await page.evaluate(() => {
          const r = (s: string) => document.querySelector(s)!.getBoundingClientRect();
          const header = r('.site-header').bottom;
          const escenario = r('.opening-stage');
          const nombre = (r('.opening-front h1').top + r('.hero-role').bottom) / 2;
          return {
            nombre: nombre - (header + window.innerHeight) / 2,
            arriba: escenario.top - header,
            abajo: window.innerHeight - escenario.bottom,
          };
        });
        const donde = `${width}x${height}, scroll ${fraccion * 100}%`;
        expect(Math.abs(m.nombre), `${donde}: nombre corrido ${Math.round(m.nombre)}px`).toBeLessThanOrEqual(2);
        expect(Math.abs(m.arriba), `${donde}: escenario tapado por el header`).toBeLessThanOrEqual(1);
        expect(Math.abs(m.abajo), `${donde}: escenario pasado del piso`).toBeLessThanOrEqual(1);
      }
    }
  });

  test('la puerta de Video trae el recorte mudo y en bucle', async ({ page }) => {
    await apertutaLista(page);
    const video = puerta(page, 'Video').locator('video');
    await expect(video).toHaveCount(1);
    for (const attr of ['muted', 'autoplay', 'playsinline', 'loop']) {
      expect(await video.getAttribute(attr), attr).not.toBeNull();
    }
    expect(await video.getAttribute('poster')).toMatch(/^\/_astro\/.+\.jpe?g$/);
    await expect(video.locator('source')).toHaveCount(2);
    await expect(video.locator('source[type="video/webm"]')).toHaveCount(1);
    await expect(video.locator('source[type="video/mp4"]')).toHaveCount(1);
  });

  test('las fotos de las puertas vienen medidas y con srcset', async ({ page }) => {
    await apertutaLista(page);
    const imgs = page.locator('.door img');
    const n = await imgs.count();
    expect(n, 'al menos una foto de puerta en el html').toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      const img = imgs.nth(i);
      expect(await img.getAttribute('width'), 'width').toBeTruthy();
      expect(await img.getAttribute('height'), 'height').toBeTruthy();
      expect(await img.getAttribute('srcset'), 'srcset').toBeTruthy();
    }
    // Las fotos que rotan viajan en un <template>: no se descargan de entrada.
    await expect(puerta(page, 'Foto').locator('.door-media > template')).toHaveCount(1);
  });

  test('la puerta de Foto va pasando sus fotos', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'con una pantalla alcanza');
    await apertutaLista(page);
    const media = puerta(page, 'Foto').locator('.door-media');

    // La que se ve es la última capa; la primera es la siguiente, ya descargada.
    const arriba = () =>
      media.evaluate((el) => {
        const capas = el.querySelectorAll<HTMLImageElement>(':scope > .door-capa img');
        return capas[capas.length - 1]?.currentSrc ?? '';
      });

    const primera = await arriba();
    expect(primera, 'la primera foto está en el html').not.toBe('');
    // El pase es cada 5 segundos.
    await expect.poll(arriba, { timeout: 9000, intervals: [500] }).not.toBe(primera);
  });
});

test.describe('el header', () => {
  test('se ve en el tope y también 2000 px más abajo', async ({ page }) => {
    await apertutaLista(page);
    const header = page.locator('.site-header');

    for (const y of [0, 2000]) {
      await page.evaluate((to) => window.scrollTo({ top: to, behavior: 'instant' }), y);
      await page.waitForTimeout(120);
      const caja = await header.boundingBox();
      expect(caja, `header a ${y}px`).not.toBeNull();
      expect(caja!.y, `techo del header a ${y}px`).toBeGreaterThanOrEqual(-1);
      const alto = page.viewportSize()!.height;
      expect(caja!.y + caja!.height, `piso del header a ${y}px`).toBeLessThanOrEqual(alto + 1);
      expect(caja!.height, `alto del header a ${y}px`).toBeGreaterThan(0);
    }
  });

  test('"Sobre mí" desde /video/ cae abajo del header y dentro de la pantalla', async ({ page }) => {
    await page.goto('/video/');
    await page.getByRole('link', { name: 'Sobre mí' }).click();
    await page.waitForURL(/\/#about$/);

    // El scroll suave del ancla tarda: se espera a que se quede quieto.
    await expect
      .poll(
        async () => {
          const a = await page.locator('#about').boundingBox();
          return a ? Math.round(a.y) : null;
        },
        { timeout: 5000, intervals: [100, 150, 250] }
      )
      .toBeLessThan(200);

    const header = (await page.locator('.site-header').boundingBox())!;
    const about = (await page.locator('#about').boundingBox())!;
    const alto = page.viewportSize()!.height;

    expect(about.y, 'el techo de #about no queda tapado por el header').toBeGreaterThanOrEqual(
      header.y + header.height - 2
    );
    expect(about.y, 'el techo de #about queda dentro de la pantalla').toBeLessThan(alto);
  });
});

test.describe('contacto', () => {
  test('los tres links salen bien armados del build', async ({ page }) => {
    await page.goto('/');

    const wa = page.locator('.contact-link', { hasText: 'WhatsApp' });
    const href = (await wa.getAttribute('href'))!;
    expect(href).toMatch(/^https:\/\/wa\.me\/\d+$/);

    const ig = page.locator('.contact-link', { hasText: 'Instagram' });
    expect(await ig.getAttribute('target')).toBe('_blank');
    expect(await ig.getAttribute('rel')).toContain('noopener');
    await expect(ig.locator('.cl-value')).toHaveText(/^@[\w.]+$/);

    const mail = page.locator('.contact-link', { hasText: 'Mail' });
    expect(await mail.getAttribute('href')).toMatch(/^mailto:.+@.+$/);
  });
});

test.describe('movimiento reducido', () => {
  test.use({ reducedMotion: 'reduce' });

  test('todo se ve de entrada y nada queda animándose', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'con una pantalla alcanza');
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);

    const opacidades = await page
      .locator('.reveal')
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).opacity));
    expect(opacidades.length, 'hay elementos con .reveal').toBeGreaterThan(0);
    expect(opacidades, 'todos visibles al cargar').toEqual(opacidades.map(() => '1'));

    const animaciones = await page.evaluate(() =>
      document.getAnimations().map((a) => (a as CSSAnimation).animationName ?? 'anónima')
    );
    expect(animaciones, 'ninguna animación en marcha').toEqual([]);

    // Y la apertura queda apilada, no con el escenario fijo a medio camino.
    const back = await page.locator('.opening-back').evaluate((el) => {
      const cs = getComputedStyle(el);
      return { filter: cs.filter, opacity: cs.opacity, transform: cs.transform };
    });
    expect(back.filter).toBe('none');
    expect(back.opacity).toBe('1');
    expect(back.transform).toBe('none');
  });

  test('el recorte de la puerta no se reproduce', async ({ page }) => {
    await page.goto('/');
    const video = puerta(page, 'Video').locator('video');
    await expect(video).toHaveCount(1);
    const estado = await video.evaluate((el: HTMLVideoElement) => ({
      pausado: el.paused,
      display: getComputedStyle(el).display,
      autoplay: el.hasAttribute('autoplay'),
      loop: el.hasAttribute('loop'),
    }));
    expect(
      estado.pausado || estado.display === 'none',
      `el recorte sigue en marcha (paused=${estado.pausado}, display=${estado.display})`
    ).toBe(true);
    expect(estado.autoplay, 'le queda el autoplay').toBe(false);
    expect(estado.loop, 'le queda el loop').toBe(false);
  });
});

test.describe('higiene', () => {
  test('sin picsum ni Google Fonts', async ({ page }) => {
    const externos: string[] = [];
    page.on('request', (req: Request) => {
      if (/picsum\.photos|fonts\.googleapis\.com/.test(req.url())) externos.push(req.url());
    });
    await page.goto('/');
    await page.evaluate(() => window.scrollTo({ top: 99999, behavior: 'instant' }));
    await page.waitForTimeout(500);
    expect(externos).toEqual([]);
  });

  test('en el teléfono no se va de ancho', async ({ page }, info) => {
    test.skip(info.project.name !== 'phone', 'sólo en el teléfono');
    await page.goto('/');
    await page.evaluate(() => window.scrollTo({ top: 99999, behavior: 'instant' }));
    await page.waitForTimeout(300);
    const medidas = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(medidas.scrollWidth).toBeLessThanOrEqual(medidas.innerWidth);
  });
});
