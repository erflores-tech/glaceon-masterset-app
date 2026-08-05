# Contributing to Glaceon Master Set

## Quick start

1. Copy `.env.example` to `.env` and fill in your Firebase project values.
2. Run `npm install`.
3. Run `npm run dev` for local development.
4. Run `npm run lint` and `npm run test` before committing.

## Commit convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation only
- `style:` formatting, no code change
- `refactor:` code change that neither fixes a bug nor adds a feature
- `perf:` performance improvement
- `test:` adding or correcting tests
- `chore:` build, tooling, dependency updates
- `ci:` continuous integration changes
- `security:` security hardening

Example: `feat(cards): add Korean language support`

## Versioning

Releases follow [Semantic Versioning](https://semver.org/). The project is currently in `0.x`; breaking backup-format or sync-behavior changes will increment the minor version until `1.0.0`.

## Asset pipeline

- Card images live in `public/cards/` and must remain in WebP format.
- The first entry in each card's `imageSources` array must point to the bundled WebP (`/cards/...webp`). CDN URLs follow as fallbacks.
- If you add or replace card images, run `node scripts/convert-cards-to-webp.mjs` after updating the source PNGs, or adjust the script to match your workflow.

## Pull request checklist

- [ ] `npm run lint` passes.
- [ ] `npm run build` succeeds.
- [ ] Tests cover changed behavior.
- [ ] `tests/data/cards.test.js` passes if card images changed.
- [ ] Firestore rules tests pass if rules changed.
- [ ] README updated if user-facing behavior changed.
- [ ] CHANGELOG updated under `## [Unreleased]`.
- [ ] Version badge in README updated if `package.json` version changed.
