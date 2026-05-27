# AGENTS

Project guidance for coding agents working on `projnavi`.

<!-- projnavi-agent-codex:start -->
## projnavi

projnavi is a local navigation layer for coding agents. Humans initialize it; agents use it before broad work.

Use the installed projnavi skill for `projnavi onboard` and `projnavi benchmark` requests when available. Keep this document as policy guidance only.

Before broad or ambiguous codebase work, run this terminal command:

```bash
projnavi guide "<task>"
```

Use guide output as navigation advice only. Verify source files before editing. Skip projnavi for trivial single-file edits where the user already named the exact file and location.

`projnavi guide` works best for high-entropy tasks such as cross-layer changes, frontend/display behavior, project-specific concepts, architecture-sensitive edits, provider integrations, scattered ownership, or unclear naming. It is not meant to replace `rg` for obvious single-slice backend/API tasks. For simple tasks, normal search may be just as efficient; projnavi may still improve relevance, but may not reduce output size. Use `--max-items <n>` when you need to cap only the `Read first` list.

After changing files referenced by `.projnavi/claims.jsonl`, `.projnavi/glossary.json`, or `.projnavi` notes, run:

```bash
projnavi onboard
projnavi verify
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

