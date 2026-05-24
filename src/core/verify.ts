import type { Claim, Glossary, Manifest } from "./schemas.js";
import { createFileEntry, readManifest } from "./manifest.js";
import { normalizeRelPath } from "./paths.js";

export interface VerifyIssue {
  path: string;
  kind: "changed" | "missing" | "untracked";
  claims: string[];
  message: string;
}

export interface VerifyReport {
  changedFiles: VerifyIssue[];
  missingFiles: VerifyIssue[];
  untrackedFiles: VerifyIssue[];
  staleClaims: string[];
  manifestFound: boolean;
}

export async function verifyFreshness(root: string, claims: Claim[], glossary: Glossary): Promise<VerifyReport> {
  const manifest = await readManifest(root);
  if (!manifest) {
    return {
      changedFiles: [],
      missingFiles: [],
      untrackedFiles: [],
      staleClaims: [],
      manifestFound: false
    };
  }

  return verifyAgainstManifest(root, manifest, claims, glossary);
}

export async function verifyAgainstManifest(
  root: string,
  manifest: Manifest,
  claims: Claim[],
  glossary: Glossary
): Promise<VerifyReport> {
  const targets = collectVerifyTargets(manifest, claims, glossary);
  const changedFiles: VerifyIssue[] = [];
  const missingFiles: VerifyIssue[] = [];
  const untrackedFiles: VerifyIssue[] = [];
  const staleClaimIds = new Set<string>();

  for (const target of targets) {
    const knownEntry = manifest.evidence[target.path] ?? manifest.files[target.path] ?? manifest.notes[target.path];

    if (!knownEntry) {
      untrackedFiles.push({
        path: target.path,
        kind: "untracked",
        claims: target.claims,
        message: `${target.path} is referenced but not tracked in manifest.json. Run projnavi onboard.`
      });
      continue;
    }

    try {
      const currentEntry = await createFileEntry(root, target.path, knownEntry.category);
      if (currentEntry.hash !== knownEntry.hash) {
        changedFiles.push({
          path: target.path,
          kind: "changed",
          claims: target.claims,
          message: `${target.path} changed since manifest generation.`
        });
        for (const claimId of target.claims) {
          staleClaimIds.add(claimId);
        }
      }
    } catch (error) {
      if (isNodeError(error) && error.code === "ENOENT") {
        missingFiles.push({
          path: target.path,
          kind: "missing",
          claims: target.claims,
          message: `${target.path} is missing.`
        });
        for (const claimId of target.claims) {
          staleClaimIds.add(claimId);
        }
        continue;
      }

      throw error;
    }
  }

  return {
    changedFiles,
    missingFiles,
    untrackedFiles,
    staleClaims: [...staleClaimIds].sort(),
    manifestFound: true
  };
}

function collectVerifyTargets(
  manifest: Manifest,
  claims: Claim[],
  glossary: Glossary
): Array<{ path: string; claims: string[] }> {
  const pathToClaims = new Map<string, Set<string>>();

  for (const path of [...Object.keys(manifest.files), ...Object.keys(manifest.notes), ...Object.keys(manifest.evidence)]) {
    pathToClaims.set(normalizeRelPath(path), new Set(manifest.evidence[path]?.claimIds ?? []));
  }

  for (const claim of claims) {
    for (const rawPath of [...claim.paths, ...claim.evidence.map((item) => item.path)]) {
      const relativePath = normalizeRelPath(rawPath);
      const claimIds = pathToClaims.get(relativePath) ?? new Set<string>();
      claimIds.add(claim.id);
      pathToClaims.set(relativePath, claimIds);
    }
  }

  for (const term of glossary.terms) {
    for (const rawPath of term.paths) {
      const relativePath = normalizeRelPath(rawPath);
      const claimIds = pathToClaims.get(relativePath) ?? new Set<string>();
      pathToClaims.set(relativePath, claimIds);
    }
  }

  return [...pathToClaims.entries()]
    .map(([targetPath, claims]) => ({ path: targetPath, claims: [...claims].sort() }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
