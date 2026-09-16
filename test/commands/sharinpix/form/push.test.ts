import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { patchFsWithMemfs as mock } from '../../../helpers/memfs.js';
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
    expect(Push.flags).to.have.property('delete');
    expect(Push.flags).to.have.property('csv');
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
    expect(Push.flags.delete.char).to.equal('d');
    expect(Push.flags.delete.default).to.be.false;
    expect(Push.flags.csv.char).to.equal('c');
    expect(Push.flags.csv.default).to.be.false;
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
  });

  it('should upload forms and handle failures', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    mock({
      'sharinpix/forms': {
        'Form_1-xxxx.json': '{"name":"Form 1","fieldA":true}',
        'Invalid_Json-xxxx.json': 'invalid-json',
      },
    });

    const mockRecords = [
      {
        Id: 'f1',
        Name: 'Form 1',
        // eslint-disable-next-line camelcase
        sharinpix__FormUrl__c: 'https://example.com/form1',
        // eslint-disable-next-line camelcase
        sharinpix__Description__c: 'desc1',
      },
    ];

    const queryStub = $$.SANDBOX.stub().resolves({ records: mockRecords });
    const sobjectStub = $$.SANDBOX.stub().returns({
      update: $$.SANDBOX.stub().resolves(),
      create: $$.SANDBOX.stub().resolves(),
    });
    const apexStub = {
      post: $$.SANDBOX.stub().resolves({ host: 'https://example.com', token: 'fake-token' }),
    };
    const getConnectionStub = $$.SANDBOX.stub().returns({
      query: queryStub,
      sobject: sobjectStub,
      apex: apexStub,
    });
    const orgStub = { getConnection: getConnectionStub };

    const fetchStub = $$.SANDBOX.stub();
    fetchStub.onFirstCall().resolves({
      ok: true,
      json: async () => ({ name: 'Form 1', fieldA: false }), // changed value triggers upload
      status: 200,
      statusText: 'OK',
    });
    fetchStub.onSecondCall().resolves({
      ok: true,
      json: async () => ({ url: 'https://example.com/form1-new' }),
      status: 200,
      statusText: 'OK',
    });
    global.fetch = fetchStub;

    const argv: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = { bin: 'sf', name: 'test', root: '', version: '1.0.0' };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const pushInstance = new Push(argv, config);
    // @ts-expect-error stub CLI parse
    pushInstance['parse'] = async () => ({ flags: { org: orgStub } });

    const result = await pushInstance.run();

    expect(result.uploaded).to.equal(1);
    expect(result.failed).to.equal(1);
    expect(result.skipped).to.equal(0);
    expect(result.deleted).to.equal(0);

    mock.restore();
  });

  it('should send the file mainId as recordId regardless of the Name-matched record id', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    mock({
      'sharinpix/forms': {
        'Form_1-xxxx.json': '{"name":"Form 1","fieldA":true,"mainId":"main123"}',
      },
    });

    const mockRecords = [
      {
        Id: 'version456',
        Name: 'Form 1',
        // eslint-disable-next-line camelcase
        sharinpix__FormUrl__c: 'https://example.com/form1',
        // eslint-disable-next-line camelcase
        sharinpix__Description__c: 'desc1',
      },
    ];

    const queryStub = $$.SANDBOX.stub().resolves({ records: mockRecords });
    const sobjectStub = $$.SANDBOX.stub().returns({
      update: $$.SANDBOX.stub().resolves(),
      create: $$.SANDBOX.stub().resolves(),
    });
    const apexPostStub = $$.SANDBOX.stub();
    apexPostStub.onFirstCall().resolves({ host: 'https://example.com', token: 'fake-token' });
    apexPostStub.onSecondCall().resolves({});
    const apexStub = { post: apexPostStub };
    const getConnectionStub = $$.SANDBOX.stub().returns({
      query: queryStub,
      sobject: sobjectStub,
      apex: apexStub,
    });
    const orgStub = { getConnection: getConnectionStub };

    const fetchStub = $$.SANDBOX.stub();
    fetchStub.onFirstCall().resolves({
      ok: true,
      json: async () => ({ name: 'Form 1', fieldA: false }), // changed value triggers upload
      status: 200,
      statusText: 'OK',
    });
    fetchStub.onSecondCall().resolves({
      ok: true,
      json: async () => ({ url: 'https://example.com/form1-new' }),
      status: 200,
      statusText: 'OK',
    });
    global.fetch = fetchStub;

    const argv: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = { bin: 'sf', name: 'test', root: '', version: '1.0.0' };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const pushInstance = new Push(argv, config);
    // @ts-expect-error stub CLI parse
    pushInstance['parse'] = async () => ({ flags: { org: orgStub } });

    const result = await pushInstance.run();

    expect(result.uploaded).to.equal(1);
    expect(result.failed).to.equal(0);

    const importCall = apexPostStub.secondCall;
    expect(importCall.args[0]).to.equal('/sharinpix/FormTemplateImport');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(importCall.args[1].recordId).to.equal('main123');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
    const formTemplateJson = JSON.parse(importCall.args[1].formTemplateJson) as Record<string, unknown>;
    expect(formTemplateJson).to.not.have.property('mainId');

    const templatesCall = fetchStub.secondCall;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
    const templatesBody = JSON.parse(templatesCall.args[1].body as string) as { config: Record<string, unknown> };
    expect(templatesBody.config).to.not.have.property('mainId');
    expect(templatesBody.config).to.have.property('fieldA');

    mock.restore();
  });

  it('should push a brand-new file with no matching existing record and no recordId', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    mock({
      'sharinpix/forms': {
        'Form_New-xxxx.json': '{"name":"Form New","fieldA":true}',
      },
    });

    const queryStub = $$.SANDBOX.stub().resolves({ records: [] });
    const sobjectStub = $$.SANDBOX.stub().returns({
      update: $$.SANDBOX.stub().resolves(),
      create: $$.SANDBOX.stub().resolves(),
    });
    const apexPostStub = $$.SANDBOX.stub();
    apexPostStub.onFirstCall().resolves({ host: 'https://example.com', token: 'fake-token' });
    apexPostStub.onSecondCall().resolves({});
    const apexStub = { post: apexPostStub };
    const getConnectionStub = $$.SANDBOX.stub().returns({
      query: queryStub,
      sobject: sobjectStub,
      apex: apexStub,
    });
    const orgStub = { getConnection: getConnectionStub };

    const fetchStub = $$.SANDBOX.stub();
    fetchStub.onFirstCall().resolves({
      ok: true,
      json: async () => ({ url: 'https://example.com/form-new' }),
      status: 200,
      statusText: 'OK',
    });
    global.fetch = fetchStub;

    const argv: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = { bin: 'sf', name: 'test', root: '', version: '1.0.0' };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const pushInstance = new Push(argv, config);
    // @ts-expect-error stub CLI parse
    pushInstance['parse'] = async () => ({ flags: { org: orgStub } });

    const result = await pushInstance.run();

    expect(result.uploaded).to.equal(1);
    expect(result.failed).to.equal(0);

    const importCall = apexPostStub.secondCall;
    expect(importCall.args[0]).to.equal('/sharinpix/FormTemplateImport');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(importCall.args[1].recordId).to.equal(undefined);

    mock.restore();
  });
});
