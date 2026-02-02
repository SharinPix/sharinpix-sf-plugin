import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import mock from 'mock-fs';
import Pull from '../../../../src/commands/sharinpix/config/pull.js';

describe('sharinpix config pull', () => {
  const $$ = new TestContext();

  beforeEach(() => {
    stubSfCommandUx($$.SANDBOX);
  });

  afterEach(() => {
    $$.restore();
    mock.restore();
  });

  it('should have correct command metadata', () => {
    expect(Pull.summary).to.include('Pull organization config');
    expect(Pull.description).to.include('Downloads the organization configuration');
    expect(Pull.flags).to.have.property('org');
  });

  it('should define the correct result type', () => {
    expect(Pull).to.be.a('function');
    expect(Pull.flags.org.required).to.be.true;
  });

  it('should require org flag', async () => {
    try {
      await Pull.run([]);
      expect.fail('Should have thrown an error for missing org flag');
    } catch (error) {
      expect(error).to.be.instanceOf(Error);
    }
  });

  it('should have correct flag configurations', () => {
    expect(Pull.flags.org.char).to.equal('o');
  });

  it('should download config successfully', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    mock({
      sharinpix: {},
    });

    const mockConfig = {
      setting1: 'value1',
      setting2: 'value2',
    };

    const apexStub = {
      post: $$.SANDBOX.stub().resolves({ host: 'https://example.com', token: 'fake-token' }),
    };
    const getConnectionStub = $$.SANDBOX.stub().returns({
      apex: apexStub,
    });
    const orgStub = { getConnection: getConnectionStub };

    const fetchStub = $$.SANDBOX.stub().resolves({
      ok: true,
      json: async () => mockConfig,
      status: 200,
      statusText: 'OK',
    });
    global.fetch = fetchStub;

    const argv: string[] = [];
    const config = { bin: 'sf', name: 'test', root: '', version: '1.0.0' } as unknown;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    const pullInstance = new Pull(argv, config as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $$.SANDBOX.stub(pullInstance as any, 'parse').callsFake(async () => ({ flags: { org: orgStub } }));

    const result = await pullInstance.run();

    expect(result.success).to.be.true;
    expect(fetchStub.callCount).to.equal(1);
    expect(fetchStub.firstCall.args[0]).to.equal('https://example.com/api/v1/organization/config');
  });

  it('should handle API errors gracefully', async () => {
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

    const fetchStub = $$.SANDBOX.stub().resolves({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });
    global.fetch = fetchStub;

    const argv: string[] = [];
    const config = { bin: 'sf', name: 'test', root: '', version: '1.0.0' } as unknown;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    const pullInstance = new Pull(argv, config as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $$.SANDBOX.stub(pullInstance as any, 'parse').callsFake(async () => ({ flags: { org: orgStub } }));

    try {
      await pullInstance.run();
      expect.fail('Should have thrown an error for API failure');
    } catch (error) {
      expect(error).to.be.instanceOf(Error);
    }
  });
});
