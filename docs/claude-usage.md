# Claude Code Usage

Project setup:

```bash
npm install -g projnavi
cd the-project
projnavi init --agent claude
claude
```

This creates a project-scoped Claude Code skill and a managed projnavi policy block in the repo `CLAUDE.md`:

```text
.claude/skills/projnavi/SKILL.md
CLAUDE.md   (managed block: <!-- projnavi-agent-claude-policy:start/end -->)
```

The skill carries the full `onboard` / `benchmark` / guide workflow. The `CLAUDE.md` block is short, always-loaded policy so Claude Code proactively runs `projnavi guide "<task>"` before broad work — not only when you type `/projnavi`. It is created if `CLAUDE.md` is absent, refreshes idempotently, and preserves any hand-edited content elsewhere in the file. To write only the `CLAUDE.md` policy without installing the skill, run `projnavi init --agent claude --repo-doc`.

Invoke the skill with:

```text
/projnavi onboard
/projnavi benchmark
/projnavi <task>
```

`/projnavi onboard` runs the full onboarding workflow: execute `projnavi onboard`, inspect the repo, improve `.projnavi` project notes, module notes, flow notes, glossary, and claims, then run `projnavi onboard` again and `projnavi verify`.

`/projnavi benchmark` performs a read-only comparison of first-pass investigation with and without projnavi.

`/projnavi <task>` runs `projnavi guide "<task>"` and uses the result as navigation advice only. Verify source files before editing.

`projnavi guide` is strongest for high-entropy work: cross-layer changes, frontend/display behavior, project-specific concepts, architecture-sensitive edits, provider integrations, scattered ownership, or unclear naming. It is not meant to replace `rg` for obvious single-slice backend/API tasks. For simple tasks, normal search may be just as efficient; projnavi may still improve relevance, but may not reduce output size. Use `projnavi guide "<task>" --max-items <n>` to cap only the `Read first` list.
