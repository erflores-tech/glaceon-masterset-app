"""Resolve TCGdex set IDs/series for the Glaceon checklist and enrich cards.json."""
import json
import sys
import time
import urllib.request
import urllib.parse

sys.stdout.reconfigure(encoding='utf-8')

CARDS_PATH = r'D:\VS Code Projects\Glaceon Master Set App\app\src\data\cards.json'

# Manual overrides for Japanese / Chinese / niche sets using translated checklist names.
# Key: set name as it appears in the Excel sheet.
# Value: { setId, series, lang } for TCGdex asset URLs.
SET_OVERRIDES = {
    'Awakening Psychic King': {'setId': 'XY10', 'series': 'xy', 'lang': 'ja'},
    'Black & White Promos': {'setId': 'bwp', 'series': 'bw', 'lang': 'en'},  # try English promos
    'Bonds to the End of Time': {'setId': 'S12', 'series': 's', 'lang': 'ja'},
    'Crimson Haze': {'setId': 'SV5a', 'series': 'sv', 'lang': 'ja'},
    'Dawn Dash': {'setId': 'S9a', 'series': 's', 'lang': 'ja'},
    'Diamond & Pearl Promos': {'setId': 'dpp', 'series': 'dp', 'lang': 'en'},
    'Eevee Heroes': {'setId': 'S6a', 'series': 's', 'lang': 'ja'},
    'GX Ultra Shiny': {'setId': 'SM8b', 'series': 'sm', 'lang': 'ja'},
    'Reshiram EX Battle Strength Deck': None,
    'Rising Fist': {'setId': 'XY3', 'series': 'xy', 'lang': 'ja'},
    'Scarlet & Violet Promos': {'setId': 'svp', 'series': 'sv', 'lang': 'en'},
    'Shaymin LV.X Collection Pack': None,
    'Space Juggler': {'setId': 'S10P', 'series': 's', 'lang': 'ja'},
    'Spiral Force': {'setId': 'S11', 'series': 's', 'lang': 'ja'},
    'Start Deck 100': {'setId': 'MC', 'series': 'sv', 'lang': 'ja'},
    'Start Deck 100 Battle Collection': {'setId': 'MC', 'series': 'sv', 'lang': 'ja'},
    'Sun & Moon Promos': {'setId': 'smp', 'series': 'sm', 'lang': 'en'},
    'Sword & Shield Promos': {'setId': 'swshp', 'series': 'swsh', 'lang': 'en'},
    'THE BEST OF XY': {'setId': 'CP4', 'series': 'xy', 'lang': 'ja'},
    'Terastal Festival ex': {'setId': 'SV8a', 'series': 'sv', 'lang': 'ja'},
    'Ultra Moon': {'setId': 'SM5M', 'series': 'sm', 'lang': 'ja'},
    'VSTAR Universe': {'setId': 'S12a', 'series': 's', 'lang': 'ja'},
    'Battle Party Set: Reward Pack': None,
    'Blade Awakenings': {'setId': 'S6H', 'series': 's', 'lang': 'ja'},
    'Crown Zenith: Galarian Gallery': {'setId': 'swsh12.5gg', 'series': 'swsh', 'lang': 'en'},
    'Gallant Galaxy V Starter Deck': None,
    'Gem Pack Vol. 2': None,
    'Hidden Fates: Shiny Vault': {'setId': 'sma', 'series': 'sm', 'lang': 'en'},
    'Polychromatic Gathering: Friend': None,
    'Storming Emergence: Abundant': None,
    'Victory Lodestar': None,
}


def fetch_json(url):
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 GlaceonMasterSetApp/1.0',
        'Accept': 'application/json',
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f'  fetch error for {url}: {e}', flush=True)
        return None


def search_set(set_name):
    """Look up TCGdex set by name; return its id or None."""
    q = urllib.parse.quote(set_name)
    url = f'https://api.tcgdex.net/v2/en/sets?name={q}'
    data = fetch_json(url)
    if not data:
        return None
    for item in data:
        if item.get('name', '').lower() == set_name.lower():
            return item['id']
    return data[0]['id']


def get_set_detail(set_id):
    url = f'https://api.tcgdex.net/v2/en/sets/{set_id}'
    return fetch_json(url)


def extract_local_id(card_number):
    """Convert card numbers like '005/100', 'TG15/TG30', 'SWSH204' to a local id."""
    if not card_number:
        return None
    s = str(card_number).strip()
    s = s.split('/')[0]
    if s.isdigit():
        s = str(int(s))
    return s if s else None


def resolve_set(set_name):
    """Return {setId, series, lang} for a set name, or None."""
    if set_name in SET_OVERRIDES:
        return SET_OVERRIDES[set_name]
    set_id = search_set(set_name)
    if not set_id:
        return None
    detail = get_set_detail(set_id)
    if not detail:
        return None
    series = detail.get('serie', {}).get('id') if 'serie' in detail else None
    return {'setId': set_id, 'series': series, 'lang': 'en'}


def main():
    with open(CARDS_PATH, encoding='utf-8') as f:
        cards = json.load(f)

    unique_sets = sorted({c['set'] for c in cards})
    set_cache = {}
    print(f'Resolving {len(unique_sets)} unique sets...')
    for set_name in unique_sets:
        info = resolve_set(set_name)
        set_cache[set_name] = info
        if info:
            print(f'  {set_name} -> {info["lang"]}/{info["series"]}/{info["setId"]}')
        else:
            print(f'  {set_name} -> NOT FOUND')
        time.sleep(0.1)

    updated = 0
    for c in cards:
        info = set_cache.get(c['set'])
        local_id = extract_local_id(c.get('cardNumber'))
        c['localId'] = local_id
        if info and info.get('series') and info.get('setId') and local_id:
            c['setId'] = info['setId']
            c['series'] = info['series']
            lang = info.get('lang', 'en')
            c['imageUrl'] = f'https://assets.tcgdex.net/{lang}/{info["series"]}/{info["setId"]}/{local_id}.png'
            c['imageFallback'] = True
            updated += 1
        else:
            c['setId'] = info.get('setId') if info else None
            c['series'] = info.get('series') if info else None
            c['imageUrl'] = None
            c['imageFallback'] = True

    with open(CARDS_PATH, 'w', encoding='utf-8') as f:
        json.dump(cards, f, indent=2, ensure_ascii=False)

    print(f'Wrote {CARDS_PATH}')
    print(f'Cards with resolved image URL: {updated}/{len(cards)}')


if __name__ == '__main__':
    main()
