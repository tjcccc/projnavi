import { loadClaims, formatWarnings } from "../core/claims.js";
import { loadGlossary } from "../core/glossary.js";
import { loadNoteDocs } from "../core/notes.js";
import { exactPhraseMatch, tokenize, tokenOverlapScore } from "../core/search.js";
import type { CommandResult } from "./types.js";
import { fail, ok } from "./types.js";

export interface NotesOptions {
  strict: boolean;
}

export async function runNotes(root: string, topic: string, options: NotesOptions): Promise<CommandResult> {
  const claimsResult = await loadClaims(root);
  const glossaryResult = await loadGlossary(root);
  const parserWarnings = [
    ...formatWarnings(claimsResult.warnings, ".projnavi/claims.jsonl"),
    ...formatWarnings(glossaryResult.warnings, ".projnavi/glossary.json")
  ];

  if (options.strict && parserWarnings.length > 0) {
    return fail(parserWarnings.join("\n"));
  }

  const notes = await loadNoteDocs(root);
  const tokens = tokenize(topic);
  const matchedNotes = notes
    .map((note) => ({
      note,
      score:
        (exactPhraseMatch(note.title, topic) ? 5 : 0) +
        (exactPhraseMatch(note.body, topic) ? 3 : 0) +
        tokenOverlapScore(`${note.title} ${note.body}`, tokens, 1).score
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.note.path.localeCompare(b.note.path));

  const matchedTerms = glossaryResult.value.terms
    .map((term) => ({
      term,
      score:
        (exactPhraseMatch(term.term, topic) ? 5 : 0) +
        (term.aliases.some((alias) => exactPhraseMatch(alias, topic)) ? 5 : 0) +
        tokenOverlapScore(`${term.term} ${term.aliases.join(" ")} ${term.topics.join(" ")}`, tokens, 1).score
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.term.term.localeCompare(b.term.term));

  const matchedClaims = claimsResult.value
    .map((claim) => ({
      claim,
      score:
        (exactPhraseMatch(claim.claim, topic) ? 5 : 0) +
        tokenOverlapScore(`${claim.claim} ${claim.topics.join(" ")} ${claim.keywords.join(" ")}`, tokens, 1).score
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.claim.id.localeCompare(b.claim.id));

  const output = [
    `Topic: ${topic}`,
    "",
    formatList("Notes", matchedNotes.slice(0, 10).map((item) => `${item.note.path} - ${item.note.title}`)),
    formatList(
      "Glossary",
      matchedTerms.slice(0, 10).map((item) => `${item.term.term} - ${item.term.mapsTo.join(", ") || "no mappings"}`)
    ),
    formatList("Claims", matchedClaims.slice(0, 10).map((item) => `${item.claim.id} - ${item.claim.claim}`)),
    parserWarnings.length > 0 ? formatList("Warnings", parserWarnings) : ""
  ]
    .filter((section) => section.length > 0)
    .join("\n");

  return ok(output);
}

function formatList(title: string, values: string[]): string {
  if (values.length === 0) {
    return `${title}:\n- none`;
  }

  return `${title}:\n${values.map((value) => `- ${value}`).join("\n")}`;
}
