import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@sharinpix/sharinpix-sf-cli', 'sharinpix.settings');

const SHARINPIX_SETTINGS_PATH = '/lightning/n/sharinpix__SharinPix_setting';

export default class Settings extends SfCommand<void> {
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

  public async run(): Promise<void> {
    const { flags } = await this.parse(Settings);
    const targetOrg = flags.org.getUsername();
    if (targetOrg)
      await this.config.runCommand('org:open', ['--target-org', targetOrg, '--path', SHARINPIX_SETTINGS_PATH]);
  }
}
