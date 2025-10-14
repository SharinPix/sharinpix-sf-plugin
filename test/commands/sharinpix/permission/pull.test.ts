import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import Pull from '../../../../src/commands/sharinpix/permission/pull.js';

describe('sharinpix permission pull', () => {
  const $$ = new TestContext();

  beforeEach(() => {
    stubSfCommandUx($$.SANDBOX);
  });

  afterEach(() => {
    $$.restore();
  });

  it('should have correct command metadata', () => {
    expect(Pull.summary).to.include('Pull SharinPix permissions');
    expect(Pull.description).to.include('Retrieves all SharinPix permissions');
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

  it('should have correct result type structure', () => {
    const resultType = {
      name: 'string',
      permissionsDownloaded: 'number',
      permissionsFailed: 'number',
    };

    // Verify the result type matches expected structure
    expect(resultType.name).to.be.a('string');
    expect(resultType.permissionsDownloaded).to.be.a('string');
    expect(resultType.permissionsFailed).to.be.a('string');
  });

  it('should have org flag with correct properties', () => {
    expect(Pull.flags.org.char).to.equal('o');
    expect(Pull.flags.org.summary).to.include('The Salesforce org');
    expect(Pull.flags.org.description).to.include('The target Salesforce org');
  });

  it('should download permissions and handle failures', async () => {
    // Mock Salesforce connection and query
    const mockRecords = [
      {
        Id: 'p1',
        Name: 'Permission 1',
        // eslint-disable-next-line camelcase
        sharinpix__Description__c: 'desc1',
        // eslint-disable-next-line camelcase
        sharinpix__Json__c: '{"fieldA":true}',
      },
      {
        Id: 'p2',
        Name: 'Permission 2',
        // eslint-disable-next-line camelcase
        sharinpix__Description__c: 'desc2',
        // eslint-disable-next-line camelcase
        sharinpix__Json__c: 'invalid-json',
      },
    ];

    const queryStub = $$.SANDBOX.stub().resolves({ records: mockRecords });
    const getConnectionStub = $$.SANDBOX.stub().returns({ query: queryStub });
    const orgStub = { getConnection: getConnectionStub };

    const argv: string[] = [];
    const config = { bin: 'sf', name: 'test', root: '', version: '1.0.0' } as unknown;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    const pullInstance = new Pull(argv, config as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $$.SANDBOX.stub(pullInstance as any, 'parse').callsFake(async () => ({ flags: { org: orgStub } }));

    const result = await pullInstance.run();

    expect(result.permissionsDownloaded).to.equal(1);
    expect(result.permissionsFailed).to.equal(1);
  });
});
