import * as crypto from 'node:crypto';
import fs from 'node:fs';
import { ELEMENT_KEY_ORDER } from './form/elementKeyOrder.js';

export function isJsonEqual(obj1: unknown, obj2: unknown): boolean {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

export function createSafeFilename(name: string): string {
  const md5Hash = crypto.createHash('md5').update(name).digest('hex').slice(0, 8);
  return `${name.replaceAll(/[^a-zA-Z0-9]/g, '_')}-${md5Hash}`;
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
  const keySet = new Set(keys);
  const ordered: string[] = [];
  const unknownKeys: string[] = [];

  for (const key of ELEMENT_KEY_ORDER) {
    if (keySet.has(key)) {
      ordered.push(key);
      keySet.delete(key);
    }
  }

  for (const key of keys) {
    if (keySet.has(key)) {
      unknownKeys.push(key);
    }
  }

  unknownKeys.sort();

  return [...ordered, ...unknownKeys];
}
