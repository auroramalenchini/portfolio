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
    video: "https://i.ytimg.com/vi/QOTH0P_PPqc/maxresdefault.jpg",
    photo: "https://picsum.photos/seed/doorphoto/1600/1200",
  },
};

const VIDEO_WORK = [
  {
    title: "GUSTO A SAL",
    client: "Maqui",
    category: "Videoclip",
    embed: "https://www.youtube.com/embed/QOTH0P_PPqc",
    thumb: "https://i.ytimg.com/vi/QOTH0P_PPqc/maxresdefault.jpg",
    role: "Dirección y edición",
    featured: true,
  },
  {
    title: "MI ALMA",
    client: "FROSONO",
    category: "Videoclip",
    embed: "https://www.youtube.com/embed/tZqkLeCPrL0",
    thumb: "https://i.ytimg.com/vi/tZqkLeCPrL0/maxresdefault.jpg",
    role: "Dirección y edición",
  },
  {
    title: "DESPUÉS DE APOGEO",
    client: "Swaggy J",
    category: "Fashion film",
    embed: "https://www.youtube.com/embed/TKjD4lZF9C4",
    thumb: "https://i.ytimg.com/vi/TKjD4lZF9C4/maxresdefault.jpg",
    role: "Dirección y edición",
  },
  {
    title: "MIEL",
    client: "Suriz",
    category: "Videoclip",
    embed: "https://www.youtube.com/embed/-dCleZ4a_lc",
    thumb: "https://i.ytimg.com/vi/-dCleZ4a_lc/maxresdefault.jpg",
    role: "Dirección y edición",
  },
  {
    title: "DOSIS DE RECARGA",
    client: "Suriz",
    category: "Videoclip",
    embed: "https://www.youtube.com/embed/ptVR8KVyf44",
    thumb: "https://i.ytimg.com/vi/ptVR8KVyf44/maxresdefault.jpg",
    role: "Dirección y edición",
  },
  {
    title: "FEMENINE GROOVE",
    client: "ROBERTA",
    category: "DJ set",
    embed: "https://www.youtube.com/embed/xbZyZkbKvVo",
    thumb: "https://i.ytimg.com/vi/xbZyZkbKvVo/maxresdefault.jpg",
    role: "Dirección y edición",
  },
];

const PHOTO_WORK = [
  // ---- Restaurantes ----
  { type: "photo", category: "Restaurantes", title: "Cocina Abierta · Platos", client: "Restaurante Sur", src: "https://picsum.photos/seed/rest1/1600/1067" },
  { type: "photo", category: "Restaurantes", title: "Barra · Noche", client: "Bar Central", src: "https://picsum.photos/seed/rest2/1067/1600", tall: true },
  { type: "photo", category: "Restaurantes", title: "Panadería · Mañana", client: "Panadería Norte", src: "https://picsum.photos/seed/rest3/1600/1067" },
  { type: "video", category: "Restaurantes", title: "Restaurante Sur · Reel", client: "Restaurante Sur", embed: "https://www.youtube-nocookie.com/embed/eRsGyueVLvQ", thumb: "https://picsum.photos/seed/rest4/1600/1067" },

  // ---- Eventos ----
  { type: "photo", category: "Eventos", title: "Lanzamiento de producto", client: "Marca X", src: "https://picsum.photos/seed/event1/1600/1067" },
  { type: "video", category: "Eventos", title: "Festival · Aftermovie", client: "Festival Y", embed: "https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ", thumb: "https://picsum.photos/seed/event2/1600/1067" },
  { type: "photo", category: "Eventos", title: "Conferencia anual", client: "Empresa Z", src: "https://picsum.photos/seed/event3/1067/1600", tall: true },
  { type: "photo", category: "Eventos", title: "Casamiento · Ceremonia", client: "Privado", src: "https://picsum.photos/seed/event4/1600/1067" },

  // ---- Espacios ----
  { type: "photo", category: "Espacios", title: "Salón · Vista general", client: "Espacio Río", src: "https://picsum.photos/seed/venue1/1600/1067" },
  { type: "photo", category: "Espacios", title: "Terraza · Atardecer", client: "Espacio Río", src: "https://picsum.photos/seed/venue2/1600/1067" },
  { type: "video", category: "Espacios", title: "Espacio Río · Recorrido", client: "Espacio Río", embed: "https://www.youtube-nocookie.com/embed/YE7VzlLtp-4", thumb: "https://picsum.photos/seed/venue3/1600/1067" },
  { type: "photo", category: "Espacios", title: "Galería · Montaje", client: "Galería Norte", src: "https://picsum.photos/seed/venue4/1067/1600", tall: true },
];
