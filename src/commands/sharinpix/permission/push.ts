/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
import fs from 'node:fs';
import path from 'node:path';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { isJsonEqual } from '../../../helpers/utils.js';

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

    const files = fs
      .readdirSync('sharinpix/permissions')
      .filter((file) => file.endsWith('.json'))
      .map((file) => path.join('sharinpix/permissions', file));

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
      try {
        const fileContent = fs.readFileSync(file, 'utf8');
        const json = JSON.parse(fileContent) as Record<string, unknown>;
        const fileName = json.name as string;
        const existingRecord = existingMap.get(fileName);
        const existingId = existingRecord?.Id ?? null;

        const jsonWithoutName = { ...json };
        delete jsonWithoutName.name;

        if (existingRecord) {
          // Check if permission has changed by comparing with stored JSON
          try {
            const existingJson: unknown = JSON.parse(existingRecord.sharinpix__Json__c);
            if (isJsonEqual(jsonWithoutName, existingJson)) {
              this.log(messages.getMessage('info.skipped', [fileName]));
              skipped++;
              continue;
            }
          } catch (parseError) {
            this.warn(`Failed to parse stored JSON for ${fileName}, proceeding with update`);
          }
        }

        // Update or create the permission record
        const permissionData = {
          Name: fileName,
          // eslint-disable-next-line camelcase
          sharinpix__Json__c: JSON.stringify(jsonWithoutName),
          ...(existingRecord?.sharinpix__Description__c && {
            // eslint-disable-next-line camelcase
            sharinpix__Description__c: existingRecord.sharinpix__Description__c,
          }),
        };

        if (existingId) {
          // Update existing record
          await connection.sobject('sharinpix__SharinPixPermission__c').update({
            ...permissionData,
            Id: existingId,
          });
          this.log(messages.getMessage('info.updated', [fileName]));
        } else {
          // Create new record
          await connection.sobject('sharinpix__SharinPixPermission__c').create(permissionData);
          this.log(messages.getMessage('info.created', [fileName]));
        }

        uploaded++;
      } catch (error) {
        const fileContent = fs.readFileSync(file, 'utf8');
        try {
          const json = JSON.parse(fileContent) as unknown;
          const fileName = (json as { name: string }).name;
          this.warn(
            `Failed to push SharinPix permission ${fileName}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
        } catch (parseError) {
          this.warn(
            `Failed to parse JSON for SharinPix permission in ${file}: ${
              parseError instanceof Error ? parseError.message : 'Unknown error'
            }`
          );
        }
        failed++;
        continue;
      }
    }

    // Handle deletion of records that no longer have corresponding local files
    if (flags.delete) {
      const localFileNames = new Set(
        files.map((file) => {
          const fileContent = fs.readFileSync(file, 'utf8');
          const json = JSON.parse(fileContent) as Record<string, unknown>;
          return json.name as string;
        })
      );

      for (const [recordName, record] of existingMap) {
        if (!localFileNames.has(recordName)) {
          try {
            await connection.sobject('sharinpix__SharinPixPermission__c').delete(record.Id);
            this.log(messages.getMessage('info.deleted', [recordName]));
            deleted++;
          } catch (error) {
            this.warn(
              `Failed to delete SharinPix permission ${recordName}: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`
            );
            failed++;
          }
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
