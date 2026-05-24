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
});
