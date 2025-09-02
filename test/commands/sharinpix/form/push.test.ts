import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import Push from '../../../../src/commands/sharinpix/form/push.js';

describe('sharinpix form push', () => {
  const $$ = new TestContext();

  beforeEach(() => {
    stubSfCommandUx($$.SANDBOX);
  });

  afterEach(() => {
    $$.restore();
  });

  it('should have correct command metadata', () => {
    expect(Push.summary).to.include('Push SharinPix form templates');
    expect(Push.description).to.include('Uploads SharinPix form templates');
    expect(Push.flags).to.have.property('org');
    expect(Push.flags).to.have.property('dir');
    expect(Push.flags).to.have.property('force');
  });

  it('should define the correct result type', () => {
    // This test verifies the command structure and types
    expect(Push).to.be.a('function');
    expect(Push.flags.org.required).to.be.true;
    expect(Push.flags['dir'].default).to.equal('sharinpix/forms');
    expect(Push.flags.force.default).to.be.false;
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
    expect(Push.flags['dir'].char).to.equal('d');
    expect(Push.flags.force.char).to.equal('f');
    expect(Push.flags.org.char).to.equal('o');
  });
});
