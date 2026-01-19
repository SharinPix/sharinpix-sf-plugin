import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import Pull from '../../../../src/commands/sharinpix/form/pull.js';

describe('sharinpix form pull', () => {
  const $$ = new TestContext();

  beforeEach(() => {
    stubSfCommandUx($$.SANDBOX);
  });

  afterEach(() => {
    $$.restore();
  });

  it('should have correct command metadata', () => {
    expect(Pull.summary).to.include('Pull SharinPix form templates');
    expect(Pull.description).to.include('Retrieves all SharinPix form templates');
    expect(Pull.flags).to.have.property('org');
    expect(Pull.flags).to.have.property('csv');
  });

  it('should define the correct result type', () => {
    expect(Pull).to.be.a('function');
    expect(Pull.flags.org.required).to.be.true;
    expect(Pull.flags.csv.type).to.equal('boolean');
  });

  it('should require org flag', async () => {
    try {
      await Pull.run([]);
      expect.fail('Should have thrown an error for missing org flag');
    } catch (error) {
      expect(error).to.be.instanceOf(Error);
    }
  });

  it('should download forms and handle failures', async () => {
    const mockRecords = [
      {
        Id: 'a1',
        Name: 'Form 1',
        // eslint-disable-next-line camelcase
        sharinpix__FormUrl__c: 'https://example.com/form1',
        // eslint-disable-next-line camelcase
        sharinpix__Description__c: 'desc1',
      },
      {
        Id: 'a2',
        Name: 'Form 2',
        // eslint-disable-next-line camelcase
        sharinpix__FormUrl__c: 'https://example.com/form2',
        // eslint-disable-next-line camelcase
        sharinpix__Description__c: 'desc2',
      },
    ];

    const queryStub = $$.SANDBOX.stub().resolves({ records: mockRecords });
    const getConnectionStub = $$.SANDBOX.stub().returns({ query: queryStub });
    const orgStub = { getConnection: getConnectionStub };

    const argv: string[] = [];
    const config = { bin: 'sf', name: 'test', root: '', version: '1.0.0' } as unknown; // Minimal config stub
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    const pullInstance = new Pull(argv, config as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $$.SANDBOX.stub(pullInstance as any, 'parse').callsFake(async () => ({ flags: { org: orgStub } }));

    const fetchStub = $$.SANDBOX.stub();
    fetchStub.onCall(0).resolves({
      ok: true,
      json: async () => ({ name: 'Form 1', data: 'test' }),
      status: 200,
      statusText: 'OK',
    });
    fetchStub.onCall(1).resolves({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });
    global.fetch = fetchStub;

    const result = await pullInstance.run();

    expect(result.formsDownloaded).to.equal(1);
    expect(result.formsFailed).to.equal(1);
  });
});
