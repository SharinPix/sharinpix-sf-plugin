/* eslint-disable no-console */
import fs from 'node:fs';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { formatErrorMessage } from '../../../helpers/utils.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@sharinpix/sharinpix-sf-cli', 'sharinpix.config.push');

export type PushResult = {
  name: string;
  success?: boolean;
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
  };

  public async run(): Promise<PushResult> {
    const { flags } = await this.parse(Push);
    const connection = flags.org.getConnection('63.0');

    try {
      // Read local config file
      if (!fs.existsSync('sharinpix/configs/config.json')) {
        this.error(messages.getMessage('error.notFound'));
      }

      const configContent = fs.readFileSync('sharinpix/configs/config.json', 'utf-8');
      const config: unknown = JSON.parse(configContent);

      // Get authentication token
      const body = {
        // eslint-disable-next-line camelcase
        form_template_create: true,
      };

      const responseToken: { host: string; token: string } = await connection.apex.post('/sharinpix/Token', {
        payload: JSON.stringify(body),
      });

      // Push config to API
      const response = await fetch(`${responseToken.host}/api/v1/organization/config`, {
        method: 'POST',
        body: JSON.stringify(config),
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${responseToken.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

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
