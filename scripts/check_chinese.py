import urllib.request

# Try to guess TCGdex Chinese (zh-tw) asset URLs for Chinese cards.
candidates = [
    # Terastal Gathering (rows 144-149) — maybe same set as Japanese SV8a
    ('https://assets.tcgdex.net/zh-tw/SV/SV8a/046.png', 'Terastal Gathering 046'),
    ('https://assets.tcgdex.net/zh-tw/SV/SV8a/047.png', 'Terastal Gathering 047'),
    ('https://assets.tcgdex.net/zh-tw/SV/SV8a/227.png', 'Terastal Gathering 227'),
    # Blade Awakenings (rows 141-143) — maybe S6H
    ('https://assets.tcgdex.net/zh-tw/S/S6H/061.png', 'Blade Awakenings 061'),
    # Gallant Galaxy V Starter Deck (rows 103-105)
    ('https://assets.tcgdex.net/zh-tw/SV/SV7a/037.png', 'Gallant Galaxy 037'),
    ('https://assets.tcgdex.net/zh-tw/SV/SV7a/038.png', 'Gallant Galaxy 038'),
    ('https://assets.tcgdex.net/zh-tw/SV/SV7a/159.png', 'Gallant Galaxy 159'),
    # Start Deck 100 Chinese (rows 99-100) — maybe MC
    ('https://assets.tcgdex.net/zh-tw/SV/MC/103.png', 'Start Deck 100 CH 103'),
    ('https://assets.tcgdex.net/zh-tw/SV/MC/104.png', 'Start Deck 100 CH 104'),
    # Victory Lodestar (rows 107-108) — unknown
    ('https://assets.tcgdex.net/zh-tw/SV/SV7/019.png', 'Victory Lodestar 019'),
    # Gem Pack Vol. 2 (rows 125-138) — Chinese exclusive, unknown
    ('https://assets.tcgdex.net/zh-tw/SV/CP3/801.png', 'Gem Pack guess 801'),
    ('https://assets.tcgdex.net/zh-tw/SV/CP3/802.png', 'Gem Pack guess 802'),
    # Polychromatic Gathering (rows 92-97)
    ('https://assets.tcgdex.net/zh-tw/SV/SV6a/034.png', 'Polychromatic 034'),
    ('https://assets.tcgdex.net/zh-tw/SV/SV6a/035.png', 'Polychromatic 035'),
]

for url, label in candidates:
    try:
        req = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=15) as r:
            print(f'{r.status:3d} | {label} | {url}')
    except Exception as e:
        print(f'ERR | {label} | {url} | {str(e)[:40]}')
