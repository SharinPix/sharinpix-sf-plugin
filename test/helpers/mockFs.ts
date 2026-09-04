// @ts-expect-error fs-monkey ships no type declarations
import { patchFs } from 'fs-monkey';
import { vol } from 'memfs';

let restoreFs = (): void => {};
const patchFsTyped = patchFs as (volume: unknown) => () => void;

export function mockFs(tree: Parameters<typeof vol.fromNestedJSON>[0]): void {
  restoreFs();
  vol.reset();
  vol.fromNestedJSON(tree, process.cwd());
  restoreFs = patchFsTyped(vol);
}

mockFs.restore = (): void => {
  restoreFs();
  restoreFs = (): void => {};
  vol.reset();
};

mockFs.bypass = <T>(callback: () => T): T => {
  mockFs.restore();
  return callback();
};
