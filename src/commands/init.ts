import { promises as fs } from "node:fs";
import path from "node:path";
import { PROJNAVI_VERSION, writeManifest } from "../core/manifest.js";
import { projnaviPath } from "../core/paths.js";
import {
  CLAUDE_PROJECT_SKILL,
  CLAUDE_SKILL_SECTION_END,
  CLAUDE_SKILL_SECTION_START,
  CODEX_AGENTS_SECTION,
  CODEX_AGENTS_SECTION_END,
  CODEX_AGENTS_SECTION_START,
  createInitialManifest,
  EMPTY_GLOSSARY,
  FLOW_EXAMPLE_TEMPLATE,
  MODULE_EXAMPLE_TEMPLATE,
  PROJECT_TEMPLATE
} from "../core/templates.js";
import type { CommandResult } from "./types.js";
import { ok } from "./types.js";

export type AgentKind = "codex" | "claude";

export interface InitOptions {
  agent?: AgentKind;
  force: boolean;
}

interface TemplateFile {
  relativePath: string;
  content: string;
}

export async function runInit(root: string, options: InitOptions): Promise<CommandResult> {
  await fs.mkdir(projnaviPath(root, "modules"), { recursive: true });
  await fs.mkdir(projnaviPath(root, "flows"), { recursive: true });

  const templateFiles: TemplateFile[] = [
    { relativePath: "project.md", content: PROJECT_TEMPLATE },
    { relativePath: "modules/example.md", content: MODULE_EXAMPLE_TEMPLATE },
    { relativePath: "flows/example.md", content: FLOW_EXAMPLE_TEMPLATE },
    { relativePath: "glossary.json", content: `${JSON.stringify(EMPTY_GLOSSARY, null, 2)}\n` },
    { relativePath: "claims.jsonl", content: "" }
  ];

  const lines: string[] = [];
  for (const file of templateFiles) {
    const absolutePath = projnaviPath(root, ...file.relativePath.split("/"));
    const existed = await exists(absolutePath);

    if (existed && !options.force) {
      lines.push(`skipped ${path.posix.join(".projnavi", file.relativePath)}`);
      continue;
    }

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, file.content, "utf8");
    lines.push(`${existed ? "overwrote" : "created"} ${path.posix.join(".projnavi", file.relativePath)}`);
  }

  const manifestPath = projnaviPath(root, "manifest.json");
  const manifestExisted = await exists(manifestPath);
  if (manifestExisted && !options.force) {
    lines.push("skipped .projnavi/manifest.json");
  } else {
    await writeManifest(root, createInitialManifest(PROJNAVI_VERSION));
    lines.push(`${manifestExisted ? "overwrote" : "created"} .projnavi/manifest.json`);
  }

  if (options.agent === "codex") {
    lines.push(await ensureCodexAgentsInstructions(root));
  } else if (options.agent === "claude") {
    lines.push(await ensureClaudeProjectSkill(root, options.force));
  } else {
    lines.push("hint: to add agent instructions, run `projnavi init --agent codex` or `projnavi init --agent claude`");
  }

  return ok(lines.join("\n"));
}

async function ensureCodexAgentsInstructions(root: string): Promise<string> {
  const agentsPath = path.join(root, "AGENTS.md");
  const existing = await readOptionalFile(agentsPath);
  const nextContent = applyManagedSection(existing);

  await fs.writeFile(agentsPath, nextContent, "utf8");

  if (existing === null) {
    return "created AGENTS.md with projnavi Codex instructions";
  }

  if (existing === nextContent) {
    return "left AGENTS.md unchanged";
  }

  return "updated AGENTS.md with projnavi Codex instructions";
}

async function ensureClaudeProjectSkill(root: string, force: boolean): Promise<string> {
  const skillPath = path.join(root, ".claude", "skills", "projnavi", "SKILL.md");
  const existing = await readOptionalFile(skillPath);

  if (existing !== null && existing === CLAUDE_PROJECT_SKILL) {
    return "left .claude/skills/projnavi/SKILL.md unchanged";
  }

  if (existing !== null && !force && !isManagedClaudeSkill(existing)) {
    return "skipped .claude/skills/projnavi/SKILL.md";
  }

  await fs.mkdir(path.dirname(skillPath), { recursive: true });
  await fs.writeFile(skillPath, CLAUDE_PROJECT_SKILL, "utf8");

  if (existing === null) {
    return "created .claude/skills/projnavi/SKILL.md with projnavi Claude skill";
  }

  return "updated .claude/skills/projnavi/SKILL.md with projnavi Claude skill";
}

function isManagedClaudeSkill(existing: string): boolean {
  return existing.includes(CLAUDE_SKILL_SECTION_START) && existing.includes(CLAUDE_SKILL_SECTION_END);
}

function applyManagedSection(existing: string | null): string {
  if (existing === null) {
    return `# AGENTS

Project guidance for coding agents.

${CODEX_AGENTS_SECTION}
`;
  }

  const start = existing.indexOf(CODEX_AGENTS_SECTION_START);
  const end = existing.indexOf(CODEX_AGENTS_SECTION_END);

  if (start !== -1 && end !== -1 && end > start) {
    const before = existing.slice(0, start).trimEnd();
    const after = existing.slice(end + CODEX_AGENTS_SECTION_END.length).trimStart();
    return joinSections(before, CODEX_AGENTS_SECTION, after);
  }

  return joinSections(existing.trimEnd(), CODEX_AGENTS_SECTION, "");
}

function joinSections(before: string, managed: string, after: string): string {
  return [before, managed, after].filter((section) => section.length > 0).join("\n\n").concat("\n");
}

async function readOptionalFile(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.stat(filePath);
    return true;
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
