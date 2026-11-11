# Retrovizor — Santiago photo map

Static GitHub Pages photo journal for Tomislav Rupić, hosted from the `main` branch root at `https://tomislavrupic.github.io/retrovizor/`.

## Architecture
- `index.html`, `style.css`, `app.js`: accessible, responsive map, photo selection, archive, and lightbox.
- `photos.json`: 58 library images with relative assets: 48 original geotagged selections, plus 10 explicitly supplied additions (`N01`–`N10`) whose attachments have no GPS or capture time. Dated images sort by capture time; undated images follow in import order. All appear in the archive/filmstrip; only photos with finite GPS appear as pins. Do not discard unlocated entries or invent missing metadata.
- `scouting.json`: 13 small-crew filming locations for 8–22 November 2026, with sourced visitor information and photo references. New candidates without photographs belong in the guide, not invented photo pins.
- `shoot-plan.json`: provisional 10 November van/foot production plan. The Shoot plan tab reuses the Leaflet map with a separate numbered marker-cluster layer (clusters explicitly say “N stops”). Ten stops use photo GPS, published venue locations or checked geocoding with coordinateSource provenance; private/unlocated interview holds have no directions. Checklists are device-local, keyed by date/stop/shot in guarded localStorage.
- `shoot-plan-day3.json`: 11 November call-sheet schedule for Estadio Croata and a private Providencia interview, with no B-roll stops. The existing Shoot plan tab loads both files, defaults to the latest date and offers a day selector. `#plan&day=YYYY-MM-DD` and `#plan=STOP&day=YYYY-MM-DD` link to a specific day. Never derive production day numbers from array positions. Keep each day's checklist keys separate.
- `assets/photos`, `assets/thumbs`: resized derivatives with EXIF removed. Never publish original private source manifests.
- `assets/vendor`: pinned Leaflet 1.9.4 and MarkerCluster 1.5.3, licenses included.
- `assets/pix7-tokens.css`: canonical PIX-7 tokens copied from ALi Imagine. Keep semantic colors and media-first hierarchy. This web journal specializes the desktop guide; it does not need production diagnostics.

## Constraints
- Use original photo GPS; never invent locations or imply a recorded walking route.
- Preserve exclusions: no subway, window/dinner portraits, self-portraits, red boarding A10 or crowded cabin A22. The user explicitly requested the restaurant in the map: Bocanáriz food/wine details and Lastarria restaurant fronts are included; private receipts stay excluded.
- Those exclusions apply to the original curated film/photo selection. The user explicitly supplied the new Metro photograph `N10` for the photo library; include this addition without restoring earlier excluded IDs. Preserve these ten photos as supplied, with stripped-metadata public copies and no crop in the full-size view.
- The photo exclusions do not exclude new Metro filming plans: the user explicitly requested Metro B-roll. Preserve the existing photo collection while allowing Metro exterior shot tasks in the shoot plan.
- Do not publish local paths, camera identifiers, private provenance, source hashes, or credentials.
- Preserve all photo aspect ratios in the selected stage/lightbox. Thumbnails are intentionally cropped.
- No autoplay or decorative animation. Respect reduced motion and keyboard navigation.
- Public map uses OSM tiles with visible attribution, normal browser caching and Referer; no bulk prefetch.
- User specifically requested GitHub Pages. Do not deploy a parallel Sites instance.
- Version local app.js/style.css URLs in index.html and the shoot-plan.json fetch URL when releasing changes, so returning visitors do not receive a new HTML shell with cached older scripts/styles. The verifier strips URL queries before checking local assets.
- Every located photograph and scouting card links to Google Maps Directions. Photo links use original GPS camera coordinates; named guide locations use their verified address or named destination. Unlocated photos show “Location not recorded” and no directions link, including in the lightbox. Undated photos show “Date not recorded”; the upload date is not a capture date.
- Light, sound and scene notes are scouting suggestions. Source visitor hours from official pages, date the research, and distinguish visitor access from arranged filming access. Never claim bookings or permissions that have not been obtained.
- Keep the conflicting PDF interview holds provisional until the producer confirms them. Do not publish PDFs, private apartment addresses, crew contacts or source extracts. Do not infer a private residential location for Jorge. Directions open only for known public destinations.
- Day 3 follows the supplied dated call sheet: 10:20 call, 10:45 setup, 11:00–13:00 Guillermo, 13:00–14:30 lunch, 14:30 transfer, 15:00 setup, 15:30–17:30 Davor, 17:30 wrap/return. The user specified interviews only; do not add B-roll to this day. `privateLocation: true` suppresses stop pins, address display and directions, and suppresses private route links. The source JSON itself must never contain private address or contact details; hiding them in the UI is insufficient. Do not substitute a public Metro pin for the private home location.

## Commands and verification
- Local preview: `python3 -m http.server 4173 --bind 127.0.0.1`
- Script syntax: `node --check app.js`
- Data/assets: `python3 scripts/verify.py`
- Verify actual browser: map pins/clusters, selection, filter, archive, lightbox/keyboard, share links, Google Maps destinations, guide filters and deep links, mobile layout and attribution.
- For shoot-plan updates, also verify `#plan` and stop deep links, photo/plan marker switching, shot persistence after reload, route modes/waypoints, missing-location behavior and photo-reference navigation.
- Publish only intended tracked files; push to `main`, enable Pages branch root, verify build and live URL.
