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

`projnavi init --agent codex` initializes `.projnavi`, installs the Codex skill globally under `~/.codex/skills`, and writes a managed repo `AGENTS.md` policy block. The skill handles `projnavi onboard` and `projnavi benchmark` requests; the repo policy tells Codex when to run the terminal command `projnavi guide "<task>"` during normal codebase work.

To write only repo-contained `AGENTS.md` instructions without installing the global skill, run:

```bash
projnavi init --agent codex --repo-doc
```

Before broad codebase investigation tasks, run:

```bash
projnavi guide "<user task>"
```

Use the result as a starting map. Verify source files before editing. Do not use it for trivial single-file edits where the user already identified the exact file and location.

`projnavi guide` is strongest for high-entropy work: cross-layer changes, frontend/display behavior, project-specific concepts, architecture-sensitive edits, provider integrations, scattered ownership, or unclear naming. It is not meant to replace `rg` for obvious single-slice backend/API tasks. For simple tasks, normal search may be just as efficient; projnavi may still improve relevance, but may not reduce output size. Use `projnavi guide "<user task>" --max-items <n>` to cap only the `Read first` list.

`projnavi` output is navigation advice, not ground truth.
