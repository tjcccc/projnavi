import { promises as fs } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runInit } from "../src/commands/init.js";
import { makeEmptyTempDir } from "./helpers.js";

describe("init command", () => {
  it("does not overwrite existing files unless force is provided", async () => {
    const root = await makeEmptyTempDir();
    const first = await runInit(root, { force: false });
    expect(first.exitCode).toBe(0);

    const projectPath = path.join(root, ".projnavi", "project.md");
    await fs.writeFile(projectPath, "# User Edited\n", "utf8");

    const second = await runInit(root, { force: false });
    expect(second.stdout).toContain("skipped .projnavi/project.md");
    await expect(fs.readFile(projectPath, "utf8")).resolves.toBe("# User Edited\n");

    const third = await runInit(root, { force: true });
    expect(third.stdout).toContain("overwrote .projnavi/project.md");
    await expect(fs.readFile(projectPath, "utf8")).resolves.toContain("projnavi-template: project-v1");
  });

  it("creates a global Codex skill and repo AGENTS.md policy when requested", async () => {
    const root = await makeEmptyTempDir();
    const codexHome = await makeEmptyTempDir();

    await withEnv("CODEX_HOME", codexHome, async () => {
      const result = await runInit(root, { agent: "codex", force: false });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("created ");
      expect(result.stdout).toContain("with projnavi Codex skill");
      expect(result.stdout).toContain("created AGENTS.md with projnavi Codex instructions");

      const second = await runInit(root, { agent: "codex", force: false });
      expect(second.stdout).toContain("left ");
      expect(second.stdout).toContain("skills/projnavi/SKILL.md unchanged");
      expect(second.stdout).toContain("left AGENTS.md unchanged");
    });

    const skill = await fs.readFile(path.join(codexHome, "skills", "projnavi", "SKILL.md"), "utf8");
    expect(skill).toContain("name: projnavi");
    expect(skill).toContain("Use this project-local navigation layer");

    const agents = await fs.readFile(path.join(root, "AGENTS.md"), "utf8");
    expect(agents).toContain("Before broad or ambiguous codebase work, run this terminal command");
    expect(agents).toContain('projnavi guide "<task>"');
    expect(agents).toContain("Use the installed projnavi skill");
    expect(agents).not.toContain("When the user says exactly or approximately");
    expect(agents).not.toContain("read-only benchmark request");
    expect(agents.match(/projnavi-agent-codex:start/g)).toHaveLength(1);
  });

  it("creates Codex AGENTS.md instructions when repo doc is requested", async () => {
    const root = await makeEmptyTempDir();
    const result = await runInit(root, { agent: "codex", repoDoc: true, force: false });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("created AGENTS.md with projnavi Codex instructions");

    const agents = await fs.readFile(path.join(root, "AGENTS.md"), "utf8");
    expect(agents).toContain("Before broad or ambiguous codebase work, run this terminal command");
    expect(agents).toContain('projnavi guide "<task>"');
    expect(agents).toContain("Use the installed projnavi skill");
    expect(agents).toContain("projnavi onboard");
    expect(agents).toContain("projnavi verify");
    expect(agents).not.toContain("Run projnavi onboarding for this repo.");
    expect(agents).not.toContain("read-only benchmark request");
  });

  it("prints an agent hint when no agent is requested", async () => {
    const root = await makeEmptyTempDir();
    const result = await runInit(root, { force: false });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("hint: to add agent integration");
    expect(result.stdout).toContain("projnavi integrate --agent codex");
    expect(result.stdout).toContain("projnavi integrate --agent claude");
    expect(result.stdout).toContain("projnavi integrate --agent cursor");
    expect(result.stdout).toContain("projnavi integrate --agent opencode");
    expect(result.stdout).toContain("projnavi integrate --agent-doc <path>");
    expect(result.stdout).toContain("projnavi integrate --skills-dir <skills-folder>");
    await expect(fs.stat(path.join(root, "AGENTS.md"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("creates a Claude Code project skill when requested", async () => {
    const root = await makeEmptyTempDir();
    const result = await runInit(root, { agent: "claude", force: false });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("created .claude/skills/projnavi/SKILL.md with projnavi Claude skill");

    const skill = await fs.readFile(path.join(root, ".claude", "skills", "projnavi", "SKILL.md"), "utf8");
    expect(skill).toContain("name: projnavi");
    expect(skill).toContain('argument-hint: "onboard | benchmark | <task>"');
    expect(skill).toContain("If `$ARGUMENTS` is `onboard`");
    expect(skill).toContain("If `$ARGUMENTS` is `benchmark`");
    expect(skill).toContain("If `$ARGUMENTS` is empty");
    expect(skill).toContain('projnavi guide "$ARGUMENTS"');
  });

  it("does not overwrite a user-created Claude skill unless force is provided", async () => {
    const root = await makeEmptyTempDir();
    const skillPath = path.join(root, ".claude", "skills", "projnavi", "SKILL.md");
    await fs.mkdir(path.dirname(skillPath), { recursive: true });
    await fs.writeFile(skillPath, "# User skill\n", "utf8");

    const skipped = await runInit(root, { agent: "claude", force: false });
    expect(skipped.stdout).toContain("skipped .claude/skills/projnavi/SKILL.md");
    await expect(fs.readFile(skillPath, "utf8")).resolves.toBe("# User skill\n");

    const overwritten = await runInit(root, { agent: "claude", force: true });
    expect(overwritten.stdout).toContain("updated .claude/skills/projnavi/SKILL.md with projnavi Claude skill");
    await expect(fs.readFile(skillPath, "utf8")).resolves.toContain("name: projnavi");
  });

  it("updates managed Claude skill idempotently", async () => {
    const root = await makeEmptyTempDir();
    const first = await runInit(root, { agent: "claude", force: false });
    expect(first.stdout).toContain("created .claude/skills/projnavi/SKILL.md with projnavi Claude skill");

    const second = await runInit(root, { agent: "claude", force: false });
    expect(second.stdout).toContain("left .claude/skills/projnavi/SKILL.md unchanged");

    const skill = await fs.readFile(path.join(root, ".claude", "skills", "projnavi", "SKILL.md"), "utf8");
    expect(skill.match(/projnavi-agent-claude:start/g)).toHaveLength(1);
  });

  it("creates a Cursor project rule when requested", async () => {
    const root = await makeEmptyTempDir();
    const result = await runInit(root, { agent: "cursor", force: false });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("created .cursor/rules/projnavi.mdc with projnavi Cursor rule");

    const rule = await fs.readFile(path.join(root, ".cursor", "rules", "projnavi.mdc"), "utf8");
    expect(rule).toContain("alwaysApply: true");
    expect(rule).toContain('projnavi guide "<task>"');
    expect(rule).toContain("Use the installed projnavi skill");
    expect(rule).toContain("projnavi onboard");
    expect(rule).not.toContain("Run projnavi onboarding");
    expect(rule).not.toContain("dry-run investigation");
  });

  it("creates OpenCode AGENTS.md guidance and project skill when requested", async () => {
    const root = await makeEmptyTempDir();
    const result = await runInit(root, { agent: "opencode", force: false });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("created AGENTS.md with projnavi OpenCode instructions");
    expect(result.stdout).toContain("created .opencode/skills/projnavi/SKILL.md with projnavi OpenCode skill");

    const agents = await fs.readFile(path.join(root, "AGENTS.md"), "utf8");
    expect(agents).toContain("projnavi-agent-doc:start");
    expect(agents).toContain("Use the installed projnavi skill");
    expect(agents).toContain('projnavi guide "<task>"');
    expect(agents).not.toContain("Run projnavi onboarding");
    expect(agents).not.toContain("read-only benchmark request");

    const skill = await fs.readFile(path.join(root, ".opencode", "skills", "projnavi", "SKILL.md"), "utf8");
    expect(skill).toContain("name: projnavi");
    expect(skill).toContain("description:");
    expect(skill).toContain("For any other project task:");
  });

  it("adds projnavi guidance to a custom agent instruction document", async () => {
    const root = await makeEmptyTempDir();
    const docPath = path.join(root, "docs", "AGENT-RULES.md");
    await fs.mkdir(path.dirname(docPath), { recursive: true });
    await fs.writeFile(docPath, "# Existing Rules\n\nKeep this line.\n", "utf8");

    const first = await runInit(root, { agentDocs: ["docs/AGENT-RULES.md"], force: false });
    expect(first.stdout).toContain("updated docs/AGENT-RULES.md with projnavi custom agent instructions");

    const afterFirst = await fs.readFile(docPath, "utf8");
    expect(afterFirst).toContain("Keep this line.");
    expect(afterFirst).toContain("projnavi-agent-doc:start");
    expect(afterFirst).toContain("Use the installed projnavi skill");
    expect(afterFirst).not.toContain("Run projnavi onboarding");
    expect(afterFirst).not.toContain("read-only benchmark request");

    const second = await runInit(root, { agentDocs: ["docs/AGENT-RULES.md"], force: false });
    expect(second.stdout).toContain("left docs/AGENT-RULES.md unchanged");
    await expect(fs.readFile(docPath, "utf8")).resolves.toBe(afterFirst);
  });

  it("adds a generic projnavi skill to a custom skills folder", async () => {
    const root = await makeEmptyTempDir();
    const result = await runInit(root, { skillsDirs: [".agents/skills"], force: false });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("created .agents/skills/projnavi/SKILL.md with projnavi custom agent skill");

    const skill = await fs.readFile(path.join(root, ".agents", "skills", "projnavi", "SKILL.md"), "utf8");
    expect(skill).toContain("name: projnavi");
    expect(skill).toContain("Use this project-local navigation layer");
  });

  it("does not overwrite a user-created generic skill unless force is provided", async () => {
    const root = await makeEmptyTempDir();
    const skillPath = path.join(root, ".agents", "skills", "projnavi", "SKILL.md");
    await fs.mkdir(path.dirname(skillPath), { recursive: true });
    await fs.writeFile(skillPath, "# User skill\n", "utf8");

    const skipped = await runInit(root, { skillsDirs: [".agents/skills"], force: false });
    expect(skipped.stdout).toContain("skipped .agents/skills/projnavi/SKILL.md");
    await expect(fs.readFile(skillPath, "utf8")).resolves.toBe("# User skill\n");

    const overwritten = await runInit(root, { skillsDirs: [".agents/skills"], force: true });
    expect(overwritten.stdout).toContain("updated .agents/skills/projnavi/SKILL.md with projnavi custom agent skill");
    await expect(fs.readFile(skillPath, "utf8")).resolves.toContain("name: projnavi");
  });

  it("updates the managed Codex AGENTS.md section without replacing existing guidance", async () => {
    const root = await makeEmptyTempDir();
    const agentsPath = path.join(root, "AGENTS.md");
    await fs.writeFile(agentsPath, "# AGENTS\n\nKeep this project-specific rule.\n", "utf8");

    const first = await runInit(root, { agent: "codex", repoDoc: true, force: false });
    expect(first.stdout).toContain("updated AGENTS.md with projnavi Codex instructions");

    const afterFirst = await fs.readFile(agentsPath, "utf8");
    expect(afterFirst).toContain("Keep this project-specific rule.");
    expect(afterFirst).toContain("<!-- projnavi-agent-codex:start -->");

    const second = await runInit(root, { agent: "codex", repoDoc: true, force: false });
    expect(second.stdout).toContain("left AGENTS.md unchanged");

    const afterSecond = await fs.readFile(agentsPath, "utf8");
    expect(afterSecond.match(/projnavi-agent-codex:start/g)).toHaveLength(1);
    expect(afterSecond).toBe(afterFirst);
  });
});

async function withEnv(name: string, value: string, callback: () => Promise<void>): Promise<void> {
  const previous = process.env[name];
  process.env[name] = value;

  try {
    await callback();
  } finally {
    if (previous === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = previous;
    }
  }
}
