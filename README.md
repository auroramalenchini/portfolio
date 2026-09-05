# Sitio portfolio · Aurora Malenchini

Sitio estático para fotógrafa / directora. Sin framework y sin build:
HTML plano, un archivo CSS y dos archivos JS chicos.

```
portfolio/
  index.html      portada: presentación, video y foto destacados, sobre mí, contacto
  video.html      videoclips, sesiones en vivo, cortometrajes
  photo.html      foto y video comercial (hoteles, restaurantes, eventos, espacios)
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
  `year`, `category`, `embed` (URL de embed de Vimeo o YouTube) y `thumb`
  (URL de imagen). Poné `featured: true` en un ítem para que ocupe todo el
  ancho en video.html.
- **Página de foto**: agregá un objeto a `PHOTO_WORK` con `category` (Hoteles,
  Restaurantes, Eventos, Espacios, o una nueva; se muestra como etiqueta de la
  placa), `title`, `client` y además:
  - `type: "photo"` con `src` (URL de imagen). Sumá `tall: true` para tomas
    verticales.
  - `type: "video"` con `embed` y `thumb`.

Nombre, bajada, ubicación, mail, teléfono y redes están en `SITE`.

La portada muestra los primeros 3 ítems de `VIDEO_WORK` y los primeros 8 de
`PHOTO_WORK`, así que el orden en `data.js` decide qué aparece ahí. Cambiá los
`slice()` del bloque de portada en `js/main.js` para mostrar más o menos.

Formatos de URL de embed:

```
Vimeo:    https://player.vimeo.com/video/ID_DEL_VIDEO
YouTube:  https://www.youtube-nocookie.com/embed/ID_DEL_VIDEO
```

## Imágenes

Exportá JPGs para web (alrededor de 1600 px en el lado largo, calidad 75 a 80
por ciento) a `img/` y referencialas como `img/nombre.jpg`. El demo usa
placeholders de picsum.photos para que el sitio se vea sin ningún asset.

## Identidad visual

- Fondo crema `#F3EDE1`, texto marrón oscuro `#24211C`, títulos en verde
  oscuro `#2F4034` y bordó `#7A2233` para los detalles.
- Títulos en **Fraunces** (serif con cuerpo, en mayúscula) y textos en
  **Inter**. Los tokens están arriba de todo en `css/style.css`.

## Deploy

Sirve cualquier hosting estático: GitHub Pages, Netlify, Cloudflare Pages,
Vercel. Subí la carpeta `portfolio/` y apuntá el dominio ahí.
