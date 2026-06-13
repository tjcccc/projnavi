import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Manifest, ManifestFileEntry } from "./schemas.js";
import { isPlainObject } from "./schemas.js";
import { normalizeRelPath, projnaviPath, resolveInRoot } from "./paths.js";
import { createInitialManifest } from "./templates.js";

export const PROJNAVI_VERSION = "0.5.0";

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
  await fs.writeFile(projnaviPath(root, "manifest.json"), formatManifest(manifest), "utf8");
}

export async function writeManifestIfChanged(root: string, manifest: Manifest): Promise<boolean> {
  const manifestPath = projnaviPath(root, "manifest.json");
  const nextContent = formatManifest(manifest);

  try {
    if ((await fs.readFile(manifestPath, "utf8")) === nextContent) {
      return false;
    }
  } catch (error) {
    if (!isNodeError(error) || error.code !== "ENOENT") {
      throw error;
    }
  }

  await fs.mkdir(projnaviPath(root), { recursive: true });
  await fs.writeFile(manifestPath, nextContent, "utf8");
  return true;
}

export function stabilizeManifest(existing: Manifest | null, next: Manifest): Manifest {
  if (!existing || !sameEffectiveManifest(existing, next)) {
    return next;
  }

  return { ...next, generatedAt: existing.generatedAt };
}

export function formatManifest(manifest: Manifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
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
      typeof rawEntry.category !== "string"
    ) {
      continue;
    }

    const entry: ManifestFileEntry = {
      hash: rawEntry.hash,
      size: rawEntry.size,
      category: rawEntry.category as ManifestFileEntry["category"]
    };

    if (typeof rawEntry.mtimeMs === "number") {
      entry.mtimeMs = rawEntry.mtimeMs;
    }

    result[normalizeRelPath(rawKey)] = entry;
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
      typeof rawEntry.category !== "string" ||
      !Array.isArray(rawEntry.claimIds)
    ) {
      continue;
    }

    const claimIds = rawEntry.claimIds.filter((claimId): claimId is string => typeof claimId === "string");
    const entry: Manifest["evidence"][string] = {
      hash: rawEntry.hash,
      size: rawEntry.size,
      category: rawEntry.category as ManifestFileEntry["category"],
      claimIds
    };

    if (typeof rawEntry.mtimeMs === "number") {
      entry.mtimeMs = rawEntry.mtimeMs;
    }

    result[normalizeRelPath(rawKey)] = entry;
  }

  return result;
}

function sameEffectiveManifest(left: Manifest, right: Manifest): boolean {
  return JSON.stringify(toComparableManifest(left)) === JSON.stringify(toComparableManifest(right));
}

function toComparableManifest(manifest: Manifest): unknown {
  return {
    version: manifest.version,
    projnaviVersion: manifest.projnaviVersion,
    root: manifest.root,
    files: comparableFileMap(manifest.files),
    notes: comparableFileMap(manifest.notes),
    evidence: comparableEvidenceMap(manifest.evidence),
    inventory: comparableInventory(manifest.inventory)
  };
}

function comparableFileMap(entries: Record<string, ManifestFileEntry>): Record<string, Omit<ManifestFileEntry, "mtimeMs">> {
  const result: Record<string, Omit<ManifestFileEntry, "mtimeMs">> = {};

  for (const [key, entry] of Object.entries(entries).sort(([a], [b]) => a.localeCompare(b))) {
    result[key] = {
      hash: entry.hash,
      size: entry.size,
      category: entry.category
    };
  }

  return result;
}

function comparableEvidenceMap(manifestEvidence: Manifest["evidence"]): Record<
  string,
  Omit<ManifestFileEntry, "mtimeMs"> & { claimIds: string[] }
> {
  const result: Record<string, Omit<ManifestFileEntry, "mtimeMs"> & { claimIds: string[] }> = {};

  for (const [key, entry] of Object.entries(manifestEvidence).sort(([a], [b]) => a.localeCompare(b))) {
    result[key] = {
      hash: entry.hash,
      size: entry.size,
      category: entry.category,
      claimIds: [...entry.claimIds].sort()
    };
  }

  return result;
}

function comparableInventory(inventory: Manifest["inventory"]): Manifest["inventory"] {
  return {
    summary: inventory.summary,
    ...(inventory.packageName ? { packageName: inventory.packageName } : {}),
    ...(inventory.packageScripts ? { packageScripts: [...inventory.packageScripts].sort() } : {}),
    topLevelDirectories: [...inventory.topLevelDirectories].sort(),
    fileCounts: Object.fromEntries(Object.entries(inventory.fileCounts).sort(([a], [b]) => a.localeCompare(b))),
    tests: [...inventory.tests].sort()
  };
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
