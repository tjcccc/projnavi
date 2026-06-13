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

This initializes `.projnavi` in the project, installs the projnavi Codex skill globally under `~/.codex/skills`, and adds a managed repo `AGENTS.md` policy block so Codex knows when to run the terminal command `projnavi guide "<task>"`. The global skill handles `projnavi onboard` and `projnavi benchmark` requests. To write only the repo `AGENTS.md` policy without installing the global skill, run `projnavi init --agent codex --repo-doc`.

For Claude Code users, use a project skill instead:

```bash
npm install -g projnavi
cd the-project
projnavi init --agent claude
claude
```

Then ask Claude Code:

```text
/projnavi onboard
```

This installs the project skill at `.claude/skills/projnavi/SKILL.md` (supporting `onboard`, `benchmark`, and guide-style task arguments) and writes a short managed projnavi policy block to the repo `CLAUDE.md` (creating it if absent). Because Claude Code loads `CLAUDE.md` every turn, the policy makes "run `projnavi guide` before broad work" proactive, not only reactive on `/projnavi`. To write only the `CLAUDE.md` policy without installing the skill, run `projnavi init --agent claude --repo-doc`.

For Cursor, OpenCode, or other tools, use the integration that matches the agent:

```bash
projnavi init --agent cursor
projnavi init --agent opencode
projnavi integrate --agent-doc AGENTS.md
projnavi integrate --skills-dir .agents/skills
```

To compare first-pass investigation with and without projnavi, ask Codex:

```text
projnavi benchmark
```

or ask Claude Code:

```text
/projnavi benchmark
```

## What It Is Not

`projnavi` is not a code intelligence platform, vector database, MCP server, or AI codebase brain. The MVP is deterministic and local. It does not call external LLMs, embedding APIs, vector databases, or network services.

Its output is navigation advice, not ground truth. Coding agents must verify source files before editing.

## Goals

- Save agent exploration time by pointing to a small, high-precision read-first set.
- Save tokens by avoiding broad, repeated repo scans.
- Improve correctness by attaching claims to evidence and warning when that evidence is stale.

## MVP Workflow

1. A human runs `projnavi init --agent codex` to create `.projnavi`, install the global Codex skill, and add repo `AGENTS.md` policy guidance.
2. Or the human chooses another integration, such as `--agent claude`, `--agent cursor`, `--agent opencode`, `--agent-doc <path>`, or `--skills-dir <skills-folder>`.
3. The human asks the agent `projnavi onboard` in Codex or `/projnavi onboard` in Claude Code.
4. The agent runs `projnavi onboard`, inspects the repo, improves `.projnavi` notes/glossary/claims, runs `projnavi onboard` again, and then runs `projnavi verify`.
5. For future broad tasks, the agent runs `projnavi guide "<task>"` before reading large parts of the repo.
6. `projnavi verify` checks whether evidence or indexed files changed since onboarding.

## Commands

```bash
projnavi --version
projnavi init
projnavi init --agent codex
projnavi init --agent codex --repo-doc
projnavi init --agent claude
projnavi init --agent claude --repo-doc
projnavi init --agent cursor
projnavi init --agent opencode
projnavi integrate --agent codex
projnavi integrate --agent cursor
projnavi integrate --agent opencode
projnavi integrate --agent-doc AGENTS.md
projnavi integrate --skills-dir .agents/skills
projnavi onboard
projnavi guide "get users"
projnavi guide "get users" --format json
projnavi guide "get users" --max-items 5
projnavi notes users
projnavi verify
```

Plain `projnavi init` only creates the `.projnavi` scaffold. Use `projnavi init --agent codex` to install the global Codex skill and repo `AGENTS.md` policy guidance, `projnavi init --agent codex --repo-doc` to update only project `AGENTS.md` guide policy for Codex, `projnavi init --agent claude` to create the Claude Code project skill and a managed repo `CLAUDE.md` policy block (`--agent claude --repo-doc` writes only the `CLAUDE.md` policy), `projnavi init --agent cursor` to create a Cursor project rule, or `projnavi init --agent opencode` to create OpenCode-compatible `AGENTS.md` guidance plus a project skill.

For other coding agents, use `projnavi integrate`. `--agent-doc <path>` adds managed projnavi policy guidance to any agent-readable Markdown file. It does not install full skill workflows into the doc. `--skills-dir <skills-folder>` creates `<skills-folder>/projnavi/SKILL.md` using a generic skill format. Use either one or both depending on what the agent reads; projnavi does not modify unrelated tool configuration.

## Upgrades

After upgrading projnavi, run `projnavi onboard` in each project to refresh `.projnavi/manifest.json`. This also migrates older manifest files into the current stable shape.

To refresh installed agent instructions or skills, rerun the same idempotent integration command you used before, such as `projnavi integrate --agent codex`, `projnavi integrate --agent cursor`, `projnavi integrate --agent-doc AGENTS.md`, or `projnavi integrate --skills-dir .agents/skills`.

`projnavi update` is intentionally not part of this pass. If automatic skill refresh becomes necessary, projnavi should track project-local integration targets separately from user-local global installs; global Codex skill paths are machine-specific and should not be written into the committed manifest.

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

The result should be used as a starting map only. The agent must verify the referenced source files, tests, and evidence before editing.

`projnavi guide` is most useful for high-entropy tasks: cross-layer changes, frontend or display behavior, project-specific concepts, architecture-sensitive edits, provider integrations, scattered ownership, or unclear naming. It is not meant to replace `rg` for obvious single-slice backend/API tasks. For simple tasks, normal search may be just as efficient; projnavi may still improve relevance, but may not reduce output size. For a tighter first pass, use `projnavi guide "<user task>" --max-items <n>` to cap only the `Read first` list.

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

Claude Code users can invoke the generated project skill directly:

```text
/projnavi onboard
/projnavi benchmark
/projnavi <task>
```

## Development

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm benchmark:guide
```
