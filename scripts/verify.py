"""Validate the public photo collection and deployment asset references."""
import json
import re
from datetime import datetime
from pathlib import Path

root = Path(__file__).resolve().parent.parent
photos = json.loads((root / 'photos.json').read_text())
assert len(photos) == 65
assert len({photo['id'] for photo in photos}) == len(photos)
assert not ({'A03', 'A04', 'A10', 'A22', 'A30', 'A42'} & {p['id'] for p in photos})
allowed = {'id', 'title', 'lat', 'lng', 'capturedAt', 'locationLabel', 'category', 'image', 'thumb'}
for photo in photos:
    assert set(photo) == allowed
    assert (photo['lat'] is None) == (photo['lng'] is None)
    if photo['lat'] is not None:
        assert -33.6 < photo['lat'] < -33.3 and -70.8 < photo['lng'] < -70.5
    assert isinstance(photo['capturedAt'], str) and photo['capturedAt'].strip()
    captured = datetime.fromisoformat(photo['capturedAt'].replace(' ', 'T'))
    assert captured.date().isoformat() >= '2026-11-07'
    assert captured.date().isoformat() <= '2026-11-10'
    for field in ('image', 'thumb'):
        path = photo[field]
        assert not path.startswith('/') and '..' not in path
        data = (root / path).read_bytes()
        assert data[:2] == b'\xff\xd8' and data[-2:] == b'\xff\xd9'
        assert b'Exif\x00\x00' not in data, path
additions = [p for p in photos if re.fullmatch(r'N\d{2}', p['id'])]
assert {p['id'] for p in additions} == {f'N{i:02}' for i in range(1, 18)}
assert all(isinstance(p['capturedAt'], str) and p['capturedAt'].strip() for p in additions)
assert all(datetime.fromisoformat(p['capturedAt'].replace(' ', 'T')).date().isoformat() in {'2026-11-08', '2026-11-09', '2026-11-10'} for p in additions)
# N08 and N09 have source GPS in the private audit, but are deliberately unpinned because they show private homes.
unmapped_additions = {p['id'] for p in additions if p['lat'] is None}
assert unmapped_additions == {'N08', 'N09'}
assert all(p['lat'] is not None and p['lng'] is not None for p in additions if p['id'] not in {'N08', 'N09'})
assert all(p['locationLabel'] == 'Private location' for p in additions if p['id'] in {'N08', 'N09'})
mapped_count = sum(p['lat'] is not None for p in photos)
assert mapped_count == 63, 'Only source-backed, cleared GPS belongs on the photo map'
# N10 and N11 are explicitly supplied Metro exceptions in the new library batch.
assert {'N10', 'N11'} <= {p['id'] for p in additions}
for reference in re.findall(r'(?:src|href)="([^"#]+)"', (root / 'index.html').read_text()):
    if not reference.startswith(('https:', 'http:')):
        assert (root / reference.split('?', 1)[0]).exists(), reference
scouting = json.loads((root / 'scouting.json').read_text())
assert scouting['window'] == {'start': '2026-11-08', 'end': '2026-11-22'}
places = scouting['locations']
place_ids = {p['id'] for p in places}
assert len(place_ids) == len(places)
assert {'bocanariz', 'lastarria', 'bellavista', 'san-cristobal', 'plaza-de-armas', 'casa-colorada', 'divina-providencia', 'palacio-schacht', 'puente-purisima', 'la-merced', 'vega-central', 'persa-victor-manuel', 'yungay'} <= place_ids
assert scouting['checkedAt'] == '2026-11-12'
groups = scouting['groups']
group_ids = {group['id'] for group in groups}
assert len(groups) == len(group_ids) == 6
assert group_ids == {'providencia', 'east', 'centre', 'north', 'west', 'southeast'}
assert all(group['title'].strip() and group['description'].strip() for group in groups)
def verify_shots(shots):
    assert shots and len({shot['id'] for shot in shots}) == len(shots)
    assert all(re.fullmatch(r'[a-z0-9-]+', shot['id']) and shot['text'].strip() for shot in shots)

verify_shots(scouting['generalShots'])
photo_ids = {p['id'] for p in photos}
for place in places:
    assert re.fullmatch(r'[a-z0-9-]+', place['id'])
    assert set(place['photoIds']) <= photo_ids, place['id']
    if place['photoIds']:
        assert place['heroId'] in place['photoIds'], place['id']
    else:
        assert 'heroId' not in place
    for field in ('name', 'area', 'kind', 'address', 'idea', 'light', 'sound', 'hours', 'access'):
        assert isinstance(place[field], str) and place[field].strip(), (place['id'], field)
    assert place['sources'] and all(s['url'].startswith('https://') and s['title'] for s in place['sources'])
    assert place['group'] in group_ids
    assert not place.get('privateLocation'), 'Private homes are excluded from the public filming guide'
    assert not ({'lat', 'lng'} & set(place)), 'New guide candidates use verified names, not invented GPS pins'
    verify_shots(place['shots'])
assert sum(bool(p['photoIds']) for p in places) >= 10
assert {'P7897', 'P7900'} <= set(next(p for p in places if p['id'] == 'bocanariz')['photoIds'])
routes = scouting['routes']
assert len({route['id'] for route in routes}) == len(routes)
assert {route['group'] for route in routes} == group_ids
for route in routes:
    assert re.fullmatch(r'[a-z0-9-]+', route['id']) and route['group'] in group_ids
    assert route['mode'] in {'walking', 'driving'}
    assert route['title'].strip() and route['note'].strip()
    assert 2 <= len(route['placeIds']) <= 5  # Google Maps mobile web: at most three waypoints.
    assert len(set(route['placeIds'])) == len(route['placeIds'])
    assert set(route['placeIds']) <= place_ids
    assert all(next(p for p in places if p['id'] == id)['group'] == route['group'] for id in route['placeIds'])
plan = json.loads((root / 'shoot-plan.json').read_text())
assert plan['date'] == '2026-11-10'
stops = plan['stops']
assert len({s['id'] for s in stops}) == len(stops)
shot_ids = []
for stop in stops:
    assert re.fullmatch(r'[a-z0-9-]+', stop['id'])
    for field in ('time', 'title', 'status', 'address', 'notes'):
        assert stop[field].strip(), (stop['id'], field)
    assert ('lat' in stop) == ('lng' in stop)
    if 'lat' in stop:
        assert -33.6 < stop['lat'] < -33.3 and -70.8 < stop['lng'] < -70.5
    if 'photoId' in stop:
        reference = next(p for p in photos if p['id'] == stop['photoId'])
        assert abs(reference['lat'] - stop['lat']) < .00002
        assert abs(reference['lng'] - stop['lng']) < .00002
    for shot in stop['shots']:
        assert shot['id'] and shot['text']
        shot_ids.append(shot['id'])
assert len(shot_ids) == len(set(shot_ids))
for pending in ('interview-holds', 'jorge'):
    stop = next(s for s in stops if s['id'] == pending)
    assert not ({'lat', 'lng', 'mapQuery'} & set(stop)), pending
mapped_stops = [s for s in stops if 'lat' in s]
assert len(mapped_stops) == 10
for venue in ('la-vega', 'codelco', 'alameda', 'goran', 'fuel'):
    stop = next(s for s in stops if s['id'] == venue)
    assert {'lat', 'lng', 'coordinateSource'} <= set(stop)
    assert stop['coordinateSource']['url'].startswith('https://')
fuel = next(s for s in stops if s['id'] == 'fuel')
assert fuel['mapQuery'] == f"{fuel['lat']},{fuel['lng']}", 'Use the operator-confirmed station, not a same-brand search match'
for leg in plan['legs']:
    assert leg['mode'] in {'driving', 'walking'}
    assert leg['origin'] and leg['destination']
    assert len(leg.get('waypoints', [])) <= 3  # Google Maps mobile web limit
assert all(s['title'] and s['url'].startswith('https://') for s in plan['sources'])
day3 = json.loads((root / 'shoot-plan-day3.json').read_text())
assert day3['date'] == '2026-11-11' and day3['dayNumber'] == 3
assert 'Interviews only' in day3['summary']
assert 'los-leones-pickups' not in {stop['id'] for stop in day3['stops']}
assert len({s['id'] for s in day3['stops']}) == len(day3['stops'])
day3_shots = []
for stop in day3['stops']:
    for field in ('time', 'title', 'status', 'address', 'notes'):
        assert stop[field].strip(), (stop['id'], field)
    assert ('lat' in stop) == ('lng' in stop)
    if 'lat' in stop:
        assert -33.6 < stop['lat'] < -33.3 and -70.8 < stop['lng'] < -70.5
    if stop.get('privateLocation'):
        assert not ({'lat', 'lng', 'mapQuery', 'coordinateSource'} & set(stop))
    day3_shots.extend(shot['id'] for shot in stop['shots'] if shot['text'].strip())
assert len(day3_shots) == len(set(day3_shots))
assert len([s for s in day3['stops'] if 'lat' in s]) == 2
assert next(s for s in day3['stops'] if s['id'] == 'davor-interview')['privateLocation']
for venue in ('estadio-croata',):
    stop = next(s for s in day3['stops'] if s['id'] == venue)
    assert stop['coordinateSource']['url'].startswith('https://www.openstreetmap.org/')
for leg in day3['legs']:
    assert leg['mode'] in {'driving', 'walking'}
    assert leg['origin'] and leg['destination']
    assert len(leg.get('waypoints', [])) <= 3
assert sum(bool(leg.get('privateLocation')) for leg in day3['legs']) == 2
assert all(s['title'] and s['url'].startswith('https://') for s in day3['sources'])
public_text = '\n'.join((root / name).read_text() for name in ('shoot-plan.json', 'shoot-plan-day3.json', 'scouting.json', 'README.md', 'AGENTS.md', 'index.html', 'app.js'))
assert '/Users/' not in public_text
assert not re.search(r'\b(?:Apt|Apartment|Depto)\.?\s*\d', public_text, re.I), 'Private apartment details must not be published'
assert not list(root.glob('*.pdf')), 'Production source PDFs must remain outside public site'
print(f'PASS: {len(photos)} photos ({len(photos)-len(additions)} original selections + {len(additions)} additions; {mapped_count} mapped), exclusions, stripped EXIF and assets; {len(places)} guide locations; {len(stops)} plan stops, {len(shot_ids)} shot tasks, references, pending locations and route legs.')
print(f'PASS: Day 3 has {len(day3["stops"])} entries, {len(day3_shots)} tasks, 2 public pins, and private-address/route checks.')
print(f'PASS: Master B-roll guide has {len(groups)} zones, {len(routes)} public route links and {sum(len(p["shots"]) for p in places) + len(scouting["generalShots"])} stable checklist tasks.')
