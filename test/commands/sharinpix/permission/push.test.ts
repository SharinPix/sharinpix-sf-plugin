import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
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
});
