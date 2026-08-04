import re
from pathlib import Path

text = Path('masterset-table.js').read_text(encoding='utf-8', errors='replace')
for m in re.finditer(r'[\"\']([^\"\']*(?:glaceon|471|masterset|data)[^\"\']*)[\"\']', text, re.I):
    print(m.group(1))
