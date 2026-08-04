import re
from pathlib import Path

text = Path('masterset-core.js').read_text(encoding='utf-8', errors='replace')
# Print region/data loading code with more context
for name in ['REGIONS','regionLabel','regionShortLabel','loadData','dataUrlFor','dataKeyFor','loadInlineScript']:
    idx = text.find(f'function {name}')
    if idx == -1:
        idx = text.find(f'const {name}')
    if idx == -1:
        idx = text.find(name)
    if idx != -1:
        print(f'=== {name} ===')
        print(text[idx:idx+2500])
        print()
