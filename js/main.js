/* Arma las grillas desde js/data.js y maneja el visor. */
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const page = document.body.dataset.page;

  // ---- Completa los datos del sitio (nombre, mail, links) ----
  document.querySelectorAll("[data-site]").forEach((el) => {
    const key = el.dataset.site;
    if (!(key in SITE)) return;
    if (el.tagName === "A" && (key === "instagram" || key === "vimeo")) el.href = SITE[key];
    else if (el.tagName === "A" && key === "email") { el.href = "mailto:" + SITE.email; el.textContent = SITE.email; }
    else if (el.tagName === "A" && key === "phone") { el.href = "tel:" + SITE.phone.replace(/[^+\d]/g, ""); el.textContent = SITE.phone; }
    else el.textContent = SITE[key];
  });
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

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
})();
