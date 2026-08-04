from pathlib import Path
import re

html = Path('pokecottage-page.html').read_text(encoding='utf-8', errors='replace')
print('len', len(html))
print('masterset count', html.lower().count('masterset'))
print('glaceon count', html.lower().count('glaceon'))

# Find inline data scripts
scripts = re.findall(r'<script[^\u003e]*data-pc-masterset-data=["\']([^"\']+)["\'][^\u003e]*src=["\']([^"\']+)["\'][^\u003e]*>', html)
print('inline data scripts:', scripts)

# Find all data-inline-key
keys = re.findall(r'data-inline-key=["\']([^"\']+)["\']', html)
print('inline keys:', keys)

# Find all pokecottagecdn script URLs
for m in re.finditer(r'https://pokecottagecdn\.com[^"\'\s>]+', html):
    print(m.group(0))

# Find any inline JSON assignments
idx = html.find('window.PokeCottageMastersetInline')
print('inline data index', idx)
if idx != -1:
    print(html[idx:idx+2000])
