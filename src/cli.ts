#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runGuide } from "./commands/guide.js";
import { type AgentKind, runInit, runIntegrate } from "./commands/init.js";
import { runNotes } from "./commands/notes.js";
import { runOnboard } from "./commands/onboard.js";
import { runVerify } from "./commands/verify.js";
import type { CommandResult } from "./commands/types.js";
import { fail, ok } from "./commands/types.js";

const require = createRequire(import.meta.url);
const VERSION = (require("../package.json") as { version: string }).version;

export interface CliIO {
  cwd: string;
  writeOut: (message: string) => void;
  writeErr: (message: string) => void;
}

const HELP = `projnavi

Usage:
  projnavi --version | -v
  projnavi init [--force] [--agent codex|claude|cursor|opencode] [--repo-doc] [--agent-doc <path>] [--skills-dir <skills-folder>]
  projnavi integrate [--force] [--agent codex|claude|cursor|opencode] [--repo-doc] [--agent-doc <path>] [--skills-dir <skills-folder>]
  projnavi onboard
  projnavi guide "<task>" [--format json] [--strict] [--max-items <n>]
  projnavi notes <topic> [--strict]
  projnavi verify [--non-strict] [--strict]

Integration notes:
  --agent codex installs the global Codex skill and adds repo AGENTS.md policy guidance.
  --agent codex --repo-doc updates only repo AGENTS.md policy guidance.
  --agent-doc <path> adds managed projnavi policy guidance to a custom agent instruction file.
  --skills-dir <skills-folder> creates <skills-folder>/projnavi/SKILL.md.

projnavi is local and deterministic. It reads .projnavi files and produces navigation advice, not ground truth.`;

export async function runCli(argv = process.argv.slice(2), partialIO: Partial<CliIO> = {}): Promise<number> {
  const io: CliIO = {
    cwd: partialIO.cwd ?? process.cwd(),
    writeOut: partialIO.writeOut ?? ((message) => process.stdout.write(message)),
    writeErr: partialIO.writeErr ?? ((message) => process.stderr.write(message))
  };

  const result = await dispatch(argv, io.cwd);
  if (result.stdout) {
    io.writeOut(ensureTrailingNewline(result.stdout));
  }

  if (result.stderr) {
    io.writeErr(ensureTrailingNewline(result.stderr));
  }

  return result.exitCode;
}

async function dispatch(argv: string[], cwd: string): Promise<CommandResult> {
  const [command, ...rest] = argv;

  if (!command || command === "--help" || command === "-h" || command === "help") {
    return ok(HELP);
  }

  if (command === "--version" || command === "-v" || command === "version") {
    return ok(VERSION);
  }

  try {
    switch (command) {
      case "init":
        return runInit(cwd, parseInitOptions(rest));
      case "integrate":
        return runIntegrate(cwd, parseInitOptions(rest));
      case "onboard":
        return runOnboard(cwd);
      case "guide": {
        const maxItems = parseMaxItems(rest);
        return runGuide(cwd, readPositional(rest), {
          format: readFlagValue(rest, "--format") === "json" ? "json" : "text",
          strict: rest.includes("--strict"),
          ...(maxItems !== undefined ? { maxItems } : {})
        });
      }
      case "notes":
        return runNotes(cwd, readPositional(rest), { strict: rest.includes("--strict") });
      case "verify":
        return runVerify(cwd, { nonStrict: rest.includes("--non-strict"), strict: rest.includes("--strict") });
      default:
        return fail(`Unknown command: ${command}\n\n${HELP}`, 2);
    }
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}

function readPositional(args: string[]): string {
  const positionals = args.filter((arg, index) => {
    if (arg.startsWith("--")) {
      return false;
    }

    const previous = args[index - 1];
    return previous !== "--format" && previous !== "--max-items";
  });

  if (positionals.length === 0) {
    throw new Error("Missing required argument.");
  }

  return positionals.join(" ");
}

function parseMaxItems(args: string[]): number | undefined {
  const index = args.indexOf("--max-items");
  if (index === -1) {
    return undefined;
  }

  const value = args[index + 1];
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 50) {
    throw new Error("--max-items must be an integer between 1 and 50.");
  }

  return parsed;
}

function readFlagValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  return args[index + 1];
}

function parseInitOptions(args: string[]): {
  force: boolean;
  agent?: AgentKind;
  repoDoc?: boolean;
  agentDocs?: string[];
  skillsDirs?: string[];
} {
  const agentOption = parseInitAgent(args);
  const agentDocs = readFlagValues(args, "--agent-doc");
  const skillsDirs = readFlagValues(args, "--skills-dir");

  return {
    force: args.includes("--force"),
    ...agentOption,
    ...(args.includes("--repo-doc") ? { repoDoc: true } : {}),
    ...(agentDocs.length > 0 ? { agentDocs } : {}),
    ...(skillsDirs.length > 0 ? { skillsDirs } : {})
  };
}

function parseInitAgent(args: string[]): { agent?: AgentKind } {
  const agent = readFlagValue(args, "--agent");
  if (!agent) {
    return {};
  }

  if (agent !== "codex" && agent !== "claude" && agent !== "cursor" && agent !== "opencode") {
    throw new Error(
      `Unsupported agent: ${agent}. Supported agents: codex, claude, cursor, opencode. For other tools, use --agent-doc or --skills-dir.`
    );
  }

  return { agent };
}

function readFlagValues(args: string[], flag: string): string[] {
  const values: string[] = [];

  for (const [index, arg] of args.entries()) {
    if (arg !== flag) {
      continue;
    }

    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`${flag} requires a value.`);
    }

    values.push(value);
  }

  return values;
}

function ensureTrailingNewline(value: string): string {
  return value.endsWith("\n") ? value : `${value}\n`;
}

const currentFile = realpathSync(fileURLToPath(import.meta.url));
const invokedFile = process.argv[1] ? realpathOrResolved(process.argv[1]) : "";

if (currentFile === invokedFile) {
  runCli().then((exitCode) => {
    process.exitCode = exitCode;
  });
}

export function realpathOrResolved(filePath: string): string {
  try {
    return realpathSync(filePath);
  } catch {
    return path.resolve(filePath);
  }
}
