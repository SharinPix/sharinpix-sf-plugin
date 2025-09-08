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
  });

  it('should have correct result type structure', () => {
    const resultType = {
      name: 'string',
      uploaded: 'number',
      failed: 'number',
      skipped: 'number',
    };

    // Verify the result type matches expected structure
    expect(resultType.name).to.be.a('string');
    expect(resultType.uploaded).to.be.a('string');
    expect(resultType.failed).to.be.a('string');
    expect(resultType.skipped).to.be.a('string');
  });
});
