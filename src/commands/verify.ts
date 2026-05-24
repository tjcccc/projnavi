import { loadClaims, formatWarnings } from "../core/claims.js";
import { loadGlossary } from "../core/glossary.js";
import { verifyFreshness } from "../core/verify.js";
import type { CommandResult } from "./types.js";
import { fail, ok } from "./types.js";

export interface VerifyOptions {
  nonStrict: boolean;
  strict: boolean;
}

export async function runVerify(root: string, options: VerifyOptions): Promise<CommandResult> {
  const claimsResult = await loadClaims(root);
  const glossaryResult = await loadGlossary(root);
  const parserWarnings = [
    ...formatWarnings(claimsResult.warnings, ".projnavi/claims.jsonl"),
    ...formatWarnings(glossaryResult.warnings, ".projnavi/glossary.json")
  ];

  if (options.strict && parserWarnings.length > 0) {
    return fail(parserWarnings.join("\n"));
  }

  const report = await verifyFreshness(root, claimsResult.value, glossaryResult.value);
  if (!report.manifestFound) {
    const message = "manifest.json not found. Run `projnavi onboard`.";
    return options.nonStrict ? ok(message) : fail(message);
  }

  const lines = [
    formatList("Changed files", report.changedFiles.map((issue) => issue.message)),
    formatList("Missing files", report.missingFiles.map((issue) => issue.message)),
    formatList("Untracked referenced files", report.untrackedFiles.map((issue) => issue.message)),
    formatList("Claims with stale evidence", report.staleClaims),
    parserWarnings.length > 0 ? formatList("Warnings", parserWarnings) : ""
  ].filter((line) => line.length > 0);

  const hasFreshnessIssues =
    report.changedFiles.length > 0 ||
    report.missingFiles.length > 0 ||
    report.untrackedFiles.length > 0 ||
    report.staleClaims.length > 0;

  const output = hasFreshnessIssues ? lines.join("\n") : "All tracked projnavi data is fresh.";
  return hasFreshnessIssues && !options.nonStrict ? fail(output) : ok(output);
}

function formatList(title: string, values: string[]): string {
  if (values.length === 0) {
    return `${title}:\n- none`;
  }

  return `${title}:\n${values.map((value) => `- ${value}`).join("\n")}`;
}
