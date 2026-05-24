import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

export async function makeTempRepo(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "projnavi-test-"));
  await fs.cp(path.resolve("test/fixtures/fake-repo"), root, { recursive: true });
  return root;
}

export async function makeEmptyTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "projnavi-empty-"));
}
