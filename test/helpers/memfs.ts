import fs from 'node:fs';
import path from 'node:path';
import { fs as memoryFs, vol } from 'memfs';

type NestedJson = Parameters<typeof vol.fromNestedJSON>[0];

function getPatchedMethods(): Array<keyof typeof memoryFs> {
  return (Object.keys(memoryFs) as Array<keyof typeof memoryFs>).filter((method) => {
    if (Object.getOwnPropertyDescriptor(fs, method)?.configurable === false) {
      return false;
    }
    if (method === 'promises') {
      return true;
    }
    return typeof memoryFs[method] === 'function' && /^[a-z]/u.test(String(method));
  });
}

export function patchFsWithMemfs(tree: NestedJson): () => void {
  vol.reset();
  vol.fromNestedJSON(tree, process.cwd());

  const originalDescriptors = getPatchedMethods().map((method) => ({
    descriptor: Object.getOwnPropertyDescriptor(fs, method),
    method,
  }));

  const restoreFs = (): void => {
    try {
      for (const { descriptor, method } of originalDescriptors) {
        if (descriptor) {
          Object.defineProperty(fs, method, descriptor);
        } else {
          Reflect.deleteProperty(fs, method);
        }
      }
    } finally {
      vol.reset();
    }
  };

  try {
    for (const { descriptor, method } of originalDescriptors) {
      Object.defineProperty(fs, method, {
        configurable: descriptor?.configurable ?? true,
        enumerable: descriptor?.enumerable ?? true,
        value: memoryFs[method],
        writable: descriptor?.writable ?? true,
      });
    }
  } catch (error) {
    restoreFs();
    throw error;
  }

  return restoreFs;
}

export function seedFormFiles(files: Record<string, string>): void {
  fs.mkdirSync('sharinpix/forms', { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join('sharinpix/forms', name), content);
  }
}
