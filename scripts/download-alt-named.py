"""Re-download all PokeCottage images using alt-text filenames.

Reads 471-glaceon-data.js, maps each card to our card id, builds the alt text
({pokemonName} — {displayCardNumber} — {variant}), and downloads the original
PNG using that alt text as the filename.
"""
import json
import re
import sys
from pathlib import Path
from urllib.request import urlopen, Request

DATA_JS = r'D:\VS Code Projects\Glaceon Master Set App\app\471-glaceon-data.js'
OUR_CARDS = r'D:\VS Code Projects\Glaceon Master Set App\app\src\data\cards.json'
OUT_DIR = r'D:\VS Code Projects\Glaceon Master Set App\app\public\cards'
IMAGE_MANIFEST = r'D:\VS Code Projects\Glaceon Master Set App\app\scripts\image-manifest.json'

sys.stdout.reconfigure(encoding='utf-8')

REGION_LANG = {
    'International': 'English',
    'Japan': 'Japanese',
    'S. Chinese': 'Chinese',
    'China': 'Chinese',
}


def normalize(s):
    return re.sub(r'[^a-z0-9]+', '', s.lower())


def parse_display_number(display):
    display = display.strip()
    if re.match(r'^\d{2}\s+\d{2}/\d+$', display):
        return display.rsplit('/', 1)[0]
    m = re.match(r'^([^/]+)/', display)
    if m:
        return m.group(1).strip()
    return display


def normalize_card_number(n):
    n = n.strip().replace(' ', '')
    if n.isdigit():
        return str(int(n))
    return n


def sanitize_filename(alt):
    if not alt:
        return None
    s = alt.replace('—', '_').replace('–', '_').replace('-', '_')
    s = re.sub(r'[^\w\s\.]', '', s)
    s = re.sub(r'\s+', '_', s.strip())
    s = re.sub(r'_{2,}', '_', s)
    return s


def load_pokecottage_data():
    text = Path(DATA_JS).read_text(encoding='utf-8', errors='replace')
    json_text = text.split('window.PokeCottageMastersetInline[', 1)[1].split('= ', 1)[1].rstrip(';\n')
    data = json.loads(json_text)
    return data['cards']


def build_pc_key(pc):
    lang = REGION_LANG.get(pc['region'], pc['region'])
    set_name = pc['set']['name']
    number = normalize_card_number(parse_display_number(pc['displayCardNumber']))
    variant = pc['variant']
    return (normalize(lang), normalize(set_name), number, normalize(variant))


def build_our_key(our):
    lang = our['language']
    set_name = our['set']
    number = normalize_card_number(parse_display_number(our['cardNumber']))
    variant = our['variant']
    return (normalize(lang), normalize(set_name), number, normalize(variant))


def download(url):
    req = Request(url, headers={'User-Agent': 'Mozilla/5.0 GlaceonMasterSetApp/1.0'})
    with urlopen(req, timeout=60) as r:
        return r.read()


def main():
    out_dir = Path(OUT_DIR)
    out_dir.mkdir(parents=True, exist_ok=True)

    # Clear existing webp/png/jpg card files first to avoid stale duplicates
    for f in out_dir.iterdir():
        if f.suffix.lower() in ('.webp', '.png', '.jpg', '.jpeg'):
            f.unlink()

    pc_cards = load_pokecottage_data()
    with open(OUR_CARDS, encoding='utf-8') as f:
        our_cards = json.load(f)

    pc_by_key = {}
    for pc in pc_cards:
        key = build_pc_key(pc)
        pc_by_key.setdefault(key, []).append(pc)

    our_to_pc = {}
    for our in our_cards:
        key = build_our_key(our)
        pc_group = pc_by_key.get(key, [])
        if len(pc_group) == 1:
            our_to_pc[our['id']] = pc_group[0]
        elif len(pc_group) > 1:
            exact = [pc for pc in pc_group if normalize(pc['variant']) == normalize(our['variant'])]
            our_to_pc[our['id']] = exact[0] if exact else pc_group[0]

    manifest = {}
    failed = []
    used_names = set()

    for idx, our in enumerate(our_cards, start=1):
        pc = our_to_pc.get(our['id'])
        if not pc:
            failed.append((our['releaseOrder'], our['id'], 'no PokeCottage match'))
            print(f'  [{idx}/{len(our_cards)}] FAILED {our["id"]}: no match')
            continue

        url = pc.get('originalImageUrl') or pc.get('lightboxImageUrl') or pc.get('imageUrl')
        if not url:
            failed.append((our['releaseOrder'], our['id'], 'no image URL'))
            print(f'  [{idx}/{len(our_cards)}] FAILED {our["id"]}: no URL')
            continue

        alt = f"{pc['pokemonName']} — {pc['displayCardNumber']} — {pc['variant']}"
        base_name = sanitize_filename(alt) or f"card_{our['id']}"
        ext = Path(url.split('?')[0]).suffix or '.png'
        filename = f'{base_name}{ext}'
        counter = 1
        while filename in used_names:
            filename = f'{base_name}_{counter:02d}{ext}'
            counter += 1
        used_names.add(filename)

        try:
            data = download(url)
        except Exception as e:
            failed.append((our['releaseOrder'], our['id'], str(e)))
            print(f'  [{idx}/{len(our_cards)}] FAILED {our["id"]}: {e}')
            continue

        out_path = out_dir / filename
        out_path.write_bytes(data)
        manifest[our['id']] = f'/cards/{filename}'
        print(f'  [{idx}/{len(our_cards)}] OK {our["id"]} -> {filename} ({len(data)} bytes)')

    with open(IMAGE_MANIFEST, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print(f'\nDownloaded {len(manifest)} / {len(our_cards)}')
    print(f'Failed: {len(failed)}')
    if failed:
        for row in failed:
            print(' ', row)


if __name__ == '__main__':
    main()
