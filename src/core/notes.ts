import { promises as fs } from "node:fs";
import path from "node:path";
import { normalizeRelPath, PROJNAVI_DIR, projnaviPath } from "./paths.js";

export type NoteKind = "project" | "module" | "flow";

export interface NoteDoc {
  kind: NoteKind;
  path: string;
  title: string;
  body: string;
}

export async function loadNoteDocs(root: string): Promise<NoteDoc[]> {
  const notes: NoteDoc[] = [];
  const projectPath = projnaviPath(root, "project.md");
  const project = await readNote(projectPath, ".projnavi/project.md", "project");
  if (project) {
    notes.push(project);
  }

  notes.push(...(await readNotesFromDir(root, "modules", "module")));
  notes.push(...(await readNotesFromDir(root, "flows", "flow")));

  return notes;
}

async function readNotesFromDir(root: string, directory: string, kind: NoteKind): Promise<NoteDoc[]> {
  const noteDir = projnaviPath(root, directory);

  let entries;
  try {
    entries = await fs.readdir(noteDir, { withFileTypes: true });
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }

  const notes: NoteDoc[] = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) {
      continue;
    }

    const relativePath = normalizeRelPath(path.posix.join(PROJNAVI_DIR, directory, entry.name));
    const note = await readNote(path.join(noteDir, entry.name), relativePath, kind);
    if (note) {
      notes.push(note);
    }
  }

  return notes;
}

async function readNote(absolutePath: string, relativePath: string, kind: NoteKind): Promise<NoteDoc | null> {
  try {
    const body = await fs.readFile(absolutePath, "utf8");
    return {
      kind,
      path: normalizeRelPath(relativePath),
      title: extractTitle(body),
      body
    };
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export function extractTitle(markdown: string): string {
  const titleLine = markdown.split(/\r?\n/).find((line) => line.startsWith("# "));
  return titleLine ? titleLine.replace(/^#\s+/, "").trim() : "Untitled note";
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
