import { formatBriefMarkdown, buildTaskBrief } from "../core/guide-ranking.js";
import { loadClaims, formatWarnings } from "../core/claims.js";
import { loadGlossary } from "../core/glossary.js";
import { readManifest } from "../core/manifest.js";
import { loadNoteDocs } from "../core/notes.js";
import { verifyFreshness } from "../core/verify.js";
import type { CommandResult } from "./types.js";
import { fail, ok } from "./types.js";

export interface GuideOptions {
  format: "text" | "json";
  strict: boolean;
}

export async function runGuide(root: string, task: string, options: GuideOptions): Promise<CommandResult> {
  const claimsResult = await loadClaims(root);
  const glossaryResult = await loadGlossary(root);
  const parserWarnings = [
    ...formatWarnings(claimsResult.warnings, ".projnavi/claims.jsonl"),
    ...formatWarnings(glossaryResult.warnings, ".projnavi/glossary.json")
  ];

  if (options.strict && parserWarnings.length > 0) {
    return fail(parserWarnings.join("\n"));
  }

  const [notes, manifest, verifyReport] = await Promise.all([
    loadNoteDocs(root),
    readManifest(root),
    verifyFreshness(root, claimsResult.value, glossaryResult.value)
  ]);

  const brief = buildTaskBrief({
    task,
    claims: claimsResult.value,
    glossary: glossaryResult.value,
    notes,
    manifest,
    verifyReport,
    parserWarnings
  });

  if (options.format === "json") {
    return ok(JSON.stringify(brief, null, 2));
  }

  return ok(formatBriefMarkdown(brief));
}
