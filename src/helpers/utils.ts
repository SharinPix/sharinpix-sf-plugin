import * as crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { elementKeyOrder } from './form/elementKeys.js';

const SHARINPIX_DIR = 'sharinpix';

// Splits a path under ./sharinpix into its segments, starting with 'sharinpix'.
// Throws if the path resolves outside ./sharinpix.
function getSharinpixSegments(targetPath: string): string[] {
  const rel = path.relative(SHARINPIX_DIR, path.normalize(targetPath));
  if (path.isAbsolute(rel) || rel.split(path.sep)[0] === '..') {
    throw new Error(`Refusing to write outside ${SHARINPIX_DIR}/: ${targetPath}`);
  }
  return rel === '' ? [SHARINPIX_DIR] : [SHARINPIX_DIR, ...rel.split(path.sep)];
}

// Creates each directory segment and refuses any that is a symlink or not a directory.
// lstat is used so a link is never followed, including the 'sharinpix' root itself.
function ensureSegments(segments: string[]): void {
  let current = '';
  for (const segment of segments) {
    current = current ? path.join(current, segment) : segment;
    try {
      fs.mkdirSync(current);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    }
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new Error(`Refusing to use ${current}: not a regular directory`);
    }
  }
}

/** Creates a directory under ./sharinpix, refusing symlinks at or below it. */
export function ensureSharinpixDirectory(dirPath: string): void {
  ensureSegments(getSharinpixSegments(dirPath));
}

/**
 * Writes a file under ./sharinpix. Every parent directory must be a real directory, and the
 * destination must not be a symlink. Both checks run right before the write.
 */
export function writeSharinpixFile(filePath: string, content: string): void {
  // Check and write the same normalized path, so nothing is validated under one name and written under another.
  const target = path.normalize(filePath);
  const segments = getSharinpixSegments(target);
  ensureSegments(segments.slice(0, -1));
  let existing: fs.Stats | undefined;
  try {
    existing = fs.lstatSync(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  if (existing?.isSymbolicLink()) {
    throw new Error(`Refusing to write through symlink: ${filePath}`);
  }
  fs.writeFileSync(target, content);
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
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContent) as Record<string, unknown>;
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

export function getJsonFiles(dirPath: string): string[] {
  return fs
    .readdirSync(dirPath)
    .filter((file) => file.endsWith('.json'))
    .map((file) => `${dirPath}/${file}`);
}

export function getCsvFiles(dirPath: string): string[] {
  return fs
    .readdirSync(dirPath)
    .filter((file) => file.endsWith('.csv'))
    .map((file) => `${dirPath}/${file}`);
}

export function orderElementKeys(keys: string[]): string[] {
  const knownKeys = new Set(elementKeyOrder);
  const ordered = elementKeyOrder.filter((key) => keys.includes(key));
  return ordered.filter((key) => knownKeys.has(key));
}
