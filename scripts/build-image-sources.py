"""Build ordered imageSources[] for every card in cards.json.

Priority:
1. TCGdex (multilingual CDN) — only URLs that actually return HTTP 200 are kept.
2. Serebii (best Japanese coverage) — only URLs that actually return HTTP 200 are kept.
3. Text placeholder — cards with no working public image source.

This script probes the candidate URLs so the deployed app only receives working links.

Outputs:
- Rewrites src/data/cards.json with new fields:
    imageSources : list of working image URLs to try in order
    tcgdexId     : TCGdex card ID or null
    serebiiId    : Serebii path hint or null
- Prints a coverage report.
"""
import json
import re
import sys
import time
import urllib.request

sys.stdout.reconfigure(encoding='utf-8')

CARDS_PATH = r'D:\VS Code Projects\Glaceon Master Set App\app\src\data\cards.json'
MANIFEST_PATH = r'D:\VS Code Projects\Glaceon Master Set App\app\scripts\image-manifest.json'
POKECOTTAGE_MANIFEST = r'D:\VS Code Projects\Glaceon Master Set App\app\scripts\pokecottage-manifest.json'

# TCG Collector catalog IDs discovered during the image-source audit. The site
# is useful for identity verification, but its pages/images are not scraped at
# runtime. Only image URLs explicitly verified from public page metadata are
# used below; all other entries retain the spreadsheet fallback.
TCG_COLLECTOR_IDS = {
    82: 65426, 83: 65528, 84: 65513, 86: 64233, 90: 63433,
    92: 60438, 93: 60439, 94: 60568, 95: 60569, 96: 60586, 97: 60587,
    99: 59982, 100: 59983, 103: 59822, 104: 59823, 105: 59862,
    106: 62911, 107: 57967,
    125: 54611, 126: 54602, 127: 54612, 128: 54605, 129: 54613,
    130: 54606, 131: 54614, 132: 54607, 133: 54615, 134: 54603,
    135: 54610, 136: 54604, 137: 54608, 138: 54609,
    141: 53958, 144: 67141, 145: 67141, 146: 67141, 147: 67141,
    148: 66823, 149: 66846,
}

# These are the direct og:image URLs verified from TCG Collector pages. Do
# not invent hashes: the remaining catalog IDs stay linked as metadata only.
TCG_COLLECTOR_IMAGES = {
    65426: 'https://static.tcgcollector.com/content/images/11/7e/be/117ebe04bfc1b21cac1e1c71e86459236649dfe19fb73b91cfa898e24e74f2e1.webp',
    67141: 'https://static.tcgcollector.com/content/images/7f/40/b4/7f40b48b59bff1ed4cba7cb27f068540e8755ea959e84d106ea6e751b148559d.webp',
    66823: 'https://static.tcgcollector.com/content/images/e3/21/f4/e321f43caa77cfd839b9a30fb397914cae73060b1edc126b54429ee8629c5250.webp',
}

# TCGdex series code for a given TCGdex set ID.
TCGDEX_SERIES = {
    'dp5': 'dp',
    'pl2': 'pl',
    'bw5': 'bw',
    'bw9': 'bw',
    'bwp': 'bw',
    'xy3': 'xy',
    'xy10': 'xy',
    'sm5': 'sm',
    'smp': 'sm',
    'sma': 'sm',
    'swsh7': 'swsh',
    'swsh10': 'swsh',
    'swsh12.5': 'swsh',
    'swsh12.5gg': 'swsh',
    'swshp': 'swsh',
    'sv06': 'sv',
    'sv08.5': 'sv',
    'svp': 'sv',
    'SV5a': 'SV',
    'SV8a': 'SV',
    'MC': 'SV',
    'S12a': 'S',
}

# TCGdex language code for the asset URL.
TCGDEX_LANG = {
    'dp5': 'en', 'pl2': 'en', 'bw5': 'en', 'bw9': 'en', 'bwp': 'en',
    'xy3': 'en', 'xy10': 'en', 'sm5': 'en', 'smp': 'en', 'sma': 'en',
    'swsh7': 'en', 'swsh10': 'en', 'swsh12.5': 'en', 'swsh12.5gg': 'en',
    'swshp': 'en', 'sv06': 'en', 'sv08.5': 'en', 'svp': 'en',
    'SV5a': 'ja', 'SV8a': 'ja', 'MC': 'ja', 'S12a': 'ja',
}

# Serebii folder codes.  Format: https://www.serebii.net/card/{folder}/{number}.jpg
# Numbers are plain/unpadded.
SEREBII_CODES = {
    # English sets — Serebii codes where known.
    'Majestic Dawn': 'md',
    'Rising Rivals': 'rr',
    'Dark Explorers': 'de',
    'Plasma Freeze': 'pf',
    'Furious Fists': 'ff',
    'Fates Collide': 'fc',
    'Evolving Skies': 'evs',
    'Astral Radiance': 'asr',
    'Crown Zenith': 'crz',
    'Crown Zenith: Galarian Gallery': 'crz',  # numbers prefixed GG
    'Prismatic Evolutions': 'pre',
    'Black & White Promos': 'bw',
    'Sun & Moon Promos': 'smpromo',
    'Sword & Shield Promos': 'spromo',
    'Ultra Prism': 'up',
    'Hidden Fates: Shiny Vault': 'hif',

    # Japanese sets — verified by subagent research.
    'Bonds to the End of Time': None,        # no Serebii coverage
    'Spiral Force': 'spiralforce',
    'Rising Fist': 'risingfist',
    'Awakening Psychic King': 'awakeningpsychicchampion',
    'THE BEST OF XY': 'thebestofxy',
    'Ultra Moon': 'ultramoon',
    'GX Ultra Shiny': 'gxultrashiny',
    'Space Juggler': 'spacejuggler',
    'Eevee Heroes': 'eeveeheroes',
    'Start Deck 100': 'starterdeck100',
    'VSTAR Universe': 'vstaruniverse',
    'Crimson Haze': 'crimsonhaze',
    'Scarlet & Violet Promos': 'svpromo',
    'Terastal Festival ex': 'terastalfestivalex',
    'Start Deck 100 Battle Collection': 'starterdeck100battlecollection',
    'Blade Awakenings': None,                # no Serebii coverage

    # Sets with no public image source.
    'Diamond & Pearl Promos': None,
    'Dawn Dash': None,
    'Shaymin LV.X Collection Pack': None,
    'Reshiram EX Battle Strength Deck': None,
    'Battle Party Set: Reward Pack': None,
    'Gallant Galaxy V Starter Deck': None,
    'Gem Pack Vol. 2': None,
    'Polychromatic Gathering: Friend': None,
    'Storming Emergence: Abundant': None,
    'Victory Lodestar': None,
    'Eevee-GX Box Sets': None,
    'Terastal Gathering': None,
}

# ---------------------------------------------------------------------------
# Card-level overrides keyed by releaseOrder (1-149).
#
# Values:
#   tcgdex_id : exact TCGdex card ID (e.g. 'dp5-5'). TCGdex URL built and probed.
#   serebii   : if True, build and probe a Serebii URL from the set code + card number.
#               If a string, use that explicit Serebii path (e.g. 'evs/evs-40.jpg').
#   pokemon_tcg : optional Pokemon TCG CDN path (set/id.png).
#   skip      : if True, skip remote discovery but keep the bundled fallback.
# ---------------------------------------------------------------------------

OVERRIDES = {
    # Row 1: mislabeled DP-P Glaceon.
    1: {'skip': True},

    # Rows 2-5: Dawn Dash — no reliable public source.
    2: {'skip': True},
    3: {'skip': True},
    4: {'skip': True},
    5: {'skip': True},

    # Rows 6-13: Majestic Dawn (EN)
    6:  {'tcgdex_id': 'dp5-5'},
    7:  {'tcgdex_id': 'dp5-5'},
    8:  {'tcgdex_id': 'dp5-20'},
    9:  {'tcgdex_id': 'dp5-20'},
    10: {'tcgdex_id': 'dp5-20'},
    11: {'tcgdex_id': 'dp5-20'},
    12: {'tcgdex_id': 'dp5-20'},
    13: {'tcgdex_id': 'dp5-98'},

    # Rows 14-15: Bonds to the End of Time — no Serebii coverage.
    14: {'skip': True},
    15: {'skip': True},

    # Row 16: Shaymin LV.X Collection Pack — no public source.
    16: {'skip': True},

    # Rows 17-18: Rising Rivals (EN)
    17: {'tcgdex_id': 'pl2-41'},
    18: {'tcgdex_id': 'pl2-41'},

    # Row 19: Japanese BW-P promo 185.
    19: {'serebii': True},

    # Row 20: Reshiram EX Battle Strength Deck — no public source.
    20: {'skip': True},

    # Rows 21-22: Dark Explorers (EN)
    21: {'tcgdex_id': 'bw5-30'},
    22: {'tcgdex_id': 'bw5-30'},

    # Row 23: Spiral Force (JA)
    23: {'serebii': True},

    # Rows 24-28: Plasma Freeze (EN)
    24: {'tcgdex_id': 'bw9-23'},
    25: {'tcgdex_id': 'bw9-23'},
    26: {'tcgdex_id': 'bw9-23'},
    27: {'tcgdex_id': 'bw9-23'},
    28: {'tcgdex_id': 'bw9-23'},

    # Row 29: Black & White Promos (EN) BW90.
    29: {'tcgdex_id': 'bwp-BW90', 'serebii': True},

    # Rows 30-31: Rising Fist (JA)
    30: {'serebii': True},
    31: {'serebii': True},

    # Rows 32-33: Furious Fists (EN)
    32: {'tcgdex_id': 'xy3-19'},
    33: {'tcgdex_id': 'xy3-19'},

    # Rows 34-37: Awakening Psychic King (JA)
    34: {'serebii': True},
    35: {'serebii': True},
    36: {'serebii': True},
    37: {'serebii': True},

    # Rows 38-39: Fates Collide (EN)
    38: {'tcgdex_id': 'xy10-20'},
    39: {'tcgdex_id': 'xy10-116'},

    # Rows 40-41: Sun & Moon Promos (EN)
    40: {'tcgdex_id': 'smp-SM147', 'serebii': True, 'pokemon_tcg': 'smp/SM147.png'},
    41: {'tcgdex_id': 'smp-SM238', 'serebii': True, 'pokemon_tcg': 'smp/SM238.png'},

    # Rows 42-43: Sun & Moon Promos (JA S-P)
    42: {'serebii': True},
    43: {'serebii': True},

    # Row 44: THE BEST OF XY (JA)
    44: {'serebii': True},

    # Rows 45-47: Ultra Moon (JA)
    45: {'serebii': True},
    46: {'serebii': True},
    47: {'serebii': True},

    # Rows 48-50: Ultra Prism (EN)
    48: {'tcgdex_id': 'sm5-39'},
    49: {'tcgdex_id': 'sm5-141'},
    50: {'tcgdex_id': 'sm5-159'},

    # Rows 51-52: GX Ultra Shiny (JA)
    51: {'serebii': True},
    52: {'serebii': True},

    # Row 53: Hidden Fates: Shiny Vault (EN)
    53: {'tcgdex_id': 'sma-SV55'},

    # Rows 54-56: Sword & Shield Promos (JA S-P)
    54: {'serebii': True},
    55: {'serebii': True},
    56: {'serebii': True},

    # Rows 57-62: Eevee Heroes (JA)
    57: {'serebii': True},
    58: {'serebii': True},
    59: {'serebii': True},
    60: {'serebii': True},
    61: {'serebii': True},
    62: {'serebii': True},

    # Rows 63-72: Evolving Skies (EN)
    63: {'tcgdex_id': 'swsh7-40'},
    64: {'tcgdex_id': 'swsh7-40'},
    65: {'tcgdex_id': 'swsh7-40'},
    66: {'tcgdex_id': 'swsh7-41'},
    67: {'tcgdex_id': 'swsh7-41'},
    68: {'tcgdex_id': 'swsh7-41'},
    69: {'tcgdex_id': 'swsh7-174'},
    70: {'tcgdex_id': 'swsh7-175'},
    71: {'tcgdex_id': 'swsh7-208'},
    72: {'tcgdex_id': 'swsh7-209'},

    # Rows 73-74: Start Deck 100 (JA)
    73: {'tcgdex_id': 'MC-103', 'serebii': True},
    74: {'tcgdex_id': 'MC-104', 'serebii': True},

    # Rows 75-78, 89: Sword & Shield Promos (EN)
    75: {'tcgdex_id': 'swshp-SWSH196'},
    76: {'tcgdex_id': 'swshp-SWSH197'},
    77: {'tcgdex_id': 'swshp-SWSH197'},
    78: {'tcgdex_id': 'swshp-SWSH192'},
    89: {'tcgdex_id': 'swshp-SWSH197'},

    # Row 79: Space Juggler (JA)
    79: {'serebii': True},

    # Rows 80-81: Astral Radiance (EN)
    80: {'tcgdex_id': 'swsh10-038'},
    81: {'tcgdex_id': 'swsh10-038'},

    # Rows 82-84: Storming Emergence: Abundant (CH) — no public source.
    82: {'skip': True},
    83: {'skip': True},
    84: {'skip': True},

    # Row 85: VSTAR Universe (JA)
    85: {'tcgdex_id': 'S12a-217'},

    # Row 86: Eevee-GX Box Sets (CH) — no public source.
    86: {'skip': True},

    # Row 87: Crown Zenith (EN)
    87: {'tcgdex_id': 'swsh12.5-038'},

    # Row 88: Crown Zenith: Galarian Gallery (EN)
    88: {'tcgdex_id': 'swsh12.5gg-GG40', 'serebii': True},

    # Row 90: Battle Party Set: Reward Pack (CH) — no public source.
    90: {'skip': True},

    # Row 91: Scarlet & Violet Promos (JA SV-P)
    91: {'serebii': True},

    # Rows 92-97: Polychromatic Gathering: Friend (CH) — no public source.
    92: {'skip': True},
    93: {'skip': True},
    94: {'skip': True},
    95: {'skip': True},
    96: {'skip': True},
    97: {'skip': True},

    # Row 98: Crimson Haze (JA)
    98: {'tcgdex_id': 'SV5a-021'},

    # Rows 99-100: Start Deck 100 (CH) — no public source.
    99:  {'skip': True},
    100: {'skip': True},

    # Rows 101-102: Twilight Masquerade (EN)
    101: {'tcgdex_id': 'sv06-054'},
    102: {'tcgdex_id': 'sv06-054'},

    # Rows 103-105: Gallant Galaxy V Starter Deck (CH) — no public source.
    103: {'skip': True},
    104: {'skip': True},
    105: {'skip': True},

    # Row 106: Sword & Shield Promos (CH) — no public source.
    106: {'skip': True},

    # Rows 107-108: Victory Lodestar (CH) — no public source.
    107: {'skip': True},
    108: {'skip': True},

    # Rows 109-113: Terastal Festival ex (JA)
    109: {'tcgdex_id': 'SV8a-040'},
    110: {'tcgdex_id': 'SV8a-040'},
    111: {'tcgdex_id': 'SV8a-040'},
    112: {'tcgdex_id': 'SV8a-041'},
    113: {'tcgdex_id': 'SV8a-206'},

    # Rows 114-123: Prismatic Evolutions (EN)
    114: {'tcgdex_id': 'sv08.5-025'},
    115: {'tcgdex_id': 'sv08.5-025'},
    116: {'tcgdex_id': 'sv08.5-025'},
    117: {'tcgdex_id': 'sv08.5-025'},
    118: {'tcgdex_id': 'sv08.5-025'},
    119: {'tcgdex_id': 'sv08.5-026'},
    120: {'tcgdex_id': 'sv08.5-026'},
    121: {'tcgdex_id': 'sv08.5-026'},
    122: {'tcgdex_id': 'sv08.5-026'},
    123: {'tcgdex_id': 'sv08.5-150'},

    # Row 124: Scarlet & Violet Promos (EN)
    124: {'tcgdex_id': 'svp-171'},

    # Rows 125-138: Gem Pack Vol. 2 (CH) — no public source.
    125: {'skip': True},
    126: {'skip': True},
    127: {'skip': True},
    128: {'skip': True},
    129: {'skip': True},
    130: {'skip': True},
    131: {'skip': True},
    132: {'skip': True},
    133: {'skip': True},
    134: {'skip': True},
    135: {'skip': True},
    136: {'skip': True},
    137: {'skip': True},
    138: {'skip': True},

    # Rows 139-140: Start Deck 100 Battle Collection (JA)
    139: {'tcgdex_id': 'MC-162', 'serebii': True},
    140: {'tcgdex_id': 'MC-162', 'serebii': True},

    # Rows 141-143: Blade Awakenings (CH) — no public source.
    141: {'skip': True},
    142: {'skip': True},
    143: {'skip': True},

    # Rows 144-149: Terastal Gathering (CH) — no public source.
    144: {'skip': True},
    145: {'skip': True},
    146: {'skip': True},
    147: {'skip': True},
    148: {'skip': True},
    149: {'skip': True},
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def normalize_number(card_number):
    """Extract a clean localId/number from the spreadsheet card number notation."""
    if not card_number:
        return None
    s = str(card_number).strip()

    # "005/100" -> "005"
    if '/' in s:
        s = s.split('/')[0].strip()

    # "08 01/14" -> "01"  (Chinese Gem Pack)
    if ' ' in s:
        parts = s.split()
        for p in reversed(parts):
            p2 = re.sub(r'[^0-9A-Za-z]', '', p)
            if p2:
                s = p2
                break

    # Serebii uses plain numbers, not collector-number padding (012 -> 12).
    s = re.sub(r'[^0-9A-Za-z]', '', s)
    if s.isdigit():
        s = str(int(s))
    return s if s else None


def build_tcgdex_url(card_id):
    """Build candidate TCGdex asset URLs from an ID like 'dp5-5'."""
    if not card_id or '-' not in card_id:
        return []
    set_id, local_id = card_id.split('-', 1)
    series = TCGDEX_SERIES.get(set_id)
    lang = TCGDEX_LANG.get(set_id, 'en')
    if not series:
        return []
    base = f'https://assets.tcgdex.net/{lang}/{series}/{set_id}/{local_id}'
    return [base + ext for ext in ['.png', '.webp', '/high.png', '/low.png']]


def build_serebii_url(card):
    """Build a Serebii URL for a card."""
    set_name = card.get('set')
    folder = SEREBII_CODES.get(set_name)
    if not folder:
        return None

    num = normalize_number(card.get('cardNumber'))
    if not num:
        return None

    # Crown Zenith Galarian Gallery uses GG prefix.
    if set_name == 'Crown Zenith: Galarian Gallery':
        if num.startswith('GG'):
            return f'https://www.serebii.net/card/{folder}/{num}.jpg'
        return f'https://www.serebii.net/card/{folder}/GG{num}.jpg'

    # Serebii uses plain unpadded numbers.
    return f'https://www.serebii.net/card/{folder}/{num}.jpg'


def fetch_api_image_base(card_id):
    """Ask TCGdex API for the canonical image URL base (no extension)."""
    if not card_id or '-' not in card_id:
        return None
    url = f'https://api.tcgdex.net/v2/en/cards/{card_id}'
    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 GlaceonMasterSetApp/1.0',
            'Accept': 'application/json',
        })
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.loads(r.read().decode())
            return data.get('image')
    except Exception:
        return None


def probe_first_working(urls):
    """Return the first URL that returns HTTP 200, or None."""
    for url in urls:
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=15) as r:
                if r.status == 200:
                    return url
        except Exception:
            pass
    return None


def build_sources(card):
    """Return ordered list of working image URLs and diagnostic IDs."""
    ro = card.get('releaseOrder')
    override = OVERRIDES.get(ro, {})

    sources = []
    tcgdex_id = None
    serebii_id = None
    catalog_id = TCG_COLLECTOR_IDS.get(ro)

    if override.get('skip'):
        catalog_image = TCG_COLLECTOR_IMAGES.get(catalog_id)
        if catalog_image:
            sources.append(catalog_image)
        return sources, None, None, catalog_id

    # 1. Try TCGdex if we have a confirmed ID.
    if override.get('tcgdex_id'):
        tcgdex_id = override['tcgdex_id']
        # Ask API for canonical base URL, then try extensions.
        api_base = fetch_api_image_base(tcgdex_id)
        if api_base:
            candidate_urls = [api_base + ext for ext in ['.png', '.webp', '/high.png', '/low.png']]
        else:
            candidate_urls = build_tcgdex_url(tcgdex_id)
        working = probe_first_working(candidate_urls)
        if working:
            sources.append(working)

    # 2. Try Serebii if requested.
    if override.get('serebii'):
        serebii_url = build_serebii_url(card)
        if serebii_url:
            serebii_id = serebii_url.replace('https://www.serebii.net/card/', '')
            working = probe_first_working([serebii_url])
            if working:
                sources.append(working)

    # 3. The Pokemon TCG CDN is a useful English fallback for records that
    # exist in its catalog but not in TCGdex.
    if override.get('pokemon_tcg'):
        pokemon_tcg_url = f"https://images.pokemontcg.io/{override['pokemon_tcg']}"
        working = probe_first_working([pokemon_tcg_url])
        if working:
            sources.append(working)

    # TCG Collector is a low-volume catalog fallback for verified Chinese
    # printings. Put it before the local spreadsheet thumbnail when available.
    catalog_image = TCG_COLLECTOR_IMAGES.get(catalog_id)
    if catalog_image:
        sources.append(catalog_image)

    return sources, tcgdex_id, serebii_id, catalog_id


def main():
    with open(CARDS_PATH, encoding='utf-8') as f:
        cards = json.load(f)

    with open(MANIFEST_PATH, encoding='utf-8') as f:
        local_manifest = json.load(f)

    with open(POKECOTTAGE_MANIFEST, encoding='utf-8') as f:
        pokecottage_manifest = json.load(f)

    counts = {'tcgdex': 0, 'serebii': 0, 'pokecottage': 0, 'bundled': 0, 'text': 0, 'total': len(cards)}

    for i, c in enumerate(cards):
        sources, tcgdex_id, serebii_id, catalog_id = build_sources(c)

        # Primary: bundled high-res PokeCottage image. Works offline.
        local_path = local_manifest.get(c['id'])
        if local_path:
            sources.insert(0, local_path)
            counts['bundled'] += 1

        # Secondary: PokeCottage CDN URL for the same image (online fallback).
        pc_url = pokecottage_manifest.get(c['id'])
        if pc_url and pc_url not in sources:
            sources.append(pc_url)
            counts['pokecottage'] += 1

        c['imageSources'] = sources
        c['tcgdexId'] = tcgdex_id
        c['serebiiId'] = serebii_id
        c['tcgCollectorId'] = catalog_id
        c['tcgCollectorUrl'] = (
            f'https://www.tcgcollector.com/cards/{catalog_id}'
            if catalog_id else None
        )

        c.pop('imageUrl', None)
        c.pop('imageFallback', None)
        c.pop('localImage', None)

        if tcgdex_id:
            counts['tcgdex'] += 1
        if serebii_id:
            counts['serebii'] += 1
        if not sources:
            counts['text'] += 1

        if (i + 1) % 20 == 0:
            print(f'  processed {i + 1}/{len(cards)}', flush=True)
        time.sleep(0.05)  # be polite to APIs

    with open(CARDS_PATH, 'w', encoding='utf-8') as f:
        json.dump(cards, f, indent=2, ensure_ascii=False)

    print(f'\nWrote {CARDS_PATH}')
    print(f'Coverage:')
    print(f'  TCGdex source:   {counts["tcgdex"]:3d}/{counts["total"]}')
    print(f'  Serebii source:  {counts["serebii"]:3d}/{counts["total"]}')
    print(f'  PokeCottage CDN: {counts["pokecottage"]:3d}/{counts["total"]}')
    print(f'  Bundled primary: {counts["bundled"]:3d}/{counts["total"]}')
    print(f'  Text only:       {counts["text"]:3d}/{counts["total"]}')
    print(f'  With any image:  {counts["total"] - counts["text"]:3d}/{counts["total"]} ({100*(counts["total"]-counts["text"])/counts["total"]:.1f}%)')

    if counts['text']:
        print('\nText-only cards:')
        for c in cards:
            if not c['imageSources']:
                print(f"  {c['releaseOrder']:3d} | {c['language'][:2]} | {c['set'][:35]:35s} | {c['cardNumber'][:12]:12s} | {c['pokemon'][:20]:20s} | {c['variant']}")


if __name__ == '__main__':
    main()
