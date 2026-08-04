"""Map PokeCottage 471-glaceon-data.js cards to our spreadsheet rows.

PokeCottage mixes regions by release date, so we cannot match by index.  We join on
(language, normalized-set-name, normalized-card-number, normalized-variant) with a small
override table for the few set/number formats that differ between the two datasets.
"""
import json
import re
import sys
from pathlib import Path

DATA_JS = r'D:\VS Code Projects\Glaceon Master Set App\app\471-glaceon-data.js'
OUR_CARDS = r'D:\VS Code Projects\Glaceon Master Set App\app\src\data\cards.json'
OUT_MANIFEST = r'D:\VS Code Projects\Glaceon Master Set App\app\scripts\pokecottage-manifest.json'

sys.stdout.reconfigure(encoding='utf-8')


# PokeCottage region -> our language
REGION_LANG = {
    'International': 'English',
    'Japan': 'Japanese',
    'S. Chinese': 'Chinese',
    'China': 'Chinese',
}

# Override our set names where they differ from PokeCottage
SET_OVERRIDES = {
    # our name: PokeCottage name
}

# Override our card numbers where they differ from PokeCottage
NUMBER_OVERRIDES = {
    # (language, set, cardNumber): PokeCottage cardNumber
}


def normalize(s):
    return re.sub(r'[^a-z0-9]+', '', s.lower())


def parse_display_number(display):
    """Extract the raw card number part from strings like '070/DP-P' or '08 09/14'."""
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
        return str(int(n))  # strip leading zeros
    return n


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
    set_name = SET_OVERRIDES.get(our['set'], our['set'])
    number = normalize_card_number(parse_display_number(our['cardNumber']))
    override_num = NUMBER_OVERRIDES.get((our['language'], our['set'], our['cardNumber']))
    if override_num:
        number = normalize_card_number(override_num)
    variant = our['variant']
    return (normalize(lang), normalize(set_name), number, normalize(variant))


def main():
    pc_cards = load_pokecottage_data()
    with open(OUR_CARDS, encoding='utf-8') as f:
        our_cards = json.load(f)

    pc_by_key = {}
    for pc in pc_cards:
        key = build_pc_key(pc)
        pc_by_key.setdefault(key, []).append(pc)

    manifest = {}
    unmatched = []
    ambiguous = []

    for our in our_cards:
        key = build_our_key(our)
        matches = pc_by_key.get(key, [])

        if len(matches) == 1:
            pc = matches[0]
            manifest[our['id']] = pc.get('lightboxImageUrl') or pc.get('imageUrl')
        elif len(matches) > 1:
            ambiguous.append((our['releaseOrder'], our['language'], our['set'], our['cardNumber'], our['variant'], [m['variant'] for m in matches]))
            pc = matches[0]
            manifest[our['id']] = pc.get('lightboxImageUrl') or pc.get('imageUrl')
        else:
            unmatched.append((our['releaseOrder'], our['language'], our['set'], our['cardNumber'], our['variant'], key))

    with open(OUT_MANIFEST, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2)

    print(f'PokeCottage cards: {len(pc_cards)}')
    print(f'Our cards: {len(our_cards)}')
    print(f'Matched: {len(manifest)}')
    print(f'Unmatched: {len(unmatched)}')
    print(f'Ambiguous: {len(ambiguous)}')
    if unmatched:
        print('\nUnmatched rows:')
        for row in unmatched[:30]:
            print(' ', row)
    if ambiguous:
        print('\nAmbiguous rows:')
        for row in ambiguous[:10]:
            print(' ', row)


if __name__ == '__main__':
    main()
