# aurora.malenchini.ar

Tu sitio. Tres páginas: la portada (con las dos puertas, Sobre mí y Contacto),
**Video** y **Foto**, más una página propia por cada proyecto de foto.

Todo el contenido vive en `src/content/`. **Un proyecto es una carpeta con un
`index.md` y las fotos al lado**, numeradas `01.jpg`, `02.jpg`… sin saltos y en
el orden en que van en la galería. La cantidad, la forma y el tamaño de cada
imagen salen de los archivos: no hay listas que mantener, y el sitio genera
solo las versiones chicas para el celular.

Exportá los jpg para web: 1600 px en el lado largo, calidad 75 a 80.

## Sumar una foto a un proyecto que ya existe

Copiá el archivo en la carpeta con el número que sigue (`35.jpg`). Nada más.
Si querés que salga en la previa de la página de Foto, agregá ese número a
`preview`.

## Un proyecto de foto nuevo

Carpeta `src/content/foto/<slug>/` (el slug queda en la dirección web:
`aurora.malenchini.ar/foto/<slug>/`), las fotos numeradas dentro, y un
`index.md`:

```yaml
---
title: "Fotografías para bar: Marte"   # va entre comillas
category: "Restaurante"                # el rubro: Evento, Hotel, Rodaje…
order: 5                               # puesto en la página de Foto, sin repetir
preview: [1, 8, 4, 11, 15, 9]          # opcional: qué fotos van en la previa
---
```

Sin `preview` se muestran las primeras seis.

## Un proyecto de video nuevo

Carpeta `src/content/video/<slug>/` con los stills (fotogramas) numerados, y un
`index.md`:

```yaml
---
title: "Gusto a Sal"
client: "Maqui"                        # para quién es el trabajo
category: "Videoclip"
youtube: "QOTH0P_PPqc"                 # las 11 letras del final del link
order: 1
award: "Nominado a mejor coreografía en el BAMV"   # opcional
credits:                               # opcional, sólo las que correspondan
  direccion: "Aurora Malenchini"
  fotografia: "Charo Martínez"
  arte: "Ludmila Muñoz Catovsky"
mobileLimit: 7                         # opcional: cuántos stills en el teléfono
---
```

`mobileLimit` evita que el bloque quede larguísimo en el celular; en pantalla
grande siguen apareciendo todos. Si el proyecto son varias piezas, en vez de
`youtube` poné `pieces` y se arma un solo bloque con un link por pieza:

```yaml
pieces:
  - title: "Desenamorame"
    youtube: "lr7U2yjpUsk"
```

**Sumar un still**: copialo en la carpeta del proyecto con el número que sigue,
igual que una foto.

## Cambiar las puertas y los datos de contacto

Todo en `src/content/site.json`: nombre, bajada, ubicación, mail, teléfono
(se convierte solo en link de WhatsApp, alcanza con el código de país) e
Instagram. Y las fotos que se van pasando en las dos puertas de la portada,
en `doors`: las de proyectos se nombran `foto/<slug>/<numero>` o
`video/<slug>/<numero>` **sin** el `.jpg`; las sueltas viven en
`src/assets/doors/` y se nombran `doors/<archivo>`.

## Publicar

1. Guardá los cambios en git (commit).
2. Doble click en **SUBIR A GITHUB.command**, o `git push`.

De ahí en adelante se publica solo: en un par de minutos el sitio está
actualizado. Si algo de las pruebas falla, la publicación no sale y GitHub
avisa por mail.

## Verlo en la compu antes de publicar

La primera vez, una sola vez:

```
npm install
```

Después, cada vez:

```
npm run dev
```

y abrí la dirección que aparece (`http://localhost:4321`). Se actualiza solo
mientras editás.

---

## Para quien toque el código

- **Astro 5**, salida estática, cero JavaScript salvo el visor, las puertas y
  las apariciones. `src/pages/` son las páginas, `src/components/` las piezas,
  `src/lib/` la lógica (esquemas, resolución de imágenes y puertas).
- **Tokens**: colores, tipografías, escala de espacio (`--s-1`…`--s-8`) y de
  tipo (`--t-1`…`--t-6`) viven en `src/styles/tokens.css`. Ningún `clamp()`
  fuera de ese archivo: si hace falta una medida nueva, se agrega al token.
- **Visor (`Lightbox.astro`)**: un `<dialog>` por página. Cualquier elemento
  con `data-lb="<grupo>"` lo abre; las flechas se mueven sólo dentro del mismo
  grupo. La pieza aporta `data-lb-src` + `data-lb-w`/`data-lb-h` (foto) o
  `data-lb-youtube` (video), más `data-lb-title` y `data-lb-sub` para el pie.
- **Imágenes**: `<Picture>` con 480/960/1600 en avif y jpeg. El `postbuild`
  (`scripts/prune-dist.mjs`) borra de `dist/_astro` los originales que ninguna
  página referencia: son unos 60 MB que nadie descarga.
- **Pruebas**: `npm test` corre `astro check`, el build, `html-validate`,
  vitest (esquemas, numeración, imágenes del build) y Playwright en tres
  tamaños con dedo y con mouse. `npm run test:lh` corre Lighthouse con
  presupuestos (performance ≥ 90 en móvil, CLS ≤ 0,05, LCP ≤ 2,5 s, imágenes
  ≤ 800 KB en la portada y ≤ 1,5 MB en `/foto/`); tarda minutos y va aparte.

### Pasar el sitio a esta versión (fase 8 del PLAN.md)

1. Merge de `v2` a `master`.
2. En Settings → Pages del repositorio, cambiar el origen de "Deploy from a
   branch" a **GitHub Actions**. El workflow `deploy.yml` publica.
3. Verificar `/`, `/video/`, `/foto/`, un proyecto y que `photo.html` redirija.
4. Correr Playwright una vez contra el dominio en vivo.
5. Conservar el tag `v1` y borrar la rama `v2`.
