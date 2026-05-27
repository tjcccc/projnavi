# Guide Ranking Module

Guide ranking lives in `src/core/guide-ranking.ts`.

The ranking system is intentionally deterministic and high precision. Exact phrase matches in claims, keywords, glossary terms, glossary aliases, or note titles should score strongly. Weak token-only matches should be excluded.

The task brief includes read-first items, relevant notes, concepts, tests, warnings, stale data warnings, evidence, and the navigation-advice disclaimer.

`Read first` should prioritize narrow claim/evidence-backed source and test paths. Broad project/module/flow notes should remain visible under relevant notes, but should not occupy first-pass slots unless they are clearly task-specific and stronger than file evidence, or no narrow claim-backed files match.

`--max-items <n>` caps only `Read first`. It should not remove relevant notes, concepts, suggested tests, warnings, stale warnings, evidence, or the disclaimer.

Known precision risks to track:

- Cross-domain tasks can mention one area with strong claims and a second area with weaker or missing claims. The guide may find the first domain but miss persistence/model files in the second domain.
- Suggested tests are derived from ranked claims and manifest test paths. If claims are too broad, suggested tests can be plausible but wrong.

Relevant orchestration is in `src/commands/guide.ts`.

Primary tests:

- `test/guide.test.ts`
- `test/fixtures/fake-repo/.projnavi/claims.jsonl`
- `test/fixtures/fake-repo/.projnavi/glossary.json`
