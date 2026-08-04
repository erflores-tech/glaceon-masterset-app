import re
from pathlib import Path

text = Path('masterset-core.js').read_text(encoding='utf-8', errors='replace')
for name in ['dataKeyFor','dataUrlFor']:
    idx = text.find(f'function {name}')
    if idx != -1:
        print(f'=== {name} ===')
        print(text[idx:idx+1500])
        print()

# also find REGIONS constant
m = re.search(r'const\s+REGIONS\s*=\s*\[([^\]]+)\]', text)
if m:
    print('REGIONS =', m.group(0))
