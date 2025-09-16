import * as crypto from 'node:crypto';

export function isJsonEqual(obj1: unknown, obj2: unknown): boolean {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

export function createSafeFilename(name: string): string {
  const md5Hash = crypto.createHash('md5').update(name).digest('hex').slice(0, 8);
  return `${name.replaceAll(/[^a-zA-Z0-9]/g, '_')}-${md5Hash}`;
}
