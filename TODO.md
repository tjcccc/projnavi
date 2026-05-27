# TODO

Post-MVP roadmap. Keep the work focused on the core loop:
`init -> onboard -> guide -> verify -> benchmark`.

## v0.2.0: Guide precision

- [ ] Add layered guide output: `Read first`, `Likely next`, `Tests / validation`, and `Reference notes`.
- [ ] Add `projnavi guide --compact` for token-bounded agent output.
- [x] Add `projnavi guide --max-items <n>` to control first-pass output size.
- [x] Prefer narrow evidence-backed claims over broad project or module notes.
- [ ] Penalize broad notes that match many unrelated tasks.
- [ ] Mark guide items as `fresh`, `stale`, or `unknown`.
- [ ] Penalize stale claims in guide ranking while still surfacing stale warnings.

## v0.3.0: Benchmark quality

- [ ] Add benchmark fixtures with expected core and secondary target files.
- [ ] Report core hit rate, secondary hit rate, irrelevant first-pass count, and output size reduction.
- [ ] Add regression thresholds for guide output growth and missed core files.
- [ ] Keep captured benchmark outputs for local audit under an ignored directory.

## v0.4.0: Data quality

- [ ] Add optional claim scopes: `core`, `secondary`, `reference`, `test`, and `warning`.
- [ ] Add optional task tags such as `provider`, `generation`, `frontend`, `backend`, `cli`, `config`, `test`, and `docs`.
- [ ] Add `projnavi notes lint` for missing evidence, broad claims, invalid paths, and weak metadata.
- [ ] Add examples of high-quality narrow claims.
- [ ] Stop `projnavi onboard` from recreating scaffold example notes after a project has real `.projnavi` notes.

## v0.5.0: Freshness and onboarding

- [ ] Add `projnavi verify --json`.
- [ ] Add `projnavi verify --strict` as an explicit strictness flag.
- [ ] Add `projnavi refresh-manifest`.
- [ ] Add `projnavi onboard --dry-run`.
- [ ] Add `projnavi onboard --update-manifest-only`.
- [ ] Extract package scripts, test commands, and major directories into manifest/project notes.
- [ ] Detect common project types such as Node, Tauri, Rust, Vite, and Next.js.

## Agent integration

- [x] Add `projnavi init --agent codex`.
- [x] Add `projnavi init --agent claude` with a project-scoped `.claude/skills/projnavi/SKILL.md`.
- [x] Add Cursor, OpenCode, generic agent doc, and generic skills directory integrations.
- [x] Preserve existing agent files and update only managed sections or managed files.
- [x] Add tests for idempotence and preservation of user-edited agent content.
- [x] Document Codex `AGENTS.md` and Claude Code project skill usage.
- [ ] Decide whether `projnavi update` should refresh project-local integration targets and user-local global skills.
- [ ] If automatic skill refresh is needed, track global installs in user-local config and project integrations in repo-local config, not in `manifest.json`.

## Later

- [ ] Add MCP server support after CLI behavior is stable.
- [ ] Add AI-assisted onboarding after notes and claims schema are stable.
- [ ] Add Tree-sitter symbol extraction for stronger static claims.
- [ ] Consider SQLite only if JSONL and Markdown become insufficient.
- [ ] Consider embeddings only as optional discovery, not as ground truth.
