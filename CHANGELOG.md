# Changelog

## 0.4.0 - Agent integration and guide precision

- Added `projnavi --version` / `-v`.
- Added `projnavi guide --max-items <n>` and tightened guide ranking so evidence-backed source and test paths win over broad notes in first-pass output.
- Added `projnavi integrate` for adding agent integrations after project init.
- Added Codex global skill installation plus minimal repo `AGENTS.md` policy guidance.
- Added Cursor, OpenCode, generic `--agent-doc <path>`, and generic `--skills-dir <skills-folder>` integration support.
- Made generated agent docs policy-only while keeping full onboarding and benchmark workflows in skill files.
- Stabilized `.projnavi/manifest.json` so repeated onboarding does not churn when tracked content is unchanged.
- Documented the projnavi product boundary for high-entropy tasks versus obvious narrow tasks.

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
