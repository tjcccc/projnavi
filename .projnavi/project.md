# projnavi Project Notes

`projnavi` is a local deterministic TypeScript CLI for coding agents. It reads `.projnavi` Markdown, JSON, JSONL, and manifest data to produce short task briefs.

Core product loop: onboard once, guide often, verify freshness.

Primary goals:

- Save exploration time by pointing agents at a small read-first set.
- Save tokens by avoiding broad, repeated repo scans.
- Improve correctness by attaching claims to evidence and checking freshness.

## Architecture

- `src/cli.ts` is the command dispatcher and binary entrypoint.
- `src/commands/` contains command orchestration and terminal-facing behavior.
- `src/core/` contains deterministic parsing, ranking, scanning, manifest, and verification logic.
- `test/fixtures/fake-repo/` is the main fixture used to prove guide ranking and stale detection.

## Product Constraints

- No external AI calls, embeddings, vector search, database, network service, MCP server, or Codex Skill in the MVP.
- Keep dependencies boring and small.
- Prefer human-readable `.projnavi` data that can be committed.
- `guide` output is navigation advice, not ground truth.

## Useful Queries

- `projnavi guide "guide ranking"`
- `projnavi guide "stale evidence"`
- `projnavi guide "init no overwrite"`
- `projnavi guide "onboard manifest"`
