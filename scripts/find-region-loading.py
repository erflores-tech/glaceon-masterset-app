import re
from pathlib import Path

for fname in ['masterset-core.js','masterset-table.js','pokemon-masterset-widgets.js']:
    text = Path(fname).read_text(encoding='utf-8', errors='replace')
    print(f'=== {fname} ===')
    # find all loadData / loadInlineScript / region / data file construction
    for m in re.finditer(r'(?:loadInlineScript|loadData|region|Region|regions|dataUrl|DATA_SCRIPT_BASE|inlineKey|masterset-data|data/)[^\n]*', text):
        print(m.group(0))
    print()
