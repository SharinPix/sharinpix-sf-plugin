/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
import fs from 'node:fs';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@sharinpix/sharinpix-sf-cli', 'hello.world');

export type PullResult = {
  name: string;
};

export default class Pull extends SfCommand<PullResult> {
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

  public async run(): Promise<PullResult> {
    const { flags } = await this.parse(Pull);
    const connection = flags.org.getConnection('63.0');
    fs.mkdirSync('sharinpix/forms', { recursive: true });
    const records = (
      await connection.query(
        'SELECT Id, sharinpix__FormUrl__c, Name, sharinpix__Description__c FROM sharinpix__FormTemplate__c order by LastModifiedDate desc'
      )
    ).records.map((record) => record);

    for (const record of records) {
      try {
        const form: unknown = (await (await fetch(record.sharinpix__FormUrl__c as string + '.json', {
          headers: {
            'Accept': 'application/json',
          }
        })).json());
        fs.writeFileSync(`sharinpix/forms/${record.Name}.json`, JSON.stringify(form, null, 2));
        this.log(messages.getMessage('info.hello', [record.Name, record.sharinpix__FormUrl__c]));
      } catch (error) {
        // eslint-disable-next-line no-console
        // console.log('SKIP', record.Name, error);
      }
      // return [record.Id, record.sharinpix__FormUrl__c, record.Name, record.sharinpix__Description__c].join(',')
    }
    // this.log(messages.getMessage('info.hello', [result, flags.org.getOrgId()]));

    /* const result2 = (await connection.query('SELECT Id, Name FROM sharinpix__FormTemplate__c LIMIT 50')).records
      .map((record) => [record.Id, record.Name].join(','))
      .join('\n');
    this.log(messages.getMessage('info.hello', [result2, flags.org.getOrgId()]));*/

    /* await connection.apex.post('/sharinpix/FormTemplateImport', {
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
    });*/
    // this.log(messages.getMessage('info.hello', [exec.logs.join(','), time]));
    // this.log(messages.getMessage('info.hello', [exec.exceptionMessage, time]));
    // this.log(messages.getMessage('info.hello', [await connection.tooling.executeAnonymous('System.debug(\'Hello Pull\');'), time]));
    return {
      name: 'OK',
    };
  }
}
