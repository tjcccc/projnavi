import type { Manifest } from "./schemas.js";

export const PROJECT_TEMPLATE = `# Project Notes

<!-- projnavi-template: project-v1 -->

Use this file for durable, human-reviewed project context.

## Overview

Describe what this repository does.

## Inventory

Run \`projnavi onboard\` to generate a conservative local inventory.
`;

export const MODULE_EXAMPLE_TEMPLATE = `# Example Module

<!-- projnavi-template: module-example-v1 -->

Use files in \`.projnavi/modules/\` for durable notes about important modules.
`;

export const FLOW_EXAMPLE_TEMPLATE = `# Example Flow

<!-- projnavi-template: flow-example-v1 -->

Use files in \`.projnavi/flows/\` for durable notes about important user or system flows.
`;

export const CODEX_AGENTS_SECTION_START = "<!-- projnavi-agent-codex:start -->";
export const CODEX_AGENTS_SECTION_END = "<!-- projnavi-agent-codex:end -->";

export const CODEX_AGENTS_SECTION = `${CODEX_AGENTS_SECTION_START}
## projnavi

projnavi is a local navigation layer for coding agents. Humans initialize it; agents use it before broad work.

When the user says exactly or approximately:

\`\`\`text
projnavi onboard
\`\`\`

treat it as this task:

\`\`\`text
Run projnavi onboarding for this repo. Execute \`projnavi onboard\`, inspect the repo, improve the \`.projnavi\` project notes, module notes, flow notes, glossary, and claims for future guide queries, then run \`projnavi onboard\` again and \`projnavi verify\`. Update \`AGENTS.md\` only if useful. Do not make unrelated code changes.
\`\`\`

Before broad or ambiguous codebase work, run:

\`\`\`bash
projnavi guide "<task>"
\`\`\`

Use guide output as navigation advice only. Verify source files before editing. Skip projnavi for trivial single-file edits where the user already named the exact file and location.

After changing files referenced by \`.projnavi/claims.jsonl\`, \`.projnavi/glossary.json\`, or \`.projnavi\` notes, run:

\`\`\`bash
projnavi onboard
projnavi verify
\`\`\`

When the user says exactly or approximately:

\`\`\`text
projnavi benchmark
\`\`\`

treat it as this read-only benchmark request:

\`\`\`text
Based on the current project, choose a realistic complex codebase task. Do not edit files. Dry-run investigation twice: first without projnavi using normal repo exploration, search, and file reads; then with projnavi by running \`projnavi guide "<task>"\` and inspecting only the recommended first-pass files. Measure wall time, command count, output bytes, output lines, approximate tokens, and qualitative relevance. Report a professional Markdown table, a compact shareable summary, whether projnavi pointed to the right files, and the caveat that approximate tokens are estimated from output bytes rather than model token accounting.
\`\`\`
${CODEX_AGENTS_SECTION_END}`;

export const CLAUDE_SKILL_SECTION_START = "<!-- projnavi-agent-claude:start -->";
export const CLAUDE_SKILL_SECTION_END = "<!-- projnavi-agent-claude:end -->";

export const CLAUDE_PROJECT_SKILL = `---
name: projnavi
description: Use when the user asks to onboard projnavi, benchmark projnavi, or use projnavi guide for broad codebase navigation.
argument-hint: "onboard | benchmark | <task>"
---

${CLAUDE_SKILL_SECTION_START}
# projnavi

Use this project-local navigation layer before broad or ambiguous codebase work.

If \`$ARGUMENTS\` is \`onboard\`:

Run projnavi onboarding for this repo. Execute \`projnavi onboard\`, inspect the repo, improve the \`.projnavi\` project notes, module notes, flow notes, glossary, and claims for future guide queries, then run \`projnavi onboard\` again and \`projnavi verify\`. Update \`CLAUDE.md\` only if useful. Do not make unrelated code changes.

If \`$ARGUMENTS\` is \`benchmark\`:

Do not edit files. Based on the current project, choose a realistic complex codebase task. Dry-run investigation twice: first without projnavi using normal repo exploration, search, and file reads; then with projnavi by running \`projnavi guide "<task>"\` and inspecting only the recommended first-pass files. Measure wall time, command count, output bytes, output lines, approximate tokens, and qualitative relevance. Report a professional Markdown table, a compact shareable summary, whether projnavi pointed to the right files, and the caveat that approximate tokens are estimated from output bytes rather than model token accounting.

If \`$ARGUMENTS\` is empty:

Show the supported forms: \`/projnavi onboard\`, \`/projnavi benchmark\`, and \`/projnavi <task>\`. Do not run projnavi until the user provides an action or task.

Otherwise:

Run \`projnavi guide "$ARGUMENTS"\` and use the result as navigation advice only. Verify source files and tests before editing. Skip projnavi for trivial single-file edits where the user already named the exact file and location.
${CLAUDE_SKILL_SECTION_END}
`;

export const EMPTY_GLOSSARY = {
  terms: []
};

export function createInitialManifest(version: string): Manifest {
  return {
    version: 1,
    projnaviVersion: version,
    generatedAt: new Date().toISOString(),
    root: ".",
    files: {},
    notes: {},
    evidence: {},
    inventory: {
      summary: "No inventory has been generated yet. Run `projnavi onboard`.",
      topLevelDirectories: [],
      fileCounts: {},
      tests: []
    }
  };
}

export function renderProjectInventory(manifest: Manifest): string {
  const scripts = manifest.inventory.packageScripts ?? [];
  const packageLine = manifest.inventory.packageName
    ? `Package: \`${manifest.inventory.packageName}\``
    : "Package: not detected";
  const scriptsLine = scripts.length > 0 ? scripts.map((script) => `\`${script}\``).join(", ") : "none detected";
  const dirsLine =
    manifest.inventory.topLevelDirectories.length > 0
      ? manifest.inventory.topLevelDirectories.map((dir) => `\`${dir}\``).join(", ")
      : "none detected";
  const testsLine =
    manifest.inventory.tests.length > 0
      ? manifest.inventory.tests.slice(0, 12).map((file) => `\`${file}\``).join(", ")
      : "none detected";
  const counts = Object.entries(manifest.inventory.fileCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, count]) => `- ${category}: ${count}`)
    .join("\n");

  return `# Project Notes

<!-- projnavi-generated: project-inventory-v1 -->

Use this file for durable, human-reviewed project context. The inventory below was generated by \`projnavi onboard\` and is intentionally conservative.

## Overview

${manifest.inventory.summary}

## Inventory

- ${packageLine}
- Package scripts: ${scriptsLine}
- Top-level directories: ${dirsLine}
- Test files: ${testsLine}

## File Counts

${counts.length > 0 ? counts : "- none"}
`;
}
