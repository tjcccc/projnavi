# Cursor Usage

Project setup:

```bash
npm install -g projnavi
cd the-project
projnavi init --agent cursor
```

This creates a Cursor project rule at:

```text
.cursor/rules/projnavi.mdc
```

The rule tells Cursor to run `projnavi guide "<task>"` before broad or ambiguous codebase work. It is policy guidance only; full onboard or benchmark workflows belong in a skill location for agents that support skills.

Cursor also supports `AGENTS.md` as a simple Markdown alternative. If a project prefers that shape, run:

```bash
projnavi integrate --agent-doc AGENTS.md
```
