import json
import urllib.request

with open(r'D:\VS Code Projects\Glaceon Master Set App\app\src\data\cards.json', encoding='utf-8') as f:
    cards = json.load(f)

def check(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, r.headers.get('content-type','')
    except Exception as e:
        return str(e)[:60], ''

# Sample across source types and sets.
sample_indices = [5, 16, 23, 29, 42, 52, 72, 79, 84, 97, 107, 127]
sample = [cards[i] for i in sample_indices]

print('URL check sample:')
for c in sample:
    print(f"\n{c['releaseOrder']:3d} {c['language'][:2]} {c['set'][:25]:25s} {c['cardNumber'][:12]:12s}")
    for u in c['imageSources']:
        status, ct = check(u)
        print(f'  {str(status):8s} | {u}')
