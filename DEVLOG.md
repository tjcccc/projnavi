# DEVLOG

## 2026-05-27

- Prepared v0.4.0 with precision-focused guide ranking, `projnavi guide --max-items <n>`, `projnavi --version`, and `projnavi integrate`.
- Added Codex global skill installation plus minimal repo `AGENTS.md` policy guidance so normal broad tasks use `projnavi guide "<task>"` as a terminal command.
- Added Cursor, OpenCode, generic `--agent-doc <path>`, and generic `--skills-dir <skills-folder>` integration support.
- Kept generated agent docs policy-only and kept full `onboard` / `benchmark` workflows inside skill files.
- Stabilized manifest writes by removing generated `mtimeMs` churn and preserving `generatedAt` when effective manifest content is unchanged.
- Documented the product boundary: projnavi is strongest for high-entropy tasks and should not replace `rg` for obvious narrow backend/API work.

## 2026-05-24

- Created the TypeScript/Node CLI project structure with pnpm, ESLint, Vitest, and strict TypeScript.
- Implemented the MVP commands:
  - `projnavi init`
  - `projnavi init --agent codex`
  - `projnavi init --agent claude`
  - `projnavi onboard`
  - `projnavi guide "<task>"`
  - `projnavi guide "<task>" --format json`
  - `projnavi notes <topic>`
  - `projnavi verify`
- Dogfooded projnavi on this repo by adding `.projnavi` notes, glossary entries, evidence-backed claims, and a refreshed manifest.
- Added project `AGENTS.md` guidance so agents can treat `projnavi onboard` and `projnavi benchmark` as short workflow prompts.
- Added `scripts/compare-guide.mjs` and `docs/benchmark-plan.md` to measure context reduction from projnavi.
- Added `TODO.md` for post-MVP polish items.
- Added npm package metadata; actual npm publishing remains manual.
- Fixed global npm binary execution by resolving symlinked bin paths before checking the CLI entrypoint, and made the built `dist/cli.js` executable.
- Prepared v0.1.1 as the release version for the global-install fix.
- Expanded `TODO.md` into a focused post-MVP roadmap for guide precision, benchmark quality, data quality, freshness, onboarding, and agent integration without changing the package version.
- Added a plain `projnavi init` hint that tells users to run `projnavi init --agent codex` when they want Codex `AGENTS.md` instructions.
- Added `projnavi init --agent claude`, which creates a project-scoped Claude Code skill at `.claude/skills/projnavi/SKILL.md` for `/projnavi onboard`, `/projnavi benchmark`, and guide-style task arguments.
- Prepared v0.2.0 as the release version for Claude Code project skill support.
- Verified the current MVP with:
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm test`
  - `pnpm build`
  - `pnpm benchmark:guide`
  - `node dist/cli.js onboard`
  - `node dist/cli.js verify`

## Notes

- The MVP is intentionally local and deterministic. It does not call external LLMs, embedding APIs, vector databases, network services, MCP servers, or Codex Skill implementations.
- `onboard` currently recreates scaffold example notes if they are missing because it defensively runs init. This is acceptable for MVP but should be revisited.
- Claude Code setup uses a project-scoped skill instead of writing full command instructions into `CLAUDE.md`.
