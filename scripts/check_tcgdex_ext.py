import urllib.request

base_urls = [
    'https://assets.tcgdex.net/en/dp/dp5/20',
    'https://assets.tcgdex.net/en/pl/pl2/41',
    'https://assets.tcgdex.net/en/bw/bw9/23',
    'https://assets.tcgdex.net/en/xy/xy3/19',
    'https://assets.tcgdex.net/ja/SV/SV5a/021',
    'https://assets.tcgdex.net/ja/S/S12a/217',
    'https://assets.tcgdex.net/ja/SV/MC/103',
    'https://assets.tcgdex.net/en/sv/sv06/054',
    'https://assets.tcgdex.net/en/sv/svp/171',
]
exts = ['.png', '.webp', '/high.png', '/low.png', '/high.webp', '/low.webp']

for base in base_urls:
    print(f'{base}')
    for ext in exts:
        url = base + ext
        try:
            req = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=15) as r:
                print(f'  {ext:12s} -> {r.status} {r.headers.get("content-type","")}')
        except Exception as e:
            pass
    print()
