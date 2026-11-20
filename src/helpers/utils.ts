import * as crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { elementKeyOrder } from './form/elementKeys.js';

const LOCAL_ROOT = 'sharinpix';

// Refuses any path whose final target is a symbolic link or resolves outside the sharinpix/ tree.
export function assertWithinLocalRoot(targetPath: string): void {
  if (!fs.lstatSync(LOCAL_ROOT).isDirectory()) throw new Error(`"${LOCAL_ROOT}" must be a real directory`);
  if (fs.lstatSync(targetPath).isSymbolicLink())
    throw new Error(`Refusing to follow symbolic link "${path.basename(targetPath)}"`);
  const rootReal = fs.realpathSync(LOCAL_ROOT);
  const targetReal = fs.realpathSync(targetPath);
  if (targetReal !== rootReal && !targetReal.startsWith(rootReal + path.sep))
    throw new Error(`"${path.basename(targetPath)}" resolves outside "${LOCAL_ROOT}"`);
}

export function isJsonEqual(obj1: unknown, obj2: unknown): boolean {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

export function sanitizeFilename(name: string): string {
  return name.replaceAll(/[^a-zA-Z0-9]/g, '_');
}

export function createSafeFilename(name: string): string {
  const md5Hash = crypto.createHash('md5').update(name).digest('hex').slice(0, 8);
  return `${sanitizeFilename(name)}-${md5Hash}`;
}

export function readJsonFile(filePath: string): Record<string, unknown> {
  assertWithinLocalRoot(filePath);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(fileContent) as Record<string, unknown>;
  } catch {
    throw new Error(`Invalid JSON in file ${path.basename(filePath)}`);
  }
}

export function writeJsonFile(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export function getNameFromJson(json: Record<string, unknown>): string {
  return json.name as string;
}

export function ensureDirectoryExists(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function formatErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

// Lists matching entries and fails loudly on any that are not regular files, so callers
// (e.g. --delete, which compares against this list) never silently treat a file as absent.
function listLocalFiles(dirPath: string, extension: string): string[] {
  assertWithinLocalRoot(dirPath);
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.name.endsWith(extension))
    .map((entry) => {
      const entryPath = `${dirPath}/${entry.name}`;
      assertWithinLocalRoot(entryPath);
      if (!entry.isFile()) throw new Error(`"${entry.name}" is not a regular file`);
      return entryPath;
    });
}

export function getJsonFiles(dirPath: string): string[] {
  return listLocalFiles(dirPath, '.json');
}

export function getCsvFiles(dirPath: string): string[] {
  return listLocalFiles(dirPath, '.csv');
}

// Refuses an existing symbolic link (including a dangling one) at the path; a missing path is allowed.
export function assertNotSymbolicLink(targetPath: string): void {
  try {
    if (fs.lstatSync(targetPath).isSymbolicLink())
      throw new Error(`Refusing to follow symbolic link "${path.basename(targetPath)}"`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}

export function orderElementKeys(keys: string[]): string[] {
  const knownKeys = new Set(elementKeyOrder);
  const ordered = elementKeyOrder.filter((key) => keys.includes(key));
  return ordered.filter((key) => knownKeys.has(key));
}
