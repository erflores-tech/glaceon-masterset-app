import json
import time
from pathlib import Path
from urllib.request import urlopen, Request

DATA_JS = r'D:\VS Code Projects\Glaceon Master Set App\app\471-glaceon-data.js'
text = Path(DATA_JS).read_text(encoding='utf-8', errors='replace')
json_text = text.split('window.PokeCottageMastersetInline[', 1)[1].split('= ', 1)[1].rstrip(';\n')
data = json.loads(json_text)

REGION_LANG = {'International':'English','Japan':'Japanese','S. Chinese':'Chinese','China':'Chinese'}
def norm(s): return ''.join(c for c in s.lower() if c.isalnum())
def parse(d):
    d=d.strip()
    import re
    if re.match(r'^\d{2}\s+\d{2}/\d+$',d): return d.rsplit('/',1)[0]
    m=re.match(r'^([^/]+)/',d)
    return m.group(1).strip() if m else d

def normn(n):
    n=n.strip().replace(' ','')
    return str(int(n)) if n.isdigit() else n

def key(pc): return (norm(REGION_LANG.get(pc['region'],pc['region'])), norm(pc['set']['name']), normn(parse(pc['displayCardNumber'])), norm(pc['variant']))
pc_by_key={}
for pc in data['cards']:
    pc_by_key.setdefault(key(pc),[]).append(pc)

our=json.load(open(r'D:\VS Code Projects\Glaceon Master Set App\app\src\data\cards.json', encoding='utf-8'))
def ourkey(o): return (norm(o['language']), norm(o['set']), normn(parse(o['cardNumber'])), norm(o['variant']))

manifest=json.load(open(r'D:\VS Code Projects\Glaceon Master Set App\app\scripts\image-manifest.json', encoding='utf-8'))
out_dir=Path(r'D:\VS Code Projects\Glaceon Master Set App\app\public\cards')

failed_ids=['51ab44dd7f9e','9fdacd043ef0','32a4d410502e','06ffc936e9f4']
for cid in failed_ids:
    o=next(c for c in our if c['id']==cid)
    k=ourkey(o)
    matches=pc_by_key.get(k,[])
    if not matches:
        print('no match', cid); continue
    pc=matches[0]
    url=pc.get('originalImageUrl') or pc.get('imageUrl')
    if cid in manifest:
        filename=Path(manifest[cid]).name
    else:
        alt=f"{pc['pokemonName']} — {pc['displayCardNumber']} — {pc['variant']}"
        s=alt.replace('—','_').replace('–','_').replace('-','_')
        import re
        s=re.sub(r'[^\w\s\.]', '', s)
        s=re.sub(r'\s+','_',s.strip())
        s=re.sub(r'_{2,}','_',s)
        filename=f'{s}.png'
    print('Retrying', cid, filename)
    for attempt in range(5):
        try:
            req=Request(url, headers={'User-Agent':'Mozilla/5.0'})
            d=urlopen(req, timeout=60).read()
            (out_dir/filename).write_bytes(d)
            manifest[cid]=f'/cards/{filename}'
            print('  OK attempt', attempt+1, len(d))
            break
        except Exception as e:
            print('  attempt', attempt+1, 'failed:', e)
            time.sleep(1)

with open(r'D:\VS Code Projects\Glaceon Master Set App\app\scripts\image-manifest.json','w',encoding='utf-8') as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)
print('manifest entries:', len(manifest))
