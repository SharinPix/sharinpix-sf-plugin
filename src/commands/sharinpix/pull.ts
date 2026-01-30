/* eslint-disable no-console */
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import ConfigPull from './config/pull.js';
import FormPull from './form/pull.js';
import PermissionPull from './permission/pull.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@sharinpix/sharinpix-sf-cli', 'sharinpix.pull');

export type PullResult = {
  configs: unknown;
  forms: unknown;
  permissions: unknown;
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

    this.log('Pulling configs...');
    const configPull = new ConfigPull(this.argv, this.config);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const configsResult = await configPull.runWithFlags(flags);

    this.log('\nPulling forms...');
    const formPull = new FormPull(this.argv, this.config);
    const formsResult = await formPull.runWithFlags(flags);

    this.log('\nPulling permissions...');
    const permissionPull = new PermissionPull(this.argv, this.config);
    const permissionsResult = await permissionPull.runWithFlags(flags);

    return {
      configs: configsResult,
      forms: formsResult,
      permissions: permissionsResult,
    };
  }
}
