# Guide Benchmark Flow

Use `docs/benchmark-plan.md` and `scripts/compare-guide.mjs` to compare dry-run investigation with and without projnavi.

Default benchmark task:

```text
Add compact guide output with --compact and --max-items support while keeping guide output high precision.
```

The benchmark records wall time, command count, output bytes, output lines, word count, approximate tokens, and output file paths.

Use it after improving guide ranking, `.projnavi` claims, or onboarding notes to check whether the tool is still reducing first-pass context.

When the user says `projnavi benchmark`, treat it as a read-only request to choose a realistic complex task, compare dry-run investigation with and without projnavi, and report a Markdown table plus compact shareable summary.
