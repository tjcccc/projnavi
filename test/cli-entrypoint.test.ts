import { promises as fs, realpathSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { realpathOrResolved } from "../src/cli.js";
import { makeEmptyTempDir } from "./helpers.js";

describe("CLI entrypoint helpers", () => {
  it("resolves symlinked npm bin paths to the real target", async () => {
    const root = await makeEmptyTempDir();
    const target = path.join(root, "cli.js");
    const link = path.join(root, "projnavi");

    await fs.writeFile(target, "#!/usr/bin/env node\n", "utf8");
    await fs.symlink(target, link);

    expect(realpathOrResolved(link)).toBe(realpathSync(target));
  });
});
