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
export const GENERIC_AGENT_DOC_SECTION_START = "<!-- projnavi-agent-doc:start -->";
export const GENERIC_AGENT_DOC_SECTION_END = "<!-- projnavi-agent-doc:end -->";

export const CODEX_AGENTS_SECTION = `${CODEX_AGENTS_SECTION_START}
## projnavi

projnavi is a local navigation layer for coding agents. Humans initialize it; agents use it before broad work.

Use the installed projnavi skill for \`projnavi onboard\` and \`projnavi benchmark\` requests when available. Keep this document as policy guidance only.

Before broad or ambiguous codebase work, run this terminal command:

\`\`\`bash
projnavi guide "<task>"
\`\`\`

Use guide output as navigation advice only. Verify source files before editing. Skip projnavi for trivial single-file edits where the user already named the exact file and location.

\`projnavi guide\` works best for high-entropy tasks such as cross-layer changes, frontend/display behavior, project-specific concepts, architecture-sensitive edits, provider integrations, scattered ownership, or unclear naming. It is not meant to replace \`rg\` for obvious single-slice backend/API tasks. For simple tasks, normal search may be just as efficient; projnavi may still improve relevance, but may not reduce output size. Use \`--max-items <n>\` when you need to cap only the \`Read first\` list.

After changing files referenced by \`.projnavi/claims.jsonl\`, \`.projnavi/glossary.json\`, or \`.projnavi\` notes, run:

\`\`\`bash
projnavi onboard
projnavi verify
\`\`\`
${CODEX_AGENTS_SECTION_END}`;

export const GENERIC_AGENT_DOC_SECTION = `${GENERIC_AGENT_DOC_SECTION_START}
## projnavi

projnavi is a local navigation layer for coding agents. Humans initialize it; agents use it before broad work.

Use the installed projnavi skill for \`projnavi onboard\` and \`projnavi benchmark\` requests when available. Keep this document as policy guidance only.

Before broad or ambiguous codebase work, run this terminal command:

\`\`\`bash
projnavi guide "<task>"
\`\`\`

Use guide output as navigation advice only. Verify source files before editing. Skip projnavi for trivial single-file edits where the user already named the exact file and location.

\`projnavi guide\` works best for high-entropy tasks such as cross-layer changes, frontend/display behavior, project-specific concepts, architecture-sensitive edits, provider integrations, scattered ownership, or unclear naming. It is not meant to replace \`rg\` for obvious single-slice backend/API tasks. For simple tasks, normal search may be just as efficient; projnavi may still improve relevance, but may not reduce output size. Use \`--max-items <n>\` when you need to cap only the \`Read first\` list.

After changing files referenced by \`.projnavi/claims.jsonl\`, \`.projnavi/glossary.json\`, or \`.projnavi\` notes, run:

\`\`\`bash
projnavi onboard
projnavi verify
\`\`\`
${GENERIC_AGENT_DOC_SECTION_END}`;

export const CLAUDE_SKILL_SECTION_START = "<!-- projnavi-agent-claude:start -->";
export const CLAUDE_SKILL_SECTION_END = "<!-- projnavi-agent-claude:end -->";

export const CLAUDE_MEMORY_SECTION_START = "<!-- projnavi-agent-claude-policy:start -->";
export const CLAUDE_MEMORY_SECTION_END = "<!-- projnavi-agent-claude-policy:end -->";

// Proactive policy block for the repo CLAUDE.md (Claude Code loads it every
// turn), mirroring CODEX_AGENTS_SECTION. The Claude skill carries the full
// onboard/benchmark workflow; this block is the always-on "guide first" policy.
// Kept deliberately short because it is always-loaded context.
export const CLAUDE_MEMORY_SECTION = `${CLAUDE_MEMORY_SECTION_START}
## projnavi

Before broad or ambiguous codebase work, run \`projnavi guide "<task>"\` and use the result as navigation advice only — then verify the named files and line ranges before editing. Use the \`/projnavi\` skill for \`onboard\` and \`benchmark\` workflows.

\`projnavi guide\` is strongest for high-entropy tasks such as cross-layer changes, project-specific concepts, architecture-sensitive edits, provider integrations, scattered ownership, or unclear naming. Skip it for trivial single-file edits where the exact location is already known; plain \`rg\` is fine there. Use \`--max-items <n>\` to cap only the \`Read first\` list.

Maintenance is bounded: after changing files referenced by \`.projnavi/claims.jsonl\`, \`.projnavi/glossary.json\`, or \`.projnavi\` notes, run \`projnavi onboard\` then \`projnavi verify\` — not continuously.
${CLAUDE_MEMORY_SECTION_END}`;

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

Run \`projnavi guide "$ARGUMENTS"\` and use the result as navigation advice only. Verify source files and tests before editing. Use projnavi first for high-entropy tasks such as cross-layer changes, frontend/display behavior, project-specific concepts, architecture-sensitive edits, provider integrations, scattered ownership, or unclear naming. For obvious single-slice backend/API tasks, normal search may be just as efficient; projnavi may still improve relevance, but may not reduce output size. Use \`--max-items <n>\` when you need to cap only the \`Read first\` list.
${CLAUDE_SKILL_SECTION_END}
`;

export const GENERIC_PROJECT_SKILL = `---
name: projnavi
description: Use when the user asks to onboard projnavi, benchmark projnavi, or use projnavi guide for broad codebase navigation.
---

# projnavi

Use this project-local navigation layer before broad or ambiguous codebase work.

If the user asks to onboard projnavi:

Run projnavi onboarding for this repo. Execute \`projnavi onboard\`, inspect the repo, improve the \`.projnavi\` project notes, module notes, flow notes, glossary, and claims for future guide queries, then run \`projnavi onboard\` again and \`projnavi verify\`. Update agent guidance only if useful. Do not make unrelated code changes.

If the user asks to benchmark projnavi:

Do not edit files. Based on the current project, choose a realistic complex codebase task. Dry-run investigation twice: first without projnavi using normal repo exploration, search, and file reads; then with projnavi by running \`projnavi guide "<task>"\` and inspecting only the recommended first-pass files. Measure wall time, command count, output bytes, output lines, approximate tokens, and qualitative relevance. Report a professional Markdown table, a compact shareable summary, whether projnavi pointed to the right files, and the caveat that approximate tokens are estimated from output bytes rather than model token accounting.

For any other project task:

Run \`projnavi guide "<task>"\` before broad or ambiguous codebase work, then use the result as navigation advice only. Verify source files and tests before editing. Use projnavi first for high-entropy tasks such as cross-layer changes, frontend/display behavior, project-specific concepts, architecture-sensitive edits, provider integrations, scattered ownership, or unclear naming. For obvious single-slice backend/API tasks, normal search may be just as efficient; projnavi may still improve relevance, but may not reduce output size. Use \`--max-items <n>\` when you need to cap only the \`Read first\` list.
`;

export const CURSOR_PROJECT_RULE = `---
description: Use projnavi before broad or ambiguous codebase work.
alwaysApply: true
---

# projnavi

projnavi is a local navigation layer for coding agents. Humans initialize it; agents use it before broad work.

Use the installed projnavi skill for \`projnavi onboard\` and \`projnavi benchmark\` requests when available. Keep this rule as policy guidance only.

Before broad or ambiguous codebase work, run this terminal command: \`projnavi guide "<task>"\`. Use guide output as navigation advice only, then verify source files and tests before editing.

\`projnavi guide\` works best for high-entropy tasks such as cross-layer changes, frontend/display behavior, project-specific concepts, architecture-sensitive edits, provider integrations, scattered ownership, or unclear naming. It is not meant to replace \`rg\` for obvious single-slice backend/API tasks. For simple tasks, normal search may be just as efficient; projnavi may still improve relevance, but may not reduce output size. Use \`--max-items <n>\` when you need to cap only the \`Read first\` list.
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
