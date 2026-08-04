import json
import re
import sys
from pathlib import Path

DATA_JS = r'D:\VS Code Projects\Glaceon Master Set App\app\471-glaceon-data.js'
OUR_CARDS = r'D:\VS Code Projects\Glaceon Master Set App\app\src\data\cards.json'

sys.stdout.reconfigure(encoding='utf-8')


def normalize(s):
    return re.sub(r'[^a-z0-9]+', '', s.lower())


def region_to_language(region):
    return {
        'International': 'English',
        'Japan': 'Japanese',
        'China': 'Chinese',
    }.get(region, region)


def parse_display_number(display):
    display = display.strip()
    if re.match(r'^\d{2}\s+\d{2}/\d+$', display):
        return display.rsplit('/', 1)[0]
    m = re.match(r'^([^/]+)/', display)
    if m:
        return m.group(1).strip()
    return display


def load_pokecottage_data():
    text = Path(DATA_JS).read_text(encoding='utf-8', errors='replace')
    json_text = text.split('window.PokeCottageMastersetInline[', 1)[1].split('= ', 1)[1].rstrip(';\n')
    return json.loads(json_text)['cards']


def build_pc_key(card):
    lang = region_to_language(card['region'])
    set_name = card['set']['name']
    number = parse_display_number(card['displayCardNumber'])
    variant = card['variant']
    return (normalize(lang), normalize(set_name), normalize(number), normalize(variant))


def build_our_key(card):
    return (
        normalize(card['language']),
        normalize(card['set']),
        normalize(parse_display_number(card['cardNumber'])),
        normalize(card['variant']),
    )


def main():
    pc_cards = load_pokecottage_data()
    with open(OUR_CARDS, encoding='utf-8') as f:
        our_cards = json.load(f)

    # Debug: print PokeCottage keys for Majestic Dawn
    print('PokeCottage Majestic Dawn keys:')
    for pc in pc_cards:
        if pc['set']['name'] == 'Majestic Dawn':
            print(' ', build_pc_key(pc), pc['displayCardNumber'], pc['variant'])

    print('\nOur Majestic Dawn keys:')
    for our in our_cards:
        if our['set'] == 'Majestic Dawn':
            print(' ', build_our_key(our), our['cardNumber'], our['variant'])


if __name__ == '__main__':
    main()
