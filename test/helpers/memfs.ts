import fs from 'node:fs';
import path from 'node:path';
import { vol } from 'memfs';
// @ts-expect-error fs-monkey ships no type declarations
import { patchFs as patchFsUntyped } from 'fs-monkey';

const patchFs = patchFsUntyped as (volume: unknown) => () => void;
type NestedJson = Parameters<typeof vol.fromNestedJSON>[0];

export function patchFsWithMemfs(tree: NestedJson): () => void {
  vol.reset();
  vol.fromNestedJSON(tree, process.cwd());
  const unpatch = patchFs(vol);
  return () => {
    unpatch();
    vol.reset();
  };
}

export function seedFormFiles(files: Record<string, string>): void {
  fs.mkdirSync('sharinpix/forms', { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join('sharinpix/forms', name), content);
  }
}
