import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Manifest, ManifestFileEntry } from "./schemas.js";
import { isPlainObject } from "./schemas.js";
import { normalizeRelPath, projnaviPath, resolveInRoot } from "./paths.js";
import { createInitialManifest } from "./templates.js";

export const PROJNAVI_VERSION = "0.2.0";

export async function hashFile(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath);
  return createHash("sha256").update(content).digest("hex");
}

export async function createFileEntry(
  root: string,
  relativePath: string,
  category: ManifestFileEntry["category"]
): Promise<ManifestFileEntry> {
  const absolutePath = resolveInRoot(root, relativePath);
  const stat = await fs.stat(absolutePath);
  return {
    hash: await hashFile(absolutePath),
    size: stat.size,
    mtimeMs: stat.mtimeMs,
    category
  };
}

export async function readManifest(root: string): Promise<Manifest | null> {
  const manifestPath = projnaviPath(root, "manifest.json");

  try {
    const content = await fs.readFile(manifestPath, "utf8");
    const parsed = JSON.parse(content) as unknown;
    return coerceManifest(parsed);
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export async function writeManifest(root: string, manifest: Manifest): Promise<void> {
  await fs.mkdir(projnaviPath(root), { recursive: true });
  await fs.writeFile(projnaviPath(root, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

export async function ensureManifest(root: string): Promise<Manifest> {
  const existing = await readManifest(root);
  if (existing) {
    return existing;
  }

  const manifest = createInitialManifest(PROJNAVI_VERSION);
  await writeManifest(root, manifest);
  return manifest;
}

export function coerceManifest(value: unknown): Manifest {
  const fallback = createInitialManifest(PROJNAVI_VERSION);
  if (!isPlainObject(value)) {
    return fallback;
  }

  const version = value.version === 1 ? 1 : 1;
  const projnaviVersion = typeof value.projnaviVersion === "string" ? value.projnaviVersion : PROJNAVI_VERSION;
  const generatedAt = typeof value.generatedAt === "string" ? value.generatedAt : new Date().toISOString();
  const files = coerceFileMap(value.files);
  const notes = coerceFileMap(value.notes);
  const evidence = coerceEvidenceMap(value.evidence);
  const inventory = isPlainObject(value.inventory) ? value.inventory : {};

  const manifest: Manifest = {
    version,
    projnaviVersion,
    generatedAt,
    root: ".",
    files,
    notes,
    evidence,
    inventory: {
      summary: typeof inventory.summary === "string" ? inventory.summary : fallback.inventory.summary,
      topLevelDirectories: stringArrayOrUndefined(inventory.topLevelDirectories) ?? [],
      fileCounts: coerceCounts(inventory.fileCounts),
      tests: stringArrayOrUndefined(inventory.tests) ?? []
    }
  };

  if (typeof inventory.packageName === "string") {
    manifest.inventory.packageName = inventory.packageName;
  }

  const packageScripts = stringArrayOrUndefined(inventory.packageScripts);
  if (packageScripts) {
    manifest.inventory.packageScripts = packageScripts;
  }

  return manifest;
}

function coerceFileMap(value: unknown): Record<string, ManifestFileEntry> {
  if (!isPlainObject(value)) {
    return {};
  }

  const result: Record<string, ManifestFileEntry> = {};
  for (const [rawKey, rawEntry] of Object.entries(value)) {
    if (!isPlainObject(rawEntry)) {
      continue;
    }

    if (
      typeof rawEntry.hash !== "string" ||
      typeof rawEntry.size !== "number" ||
      typeof rawEntry.mtimeMs !== "number" ||
      typeof rawEntry.category !== "string"
    ) {
      continue;
    }

    result[normalizeRelPath(rawKey)] = {
      hash: rawEntry.hash,
      size: rawEntry.size,
      mtimeMs: rawEntry.mtimeMs,
      category: rawEntry.category as ManifestFileEntry["category"]
    };
  }

  return result;
}

function coerceEvidenceMap(value: unknown): Manifest["evidence"] {
  if (!isPlainObject(value)) {
    return {};
  }

  const result: Manifest["evidence"] = {};
  for (const [rawKey, rawEntry] of Object.entries(value)) {
    if (!isPlainObject(rawEntry)) {
      continue;
    }

    if (
      typeof rawEntry.hash !== "string" ||
      typeof rawEntry.size !== "number" ||
      typeof rawEntry.mtimeMs !== "number" ||
      typeof rawEntry.category !== "string" ||
      !Array.isArray(rawEntry.claimIds)
    ) {
      continue;
    }

    const claimIds = rawEntry.claimIds.filter((claimId): claimId is string => typeof claimId === "string");
    result[normalizeRelPath(rawKey)] = {
      hash: rawEntry.hash,
      size: rawEntry.size,
      mtimeMs: rawEntry.mtimeMs,
      category: rawEntry.category as ManifestFileEntry["category"],
      claimIds
    };
  }

  return result;
}

function coerceCounts(value: unknown): Record<string, number> {
  if (!isPlainObject(value)) {
    return {};
  }

  const result: Record<string, number> = {};
  for (const [key, count] of Object.entries(value)) {
    if (typeof count === "number") {
      result[key] = count;
    }
  }

  return result;
}

function stringArrayOrUndefined(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.filter((item): item is string => typeof item === "string");
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

export async function fileExists(root: string, relativePath: string): Promise<boolean> {
  try {
    await fs.stat(path.resolve(root, relativePath));
    return true;
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}
