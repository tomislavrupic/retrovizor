# Retrovizor · A Day in Santiago

A photographic walk through Santiago, by Tomislav Rupić.

**[Explore the map](https://tomislavrupic.github.io/retrovizor/)** · **[Watch the film](https://youtu.be/2HaneFA94fo)**

98 photographs in the library, including 33 new market photos from La Vega Central (12 November 2026). The original 48 and 15 of the 17 supplied additions have GPS-backed map pins; all 33 market photos also have source-backed pins. Two additions remain available in the archive and filmstrip with their private-home locations withheld from the public map. The earlier additions have camera capture dates from 8–10 November 2026; they include Metro photos N10 and N11, supplied explicitly for this library, while the original curated-selection exclusions remain unchanged. N17 is a distinct sun-above-horizon frame. Choose a pin, browse the photographs, or open the archive. Nearby located photos group together on the map; zoom in or click a group to explore them. Every memory has its own shareable link; Google Maps directions appear only when its location is known. Added photos retain their full framing in resized web copies with EXIF removed.

The [filming guide](https://tomislavrupic.github.io/retrovizor/#scout) is a Croatian master B-roll list for the remaining filming days, with 35 locations across six areas. It retains the original photographed locations, adds the city, daily-life and memory-site brief, and offers six flexible Google Maps routes. Filter by area and photo coverage; tick individual shots or the shared Goran/street-life list. Progress stays on the current device and is separate from daily call sheets. Each location has directions, light/sound suggestions, access notes and official sources, checked on 12 November 2026. Confirm changing hours and access before travelling; filming access has not been booked.

The [10 November / Day 2 shoot plan](https://tomislavrupic.github.io/retrovizor/#plan&day=2026-11-10) combines the supplied production drafts into a provisional van-and-foot route from Hotel Diego de Velázquez. It includes timed stops, Google Maps route legs, light notes, access fallbacks and a device-local shot checklist. Conflicting interview holds and Jorge’s unlocated exterior remain pending. Private apartment details and crew contacts are excluded. Ten mapped stops use photo GPS, published venue locations and checked OpenStreetMap results; nearby stops group together and expand on selection. Private or unlocated interview holds remain unpinned. La Vega uses the market area for its pin and its official entrance address for directions. Transfers are planning allowances, not live traffic predictions or a booked schedule.

The [11 November / Day 3 plan](https://tomislavrupic.github.io/retrovizor/#plan&day=2026-11-11) follows the supplied call sheet: 10:20 hotel call, Guillermo at Estadio Croata 11:00–13:00, lunch, 14:30 transfer, Davor 15:30–17:30 and wrap/return. This is an interviews-only day, with two public pins for the hotel and Estadio Croata. The residential interview has a schedule card but no public address, pin or directions.

The [12 November / Day 4 plan](https://tomislavrupic.github.io/retrovizor/#plan&day=2026-11-12) is the default shooting day: 08:00 hotel call, B-roll 08:15–10:00, David De Luca at Plaza Patricio Aylwin 10:45–13:00 (setup 10:15), lunch 13:00–14:00, and Hrvoj Ostojić Perić 15:00–17:00 (setup 14:30), then wrap. The hotel and plaza have public pins and Google Maps directions. Morning B-roll, lunch and the afternoon venue remain TBC, without guessed pins or route legs. The plaza pin represents the mapped area, not a confirmed entrance. The call sheet's two-hour maximum including setup conflicts with its time blocks; both supplied blocks are retained and flagged for production confirmation. Switch days in the same panel; the nine Day 4 checklist tasks remain separate from other days and the master list.

A manual **Sunset atmosphere** player accompanies the journal, with a link to the sunset photograph. The 30-second field recording by Tomislav Rupić retains source seconds 10.000–40.047667, removing the first 10 and final 20 seconds. The web MP3 is mono with no gain changes or fades; the original recording is preserved outside the site. Playback starts only when the listener presses play.

## Run locally

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173`. No build step or API key required.

The site publishes through GitHub Pages from the root of `main`. `.nojekyll` preserves static assets as written.

## Credits

Photography © Tomislav Rupić. Photograph locations come from embedded GPS metadata and reflect camera positions, not necessarily the positions of distant subjects. Web images are resized, corrected derivatives with embedded EXIF removed. No recorded walking route is claimed.

Interface follows the PIX-7 design system. Mapping uses [Leaflet](https://leafletjs.com/) and [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster), with their licenses in `assets/vendor`. Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright).
