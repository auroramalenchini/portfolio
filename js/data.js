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
  tagline: "Fotógrafa, directora y creativa",
  location: "Buenos Aires, Capital Federal",
  email: "auroramalenchini@gmail.com",
  // El teléfono se renderiza como link directo a WhatsApp (wa.me).
  phone: "+54 9 11 2367 9398",
  instagram: "https://www.instagram.com/auromalenchini/",
};

const VIDEO_WORK = [
  {
    title: "Luz de Neón",
    client: "Videoclip · Artista",
    year: 2025,
    category: "Videoclip",
    embed: "https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ",
    thumb: "https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg",
    role: "Dirección, cámara, edición",
    featured: true,
  },
  {
    title: "Ciudad Dormida",
    client: "Videoclip · Banda",
    year: 2025,
    category: "Videoclip",
    embed: "https://www.youtube-nocookie.com/embed/YE7VzlLtp-4",
    thumb: "https://i.ytimg.com/vi/YE7VzlLtp-4/hqdefault.jpg",
    role: "Dirección de fotografía",
  },
  {
    title: "Verano 2024",
    client: "Videoclip · Artista",
    year: 2024,
    category: "Videoclip",
    embed: "https://www.youtube-nocookie.com/embed/eRsGyueVLvQ",
    thumb: "https://i.ytimg.com/vi/eRsGyueVLvQ/hqdefault.jpg",
    role: "Cámara, color",
  },
  {
    title: "Detrás del Vidrio",
    client: "Cortometraje",
    year: 2024,
    category: "Cortometraje",
    embed: "https://www.youtube-nocookie.com/embed/LXb3EKWsInQ",
    thumb: "https://i.ytimg.com/vi/LXb3EKWsInQ/hqdefault.jpg",
    role: "Dirección, edición",
  },
  {
    title: "Sesión en Vivo",
    client: "Sesión en vivo · Banda",
    year: 2023,
    category: "Live",
    embed: "https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ",
    thumb: "https://picsum.photos/seed/live1/960/540",
    role: "Multicámara, edición",
  },
  {
    title: "Marca de Ropa · Campaña",
    client: "Fashion film",
    year: 2023,
    category: "Fashion film",
    embed: "https://www.youtube-nocookie.com/embed/YE7VzlLtp-4",
    thumb: "https://picsum.photos/seed/fashion1/960/540",
    role: "Dirección, cámara",
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
