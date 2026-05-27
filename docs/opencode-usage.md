# OpenCode Usage

Project setup:

```bash
npm install -g projnavi
cd the-project
projnavi init --agent opencode
```

This creates OpenCode-compatible project guidance:

```text
AGENTS.md
.opencode/skills/projnavi/SKILL.md
```

The `AGENTS.md` guidance tells OpenCode to run `projnavi guide "<task>"` before broad or ambiguous codebase work. The project skill provides onboarding, benchmark, and guide workflows as reusable skill instructions.

For a different OpenCode-compatible skills location, run:

```bash
projnavi integrate --skills-dir .agents/skills
```
