# Data Model Module

Schema definitions and validators live in `src/core/schemas.ts`.

Claims are JSONL objects. Invalid lines warn by default and fail only under strict command modes. Claim evidence and source must be preserved. `source: "ai-inferred"` is valid schema data, but the MVP must not generate AI-inferred claims.

Glossary terms support aliases, mappings, topics, paths, and notes.

Manifest data records projnavi version, generation time, root marker, file hashes, note hashes, evidence hashes, and inventory data. Generated manifest entries should be stable across unchanged onboard runs: hash, size, and category are enough for generated entries. `mtimeMs` remains optional only for backward compatibility with older manifests.

Primary parser tests:

- `test/claims.test.ts`
- `test/guide.test.ts`
