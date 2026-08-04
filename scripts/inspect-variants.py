import json
import re
from pathlib import Path

text = Path('471-glaceon-data.js').read_text(encoding='utf-8', errors='replace')
json_text = text.split('window.PokeCottageMastersetInline[', 1)[1]
json_text = json_text.split('= ', 1)[1].rstrip(';\n')
data = json.loads(json_text)

variants = set()
sets = set()
for c in data['cards']:
    sets.add((c['region'], c['set']['name']))
    variants.add((c['region'], c['set']['name'], c['variant']))

print('Sets by region:')
for r in ['English','Japan','S. Chinese']:
    print(' ', r)
    for s in sorted({n for (reg,n) in sets if reg==r}):
        print('   ', s)
print('\nSample variants per region:')
for r in ['English','Japan','S. Chinese']:
    print(' ', r)
    for v in sorted({v for (reg,_,v) in variants if reg==r})[:15]:
        print('   ', v)
