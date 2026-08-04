"""Merge extracted local image paths from image-manifest.json into cards.json."""
import json

CARDS_PATH = r'D:\VS Code Projects\Glaceon Master Set App\app\src\data\cards.json'
MANIFEST_PATH = r'D:\VS Code Projects\Glaceon Master Set App\app\scripts\image-manifest.json'


def main():
    with open(CARDS_PATH, encoding='utf-8') as f:
        cards = json.load(f)

    with open(MANIFEST_PATH, encoding='utf-8') as f:
        manifest = json.load(f)

    assigned = 0
    missing = 0
    for card in cards:
        cid = card['id']
        path = manifest.get(cid)
        if path:
            card['localImage'] = path
            assigned += 1
        else:
            # remove any stale localImage if not in manifest
            card.pop('localImage', None)
            missing += 1

    with open(CARDS_PATH, 'w', encoding='utf-8') as f:
        json.dump(cards, f, indent=2, ensure_ascii=False)

    print(f'Assigned localImage for {assigned}/{len(cards)} cards')
    print(f'Missing: {missing}')
    print(f'Wrote {CARDS_PATH}')


if __name__ == '__main__':
    main()
