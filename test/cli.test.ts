import { describe, expect, it } from "vitest";
import { runCli } from "../src/cli.js";
import { makeTempRepo } from "./helpers.js";

describe("CLI smoke paths", () => {
  it("runs onboard, guide, notes, and verify through the CLI dispatcher", async () => {
    const root = await makeTempRepo();
    let stdout = "";
    let stderr = "";
    const io = {
      cwd: root,
      writeOut: (message: string) => {
        stdout += message;
      },
      writeErr: (message: string) => {
        stderr += message;
      }
    };

    expect(await runCli(["onboard"], io)).toBe(0);
    expect(stdout).toContain("updated .projnavi/manifest.json");

    stdout = "";
    stderr = "";
    expect(await runCli(["guide", "get users"], io)).toBe(0);
    expect(stdout).toContain("Read first");
    expect(stdout).toContain("src/api/users.ts");
    expect(stderr).toBe("");

    stdout = "";
    expect(await runCli(["notes", "users"], io)).toBe(0);
    expect(stdout).toContain("Claims");

    stdout = "";
    expect(await runCli(["verify"], io)).toBe(0);
    expect(stdout).toContain("fresh");
  });
});
