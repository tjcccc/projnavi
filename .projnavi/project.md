# projnavi Project Notes

`projnavi` is a local deterministic TypeScript CLI for coding agents. It reads `.projnavi` Markdown, JSON, JSONL, and manifest data to produce short task briefs.

Core product loop: onboard once, guide often, verify freshness.

Primary goals:

- Save exploration time by pointing agents at a small read-first set.
- Save tokens by avoiding broad, repeated repo scans.
- Improve correctness by attaching claims to evidence and checking freshness.
- Keep agent integrations policy-first: agent docs tell tools when to use `projnavi guide`; full `onboard` and `benchmark` workflows live in installed skills.

## Architecture

- `src/cli.ts` is the command dispatcher and binary entrypoint.
- `src/commands/` contains command orchestration and terminal-facing behavior.
- `src/core/` contains deterministic parsing, ranking, scanning, manifest, and verification logic.
- `test/fixtures/fake-repo/` is the main fixture used to prove guide ranking and stale detection.
- `projnavi integrate` installs or refreshes agent policy docs and skill files without changing the core `.projnavi` data model.

## Product Constraints

- No external AI calls, embeddings, vector search, database, network service, MCP server, or Codex Skill in the MVP.
- Keep dependencies boring and small.
- Prefer human-readable `.projnavi` data that can be committed.
- `guide` output is navigation advice, not ground truth.
- Favor precision over context volume. Broad module or project notes should stay visible in guide output, but narrow evidence-backed source and test files should win `Read first`.
- `guide` is most valuable for high-entropy tasks: cross-layer changes, frontend/display work, architecture-sensitive edits, provider integrations, scattered ownership, project-specific concepts, or unclear names.
- Obvious single-slice backend/API tasks may be just as efficient with normal `rg`; projnavi may improve relevance without reducing output size.

## v0.4.0 Surface

- `projnavi --version` and `projnavi -v` print the package version.
- `projnavi guide "<task>" --max-items <n>` caps only the `Read first` list.
- `projnavi integrate` adds agent integrations after init. `--agent codex` installs the global Codex skill and updates repo `AGENTS.md` policy guidance; `--agent codex --repo-doc` updates only repo policy guidance.
- `--agent-doc <path>` writes managed policy guidance for generic or future agents. `--skills-dir <path>` writes a full `projnavi/SKILL.md` workflow to that skill directory.
- Manifest writes are stable: generated manifests omit `mtimeMs`, preserve `generatedAt` when effective content is unchanged, and avoid rewriting unchanged files.

## Useful Queries

- `projnavi guide "guide ranking"`
- `projnavi guide "guide max items"`
- `projnavi guide "agent integration"`
- `projnavi guide "policy-only agent docs"`
- `projnavi guide "stable manifest"`
- `projnavi guide "stale evidence"`
- `projnavi guide "init no overwrite"`
- `projnavi guide "onboard manifest"`
