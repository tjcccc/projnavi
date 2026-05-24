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

  it("creates Codex AGENTS.md instructions when requested", async () => {
    const root = await makeEmptyTempDir();
    const result = await runInit(root, { agent: "codex", force: false });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("created AGENTS.md with projnavi Codex instructions");

    const agents = await fs.readFile(path.join(root, "AGENTS.md"), "utf8");
    expect(agents).toContain("When the user says exactly or approximately");
    expect(agents).toContain("projnavi onboard");
    expect(agents).toContain("Run projnavi onboarding for this repo.");
    expect(agents).toContain('projnavi guide "<task>"');
    expect(agents).toContain("projnavi benchmark");
    expect(agents).toContain("read-only benchmark request");
  });

  it("prints an agent hint when no agent is requested", async () => {
    const root = await makeEmptyTempDir();
    const result = await runInit(root, { force: false });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("hint: to add agent instructions");
    expect(result.stdout).toContain("projnavi init --agent codex");
    expect(result.stdout).toContain("projnavi init --agent claude");
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

  it("updates the managed Codex AGENTS.md section without replacing existing guidance", async () => {
    const root = await makeEmptyTempDir();
    const agentsPath = path.join(root, "AGENTS.md");
    await fs.writeFile(agentsPath, "# AGENTS\n\nKeep this project-specific rule.\n", "utf8");

    const first = await runInit(root, { agent: "codex", force: false });
    expect(first.stdout).toContain("updated AGENTS.md with projnavi Codex instructions");

    const afterFirst = await fs.readFile(agentsPath, "utf8");
    expect(afterFirst).toContain("Keep this project-specific rule.");
    expect(afterFirst).toContain("<!-- projnavi-agent-codex:start -->");

    const second = await runInit(root, { agent: "codex", force: false });
    expect(second.stdout).toContain("left AGENTS.md unchanged");

    const afterSecond = await fs.readFile(agentsPath, "utf8");
    expect(afterSecond.match(/projnavi-agent-codex:start/g)).toHaveLength(1);
    expect(afterSecond).toBe(afterFirst);
  });
});
