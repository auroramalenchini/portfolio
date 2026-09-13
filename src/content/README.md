# Cómo sumar trabajos

Todo el contenido vive acá. Un proyecto es **una carpeta con un `index.md` y
las fotos al lado**, numeradas `01.jpg`, `02.jpg`… sin saltos y en el orden en
que van en la galería. La cantidad y la forma de cada imagen salen de los
archivos: no hay listas que mantener.

**Sumar una foto a un proyecto que ya existe**: copiá el archivo en la carpeta
con el número que sigue (`35.jpg`). Nada más. Si querés que salga en la previa
de la página de Foto, agregá ese número a `preview`.

## Proyecto de foto

Carpeta `foto/<slug>/` (el slug queda en la dirección web:
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

## Proyecto de video

Carpeta `video/<slug>/` con los stills (frames) numerados, y un `index.md`:

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

## site.json

Nombre, bajada, ubicación, mail, teléfono e Instagram, más las fotos de las dos
puertas de la portada (`doors`). Las de proyectos se nombran
`foto/<slug>/<numero>` sin `.jpg`; las sueltas viven en `src/assets/doors/` y
se nombran `doors/<archivo>`.
