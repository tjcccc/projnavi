# Agent Integration Module

Agent integration behavior lives in `src/commands/init.ts` and template text lives in `src/core/templates.ts`.

The product boundary is deliberate:

- Agent docs are policy guidance. They tell agents when to run terminal commands such as `projnavi guide "<task>"` and when to use installed skills for `onboard` or `benchmark` requests.
- Skill files contain workflows. They expand `onboard` into repo inspection plus `.projnavi` updates, and expand `benchmark` into read-only dry-run measurement.

Supported shortcuts:

- `projnavi integrate --agent codex` installs or updates the global Codex skill in `$CODEX_HOME/skills` when set, otherwise `~/.codex/skills`, then updates repo `AGENTS.md` policy guidance.
- `projnavi integrate --agent codex --repo-doc` updates only the repo `AGENTS.md` policy block.
- `projnavi integrate --agent claude` writes `.claude/skills/projnavi/SKILL.md`.
- `projnavi integrate --agent cursor` writes `.cursor/rules/projnavi.mdc` policy guidance.
- `projnavi integrate --agent opencode` writes generic `AGENTS.md` policy guidance and `.opencode/skills/projnavi/SKILL.md`.
- `projnavi integrate --agent-doc <path>` writes managed policy guidance to a custom agent instruction file.
- `projnavi integrate --skills-dir <skills-folder>` writes `<skills-folder>/projnavi/SKILL.md` for generic or future coding tools.

Managed doc sections are replaced between explicit HTML markers while preserving surrounding user guidance.

Primary tests are in `test/init.test.ts`.
