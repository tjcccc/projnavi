# Common Change Flow

Before a broad change, run `projnavi guide "<task>"` from the repo root.

Use the output to choose the first files and notes to inspect. Then verify the actual source files before editing.

After changing source, tests, notes, or claim evidence:

1. Run targeted tests.
2. Run `pnpm typecheck`, `pnpm lint`, and `pnpm test` when practical.
3. Run `node dist/cli.js onboard` after rebuilding, or run the source command through tests, to refresh `.projnavi/manifest.json` when committed guide evidence changed.
4. Run `node dist/cli.js verify` to confirm guide data is fresh.
