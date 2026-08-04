import re
from pathlib import Path

text = Path('masterset-core.js').read_text(encoding='utf-8', errors='replace')
# find functions related to image URLs
for m in re.finditer(r'(?:cardImageUrl|imageUrl|resolveAsset|loadData|dataUrl)\b[^\n]*', text):
    print(m.group(0))
print('---')
# print a window around cardImageUrl
idx = text.find('cardImageUrl')
print(text[idx-500:idx+1500])
