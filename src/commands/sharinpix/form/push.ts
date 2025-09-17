/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
import fs from 'node:fs';
import path from 'node:path';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { isJsonEqual } from '../../../helpers/utils.js';

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

    const body = {
      // eslint-disable-next-line camelcase
      form_template_create: true,
    };

    const responseToken: { host: string; token: string } = await connection.apex.post('/sharinpix/Token', {
      payload: JSON.stringify(body),
    });

    const existingRecords = (
      await connection.query<FormTemplateRecord>(
        'SELECT Id, Name, sharinpix__FormUrl__c, sharinpix__Description__c FROM sharinpix__FormTemplate__c'
      )
    ).records;

    const existingMap = new Map(existingRecords.map((record) => [record.Name, record]));

    let uploaded = 0;
    let failed = 0;
    let skipped = 0;

    for (const file of files) {
      try {
        const fileContent = fs.readFileSync(file, 'utf8');
        const json = JSON.parse(fileContent) as Record<string, unknown>;
        const fileName = json.name as string;
        const existingRecord = existingMap.get(fileName);
        const existingId = existingRecord?.Id ?? null;

        if (existingRecord) {
          // Check if form has changed by comparing with stored JSON
          const response = await fetch(existingRecord?.sharinpix__FormUrl__c + '.json', {
            headers: {
              Accept: 'application/json',
            },
          });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const existingJson: unknown = await response.json();
          if (existingJson) {
            try {
              if (isJsonEqual(json, existingJson)) {
                this.log(messages.getMessage('info.skipped', [fileName]));
                skipped++;
                continue;
              }
            } catch (parseError) {
              this.warn(`Failed to parse stored JSON for ${fileName}, proceeding with update`);
              failed++;
              continue;
            }
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const responseData = await (
          await fetch(`${responseToken.host}/api/v1/form/templates`, {
            method: 'POST',
            body: JSON.stringify({
              sfid: existingId ?? undefined,
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

        const formTemplateJson = JSON.stringify({
          ...(json as object),
          url: (responseData as { url: string }).url,
        });

        await connection.apex.post('/sharinpix/FormTemplateImport', {
          recordId: existingId ?? undefined,
          name: fileName,
          url: (responseData as { url: string }).url,
          formTemplateJson,
        });

        if (existingId) {
          this.log(messages.getMessage('info.updated', [fileName]));
        } else {
          this.log(messages.getMessage('info.created', [fileName]));
        }

        uploaded++;
      } catch (error) {
        const fileContent = fs.readFileSync(file, 'utf8');
        const json = JSON.parse(fileContent) as unknown;
        const fileName = (json as { name: string }).name;
        this.warn(
          `Failed to push form template ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        failed++;
        continue;
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
