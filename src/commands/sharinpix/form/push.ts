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
  uploaded?: number;
  failed?: number;
  skipped?: number;
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

    const files = fs
      .readdirSync('sharinpix/forms')
      .filter((file) => file.endsWith('.json'))
      .map((file) => path.join('sharinpix/forms', file));

    if (files.length === 0) {
      this.log('No form template files found in the specified directory.');
      return {
        name: 'OK',
        uploaded: 0,
        failed: 0,
        skipped: 0,
      };
    }

    const existingRecords = (
      await connection.query<FormTemplateRecord>(
        'SELECT Id, Name, sharinpix__FormUrl__c, sharinpix__Description__c FROM sharinpix__FormTemplate__c'
      )
    ).records;

    const existingMap = new Map(existingRecords.map((record) => [record.Name, record]));

    let uploaded = 0;
    let failed = 0;
    const skipped = 0;

    for (const file of files) {
      try {
        const fileName = path.basename(file, '.json');
        const fileContent = fs.readFileSync(file, 'utf8');
        const json = JSON.parse(fileContent) as unknown;
        const existingId = existingMap.get(fileName)?.Id ?? null;

        const responseToken: { host: string; token: string } = await connection.apex.post('/sharinpix/Token', {
          // eslint-disable-next-line camelcase
          form_template_create: true,
        });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const responseData = await (
          await fetch(`${responseToken.host}/api/v1/form/templates`, {
            method: 'POST',
            body: JSON.stringify({
              sfid: existingId,
              config: {
                name: fileName,
                ...(json as object),
              },
            }),
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: `Bearer ${responseToken.token}`,
            },
          })
        ).json();

        await connection.apex.post('/sharinpix/FormTemplateImport', {
          recordId: existingId,
          name: fileName,
          url: (responseData as { url: string }).url,
          formTemplateJson: JSON.stringify({
            ...(json as object),
            url: (responseData as { url: string }).url,
          }),
        });

        if (existingId) {
          this.log(messages.getMessage('info.updated', [fileName]));
        } else {
          this.log(messages.getMessage('info.created', [fileName]));
        }

        uploaded++;
      } catch (error) {
        const fileName = path.basename(file, '.json');
        this.warn(
          `Failed to push form template ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        failed++;
      }
    }

    this.log(messages.getMessage('info.summary', [uploaded, failed, skipped]));

    return {
      name: 'OK',
      uploaded,
      failed,
      skipped,
    };
  }
}
