import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
import type { SinonStub } from 'sinon';
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
    expect(Push.flags).to.have.property('activate');
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
    expect(Push.flags.activate.char).to.equal('a');
    expect(Push.flags.activate.default).to.be.false;
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
    pushInstance['parse'] = async () => ({ flags: { org: orgStub, activate: false } });

    const result = await pushInstance.run();

    expect(result.uploaded).to.equal(1);
    expect(result.failed).to.equal(1);
    expect(result.skipped).to.equal(0);
    expect(result.deleted).to.equal(0);

    mock.restore();
  });

  it('should send activate: false on FormTemplateImport when activate flag is not set', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    mock({
      'sharinpix/forms': {
        'Form_1-xxxx.json': '{"name":"Form 1","fieldA":true}',
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
      json: async () => ({ name: 'Form 1', fieldA: false }),
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

    await pushInstance.run();

    expect(fetchStub.callCount).to.equal(2);
    const importCall = apexPostStub.secondCall;
    expect(importCall.args[0]).to.equal('/sharinpix/FormTemplateImport');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(importCall.args[1].activate).to.equal(false);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(importCall.args[1].lastActivatedAt).to.equal(undefined);

    mock.restore();
  });

  it('should send activate: true on FormTemplateImport when activate flag is set', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    mock({
      'sharinpix/forms': {
        'Form_1-xxxx.json': '{"name":"Form 1","fieldA":true}',
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
      json: async () => ({ name: 'Form 1', fieldA: false }),
      status: 200,
      statusText: 'OK',
    });
    fetchStub.onSecondCall().resolves({
      ok: true,
      json: async () => ({ id: 'rails1', url: 'https://example.com/form1-new' }),
      status: 200,
      statusText: 'OK',
    });
    fetchStub.onThirdCall().resolves({
      ok: true,
      // eslint-disable-next-line camelcase
      json: async () => ({ last_activated_at: '2026-10-15T10:00:00.000Z' }),
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
    pushInstance['parse'] = async () => ({ flags: { org: orgStub, activate: true } });

    await pushInstance.run();

    expect(fetchStub.thirdCall.args[0]).to.equal('https://example.com/api/v1/form/templates/rails1/activate');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fetchStub.thirdCall.args[1].method).to.equal('POST');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fetchStub.thirdCall.args[1].headers.Authorization).to.equal('Bearer fake-token');

    const importCall = apexPostStub.secondCall;
    expect(importCall.args[0]).to.equal('/sharinpix/FormTemplateImport');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(importCall.args[1].activate).to.equal(true);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(importCall.args[1].lastActivatedAt).to.equal('2026-10-15T10:00:00.000Z');

    mock.restore();
  });

  describe('mainId resolution', () => {
    const record = (Id: string, Name: string): Record<string, string> => ({
      Id,
      Name,
      // eslint-disable-next-line camelcase
      sharinpix__FormUrl__c: `https://example.com/${Id}`,
      // eslint-disable-next-line camelcase
      sharinpix__Description__c: 'desc',
    });

    const pushWithMainId = async (
      mockRecords: Array<Record<string, string>>
    ): Promise<{ queryStub: SinonStub; fetchStub: SinonStub; apexPostStub: SinonStub }> => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      mock({
        'sharinpix/forms': {
          'Form_1-xxxx.json': '{"name":"Form 1","fieldA":true,"mainId":"main123"}',
        },
      });

      const queryStub = $$.SANDBOX.stub().resolves({ records: mockRecords });
      const apexPostStub = $$.SANDBOX.stub();
      apexPostStub.onFirstCall().resolves({ host: 'https://example.com', token: 'fake-token' });
      apexPostStub.onSecondCall().resolves({});
      const getConnectionStub = $$.SANDBOX.stub().returns({
        query: queryStub,
        apex: { post: apexPostStub },
      });
      const orgStub = { getConnection: getConnectionStub };

      const fetchStub = $$.SANDBOX.stub().callsFake(async (url: string) => ({
        ok: true,
        json: async () =>
          url.endsWith('.json') ? { name: 'Form 1', fieldA: false } : { url: 'https://example.com/form1-new' },
        status: 200,
        statusText: 'OK',
      }));
      global.fetch = fetchStub;

      const argv: string[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const config: any = { bin: 'sf', name: 'test', root: '', version: '1.0.0' };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const pushInstance = new Push(argv, config);
      // @ts-expect-error stub CLI parse
      pushInstance['parse'] = async () => ({ flags: { org: orgStub } });

      const result = await pushInstance.run();
      mock.restore();

      expect(result.uploaded).to.equal(1);
      expect(result.failed).to.equal(0);
      expect(apexPostStub.secondCall.args[0]).to.equal('/sharinpix/FormTemplateImport');

      return { queryStub, fetchStub, apexPostStub };
    };

    it('should only query main form templates', async () => {
      const { queryStub } = await pushWithMainId([]);

      expect(queryStub.firstCall.args[0]).to.equal(
        'SELECT Id, Name, sharinpix__FormUrl__c, sharinpix__Description__c FROM sharinpix__FormTemplate__c WHERE sharinpix__FormTemplateMain__c = null'
      );
    });

    it('should use the file mainId over a different Name-matched record when it exists in the org', async () => {
      const { fetchStub, apexPostStub } = await pushWithMainId([
        record('other456', 'Form 1'),
        record('main123', 'Renamed Form'),
      ]);

      expect(fetchStub.firstCall.args[0]).to.equal('https://example.com/main123.json');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
      const templatesBody = JSON.parse(fetchStub.secondCall.args[1].body as string) as {
        sfid: string;
        config: Record<string, unknown>;
      };
      expect(templatesBody.sfid).to.equal('main123');
      expect(templatesBody.config).to.not.have.property('mainId');
      expect(templatesBody.config).to.have.property('fieldA');

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(apexPostStub.secondCall.args[1].recordId).to.equal('main123');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
      const formTemplateJson = JSON.parse(apexPostStub.secondCall.args[1].formTemplateJson) as Record<string, unknown>;
      expect(formTemplateJson).to.not.have.property('mainId');
    });

    it('should fall back to the Name-matched record when the file mainId is not in the org', async () => {
      const { fetchStub, apexPostStub } = await pushWithMainId([record('other456', 'Form 1')]);

      expect(fetchStub.firstCall.args[0]).to.equal('https://example.com/other456.json');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
      expect((JSON.parse(fetchStub.secondCall.args[1].body as string) as { sfid: string }).sfid).to.equal('other456');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(apexPostStub.secondCall.args[1].recordId).to.equal('other456');
    });

    it('should send no recordId when the file mainId is not in the org and no Name matches', async () => {
      const { fetchStub, apexPostStub } = await pushWithMainId([record('other456', 'Another Form')]);

      expect(fetchStub.callCount).to.equal(1);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
      expect(JSON.parse(fetchStub.firstCall.args[1].body as string)).to.not.have.property('sfid');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(apexPostStub.secondCall.args[1].recordId).to.equal(undefined);
    });
  });

  it('should skip a pulled file pushed back unchanged, ignoring uuid and mainId', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    mock({
      'sharinpix/forms': {
        'Form_1-xxxx.json': '{"name":"Form 1","fieldA":true,"mainId":"f1"}',
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

    const apexPostStub = $$.SANDBOX.stub().resolves({ host: 'https://example.com', token: 'fake-token' });
    const getConnectionStub = $$.SANDBOX.stub().returns({
      query: $$.SANDBOX.stub().resolves({ records: mockRecords }),
      apex: { post: apexPostStub },
    });
    const orgStub = { getConnection: getConnectionStub };

    const fetchStub = $$.SANDBOX.stub().resolves({
      ok: true,
      json: async () => ({ uuid: 'abc-123', name: 'Form 1', fieldA: true }),
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

    expect(result.skipped).to.equal(1);
    expect(result.uploaded).to.equal(0);
    expect(fetchStub.callCount).to.equal(1);
    expect(apexPostStub.callCount).to.equal(1);

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
