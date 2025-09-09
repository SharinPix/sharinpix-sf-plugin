/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
import fs from 'node:fs';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@sharinpix/sharinpix-sf-cli', 'sharinpix.permission.pull');

export type PullResult = {
  name: string;
  permissionsDownloaded?: number;
  permissionsFailed?: number;
};

type SharinPixPermissionRecord = {
  Id: string;
  Name: string;
  sharinpix__Description__c: string;
  sharinpix__ID__c: string;
  sharinpix__Json__c: string;
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
    fs.mkdirSync('sharinpix/permission', { recursive: true });

    const records = (
      await connection.query<SharinPixPermissionRecord>(
        'SELECT Id, Name, sharinpix__Description__c, sharinpix__ID__c, sharinpix__Json__c FROM sharinpix__SharinPixPermission__c order by LastModifiedDate desc'
      )
    ).records;

    let permissionsDownloaded = 0;
    let permissionsFailed = 0;

    for (const record of records) {
      try {
        const permissionData: unknown = JSON.parse(record.sharinpix__Json__c);

        fs.writeFileSync(`sharinpix/permission/${record.Name}.json`, JSON.stringify(permissionData, null, 2));
        this.log(
          messages.getMessage('info.hello', [record.Name, record.sharinpix__Description__c || 'No description'])
        );
        permissionsDownloaded++;
      } catch (error) {
        // Skip permissions that can't be fetched (e.g., network errors, invalid data)
        this.warn(
          `Failed to fetch SharinPix permission ${record.Name}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
        permissionsFailed++;
      }
    }

    this.log(`Successfully downloaded ${permissionsDownloaded} SharinPix permission(s). ${permissionsFailed} failed.`);

    return {
      name: 'OK',
      permissionsDownloaded,
      permissionsFailed,
    };
  }
}
