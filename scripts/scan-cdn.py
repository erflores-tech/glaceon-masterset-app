import re
from pathlib import Path

FILES = [
    'masterset-table.js',
    'masterset-core.js',
    'pokemon-masterset-widgets.js',
    'masterset-binder.js',
    'masterset-evolution.js',
]

for f in FILES:
    text = Path(f).read_text(encoding='utf-8', errors='replace')
    urls = re.findall(r'https?://[^\s\"\'\`\)\]\}\>,]+', text)
    image_urls = [u for u in urls if any(e in u.lower() for e in ['.jpg','.jpeg','.png','.webp','.avif','.gif','image','cdn','tcgplayer','cardmarket','pokemon','serebii','pokecottagecdn','squarespace'])]
    print(f'=== {f} ===')
    for u in sorted(set(image_urls))[:40]:
        print(u)
    print()
