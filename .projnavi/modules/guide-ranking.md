# Guide Ranking Module

Guide ranking lives in `src/core/guide-ranking.ts`.

The ranking system is intentionally deterministic and high precision. Exact phrase matches in claims, keywords, glossary terms, glossary aliases, or note titles should score strongly. Weak token-only matches should be excluded.

The task brief includes read-first items, relevant notes, concepts, tests, warnings, stale data warnings, evidence, and the navigation-advice disclaimer.

Relevant orchestration is in `src/commands/guide.ts`.

Primary tests:

- `test/guide.test.ts`
- `test/fixtures/fake-repo/.projnavi/claims.jsonl`
- `test/fixtures/fake-repo/.projnavi/glossary.json`
