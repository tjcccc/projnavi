import { createRequire } from "node:module";
import { promises as fs } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "../src/cli.js";
import { makeTempRepo } from "./helpers.js";

const require = createRequire(import.meta.url);
const packageJson = require("../package.json") as { version: string };

describe("CLI smoke paths", () => {
  it("prints the package version", async () => {
    let stdout = "";
    const io = {
      writeOut: (message: string) => {
        stdout += message;
      }
    };

    expect(await runCli(["--version"], io)).toBe(0);
    expect(stdout).toBe(`${packageJson.version}\n`);

    stdout = "";
    expect(await runCli(["-v"], io)).toBe(0);
    expect(stdout).toBe(`${packageJson.version}\n`);
  });

  it("prints help with integration options", async () => {
    let stdout = "";
    const io = {
      writeOut: (message: string) => {
        stdout += message;
      }
    };

    expect(await runCli(["--help"], io)).toBe(0);
    expect(stdout).toContain("projnavi integrate");
    expect(stdout).toContain("--repo-doc");
    expect(stdout).toContain("--agent-doc <path>");
    expect(stdout).toContain("--skills-dir <skills-folder>");
    expect(stdout).toContain("--agent codex installs the global Codex skill and adds repo AGENTS.md policy guidance");
    expect(stdout).toContain("--agent-doc <path> adds managed projnavi policy guidance");
  });

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
    expect(await runCli(["guide", "get users", "--max-items", "1"], io)).toBe(0);
    expect(stdout).toContain("Read first:\n- src/api/users.ts - supports claim-users-route-001\nRelevant notes:");

    stdout = "";
    stderr = "";
    expect(await runCli(["guide", "get users", "--max-items", "0"], io)).toBe(1);
    expect(stderr).toContain("--max-items must be an integer between 1 and 50.");

    stdout = "";
    stderr = "";
    expect(await runCli(["notes", "users"], io)).toBe(0);
    expect(stdout).toContain("Claims");

    stdout = "";
    expect(await runCli(["verify"], io)).toBe(0);
    expect(stdout).toContain("fresh");
  });

  it("parses init agent and custom integration options", async () => {
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

    expect(
      await runCli(["init", "--agent", "cursor", "--agent-doc", "docs/AGENT.md", "--skills-dir", ".agents/skills"], io)
    ).toBe(0);
    expect(stdout).toContain("created .cursor/rules/projnavi.mdc with projnavi Cursor rule");
    expect(stdout).toContain("created docs/AGENT.md with projnavi custom agent instructions");
    expect(stdout).toContain("created .agents/skills/projnavi/SKILL.md with projnavi custom agent skill");
    expect(stderr).toBe("");

    await expect(fs.readFile(path.join(root, ".cursor", "rules", "projnavi.mdc"), "utf8")).resolves.toContain(
      "alwaysApply: true"
    );
    await expect(fs.readFile(path.join(root, "docs", "AGENT.md"), "utf8")).resolves.toContain(
      "projnavi-agent-doc:start"
    );
    await expect(fs.readFile(path.join(root, ".agents", "skills", "projnavi", "SKILL.md"), "utf8")).resolves.toContain(
      "name: projnavi"
    );
  });

  it("runs integrate without scaffolding projnavi", async () => {
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

    expect(await runCli(["integrate", "--agent-doc", "docs/AGENT.md", "--skills-dir", ".agents/skills"], io)).toBe(0);
    expect(stdout).toContain("created docs/AGENT.md with projnavi custom agent instructions");
    expect(stdout).toContain("created .agents/skills/projnavi/SKILL.md with projnavi custom agent skill");
    expect(stdout).not.toContain("created .projnavi/project.md");
    expect(stderr).toBe("");
  });
});
