import json
import urllib.request

urls = [
    'https://api.tcgdex.net/v2/en/cards/pl2-41',
    'https://api.tcgdex.net/v2/en/cards/bw9-23',
    'https://api.tcgdex.net/v2/ja/cards/SV5a-021',
    'https://api.tcgdex.net/v2/ja/cards/S12a-217',
    'https://api.tcgdex.net/v2/ja/cards/MC-103',
    'https://api.tcgdex.net/v2/ja/cards/MC-104',
    'https://api.tcgdex.net/v2/ja/cards/MC-162',
    'https://api.tcgdex.net/v2/en/cards/dp5-5',
    'https://api.tcgdex.net/v2/en/cards/swshp-SWSH192',
]
for url in urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0','Accept':'application/json'})
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.loads(r.read().decode())
            print(f"{url}")
            print(f"  id={data.get('id')}, localId={data.get('localId')}, name={data.get('name')}")
            print(f"  image={data.get('image')}")
            print(f"  set.id={data.get('set',{}).get('id')}, set.serie={data.get('set',{}).get('serie',{}).get('id')}")
    except Exception as e:
        print(f'{url}: {e}')
    print()
