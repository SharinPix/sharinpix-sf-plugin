import { TestContext } from '@salesforce/core/testSetup';
import { Org } from '@salesforce/core';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import Settings from '../../../src/commands/sharinpix/settings.js';

describe('sharinpix settings', () => {
  const $$ = new TestContext();

  beforeEach(() => {
    stubSfCommandUx($$.SANDBOX);
  });

  afterEach(() => {
    $$.restore();
  });

  it('should have correct command metadata', () => {
    expect(Settings.summary).to.include('Open the SharinPix settings page');
    expect(Settings.description).to.include('Opens the SharinPix settings Lightning page');
    expect(Settings.flags).to.have.property('org');
    expect(Settings.flags.org.required).to.equal(true);
    expect(Settings.flags.org.char).to.equal('o');
  });

  it('should require org flag', async () => {
    try {
      await Settings.run([]);
      expect.fail('Should have thrown an error for missing org flag');
    } catch (error) {
      expect(error).to.be.instanceOf(Error);
      expect((error as Error).message).to.match(/missing required flag|no default environment found/i);
    }
  });

  it('should call org open with the SharinPix settings path', async () => {
    const argv = ['-o', 'test-org'];
    const runCommandStub = $$.SANDBOX.stub().resolves('https://example.com');
    const config = { bin: 'sf', name: 'test', root: '', version: '1.0.0', runCommand: runCommandStub } as unknown;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    const settingsInstance = new Settings(argv, config as any);

    const orgStub = {
      getUsername: () => 'test-org',
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $$.SANDBOX.stub(settingsInstance as any, 'parse').callsFake(async () => ({ flags: { org: orgStub } }));

    await settingsInstance.run();

    expect(runCommandStub.calledOnce).to.be.true;
    expect(runCommandStub.firstCall.args[0]).to.equal('org:open');
    expect(runCommandStub.firstCall.args[1]).to.deep.equal([
      '--target-org',
      'test-org',
      '--path',
      '/lightning/n/sharinpix__SharinPix_setting',
    ]);
  });

  it('should parse -o and run without stubbing parse()', async () => {
    const argv = ['-o', 'test-org'];
    const runCommandStub = $$.SANDBOX.stub().resolves('https://example.com');
    const config = {
      bin: 'sf',
      name: 'test',
      root: '',
      version: '1.0.0',
      runCommand: runCommandStub,
      // oclif command parsing expects hooks to exist on config
      runHook: async () => ({ successes: [], failures: [] }),
    } as unknown;

    $$.SANDBOX.stub(Org, 'create').callsFake(async (options: unknown) => {
      const aliasOrUsername =
        typeof options === 'object' && options
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
            ((options as any).aliasOrUsername as string | undefined)
          : undefined;

      return {
        getUsername: () => aliasOrUsername ?? 'test-org',
      } as unknown as Org;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    const settingsInstance = new Settings(argv, config as any);
    await settingsInstance.run();

    expect(runCommandStub.calledOnce).to.be.true;
    expect(runCommandStub.firstCall.args[0]).to.equal('org:open');
    expect(runCommandStub.firstCall.args[1]).to.deep.equal([
      '--target-org',
      'test-org',
      '--path',
      '/lightning/n/sharinpix__SharinPix_setting',
    ]);
  });
});
