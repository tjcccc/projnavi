import { describe, expect, it } from "vitest";
import { runNotes } from "../src/commands/notes.js";
import { makeTempRepo } from "./helpers.js";

describe("notes command", () => {
  it("searches notes, glossary, and claims for a topic", async () => {
    const root = await makeTempRepo();
    const result = await runNotes(root, "users", { strict: false });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(".projnavi/modules/users.md");
    expect(result.stdout).toContain("get users");
    expect(result.stdout).toContain("claim-users-route-001");
  });
});
