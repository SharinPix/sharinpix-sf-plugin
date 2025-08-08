import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('sharinpix-sf-cli', 'sharinpix form pull');

export type SharinpixFormPullResult = {
  path: string;
};

export default class SharinpixFormPull extends SfCommand<SharinpixFormPullResult> {
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

  public async run(): Promise<SharinpixFormPullResult> {
    const { flags } = await this.parse(SharinpixFormPull);

    const name = flags.name ?? 'world';
    this.log(`hello ${name} from src/commands/sharinpix form pull.ts`);
    return {
      path: 'src/commands/sharinpix form pull.ts',
    };
  }
}
