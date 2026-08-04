import json
from pathlib import Path

text = Path('471-glaceon-data.js').read_text(encoding='utf-8', errors='replace')
# strip JS wrapper, leaving JSON object
json_text = text.split('window.PokeCottageMastersetInline["471-glaceon"] = ', 1)[1].rstrip(';\n')
data = json.loads(json_text)
print('keys:', list(data.keys()))
print('cards count:', len(data.get('cards', [])))
print('first card keys:', list(data['cards'][0].keys()))
print('first card:')
print(json.dumps(data['cards'][0], indent=2, ensure_ascii=False))

# Find unique image URL patterns
urls = set()
for c in data.get('cards', []):
    for key in ('imageUrl','thumbnailUrl','lightboxImageUrl','originalImageUrl'):
        v = c.get(key)
        if v:
            urls.add(v)
print('\nunique image url count:', len(urls))
for u in sorted(urls)[:10]:
    print(u)
