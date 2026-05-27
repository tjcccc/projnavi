# Claude Code Usage

Project setup:

```bash
npm install -g projnavi
cd the-project
projnavi init --agent claude
claude
```

This creates a project-scoped Claude Code skill:

```text
.claude/skills/projnavi/SKILL.md
```

Invoke it with:

```text
/projnavi onboard
/projnavi benchmark
/projnavi <task>
```

`/projnavi onboard` runs the full onboarding workflow: execute `projnavi onboard`, inspect the repo, improve `.projnavi` project notes, module notes, flow notes, glossary, and claims, then run `projnavi onboard` again and `projnavi verify`.

`/projnavi benchmark` performs a read-only comparison of first-pass investigation with and without projnavi.

`/projnavi <task>` runs `projnavi guide "<task>"` and uses the result as navigation advice only. Verify source files before editing.

`projnavi guide` is strongest for high-entropy work: cross-layer changes, frontend/display behavior, project-specific concepts, architecture-sensitive edits, provider integrations, scattered ownership, or unclear naming. It is not meant to replace `rg` for obvious single-slice backend/API tasks. For simple tasks, normal search may be just as efficient; projnavi may still improve relevance, but may not reduce output size. Use `projnavi guide "<task>" --max-items <n>` to cap only the `Read first` list.
