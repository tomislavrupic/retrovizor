# Retrovizor — Santiago photo map

Static GitHub Pages photo journal for Tomislav Rupić, hosted from the `main` branch root at `https://tomislavrupic.github.io/retrovizor/`.

## Architecture
- `index.html`, `style.css`, `app.js`: accessible, responsive map, photo selection, archive, and lightbox.
- `photos.json`: 38 curated geotagged stills with relative assets; sorted by capture time in the UI.
- `assets/photos`, `assets/thumbs`: resized derivatives with EXIF removed. Never publish original private source manifests.
- `assets/vendor`: pinned Leaflet 1.9.4 and MarkerCluster 1.5.3, licenses included.
- `assets/pix7-tokens.css`: canonical PIX-7 tokens copied from ALi Imagine. Keep semantic colors and media-first hierarchy. This web journal specializes the desktop guide; it does not need production diagnostics.

## Constraints
- Use original photo GPS; never invent locations or imply a recorded walking route.
- Preserve exclusions: no subway, restaurant/window/dinner portraits, self-portraits, red boarding A10 or crowded cabin A22.
- Do not publish local paths, camera identifiers, private provenance, source hashes, or credentials.
- Preserve all photo aspect ratios in the selected stage/lightbox. Thumbnails are intentionally cropped.
- No autoplay or decorative animation. Respect reduced motion and keyboard navigation.
- Public map uses OSM tiles with visible attribution, normal browser caching and Referer; no bulk prefetch.
- User specifically requested GitHub Pages. Do not deploy a parallel Sites instance.

## Commands and verification
- Local preview: `python3 -m http.server 4173 --bind 127.0.0.1`
- Script syntax: `node --check app.js`
- Data/assets: `python3 scripts/verify.py`
- Verify actual browser: map pins/clusters, selection, filter, archive, lightbox/keyboard, share links, mobile layout and attribution.
- Publish only intended tracked files; push to `main`, enable Pages branch root, verify build and live URL.
