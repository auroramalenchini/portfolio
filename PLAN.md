# Plan: rebuild of aurora.malenchini.ar

Rebuild the implementation, keep the design. The palette, the type pairing, the
sticky project title beside a justified mosaic, the alternating sides, the
opening with the name in front of Video and Foto: all of that stays. What
changes is how it is built, so that adding a photo is "drop a file in a
folder" and every page ships as real HTML with properly sized images.

Current state and the reasons for this plan are in the review that produced it
(client-rendered galleries, hand-typed aspect ratios, 62 MB of unsized JPEGs,
a JS layout engine for the mosaic, 120 lines of anchor-scroll workarounds, a
hero that fights touch devices). This document only says what to do about it.

## Decisions taken up front

These are the choices that shape everything else. Change them here, before
Phase 1, or not at all.

| Decision | Choice | Why |
|---|---|---|
| Generator | Astro 5, static output | Components remove the 4x duplication, content collections replace `data.js`, `astro:assets` reads image sizes and emits srcset. Ships zero JS unless we add it. |
| Styling | Plain CSS with tokens and a spacing/type scale. No Tailwind. | One theme, ~15 tokens. The mess was drift and behavior, not CSS organization. A scale as CSS variables removes the drift. |
| Hosting | GitHub Pages via Actions build, same domain | Nothing changes for the owner. The double-click push script keeps working. |
| URLs | `/`, `/video/`, `/foto/`, `/foto/<slug>/` | Real project URLs instead of `proyecto.html?p=slug`. Old paths get redirect pages. |
| Mosaic | CSS flex, grow proportional to aspect ratio | No resize handler, no pixel math, no layout shift. Last row is left at natural size, which is the one visible difference from today. |
| Lightbox | Native `<dialog>` + ~80 lines of JS | Focus trap, Escape and backdrop come free. Swipe stays, ported from the current code. |
| Page fade | `@view-transition { navigation: auto }` | One CSS rule replaces the link-intercepting script. Browsers without it navigate normally. |
| Header | Constant height, always visible, sticky | Deletes the anchor machinery, the show/hide logic and the menu items that pop in mid-scroll. On the home it sits over the hero. |
| Hero | Stacked layout is the base. The scroll-driven blur is an enhancement for `(hover: hover) and (pointer: fine)` under `@supports (animation-timeline: scroll())` | Touch was the fallback and it broke repeatedly. Now it is the default and the desktop effect is the extra. |
| Small caps | Same look, generated at build time by a `<SmallCaps>` component | Archivo has no real small caps. Keeping the hand-made version is fine; doing it in the browser is not. |
| Fonts | Self-hosted via `@fontsource` (Archivo variable, Inter 400/600, Lora 400) | Removes the Google Fonts round trips and the flash on load. |
| Images | Build generates 480 / 960 / 1600 widths in AVIF + JPEG, with width/height attributes | This is the single largest win. Expect 5 to 10x less transfer per page. |
| Content | One folder per project with a small `index.md` and the images beside it | Aspect ratio, count and order come from the files. No arrays to maintain. |

## Target layout

```
portfolio/
  astro.config.mjs
  package.json
  public/
    CNAME                  aurora.malenchini.ar
    favicon.svg, icons
  src/
    styles/
      tokens.css           colors, fonts, spacing scale, type scale
      base.css             reset, body, headings, links
    components/
      Header.astro  Footer.astro  Seo.astro
      SmallCaps.astro       versalitas at build time
      Mosaic.astro          the justified grid, CSS only
      Lightbox.astro        <dialog> + script
      ProjectBlock.astro    title column + mosaic, alternating sides
      Doors.astro  Opening.astro
    layouts/Base.astro
    pages/
      index.astro
      video/index.astro
      foto/index.astro
      foto/[slug].astro
      404.astro
    content.config.ts      collection schemas
    content/
      site.json            name, tagline, contact, doors
      foto/<slug>/index.md + 01.jpg 02.jpg ...
      video/<slug>/index.md + 01.jpg ...  (stills)
  tests/
    e2e/*.spec.ts          Playwright
    content.test.ts        Vitest, schema and file checks
  .github/workflows/
    deploy.yml             build + deploy on push to master
    check.yml              tests on every push
```

### Content shape

`src/content/foto/oruga/index.md`

```yaml
---
title: "Foto back de rodaje: Oruga x Galicia"
category: Rodaje
order: 1
preview: [26, 10, 5, 29, 24, 17]   # optional; default is the first six
---
```

`src/content/video/gusto-a-sal/index.md`

```yaml
---
title: Gusto a Sal
client: Maqui
category: Videoclip
youtube: QOTH0P_PPqc
order: 1
award: Nominado a mejor coreografía en el BAMV (Buenos Aires Music Festival)
credits:
  direccion: Aurora Malenchini
  fotografia: Charo Martínez
  arte: Ludmila Muñoz Catovsky
mobileLimit: 7                      # optional
pieces:                             # optional, for multi-video projects
  - { title: Desenamorame, youtube: lr7U2yjpUsk }
---
```

Photos and stills live next to `index.md` as `01.jpg`, `02.jpg`, and so on.
The build reads them with `import.meta.glob`, sorts by name, and gets width
and height from the file. Adding a photo is adding a file.

## Phases

Each phase ends with its tests green and a commit. Work on a `v2` branch;
master keeps serving the current site until the cutover in Phase 8.

### Phase 0: prerequisites and baseline

- Install Node 22 LTS (this machine has none). Use the official installer
  or `nvm`. Verify with `node --version`.
- Tag the current site: `git tag v1` and push the tag.
- Capture baseline screenshots of the live site at 1440, 1024 (touch) and
  390 px for the home, `/video.html`, `/photo.html` and one project page.
  Save under `tests/baseline/`. These are the visual reference for every later
  phase.
- Write a one-off script that converts `js/data.js` into the content folders
  above, moving images from `img/foto/<slug>/` and `img/video/<slug>/`. Run
  it once, check the counts match, delete the script.

Done when: Node runs, `v1` tag exists, baselines saved, content folders
populated with every image accounted for.

### Phase 1: skeleton, tokens, deploy pipeline

- `npm create astro@latest`, minimal template, static output, `site` set to
  the domain.
- `tokens.css`: the current colors, the three fonts, a spacing scale
  (`--s-1` … `--s-8`) and a type scale (`--t-1` … `--t-6`). Every later
  stylesheet uses the scale. No ad hoc `clamp()` outside `tokens.css`.
- `Base.astro` layout with `Seo.astro` (title, description, canonical, OG
  image, favicons, theme-color).
- `Header.astro` and `Footer.astro`. Header is sticky, constant height,
  `scroll-padding-top` on `html` equal to that height.
- Fonts via `@fontsource`.
- `deploy.yml` using `withastro/action`, deploying to Pages on push to
  master. Do not switch the Pages source yet; only confirm the workflow
  builds green on the `v2` branch.
- `check.yml` running `npm test` on every push.

Tests introduced:
- `astro check` and `astro build` pass in CI.
- Playwright smoke: every page returns 200, has one `h1`, no console errors.
- `html-validate` on the built HTML.

### Phase 2: photo pages and the image pipeline

- `content.config.ts` with zod schemas for `foto` and `video`.
- `Mosaic.astro`: takes a list of `{ image, alt }`, renders `<Picture>` with
  `widths=[480, 960, 1600]`, `formats=['avif','jpeg']`, `sizes` matched to
  the layout, `loading="lazy"` except the first row. Each item gets
  `--ar` from the image metadata. CSS:

  ```css
  .mosaic { display: flex; flex-wrap: wrap; gap: var(--s-2); --row: 260px; }
  .mosaic > * {
    flex: calc(var(--ar) * 1000) 1 calc(var(--ar) * var(--row));
    aspect-ratio: var(--ar); min-width: 0;
  }
  .mosaic::after { content: ""; flex: 1000000 1 0; } /* keeps the last row at natural size */
  ```

- `ProjectBlock.astro`: sticky title column, category, "Ver las N fotos"
  link, alternating sides via `:nth-child(even)`, stacked below 800 px.
- `/foto/` lists projects with their preview selection. `/foto/[slug]/`
  shows every photo.
- Redirect pages for `photo.html` and `proyecto.html?p=…` via Astro
  `redirects` (the query string cannot be matched; `proyecto.html` redirects
  to `/foto/`).

Tests introduced:
- Vitest `content.test.ts`: every project folder has an `index.md` that
  passes the schema, at least one image, contiguous numbering with no gaps,
  every `preview` index exists, no two projects share an `order`.
- Playwright: `/foto/<slug>/` renders exactly as many `<img>` as files in the
  folder; the preview on `/foto/` renders `preview.length` images.
- Playwright: no image request returns 404 on any page (collect network
  responses).
- Playwright: every `<img>` has `width`, `height` and a `srcset`.
- Playwright: at 390 px no page scrolls horizontally
  (`document.documentElement.scrollWidth <= innerWidth`).
- Playwright: mosaic rows fill the container width within 2 px, except the
  last row.

### Phase 3: video page

- `/video/`: same `ProjectBlock`, stills from the folder, play button on the
  first still opens the video in the lightbox, "Ver en YouTube" links per
  piece. Multi-piece projects render one block with one link per piece.
- `mobileLimit` hides stills past N below 800 px with CSS
  (`:nth-child(n+N+1)`), not JS.

Tests introduced:
- Vitest: every `youtube` id matches `^[\w-]{11}$`; every piece has a title.
- Playwright: play button has an accessible name and is not nested inside
  another interactive element (html-validate covers the nesting).
- Playwright at 390 px: a project with `mobileLimit: 6` shows six stills; at
  1440 px it shows all of them.

### Phase 4: lightbox

- `Lightbox.astro`: one `<dialog>` per page. Cards are `<button>`s carrying
  `data-index`; a small script fills the dialog with the 1600 px image or the
  YouTube iframe, updates the caption and counter, and handles previous and
  next within the same project only (current behavior). Port the swipe
  handler as is. Close on Escape, backdrop click, close button.
- Arrow buttons use the dark circle on touch devices, as today.

Tests introduced:
- Playwright: click a card, dialog is open, focus is inside it, Escape closes
  it and focus returns to the card.
- Playwright: ArrowRight advances the counter; at the last item of a project
  ArrowRight closes the dialog instead of jumping to the next project.
- Playwright with touch emulation: a horizontal swipe of 80 px advances; a
  swipe of 20 px does not.
- Playwright: opening a video card injects an iframe on `youtube-nocookie.com`
  with `autoplay=1`; closing removes it.
- axe (`@axe-core/playwright`) on the open dialog: no serious or critical
  violations.

### Phase 5: home

- `Opening.astro` with the stacked layout as the base: name and tagline,
  then the two doors one above the other. Doors rotate their photos with the
  current fade; the Video door plays the short clip. No picsum placeholders;
  the first image is in the HTML.
- Desktop enhancement inside `@media (hover: hover) and (pointer: fine)` and
  `@supports (animation-timeline: scroll())`: the 220vh sticky stage with
  the blur and scale driven by `animation-timeline: scroll()`. No scroll
  listener. If the effect cannot be made smooth without `filter: blur()` on
  a full-screen element, drop the blur and keep only scale and opacity;
  measure before deciding.
- About and Contact sections as today. Contact links built at build time
  from `site.json` (WhatsApp `wa.me`, Instagram, mailto).
- Reveal-on-scroll with `IntersectionObserver`, delays capped at 300 ms so
  content is never invisible for a second, fully disabled under
  `prefers-reduced-motion`.

Tests introduced:
- Playwright with touch emulation at 1024 px and 390 px: a single tap on the
  Video door navigates to `/video/`. This is the bug that cost the most
  commits; it gets a permanent test.
- Playwright at 1440 px with a mouse: doors are side by side; at 1024 px
  touch they are stacked.
- Playwright: `/video/` header link "Sobre mí" lands with the section's top
  at or below the header bottom.
- Playwright with `reducedMotion: 'reduce'`: no element has a running
  animation or transition after load; all content is visible.
- Playwright: no request to `picsum.photos` or `fonts.googleapis.com` on any
  page.

### Phase 6: polish

- `@view-transition { navigation: auto }` in `base.css`.
- `404.astro`, sitemap via `@astrojs/sitemap`, `robots.txt`, OG image per
  page (a still for projects, the door photo for the home).
- Delete everything from v1 that is not content: `js/`, `css/`, the four
  HTML files, `_seleccion.txt`, the `.command` scripts that reference the
  old paths (keep `SUBIR A GITHUB.command`, it still works), the `Claude
  outputs/` and `Fotos mias/` folders if they are not needed in the repo.
- README rewritten in Spanish for the owner: how to add a photo project, a
  video project, a still, and how to publish.

Tests introduced:
- Playwright: every internal link on every page resolves to 200.
- Lighthouse CI on the built site with budgets: performance ≥ 90 on mobile,
  CLS ≤ 0.05, LCP ≤ 2.5 s on simulated 4G, image bytes ≤ 1.5 MB on
  `/foto/` and ≤ 800 KB on `/`.

### Phase 7: visual review

- Re-take the Phase 0 screenshots against the v2 preview and compare side by
  side with the baselines. Differences should be intentional: last mosaic
  row, header always visible, no menu items popping in. Fix anything else.
- Commit the v2 screenshots as `tests/e2e/__snapshots__/` and turn them into
  Playwright `toHaveScreenshot` assertions with a 0.2 % threshold, so future
  changes to spacing or type show up as diffs.

### Phase 8: cutover

1. Merge `v2` into master.
2. In the repository settings, switch Pages source from "branch" to "GitHub
   Actions". The deploy workflow runs and publishes.
3. Verify `https://aurora.malenchini.ar/`, `/video/`, `/foto/`, one project,
   and that `photo.html` redirects.
4. Run the full Playwright suite against the live domain once.
5. Keep the `v1` tag. Delete the `v2` branch.

## Test tooling summary

| Tool | What it covers | Runs |
|---|---|---|
| `astro check` | TypeScript and component props | every push |
| Vitest | content schema, file numbering, preview indices, YouTube ids | every push |
| html-validate | valid HTML, no nested interactive elements | every push |
| Playwright (Chromium + WebKit, three viewports, touch and mouse projects) | rendering, counts, 404s, lightbox, swipe, one-tap doors, anchors, reduced motion, overflow, visual snapshots | every push |
| @axe-core/playwright | accessibility on each page and on the open lightbox | every push |
| Lighthouse CI | performance, CLS, LCP, image weight budgets | every push, on the built site |

`npm test` runs all of it locally in under two minutes. CI blocks the deploy
workflow on failure.

## What is out of scope

- Redesign. Colors, type, section order and the project block layout are
  unchanged.
- A CMS. The owner adds folders and files; that is the CMS.
- Analytics, contact forms, i18n.
- Changing hosting. GitHub Pages stays.

## Risks and how they are handled

- **Scroll-driven animations in Firefox.** Firefox support is behind a flag
  in some versions. The `@supports` guard means Firefox users get the
  stacked opening, which is a complete experience, not a broken one.
- **CSS mosaic last row.** Rows that end mid-width stay at natural size
  instead of stretching. If the owner dislikes it, the fallback is the
  `preview` list per project, which already lets them pick photo sets that
  fill rows.
- **Build time with 240 images and three formats.** First build may take a
  few minutes; Astro caches transformed images under `node_modules/.astro`,
  and the CI action caches that directory. Subsequent builds are seconds.
- **Owner workflow.** The owner today edits `data.js`. After this they add a
  folder and an `index.md`. The README rewrite in Phase 6 is the handover;
  test it by having the owner add one project unaided before Phase 8.
