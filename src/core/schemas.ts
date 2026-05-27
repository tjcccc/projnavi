export const CLAIM_TYPES = [
  "module",
  "flow",
  "route",
  "test",
  "command",
  "risk",
  "concept",
  "note"
] as const;

export const CLAIM_SOURCES = ["manual", "static-scan", "ai-inferred"] as const;

export type ClaimType = (typeof CLAIM_TYPES)[number];
export type ClaimSource = (typeof CLAIM_SOURCES)[number];

export interface ClaimEvidence {
  path: string;
  lines?: [number, number];
  note?: string;
}

export interface Claim {
  id: string;
  type: ClaimType;
  claim: string;
  topics: string[];
  keywords: string[];
  paths: string[];
  evidence: ClaimEvidence[];
  confidence: number;
  source: ClaimSource;
  updatedAt: string;
}

export interface GlossaryTerm {
  term: string;
  aliases: string[];
  mapsTo: string[];
  topics: string[];
  paths: string[];
  notes?: string;
}

export interface Glossary {
  terms: GlossaryTerm[];
}

export interface ManifestFileEntry {
  hash: string;
  size: number;
  mtimeMs?: number;
  category: "config" | "docs" | "source" | "test" | "note" | "evidence" | "other";
}

export interface ManifestInventory {
  summary: string;
  packageName?: string;
  packageScripts?: string[];
  topLevelDirectories: string[];
  fileCounts: Record<string, number>;
  tests: string[];
}

export interface Manifest {
  version: 1;
  projnaviVersion: string;
  generatedAt: string;
  root: ".";
  files: Record<string, ManifestFileEntry>;
  notes: Record<string, ManifestFileEntry>;
  evidence: Record<string, ManifestFileEntry & { claimIds: string[] }>;
  inventory: ManifestInventory;
}

export interface ValidationWarning {
  message: string;
  line?: number;
  path?: string;
}

export interface ParseResult<T> {
  value: T;
  warnings: ValidationWarning[];
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const strings = value.filter((item): item is string => typeof item === "string");
  return strings.length === value.length ? strings : null;
}

export function validateClaim(value: unknown, line?: number): ParseResult<Claim | null> {
  const warnings: ValidationWarning[] = [];
  const fail = (message: string): ParseResult<null> => ({
    value: null,
    warnings: [{ message, ...(line !== undefined ? { line } : {}) }]
  });

  if (!isPlainObject(value)) {
    return fail("Claim line must be a JSON object.");
  }

  const id = value.id;
  const type = value.type;
  const claim = value.claim;
  const topics = asStringArray(value.topics);
  const keywords = asStringArray(value.keywords);
  const paths = asStringArray(value.paths);
  const evidenceValue = value.evidence;
  const confidence = value.confidence;
  const source = value.source;
  const updatedAt = value.updatedAt;

  if (typeof id !== "string" || id.trim() === "") {
    return fail("Claim id must be a non-empty string.");
  }

  if (typeof type !== "string" || !CLAIM_TYPES.includes(type as ClaimType)) {
    return fail(`Claim ${id} has invalid type.`);
  }

  if (typeof claim !== "string" || claim.trim() === "") {
    return fail(`Claim ${id} must include a non-empty claim string.`);
  }

  if (topics === null) {
    return fail(`Claim ${id} topics must be an array of strings.`);
  }

  if (keywords === null) {
    return fail(`Claim ${id} keywords must be an array of strings.`);
  }

  if (paths === null) {
    return fail(`Claim ${id} paths must be an array of strings.`);
  }

  if (!Array.isArray(evidenceValue)) {
    return fail(`Claim ${id} evidence must be an array.`);
  }

  const evidence: ClaimEvidence[] = [];
  for (const [index, item] of evidenceValue.entries()) {
    if (!isPlainObject(item) || typeof item.path !== "string" || item.path.trim() === "") {
      return fail(`Claim ${id} evidence item ${index + 1} must include a path.`);
    }

    const evidenceItem: ClaimEvidence = { path: item.path };

    if (item.lines !== undefined) {
      if (
        !Array.isArray(item.lines) ||
        item.lines.length !== 2 ||
        typeof item.lines[0] !== "number" ||
        typeof item.lines[1] !== "number"
      ) {
        return fail(`Claim ${id} evidence item ${index + 1} lines must be [start, end].`);
      }

      evidenceItem.lines = [item.lines[0], item.lines[1]];
    }

    if (item.note !== undefined) {
      if (typeof item.note !== "string") {
        return fail(`Claim ${id} evidence item ${index + 1} note must be a string.`);
      }

      evidenceItem.note = item.note;
    }

    evidence.push(evidenceItem);
  }

  if (typeof confidence !== "number" || confidence < 0 || confidence > 1) {
    return fail(`Claim ${id} confidence must be between 0 and 1.`);
  }

  if (typeof source !== "string" || !CLAIM_SOURCES.includes(source as ClaimSource)) {
    return fail(`Claim ${id} has invalid source.`);
  }

  if (typeof updatedAt !== "string" || Number.isNaN(Date.parse(updatedAt))) {
    return fail(`Claim ${id} updatedAt must be an ISO timestamp string.`);
  }

  return {
    value: {
      id,
      type: type as ClaimType,
      claim,
      topics,
      keywords,
      paths,
      evidence,
      confidence,
      source: source as ClaimSource,
      updatedAt
    },
    warnings
  };
}

export function validateGlossary(value: unknown): ParseResult<Glossary> {
  const warnings: ValidationWarning[] = [];

  if (!isPlainObject(value)) {
    return {
      value: { terms: [] },
      warnings: [{ message: "glossary.json must contain a JSON object." }]
    };
  }

  if (!Array.isArray(value.terms)) {
    return {
      value: { terms: [] },
      warnings: [{ message: "glossary.json terms must be an array." }]
    };
  }

  const terms: GlossaryTerm[] = [];
  for (const [index, rawTerm] of value.terms.entries()) {
    if (!isPlainObject(rawTerm) || typeof rawTerm.term !== "string" || rawTerm.term.trim() === "") {
      warnings.push({ message: `Glossary term ${index + 1} must include a non-empty term.` });
      continue;
    }

    const aliases = asStringArray(rawTerm.aliases);
    const mapsTo = asStringArray(rawTerm.mapsTo);
    const topics = asStringArray(rawTerm.topics);
    const paths = asStringArray(rawTerm.paths);

    if (aliases === null || mapsTo === null || topics === null || paths === null) {
      warnings.push({ message: `Glossary term ${rawTerm.term} has invalid array fields.` });
      continue;
    }

    if (rawTerm.notes !== undefined && typeof rawTerm.notes !== "string") {
      warnings.push({ message: `Glossary term ${rawTerm.term} notes must be a string.` });
      continue;
    }

    terms.push({
      term: rawTerm.term,
      aliases,
      mapsTo,
      topics,
      paths,
      ...(rawTerm.notes !== undefined ? { notes: rawTerm.notes } : {})
    });
  }

  return { value: { terms }, warnings };
}
