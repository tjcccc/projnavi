#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const jsonOutput = args.includes("--json");
const taskArgs = args.filter((arg) => arg !== "--json");
const task =
  taskArgs.join(" ") ||
  "Add compact guide output with --compact and --max-items support while keeping guide output high precision.";

const noProjnaviCommands = [
  ["git", ["status", "--short"]],
  [
    "find",
    [
      ".",
      "-maxdepth",
      "3",
      "-type",
      "f",
      "-not",
      "-path",
      "./.git/*",
      "-not",
      "-path",
      "./node_modules/*",
      "-not",
      "-path",
      "./dist/*",
      "-not",
      "-path",
      "./.projnavi/*"
    ]
  ],
  ["rg", ["-n", "guide|ranking|compact|max-items|task brief|read first|format", "src", "test", "README.md", "docs", "AGENTS.md", "TODO.md"]],
  ["sed", ["-n", "1,150p", "src/cli.ts"]],
  ["sed", ["-n", "1,120p", "src/commands/guide.ts"]],
  ["sed", ["-n", "1,220p", "src/core/guide-ranking.ts"]],
  ["sed", ["-n", "405,455p", "src/core/guide-ranking.ts"]],
  ["sed", ["-n", "1,180p", "test/guide.test.ts"]],
  ["sed", ["-n", "1,180p", "README.md"]],
  ["sed", ["-n", "1,120p", "TODO.md"]]
];

const withProjnaviCommands = [
  ["node", ["dist/cli.js", "guide", task]],
  ["sed", ["-n", "1,150p", "src/cli.ts"]],
  ["sed", ["-n", "1,120p", "src/commands/guide.ts"]],
  ["sed", ["-n", "1,220p", "src/core/guide-ranking.ts"]],
  ["sed", ["-n", "405,455p", "src/core/guide-ranking.ts"]],
  ["sed", ["-n", "1,180p", "test/guide.test.ts"]]
];

const noProjnavi = runProtocol("no-projnavi", noProjnaviCommands);
const withProjnavi = runProtocol("with-projnavi", withProjnaviCommands);

const summary = {
  task,
  generatedAt: new Date().toISOString(),
  results: [noProjnavi, withProjnavi],
  comparison: {
    byteReductionPercent: percentReduction(noProjnavi.bytes, withProjnavi.bytes),
    lineReductionPercent: percentReduction(noProjnavi.lines, withProjnavi.lines),
    approxTokenReductionPercent: percentReduction(noProjnavi.approxTokensByChars, withProjnavi.approxTokensByChars),
    commandReductionPercent: percentReduction(noProjnavi.commands, withProjnavi.commands)
  }
};

if (jsonOutput) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log(formatMarkdown(summary));
}

function runProtocol(name, commands) {
  const outputFile = path.join(mkdtempSync(path.join(tmpdir(), "projnavi-benchmark-")), `${name}.txt`);
  const startedAt = Date.now();
  const chunks = [`TASK: ${task}\n\n`];

  for (const [command, args] of commands) {
    const result = spawnSync(command, args, {
      cwd: repoRoot,
      encoding: "utf8",
      shell: false
    });

    chunks.push(`$ ${command} ${args.join(" ")}\n`);
    chunks.push(result.stdout ?? "");
    chunks.push(result.stderr ?? "");
    chunks.push("\n");

    if (result.error) {
      chunks.push(`ERROR: ${result.error.message}\n`);
    }
  }

  const wallMs = Date.now() - startedAt;
  const output = chunks.join("");
  writeFileSync(outputFile, output, "utf8");

  return {
    protocol: name,
    wallMs,
    commands: commands.length,
    bytes: Buffer.byteLength(output),
    lines: output.split(/\r?\n/).length,
    words: countWords(output),
    approxTokensByChars: Math.ceil(Buffer.byteLength(output) / 4),
    outputFile
  };
}

function countWords(value) {
  const matches = value.match(/\S+/g);
  return matches ? matches.length : 0;
}

function percentReduction(before, after) {
  if (before === 0) {
    return 0;
  }

  return Math.round(((before - after) / before) * 1000) / 10;
}

function formatMarkdown(summary) {
  const [without, withGuide] = summary.results;
  const taskLabel = summary.task.replace(/\.$/, "");

  return [
    "## projnavi Benchmark",
    "",
    `Task: ${taskLabel}.`,
    "",
    "| Mode | Commands | Output Lines | Approx Tokens | Wall Time |",
    "|---|---:|---:|---:|---:|",
    `| Without projnavi | ${without.commands} | ${formatNumber(without.lines)} | ${formatNumber(without.approxTokensByChars)} | ${without.wallMs} ms |`,
    `| With projnavi | ${withGuide.commands} | ${formatNumber(withGuide.lines)} | ${formatNumber(withGuide.approxTokensByChars)} | ${withGuide.wallMs} ms |`,
    "",
    "Result:",
    "",
    `- ${summary.comparison.approxTokenReductionPercent}% fewer approximate tokens`,
    `- ${summary.comparison.commandReductionPercent}% fewer commands`,
    `- ${summary.comparison.lineReductionPercent}% fewer output lines`,
    "",
    "Shareable summary:",
    "",
    "```text",
    `Without projnavi: ${without.commands} commands, ${formatNumber(without.approxTokensByChars)} approx tokens`,
    `With projnavi:    ${withGuide.commands} commands, ${formatNumber(withGuide.approxTokensByChars)} approx tokens`,
    "",
    `Result: ${summary.comparison.approxTokenReductionPercent}% fewer approximate tokens, ${summary.comparison.commandReductionPercent}% fewer commands.`,
    "```",
    "",
    `Audit files: ${without.outputFile}, ${withGuide.outputFile}`,
    "",
    "Approximate tokens are estimated from output bytes, not model token accounting."
  ].join("\n");
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}
