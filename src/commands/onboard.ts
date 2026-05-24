import { promises as fs } from "node:fs";
import { formatWarnings } from "../core/claims.js";
import { createFileEntry, writeManifest } from "../core/manifest.js";
import { projnaviPath } from "../core/paths.js";
import { scanForManifest } from "../core/onboard-scan.js";
import { renderProjectInventory, PROJECT_TEMPLATE } from "../core/templates.js";
import type { CommandResult } from "./types.js";
import { ok } from "./types.js";
import { runInit } from "./init.js";

export async function runOnboard(root: string): Promise<CommandResult> {
  await runInit(root, { force: false });

  const result = await scanForManifest(root);

  const lines = [
    `updated .projnavi/manifest.json`,
    `indexed ${Object.keys(result.manifest.files).length} repo files`,
    `indexed ${Object.keys(result.manifest.notes).length} notes`,
    `tracked ${Object.keys(result.manifest.evidence).length} evidence paths`
  ];

  const projectPath = projnaviPath(root, "project.md");
  try {
    const currentProject = await fs.readFile(projectPath, "utf8");
    if (currentProject === PROJECT_TEMPLATE) {
      await fs.writeFile(projectPath, renderProjectInventory(result.manifest), "utf8");
      result.manifest.notes[".projnavi/project.md"] = await createFileEntry(root, ".projnavi/project.md", "note");
      lines.push("updated .projnavi/project.md inventory");
    } else {
      lines.push("skipped .projnavi/project.md because it is user-edited");
    }
  } catch (error) {
    if (!isNodeError(error) || error.code !== "ENOENT") {
      throw error;
    }
  }

  await writeManifest(root, result.manifest);

  return ok(lines.join("\n"), result.warnings.length > 0 ? formatWarningsAsText(result.warnings) : undefined);
}

function formatWarningsAsText(warnings: string[]): string {
  return formatWarnings(warnings.map((message) => ({ message }))).join("\n");
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
