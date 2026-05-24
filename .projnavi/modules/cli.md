# CLI Module

The CLI entrypoint is `src/cli.ts`. It dispatches supported commands to files under `src/commands/`.

Use this note when changing command names, flags, argument parsing, stdout/stderr behavior, exit codes, or the package `bin` entry.

Important command files:

- `src/commands/init.ts`
- `src/commands/onboard.ts`
- `src/commands/guide.ts`
- `src/commands/notes.ts`
- `src/commands/verify.ts`

Relevant smoke coverage is in `test/cli.test.ts`.
