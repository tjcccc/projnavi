import type { Claim, Glossary, GlossaryTerm, Manifest } from "./schemas.js";
import type { NoteDoc } from "./notes.js";
import type { VerifyReport } from "./verify.js";
import { exactPhraseMatch, isTestPath, tokenize, tokenOverlapScore, uniqueStrings } from "./search.js";

export interface ReadFirstItem {
  path: string;
  reason: string;
  kind: "file" | "note";
}

export interface BriefEvidence {
  claimId: string;
  claim: string;
  source: Claim["source"];
  confidence: number;
  path?: string;
  lines?: [number, number];
  note?: string;
}

export interface TaskBrief {
  task: string;
  confidence: {
    label: "none" | "low" | "medium" | "high";
    score: number;
  };
  readFirst: ReadFirstItem[];
  relevantNotes: Array<{ path: string; title: string; reason: string }>;
  relevantConcepts: string[];
  suggestedTests: string[];
  warnings: string[];
  staleDataWarnings: string[];
  evidence: BriefEvidence[];
  disclaimer: string;
}

interface RankedClaim {
  claim: Claim;
  score: number;
  reasons: string[];
}

interface RankedGlossaryTerm {
  term: GlossaryTerm;
  score: number;
  reasons: string[];
}

interface RankedNote {
  note: NoteDoc;
  score: number;
  reasons: string[];
}

const DISCLAIMER =
  "This task brief is navigation advice, not ground truth. Verify source files and tests before editing.";

export function buildTaskBrief(input: {
  task: string;
  claims: Claim[];
  glossary: Glossary;
  notes: NoteDoc[];
  manifest: Manifest | null;
  verifyReport: VerifyReport;
  parserWarnings: string[];
}): TaskBrief {
  const tokens = tokenize(input.task);
  const rankedClaims = rankClaims(input.task, tokens, input.claims, input.verifyReport);
  const rankedTerms = rankGlossaryTerms(input.task, tokens, input.glossary);
  const rankedNotes = rankNotes(input.task, tokens, input.notes);
  const staleDataWarnings = buildStaleWarnings(input.verifyReport, rankedClaims);
  const warnings = [...input.parserWarnings];

  if (!input.verifyReport.manifestFound) {
    staleDataWarnings.push("manifest.json was not found. Run `projnavi onboard` before trusting freshness signals.");
  }

  if (rankedClaims.length === 0 && rankedTerms.length === 0 && rankedNotes.length === 0) {
    warnings.push("No high-precision projnavi matches found for this task.");
  }

  const readFirst = buildReadFirst(rankedClaims, rankedTerms, rankedNotes);
  const suggestedTests = buildSuggestedTests(input.task, tokens, rankedClaims, input.manifest);
  const relevantConcepts = buildRelevantConcepts(rankedClaims, rankedTerms);
  const evidence = buildEvidence(rankedClaims);
  const confidence = buildConfidence(rankedClaims, rankedTerms, rankedNotes);

  return {
    task: input.task,
    confidence,
    readFirst,
    relevantNotes: rankedNotes.slice(0, 5).map((ranked) => ({
      path: ranked.note.path,
      title: ranked.note.title,
      reason: ranked.reasons.join("; ")
    })),
    relevantConcepts,
    suggestedTests,
    warnings,
    staleDataWarnings,
    evidence,
    disclaimer: DISCLAIMER
  };
}

function rankClaims(task: string, tokens: string[], claims: Claim[], verifyReport: VerifyReport): RankedClaim[] {
  const staleClaims = new Set(verifyReport.staleClaims);

  return claims
    .map((claim) => {
      let score = 0;
      const reasons: string[] = [];

      if (exactPhraseMatch(claim.claim, task)) {
        score += 8;
        reasons.push("exact phrase in claim");
      }

      const keywordText = claim.keywords.join(" ");
      if (claim.keywords.some((keyword) => exactPhraseMatch(keyword, task) || exactPhraseMatch(task, keyword))) {
        score += 10;
        reasons.push("exact phrase in keyword");
      }

      const topicText = claim.topics.join(" ");
      if (claim.topics.some((topic) => exactPhraseMatch(topic, task) || exactPhraseMatch(task, topic))) {
        score += 6;
        reasons.push("topic match");
      }

      const claimTokens = tokenOverlapScore(claim.claim, tokens, 2);
      const keywordTokens = tokenOverlapScore(keywordText, tokens, 3);
      const topicTokens = tokenOverlapScore(topicText, tokens, 3);
      const pathTokens = tokenOverlapScore(claim.paths.join(" "), tokens, 2);
      score += claimTokens.score + keywordTokens.score + topicTokens.score + pathTokens.score;

      const matchedTokens = uniqueStrings([
        ...claimTokens.matches,
        ...keywordTokens.matches,
        ...topicTokens.matches,
        ...pathTokens.matches
      ]);

      if (matchedTokens.length > 0) {
        reasons.push(`matched tokens: ${matchedTokens.join(", ")}`);
      }

      score *= 0.5 + claim.confidence * 0.5;

      if (staleClaims.has(claim.id)) {
        score *= 0.25;
        reasons.push("stale evidence penalty");
      }

      return { claim, score, reasons };
    })
    .filter((ranked) => isStrongEnough(ranked.score, tokens, ranked.reasons))
    .sort((a, b) => b.score - a.score || a.claim.id.localeCompare(b.claim.id));
}

function rankGlossaryTerms(task: string, tokens: string[], glossary: Glossary): RankedGlossaryTerm[] {
  return glossary.terms
    .map((term) => {
      let score = 0;
      const reasons: string[] = [];
      const aliases = term.aliases.join(" ");
      const topics = term.topics.join(" ");
      const mapsTo = term.mapsTo.join(" ");

      if (exactPhraseMatch(term.term, task) || exactPhraseMatch(task, term.term)) {
        score += 10;
        reasons.push("exact phrase in glossary term");
      }

      if (term.aliases.some((alias) => exactPhraseMatch(alias, task) || exactPhraseMatch(task, alias))) {
        score += 10;
        reasons.push("exact phrase in glossary alias");
      }

      if (term.topics.some((topic) => exactPhraseMatch(topic, task) || exactPhraseMatch(task, topic))) {
        score += 5;
        reasons.push("glossary topic match");
      }

      const termTokens = tokenOverlapScore(term.term, tokens, 3);
      const aliasTokens = tokenOverlapScore(aliases, tokens, 3);
      const topicTokens = tokenOverlapScore(topics, tokens, 2);
      const mapsToTokens = tokenOverlapScore(mapsTo, tokens, 1);
      const pathTokens = tokenOverlapScore(term.paths.join(" "), tokens, 2);
      score += termTokens.score + aliasTokens.score + topicTokens.score + mapsToTokens.score + pathTokens.score;

      const matchedTokens = uniqueStrings([
        ...termTokens.matches,
        ...aliasTokens.matches,
        ...topicTokens.matches,
        ...mapsToTokens.matches,
        ...pathTokens.matches
      ]);

      if (matchedTokens.length > 0) {
        reasons.push(`matched tokens: ${matchedTokens.join(", ")}`);
      }

      return { term, score, reasons };
    })
    .filter((ranked) => isStrongEnough(ranked.score, tokens, ranked.reasons))
    .sort((a, b) => b.score - a.score || a.term.term.localeCompare(b.term.term));
}

function rankNotes(task: string, tokens: string[], notes: NoteDoc[]): RankedNote[] {
  return notes
    .map((note) => {
      let score = 0;
      const reasons: string[] = [];

      if (exactPhraseMatch(note.title, task) || exactPhraseMatch(task, note.title)) {
        score += 7;
        reasons.push("exact phrase in note title");
      }

      if (exactPhraseMatch(note.body, task)) {
        score += 4;
        reasons.push("exact phrase in note body");
      }

      const titleTokens = tokenOverlapScore(note.title, tokens, 2);
      const bodyTokens = tokenOverlapScore(note.body, tokens, 0.75);
      score += titleTokens.score + bodyTokens.score;

      const matchedTokens = uniqueStrings([...titleTokens.matches, ...bodyTokens.matches]);
      if (matchedTokens.length > 0) {
        reasons.push(`matched tokens: ${matchedTokens.join(", ")}`);
      }

      return { note, score, reasons };
    })
    .filter((ranked) => isStrongEnough(ranked.score, tokens, ranked.reasons))
    .sort((a, b) => b.score - a.score || a.note.path.localeCompare(b.note.path));
}

function isStrongEnough(score: number, tokens: string[], reasons: string[]): boolean {
  const hasExact = reasons.some((reason) => reason.includes("exact phrase"));
  if (hasExact) {
    return score >= 4;
  }

  const matchedTokenReason = reasons.find((reason) => reason.startsWith("matched tokens:"));
  const matchedTokenCount = matchedTokenReason ? matchedTokenReason.split(":")[1]?.split(",").length ?? 0 : 0;
  if (tokens.length <= 1) {
    return score >= 3;
  }

  return score >= 6 && matchedTokenCount >= 2;
}

function buildReadFirst(
  rankedClaims: RankedClaim[],
  rankedTerms: RankedGlossaryTerm[],
  rankedNotes: RankedNote[]
): ReadFirstItem[] {
  const items: ReadFirstItem[] = [];

  for (const ranked of rankedNotes.slice(0, 4)) {
    items.push({ path: ranked.note.path, reason: ranked.reasons.join("; "), kind: "note" });
  }

  for (const ranked of rankedClaims.slice(0, 8)) {
    for (const path of uniqueStrings([...ranked.claim.paths, ...ranked.claim.evidence.map((item) => item.path)])) {
      items.push({ path, reason: `supports ${ranked.claim.id}`, kind: "file" });
    }
  }

  for (const ranked of rankedTerms.slice(0, 5)) {
    for (const path of ranked.term.paths) {
      items.push({ path, reason: `mapped from glossary term ${ranked.term.term}`, kind: "file" });
    }
  }

  const seen = new Set<string>();
  return items
    .filter((item) => {
      if (seen.has(item.path)) {
        return false;
      }

      seen.add(item.path);
      return true;
    })
    .slice(0, 8);
}

function buildSuggestedTests(
  task: string,
  tokens: string[],
  rankedClaims: RankedClaim[],
  manifest: Manifest | null
): string[] {
  const tests: string[] = [];

  for (const ranked of rankedClaims) {
    if (ranked.claim.type === "test") {
      tests.push(...ranked.claim.paths);
    }

    tests.push(...ranked.claim.paths.filter(isTestPath));
    tests.push(...ranked.claim.evidence.map((item) => item.path).filter(isTestPath));
  }

  if (manifest) {
    const rankedTests = manifest.inventory.tests
      .map((testPath) => {
        let score = exactPhraseMatch(testPath, task) ? 5 : 0;
        score += tokenOverlapScore(testPath, tokens, 2).score;
        return { testPath, score };
      })
      .filter((item) => item.score >= 2)
      .sort((a, b) => b.score - a.score || a.testPath.localeCompare(b.testPath))
      .map((item) => item.testPath);

    tests.push(...rankedTests);
  }

  return uniqueStrings(tests).slice(0, 5);
}

function buildRelevantConcepts(rankedClaims: RankedClaim[], rankedTerms: RankedGlossaryTerm[]): string[] {
  const concepts: string[] = [];

  for (const ranked of rankedTerms.slice(0, 6)) {
    concepts.push(ranked.term.term, ...ranked.term.mapsTo, ...ranked.term.topics);
  }

  for (const ranked of rankedClaims.slice(0, 6)) {
    concepts.push(...ranked.claim.topics);
  }

  return uniqueStrings(concepts.filter((concept) => concept.trim().length > 0)).slice(0, 8);
}

function buildEvidence(rankedClaims: RankedClaim[]): BriefEvidence[] {
  const evidence: BriefEvidence[] = [];

  for (const ranked of rankedClaims.slice(0, 6)) {
    if (ranked.claim.evidence.length === 0) {
      evidence.push({
        claimId: ranked.claim.id,
        claim: ranked.claim.claim,
        source: ranked.claim.source,
        confidence: ranked.claim.confidence
      });
      continue;
    }

    for (const item of ranked.claim.evidence.slice(0, 2)) {
      evidence.push({
        claimId: ranked.claim.id,
        claim: ranked.claim.claim,
        source: ranked.claim.source,
        confidence: ranked.claim.confidence,
        path: item.path,
        ...(item.lines ? { lines: item.lines } : {}),
        ...(item.note ? { note: item.note } : {})
      });
    }
  }

  return evidence.slice(0, 8);
}

function buildConfidence(
  rankedClaims: RankedClaim[],
  rankedTerms: RankedGlossaryTerm[],
  rankedNotes: RankedNote[]
): TaskBrief["confidence"] {
  const topScore = Math.max(
    rankedClaims[0]?.score ?? 0,
    rankedTerms[0]?.score ?? 0,
    rankedNotes[0]?.score ?? 0
  );

  if (topScore <= 0) {
    return { label: "none", score: 0 };
  }

  const claimConfidence = rankedClaims[0]?.claim.confidence ?? 0.65;
  const score = Math.min(0.95, Math.round(((topScore / 24) * 0.65 + claimConfidence * 0.35) * 100) / 100);
  const label = score >= 0.75 ? "high" : score >= 0.5 ? "medium" : "low";
  return { label, score };
}

function buildStaleWarnings(verifyReport: VerifyReport, rankedClaims: RankedClaim[]): string[] {
  const relevantClaimIds = new Set(rankedClaims.map((ranked) => ranked.claim.id));
  const warnings: string[] = [];

  for (const issue of [...verifyReport.changedFiles, ...verifyReport.missingFiles, ...verifyReport.untrackedFiles]) {
    if (issue.claims.length === 0 || issue.claims.some((claimId) => relevantClaimIds.has(claimId))) {
      warnings.push(issue.message);
    }
  }

  return uniqueStrings(warnings);
}

export function formatBriefMarkdown(brief: TaskBrief): string {
  return [
    `Task: ${brief.task}`,
    `Confidence: ${brief.confidence.label} (${brief.confidence.score.toFixed(2)})`,
    "",
    formatList("Read first", brief.readFirst.map((item) => `${item.path} - ${item.reason}`)),
    formatList("Relevant notes", brief.relevantNotes.map((note) => `${note.path} - ${note.title}; ${note.reason}`)),
    formatList("Relevant concepts", brief.relevantConcepts),
    formatList("Suggested tests", brief.suggestedTests),
    formatList("Warnings", brief.warnings),
    formatList("Stale data warnings", brief.staleDataWarnings),
    formatList(
      "Evidence",
      brief.evidence.map((item) => {
        const location = item.path
          ? `${item.path}${item.lines ? `:${item.lines[0]}-${item.lines[1]}` : ""}`
          : "no evidence path";
        return `${item.claimId} (${item.source}, ${item.confidence.toFixed(2)}) - ${location} - ${item.claim}`;
      })
    ),
    "",
    brief.disclaimer
  ]
    .filter((section) => section.length > 0)
    .join("\n");
}

function formatList(title: string, values: string[]): string {
  if (values.length === 0) {
    return `${title}:\n- none`;
  }

  return `${title}:\n${values.map((value) => `- ${value}`).join("\n")}`;
}
