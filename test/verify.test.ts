import { promises as fs } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runOnboard } from "../src/commands/onboard.js";
import { runVerify } from "../src/commands/verify.js";
import { makeTempRepo } from "./helpers.js";

describe("verify command", () => {
  it("does not rewrite manifest when tracked content is unchanged", async () => {
    const root = await makeTempRepo();

    const first = await runOnboard(root);
    expect(first.stdout).toContain("updated .projnavi/manifest.json");
    const manifestPath = path.join(root, ".projnavi", "manifest.json");
    const firstManifest = await fs.readFile(manifestPath, "utf8");
    expect(firstManifest).not.toContain("mtimeMs");

    const second = await runOnboard(root);
    expect(second.stdout).toContain("left .projnavi/manifest.json unchanged");
    await expect(fs.readFile(manifestPath, "utf8")).resolves.toBe(firstManifest);
  });

  it("detects changed evidence files and stale claims", async () => {
    const root = await makeTempRepo();
    await runOnboard(root);

    await fs.appendFile(path.join(root, "src/api/users.ts"), "\nexport const changed = true;\n", "utf8");

    const result = await runVerify(root, { nonStrict: false, strict: false });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("src/api/users.ts changed");
    expect(result.stderr).toContain("claim-users-route-001");

    const nonStrict = await runVerify(root, { nonStrict: true, strict: false });
    expect(nonStrict.exitCode).toBe(0);
    expect(nonStrict.stdout).toContain("src/api/users.ts changed");
  });
});
