/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
import fs from 'node:fs';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { createSafeFilename } from '../../../helpers/utils.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@sharinpix/sharinpix-sf-cli', 'sharinpix.form.pull');

export type PullResult = {
  name: string;
  formsDownloaded?: number;
  formsFailed?: number;
};

type FormTemplateRecord = {
  Id: string;
  Name: string;
  sharinpix__FormUrl__c: string;
  sharinpix__Description__c: string;
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
      await connection.query<FormTemplateRecord>(
        'SELECT Id, sharinpix__FormUrl__c, Name, sharinpix__Description__c FROM sharinpix__FormTemplate__c order by LastModifiedDate desc'
      )
    ).records;

    let formsDownloaded = 0;
    let formsFailed = 0;

    for (const record of records) {
      try {
        const response = await fetch(record.sharinpix__FormUrl__c + '.json', {
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const form: unknown = await response.json();
        const safeFilename = createSafeFilename(record.Name);
        fs.writeFileSync(`sharinpix/forms/${safeFilename}.json`, JSON.stringify(form, null, 2));
        this.log(messages.getMessage('info.hello', [record.Name, record.sharinpix__FormUrl__c]));
        formsDownloaded++;
      } catch (error) {
        // Skip forms that can't be fetched (e.g., network errors, invalid URLs)
        this.warn(
          `Failed to fetch form template ${record.Name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        formsFailed++;
      }
    }

    this.log(`Successfully downloaded ${formsDownloaded} form template(s). ${formsFailed} failed.`);

    return {
      name: 'OK',
      formsDownloaded,
      formsFailed,
    };
  }
}
