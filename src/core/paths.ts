import path from "node:path";

export const PROJNAVI_DIR = ".projnavi";

export function toPosixPath(value: string): string {
  return value.replaceAll(path.sep, "/").replaceAll("\\", "/");
}

export function normalizeRelPath(value: string): string {
  const normalized = toPosixPath(path.posix.normalize(toPosixPath(value)));
  return normalized.replace(/^\.\/+/, "");
}

export function relPath(root: string, absolutePath: string): string {
  return normalizeRelPath(path.relative(root, absolutePath));
}

export function resolveInRoot(root: string, relativePath: string): string {
  return path.resolve(root, relativePath);
}

export function projnaviPath(root: string, ...parts: string[]): string {
  return path.join(root, PROJNAVI_DIR, ...parts);
}

export function isInsideProjnavi(relativePath: string): boolean {
  return normalizeRelPath(relativePath).split("/")[0] === PROJNAVI_DIR;
}
