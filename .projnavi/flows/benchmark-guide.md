# Guide Benchmark Flow

Use `docs/benchmark-plan.md` and `scripts/compare-guide.mjs` to compare dry-run investigation with and without projnavi.

Default benchmark task:

```text
Add compact guide output with --compact and --max-items support while keeping guide output high precision.
```

The benchmark records wall time, command count, output bytes, output lines, word count, approximate tokens, and output file paths.

Use it after improving guide ranking, `.projnavi` claims, or onboarding notes to check whether the tool is still reducing first-pass context.

Quality review should also record whether projnavi found the core targets, missed secondary targets, recommended irrelevant first-pass files, recommended defensible-but-not-necessary files, or suggested weak/wrong tests.

Recent benchmark interpretation:

- Frontend and cross-layer tasks are the strongest fit because normal exploration tends to touch broad docs, specs, styles, routes, services, and project-specific concepts.
- Simple backend/API tasks with obvious router/service/repository/test layout may not show output reduction. In those cases projnavi can still improve relevance, but normal `rg` may already be efficient.
- Cross-domain backend tasks are a v1.0.0 quality target: if the task names both a CRM/access area and product installation persistence, claims should connect both domains or the guide may stop too early.

When the user says `projnavi benchmark`, treat it as a read-only request to choose a realistic complex task, compare dry-run investigation with and without projnavi, and report a Markdown table plus compact shareable summary.
