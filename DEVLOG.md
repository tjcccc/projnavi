# DEVLOG

## 2026-05-24

- Created the TypeScript/Node CLI project structure with pnpm, ESLint, Vitest, and strict TypeScript.
- Implemented the MVP commands:
  - `projnavi init`
  - `projnavi init --agent codex`
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
- Claude agent setup is not implemented yet; `init --agent codex` is the only supported agent setup flag.
