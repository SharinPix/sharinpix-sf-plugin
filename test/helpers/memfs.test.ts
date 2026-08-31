import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { expect } from 'chai';
import { fs as memoryFs } from 'memfs';
import { patchFsWithMemfs } from './memfs.js';

describe('patchFsWithMemfs', () => {
  it('patches in-memory paths and fully restores node:fs', () => {
    const realFile = path.join(os.tmpdir(), `memfs-restore-${process.pid}-${Date.now()}.txt`);
    fs.writeFileSync(realFile, 'real-disk');

    const memfsOnlyKey = 'memfsOnlyRestoreProbe';
    const memoryFsRecord = memoryFs as typeof memoryFs & Record<string, unknown>;
    memoryFsRecord[memfsOnlyKey] = (): void => {};

    const probeFile = 'memfs-helper-probe/file.txt';
    let restoreFs = (): void => {};

    try {
      expect(Object.getOwnPropertyDescriptor(fs, memfsOnlyKey)).to.equal(undefined);

      restoreFs = patchFsWithMemfs({
        'memfs-helper-probe': { 'file.txt': 'in-memory' },
      });

      expect(fs.existsSync(probeFile)).to.be.true;
      expect(fs.readFileSync(probeFile, 'utf8')).to.equal('in-memory');
      expect(fs.existsSync(realFile)).to.be.false;
      expect(fs).to.have.property(memfsOnlyKey);

      restoreFs();
      restoreFs = (): void => {};

      expect(fs.existsSync(probeFile)).to.be.false;
      expect(fs.existsSync(realFile)).to.be.true;
      expect(fs.readFileSync(realFile, 'utf8')).to.equal('real-disk');
      expect(Object.hasOwn(fs, memfsOnlyKey)).to.be.false;
    } finally {
      restoreFs();
      Reflect.deleteProperty(memoryFsRecord, memfsOnlyKey);
      fs.rmSync(realFile, { force: true });
    }
  });
});
