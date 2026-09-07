/* =========================================================
   CONTENIDO
   Este es el único archivo que hay que tocar para sumar trabajos.
   - VIDEO_WORK  -> se muestra en video.html (videoclips, films)
   - PHOTO_WORK  -> se muestra en photo.html (comercial: restaurantes,
                    eventos, espacios). Cada ítem puede ser
                    type "photo" o type "video".
   Embeds de video: pegá la URL de embed de YouTube.
     https://www.youtube-nocookie.com/embed/ID_DEL_VIDEO
   Miniaturas e imágenes: poné los archivos en /img y referencialos
   como "img/nombre.jpg".
   Los placeholders de abajo usan picsum.photos y videos públicos
   de YouTube para que el demo se vea sin ningún asset propio.
   ========================================================= */

const SITE = {
  name: "Aurora Malenchini",
  tagline: "Directora · Fotógrafa · Creativa",
  location: "Buenos Aires, Capital Federal",
  email: "auroramalenchini@gmail.com",
  // El teléfono se renderiza como link directo a WhatsApp (wa.me).
  phone: "+54 9 11 2367 9398",
  instagram: "https://www.instagram.com/auromalenchini/",
  // Las dos imágenes grandes de la portada, una por sección.
  doors: {
    video: "img/video/gusto-a-sal/09.jpg",
    photo: "img/foto/anantara/01.jpg",
  },
};

const VIDEO_WORK = [
  {
    slug: "gusto-a-sal",
    title: "Gusto a Sal",
    client: "Maqui",
    category: "Videoclip",
    embed: "https://www.youtube.com/embed/QOTH0P_PPqc",
    thumb: "https://i.ytimg.com/vi/QOTH0P_PPqc/maxresdefault.jpg",
    role: "Dirección y edición",
    featured: true,
    // Se muestra debajo de la categoría, en el bloque del proyecto.
    premio: "Nominado a mejor coreografía en el BAMV (Buenos Aires Music Festival)",
    stills: 9,
    ar: [1.9, 1.9, 1.9, 1.9, 1.9, 1.9, 1.9, 1.9, 1.9],
  },
  {
    // Un proyecto con varias piezas: se muestra como un bloque con título.
    slug: "visualizers-gusto-a-sal",
    grupo: "Visualizers del EP Gusto a Sal",
    client: "Maqui",
    category: "Visualizers",
    role: "Dirección y edición",
    // Stills del proyecto entero: viven en img/video/visualizers-gusto-a-sal/
    stills: 13,
    ar: [1.78, 1.78, 1.78, 1.78, 1.78, 1.78, 1.78, 1.78, 1.78, 1.78, 1.78, 1.78, 1.78],
    videos: [
      {
        slug: "desenamorame",
        title: "Desenamorame",
        embed: "https://www.youtube.com/embed/lr7U2yjpUsk",
        thumb: "https://i.ytimg.com/vi/lr7U2yjpUsk/maxresdefault.jpg",
      },
      {
        slug: "nunca-te-lo-dije",
        title: "Nunca te lo dije",
        embed: "https://www.youtube.com/embed/DdJpP_VcAN8",
        thumb: "https://i.ytimg.com/vi/DdJpP_VcAN8/maxresdefault.jpg",
      },
      {
        slug: "en-la-lluvia",
        title: "En la lluvia",
        embed: "https://www.youtube.com/embed/PBJ7VX3cNhs",
        thumb: "https://i.ytimg.com/vi/PBJ7VX3cNhs/maxresdefault.jpg",
      },
    ],
  },
  {
    slug: "despues-de-apogeo",
    title: "Después de apogeo",
    client: "Swaggy J",
    category: "Fashion film",
    embed: "https://www.youtube.com/embed/TKjD4lZF9C4",
    thumb: "https://i.ytimg.com/vi/TKjD4lZF9C4/maxresdefault.jpg",
    role: "Dirección y edición",
    stills: 7,
    ar: [1.78, 1.78, 1.78, 1.78, 1.78, 1.78, 1.78],
  },
  {
    slug: "femenine-groove",
    title: "Femenine Groove",
    client: "ROBERTA",
    category: "DJ set",
    embed: "https://www.youtube.com/embed/xbZyZkbKvVo",
    thumb: "https://i.ytimg.com/vi/xbZyZkbKvVo/maxresdefault.jpg",
    role: "Dirección y edición",
    stills: 7,
    ar: [1.78, 1.78, 1.78, 1.78, 1.78, 1.78, 1.78],
  },
  {
    slug: "mi-alma",
    title: "Mi alma",
    client: "FROSONO",
    category: "Videoclip",
    embed: "https://www.youtube.com/embed/tZqkLeCPrL0",
    thumb: "https://i.ytimg.com/vi/tZqkLeCPrL0/maxresdefault.jpg",
    role: "Dirección y edición",
    stills: 7,
    ar: [1.78, 1.78, 1.78, 1.78, 1.78, 1.78, 1.78],
  },
  {
    slug: "miel",
    title: "Miel",
    client: "Suriz",
    category: "Videoclip",
    embed: "https://www.youtube.com/embed/-dCleZ4a_lc",
    thumb: "https://i.ytimg.com/vi/-dCleZ4a_lc/maxresdefault.jpg",
    role: "Dirección y edición",
    stills: 8,
    ar: [1.78, 1.78, 1.78, 1.78, 1.78, 1.78, 1.78, 1.78],
  },
  {
    slug: "dosis-de-recarga",
    title: "Dosis de recarga",
    client: "Suriz",
    category: "Videoclip",
    embed: "https://www.youtube.com/embed/ptVR8KVyf44",
    thumb: "https://i.ytimg.com/vi/ptVR8KVyf44/maxresdefault.jpg",
    role: "Dirección y edición",
    stills: 6,
    ar: [1.78, 1.78, 1.78, 1.78, 1.78, 1.78],
  },
];

/* Los stills (frames) de cada video van en img/video/<slug>/ numerados
   01.jpg, 02.jpg... Para que se muestren, agregale al proyecto:
     stills: 4,                 // cuántos hay
     ar: [1.78, 1.78, 1.78, 1.78]   // la forma de cada uno (ancho / alto)
   Si un proyecto todavía no tiene stills, se muestra la miniatura de YouTube. */

/* =========================================================
   FOTO
   Un objeto por proyecto. Las fotos viven en img/foto/<slug>/
   numeradas 01.jpg, 02.jpg... en el mismo orden de la galería;
   `fotos` es cuántas hay y `ar` la relación de aspecto de cada una
   (ancho dividido alto), que el mosaico usa para no recortarlas.
   `previa` es opcional: si está, esas son las fotos que se muestran
   en la página de Foto; si no, van las primeras.
   ========================================================= */
const PHOTO_WORK = [
  { slug: "oruga",            titulo: "Foto back de rodaje: Oruga x Galicia",                  categoria: "Rodaje",     fotos: 34,
    ar: [0.56, 0.56, 0.56, 0.56, 0.56, 1.78, 1.78, 1.78, 1.78, 1.78, 0.56, 1.78, 0.56, 0.56, 1.78, 0.56, 1.78, 0.56, 1.78, 0.56, 1.78, 1.78, 1.78, 0.56, 1.78, 1.78, 0.56, 1.78, 1.78, 1.78, 1.78, 0.56, 1.78, 0.56],
    previa: [26, 10, 5, 29, 24, 17] },
  { slug: "anantara",         titulo: "Fotografías para hotel: Anantara",            categoria: "Hotel",      fotos: 6,
    ar: [1.5, 1.5, 1.5, 1.5, 1.5, 1.5] },
  { slug: "apertura-bar",     titulo: "Fotografías para apertura de bar",            categoria: "Evento",     fotos: 19,
    ar: [0.67, 0.67, 0.67, 0.67, 0.67, 0.67, 0.67, 0.67, 0.67, 0.67, 0.67, 0.67, 0.67, 0.67, 0.67, 0.67, 0.67, 0.67, 0.67],
    previa: [1, 5, 7, 12, 11, 17] },
  { slug: "gramme",           titulo: "Fotografías para Gramme catering",            categoria: "Casamiento", fotos: 17,
    ar: [0.67, 1.5, 1.5, 0.67, 1.5, 1.5, 1.5, 1.5, 0.67, 1.5, 1.5, 0.67, 0.67, 1.5, 0.67, 1.5, 0.67] },
  { slug: "marte",            titulo: "Fotografías para bar: Marte",                 categoria: "Restaurante", fotos: 15,
    ar: [0.67, 0.67, 0.67, 0.67, 0.67, 0.67, 0.67, 1.5, 0.67, 0.67, 0.67, 0.67, 0.67, 0.67, 0.67],
    previa: [1, 8, 4, 11, 15, 9] },
  { slug: "vereda",           titulo: "Fotografías para bar: Vereda Adentro",        categoria: "Restaurante", fotos: 24,
    ar: [0.67, 0.67, 0.67, 0.67, 0.67, 0.67, 0.67, 0.67, 0.67, 0.67, 0.67, 0.67, 0.56, 0.67, 0.67, 0.67, 0.56, 0.56, 1.5, 0.56, 0.56, 0.56, 0.56, 0.56],
    previa: [3, 5, 19, 11, 15, 8] },
  { slug: "feria-salvaje",    titulo: "Fotografías para evento: Feria Salvaje",      categoria: "Evento",     fotos: 16,
    ar: [0.67, 1.5, 0.67, 0.67, 1.5, 1.5, 1.5, 0.67, 1.5, 1.5, 0.67, 0.67, 1.5, 1.5, 1.5, 0.67] },
  { slug: "psicodear-charla", titulo: "Fotografías charla y fiesta PsicodeAr",       categoria: "Evento",     fotos: 10,
    ar: [1.5, 1.33, 0.67, 0.67, 1.5, 0.67, 0.67, 0.67, 0.67, 0.67] },
  { slug: "hackaton",         titulo: "Fotografía de evento: Hackathon YHAT",         categoria: "Evento",     fotos: 15,
    ar: [1.5, 1.5, 1.5, 0.67, 0.75, 1.5, 0.67, 1.5, 0.67, 0.67, 1.5, 1.5, 0.67, 0.67, 0.67] },
  { slug: "psicodear-retiro", titulo: "Fotografías retiro PsicoDeAr",                categoria: "Evento",     fotos: 13,
    ar: [1.5, 1.5, 1.5, 0.67, 1.5, 1.5, 0.67, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5] },
  { slug: "pasteleria",       titulo: "Fotografías para pastelería",                 categoria: "Emprendimiento", fotos: 6,
    ar: [0.67, 0.67, 0.67, 0.67, 1.78, 0.67] },
];
