# AGENTS

Project guidance for coding agents working on `projnavi`.

<!-- projnavi-agent-codex:start -->
## projnavi

projnavi is a local navigation layer for coding agents. Humans initialize it; agents use it before broad work.

When the user says exactly or approximately:

```text
projnavi onboard
```

treat it as this task:

```text
Run projnavi onboarding for this repo. Execute `projnavi onboard`, inspect the repo, improve the `.projnavi` project notes, module notes, flow notes, glossary, and claims for future guide queries, then run `projnavi onboard` again and `projnavi verify`. Update `AGENTS.md` only if useful. Do not make unrelated code changes.
```

Before broad or ambiguous codebase work, run:

```bash
projnavi guide "<task>"
```

Use guide output as navigation advice only. Verify source files before editing. Skip projnavi for trivial single-file edits where the user already named the exact file and location.

After changing files referenced by `.projnavi/claims.jsonl`, `.projnavi/glossary.json`, or `.projnavi` notes, run:

```bash
projnavi onboard
projnavi verify
```

When the user says exactly or approximately:

```text
projnavi benchmark
```

treat it as this read-only benchmark request:

```text
Based on the current project, choose a realistic complex codebase task. Do not edit files. Dry-run investigation twice: first without projnavi using normal repo exploration, search, and file reads; then with projnavi by running `projnavi guide "<task>"` and inspecting only the recommended first-pass files. Measure wall time, command count, output bytes, output lines, approximate tokens, and qualitative relevance. Report a professional Markdown table, a compact shareable summary, whether projnavi pointed to the right files, and the caveat that approximate tokens are estimated from output bytes rather than model token accounting.
```
<!-- projnavi-agent-codex:end -->

## Stack

- Runtime: Node.js LTS.
- Language: TypeScript.
- Package manager: pnpm.
- CLI entrypoint: `src/cli.ts`.
- Command orchestration: `src/commands/`.
- Deterministic core logic: `src/core/`.

## Constraints

- Keep the MVP local and deterministic.
- Do not add external LLM calls, embedding APIs, vector search, network services, databases, MCP servers, or Codex Skill implementations.
- Prefer small, boring dependencies.
- Keep `.projnavi` committed; it is project guidance, not local cache.

## Validation

Run the most relevant subset first, then the full checks when practical:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
node dist/cli.js verify
```
