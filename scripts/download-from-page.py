"""Re-download PokeCottage card images using the rendered page's alt text as filename.

Reads app/pokecottage-page.html, extracts each .card-slot, and downloads the
high-res fallback PNG (data-fallback-src) using a sanitized alt text as filename.
Outputs to public/cards/ and updates scripts/image-manifest.json.
"""
import json
import re
import sys
from pathlib import Path
from urllib.request import urlopen, Request

PAGE_HTML = r'D:\VS Code Projects\Glaceon Master Set App\app\pokecottage-page.html'
OUT_DIR = r'D:\VS Code Projects\Glaceon Master Set App\app\public\cards'
IMAGE_MANIFEST = r'D:\VS Code Projects\Glaceon Master Set App\app\scripts\image-manifest.json'

sys.stdout.reconfigure(encoding='utf-8')


def sanitize_filename(alt):
    """Turn 'Glaceon LV.X — DP4 — 1st Edition' into 'Glaceon_LV.X_DP4_1st_Edition'."""
    if not alt:
        return None
    s = alt.replace('—', '_').replace('–', '_').replace('-', '_')
    s = re.sub(r'[^\w\s\.]', '', s)
    s = re.sub(r'\s+', '_', s.strip())
    s = re.sub(r'_{2,}', '_', s)
    return s


def download(url):
    req = Request(url, headers={'User-Agent': 'Mozilla/5.0 GlaceonMasterSetApp/1.0'})
    with urlopen(req, timeout=60) as r:
        return r.read()


def extract_slots(html):
    """Extract all card-slot divs with their img attributes via regex."""
    slots = []
    # Match the whole card-slot div through its closing </div>
    pattern = re.compile(
        r'<div class="card-slot[^"]*" data-card-index="([^"]+)" data-card-id="([^"]+)">'
        r'(?P<body>.*?)</div>',
        re.DOTALL
    )
    img_pattern = re.compile(
        r'<img[^>]+class="base[^"]*"[^>]+src="([^"]+)"[^>]+data-fallback-src="([^"]+)"[^>]+alt="([^"]*)"'
    )
    for m in pattern.finditer(html):
        index, card_id = m.group(1), m.group(2)
        body = m.group('body')
        img_m = img_pattern.search(body)
        if img_m:
            slots.append({
                'card_index': index,
                'card_id': card_id,
                'src': img_m.group(1),
                'fallback': img_m.group(2),
                'alt': img_m.group(3),
            })
    return slots


def main():
    Path(OUT_DIR).mkdir(parents=True, exist_ok=True)

    html = Path(PAGE_HTML).read_text(encoding='utf-8', errors='replace')
    slots = extract_slots(html)
    print(f'Found {len(slots)} card slots in HTML')

    manifest = {}
    failed = []

    for idx, slot in enumerate(slots, start=1):
        url = slot.get('fallback') or slot.get('src')
        alt = slot.get('alt')
        card_id = slot.get('card_id')
        card_index = slot.get('card_index')

        if not url:
            failed.append((card_index, 'no image URL'))
            continue

        base_name = sanitize_filename(alt) or f'card_{card_index}'
        ext = Path(url.split('?')[0]).suffix or '.png'
        filename = f'{base_name}{ext}'
        counter = 1
        existing = {f.name for f in Path(OUT_DIR).iterdir()}
        while filename in existing:
            filename = f'{base_name}_{counter:02d}{ext}'
            counter += 1

        try:
            data = download(url)
        except Exception as e:
            failed.append((card_index, alt, str(e)))
            print(f'  [{idx}/{len(slots)}] FAILED {card_index}: {alt} - {e}')
            continue

        out_path = Path(OUT_DIR) / filename
        out_path.write_bytes(data)

        manifest[card_index] = {
            'path': f'/cards/{filename}',
            'alt': alt,
            'url': url,
            'card_id': card_id,
            'bytes': len(data),
        }
        print(f'  [{idx}/{len(slots)}] OK {card_index}: {filename} ({len(data)} bytes)')

    with open(IMAGE_MANIFEST, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print(f'\nDownloaded {len(manifest)} / {len(slots)}')
    print(f'Failed: {len(failed)}')
    if failed:
        for row in failed:
            print(' ', row)


if __name__ == '__main__':
    main()
