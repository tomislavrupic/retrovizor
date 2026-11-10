# Retrovizor · A Day in Santiago

A photographic walk through Santiago, by Tomislav Rupić.

**[Explore the map](https://tomislavrupic.github.io/retrovizor/)** · **[Watch the film](https://youtu.be/2HaneFA94fo)**

48 selected photographs, placed using their original GPS metadata. Choose a pin, browse the day's photographs, or open the archive. Nearby photos group together on the map; zoom in or click a group to explore them. Each memory has its own shareable link and Google Maps directions.

The [filming guide](https://tomislavrupic.github.io/retrovizor/#scout) covers 13 locations for small-crew documentary and street scenes during 8–22 November 2026. Ten locations are illustrated by photographs from the walk, including Bocanáriz; three additional places are clearly marked as new scouting candidates. Each has directions, scene ideas, light/sound suggestions, practical access notes and official sources. Published hours were checked on 8 November 2026; confirm before travelling. Filming access has not been booked.

The [10 November shoot plan](https://tomislavrupic.github.io/retrovizor/#plan) combines the supplied production drafts into a provisional van-and-foot route from Hotel Diego de Velázquez. It includes timed stops, Google Maps route legs, light notes, access fallbacks and a device-local shot checklist. Conflicting interview holds and Jorge’s unlocated exterior remain pending. Private apartment details and crew contacts are excluded. Plan pins use photo GPS or published venue-map locations; address-only entries have directions without invented coordinates. Transfers are planning allowances, not live traffic predictions or a booked schedule.

## Run locally

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173`. No build step or API key required.

The site publishes through GitHub Pages from the root of `main`. `.nojekyll` preserves static assets as written.

## Credits

Photography © Tomislav Rupić. Photograph locations come from embedded GPS metadata and reflect camera positions, not necessarily the positions of distant subjects. Web images are resized, corrected derivatives with embedded EXIF removed. No recorded walking route is claimed.

Interface follows the PIX-7 design system. Mapping uses [Leaflet](https://leafletjs.com/) and [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster), with their licenses in `assets/vendor`. Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright).
