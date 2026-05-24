# Changelog

## 0.1.0 - MVP

- Added local deterministic `projnavi` CLI with `init`, `onboard`, `guide`, `notes`, and `verify`.
- Added `projnavi init --agent codex` to create project `AGENTS.md` instructions for short prompts such as `projnavi onboard` and `projnavi benchmark`.
- Added human-readable `.projnavi` scaffold: project notes, module notes, flow notes, glossary, claims JSONL, and manifest.
- Added deterministic guide ranking over claims, glossary, notes, paths, tests, evidence, and freshness warnings.
- Added manifest hashing and verify checks for changed or missing evidence.
- Added benchmark workflow and `pnpm benchmark:guide` for comparing dry-run investigation with and without projnavi.
- Added Vitest coverage for parsing, glossary matching, guide output, stale detection, init overwrite behavior, agent instruction generation, and CLI smoke paths.
- Added npm publish metadata.
- Fixed npm global binary execution when invoked through a symlinked package bin.
