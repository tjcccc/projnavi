# Benchmark Plan

Use this plan to check whether projnavi is improving the agent workflow over time.

The benchmark compares two dry-run investigation protocols for the same task:

- **Without projnavi**: broad status, file tree, search, and likely source/doc reads.
- **With projnavi**: `projnavi guide "<task>"`, then only the files the guide points to for first-pass inspection.

## Default Task

```text
Add support for projnavi init --agent claude that creates project-scoped Claude guidance/skill while preserving existing files.
```

This task is intentionally cross-cutting: CLI parsing, init behavior, templates, tests, docs, and agent guidance may all be relevant.

## Run

Build first so `dist/cli.js` is current:

```bash
pnpm build
node scripts/compare-guide.mjs
```

For machine-readable output:

```bash
node scripts/compare-guide.mjs --json
```

To test another task:

```bash
node scripts/compare-guide.mjs "change guide ranking confidence output"
```

## Metrics

The script reports:

- wall time in milliseconds
- number of shell commands
- output bytes
- output lines
- words
- approximate tokens by `bytes / 4`
- output file paths for audit
- reduction percentages for bytes, lines, approximate tokens, and commands

Approximate tokens are not model token accounting. They are a stable proxy for how much terminal/context material the agent would need to process.

## Agent Prompt

When the user says:

```text
projnavi benchmark
```

the agent should treat it as a read-only benchmark request:

```text
Based on the current project, choose a realistic complex codebase task. Do not edit files. Dry-run investigation twice: first without projnavi using normal repo exploration, search, and file reads; then with projnavi by running `projnavi guide "<task>"` and inspecting only the recommended first-pass files. Measure wall time, command count, output bytes, output lines, approximate tokens, and qualitative relevance. Report a professional Markdown table, a compact shareable summary, whether projnavi pointed to the right files, and the caveat that approximate tokens are estimated from output bytes rather than model token accounting.
```

## Review Criteria

For the default task, projnavi should usually:

- reduce approximate tokens by at least 30%
- reduce output lines by at least 25%
- point to `src/commands/init.ts`, `src/core/templates.ts`, and `test/init.test.ts`
- report no stale data warnings
- avoid more than 8 read-first items

If these regress, improve `.projnavi` notes, glossary entries, claims, or guide ranking before adding broader features.

## Interpretation

This benchmark is intentionally small and repeatable. It does not prove global productivity gains. It checks whether projnavi is doing its intended job in this repo:

- save exploration time
- save context tokens
- improve correctness through evidence and freshness checks
