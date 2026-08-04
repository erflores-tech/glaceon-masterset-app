from pathlib import Path
import re

html = Path(r'C:\Users\eldin\.local\share\opencode\tool-output\tool_fc9461575001QLGVadc6XiH0P0').read_text(encoding='utf-8', errors='replace')
keys = re.findall(r'data-pc-masterset-data=[\"\']([^\"\']+)[\"\']', html)
print('inline data keys:', keys)

scripts = re.findall(r'<script[^\u003e]*>.*?\u003c/script\u003e', html, re.S)
for s in scripts:
    if '471-glaceon' in s or 'PokeCottageMastersetInline' in s:
        print('--- script ---')
        print(s[:1000])
