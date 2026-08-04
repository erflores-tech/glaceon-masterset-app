"""Extract embedded card art from the Excel checklist, upscale 2x, deduplicate by hash.

Outputs to app/public/cards/ as img_NNN.jpg (NNN = row index 0-148).
Deduplicates identical images by hash so each unique art is stored once.
Also writes scripts/image-manifest.json mapping card id -> local image path.
"""
import hashlib
import json
import sys
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET

from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

XLSX_PATH = r'D:\VS Code Projects\Glaceon Master Set App\PokeCottage-GLACEON-Master-Set-Checklist.xlsx'
OUT_DIR = r'D:\VS Code Projects\Glaceon Master Set App\app\public\cards'
MANIFEST_PATH = r'D:\VS Code Projects\Glaceon Master Set App\app\scripts\image-manifest.json'
CARDS_JSON = r'D:\VS Code Projects\Glaceon Master Set App\app\src\data\cards.json'

NS = {
    'xdr': 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing',
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    'rel': 'http://schemas.openxmlformats.org/package/2006/relationships',
}


def load_rid_to_target(xlsx_zip):
    rels_xml = xlsx_zip.read('xl/drawings/_rels/drawing1.xml.rels').decode('utf-8')
    root = ET.fromstring(rels_xml)
    mapping = {}
    for rel in root.findall('rel:Relationship', NS):
        rid = rel.attrib['Id']
        target = rel.attrib['Target']
        mapping[rid] = target
    return mapping


def parse_drawing_anchors(xlsx_zip):
    """Return list of (card_index, media_path) for each image anchor."""
    rid_to_target = load_rid_to_target(xlsx_zip)
    drawing_xml = xlsx_zip.read('xl/drawings/drawing1.xml').decode('utf-8')
    root = ET.fromstring(drawing_xml)

    anchors = []
    # TwoCellAnchor and OneCellAnchor both contain from/to markers
    for anchor in root.findall('.//xdr:twoCellAnchor', NS):
        from_row_el = anchor.find('xdr:from/xdr:row', NS)
        if from_row_el is None:
            continue
        from_row = int(from_row_el.text)
        # sheet row 1 = first data row = card index 0
        card_index = from_row - 1
        if card_index < 0:
            continue
        blip = anchor.find('.//a:blip', NS)
        if blip is None:
            continue
        rid = blip.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed')
        if not rid:
            continue
        target = rid_to_target.get(rid)
        if not target:
            continue
        media_path = target.lstrip('/')
        anchors.append((card_index, media_path))
    return anchors


def main():
    Path(OUT_DIR).mkdir(parents=True, exist_ok=True)

    xlsx_zip = ZipFile(XLSX_PATH)
    anchors = parse_drawing_anchors(xlsx_zip)
    print(f'Found {len(anchors)} drawing anchors')

    with open(CARDS_JSON, encoding='utf-8') as f:
        cards = json.load(f)

    hash_to_file = {}
    manifest = {}

    for card_index, media_path in anchors:
        if card_index >= len(cards):
            continue
        card = cards[card_index]
        card_id = card['id']

        # target is like '../media/imageN.jpg'; resolve relative to drawings folder
        resolved_media_path = media_path.replace('../media/', 'xl/media/')
        raw = xlsx_zip.read(resolved_media_path)
        if not raw:
            print(f'  row {card_index}: empty media {resolved_media_path}, skipping')
            continue

        pil_img = Image.open(BytesIO(raw))
        if pil_img.mode in ('RGBA', 'P'):
            pil_img = pil_img.convert('RGB')

        # Upscale 2x if width < 220
        if pil_img.width < 220:
            pil_img = pil_img.resize((pil_img.width * 2, pil_img.height * 2), Image.LANCZOS)

        buf = BytesIO()
        pil_img.save(buf, format='JPEG', quality=88)
        post_bytes = buf.getvalue()
        h = hashlib.sha1(post_bytes).hexdigest()

        if h in hash_to_file:
            filename = hash_to_file[h]
        else:
            filename = f'img_{card_index:03d}.jpg'
            out_path = Path(OUT_DIR) / filename
            out_path.write_bytes(post_bytes)
            hash_to_file[h] = filename

        manifest[card_id] = f'/cards/{filename}'

    with open(MANIFEST_PATH, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2)

    unique = len(hash_to_file)
    print(f'Wrote {len(manifest)} entries to {MANIFEST_PATH}')
    print(f'Unique images: {unique} / {len(manifest)}')
    print(f'Output dir: {OUT_DIR}')


if __name__ == '__main__':
    main()
