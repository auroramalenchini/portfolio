# Sitio portfolio · Aurora Malenchini

Sitio estático para fotógrafa / directora. Sin framework y sin build:
HTML plano, un archivo CSS y dos archivos JS chicos.

```
portfolio/
  index.html      portada: apertura (nombre adelante, Video y Foto atrás),
                  trabajos destacados, sobre mí, contacto
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
  `category`, `embed` (URL de embed de YouTube), `thumb` (URL de imagen) y
  `role`. Poné `featured: true` para que ocupe todo el ancho. Si el proyecto
  tiene varias piezas, en vez de `embed` poné `grupo` (el título del bloque) y
  `videos: [...]`: se dibuja como una sección con título y las piezas en fila.
- **Página de foto**: cada objeto de `PHOTO_WORK` es un proyecto entero, con
  `slug`, `titulo`, `categoria` y `fotos` (cuántas tiene). Las imágenes van en
  `img/foto/<slug>/` numeradas `01.jpg`, `02.jpg`... en el orden en que se
  muestran. Para sumar una foto: copiala con el número que sigue y subí el
  contador. Para sumar un proyecto: carpeta nueva más una línea en la lista.

Nombre, bajada, ubicación, mail, teléfono e Instagram están en `SITE`. Las dos
imágenes grandes de la portada (las puertas a Video y a Foto) también salen de
ahí: `SITE.doors.video` y `SITE.doors.photo`.
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

- Fondo crema `#F3EDE1`, texto en marrón casi negro `#24211C`, títulos en
  marrón oscuro `#4A3527` y bordó `#7A2233` para el nombre de la portada y los
  detalles (líneas, subrayados, botón de contacto, hover).
- Tres tipografías, cada una con su trabajo: **Archivo** 800 para los títulos,
  siempre en mayúscula (`--font-display`); **Lora** 400 para los textos largos,
  la bio y la bajada de contacto (`--font-read`); e **Inter** para la
  navegación, las etiquetas y los datos chicos, nada por debajo de 400
  (`--font-sans`). Los tokens están arriba de todo en `css/style.css`.

## Movimiento

Las animaciones viven en el bloque `Movimiento` de `css/style.css` y en las tres
funciones del final de `js/main.js`:

- **Precarga**: el monograma `AM` de `index.html` se llena de abajo hacia arriba
  mientras carga la página. Se muestra una sola vez por sesión del navegador
  (queda anotado en `sessionStorage`) y tiene un corte de seguridad a los 7
  segundos por si algún recurso no responde.
- **Apertura**: la sección `.opening` mide 220vh y adentro tiene un escenario
  pegado arriba (`position: sticky`). Ese tramo de scroll es el que desenfoca el
  nombre y trae las puertas de Video y Foto desde el fondo. Las variables
  `--back-*`, `--front-*` y `--veil` las mueve `pintarApertura()` en `main.js`.
  Las puertas recién se pueden clickear cuando están casi nítidas.
- **El header**: en la portada no está desde el arranque. Entra cuando las
  puertas toman la pantalla, y ahí muestra solo Sobre mí y Contacto: Video y
  Foto se suman recién cuando las puertas dejan de estar en pantalla, o sea al
  llegar a Sobre mí. En video.html y photo.html el menú está siempre completo.
- **Llegar a una sección**: si la URL trae ancla (`index.html#about`, por
  ejemplo, que es lo que usan los links de video.html y photo.html), la portada
  saltea la precarga y la apertura y arranca directo ahí. Un script en el
  `<head>` guarda el ancla y la borra de la URL antes de que cargue nada, para
  que el navegador no haga además su propio salto (con otro margen); se la
  devuelve una vez terminada la carga. La sección queda centrada en pantalla si
  entra entera, y si no, arranca justo debajo del header. Todo en un solo
  movimiento, sin scroll animado.
- **Apariciones**: los bloques y las placas aparecen desde el fondo (crecen un
  poco, no se deslizan) al entrar en pantalla, con un escalonado entre placas
  vecinas. En "Sobre mí" el escalonado va párrafo por párrafo.
- **Volver a animar**: si tocás Sobre mí o Contacto en el menú, esa sección se
  reinicia y vuelve a entrar aunque ya la hubieras visto de refilón al
  scrollear. Al llegar desde otra página no hace falta: nunca se mostró, así
  que la anima el observador.
- **Scroll**: el header se achica al bajar.
- **Las puertas**: al pasar el cursor, esa puerta se lleva más ancho y la imagen
  crece. La otra se achica, pero no se apaga.
- **Pasaje entre páginas**: al tocar una puerta o un link del menú, la página se
  apaga en 0,3 s y recién ahí navega; la que llega entra con el mismo fundido.
  Con movimiento reducido no se intercepta nada y la navegación es directa.

Debajo de 800 px de ancho la apertura no se fija: primero el nombre, después
las puertas apiladas. Todo esto cuelga de la clase `js` que se agrega en el `<head>`: sin JavaScript
la página se ve completa y quieta. Y si el sistema pide menos animación
(`prefers-reduced-motion`), se apaga todo automáticamente.

## Deploy

Sirve cualquier hosting estático: GitHub Pages, Netlify, Cloudflare Pages,
Vercel. Subí la carpeta `portfolio/` y apuntá el dominio ahí.
