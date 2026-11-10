# Retrovizor — Santiago photo map

Static GitHub Pages photo journal for Tomislav Rupić, hosted from the `main` branch root at `https://tomislavrupic.github.io/retrovizor/`.

## Architecture
- `index.html`, `style.css`, `app.js`: accessible, responsive map, photo selection, archive, and lightbox.
- `photos.json`: 48 curated geotagged stills with relative assets; sorted by capture time in the UI.
- `scouting.json`: 13 small-crew filming locations for 8–22 November 2026, with sourced visitor information and photo references. New candidates without photographs belong in the guide, not invented photo pins.
- `shoot-plan.json`: provisional 10 November van/foot production plan. The Shoot plan tab reuses the Leaflet map with a separate numbered marker layer. Photo-backed coordinates and published venue maps are distinguished from address-only entries; private/unlocated interview holds have no directions. Checklists are device-local, keyed by date/stop/shot in guarded localStorage.
- `assets/photos`, `assets/thumbs`: resized derivatives with EXIF removed. Never publish original private source manifests.
- `assets/vendor`: pinned Leaflet 1.9.4 and MarkerCluster 1.5.3, licenses included.
- `assets/pix7-tokens.css`: canonical PIX-7 tokens copied from ALi Imagine. Keep semantic colors and media-first hierarchy. This web journal specializes the desktop guide; it does not need production diagnostics.

## Constraints
- Use original photo GPS; never invent locations or imply a recorded walking route.
- Preserve exclusions: no subway, window/dinner portraits, self-portraits, red boarding A10 or crowded cabin A22. The user explicitly requested the restaurant in the map: Bocanáriz food/wine details and Lastarria restaurant fronts are included; private receipts stay excluded.
- The photo exclusions do not exclude new Metro filming plans: the user explicitly requested Metro B-roll. Preserve the existing photo collection while allowing Metro exterior shot tasks in the shoot plan.
- Do not publish local paths, camera identifiers, private provenance, source hashes, or credentials.
- Preserve all photo aspect ratios in the selected stage/lightbox. Thumbnails are intentionally cropped.
- No autoplay or decorative animation. Respect reduced motion and keyboard navigation.
- Public map uses OSM tiles with visible attribution, normal browser caching and Referer; no bulk prefetch.
- User specifically requested GitHub Pages. Do not deploy a parallel Sites instance.
- Every photograph and scouting card links to Google Maps Directions. Photo links use original GPS camera coordinates; named guide locations use their verified address or named destination.
- Light, sound and scene notes are scouting suggestions. Source visitor hours from official pages, date the research, and distinguish visitor access from arranged filming access. Never claim bookings or permissions that have not been obtained.
- Keep the conflicting PDF interview holds provisional until the producer confirms them. Do not publish PDFs, private apartment addresses, crew contacts or source extracts. Do not infer a private residential location for Jorge. Directions open only for known public destinations.

## Commands and verification
- Local preview: `python3 -m http.server 4173 --bind 127.0.0.1`
- Script syntax: `node --check app.js`
- Data/assets: `python3 scripts/verify.py`
- Verify actual browser: map pins/clusters, selection, filter, archive, lightbox/keyboard, share links, Google Maps destinations, guide filters and deep links, mobile layout and attribution.
- For shoot-plan updates, also verify `#plan` and stop deep links, photo/plan marker switching, shot persistence after reload, route modes/waypoints, missing-location behavior and photo-reference navigation.
- Publish only intended tracked files; push to `main`, enable Pages branch root, verify build and live URL.
