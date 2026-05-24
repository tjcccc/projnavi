# Changelog

## 0.2.0 - Claude Code project skill

- Added `projnavi init --agent claude` to create a project-scoped Claude Code skill at `.claude/skills/projnavi/SKILL.md`.
- Added a plain `projnavi init` hint that points users to the Codex and Claude agent setup flags.
- Added Claude Code usage docs for `/projnavi onboard`, `/projnavi benchmark`, and `/projnavi <task>`.
- Refreshed the guide benchmark default task now that Claude support is implemented.

## 0.1.1 - Global install fix

- Fixed npm global binary execution when invoked through a symlinked package bin.
- Made built `dist/cli.js` executable during `pnpm build` so npm global installs can run the CLI directly.

## 0.1.0 - MVP

- Added local deterministic `projnavi` CLI with `init`, `onboard`, `guide`, `notes`, and `verify`.
- Added `projnavi init --agent codex` to create project `AGENTS.md` instructions for short prompts such as `projnavi onboard` and `projnavi benchmark`.
- Added human-readable `.projnavi` scaffold: project notes, module notes, flow notes, glossary, claims JSONL, and manifest.
- Added deterministic guide ranking over claims, glossary, notes, paths, tests, evidence, and freshness warnings.
- Added manifest hashing and verify checks for changed or missing evidence.
- Added benchmark workflow and `pnpm benchmark:guide` for comparing dry-run investigation with and without projnavi.
- Added Vitest coverage for parsing, glossary matching, guide output, stale detection, init overwrite behavior, agent instruction generation, and CLI smoke paths.
- Added npm publish metadata.
