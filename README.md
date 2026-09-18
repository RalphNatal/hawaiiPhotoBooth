# Hawaii Booths

Marketing site for Hawaii Booths — photo, video and audio booth rentals in Honolulu. Eleven static pages, a dark-native design system, and an interactive webcam booth at `try-it-out.html`.

No build step. No `npm install`. Tailwind is loaded from its CDN, fonts from Google Fonts, and nothing else.

## Running it locally

The booth page uses `getUserMedia`, which only works in a **secure context**. Opening the files from `file://` fails silently in Chrome, so always serve them:

```bash
npx serve .          # → http://localhost:3000
```

`localhost` counts as secure. Any static server works.

## Deploying to GitHub Pages

After merging to `main`: **Settings → Pages → Deploy from a branch → `main` → `/ (root)`**. The site lands at `https://<GH_USER>.github.io/<REPO_NAME>/`. That URL is HTTPS, so the camera works — it is the client review link.

### The path rule

A Pages *project* site is served from a subpath, not the domain root, so **every internal reference must be relative**:

```html
<a href="pricing.html">           <!-- correct -->
<a href="/pricing.html">          <!-- 404s on Pages, works locally — the worst kind of bug -->
<img src="assets/img/hero.jpg">   <!-- correct -->
```

This applies to nav links, script and stylesheet `src`, image paths, and the frame paths in `booth.js`. Audit before deploying:

```bash
grep -rn 'href="/\|src="/' *.html      # must return nothing
```

## Layout

```
index.html … try-it-out.html   eleven flat pages in the root
assets/js/head.js              design tokens + component classes (sync, after the CDN tag)
assets/js/shell.js             <hb-nav>, <hb-footer>, BOOKING_URLS, CONTACT
assets/js/booth.js             webcam, frames, capture, printer (try-it-out.html only)
assets/css/site.css            the few rules Tailwind utilities can't express
assets/frames/README.md        spec for replacement overlay frames
assets/img/                    client photos go here (currently placeholders from picsum.photos)
```

### Head order — this matters

```html
<script src="https://cdn.tailwindcss.com/3.4.16"></script>
<script src="assets/js/head.js"></script>
```

`head.js` must be a plain `<script src>` placed **immediately after** the Tailwind CDN tag. The CDN build overwrites `window.tailwind` when it loads, so a config set *before* it is thrown away; assigning `tailwind.config` *after* it goes through the CDN's setter and triggers a rebuild. Never `defer` or `async` it — every custom colour class would render unstyled until the script ran. The CDN version is pinned; an unpinned `cdn.tailwindcss.com` can ship a breaking change into a client demo with no warning.

### Shared shell

`<hb-nav active="pricing">` and `<hb-footer>` are light-DOM custom elements rendered by `shell.js`. Every page has the same three lines:

```html
<hb-nav active="pricing"></hb-nav>
<main id="main"> … static HTML … </main>
<hb-footer> <noscript>…site map…</noscript> </hb-footer>
```

Only the nav and footer are component-rendered; all page content is static HTML so it is crawlable and readable without JS. The `<noscript>` site map lives inside `<hb-footer>` in each page's HTML because without JS the component never renders.

If real templating is ever wanted, the migration path is Astro or Eleventy — the two shell components are the only things that would move into a layout.

### Booking links

Every "Book now" reads its URL from `BOOKING_URLS` in `shell.js`. Pages write `<a data-book="photo" href="contact.html">`; `shell.js` fills in the catalog URL and opens it in a new tab with `rel="noopener"`. The static `href` is the no-JS fallback. Two entries carry `TODO(client)` comments — the 360 booth has two catalog URLs on the old site, and no separate 360 Sky URL was supplied.

## Swapping assets

- **Photos.** Every image is a `https://picsum.photos/seed/<slug>/<w>/<h>` placeholder. Drop real photos into `assets/img/` and update the `src` **and** the `width`/`height` attributes so the layout doesn't shift on load. Below-the-fold images keep `loading="lazy"`.
- **Frames.** See [`assets/frames/README.md`](assets/frames/README.md).
- **Testimonials, founders, hours, terms.** Search the HTML for `TODO(client)` — every placeholder is marked.
- **Availability.** The calendar renders from the `AVAILABILITY` object at the top of the script in `calendar.html`. Delete the `DEMO_FALLBACK` block once real data exists.
- **Forms.** The contact and calendar forms validate but do not submit. Each submit handler has a `TODO` showing where to post to Formspree, Netlify Forms, or a custom endpoint.

## Theme notes

The site is dark-native: `abyss` is the page, `sand` is body text, `shell` is headings only, `gold` is the CTA fill, `surf` is links and focus rings. Elevation is a step in lightness (`ink` on `abyss`, `ocean` on `ink`), never a shadow — the only shadow on the site is under the emerging print on the booth page.

Things that look like bugs but aren't:

- **Frame colours in `booth.js` are hardcoded hex, on purpose.** They composite onto a visitor's photo, not onto the page. Classic White stays white regardless of the theme.
- **Focus ring offsets change with the surface.** `ring-offset-abyss` on the page, `ring-offset-ink` inside cards, `ring-offset-ocean` on the booth stage. A ring offset for the wrong surface is invisible.
- **The printer chassis is `ocean`, not `ink`.** On an `abyss` page an `ink` chassis disappears.
- **Inline SVGs use `fill-*`/`stroke-*` utilities**, so they follow the token config. Audit with `grep -o "#[0-9A-Fa-f]\{6\}" *.html assets/js/*.js | sort -u` — the only hex should be the eight tokens in `head.js` and the frame colours in `booth.js`.

## Browser support

Modern evergreen browsers. The booth needs `getUserMedia`, `canvas.toBlob`, and CSS `rotate`; the gallery uses the `inert` attribute with a Tab-trap fallback.
