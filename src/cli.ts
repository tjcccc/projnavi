#!/usr/bin/env node
import { realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runGuide } from "./commands/guide.js";
import { runInit } from "./commands/init.js";
import { runNotes } from "./commands/notes.js";
import { runOnboard } from "./commands/onboard.js";
import { runVerify } from "./commands/verify.js";
import type { CommandResult } from "./commands/types.js";
import { fail, ok } from "./commands/types.js";

export interface CliIO {
  cwd: string;
  writeOut: (message: string) => void;
  writeErr: (message: string) => void;
}

const HELP = `projnavi

Usage:
  projnavi init [--force] [--agent codex]
  projnavi onboard
  projnavi guide "<task>" [--format json] [--strict]
  projnavi notes <topic> [--strict]
  projnavi verify [--non-strict] [--strict]

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

  try {
    switch (command) {
      case "init":
        return runInit(cwd, { force: rest.includes("--force"), ...parseInitAgent(rest) });
      case "onboard":
        return runOnboard(cwd);
      case "guide":
        return runGuide(cwd, readPositional(rest), {
          format: readFlagValue(rest, "--format") === "json" ? "json" : "text",
          strict: rest.includes("--strict")
        });
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
    return previous !== "--format";
  });

  if (positionals.length === 0) {
    throw new Error("Missing required argument.");
  }

  return positionals.join(" ");
}

function readFlagValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  return args[index + 1];
}

function parseInitAgent(args: string[]): { agent?: "codex" } {
  const agent = readFlagValue(args, "--agent");
  if (!agent) {
    return {};
  }

  if (agent !== "codex") {
    throw new Error(`Unsupported agent: ${agent}. Supported agents: codex.`);
  }

  return { agent };
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
