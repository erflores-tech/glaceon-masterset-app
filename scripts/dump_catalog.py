import json
from collections import Counter

with open(r'D:\VS Code Projects\Glaceon Master Set App\app\src\data\cards.json', encoding='utf-8') as f:
    cards = json.load(f)

print(f'Total cards: {len(cards)}')
print('By language:', dict(Counter(c['language'] for c in cards)))
print('By set:')
for s, n in sorted(Counter(c['set'] for c in cards).items(), key=lambda x: -x[1]):
    print(f'  {n:3d} {s}')
print()
print('All cards:')
for c in cards:
    print(f"  {c['releaseOrder']:3d} | {c['language'][:2]} | {c['set'][:40]:40s} | {c['cardNumber'][:14]:14s} | {c['pokemon'][:22]:22s} | {c['variant']}")
