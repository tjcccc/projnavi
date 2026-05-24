# Codex Usage

Project setup:

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

The generated `AGENTS.md` expands that short prompt into the full onboarding workflow.

Before broad codebase investigation tasks, run:

```bash
projnavi guide "<user task>"
```

Use the result as a starting map. Verify source files before editing. Do not use it for trivial single-file edits where the user already identified the exact file and location.

`projnavi` output is navigation advice, not ground truth.
