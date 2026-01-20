/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
import fs from 'node:fs';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, Org } from '@salesforce/core';
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
    csv: Flags.boolean({
      char: 'c',
      summary: messages.getMessage('flags.csv.summary'),
      description: messages.getMessage('flags.csv.description'),
      default: false,
    }),
  };

  public async run(): Promise<PullResult> {
    const { flags } = await this.parse(Pull);
    return this.runWithFlags(flags);
  }

  public async runWithFlags(flags: { org: Org }): Promise<PullResult> {
    const connection = flags.org.getConnection('63.0');
    fs.mkdirSync('sharinpix/forms', { recursive: true });

    const result = await connection.query<FormTemplateRecord>(
      'SELECT Id, sharinpix__FormUrl__c, Name, sharinpix__Description__c FROM sharinpix__FormTemplate__c order by LastModifiedDate desc'
    );
    const records = result.records;

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
        this.warn(
          `Failed to fetch form template ${record.Name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        formsFailed++;
      }
    }

    this.log(`Successfully downloaded ${formsDownloaded} form template(s). ${formsFailed} failed.`);

    if (flags.csv) {
      await this.config.runCommand('sharinpix:form:json2csv', []);
    }

    return {
      name: 'OK',
      formsDownloaded,
      formsFailed,
    };
  }
}
