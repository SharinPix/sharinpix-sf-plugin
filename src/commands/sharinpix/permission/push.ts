/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-await-in-loop */
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import {
  isJsonEqual,
  readJsonFile,
  getNameFromJson,
  getJsonFiles,
  formatErrorMessage,
} from '../../../helpers/utils.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@sharinpix/sharinpix-sf-cli', 'sharinpix.permission.push');

export type PushResult = {
  name: string;
  uploaded?: number;
  failed?: number;
  skipped?: number;
  deleted?: number;
};

type SharinPixPermissionRecord = {
  Id: string;
  Name: string;
  sharinpix__Description__c: string;
  sharinpix__Json__c: string;
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
  };

  public async run(): Promise<PushResult> {
    const { flags } = await this.parse(Push);
    const connection = flags.org.getConnection('63.0');

    const files = getJsonFiles('sharinpix/permissions');

    const existingRecords = (
      await connection.query<SharinPixPermissionRecord>(
        'SELECT Id, Name, sharinpix__Description__c, sharinpix__Json__c FROM sharinpix__SharinPixPermission__c'
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

        const jsonWithoutName = { ...json };
        delete jsonWithoutName.name;

        if (existingRecord) {
          try {
            const existingJson: unknown = JSON.parse(existingRecord.sharinpix__Json__c);
            if (isJsonEqual(jsonWithoutName, existingJson)) {
              this.log(messages.getMessage('info.skipped', [fileName]));
              skipped++;
              return;
            }
          } catch (parseError) {
            this.warn(`Failed to parse stored JSON for ${fileName}, proceeding with update`);
          }
        }

        const permissionData = {
          Name: fileName,
          // eslint-disable-next-line camelcase
          sharinpix__Json__c: JSON.stringify(jsonWithoutName),
          ...(existingRecord?.sharinpix__Description__c && {
            // eslint-disable-next-line camelcase
            sharinpix__Description__c: existingRecord.sharinpix__Description__c,
          }),
        };

        if (existingRecord?.Id) {
          await connection.sobject('sharinpix__SharinPixPermission__c').update({
            ...permissionData,
            Id: existingRecord.Id,
          });
        } else {
          await connection.sobject('sharinpix__SharinPixPermission__c').create(permissionData);
        }

        this.log(messages.getMessage(existingRecord ? 'info.updated' : 'info.created', [fileName]));
        uploaded++;
      };

      await processFile().catch((error: Error) => {
        try {
          const json = readJsonFile(file);
          const fileName = getNameFromJson(json);
          this.warn(`Failed to push SharinPix permission ${fileName}: ${formatErrorMessage(error)}`);
        } catch {
          this.warn(`Failed to parse JSON for SharinPix permission in ${file}: ${formatErrorMessage(error)}`);
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
          await (connection.sobject('sharinpix__SharinPixPermission__c').delete(record.Id) as Promise<unknown>)
            .then(() => {
              this.log(messages.getMessage('info.deleted', [recordName]));
              deleted++;
            })
            .catch((error: Error) => {
              this.warn(`Failed to delete SharinPix permission ${recordName}: ${formatErrorMessage(error)}`);
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
