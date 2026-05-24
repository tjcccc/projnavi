# projnavi

`projnavi` is a local CLI tool for coding agents. It turns human-maintained `.projnavi` project notes, glossary entries, claims, and file freshness metadata into short task briefs.

Humans initialize it once. Agents use it repeatedly.

For Codex users, the common setup is:

```bash
npm install -g projnavi
cd the-project
projnavi init --agent codex
codex
```

Then ask Codex:

```text
projnavi onboard
```

The generated project `AGENTS.md` tells Codex to expand that short prompt into the full onboarding workflow.

To compare first-pass investigation with and without projnavi, ask:

```text
projnavi benchmark
```

## What It Is Not

`projnavi` is not a code intelligence platform, vector database, MCP server, or AI codebase brain. The MVP is deterministic and local. It does not call external LLMs, embedding APIs, vector databases, or network services.

Its output is navigation advice, not ground truth. Coding agents must verify source files before editing.

## Goals

- Save agent exploration time by pointing to a small, high-precision read-first set.
- Save tokens by avoiding broad, repeated repo scans.
- Improve correctness by attaching claims to evidence and warning when that evidence is stale.

## MVP Workflow

1. A human runs `projnavi init --agent codex` to create `.projnavi` and project instructions.
2. The human asks the agent `projnavi onboard`.
3. The agent runs `projnavi onboard`, inspects the repo, improves `.projnavi` notes/glossary/claims, runs `projnavi onboard` again, and then runs `projnavi verify`.
4. For future broad tasks, the agent runs `projnavi guide "<task>"` before reading large parts of the repo.
5. `projnavi verify` checks whether evidence or indexed files changed since onboarding.

## Commands

```bash
projnavi init
projnavi init --agent codex
projnavi onboard
projnavi guide "get users"
projnavi guide "get users" --format json
projnavi notes users
projnavi verify
```

## Example `.projnavi` Files

`.projnavi/glossary.json`:

```json
{
  "terms": [
    {
      "term": "get users",
      "aliases": ["list users", "users endpoint", "fetch users"],
      "mapsTo": ["UserService", "GET /users"],
      "topics": ["users", "api"],
      "paths": ["src/api/users.ts"],
      "notes": "Use this when the task mentions retrieving users."
    }
  ]
}
```

`.projnavi/claims.jsonl`:

```jsonl
{"id":"claim-users-route-001","type":"route","claim":"GET /users is handled by src/api/users.ts","topics":["users","api"],"keywords":["get users","list users","user endpoint"],"paths":["src/api/users.ts"],"evidence":[{"path":"src/api/users.ts","lines":[1,80],"note":"User route handler"}],"confidence":0.85,"source":"manual","updatedAt":"2026-05-23T00:00:00.000Z"}
```

## Agent Usage

Before broad codebase investigation tasks, a coding agent should run:

```bash
projnavi guide "<user task>"
```

The result should be used as a starting map only. The agent must verify the referenced source files, tests, and evidence before editing. For trivial single-file edits where the user already identified the exact file and location, `projnavi guide` is usually unnecessary.

When a user says:

```text
projnavi onboard
```

the agent should perform the full onboarding workflow:

```text
Run projnavi onboarding for this repo. Execute `projnavi onboard`, inspect the repo, improve the `.projnavi` project notes, module notes, flow notes, glossary, and claims for future guide queries, then run `projnavi onboard` again and `projnavi verify`. Update `AGENTS.md` only if useful. Do not make unrelated code changes.
```

When a user says:

```text
projnavi benchmark
```

the agent should perform a read-only comparison: choose a realistic complex task, dry-run investigation with and without projnavi, and report command count, output size, approximate tokens, relevance, and caveats.

## Development

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm benchmark:guide
```
