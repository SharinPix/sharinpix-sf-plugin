import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@sharinpix/sharinpix-sf-cli', 'hello.world');

export type HelloWorldResult = {
  name: string;
};

export default class World extends SfCommand<HelloWorldResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    org: Flags.requiredOrg({
      char: 'o',
      summary: messages.getMessage('flags.org.summary'),
      description: messages.getMessage('flags.org.description'),
    }),
  };

  public async run(): Promise<HelloWorldResult> {
    const { flags } = await this.parse(World);
    const connection = flags.org.getConnection('63.0');
    const result = (
      await connection.query(
        'SELECT Id, sharinpix__FormUrl__c, Name, sharinpix__Description__c FROM sharinpix__FormTemplate__c LIMIT 50'
      )
    ).records
      .map((record) =>
        [record.Id, record.sharinpix__FormUrl__c, record.Name, record.sharinpix__Description__c].join(',')
      )
      .join('\n');
    this.log(messages.getMessage('info.hello', [result, flags.org.getOrgId()]));

    const result2 = (await connection.query('SELECT Id, Name FROM sharinpix__FormTemplate__c LIMIT 50')).records
      .map((record) => [record.Id, record.Name].join(','))
      .join('\n');
    this.log(messages.getMessage('info.hello', [result2, flags.org.getOrgId()]));

    await connection.apex.post('/sharinpix/FormTemplateImport', {
      recordId: 'a0WJ6000001Ya27MAC',
      name: 'Super CLI IMPORT',
      description: 'From the cli',
      url: 'https://google.com',
      formTemplateJson: JSON.stringify({
        submit: {
          label: 'Submit',
        },
        elements: [
          {
            elemType: 'question',
            inputType: 'string',
            label: 'Name tega',
            id: '0198844b-db9d-710d-8919-63d84a6663cc',
            apiName: 'name_tega',
          },
        ],
      }),
    });
    // this.log(messages.getMessage('info.hello', [exec.logs.join(','), time]));
    // this.log(messages.getMessage('info.hello', [exec.exceptionMessage, time]));
    // this.log(messages.getMessage('info.hello', [await connection.tooling.executeAnonymous('System.debug(\'Hello World\');'), time]));
    return {
      name: 'OK',
    };
  }
}
