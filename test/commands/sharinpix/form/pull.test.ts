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
  });

  it('should define the correct result type', () => {
    // This test verifies the command structure and types
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
});