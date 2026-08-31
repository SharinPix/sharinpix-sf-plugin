import fs from 'node:fs';
import { fs as memoryFs, vol } from 'memfs';

const patchedMethods = ['existsSync', 'mkdirSync', 'promises', 'readFileSync', 'readdirSync', 'writeFileSync'] as const;

type NestedJson = Parameters<typeof vol.fromNestedJSON>[0];

export function patchFsWithMemfs(tree: NestedJson): () => void {
  vol.reset();
  vol.fromNestedJSON(tree, process.cwd());

  const originalDescriptors = patchedMethods.map((method) => ({
    descriptor: Object.getOwnPropertyDescriptor(fs, method),
    method,
  }));

  for (const { descriptor, method } of originalDescriptors) {
    Object.defineProperty(fs, method, {
      configurable: descriptor?.configurable ?? true,
      enumerable: descriptor?.enumerable ?? true,
      value: memoryFs[method],
      writable: true,
    });
  }

  return function restoreFs(): void {
    try {
      for (const { descriptor, method } of originalDescriptors) {
        if (descriptor) {
          Object.defineProperty(fs, method, descriptor);
        }
      }
    } finally {
      vol.reset();
    }
  };
}
