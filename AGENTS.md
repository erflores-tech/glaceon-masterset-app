# AGENTS.md

Rules-of-the-game for AI coding assistants working in this repo.
Human-facing context lives in [README.md](README.md).

## What this is

Offline-first PWA for tracking a Glaceon Pokémon TCG master set across
English, Japanese, and Chinese. React 19 (**JavaScript/JSX, not
TypeScript**) + Vite + Tailwind CSS, with Firebase (Auth, Firestore, Cloud
Functions, Hosting) for optional cloud sync.

## Commands

```bash
npm run dev            # Vite dev server
npm run lint           # Oxlint with --deny-warnings
npm test               # Vitest unit/component tests
npm run test:rules     # Firestore rules unit tests
npm run test:a11y      # accessibility tests (vitest-axe)
npm run test:emulator  # Firestore rules against the emulator
npm run test:functions # Cloud Functions tests (functions/ has its own package.json)
npm run validate       # FULL gate: lint + all tests + build + CSP/bundle checks
```

Run `npm run validate` before declaring a change done.

## Layout

- `src/components/` — UI components
- `src/context/` — global state and sync logic
- `src/data/` — card catalog (149 cards; generated — see `scripts/`)
- `src/hooks/`, `src/lib/` — backup, sync, layout, Firebase init
- `src/pages/` — route-level pages
- `functions/` — Cloud Functions (audit logging), separate npm project
- `scripts/` — data generation and image pipeline
- `tests/` — unit, component, a11y, and Firestore rules tests

## Hard rules

- Never commit `.env` or `dist/`.
- `SYNC_CONTRACT.md` is a contract. Sync behavior (version + timestamp
  precedence, deterministic merge) must stay consistent with it — change
  code and contract together.
- Backup imports must stay validated, size-limited, and ignore
  unknown/prototype-pollution keys. The backup format is versioned
  (current: 2); bump `version` and add a migration for incompatible
  changes.
- Offline-first is a feature: all 149 card images are bundled as lossless
  WebP (~119 MB precache). Don't break the precache or casually lazy-load
  cards.
- Firebase Hosting serves a strict CSP (`firebase.json`,
  `scripts/check-csp.js`). No inline scripts/styles that violate it.
- Conventional Commits + SemVer; release process is in README.md.
- No new dependencies without asking first — bundle budget is enforced by
  `scripts/check-bundle.js`.
