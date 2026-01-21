import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import mock from 'mock-fs';
import Push from '../../../../src/commands/sharinpix/config/push.js';

describe('sharinpix config push', () => {
  const $$ = new TestContext();

  beforeEach(() => {
    stubSfCommandUx($$.SANDBOX);
  });

  afterEach(() => {
    $$.restore();
    mock.restore();
  });

  it('should have correct command metadata', () => {
    expect(Push.summary).to.include('Push organization config');
    expect(Push.description).to.include('Uploads the organization configuration');
    expect(Push.flags).to.have.property('org');
  });

  it('should define the correct result type', () => {
    expect(Push).to.be.a('function');
    expect(Push.flags.org.required).to.be.true;
  });

  it('should require org flag', async () => {
    try {
      await Push.run([]);
      expect.fail('Should have thrown an error for missing org flag');
    } catch (error) {
      expect(error).to.be.instanceOf(Error);
    }
  });

  it('should have correct flag configurations', () => {
    expect(Push.flags.org.char).to.equal('o');
  });

  it('should error when config file does not exist', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    mock({
      sharinpix: {},
    });

    const apexStub = {
      post: $$.SANDBOX.stub().resolves({ host: 'https://example.com', token: 'fake-token' }),
    };
    const getConnectionStub = $$.SANDBOX.stub().returns({
      apex: apexStub,
    });
    const orgStub = { getConnection: getConnectionStub };

    const argv: string[] = [];
    const config = { bin: 'sf', name: 'test', root: '', version: '1.0.0' } as unknown;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    const pushInstance = new Push(argv, config as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $$.SANDBOX.stub(pushInstance as any, 'parse').callsFake(async () => ({ flags: { org: orgStub } }));

    try {
      await pushInstance.run();
      expect.fail('Should have thrown an error for missing config file');
    } catch (error) {
      expect(error).to.be.instanceOf(Error);
    }
  });

  it('should upload config successfully', async () => {
    const mockConfig = {
      setting1: 'value1',
      setting2: 'value2',
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    mock({
      'sharinpix/configs': {
        'config.json': JSON.stringify(mockConfig),
      },
    });

    const apexStub = {
      post: $$.SANDBOX.stub().resolves({ host: 'https://example.com', token: 'fake-token' }),
    };
    const getConnectionStub = $$.SANDBOX.stub().returns({
      apex: apexStub,
    });
    const orgStub = { getConnection: getConnectionStub };

    const fetchStub = $$.SANDBOX.stub().resolves({
      ok: true,
      json: async () => ({}),
      status: 200,
      statusText: 'OK',
    });
    global.fetch = fetchStub;

    const argv: string[] = [];
    const config = { bin: 'sf', name: 'test', root: '', version: '1.0.0' } as unknown;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    const pushInstance = new Push(argv, config as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $$.SANDBOX.stub(pushInstance as any, 'parse').callsFake(async () => ({ flags: { org: orgStub } }));

    const result = await pushInstance.run();

    expect(result.success).to.be.true;
    expect(fetchStub.callCount).to.equal(1);
    expect(fetchStub.firstCall.args[0]).to.equal('https://example.com/api/v1/organization/config');
    expect(fetchStub.firstCall.args[1]).to.have.property('method', 'PUT');
  });

  it('should handle API errors gracefully', async () => {
    const mockConfig = {
      setting1: 'value1',
      setting2: 'value2',
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    mock({
      'sharinpix/configs': {
        'config.json': JSON.stringify(mockConfig),
      },
    });

    const apexStub = {
      post: $$.SANDBOX.stub().resolves({ host: 'https://example.com', token: 'fake-token' }),
    };
    const getConnectionStub = $$.SANDBOX.stub().returns({
      apex: apexStub,
    });
    const orgStub = { getConnection: getConnectionStub };

    const fetchStub = $$.SANDBOX.stub().resolves({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });
    global.fetch = fetchStub;

    const argv: string[] = [];
    const config = { bin: 'sf', name: 'test', root: '', version: '1.0.0' } as unknown;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    const pushInstance = new Push(argv, config as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $$.SANDBOX.stub(pushInstance as any, 'parse').callsFake(async () => ({ flags: { org: orgStub } }));

    try {
      await pushInstance.run();
      expect.fail('Should have thrown an error for API failure');
    } catch (error) {
      expect(error).to.be.instanceOf(Error);
    }
  });

  it('should handle invalid JSON in config file', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    mock({
      'sharinpix/configs': {
        'config.json': 'invalid-json',
      },
    });

    const apexStub = {
      post: $$.SANDBOX.stub().resolves({ host: 'https://example.com', token: 'fake-token' }),
    };
    const getConnectionStub = $$.SANDBOX.stub().returns({
      apex: apexStub,
    });
    const orgStub = { getConnection: getConnectionStub };

    const argv: string[] = [];
    const config = { bin: 'sf', name: 'test', root: '', version: '1.0.0' } as unknown;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    const pushInstance = new Push(argv, config as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $$.SANDBOX.stub(pushInstance as any, 'parse').callsFake(async () => ({ flags: { org: orgStub } }));

    try {
      await pushInstance.run();
      expect.fail('Should have thrown an error for invalid JSON');
    } catch (error) {
      expect(error).to.be.instanceOf(Error);
    }
  });
});
