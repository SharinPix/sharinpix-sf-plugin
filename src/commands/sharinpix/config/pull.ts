/* eslint-disable no-console */
import fs from 'node:fs';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { formatErrorMessage } from '../../../helpers/utils.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@sharinpix/sharinpix-sf-cli', 'sharinpix.config.pull');

export type PullResult = {
  name: string;
  success?: boolean;
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
    fs.mkdirSync('sharinpix/configs', { recursive: true });

    try {
      // Get authentication token
      const body = {
        // eslint-disable-next-line camelcase
        form_template_create: true,
      };

      const responseToken: { host: string; token: string } = await connection.apex.post('/sharinpix/Token', {
        payload: JSON.stringify(body),
      });

      // Fetch config from API
      const response = await fetch(`${responseToken.host}/api/v1/organization/config`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${responseToken.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const config: unknown = await response.json();

      // Save to local file
      fs.writeFileSync('sharinpix/configs/config.json', JSON.stringify(config, null, 2));
      this.log(messages.getMessage('info.success'));

      return {
        name: 'OK',
        success: true,
      };
    } catch (error) {
      this.error(
        messages.getMessage('error.failed', [formatErrorMessage(error)])
      );
    }
  }
}
