/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
import fs from 'node:fs';
import path from 'node:path';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@sharinpix/sharinpix-sf-cli', 'sharinpix.form.push');

export type PushResult = {
  name: string;
  formsUploaded?: number;
  formsFailed?: number;
  formsSkipped?: number;
};

type FormTemplateRecord = {
  Id: string;
  Name: string;
  sharinpix__FormUrl__c: string;
  sharinpix__Description__c: string;
};

export default class Push extends SfCommand<PushResult> {
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

  public async run(): Promise<PushResult> {
    const { flags } = await this.parse(Push);
    const connection = flags.org.getConnection('63.0');

    const formFiles = fs
      .readdirSync('sharinpix/forms')
      .filter((file) => file.endsWith('.json'))
      .map((file) => path.join('sharinpix/forms', file));

    if (formFiles.length === 0) {
      this.log('No form template files found in the specified directory.');
      return {
        name: 'OK',
        formsUploaded: 0,
        formsFailed: 0,
        formsSkipped: 0,
      };
    }

    const existingRecords = (
      await connection.query<FormTemplateRecord>(
        'SELECT Id, Name, sharinpix__FormUrl__c, sharinpix__Description__c FROM sharinpix__FormTemplate__c'
      )
    ).records;

    const existingFormsMap = new Map(existingRecords.map((record) => [record.Name, record]));

    let formsUploaded = 0;
    let formsFailed = 0;
    const formsSkipped = 0;

    for (const formFile of formFiles) {
      try {
        const fileName = path.basename(formFile, '.json');
        const formContent = fs.readFileSync(formFile, 'utf8');
        const formData = JSON.parse(formContent) as unknown;

        const existingForm = existingFormsMap.get(fileName);

        const importData = {
          recordId: existingForm?.Id ?? null,
          name: fileName,
          description: (formData as { description?: string })?.description,
          url: (formData as { url?: string })?.url,
          formTemplateJson: formContent,
        };

        await connection.apex.post('/sharinpix/FormTemplateImport', importData);

        if (existingForm) {
          this.log(messages.getMessage('info.updated', [fileName]));
        } else {
          this.log(messages.getMessage('info.created', [fileName]));
        }

        formsUploaded++;
      } catch (error) {
        const fileName = path.basename(formFile, '.json');
        this.warn(
          `Failed to push form template ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        formsFailed++;
      }
    }

    this.log(messages.getMessage('info.summary', [formsUploaded, formsFailed, formsSkipped]));

    return {
      name: 'OK',
      formsUploaded,
      formsFailed,
      formsSkipped,
    };
  }
}
