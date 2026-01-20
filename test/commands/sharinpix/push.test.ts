import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import Push from '../../../src/commands/sharinpix/push.js';
import FormPush from '../../../src/commands/sharinpix/form/push.js';
import PermissionPush from '../../../src/commands/sharinpix/permission/push.js';

describe('sharinpix push', () => {
  const $$ = new TestContext();

  beforeEach(() => {
    stubSfCommandUx($$.SANDBOX);
  });

  afterEach(() => {
    $$.restore();
  });

  it('should have correct command metadata', () => {
    expect(Push.summary).to.include('Push all SharinPix assets');
    expect(Push.description).to.include('Uploads all local SharinPix form templates and permissions');
    expect(Push.flags).to.have.property('org');
    expect(Push.flags).to.have.property('delete');
  });

  it('should require org flag', async () => {
    try {
      await Push.run([]);
      expect.fail('Should have thrown an error for missing org flag');
    } catch (error) {
      expect(error).to.be.instanceOf(Error);
    }
  });

  it('should call form and permission push commands', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    const formRunStub = $$.SANDBOX.stub(FormPush.prototype, 'runWithFlags').resolves({
      name: 'OK',
      uploaded: 1,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    const permissionRunStub = $$.SANDBOX.stub(PermissionPush.prototype, 'runWithFlags').resolves({
      name: 'OK',
      uploaded: 1,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const argv = ['--target-org', 'test-org'];
    const config = { bin: 'sf', name: 'test', root: '', version: '1.0.0' } as unknown;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    const pushInstance = new Push(argv, config as any);

    const orgStub = {
      getUsername: () => 'test-org',
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $$.SANDBOX.stub(pushInstance as any, 'parse').callsFake(async () => ({ flags: { org: orgStub, delete: false } }));

    const result = await pushInstance.run();

    expect(formRunStub.calledOnce).to.be.true;
    expect(permissionRunStub.calledOnce).to.be.true;
    expect(result.forms).to.deep.equal({
      name: 'OK',
      uploaded: 1,
    });
    expect(result.permissions).to.deep.equal({
      name: 'OK',
      uploaded: 1,
    });

    expect(formRunStub.firstCall.args[0]).to.have.property('org', orgStub);
    expect(permissionRunStub.firstCall.args[0]).to.have.property('org', orgStub);
  });

  it('should pass delete flag to sub-commands', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    const formRunStub = $$.SANDBOX.stub(FormPush.prototype, 'runWithFlags').resolves({ name: 'OK' } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    const permissionRunStub = $$.SANDBOX.stub(PermissionPush.prototype, 'runWithFlags').resolves({ name: 'OK' } as any);

    const argv = ['--target-org', 'test-org', '--delete'];
    const config = { bin: 'sf', name: 'test', root: '', version: '1.0.0' } as unknown;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    const pushInstance = new Push(argv, config as any);

    const orgStub = {
      getUsername: () => 'test-org',
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $$.SANDBOX.stub(pushInstance as any, 'parse').callsFake(async () => ({ flags: { org: orgStub, delete: true } }));

    await pushInstance.run();

    expect(formRunStub.firstCall.args[0]).to.have.property('delete', true);
    expect(permissionRunStub.firstCall.args[0]).to.have.property('delete', true);
  });
});
