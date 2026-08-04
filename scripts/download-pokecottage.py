"""Download PokeCottage high-res images for all 149 mapped cards.

Reads scripts/pokecottage-manifest.json (id -> URL) and writes to public/cards/
as high-res WebP files, preserving the deduplicated structure.
"""
import hashlib
import json
import sys
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import HTTPError

MANIFEST = r'D:\VS Code Projects\Glaceon Master Set App\app\scripts\pokecottage-manifest.json'
OUT_DIR = r'D:\VS Code Projects\Glaceon Master Set App\app\public\cards'
IMAGE_MANIFEST = r'D:\VS Code Projects\Glaceon Master Set App\app\scripts\image-manifest.json'

sys.stdout.reconfigure(encoding='utf-8')


def download(url):
    req = Request(url, headers={'User-Agent': 'Mozilla/5.0 GlaceonMasterSetApp/1.0'})
    with urlopen(req, timeout=60) as r:
        return r.read()


def main():
    Path(OUT_DIR).mkdir(parents=True, exist_ok=True)

    with open(MANIFEST, encoding='utf-8') as f:
        pc_manifest = json.load(f)

    hash_to_file = {}
    image_manifest = {}
    failed = []

    # Enumerate in a stable order by sorting ids
    for idx, (card_id, url) in enumerate(sorted(pc_manifest.items()), start=1):
        try:
            data = download(url)
        except HTTPError as e:
            failed.append((card_id, url, e.code))
            print(f'  [{idx}/{len(pc_manifest)}] FAILED {card_id}: HTTP {e.code}')
            continue
        except Exception as e:
            failed.append((card_id, url, str(e)))
            print(f'  [{idx}/{len(pc_manifest)}] FAILED {card_id}: {e}')
            continue

        h = hashlib.sha1(data).hexdigest()
        if h in hash_to_file:
            filename = hash_to_file[h]
        else:
            # Use original extension from URL
            ext = Path(url).suffix.split('?')[0] or '.webp'
            filename = f'img_{idx:03d}{ext}'
            out_path = Path(OUT_DIR) / filename
            out_path.write_bytes(data)
            hash_to_file[h] = filename

        image_manifest[card_id] = f'/cards/{filename}'
        print(f'  [{idx}/{len(pc_manifest)}] OK {card_id} -> {filename} ({len(data)} bytes)')

    with open(IMAGE_MANIFEST, 'w', encoding='utf-8') as f:
        json.dump(image_manifest, f, indent=2)

    print(f'\nDownloaded {len(image_manifest)} / {len(pc_manifest)}')
    print(f'Unique files: {len(hash_to_file)}')
    print(f'Failed: {len(failed)}')
    if failed:
        print('Failures:')
        for card_id, url, err in failed:
            print(f'  {card_id}: {url} ({err})')


if __name__ == '__main__':
    main()
