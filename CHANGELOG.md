# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/glaceon-masterset/glaceon-masterset-app/compare/v0.0.0...HEAD
[0.0.0]: https://github.com/glaceon-masterset/glaceon-masterset-app/releases/tag/v0.0.0
