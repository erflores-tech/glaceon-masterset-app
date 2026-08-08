# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Align the card catalog and binder navigation with the supplied PokéCottage PDF sequence using a canonical 148-card binder order.
- Keep the SWSH197 Jumbo card in the catalog while placing it outside binder slots and after the PDF-ordered cards.
- Move Terastal Gathering `227/187` before the `046/187` variants, with `047/187` as the final binder card.

## [0.5.0] - 2026-08-05

### Added
- New **Ordered** management page at `/ordered` lists every card marked `ordered && !owned` in a responsive table with card thumbnails, set, language, variant, purchase location, and order date.
- Bulk actions on the Ordered page: select all / individual checkboxes and a **Mark selected owned** button that clears ordered state for the selected cards.
- Quick per-row **Owned** button to mark a single ordered card as arrived.
- Filter ordered cards by language and purchase location, plus search by name/set/card number.
- Sort ordered cards by order date (default newest first), release order, name, or set.
- New `markManyOwned` collection action for efficient bulk status updates.
- Component tests for the Ordered page and added `@testing-library/dom` dev dependency.

### Changed
- Top navigation now includes an **Ordered** link with a truck icon.
- `SmartImage.jsx`, `CardList.jsx`, and `CardItem.jsx` import React explicitly to support component-level tests.
- Binder page/slot calculation now excludes Jumbo cards; cards after a Jumbo shift forward one slot.

### Fixed
- `Glaceon VSTAR #SWSH197 Jumbo` no longer consumes a binder page slot, and all following cards are shifted by one position.

## [0.4.0] - 2026-08-05

### Changed
- Upgrade GitHub Actions to v5 (`actions/checkout@v5`, `actions/setup-node@v5`, `actions/setup-java@v5`) and Node.js 22 in CI.
- Pin `firebase-tools@15.25.1` in CI for reproducible emulator runs.
- Update `firebase` to `^12.17.1`.

### Fixed
- Stop cloud sync icon and footer text from flickering on mobile by memoizing the icon/text and avoiding provider re-renders when Firestore snapshots echo unchanged local state.
- Remove the import/upload button from BackupButtons; only export remains.
- CI `npm ci` failure caused by peer-dependency conflict: install with `--legacy-peer-deps`.
- Firestore rules test now loads `@firebase/rules-unit-testing` dynamically and only runs when `FIRESTORE_EMULATOR_HOST` is set, so local `npm run test` skips it while CI runs it under the emulator.
- Resolve all Oxlint warnings and split context into `CollectionContext.js` + `CollectionProvider.jsx` for fast-refresh compliance.

## [0.3.0] - 2026-08-04

### Changed
- Replace the "Want List" feature with "Ordered" status, since every master set card is wanted by definition.
- Marking a card as Owned now clears its Ordered status and purchase location automatically.
- Backup format bumped to v2; v1 backups with `want: true` are automatically migrated to `ordered: true` on import.
- Status filter becomes All / Owned / Needed / Ordered.
- Dashboard "Want List" tile replaced with "In Transit" tile for ordered-but-not-owned cards.

### Added
- `ordered`, `purchaseLocation`, and `orderedAt` fields per card.
- Purchase location input on card detail with a quick-pick sheet of recent locations.
- `src/hooks/useRecentLocations.js` to suggest recent purchase locations.
- `src/hooks/useLastListState.js` preserves list page and filters when returning from card detail.

## [0.2.0] - 2026-08-04

### Changed
- Convert bundled card images from PNG to lossless WebP, reducing the set from 162 MB to ~119 MB (26.6% smaller).
- Precache all 149 WebP card images so every card renders offline from first launch.
- Update Workbox glob patterns to include `webp` and remove the separate local-card-images runtime cache.

### Added
- `scripts/convert-cards-to-webp.mjs` for reproducible image conversion.
- `tests/data/cards.test.js` to verify every card's primary image source is a bundled WebP file.

## [0.1.0] - 2026-08-03

### Security
- Add Content Security Policy and security headers for Firebase Hosting.
- Validate collection backup imports and prevent prototype-pollution keys.
- Add Firestore security rules test coverage.

### Changed
- Establish project baseline, Git repository, and Conventional Commits workflow.
- Centralize binder layout configuration and memoize collection statistics.
- Improve Firestore sync conflict handling with versioning.
- Replace browser `alert()` calls with accessible toast notifications.
- Avoid precaching card images; cache them at runtime to reduce install size.

### Added
- Error boundary for graceful runtime error recovery.
- Vitest + React Testing Library test suite with backup and layout tests.
- GitHub Actions CI workflow for lint, build, and test.
- CONTRIBUTING.md and project-specific README.

## [0.0.0] - 2026-08-03

### Added
- Initial Glaceon Master Set PWA release.
- Offline-first collection tracking with Firebase Auth + Firestore sync.
- 149-card catalog across English, Japanese, and Chinese languages.
- Binder-style layouts (2×2, 3×3, 4×3, 4×4), search/filter, dashboard, export/import.

[Unreleased]: https://github.com/erflores-tech/glaceon-masterset-app/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/erflores-tech/glaceon-masterset-app/releases/tag/v0.5.0
[0.4.0]: https://github.com/erflores-tech/glaceon-masterset-app/releases/tag/v0.4.0
[0.3.0]: https://github.com/erflores-tech/glaceon-masterset-app/releases/tag/v0.3.0
[0.2.0]: https://github.com/erflores-tech/glaceon-masterset-app/releases/tag/v0.2.0
[0.1.0]: https://github.com/erflores-tech/glaceon-masterset-app/releases/tag/v0.1.0
[0.0.0]: https://github.com/erflores-tech/glaceon-masterset-app/releases/tag/v0.0.0
