# CLI Module

The CLI entrypoint is `src/cli.ts`. It dispatches supported commands to files under `src/commands/`.

Use this note when changing command names, flags, argument parsing, stdout/stderr behavior, exit codes, or the package `bin` entry.

Current command surface:

- `projnavi --version`, `projnavi -v`, and `projnavi version` print the package version.
- `projnavi init` creates the `.projnavi` scaffold and can also run integration targets.
- `projnavi integrate` adds or refreshes agent docs and skill files after init.
- `projnavi onboard` refreshes the manifest and generated project inventory when allowed.
- `projnavi guide "<task>"` builds task briefs. `--max-items <n>` caps only the `Read first` list and leaves notes/evidence/concepts intact.
- `projnavi notes <topic>` searches notes.
- `projnavi verify` checks manifest and evidence freshness.

Important command files:

- `src/commands/init.ts`
- `src/commands/onboard.ts`
- `src/commands/guide.ts`
- `src/commands/notes.ts`
- `src/commands/verify.ts`

Integration and argument parsing tests live mostly in `test/init.test.ts`, `test/cli.test.ts`, and `test/guide.test.ts`.
