import { promises as fs } from "node:fs";
import { projnaviPath } from "./paths.js";
import type { Claim, ParseResult, ValidationWarning } from "./schemas.js";
import { validateClaim } from "./schemas.js";

export function parseClaimsJsonl(content: string): ParseResult<Claim[]> {
  const claims: Claim[] = [];
  const warnings: ValidationWarning[] = [];
  const seenIds = new Set<string>();
  const lines = content.split(/\r?\n/);

  for (const [index, line] of lines.entries()) {
    const lineNumber = index + 1;
    const trimmed = line.trim();
    if (trimmed === "") {
      continue;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed) as unknown;
    } catch {
      warnings.push({ message: "Invalid JSON in claims.jsonl.", line: lineNumber });
      continue;
    }

    const result = validateClaim(parsed, lineNumber);
    warnings.push(...result.warnings);

    if (!result.value) {
      continue;
    }

    if (seenIds.has(result.value.id)) {
      warnings.push({ message: `Duplicate claim id ${result.value.id}; keeping first occurrence.`, line: lineNumber });
      continue;
    }

    seenIds.add(result.value.id);
    claims.push(result.value);
  }

  return { value: claims, warnings };
}

export async function loadClaims(root: string): Promise<ParseResult<Claim[]>> {
  try {
    const content = await fs.readFile(projnaviPath(root, "claims.jsonl"), "utf8");
    return parseClaimsJsonl(content);
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return { value: [], warnings: [] };
    }

    throw error;
  }
}

export function formatWarnings(warnings: ValidationWarning[], sourcePath?: string): string[] {
  return warnings.map((warning) => {
    const pathPart = warning.path ?? sourcePath;
    const location = [pathPart, warning.line ? `line ${warning.line}` : undefined].filter(Boolean).join(":");
    return location.length > 0 ? `${location}: ${warning.message}` : warning.message;
  });
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
