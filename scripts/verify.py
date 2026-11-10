"""Validate the public photo collection and deployment asset references."""
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parent.parent
photos = json.loads((root / 'photos.json').read_text())
assert len(photos) == 48
assert len({photo['id'] for photo in photos}) == len(photos)
assert not ({'A03', 'A04', 'A10', 'A22', 'A30', 'A42'} & {p['id'] for p in photos})
allowed = {'id', 'title', 'lat', 'lng', 'capturedAt', 'locationLabel', 'category', 'image', 'thumb'}
for photo in photos:
    assert set(photo) == allowed
    assert -33.6 < photo['lat'] < -33.3 and -70.8 < photo['lng'] < -70.5
    assert photo['capturedAt'].startswith('2026-11-07')
    for field in ('image', 'thumb'):
        path = photo[field]
        assert not path.startswith('/') and '..' not in path
        data = (root / path).read_bytes()
        assert data[:2] == b'\xff\xd8' and data[-2:] == b'\xff\xd9'
        assert b'Exif\x00\x00' not in data, path
for reference in re.findall(r'(?:src|href)="([^"#]+)"', (root / 'index.html').read_text()):
    if not reference.startswith(('https:', 'http:')):
        assert (root / reference.split('?', 1)[0]).exists(), reference
scouting = json.loads((root / 'scouting.json').read_text())
assert scouting['window'] == {'start': '2026-11-08', 'end': '2026-11-22'}
places = scouting['locations']
assert len(places) == 13 and len({p['id'] for p in places}) == len(places)
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
assert sum(bool(p['photoIds']) for p in places) == 10
assert {'P7897', 'P7900'} <= set(next(p for p in places if p['id'] == 'bocanariz')['photoIds'])
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
public_text = '\n'.join((root / name).read_text() for name in ('shoot-plan.json', 'README.md', 'AGENTS.md', 'index.html', 'app.js'))
assert '/Users/' not in public_text
assert not list(root.glob('*.pdf')), 'Production source PDFs must remain outside public site'
print(f'PASS: {len(photos)} photos, exclusions, stripped EXIF and assets; {len(places)} guide locations; {len(stops)} plan stops, {len(shot_ids)} shot tasks, references, pending locations and route legs.')
