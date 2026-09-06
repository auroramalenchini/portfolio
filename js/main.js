/* Arma las grillas desde js/data.js y maneja el visor. */
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const page = document.body.dataset.page;

  // ---- Completa los datos del sitio (nombre, mail, links) ----
  document.querySelectorAll("[data-site]").forEach((el) => {
    const key = el.dataset.site;
    if (!(key in SITE)) return;
    var link = el.tagName === "A";
    var conHijos = el.children.length > 0;   // si trae etiqueta y dato, no lo pisamos
    if (link && key === "instagram") el.href = SITE.instagram;
    else if (link && key === "email") {
      el.href = "mailto:" + SITE.email;
      if (!conHijos) el.textContent = SITE.email;
    } else if (link && key === "phone") {
      // El teléfono abre WhatsApp, no el marcador del teléfono.
      el.href = "https://wa.me/" + SITE.phone.replace(/\D/g, "");
      el.target = "_blank";
      el.rel = "noopener";
      if (!conHijos) el.textContent = el.dataset.text || SITE.phone;
    } else if (!link) el.textContent = SITE[key];
  });

  // ---- El dato que va debajo de cada etiqueta de contacto ----
  document.querySelectorAll("[data-value]").forEach((el) => {
    var k = el.dataset.value;
    if (k === "instagram") el.textContent = "@" + SITE.instagram.replace(/\/+$/, "").split("/").pop();
    else el.textContent = SITE[k] || "";
  });
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  // ---- Imágenes de las dos puertas de la portada ----
  document.querySelectorAll("img[data-door]").forEach((el) => {
    var url = SITE.doors && SITE.doors[el.dataset.door];
    if (url) el.src = url;
  });

  // ---- Visor ----
  let items = [];   // ítems visibles en este momento
  let index = -1;
  const lb = $("#lightbox");
  const stage = lb && $(".lightbox-stage", lb);
  const caption = lb && $(".lightbox-caption", lb);
  let lastFocus = null;

  function show(i) {
    if (!lb || !items.length) return;
    index = (i + items.length) % items.length;
    const it = items[index];
    stage.innerHTML = "";
    if (it.embed) {
      const frame = document.createElement("div");
      frame.className = "frame";
      const iframe = document.createElement("iframe");
      iframe.src = it.embed + (it.embed.includes("?") ? "&" : "?") + "autoplay=1&rel=0&playsinline=1";
      iframe.allow = "autoplay; fullscreen; picture-in-picture";
      iframe.allowFullscreen = true;
      iframe.title = it.title;
      frame.appendChild(iframe);
      stage.appendChild(frame);
    } else {
      const img = document.createElement("img");
      img.src = it.src;
      img.alt = it.title;
      stage.appendChild(img);
    }
    const [desde, hasta] = limitesDelGrupo(index);
    caption.innerHTML =
      `<span><strong>${esc(it.title)}</strong> · ${esc(it.client || "")}${it.role ? " · " + esc(it.role) : ""}</span>` +
      `<span>${index - desde + 1} / ${hasta - desde + 1}</span>`;
    if (lb.hidden) {
      lastFocus = document.activeElement;
      lb.hidden = false;
      document.body.style.overflow = "hidden";
      $(".lb-close", lb).focus();
    }
  }
  // Las flechas se mueven sólo dentro del mismo proyecto: al llegar al final
  // se cierra el visor y volvés a la grilla, en vez de seguir con el proyecto
  // siguiente, que hacía parecer que era todo un mismo trabajo.
  function limitesDelGrupo(i) {
    const g = items[i] && items[i].grupo;
    let a = i, b = i;
    while (a > 0 && items[a - 1].grupo === g) a--;
    while (b < items.length - 1 && items[b + 1].grupo === g) b++;
    return [a, b];
  }

  function pasar(paso) {
    if (index < 0 || !items.length) return;
    const [desde, hasta] = limitesDelGrupo(index);
    const destino = index + paso;
    if (destino < desde || destino > hasta) { close(); return; }
    show(destino);
  }

  function close() {
    if (!lb || lb.hidden) return;
    lb.hidden = true;
    stage.innerHTML = "";  // corta la reproducción del video
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  if (lb) {
    $(".lb-close", lb).addEventListener("click", close);
    $(".lb-prev", lb).addEventListener("click", () => pasar(-1));
    $(".lb-next", lb).addEventListener("click", () => pasar(1));
    lb.addEventListener("click", (e) => { if (e.target === lb || e.target === stage) close(); });
    document.addEventListener("keydown", (e) => {
      if (lb.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") pasar(-1);
      if (e.key === "ArrowRight") pasar(1);
    });
  }

  // ---- Versalitas hechas a mano ----
  // El navegador, cuando no encuentra versalitas en la tipografía, las inventa
  // achicando la mayúscula: el trazo se afina y no pega con las mayúsculas de
  // verdad. Acá las minúsculas se escriben en mayúscula más chica pero con más
  // grosor, así las dos tienen el mismo espesor de línea.
  function versalitas(texto) {
    var salida = "", junta = "";
    var cerrar = function () {
      if (junta) { salida += '<span class="vs">' + esc(junta.toUpperCase()) + "</span>"; junta = ""; }
    };
    String(texto).split("").forEach(function (ch) {
      var esMinuscula = ch.toLowerCase() === ch && ch.toUpperCase() !== ch;
      if (esMinuscula) junta += ch;
      else { cerrar(); salida += esc(ch); }
    });
    cerrar();
    return salida;
  }

  function ponerVersalitas(el) {
    if (!el || el.querySelector(".vs")) return;
    el.innerHTML = versalitas(el.textContent);
  }

  function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  function card(it, i, extraClass = "") {
    const btn = document.createElement("button");
    btn.className = ["card", extraClass, it.tall ? "tall" : "", it.featured ? "featured" : ""].join(" ").trim();
    btn.type = "button";
    btn.setAttribute("aria-label", `${it.title}${it.embed ? " (video)" : ""}`);
    btn.innerHTML =
      `<img loading="lazy" src="${esc(it.thumb || it.src)}" alt="">` +
      (it.embed ? `<span class="play" aria-hidden="true"></span>` : "") +
      `<span class="card-meta"><span><strong>${esc(it.title)}</strong><span>${esc(it.client || "")}${it.year ? " · " + it.year : ""}</span></span>` +
      `<em>${esc(it.category || "")}</em></span>`;
    btn.addEventListener("click", () => show(i));
    return btn;
  }

  // El id de YouTube sale de la url de embed, así armamos el link para ver
  // el video en YouTube sin tener que escribirlo dos veces en data.js.
  function idDeYoutube(embed) {
    const m = /embed\/([^?&]+)/.exec(embed || "");
    return m ? m[1] : "";
  }

  function linkYoutube(v, texto) {
    const id = idDeYoutube(v.embed);
    if (!id) return null;
    const a = document.createElement("a");
    a.className = "ver-todas";
    a.href = "https://youtu.be/" + id;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = texto || "Ver en YouTube";
    return a;
  }

  // Las placas de un video: si ya tiene stills van esos y se abren como
  // fotos, con un botón de play sobre el primero para ver el video. Si el
  // proyecto todavía no tiene stills, va la miniatura de YouTube y esa sí
  // abre el video directamente.
  function placasDeVideo(v, indice, contenedor) {
    const cuantos = v.stills || 0;
    if (!cuantos) {
      const c = card(v, indice, "foto");
      c.style.setProperty("--ar", 1.78);
      contenedor.appendChild(c);
      return;
    }
    for (let n = 1; n <= cuantos; n++) {
      const src = `img/video/${v.slug}/${String(n).padStart(2, "0")}.jpg`;
      // Sin `embed`, el visor lo muestra como foto y se puede pasar de una
      // a la otra con las flechas.
      const still = { src, title: v.title, client: v.category, grupo: v.grupo || v.slug };
      items.push(still);
      const c = card(still, items.length - 1, "foto");
      c.style.setProperty("--ar", (v.ar && v.ar[n - 1]) || 1.78);
      if (n === 1) c.appendChild(botonDePlay(indice, v.title));
      contenedor.appendChild(c);
    }
  }

  // El play del primer still: es lo único que abre el reproductor.
  function botonDePlay(indice, titulo) {
    const b = document.createElement("span");
    b.className = "play play-boton";
    b.setAttribute("role", "button");
    b.setAttribute("aria-label", "Ver el video" + (titulo ? ": " + titulo : ""));
    b.tabIndex = 0;
    const abrir = (e) => { e.stopPropagation(); e.preventDefault(); show(indice); };
    b.addEventListener("click", abrir);
    b.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") abrir(e);
    });
    return b;
  }

  // ---- Página de video: un bloque por proyecto, igual que en foto ----
  if (page === "video") {
    const grid = $("#grid");
    items = [];
    VIDEO_WORK.forEach((pr, idx) => {
      const art = document.createElement("article");
      art.className = "proyecto" + (idx % 2 ? " der" : "");

      const info = document.createElement("div");
      info.className = "proyecto-info";
      const bajada = [pr.category, pr.client].filter(Boolean).join(" · ");
      info.innerHTML = `<h3>${versalitas(pr.grupo || pr.title)}</h3>` +
        `<span class="proyecto-cat">${esc(bajada)}</span>` +
        (pr.premio ? `<span class="proyecto-premio">${esc(pr.premio)}</span>` : "");

      const mosaico = document.createElement("div");
      mosaico.className = "mosaico";
      // Un proyecto de varias piezas busca filas más bajas, así las tres
      // entran una al lado de la otra en vez de una abajo de la otra.
      mosaico.dataset.alto = pr.stills
        ? "250"
        : pr.videos
          ? "190"
          : String(Math.min(430, Math.round(window.innerHeight * 0.46)));

      if (pr.videos) {
        // Un proyecto de varias piezas: un link por pieza en la columna del
        // título. Si el proyecto trae stills propios, se muestran esos y se
        // abre la primera pieza; si no, va la miniatura de cada una.
        const indices = [];
        pr.videos.forEach((v) => {
          const pieza = { ...v, client: pr.client, category: pr.category, role: pr.role,
            grupo: "pieza-" + v.slug };
          items.push(pieza);
          indices.push(items.length - 1);
        });
        if (pr.stills) {
          const portada = { ...pr.videos[0], slug: pr.slug, stills: pr.stills, ar: pr.ar,
            title: pr.grupo, client: pr.client, category: pr.category, grupo: pr.slug };
          placasDeVideo(portada, indices[0], mosaico);
        } else {
          pr.videos.forEach((v, k) => placasDeVideo(items[indices[k]], indices[k], mosaico));
        }
        pr.videos.forEach((v) => {
          const a = linkYoutube(v, v.title);
          if (a) info.appendChild(a);
        });
      } else {
        items.push({ ...pr, grupo: "pieza-" + pr.slug });
        placasDeVideo(pr, items.length - 1, mosaico);
        const a = linkYoutube(pr);
        if (a) info.appendChild(a);
      }

      art.appendChild(info);
      art.appendChild(mosaico);
      grid.appendChild(art);
    });
    if (!items.length) grid.innerHTML = `<p class="empty">Todavía no hay nada acá.</p>`;
  }

  // ---- Mosaico justificado ----
  // Agrupa las fotos en filas que llenan el ancho completo. El alto de cada
  // fila sale de las formas que le tocaron, así que unas quedan más grandes
  // que otras y ninguna se recorta. Es lo que hacen Behance o Flickr.
  function acomodarMosaico(cont) {
    const placas = [].slice.call(cont.children).filter((e) => e.classList.contains("card"));
    if (!placas.length) return;
    // Un pelo menos que el ancho real: si nos pasamos por un píxel, la fila se
    // parte y las fotos quedan chicas.
    const ancho = Math.floor(cont.getBoundingClientRect().width) - 1;
    if (ancho <= 0) return;
    const gap = parseFloat(getComputedStyle(cont).gap) || 8;
    const objetivo = parseFloat(cont.dataset.alto) || 400;
    const ars = placas.map((p) => parseFloat(p.style.getPropertyValue("--ar")) || 1.5);
    const altoDe = (f) => (ancho - gap * (f.n - 1)) / f.suma;

    // 1) agrupamos en filas: sumamos fotos hasta acercarnos al alto buscado
    const filas = [];
    let i = 0;
    while (i < placas.length) {
      let suma = 0, n = 0, alto = 0, previo = 0;
      while (i + n < placas.length) {
        previo = alto;
        suma += ars[i + n];
        n++;
        alto = (ancho - gap * (n - 1)) / suma;
        if (alto <= objetivo) break;
      }
      if (n > 1 && Math.abs(previo - objetivo) < Math.abs(alto - objetivo)) {
        n--; suma -= ars[i + n];
      }
      filas.push({ ini: i, n: n, suma: suma });
      i += n;
    }

    // 2) si la última fila quedaría desproporcionada, le pasamos fotos de la
    //    anterior hasta que entre bien. Así todas las filas llenan el ancho.
    const tope = objetivo * 1.5;
    let vueltas = 0;
    while (filas.length > 1 && altoDe(filas[filas.length - 1]) > tope && vueltas++ < 20) {
      const ult = filas[filas.length - 1];
      const prev = filas[filas.length - 2];
      if (prev.n <= 1) break;
      // probamos el movimiento y lo deshacemos si deja la fila anterior peor
      prev.n--; prev.suma -= ars[prev.ini + prev.n];
      ult.ini--; ult.n++; ult.suma += ars[ult.ini];
      if (altoDe(prev) > tope) {
        prev.suma += ars[prev.ini + prev.n]; prev.n++;
        ult.suma -= ars[ult.ini]; ult.n--; ult.ini++;
        break;
      }
    }

    // 3) aplicamos medidas
    filas.forEach((f) => {
      let alto = altoDe(f);
      const recortada = alto > tope;   // fila que quedaría gigante
      if (recortada) alto = tope;
      const h = Math.floor(alto);
      let usado = gap * (f.n - 1);
      for (let x = 0; x < f.n; x++) {
        const p = placas[f.ini + x];
        p.style.height = h + "px";
        const w = Math.floor(h * ars[f.ini + x]);
        p.style.width = w + "px";
        p.style.marginLeft = "";
        usado += w;
      }
      // si por el tope la fila no llena el ancho, la centramos
      if (recortada && usado < ancho) {
        placas[f.ini].style.marginLeft = Math.round((ancho - usado) / 2) + "px";
      }
    });
  }

  function acomodarTodos() {
    document.querySelectorAll(".mosaico").forEach(acomodarMosaico);
  }

  // Arma las placas de un proyecto de foto dentro de un contenedor.
  function fotosDe(pr, numeros, contenedor) {
    numeros.forEach((n) => {
      const it = {
        src: `img/foto/${pr.slug}/${String(n).padStart(2, "0")}.jpg`,
        title: pr.titulo,
        client: pr.categoria,
        grupo: pr.slug,
      };
      items.push(it);
      const c = card(it, items.length - 1, "foto");
      c.style.setProperty("--ar", (pr.ar && pr.ar[n - 1]) || 1.5);
      contenedor.appendChild(c);
    });
  }

  function rango(desde, hasta) {
    const v = [];
    for (let n = desde; n <= hasta; n++) v.push(n);
    return v;
  }

  // Cuántas fotos entran en una previa de dos filas: las horizontales ocupan
  // más ancho que las verticales, así que se cuenta por forma y no por cantidad.
  function cuantasEnLaPrevia(pr) {
    let suma = 0, n = 0;
    while (n < pr.fotos && suma < 5.2) { suma += (pr.ar && pr.ar[n]) || 1.5; n++; }
    return Math.max(3, Math.min(n, 8));
  }

  // ---- Página de foto: un bloque por proyecto ----
  if (page === "photo") {
    const grid = $("#grid");
    items = [];
    PHOTO_WORK.forEach((pr, idx) => {
      const art = document.createElement("article");
      art.className = "proyecto" + (idx % 2 ? " der" : "");

      const info = document.createElement("div");
      info.className = "proyecto-info";
      info.innerHTML = `<h3>${versalitas(pr.titulo)}</h3><span class="proyecto-cat">${esc(pr.categoria)}</span>`;

      const mosaico = document.createElement("div");
      mosaico.className = "mosaico";
      mosaico.dataset.alto = String(Math.min(430, Math.round(window.innerHeight * 0.46)));

      // Los proyectos cortos se muestran enteros. Si el proyecto trae una lista
      // `previa`, esas son las fotos elegidas; si no, van las primeras.
      const elegidas = pr.previa && pr.previa.length
        ? pr.previa
        : rango(1, pr.fotos <= 6 ? pr.fotos : cuantasEnLaPrevia(pr));
      fotosDe(pr, elegidas, mosaico);

      if (elegidas.length < pr.fotos) {
        const a = document.createElement("a");
        a.className = "ver-todas";
        a.href = `proyecto.html?p=${encodeURIComponent(pr.slug)}`;
        a.textContent = `Ver las ${pr.fotos} fotos`;
        info.appendChild(a);
      }

      art.appendChild(info);
      art.appendChild(mosaico);
      grid.appendChild(art);
    });
    if (!items.length) grid.innerHTML = `<p class="empty">Todavía no hay nada acá.</p>`;
  }

  // ---- Página de un proyecto: todas sus fotos ----
  if (page === "proyecto") {
    const grid = $("#grid");
    items = [];
    let slug = "";
    try { slug = new URLSearchParams(location.search).get("p") || ""; } catch (e) {}
    const pr = PHOTO_WORK.filter((x) => x.slug === slug)[0];
    if (!pr) {
      $(".page-intro h1").textContent = "Proyecto";
      $(".proyecto-bajada").textContent = "No encontramos ese proyecto.";
    } else {
      document.title = pr.titulo + " · " + SITE.name;
      $(".page-intro h1").innerHTML = versalitas(pr.titulo);
      $(".proyecto-bajada").textContent = pr.categoria + " · " + pr.fotos + " fotos";
      const mosaico = document.createElement("div");
      mosaico.className = "mosaico";
      mosaico.dataset.alto = String(Math.min(560, Math.round(window.innerHeight * 0.6)));
      fotosDe(pr, rango(1, pr.fotos), mosaico);
      grid.appendChild(mosaico);
    }
  }

  // =======================================================
  //  MOVIMIENTO
  //  Precarga, entrada de la portada, apariciones al scrollear.
  //  Si alguien pidió menos animación en su sistema, se apaga todo.
  // =======================================================
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function markReady() { document.body.classList.add("ready"); }

  // Si venís de otra página apuntando a una sección (index.html#about),
  // el destino es esa sección: ni precarga, ni recorrido por la apertura.
  var anclaGuardada = window.__ancla || null;

  function destinoDeLaUrl() {
    var h = anclaGuardada || window.location.hash;
    if (!h || h.length < 2) return null;
    try { return document.querySelector(h); } catch (e) { return null; }
  }

  // La devolvemos a la URL recién después de que el navegador terminó de cargar:
  // si estuviera antes, al terminar la carga él haría su propio salto al ancla
  // (con otro margen) y eso era el segundo movimiento que se veía.
  function restaurarAncla() {
    if (!anclaGuardada) return;
    try { if (history.replaceState) history.replaceState(null, "", anclaGuardada); } catch (e) {}
    anclaGuardada = null;
  }

  // Cuánto ocupa el header una vez que la página está scrolleada (ahí se achica).
  function altoHeader() {
    var h = $(".site-header");
    if (!h) return 0;
    var alto = h.getBoundingClientRect().height;
    return h.classList.contains("scrolled") ? alto : Math.max(0, alto - 13);
  }

  // Una sección que entra entera entra centrada; una más alta que la pantalla
  // arranca justo debajo del header, sin dejar ver la sección anterior.
  function posicionDe(destino) {
    var caja = destino.getBoundingClientRect();
    var arriba = window.pageYOffset + caja.top;
    var header = altoHeader();
    var libre = window.innerHeight - header;
    if (caja.height < libre) return arriba - header - (libre - caja.height) / 2;
    return arriba - header;
  }

  // El CSS tiene scroll suave para el resto; acá lo apagamos a propósito.
  function saltar(y) {
    var raiz = document.documentElement;
    var previo = raiz.style.scrollBehavior;
    raiz.style.scrollBehavior = "auto";
    try { window.scrollTo({ top: y, behavior: "auto" }); } catch (e) { window.scrollTo(0, y); }
    raiz.style.scrollBehavior = previo;
  }

  // Siempre directo: nada de recorrer la portada entera para llegar a una sección.
  // El header se achica al scrollear, así que lo dejamos en ese estado ANTES de
  // medir: la cuenta sale con el alto definitivo y no hace falta corregir después
  // (esa corrección era el saltito).
  // `reanimando` solo para los clics del menú: al llegar de otra página la
  // sección todavía no se mostró nunca y la anima el observador, sin reinicios.
  function irA(destino, reanimando) {
    var h = $(".site-header");
    if (h) {
      // El achique del header está animado: sin cortar la transición mediríamos
      // un alto intermedio y la cuenta saldría distinta en cada intento.
      h.style.transition = "none";
      h.classList.add("scrolled");
      void h.offsetHeight;
    }
    saltar(Math.max(0, Math.round(posicionDe(destino))));
    pintarApertura();
    if (reanimando) reanimar(destino);
    if (h) requestAnimationFrame(function () { h.style.transition = ""; });
  }

  // El navegador hace su propio salto al ancla cuando termina de cargar, y usa
  // scroll-margin-top. Repetimos el nuestro después, salvo que ya te hayas movido.
  var usuarioMovio = false;
  ["wheel", "touchstart", "keydown"].forEach(function (ev) {
    window.addEventListener(ev, function () { usuarioMovio = true; }, { passive: true, once: true });
  });

  function irAlDestino() {
    if (usuarioMovio) return;
    var destino = destinoDeLaUrl();
    if (!destino) return;
    irA(destino);
  }

  // ---- Pasaje entre páginas ----
  // Al tocar una puerta (o Video/Foto en el menú) la página se apaga y recién
  // ahí navega; la que llega entra con el mismo fundido.
  function initTransicion() {
    if (reduced) return;
    document.querySelectorAll("a[href]").forEach(function (a) {
      var ref = a.getAttribute("href") || "";
      if (!ref || ref.charAt(0) === "#") return;
      if (/^(mailto:|tel:|https?:)/i.test(ref)) return;
      if (a.target === "_blank") return;
      a.addEventListener("click", function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        document.body.classList.add("saliendo");
        setTimeout(function () { window.location.href = a.href; }, 300);
      });
    });
    // Si volvés con el botón "atrás", la página puede venir del caché apagada.
    window.addEventListener("pageshow", function () {
      document.body.classList.remove("saliendo");
    });
  }

  // Los links del menú de la misma página también van centrados.
  function initAnclas() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      var ref = a.getAttribute("href");
      if (!ref || ref.length < 2) return;
      a.addEventListener("click", function (e) {
        var destino;
        try { destino = document.querySelector(ref); } catch (err) { return; }
        if (!destino) return;
        e.preventDefault();
        irA(destino, true);
        if (history.replaceState) history.replaceState(null, "", ref);
      });
    });
  }

  // ---- Precarga con el monograma AM ----
  function initLoader() {
    var el = document.getElementById("loader");
    if (!el) { markReady(); return; }
    var fill = $(".loader-fill", el);
    var vista = false;
    try { vista = sessionStorage.getItem("am-loader") === "1"; } catch (e) {}

    function finish(instant) {
      try { sessionStorage.setItem("am-loader", "1"); } catch (e) {}
      if (fill) fill.style.setProperty("--p", "100%");
      if (instant) el.classList.add("instant");
      el.classList.add("done");
      document.body.classList.remove("loading");
      markReady();
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, instant ? 0 : 900);
    }

    if (vista || reduced || destinoDeLaUrl()) { finish(true); return; }

    document.body.classList.add("loading");
    var listo = document.readyState === "complete";
    window.addEventListener("load", function () { listo = true; });

    var inicio = performance.now(), p = 0;
    (function tick(now) {
      // Sube sola hasta 90 y espera a que termine de cargar para completar.
      var objetivo = listo ? 100 : Math.min(90, (now - inicio) / 18);
      p += (objetivo - p) * 0.1;
      if (listo && p > 99) p = 100;
      if (fill) fill.style.setProperty("--p", p.toFixed(1) + "%");
      if (p >= 99.5) { setTimeout(function () { finish(false); }, 280); return; }
      if (now - inicio > 7000) { finish(false); return; }  // red de seguridad
      requestAnimationFrame(tick);
    })(performance.now());
  }

  // El texto de "Sobre mí" entra de a un párrafo por vez.
  function escalonarAbout() {
    [].slice.call(document.querySelectorAll(".about h2, .about p")).forEach(function (el, i) {
      el.style.transitionDelay = (i * 130) + "ms";
    });
  }

  function limpiarDelays(els) {
    setTimeout(function () {
      els.forEach(function (el) { el.style.transitionDelay = ""; });
    }, 1300);
  }

  // Al saltar a una sección la volvemos a animar: si ya se había revelado de
  // refilón mientras scrolleabas, igual la ves entrar.
  function reanimar(seccion) {
    if (reduced || !seccion) return;
    var els = [].slice.call(seccion.querySelectorAll(".reveal"));
    if (!els.length) return;
    // Volver al estado oculto sin animar: si no, lo que ya estaba visible se
    // desvanecería de a poco en vez de arrancar de cero.
    els.forEach(function (el) {
      el.style.transition = "none";
      el.style.transitionDelay = "";
      el.classList.remove("in");
    });
    void seccion.offsetHeight;
    els.forEach(function (el) { el.style.transition = ""; });
    if (seccion.classList.contains("about")) escalonarAbout();
    else els.forEach(function (el, i) { el.style.transitionDelay = (i * 90) + "ms"; });
    requestAnimationFrame(function () {
      els.forEach(function (el) { el.classList.add("in"); });
      limpiarDelays(els);
    });
  }

  // ---- Aparición de bloques y placas al entrar en pantalla ----
  function initReveals() {
    var sel = ".page-intro h1, .page-intro p, .intro-fotos img, " +
              ".about img, .about h2, .about p, .contact h2, .contact-lead, .contact-links, .contact-place";
    var bloques = [].slice.call(document.querySelectorAll(sel));
    var placas = [].slice.call(document.querySelectorAll(".card"));
    escalonarAbout();
    bloques.forEach(function (el) { el.classList.add("reveal"); });
    placas.forEach(function (el, i) {
      el.classList.add("reveal");
      el.style.transitionDelay = (i % 8) * 55 + "ms";
    });
    var todos = bloques.concat(placas);

    if (reduced || !("IntersectionObserver" in window)) {
      todos.forEach(function (el) { el.classList.add("in"); el.style.transitionDelay = ""; });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        el.classList.add("in");
        io.unobserve(el);
        // El retardo era solo para la entrada: si queda, el hover se siente pegajoso.
        setTimeout(function () { el.style.transitionDelay = ""; }, 1100);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });
    todos.forEach(function (el) { io.observe(el); });
  }

  // ---- La apertura: el nombre se desenfoca y las puertas vienen desde el fondo ----
  var apertura = $(".opening");
  var escenario = $(".opening-stage");
  var header = $(".site-header");
  if (apertura && header) document.body.classList.add("tiene-apertura");

  // En la portada el header entra recién cuando las puertas toman la pantalla.
  function mostrarHeader(si) {
    if (!header) return;
    if (si) header.classList.add("visible");
    else header.classList.remove("visible");
  }

  // ¿Las puertas ya dejaron de ocupar la pantalla? Recién ahí tiene sentido
  // ofrecer Video y Foto también arriba. El corte es cuando queda menos de
  // media pantalla de apertura, así al caer centrado en Sobre mí ya está.
  function aperturaAtras() {
    if (!apertura || !header) return true;
    return apertura.getBoundingClientRect().bottom <= window.innerHeight * 0.45;
  }

  function menuCompleto() {
    if (!header) return;
    if (aperturaAtras()) header.classList.add("completo");
    else header.classList.remove("completo");
  }

  function aperturaFija() {
    // En pantallas chicas y con movimiento reducido no se fija nada: se apila.
    return apertura && escenario && !reduced && window.innerWidth > 800;
  }

  function pintarApertura() {
    if (!apertura || !escenario) return;
    if (!aperturaFija()) {
      ["--back-scale", "--back-blur", "--back-op", "--veil",
       "--front-op", "--front-blur", "--front-scale"].forEach(function (v) {
        escenario.style.removeProperty(v);
      });
      escenario.classList.add("enfoque");
      // Apilado: el header entra cuando pasaste la pantalla del nombre.
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      mostrarHeader(reduced || y > window.innerHeight * 0.55);
      menuCompleto();
      return;
    }
    var caja = apertura.getBoundingClientRect();
    var recorrido = apertura.offsetHeight - window.innerHeight;
    var avance = recorrido > 0 ? Math.max(0, Math.min(1, -caja.top / recorrido)) : 0;
    // Termina antes del final para que quede un tramo con las puertas nítidas.
    var t = Math.max(0, Math.min(1, avance / 0.72));
    var suave = t * t * (3 - 2 * t);      // arranca y termina suave

    escenario.style.setProperty("--back-scale", (0.8 + 0.2 * suave).toFixed(4));
    escenario.style.setProperty("--back-blur", (18 * (1 - suave)).toFixed(2) + "px");
    escenario.style.setProperty("--back-op", (0.5 + 0.5 * suave).toFixed(3));
    escenario.style.setProperty("--veil", (0.72 * (1 - suave)).toFixed(3));
    escenario.style.setProperty("--front-op", Math.max(0, 1 - t * 1.2).toFixed(3));
    escenario.style.setProperty("--front-blur", (11 * Math.min(1, t * 1.2)).toFixed(2) + "px");
    escenario.style.setProperty("--front-scale", (1 - t * 0.07).toFixed(4));
    // Recién cuando están casi nítidas se pueden clickear.
    if (t > 0.55) escenario.classList.add("enfoque");
    else escenario.classList.remove("enfoque");
    mostrarHeader(t > 0.5);
    menuCompleto();
  }

  // ---- Efectos ligados al scroll ----
  function initScroll() {
    var pendiente = false;

    function update() {
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      if (header) {
        if (y > 40) header.classList.add("scrolled");
        else header.classList.remove("scrolled");
      }
      pintarApertura();
      pendiente = false;
    }

    window.addEventListener("scroll", function () {
      if (!pendiente) { pendiente = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
  }

  // El mosaico se calcula con el ancho real, así que se rehace al cambiar de tamaño.
  if (document.querySelector(".mosaico")) {
    acomodarTodos();
    let t;
    window.addEventListener("resize", function () {
      clearTimeout(t);
      t = setTimeout(acomodarTodos, 120);
    });
    window.addEventListener("load", acomodarTodos);
  }

  // Flecha flotante para volver al principio: aparece recién cuando ya
  // scrolleaste más de una pantalla y media.
  function initArriba() {
    if (page !== "photo" && page !== "video" && page !== "proyecto") return;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "arriba";
    b.setAttribute("aria-label", "Volver arriba");
    b.addEventListener("click", function () {
      const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: suave ? "smooth" : "auto" });
    });
    document.body.appendChild(b);
    let visible = false;
    const revisar = function () {
      const debe = window.scrollY > window.innerHeight * 1.5;
      if (debe !== visible) { visible = debe; b.classList.toggle("se-ve", debe); }
    };
    revisar();
    window.addEventListener("scroll", revisar, { passive: true });
  }

  // Los títulos que ya están escritos en el html, más el nombre del header.
  [".brand [data-site='name']", ".door-label", ".page-intro h1",
   ".about h2", ".contact h2", ".opening-front h1 .line > span"]
    .forEach(function (sel) { document.querySelectorAll(sel).forEach(ponerVersalitas); });

  initArriba();
  initLoader();
  initReveals();
  initScroll();
  initAnclas();
  initTransicion();
  irAlDestino();
  window.addEventListener("load", function () {
    irAlDestino();
    setTimeout(function () { irAlDestino(); restaurarAncla(); }, 200);
  });
})();
