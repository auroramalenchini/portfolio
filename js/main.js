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
    var sel = ".page-intro h1, .page-intro p, " +
              ".about img, .about h2, .about p, .contact h2, .contact-lead, .contact-links, .contact-place";
    var bloques = [].slice.call(document.querySelectorAll(sel));
    var placas = [].slice.call(document.querySelectorAll(".card"));
    // El texto de "Sobre mí" entra de a un párrafo por vez.
    [].slice.call(document.querySelectorAll(".about h2, .about p")).forEach(function (el, i) {
      el.style.transitionDelay = (i * 130) + "ms";
    });
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

  initLoader();
  initReveals();
  initScroll();
})();
