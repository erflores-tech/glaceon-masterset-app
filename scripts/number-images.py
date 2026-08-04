"""Rename downloaded card images to include spreadsheet release-order prefix.

Reads src/data/cards.json, takes the current local image path, and renames the file to:
    {releaseOrder:03d}_{existing_filename}
Then updates image-manifest.json and cards.json imageSources.
"""
import json
import sys
from pathlib import Path

CARDS_JSON = r'D:\VS Code Projects\Glaceon Master Set App\app\src\data\cards.json'
IMAGE_MANIFEST = r'D:\VS Code Projects\Glaceon Master Set App\app\scripts\image-manifest.json'
OUT_DIR = r'D:\VS Code Projects\Glaceon Master Set App\app\public\cards'

sys.stdout.reconfigure(encoding='utf-8')


def main():
    with open(CARDS_JSON, encoding='utf-8') as f:
        cards = json.load(f)
    with open(IMAGE_MANIFEST, encoding='utf-8') as f:
        manifest = json.load(f)

    out_dir = Path(OUT_DIR)
    new_manifest = {}

    for card in cards:
        ro = card['releaseOrder']
        old_path = manifest.get(card['id'])
        if not old_path:
            print(f'  [{ro:03d}] no manifest entry for {card["id"]}')
            continue

        old_file = out_dir / Path(old_path).name
        if not old_file.exists():
            # try imageSources[0]
            old_path2 = card.get('imageSources', [None])[0]
            if old_path2:
                old_file = out_dir / Path(old_path2).name
        if not old_file.exists():
            print(f'  [{ro:03d}] file missing: {old_file}')
            continue

        # Build new filename: 001_existing_name.png
        new_filename = f'{ro:03d}_{old_file.name}'
        new_file = out_dir / new_filename

        # Rename if names differ
        if old_file != new_file:
            old_file.rename(new_file)

        new_path = f'/cards/{new_filename}'
        new_manifest[card['id']] = new_path

        # Update card imageSources in place
        sources = card.get('imageSources', [])
        # Replace first source (local) with new path; keep others
        if sources:
            sources[0] = new_path
        else:
            sources = [new_path]
        card['imageSources'] = sources

    # Save manifest
    with open(IMAGE_MANIFEST, 'w', encoding='utf-8') as f:
        json.dump(new_manifest, f, indent=2, ensure_ascii=False)

    # Save cards.json
    with open(CARDS_JSON, 'w', encoding='utf-8') as f:
        json.dump(cards, f, indent=2, ensure_ascii=False)

    print(f'Renamed {len(new_manifest)} images')
    print(f'Sample: {list(new_manifest.items())[0]}')


if __name__ == '__main__':
    main()
