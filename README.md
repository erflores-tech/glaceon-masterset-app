# Glaceon Master Set

Offline-first Progressive Web App for tracking your Glaceon Pokémon TCG master set collection across English, Japanese, and Chinese languages.

## Features

- **149-card catalog** with release order, sets, variants, and multi-language support.
- **Offline-first**: collection data is saved locally and synced to Firebase when signed in.
- **Cloud sync** via Firebase Auth (Google or anonymous) and Firestore.
- **Binder layouts**: 2×2, 3×3, 4×3, 4×4 with pagination matching physical pages.
- **Search and filter** by set, language, variant, and ownership status.
- **Card detail view** with notes, grade, page/slot position, and prev/next navigation.
- **Export/import JSON** backups with validation and preview.
- **PWA install** and automatic update prompts.

## Quick start

1. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
2. Fill in your Firebase project configuration in `.env`.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Available scripts

- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run lint` — run Oxlint
- `npm run test` — run Vitest tests
- `npm run test:rules` — run Firestore rules tests
- `npm run preview` — preview production build locally

## Firebase setup

1. Create a Firebase project.
2. Enable **Google** and **Anonymous** authentication providers.
3. Create a Firestore database in production or test mode.
4. Deploy security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
5. Deploy hosting after building:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

## Project structure

- `src/` — React application source
  - `components/` — UI components
  - `context/` — global state and sync logic
  - `data/` — card catalog
  - `hooks/` — reusable hooks
  - `lib/` — utilities (backup, layout, Firebase init)
  - `pages/` — route-level pages
- `scripts/` — data-generation and image-pipeline scripts
- `archive/` — legacy widget scripts retained for reference
- `tests/` — unit, component, and Firestore rules tests

## Security notes

- Firebase Hosting serves a strict Content Security Policy and security headers (see `firebase.json`).
- Firestore rules allow each user to read/write only their own `users/{uid}/collection/state` document.
- Backup imports are validated, size-limited, and ignore unknown/prototype-pollution keys.
- Never commit `.env` or `dist/`; both are ignored by Git.

## Backup format

Backups are JSON files with this structure:

```json
{
  "version": 1,
  "exportedAt": "2026-08-03T00:00:00.000Z",
  "cards": {
    "card-id": { "owned": true, "want": false, "note": "", "grade": "NM" }
  }
}
```

The version field helps future releases detect incompatible backup formats.

## Releasing

This project uses [Conventional Commits](https://www.conventionalcommits.org/) and [Semantic Versioning](https://semver.org/).

1. Update `CHANGELOG.md` under `## [Unreleased]`.
2. Bump `package.json` version according to SemVer.
3. Run the full test suite and build.
4. Create a Git tag: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`.
5. Deploy to Firebase Hosting and update release notes with the deployed URL.

## License

Private project — not licensed for public distribution.
