"""Validate the public photo collection and deployment asset references."""
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parent.parent
photos = json.loads((root / 'photos.json').read_text())
assert len(photos) == 38
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
print(f'PASS: {len(photos)} unique, geotagged photos; exclusions; stripped EXIF; all image and page assets.')
