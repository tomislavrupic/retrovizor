# Retrovizor · A Day in Santiago

A photographic walk through Santiago, by Tomislav Rupić.

**[Explore the map](https://tomislavrupic.github.io/retrovizor/)** · **[Watch the film](https://youtu.be/2HaneFA94fo)**

38 selected photographs, placed using their original GPS metadata. Choose a pin, browse the day's photographs, or open the archive. Nearby photos group together on the map; zoom in or click a group to explore them. Each memory has its own shareable link.

## Run locally

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173`. No build step or API key required.

The site publishes through GitHub Pages from the root of `main`. `.nojekyll` preserves static assets as written.

## Credits

Photography © Tomislav Rupić. Photograph locations come from embedded GPS metadata and reflect camera positions, not necessarily the positions of distant subjects. Web images are resized, corrected derivatives with embedded EXIF removed. No recorded walking route is claimed.

Interface follows the PIX-7 design system. Mapping uses [Leaflet](https://leafletjs.com/) and [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster), with their licenses in `assets/vendor`. Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright).
