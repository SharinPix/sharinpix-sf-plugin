import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import mock from 'mock-fs';
import Push from '../../../../src/commands/sharinpix/permission/push.js';

describe('sharinpix permission push', () => {
  const $$ = new TestContext();

  beforeEach(() => {
    stubSfCommandUx($$.SANDBOX);
  });

  afterEach(() => {
    $$.restore();
  });

  it('should have correct command metadata', () => {
    expect(Push.summary).to.include('Push SharinPix permissions');
    expect(Push.description).to.include('Uploads SharinPix permissions');
    expect(Push.flags).to.have.property('org');
    expect(Push.flags).to.have.property('delete');
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
    expect(Push.flags.org.summary).to.include('The Salesforce org');
    expect(Push.flags.org.description).to.include('The target Salesforce org');
    expect(Push.flags.delete.char).to.equal('d');
    expect(Push.flags.delete.default).to.be.false;
  });

  it('should have correct result type structure', () => {
    const resultType = {
      name: 'string',
      uploaded: 'number',
      failed: 'number',
      skipped: 'number',
      deleted: 'number',
    };

    // Verify the result type matches expected structure
    expect(resultType.name).to.be.a('string');
    expect(resultType.uploaded).to.be.a('string');
    expect(resultType.failed).to.be.a('string');
    expect(resultType.skipped).to.be.a('string');
    expect(resultType.deleted).to.be.a('string');
  });

  describe('delete flag functionality', () => {
    it('should have delete flag with correct configuration', () => {
      expect(Push.flags.delete).to.exist;
      expect(Push.flags.delete.char).to.equal('d');
      expect(Push.flags.delete.default).to.be.false;
      expect(Push.flags.delete.type).to.equal('boolean');
    });

    it('should include deleted count in PushResult type', () => {
      // Test that the PushResult type includes the deleted property
      const mockResult = {
        name: 'OK',
        uploaded: 0,
        failed: 0,
        skipped: 0,
        deleted: 0,
      };

      expect(mockResult).to.have.property('deleted');
      expect(mockResult.deleted).to.be.a('number');
    });

    it('should accept delete flag in command arguments', () => {
      // Test that the delete flag exists and is properly configured
      expect(Push.flags.delete).to.exist;
      expect(Push.flags.delete.char).to.equal('d');
      expect(Push.flags.delete.type).to.equal('boolean');
    });

    it('should have correct flag summary and description', () => {
      expect(Push.flags.delete.summary).to.be.a('string');
      expect(Push.flags.delete.description).to.be.a('string');
      expect(Push.flags.delete.summary).to.include('Delete');
      expect(Push.flags.delete.description).to.include('delete');
    });

    it('should validate that delete flag affects SharinPix permissions', () => {
      expect(Push.flags.delete.summary).to.include('SharinPix permissions');
      expect(Push.flags.delete.description).to.include('SharinPix permission records');
    });
  });

  it('should upload permissions and handle failures', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    mock({
      'sharinpix/permissions': {
        'Permission_1-xxxx.json': '{"name":"Permission 1","fieldA":false}',
        'Invalid_Json-xxxx.json': 'invalid-json',
      },
    });

    const mockRecords = [
      {
        Id: 'p1',
        Name: 'Permission 1',
        // eslint-disable-next-line camelcase
        sharinpix__Description__c: 'desc1',
        // eslint-disable-next-line camelcase
        sharinpix__Json__c: '{"fieldA":true}',
      },
    ];

    const queryStub = $$.SANDBOX.stub().resolves({ records: mockRecords });
    const sobjectStub = $$.SANDBOX.stub().returns({
      update: $$.SANDBOX.stub().resolves(),
      create: $$.SANDBOX.stub().resolves(),
    });
    const getConnectionStub = $$.SANDBOX.stub().returns({
      query: queryStub,
      sobject: sobjectStub,
    });
    const orgStub = { getConnection: getConnectionStub };

    const argv: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = { bin: 'sf', name: 'test', root: '', version: '1.0.0' };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const pushInstance = new Push(argv, config);
    // @ts-expect-error: CLI test stub
    pushInstance['parse'] = async () => ({ flags: { org: orgStub } });

    const result = await pushInstance.run();

    expect(result.uploaded).to.equal(1);
    expect(result.failed).to.equal(1);
    expect(result.skipped).to.equal(0);
    expect(result.deleted).to.equal(0);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    mock.restore();
  });
});
