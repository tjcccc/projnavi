# TODO

Post-MVP roadmap. Keep the work focused on the core loop:
`init -> onboard -> guide -> verify -> benchmark`.

## Guide precision

- [ ] Add layered guide output: `Read first`, `Likely next`, `Tests / validation`, and `Reference notes`.
- [ ] Add `projnavi guide --compact` for token-bounded agent output.
- [x] Add `projnavi guide --max-items <n>` to control first-pass output size.
- [x] Prefer narrow evidence-backed claims over broad project or module notes.
- [ ] Penalize broad notes that match many unrelated tasks.
- [ ] Improve cross-domain ranking when a task mentions two related domains but the strongest claims cover only one.
- [ ] Improve suggested test selection so unrelated high-scoring tests do not outrank domain-specific tests.
- [ ] Mark guide items as `fresh`, `stale`, or `unknown`.
- [ ] Penalize stale claims in guide ranking while still surfacing stale warnings.

## Benchmark quality

- [ ] Add benchmark fixtures with expected core and secondary target files.
- [ ] Report core hit rate, secondary hit rate, cross-domain target hit rate, irrelevant first-pass count, missed required scope files, and output size reduction.
- [ ] Add regression thresholds for guide output growth and missed core files.
- [ ] Add a quality flag for “improved relevance but failed to reduce output size.”
- [ ] Track wrong suggested tests in benchmark review.
- [ ] Keep captured benchmark outputs for local audit under an ignored directory.

## Data quality

- [ ] Add optional claim scopes: `core`, `secondary`, `reference`, `test`, and `warning`.
- [ ] Add optional task tags such as `provider`, `generation`, `frontend`, `backend`, `cli`, `config`, `test`, and `docs`.
- [ ] Add `projnavi notes lint` for missing evidence, broad claims, invalid paths, and weak metadata.
- [ ] Add examples of high-quality narrow claims.
- [ ] Add examples of cross-domain claims, such as CRM installation routes linked to product persistence, schema, and model files.
- [ ] Add note/claim lint for tasks or notes that mention multiple domains while claims cover only one domain.
- [ ] Stop `projnavi onboard` from recreating scaffold example notes after a project has real `.projnavi` notes.

## Freshness and onboarding

- [x] Stabilize manifest writes so repeated onboarding does not churn when tracked content is unchanged.
- [ ] Add `projnavi verify --json`.
- [ ] Add `projnavi verify --strict` as an explicit strictness flag.
- [ ] Add `projnavi refresh-manifest`.
- [ ] Add `projnavi onboard --dry-run`.
- [ ] Add `projnavi onboard --update-manifest-only`.
- [ ] Extract package scripts, test commands, and major directories into manifest/project notes.
- [ ] Detect common project types such as Node, Tauri, Rust, Vite, and Next.js.

## Agent integration

- [x] Add `projnavi --version` / `-v`.
- [x] Add `projnavi integrate` for adding agent integrations after project init.
- [x] Add `projnavi init --agent codex`.
- [x] Add Codex global skill installation plus minimal repo `AGENTS.md` policy guidance.
- [x] Add `projnavi init --agent claude` with a project-scoped `.claude/skills/projnavi/SKILL.md`.
- [x] Add Cursor, OpenCode, generic agent doc, and generic skills directory integrations.
- [x] Keep generated agent docs policy-only while full workflows live in skill files.
- [x] Preserve existing agent files and update only managed sections or managed files.
- [x] Add tests for idempotence and preservation of user-edited agent content.
- [x] Document Codex, Claude Code, Cursor, OpenCode, generic agent doc, and generic skills directory usage.
- [ ] Decide whether `projnavi update` should refresh project-local integration targets and user-local global skills.
- [ ] If automatic skill refresh is needed, track global installs in user-local config and project integrations in repo-local config, not in `manifest.json`.

## Product positioning

- [x] Document that projnavi is strongest for high-entropy tasks and is not a replacement for `rg` on obvious narrow tasks.

## v1.0.0 readiness

- [ ] Keep benchmark examples that illustrate frontend/cross-layer wins, backend moderate wins, and cross-domain miss cases.
- [ ] Define a small release-quality benchmark suite with target hit rate, missed-scope tolerance, wrong-test tolerance, and output-size reduction checks.
- [ ] Decide whether `projnavi update` is required before 1.0, based on real repeated integration-refresh needs.

## Later

- [ ] Add MCP server support after CLI behavior is stable.
- [ ] Add AI-assisted onboarding after notes and claims schema are stable.
- [ ] Add Tree-sitter symbol extraction for stronger static claims.
- [ ] Consider SQLite only if JSONL and Markdown become insufficient.
- [ ] Consider embeddings only as optional discovery, not as ground truth.
