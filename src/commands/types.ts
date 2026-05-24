export interface CommandResult {
  exitCode: number;
  stdout?: string;
  stderr?: string;
}

export function ok(stdout?: string, stderr?: string): CommandResult {
  return { exitCode: 0, ...(stdout ? { stdout } : {}), ...(stderr ? { stderr } : {}) };
}

export function fail(stderr: string, exitCode = 1): CommandResult {
  return { exitCode, stderr };
}
