import fs from 'node:fs';
import path from 'node:path';

/**
 * Resolve and validate that the given relative path is under the root directory.
 * Prevents path traversal.
 */
export function resolvePathUnderRoot(rootDir: string, relativePath: string): string | null {
  const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const resolved = path.resolve(rootDir, normalized);
  let rootReal: string;
  try {
    rootReal = fs.realpathSync(rootDir);
  } catch {
    return null;
  }
  const relative = path.relative(rootReal, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return null;
  }
  return resolved;
}

/**
 * List all .csv files under dir, optionally recursive. Returns relative paths (forward slashes).
 */
export function listCsvFiles(rootDir: string, recursive: boolean): string[] {
  const rootReal = fs.realpathSync(rootDir);
  const results: string[] = [];

  function scan(dir: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory() && recursive) {
        scan(full);
      } else if (ent.isFile() && ent.name.toLowerCase().endsWith('.csv')) {
        const relative = path.relative(rootReal, full).split(path.sep).join('/');
        results.push(relative);
      }
    }
  }

  scan(rootReal);
  return results.sort();
}
