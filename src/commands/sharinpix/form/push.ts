/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-await-in-loop */
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import {
  isJsonEqual,
  readJsonFile,
  getNameFromJson,
  getJsonFiles,
  fetchJson,
  formatErrorMessage,
} from '../../../helpers/utils.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@sharinpix/sharinpix-sf-cli', 'sharinpix.form.push');

export type PushResult = {
  name: string;
  uploaded?: number;
  failed?: number;
  skipped?: number;
  deleted?: number;
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
    delete: Flags.boolean({
      char: 'd',
      summary: messages.getMessage('flags.delete.summary'),
      description: messages.getMessage('flags.delete.description'),
      default: false,
    }),
    csv: Flags.boolean({
      char: 'c',
      summary: messages.getMessage('flags.csv.summary'),
      description: messages.getMessage('flags.csv.description'),
      default: false,
    }),
  };

  public async run(): Promise<PushResult> {
    const { flags } = await this.parse(Push);
    const connection = flags.org.getConnection('63.0');

    if (flags.csv) {
      await this.config.runCommand('sharinpix:form:csv2json', []);
    }

    const files = getJsonFiles('sharinpix/forms');

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
    let deleted = 0;

    for (const file of files) {
      const processFile = async (): Promise<void> => {
        const json = readJsonFile(file);
        const fileName = getNameFromJson(json);
        const existingRecord = existingMap.get(fileName);
        const existingId = existingRecord?.Id ?? null;

        if (existingRecord) {
          const existingJson = await fetchJson(existingRecord.sharinpix__FormUrl__c + '.json').catch((error) => {
            this.warn(`Failed to check changes for ${fileName}, proceeding with update: ${formatErrorMessage(error)}`);
            return null;
          });

          if (existingJson && isJsonEqual(json, existingJson)) {
            this.log(messages.getMessage('info.skipped', [fileName]));
            skipped++;
            return;
          }
        }

        const response = await fetch(`${responseToken.host}/api/v1/form/templates`, {
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
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const responseData = (await response.json()) as { url: string };

        const formTemplateJson = JSON.stringify({
          ...(json as object),
          url: responseData.url,
        });

        await connection.apex.post('/sharinpix/FormTemplateImport', {
          recordId: existingId ?? undefined,
          name: fileName,
          url: responseData.url,
          formTemplateJson,
        });

        this.log(messages.getMessage(existingId ? 'info.updated' : 'info.created', [fileName]));
        uploaded++;
      };

      await processFile().catch((error: Error) => {
        try {
          const json = readJsonFile(file);
          const fileName = getNameFromJson(json);
          this.warn(`Failed to push form template ${fileName}: ${formatErrorMessage(error)}`);
        } catch {
          this.warn(`Failed to parse JSON for form template in ${file}: ${formatErrorMessage(error)}`);
        }
        failed++;
      });
    }

    if (flags.delete) {
      const localFileNames = new Set(
        files.map((file) => {
          const json = readJsonFile(file);
          return getNameFromJson(json);
        })
      );

      for (const [recordName, record] of existingMap) {
        if (!localFileNames.has(recordName)) {
          await (connection.sobject('sharinpix__FormTemplate__c').delete(record.Id) as Promise<unknown>)
            .then(() => {
              this.log(messages.getMessage('info.deleted', [recordName]));
              deleted++;
            })
            .catch((error: Error) => {
              this.warn(`Failed to delete form template ${recordName}: ${formatErrorMessage(error)}`);
              failed++;
            });
        }
      }
    }

    this.log(messages.getMessage('info.summary', [uploaded, failed, skipped, deleted]));

    return {
      name: 'OK',
      uploaded,
      failed,
      skipped,
      deleted,
    };
  }
}
