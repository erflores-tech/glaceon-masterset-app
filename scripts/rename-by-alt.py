"""Rename already-downloaded PokeCottage images to filenames based on alt text.

Uses 471-glaceon-data.js to build the alt text for each card, maps it to our card ids,
and copies/renames the existing downloaded webp files in public/cards/.
Updates scripts/image-manifest.json.
"""
import json
import re
import sys
from pathlib import Path
from shutil import copy2

DATA_JS = r'D:\VS Code Projects\Glaceon Master Set App\app\471-glaceon-data.js'
OUR_CARDS = r'D:\VS Code Projects\Glaceon Master Set App\app\src\data\cards.json'
OLD_MANIFEST = r'D:\VS Code Projects\Glaceon Master Set App\app\scripts\pokecottage-manifest.json'
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
    """Turn 'Glaceon LV.X — DP4 — 1st Edition' into 'Glaceon_LV.X_DP4_1st_Edition'."""
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


def build_alt(pc):
    return f"{pc['pokemonName']} — {pc['displayCardNumber']} — {pc['variant']}"


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


def main():
    pc_cards = load_pokecottage_data()
    with open(OUR_CARDS, encoding='utf-8') as f:
        our_cards = json.load(f)
    with open(OLD_MANIFEST, encoding='utf-8') as f:
        old_manifest = json.load(f)

    out_dir = Path(OUT_DIR)
    out_dir.mkdir(parents=True, exist_ok=True)

    # Build a lookup from old URL to existing local file path
    url_to_old_file = {}
    for card_id, path in old_manifest.items():
        # card_id here is our card id; path is /cards/filename
        old_file = out_dir / Path(path).name
        url_to_old_file[path] = old_file

    # Map each PokeCottage card to our card id
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
            # Match by exact variant; if still ambiguous, pick first
            exact = [pc for pc in pc_group if normalize(pc['variant']) == normalize(our['variant'])]
            our_to_pc[our['id']] = exact[0] if exact else pc_group[0]

    # Now build new filenames based on alt text
    new_manifest = {}
    used_names = set()

    for our in our_cards:
        pc = our_to_pc.get(our['id'])
        if not pc:
            print(f"  no PokeCottage match for {our['id']}")
            continue

        # Find old file for this our card id
        old_path = old_manifest.get(our['id'])
        if not old_path:
            print(f"  no old download for {our['id']}")
            continue

        old_file = url_to_old_file.get(old_path)
        if not old_file or not old_file.exists():
            print(f"  old file missing: {old_path}")
            continue

        alt = build_alt(pc)
        base_name = sanitize_filename(alt) or f"card_{our['id']}"
        ext = old_file.suffix
        filename = f'{base_name}{ext}'
        counter = 1
        while filename in used_names:
            filename = f'{base_name}_{counter:02d}{ext}'
            counter += 1
        used_names.add(filename)

        new_file = out_dir / filename
        copy2(old_file, new_file)
        new_manifest[our['id']] = f'/cards/{filename}'
        print(f"  {our['id']} -> {filename}")

    with open(IMAGE_MANIFEST, 'w', encoding='utf-8') as f:
        json.dump(new_manifest, f, indent=2, ensure_ascii=False)

    print(f'\nWrote {len(new_manifest)} entries to {IMAGE_MANIFEST}')
    print(f'Output dir: {OUT_DIR}')


if __name__ == '__main__':
    main()
