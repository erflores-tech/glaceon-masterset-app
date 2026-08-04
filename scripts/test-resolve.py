"""Test resolving card images via TCGdex search by set + name."""
import json
import sys
import time
import urllib.request
import urllib.parse

sys.stdout.reconfigure(encoding='utf-8')

CARDS_PATH = r'D:\VS Code Projects\Glaceon Master Set App\app\src\data\cards.json'


def fetch(url):
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 GlaceonApp/1.0',
        'Accept': 'application/json',
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode())
    except Exception as e:
        print('  fetch err:', e)
        return None


def main():
    with open(CARDS_PATH, encoding='utf-8') as f:
        cards = json.load(f)

    for c in cards[:20]:
        name = c['pokemon'].split()[0]
        cn = str(c['cardNumber']).strip()
        set_name = c['set']
        # Try searching by name only, then filter by set name
        q_name = urllib.parse.quote(name)
        url = f'https://api.tcgdex.net/v2/en/cards?name={q_name}'
        data = fetch(url)
        matches = []
        if data:
            for item in data:
                if item.get('set', {}).get('name', '').lower() == set_name.lower():
                    matches.append(item)
        print("{} | {} | #{} | {} | matches={}".format(
            c['id'][:8], set_name, cn, c['language'], len(matches)))
        for m in matches[:3]:
            img = m.get('image', {})
            print('    localId={} name={} url={}'.format(
                m.get('localId'), m.get('name'), img.get('url')))
        time.sleep(0.2)


if __name__ == '__main__':
    main()
