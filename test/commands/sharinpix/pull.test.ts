import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import Pull from '../../../src/commands/sharinpix/pull.js';
import FormPull from '../../../src/commands/sharinpix/form/pull.js';
import PermissionPull from '../../../src/commands/sharinpix/permission/pull.js';

describe('sharinpix pull', () => {
  const $$ = new TestContext();

  beforeEach(() => {
    stubSfCommandUx($$.SANDBOX);
  });

  afterEach(() => {
    $$.restore();
  });

  it('should have correct command metadata', () => {
    expect(Pull.summary).to.include('Pull all SharinPix assets');
    expect(Pull.description).to.include('Retrieves all SharinPix form templates and permissions');
    expect(Pull.flags).to.have.property('org');
  });

  it('should require org flag', async () => {
    try {
      await Pull.run([]);
      expect.fail('Should have thrown an error for missing org flag');
    } catch (error) {
      expect(error).to.be.instanceOf(Error);
    }
  });

  it('should call form and permission pull commands', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    const formRunStub = $$.SANDBOX.stub(FormPull.prototype, 'runWithFlags').resolves({
      name: 'OK',
      formsDownloaded: 1,
      formsFailed: 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    const permissionRunStub = $$.SANDBOX.stub(PermissionPull.prototype, 'runWithFlags').resolves({
      name: 'OK',
      permissionsDownloaded: 1,
      permissionsFailed: 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const argv = ['--target-org', 'test-org'];
    const config = { bin: 'sf', name: 'test', root: '', version: '1.0.0' } as unknown;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    const pullInstance = new Pull(argv, config as any);

    // Stub parse to return a mocked org flag
    const orgStub = {
      getUsername: () => 'test-org'
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $$.SANDBOX.stub(pullInstance as any, 'parse').callsFake(async () => ({ flags: { org: orgStub } }));

    const result = await pullInstance.run();

    expect(formRunStub.calledOnce).to.be.true;
    expect(permissionRunStub.calledOnce).to.be.true;
    expect(result.forms).to.deep.equal({
      name: 'OK',
      formsDownloaded: 1,
      formsFailed: 0,
    });
    expect(result.permissions).to.deep.equal({
      name: 'OK',
      permissionsDownloaded: 1,
      permissionsFailed: 0,
    });

    // Verify arguments passed to sub-commands
    expect(formRunStub.firstCall.args[0]).to.have.property('org', orgStub);
    expect(permissionRunStub.firstCall.args[0]).to.have.property('org', orgStub);
  });
});
