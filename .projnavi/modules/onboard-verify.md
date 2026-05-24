# Onboard And Verify Modules

Onboarding and freshness checks are coupled through `manifest.json`.

`src/core/onboard-scan.ts` scans the repo, respects `.gitignore` as much as practical, ignores common noise directories, hashes relevant files and notes, and records evidence hashes.

`src/core/verify.ts` recomputes hashes for manifest, claim, evidence, and glossary paths. Changed or missing evidence marks related claims stale.

Relevant commands:

- `src/commands/onboard.ts`
- `src/commands/verify.ts`

Primary tests:

- `test/verify.test.ts`
- `test/cli.test.ts`
