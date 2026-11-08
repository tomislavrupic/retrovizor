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
        assert (root / reference).exists(), reference
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
print(f'PASS: {len(photos)} unique geotagged photos, exclusions, stripped EXIF and all assets; {len(places)} filming locations with valid photo references and sources.')
