import re
from pathlib import Path

text = Path('masterset-core.js').read_text(encoding='utf-8', errors='replace')
# Find DATA_SCRIPT_BASE and related constants
for name in ['DATA_SCRIPT_BASE','DATA_CACHE_VERSION','IMAGE_CACHE_VERSION','DATA_BASE_URL']:
    for m in re.finditer(rf'{name}\s*=\s*([^;\n]+)', text):
        print(f'{name} = {m.group(1)}')

print('--- all const assignments near top ---')
for m in re.finditer(r'const\s+([A-Z_][A-Z0-9_]*)\s*=\s*([^;\n]+)', text):
    print(m.group(1), '=', m.group(2))
    if m.group(1) in ('DATA_SCRIPT_BASE','DATA_BASE_URL','IMAGE_CACHE_VERSION','DATA_CACHE_VERSION'):
        break
