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

## Pull request checklist

- [ ] `npm run lint` passes.
- [ ] `npm run build` succeeds.
- [ ] Tests cover changed behavior.
- [ ] Firestore rules tests pass if rules changed.
- [ ] README updated if user-facing behavior changed.
- [ ] CHANGELOG updated under `## [Unreleased]`.
