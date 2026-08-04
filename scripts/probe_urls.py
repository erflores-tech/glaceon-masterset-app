import json
import urllib.request

with open(r'D:\VS Code Projects\Glaceon Master Set App\app\src\data\cards.json', encoding='utf-8') as f:
    cards = json.load(f)

def check(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status
    except Exception as e:
        return str(e)[:60]

print('Probing all imageSources...')
tcgdex_ok = 0
serebii_ok = 0
broken = []
for c in cards:
    if not c['imageSources']:
        continue
    first_working = None
    for u in c['imageSources']:
        status = check(u)
        if status == 200:
            first_working = u
            if 'tcgdex.net' in u:
                tcgdex_ok += 1
            elif 'serebii.net' in u:
                serebii_ok += 1
            break
    if not first_working:
        broken.append(c)

print(f'TCGdex working: {tcgdex_ok}')
print(f'Serebii working: {serebii_ok}')
print(f'Broken (all sources 404): {len(broken)}')
for c in broken:
    print(f"  {c['releaseOrder']:3d} {c['language'][:2]} {c['set'][:25]:25s} | {c['cardNumber'][:12]:12s} | {c['tcgdexId'] or '-':15s} | {c['serebiiId'] or '-'}")
    for u in c['imageSources']:
        print(f'      {check(u):8s} | {u}')
