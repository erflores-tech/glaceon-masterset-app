from pathlib import Path
import re

html = Path(r'C:\Users\eldin\.local\share\opencode\tool-output\tool_fc9461575001QLGVadc6XiH0P0').read_text(encoding='utf-8', errors='replace')
scripts = re.findall(r'<script[^>]*src=["\']([^"\']+)["\'][^>]*>', html)
print('script count', len(scripts))
for s in scripts:
    if 'masterset' in s or 'data' in s or 'pokecottagecdn' in s:
        print(s)
print('--- data-inline-key ---')
for m in re.finditer(r'data-inline-key=["\']([^"\']+)["\']', html):
    print(m.group(1))
print('--- data-masterset ---')
for m in re.finditer(r'data-masterset=["\']([^"\']+)["\']', html):
    print(m.group(1))
