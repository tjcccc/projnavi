const TOKEN_PATTERN = /[a-z0-9][a-z0-9_/-]*/gi;

export function normalizeText(value: string): string {
  return value.toLowerCase();
}

export function tokenize(value: string): string[] {
  const tokens = value.toLowerCase().match(TOKEN_PATTERN) ?? [];
  return [...new Set(tokens.filter((token) => token.length > 1))];
}

export function exactPhraseMatch(haystack: string, needle: string): boolean {
  const normalizedNeedle = normalizeText(needle).trim();
  return normalizedNeedle.length > 0 && normalizeText(haystack).includes(normalizedNeedle);
}

export function tokenOverlapScore(haystack: string, tokens: string[], weight: number): { score: number; matches: string[] } {
  const haystackTokens = new Set(tokenize(haystack));
  const matches = tokens.filter((token) => haystackTokens.has(token));
  return {
    score: matches.length * weight,
    matches
  };
}

export function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    if (seen.has(value)) {
      continue;
    }

    seen.add(value);
    result.push(value);
  }

  return result;
}

export function isTestPath(value: string): boolean {
  const lower = value.toLowerCase();
  return (
    lower.includes("/test/") ||
    lower.includes("/tests/") ||
    lower.includes("__tests__") ||
    lower.endsWith(".test.ts") ||
    lower.endsWith(".test.tsx") ||
    lower.endsWith(".test.js") ||
    lower.endsWith(".spec.ts") ||
    lower.endsWith(".spec.tsx") ||
    lower.endsWith(".spec.js")
  );
}
