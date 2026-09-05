/* Arma las grillas desde js/data.js y maneja el visor. */
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const page = document.body.dataset.page;

  // ---- Completa los datos del sitio (nombre, mail, links) ----
  document.querySelectorAll("[data-site]").forEach((el) => {
    const key = el.dataset.site;
    if (!(key in SITE)) return;
    if (el.tagName === "A" && key === "instagram") el.href = SITE[key];
    else if (el.tagName === "A" && key === "email") { el.href = "mailto:" + SITE.email; el.textContent = SITE.email; }
    else if (el.tagName === "A" && key === "phone") {
      // El teléfono abre WhatsApp, no el marcador del teléfono.
      el.href = "https://wa.me/" + SITE.phone.replace(/\D/g, "");
      el.target = "_blank";
      el.rel = "noopener";
      el.textContent = el.dataset.text || SITE.phone;
    }
    else el.textContent = SITE[key];
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
      iframe.src = it.embed + (it.embed.includes("?") ? "&" : "?") + "autoplay=1&rel=0";
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
    caption.innerHTML =
      `<span><strong>${esc(it.title)}</strong> · ${esc(it.client || "")}${it.role ? " · " + esc(it.role) : ""}</span>` +
      `<span>${index + 1} / ${items.length}</span>`;
    if (lb.hidden) {
      lastFocus = document.activeElement;
      lb.hidden = false;
      document.body.style.overflow = "hidden";
      $(".lb-close", lb).focus();
    }
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
    $(".lb-prev", lb).addEventListener("click", () => show(index - 1));
    $(".lb-next", lb).addEventListener("click", () => show(index + 1));
    lb.addEventListener("click", (e) => { if (e.target === lb || e.target === stage) close(); });
    document.addEventListener("keydown", (e) => {
      if (lb.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(index - 1);
      if (e.key === "ArrowRight") show(index + 1);
    });
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

  // ---- Portada (trabajos destacados, ítems reales) ----
  if (page === "home") {
    const vGrid = $("#home-video");
    const pGrid = $("#home-photo");
    const vPick = VIDEO_WORK.slice(0, 3);
    const pPick = PHOTO_WORK.slice(0, 8);
    items = [...vPick, ...pPick];
    vPick.forEach((it, i) => vGrid.appendChild(card(it, i)));
    pPick.forEach((it, i) => pGrid.appendChild(card(it, vPick.length + i)));
  }

  // ---- Página de video ----
  if (page === "video") {
    const grid = $("#grid");
    items = VIDEO_WORK;
    items.forEach((it, i) => grid.appendChild(card(it, i)));
  }

  // ---- Página de foto ----
  if (page === "photo") {
    const grid = $("#grid");
    items = PHOTO_WORK;
    if (!items.length) { grid.innerHTML = `<p class="empty">Todavía no hay nada acá.</p>`; }
    else { items.forEach((it, i) => grid.appendChild(card(it, i))); }
  }
  // =======================================================
  //  MOVIMIENTO
  //  Precarga, entrada de la portada, apariciones al scrollear.
  //  Si alguien pidió menos animación en su sistema, se apaga todo.
  // =======================================================
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function markReady() { document.body.classList.add("ready"); }

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

    if (vista || reduced) { finish(true); return; }

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

  // ---- Aparición de bloques y placas al entrar en pantalla ----
  function initReveals() {
    var sel = ".statement-kicker, " +
              ".section-head, .section-sub, .page-intro h1, .page-intro p, " +
              ".about img, .about > div, .contact h2, .contact p, .contact-links";
    var bloques = [].slice.call(document.querySelectorAll(sel));
    var placas = [].slice.call(document.querySelectorAll(".card"));
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

  // ---- La frase de la portada se enciende palabra por palabra ----
  var palabras = [];
  function initStatement() {
    var el = $(".statement-text");
    if (!el) return;
    var texto = el.textContent.trim();
    el.textContent = "";
    texto.split(/\s+/).forEach(function (w, i) {
      var span = document.createElement("span");
      span.textContent = (i ? " " : "") + w;
      el.appendChild(span);
      palabras.push(span);
    });
    if (reduced) palabras.forEach(function (w) { w.style.opacity = 1; });
  }

  function pintarPalabras() {
    if (!palabras.length || reduced) return;
    var el = $(".statement-text");
    var caja = el.getBoundingClientRect();
    var desde = window.innerHeight * 0.95;
    var hasta = window.innerHeight * 0.45;
    var avance = (desde - caja.top) / (desde - hasta);
    avance = Math.max(0, Math.min(1, avance));
    var n = palabras.length;
    palabras.forEach(function (w, i) {
      var inicio = (i / n) * 0.6;           // cada palabra arranca un poco después
      var v = (avance - inicio) / 0.3;
      w.style.opacity = Math.max(0.16, Math.min(1, v)).toFixed(3);
    });
  }

  // ---- La apertura: el nombre se desenfoca y las puertas vienen desde el fondo ----
  var apertura = $(".opening");
  var escenario = $(".opening-stage");

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
  }

  // ---- Efectos ligados al scroll ----
  function initScroll() {
    var header = $(".site-header");
    var pendiente = false;

    function update() {
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      if (header) {
        if (y > 40) header.classList.add("scrolled");
        else header.classList.remove("scrolled");
      }
      pintarApertura();
      pintarPalabras();
      pendiente = false;
    }

    window.addEventListener("scroll", function () {
      if (!pendiente) { pendiente = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
  }

  initLoader();
  initStatement();
  initReveals();
  initScroll();
})();
