# Sitio portfolio · Aurora Malenchini

Sitio estático para fotógrafa / directora. Sin framework y sin build:
HTML plano, un archivo CSS y dos archivos JS chicos.

```
portfolio/
  index.html      portada: presentación, video y foto destacados, sobre mí, contacto
  video.html      videoclips, sesiones en vivo, cortometrajes
  photo.html      foto y video comercial (restaurantes, eventos, espacios)
  css/style.css
  js/data.js      TODO el contenido vive acá (nombre, links, proyectos)
  js/main.js      arma las grillas y el visor
  img/            poné acá tus propias imágenes
```

## Correrlo local

Abrí `index.html` en el navegador, o servís la carpeta:

```
cd portfolio && python3 -m http.server 8000
```

## Sumar trabajos

Editá `js/data.js`.

- **Página de video**: agregá un objeto a `VIDEO_WORK` con `title`, `client`,
  `year`, `category`, `embed` (URL de embed de YouTube) y `thumb`
  (URL de imagen). Poné `featured: true` en un ítem para que ocupe todo el
  ancho en video.html.
- **Página de foto**: agregá un objeto a `PHOTO_WORK` con `category`
  (Restaurantes, Eventos, Espacios, o una nueva; se muestra como etiqueta de
  la placa), `title`, `client` y además:
  - `type: "photo"` con `src` (URL de imagen). Sumá `tall: true` para tomas
    verticales.
  - `type: "video"` con `embed` y `thumb`.

Nombre, bajada, ubicación, mail, teléfono e Instagram están en `SITE`.
El teléfono se renderiza como link directo a WhatsApp (`wa.me`), así que
alcanza con escribirlo con el código de país.

La portada muestra los primeros 3 ítems de `VIDEO_WORK` y los primeros 8 de
`PHOTO_WORK`, así que el orden en `data.js` decide qué aparece ahí. Cambiá los
`slice()` del bloque de portada en `js/main.js` para mostrar más o menos.

Formato de URL de embed:

```
https://www.youtube-nocookie.com/embed/ID_DEL_VIDEO
```

## Imágenes

Exportá JPGs para web (alrededor de 1600 px en el lado largo, calidad 75 a 80
por ciento) a `img/` y referencialas como `img/nombre.jpg`. El demo usa
placeholders de picsum.photos para que el sitio se vea sin ningún asset.

## Identidad visual

- Tres colores y nada más: fondo crema `#F3EDE1`, texto y títulos en marrón
  oscuro `#24211C`, y bordó `#7A2233` para los detalles (líneas, subrayados,
  kicker, hover).
- Títulos en **Playfair Display** 800, siempre en mayúscula, y textos en
  **Inter** (nada por debajo de 400). Los tokens están arriba de todo en
  `css/style.css`.

## Deploy

Sirve cualquier hosting estático: GitHub Pages, Netlify, Cloudflare Pages,
Vercel. Subí la carpeta `portfolio/` y apuntá el dominio ahí.
