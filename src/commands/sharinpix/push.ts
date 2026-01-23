/* eslint-disable no-console */
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import FormPush from './form/push.js';
import PermissionPush from './permission/push.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@sharinpix/sharinpix-sf-cli', 'sharinpix.push');

export type PushResult = {
  forms: unknown;
  permissions: unknown;
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

    this.log('Pushing forms...');
    const formPush = new FormPush(this.argv, this.config);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const formsResult = await formPush.runWithFlags(flags);

    this.log('\nPushing permissions...');
    const permissionPush = new PermissionPush(this.argv, this.config);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const permissionsResult = await permissionPush.runWithFlags(flags);

    return {
      forms: formsResult,
      permissions: permissionsResult,
    };
  }
}
