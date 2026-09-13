# Overlay frames

The booth on `try-it-out.html` composites a frame over the visitor's photo. Four presets ship as inline SVG data URIs in `assets/js/booth.js` (the `FRAMES` array). This folder is where hosted replacement frames go.

## Spec

| | |
|---|---|
| Size | **1080 × 1350** px (4:5 portrait). Anything else is stretched to fit. |
| Format | PNG with alpha, or SVG. |
| Centre | Transparent. Whatever is opaque covers the photo. |
| SVG root | Must carry `width="1080" height="1350"` **attributes**, not just a `viewBox`. Without them Firefox and Safari draw nothing to the canvas. |
| Fonts in SVG | Only system fonts are available when an SVG is drawn to canvas. Convert text to outlines, or stick to Georgia / Arial. |
| Colour | Independent of the site theme. The frame sits on a photograph, so judge contrast against skin tones and a busy background, not against the dark page. |

## Two ways to use a frame

**1. Try it without touching code.** On the booth page, *Use your own frame* accepts a PNG or SVG from the visitor's device. It is loaded as a `blob:` URL, which is same-origin, so the saved JPEG still works. It lasts for the session only and is never uploaded.

**2. Ship it as a preset.** Save the file here, then add an entry to `FRAMES` in `booth.js`:

```js
{ id: 'wedding', name: 'Wedding', src: 'assets/frames/wedding.png' },
```

The path must be **relative** (no leading slash) or it breaks on GitHub Pages.

## Canvas tainting — read before hosting a frame anywhere else

A frame image from another origin taints the canvas, and `canvas.toBlob` throws `SecurityError` — the preview works but *Save photo* silently fails. Safe sources:

- inline `data:` URIs (the presets),
- `blob:` URLs (the upload),
- files served from this repo (`assets/frames/`).

If a frame must live on another host, it has to be served with `Access-Control-Allow-Origin` **and** loaded with `img.crossOrigin = 'anonymous'` set *before* `img.src`. `loadImage()` in `booth.js` is where that would go.

## Editing the presets

Each preset is an SVG string inside `svgFrame(...)` in `booth.js`. Keep the root element's `width`/`height` as `OUTPUT_W`/`OUTPUT_H`, keep the centre transparent, and remember the colours are deliberately hardcoded — see the comment above `FRAMES`.
