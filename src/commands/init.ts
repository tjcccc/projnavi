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
  CURSOR_PROJECT_RULE,
  EMPTY_GLOSSARY,
  FLOW_EXAMPLE_TEMPLATE,
  GENERIC_AGENT_DOC_SECTION,
  GENERIC_AGENT_DOC_SECTION_END,
  GENERIC_AGENT_DOC_SECTION_START,
  GENERIC_PROJECT_SKILL,
  MODULE_EXAMPLE_TEMPLATE,
  PROJECT_TEMPLATE
} from "../core/templates.js";
import type { CommandResult } from "./types.js";
import { ok } from "./types.js";

export type AgentKind = "codex" | "claude" | "cursor" | "opencode";

export interface InitOptions {
  agent?: AgentKind;
  repoDoc?: boolean;
  agentDocs?: string[];
  skillsDirs?: string[];
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

  if (hasIntegrationTargets(options)) {
    lines.push(await runIntegrateInternal(root, options));
  } else {
    lines.push(
      "hint: to add agent integration, run `projnavi integrate --agent codex`, `projnavi integrate --agent claude`, `projnavi integrate --agent cursor`, `projnavi integrate --agent opencode`, `projnavi integrate --agent-doc <path>`, or `projnavi integrate --skills-dir <skills-folder>`"
    );
  }

  return ok(lines.join("\n"));
}

export async function runIntegrate(root: string, options: InitOptions): Promise<CommandResult> {
  if (!hasIntegrationTargets(options)) {
    return ok(
      "hint: choose an integration target with `--agent codex|claude|cursor|opencode`, `--agent-doc <path>`, or `--skills-dir <skills-folder>`"
    );
  }

  return ok(await runIntegrateInternal(root, options));
}

async function runIntegrateInternal(root: string, options: InitOptions): Promise<string> {
  const lines: string[] = [];

  if (options.agent === "codex") {
    if (options.repoDoc) {
      lines.push(await ensureCodexAgentsInstructions(root));
    } else {
      lines.push(await ensureCodexGlobalSkill(root, options.force));
      lines.push(await ensureCodexAgentsInstructions(root));
    }
  } else if (options.agent === "claude") {
    lines.push(await ensureClaudeProjectSkill(root, options.force));
  } else if (options.agent === "cursor") {
    lines.push(await ensureCursorProjectRule(root, options.force));
  } else if (options.agent === "opencode") {
    lines.push(await ensureGenericAgentDoc(root, "AGENTS.md", "OpenCode"));
    lines.push(await ensureGenericProjectSkill(root, ".opencode/skills", "OpenCode", options.force));
  }

  for (const docPath of options.agentDocs ?? []) {
    lines.push(await ensureGenericAgentDoc(root, docPath, "custom agent"));
  }

  for (const skillsFolder of options.skillsDirs ?? []) {
    lines.push(await ensureGenericProjectSkill(root, skillsFolder, "custom agent", options.force));
  }

  return lines.join("\n");
}

function hasIntegrationTargets(options: InitOptions): boolean {
  return Boolean(options.agent || options.agentDocs?.length || options.skillsDirs?.length);
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

async function ensureCodexGlobalSkill(root: string, force: boolean): Promise<string> {
  return ensureGenericProjectSkill(root, getCodexSkillsDir(), "Codex", force);
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

async function ensureCursorProjectRule(root: string, force: boolean): Promise<string> {
  const rulePath = path.join(root, ".cursor", "rules", "projnavi.mdc");
  const existing = await readOptionalFile(rulePath);

  if (existing !== null && existing === CURSOR_PROJECT_RULE) {
    return "left .cursor/rules/projnavi.mdc unchanged";
  }

  if (existing !== null && !force) {
    return "skipped .cursor/rules/projnavi.mdc";
  }

  await fs.mkdir(path.dirname(rulePath), { recursive: true });
  await fs.writeFile(rulePath, CURSOR_PROJECT_RULE, "utf8");

  if (existing === null) {
    return "created .cursor/rules/projnavi.mdc with projnavi Cursor rule";
  }

  return "updated .cursor/rules/projnavi.mdc with projnavi Cursor rule";
}

async function ensureGenericAgentDoc(root: string, docPath: string, label: string): Promise<string> {
  const absolutePath = resolveUserPath(root, docPath);
  const displayPath = displayPathFor(root, absolutePath);
  const existing = await readOptionalFile(absolutePath);
  const nextContent = applyGenericManagedSection(existing);

  if (existing === nextContent || (existing !== null && hasCodexManagedSection(existing))) {
    return `left ${displayPath} unchanged`;
  }

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, nextContent, "utf8");

  if (existing === null) {
    return `created ${displayPath} with projnavi ${label} instructions`;
  }

  return `updated ${displayPath} with projnavi ${label} instructions`;
}

async function ensureGenericProjectSkill(
  root: string,
  skillsFolder: string,
  label: string,
  force: boolean
): Promise<string> {
  const skillPath = path.join(resolveUserPath(root, skillsFolder), "projnavi", "SKILL.md");
  const displayPath = displayPathFor(root, skillPath);
  const existing = await readOptionalFile(skillPath);

  if (existing !== null && existing === GENERIC_PROJECT_SKILL) {
    return `left ${displayPath} unchanged`;
  }

  if (existing !== null && !force) {
    return `skipped ${displayPath}`;
  }

  await fs.mkdir(path.dirname(skillPath), { recursive: true });
  await fs.writeFile(skillPath, GENERIC_PROJECT_SKILL, "utf8");

  if (existing === null) {
    return `created ${displayPath} with projnavi ${label} skill`;
  }

  return `updated ${displayPath} with projnavi ${label} skill`;
}

function isManagedClaudeSkill(existing: string): boolean {
  return existing.includes(CLAUDE_SKILL_SECTION_START) && existing.includes(CLAUDE_SKILL_SECTION_END);
}

function hasCodexManagedSection(existing: string): boolean {
  return existing.includes(CODEX_AGENTS_SECTION_START) && existing.includes(CODEX_AGENTS_SECTION_END);
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

function applyGenericManagedSection(existing: string | null): string {
  if (existing === null) {
    return `# Agent Instructions

${GENERIC_AGENT_DOC_SECTION}
`;
  }

  const start = existing.indexOf(GENERIC_AGENT_DOC_SECTION_START);
  const end = existing.indexOf(GENERIC_AGENT_DOC_SECTION_END);

  if (start !== -1 && end !== -1 && end > start) {
    const before = existing.slice(0, start).trimEnd();
    const after = existing.slice(end + GENERIC_AGENT_DOC_SECTION_END.length).trimStart();
    return joinSections(before, GENERIC_AGENT_DOC_SECTION, after);
  }

  return joinSections(existing.trimEnd(), GENERIC_AGENT_DOC_SECTION, "");
}

function joinSections(before: string, managed: string, after: string): string {
  return [before, managed, after].filter((section) => section.length > 0).join("\n\n").concat("\n");
}

function resolveUserPath(root: string, userPath: string): string {
  if (userPath === "~") {
    return process.env.HOME ?? userPath;
  }

  if (userPath.startsWith("~/")) {
    const home = process.env.HOME;
    return home ? path.join(home, userPath.slice(2)) : path.resolve(root, userPath);
  }

  return path.isAbsolute(userPath) ? userPath : path.join(root, userPath);
}

function getCodexSkillsDir(): string {
  const codexHome = process.env.CODEX_HOME;
  if (codexHome && codexHome.trim().length > 0) {
    return path.join(codexHome, "skills");
  }

  return "~/.codex/skills";
}

function displayPathFor(root: string, absolutePath: string): string {
  const relativePath = path.relative(root, absolutePath);
  if (!relativePath.startsWith("..") && !path.isAbsolute(relativePath)) {
    return toPosixPath(relativePath);
  }

  return absolutePath;
}

function toPosixPath(value: string): string {
  return value.split(path.sep).join(path.posix.sep);
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
