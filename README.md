# Retrovizor · A Day in Santiago

A photographic walk through Santiago, by Tomislav Rupić.

**[Explore the map](https://tomislavrupic.github.io/retrovizor/)** · **[Watch the film](https://youtu.be/2HaneFA94fo)**

58 photographs in the library. The original 48 have GPS-backed map pins; ten later additions are available in the archive and filmstrip with “Location not recorded” and “Date not recorded,” because the supplied copies contain neither. Choose a pin, browse the photographs, or open the archive. Nearby located photos group together on the map; zoom in or click a group to explore them. Every memory has its own shareable link; Google Maps directions appear only when its location is known. The new photographs retain their full framing and supplied image pixels.

The [filming guide](https://tomislavrupic.github.io/retrovizor/#scout) covers 13 locations for small-crew documentary and street scenes during 8–22 November 2026. Ten locations are illustrated by photographs from the walk, including Bocanáriz; three additional places are clearly marked as new scouting candidates. Each has directions, scene ideas, light/sound suggestions, practical access notes and official sources. Published hours were checked on 8 November 2026; confirm before travelling. Filming access has not been booked.

The [10 November / Day 2 shoot plan](https://tomislavrupic.github.io/retrovizor/#plan&day=2026-11-10) combines the supplied production drafts into a provisional van-and-foot route from Hotel Diego de Velázquez. It includes timed stops, Google Maps route legs, light notes, access fallbacks and a device-local shot checklist. Conflicting interview holds and Jorge’s unlocated exterior remain pending. Private apartment details and crew contacts are excluded. Ten mapped stops use photo GPS, published venue locations and checked OpenStreetMap results; nearby stops group together and expand on selection. Private or unlocated interview holds remain unpinned. La Vega uses the market area for its pin and its official entrance address for directions. Transfers are planning allowances, not live traffic predictions or a booked schedule.

The [11 November / Day 3 plan](https://tomislavrupic.github.io/retrovizor/#plan&day=2026-11-11) is now the default. It follows the supplied call sheet: 10:20 hotel call, Guillermo at Estadio Croata 11:00–13:00, lunch, 14:30 transfer, Davor 15:30–17:30 and wrap/return. This is an interviews-only day, with two public pins for the hotel and Estadio Croata. The residential interview has a schedule card but no public address, pin or directions. Switch days in the same panel; shot checklists remain separate by date.

## Run locally

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173`. No build step or API key required.

The site publishes through GitHub Pages from the root of `main`. `.nojekyll` preserves static assets as written.

## Credits

Photography © Tomislav Rupić. Photograph locations come from embedded GPS metadata and reflect camera positions, not necessarily the positions of distant subjects. Web images are resized, corrected derivatives with embedded EXIF removed. No recorded walking route is claimed.

Interface follows the PIX-7 design system. Mapping uses [Leaflet](https://leafletjs.com/) and [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster), with their licenses in `assets/vendor`. Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright).
