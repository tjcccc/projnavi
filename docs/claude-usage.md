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
