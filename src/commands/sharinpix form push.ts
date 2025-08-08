import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('sharinpix-sf-cli', 'sharinpix form push');

export type SharinpixFormPushResult = {
  path: string;
};

export default class SharinpixFormPush extends SfCommand<SharinpixFormPushResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    name: Flags.string({
      summary: messages.getMessage('flags.name.summary'),
      description: messages.getMessage('flags.name.description'),
      char: 'n',
      required: false,
    }),
  };

  public async run(): Promise<SharinpixFormPushResult> {
    const { flags } = await this.parse(SharinpixFormPush);

    const name = flags.name ?? 'world';
    this.log(`hello ${name} from src/commands/sharinpix form push.ts`);
    return {
      path: 'src/commands/sharinpix form push.ts',
    };
  }
}
