import { promises as fs } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runGuide } from "../src/commands/guide.js";
import { runOnboard } from "../src/commands/onboard.js";
import { makeTempRepo } from "./helpers.js";

describe("guide command", () => {
  it("returns a concise JSON task brief with matching claims, glossary concepts, tests, and evidence", async () => {
    const root = await makeTempRepo();
    await runOnboard(root);

    const result = await runGuide(root, "get users", { format: "json", strict: false });
    expect(result.exitCode).toBe(0);

    const brief = JSON.parse(result.stdout ?? "{}") as {
      task: string;
      readFirst: Array<{ path: string }>;
      relevantConcepts: string[];
      suggestedTests: string[];
      evidence: Array<{ claimId: string }>;
      disclaimer: string;
    };

    expect(brief.task).toBe("get users");
    expect(brief.readFirst.length).toBeLessThanOrEqual(8);
    expect(brief.readFirst.some((item) => item.path === "src/api/users.ts")).toBe(true);
    expect(brief.relevantConcepts).toContain("UserService");
    expect(brief.suggestedTests).toContain("src/api/users.test.ts");
    expect(brief.evidence.some((item) => item.claimId === "claim-users-route-001")).toBe(true);
    expect(brief.disclaimer).toContain("navigation advice");
  });

  it("matches glossary aliases", async () => {
    const root = await makeTempRepo();
    await runOnboard(root);

    const result = await runGuide(root, "fetch users", { format: "json", strict: false });
    const brief = JSON.parse(result.stdout ?? "{}") as { readFirst: Array<{ path: string }> };

    expect(brief.readFirst.some((item) => item.path === "src/api/users.ts")).toBe(true);
  });

  it("caps read-first items in JSON output with maxItems", async () => {
    const root = await makeTempRepo();
    await runOnboard(root);

    const result = await runGuide(root, "get users", { format: "json", strict: false, maxItems: 1 });
    const brief = JSON.parse(result.stdout ?? "{}") as { readFirst: Array<{ path: string }> };

    expect(brief.readFirst).toHaveLength(1);
    expect(brief.readFirst[0]?.path).toBe("src/api/users.ts");
  });

  it("caps read-first items in text output with maxItems", async () => {
    const root = await makeTempRepo();
    await runOnboard(root);

    const result = await runGuide(root, "get users", { format: "text", strict: false, maxItems: 1 });

    expect(result.exitCode).toBe(0);
    expect(readFirstLines(result.stdout ?? "")).toEqual(["- src/api/users.ts - supports claim-users-route-001"]);
  });

  it("keeps broad module notes out of read-first when narrow backend files match", async () => {
    const root = await makeTempRepo();
    const servicePath = path.join(root, "src/services/users.ts");
    await fs.mkdir(path.dirname(servicePath), { recursive: true });
    await fs.writeFile(servicePath, "export function validateUsersUpload() { return true; }\n", "utf8");
    await fs.writeFile(
      path.join(root, ".projnavi/modules/users-upload.md"),
      [
        "# Users Upload Module",
        "",
        "The users upload module covers how to fix CodeList upload validation, routing, service rules, repository persistence, registry mappings, and tests."
      ].join("\n"),
      "utf8"
    );
    await fs.appendFile(
      path.join(root, ".projnavi/claims.jsonl"),
      [
        "",
        JSON.stringify({
          id: "claim-users-upload-validation-001",
          type: "route",
          claim: "CodeList upload validation is handled by the users route and service.",
          topics: ["users", "upload", "validation"],
          keywords: ["CodeList upload validation", "users upload validation", "upload validation"],
          paths: ["src/api/users.ts", "src/services/users.ts", "src/api/users.test.ts"],
          evidence: [
            { path: "src/api/users.ts", lines: [1, 10], note: "Users upload route" },
            { path: "src/services/users.ts", lines: [1, 1], note: "Users upload validation service" },
            { path: "src/api/users.test.ts", lines: [1, 8], note: "Users upload validation test" }
          ],
          confidence: 0.9,
          source: "manual",
          updatedAt: "2026-05-23T00:00:00.000Z"
        })
      ].join("\n"),
      "utf8"
    );
    await runOnboard(root);

    const result = await runGuide(root, "fix CodeList upload validation", { format: "json", strict: false });
    const brief = JSON.parse(result.stdout ?? "{}") as {
      readFirst: Array<{ path: string }>;
      relevantNotes: Array<{ path: string }>;
    };
    const readFirstPaths = brief.readFirst.map((item) => item.path);

    expect(readFirstPaths.slice(0, 3)).toEqual([
      "src/api/users.ts",
      "src/services/users.ts",
      "src/api/users.test.ts"
    ]);
    expect(readFirstPaths).not.toContain(".projnavi/modules/users-upload.md");
    expect(brief.relevantNotes.some((note) => note.path === ".projnavi/modules/users-upload.md")).toBe(true);
  });
});

function readFirstLines(output: string): string[] {
  const readFirst = output.split("Read first:\n")[1]?.split("\nRelevant notes:")[0] ?? "";
  return readFirst.split(/\r?\n/).filter((line) => line.startsWith("- "));
}
