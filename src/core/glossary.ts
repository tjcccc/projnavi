import { promises as fs } from "node:fs";
import { projnaviPath } from "./paths.js";
import type { Glossary, ParseResult } from "./schemas.js";
import { validateGlossary } from "./schemas.js";

export async function loadGlossary(root: string): Promise<ParseResult<Glossary>> {
  try {
    const content = await fs.readFile(projnaviPath(root, "glossary.json"), "utf8");
    const parsed = JSON.parse(content) as unknown;
    return validateGlossary(parsed);
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return { value: { terms: [] }, warnings: [] };
    }

    if (error instanceof SyntaxError) {
      return {
        value: { terms: [] },
        warnings: [{ message: "glossary.json contains invalid JSON." }]
      };
    }

    throw error;
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
