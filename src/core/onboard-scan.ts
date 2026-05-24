import { promises as fs } from "node:fs";
import path from "node:path";
import ignore from "ignore";
import { loadClaims } from "./claims.js";
import { loadGlossary } from "./glossary.js";
import { createFileEntry, PROJNAVI_VERSION } from "./manifest.js";
import { loadNoteDocs } from "./notes.js";
import { isInsideProjnavi, normalizeRelPath, relPath, resolveInRoot } from "./paths.js";
import type { Claim, Glossary, Manifest, ManifestFileEntry, ManifestInventory } from "./schemas.js";
import { isTestPath } from "./search.js";

const HARD_IGNORE_DIRS = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".turbo", ".projnavi"]);
const MAX_RELEVANT_FILE_SIZE = 1024 * 1024;

const COMMON_FILENAMES = new Set([
  "package.json",
  "README.md",
  "readme.md",
  "tsconfig.json",
  "jsconfig.json",
  "vite.config.ts",
  "vite.config.js",
  "vite.config.mjs",
  "next.config.ts",
  "next.config.js",
  "vitest.config.ts",
  "vitest.config.js",
  "jest.config.ts",
  "jest.config.js",
  "playwright.config.ts",
  "playwright.config.js",
  "eslint.config.mjs",
  "eslint.config.js",
  "biome.json",
  "turbo.json",
  "pnpm-workspace.yaml"
]);

const SOURCE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".yml",
  ".yaml"
]);

export interface OnboardResult {
  manifest: Manifest;
  warnings: string[];
}

interface ScannedFile {
  path: string;
  category: ManifestFileEntry["category"];
}

export async function scanForManifest(root: string): Promise<OnboardResult> {
  const warnings: string[] = [];
  const files = await scanRepoFiles(root);
  const fileEntries: Manifest["files"] = {};

  for (const file of files) {
    try {
      fileEntries[file.path] = await createFileEntry(root, file.path, file.category);
    } catch (error) {
      warnings.push(`Skipped ${file.path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const notes = await loadNoteDocs(root);
  const noteEntries: Manifest["notes"] = {};
  for (const note of notes) {
    try {
      noteEntries[note.path] = await createFileEntry(root, note.path, "note");
    } catch (error) {
      warnings.push(`Skipped note ${note.path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const claimsResult = await loadClaims(root);
  warnings.push(...claimsResult.warnings.map((warning) => `claims.jsonl: ${warning.message}`));
  const glossaryResult = await loadGlossary(root);
  warnings.push(...glossaryResult.warnings.map((warning) => `glossary.json: ${warning.message}`));

  const evidence = await buildEvidenceEntries(root, claimsResult.value, glossaryResult.value, fileEntries, warnings);
  const inventory = await buildInventory(root, files);

  return {
    manifest: {
      version: 1,
      projnaviVersion: PROJNAVI_VERSION,
      generatedAt: new Date().toISOString(),
      root: ".",
      files: fileEntries,
      notes: noteEntries,
      evidence,
      inventory
    },
    warnings
  };
}

async function scanRepoFiles(root: string): Promise<ScannedFile[]> {
  const ignoreMatcher = ignore();
  const gitignorePath = path.join(root, ".gitignore");

  try {
    ignoreMatcher.add(await fs.readFile(gitignorePath, "utf8"));
  } catch (error) {
    if (!isNodeError(error) || error.code !== "ENOENT") {
      throw error;
    }
  }

  const files: ScannedFile[] = [];
  await walk(root, root, ignoreMatcher, files);
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

async function walk(root: string, currentDir: string, ignoreMatcher: ReturnType<typeof ignore>, files: ScannedFile[]): Promise<void> {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const absolutePath = path.join(currentDir, entry.name);
    const relativePath = relPath(root, absolutePath);
    const parts = relativePath.split("/");

    if (parts.some((part) => HARD_IGNORE_DIRS.has(part))) {
      continue;
    }

    if (ignoreMatcher.ignores(relativePath)) {
      continue;
    }

    if (entry.isDirectory()) {
      await walk(root, absolutePath, ignoreMatcher, files);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const category = await classifyRelevantFile(absolutePath, relativePath);
    if (category) {
      files.push({ path: relativePath, category });
    }
  }
}

async function classifyRelevantFile(
  absolutePath: string,
  relativePath: string
): Promise<ManifestFileEntry["category"] | null> {
  const baseName = path.basename(relativePath);
  const extension = path.extname(relativePath);
  const stat = await fs.stat(absolutePath);

  if (stat.size > MAX_RELEVANT_FILE_SIZE) {
    return null;
  }

  if (isTestPath(relativePath)) {
    return "test";
  }

  if (COMMON_FILENAMES.has(baseName) || baseName.startsWith(".eslintrc")) {
    if (baseName.toLowerCase().includes("readme")) {
      return "docs";
    }

    return "config";
  }

  if (extension === ".md") {
    return "docs";
  }

  if (SOURCE_EXTENSIONS.has(extension)) {
    return "source";
  }

  return null;
}

async function buildEvidenceEntries(
  root: string,
  claims: Claim[],
  glossary: Glossary,
  files: Manifest["files"],
  warnings: string[]
): Promise<Manifest["evidence"]> {
  const pathToClaimIds = new Map<string, Set<string>>();

  for (const claim of claims) {
    for (const rawPath of [...claim.paths, ...claim.evidence.map((item) => item.path)]) {
      const relativePath = normalizeRelPath(rawPath);
      if (isInsideProjnavi(relativePath)) {
        continue;
      }

      const claimIds = pathToClaimIds.get(relativePath) ?? new Set<string>();
      claimIds.add(claim.id);
      pathToClaimIds.set(relativePath, claimIds);
    }
  }

  for (const term of glossary.terms) {
    for (const rawPath of term.paths) {
      const relativePath = normalizeRelPath(rawPath);
      if (isInsideProjnavi(relativePath)) {
        continue;
      }

      const claimIds = pathToClaimIds.get(relativePath) ?? new Set<string>();
      pathToClaimIds.set(relativePath, claimIds);
    }
  }

  const evidence: Manifest["evidence"] = {};
  for (const [relativePath, claimIds] of [...pathToClaimIds.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    try {
      const category = files[relativePath]?.category ?? (isTestPath(relativePath) ? "test" : "evidence");
      evidence[relativePath] = {
        ...(await createFileEntry(root, relativePath, category)),
        claimIds: [...claimIds].sort()
      };
    } catch (error) {
      if (isNodeError(error) && error.code === "ENOENT") {
        warnings.push(`Evidence path missing during onboard: ${relativePath}`);
        continue;
      }

      throw error;
    }
  }

  return evidence;
}

async function buildInventory(root: string, files: ScannedFile[]): Promise<ManifestInventory> {
  const fileCounts: Record<string, number> = {};
  const topLevelDirectories = new Set<string>();
  const tests = files.filter((file) => file.category === "test").map((file) => file.path);

  for (const file of files) {
    fileCounts[file.category] = (fileCounts[file.category] ?? 0) + 1;
    const topLevel = file.path.split("/")[0];
    if (topLevel && file.path.includes("/")) {
      topLevelDirectories.add(topLevel);
    }
  }

  const packageInfo = await readPackageInfo(root);
  const summaryParts = [
    packageInfo.packageName ? `Detected Node package ${packageInfo.packageName}.` : "No package name detected.",
    files.length > 0 ? `Indexed ${files.length} relevant files.` : "No relevant files indexed.",
    tests.length > 0 ? `Detected ${tests.length} test files.` : "No test files detected."
  ];

  return {
    summary: summaryParts.join(" "),
    ...(packageInfo.packageName ? { packageName: packageInfo.packageName } : {}),
    ...(packageInfo.packageScripts.length > 0 ? { packageScripts: packageInfo.packageScripts } : {}),
    topLevelDirectories: [...topLevelDirectories].sort(),
    fileCounts,
    tests
  };
}

async function readPackageInfo(root: string): Promise<{ packageName?: string; packageScripts: string[] }> {
  try {
    const parsed = JSON.parse(await fs.readFile(resolveInRoot(root, "package.json"), "utf8")) as unknown;
    if (!isRecord(parsed)) {
      return { packageScripts: [] };
    }

    const packageName = typeof parsed.name === "string" ? parsed.name : undefined;
    const scriptsRecord = isRecord(parsed.scripts) ? parsed.scripts : null;
    const scripts = scriptsRecord
      ? Object.keys(scriptsRecord)
          .filter((script) => typeof scriptsRecord[script] === "string")
          .sort()
      : [];

    return {
      ...(packageName ? { packageName } : {}),
      packageScripts: scripts
    };
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return { packageScripts: [] };
    }

    throw error;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
