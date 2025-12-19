import fs from 'node:fs';
import path from 'node:path';
import { stringify } from 'csv-stringify/sync';
import { SfCommand } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { getJsonFiles, formatErrorMessage } from '../../../helpers/utils.js';
import { elementKeyOrder, serializeCell } from '../../../helpers/form/elementKeys.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@sharinpix/sharinpix-sf-cli', 'sharinpix.form.json2csv');

const FORMS_DIRECTORY = 'sharinpix/forms';

const CSV_OPTIONS = {
  quotedMatch: /[",\n\r]/,
  quotedEmpty: true,
  escape: '"',
} as const;

export type Json2CsvResult = {
  name: string;
  converted: number;
  skipped: number;
};

type FormElement = Record<string, unknown>;
type ProcessResult = { success: true; fileName: string } | { success: false; fileName: string; reason: string };

function buildHeaders(elements: FormElement[]): string[] {
  const allKeys = new Set<string>();
  for (const element of elements) {
    for (const key of Object.keys(element)) {
      if (key === 'index') continue;
      allKeys.add(key);
    }
  }
  return elementKeyOrder.filter((key) => key !== 'index' && allKeys.has(key));
}

function generateCsvContent(headers: string[], elements: FormElement[]): string {
  const rows: Array<Array<string | undefined>> = [headers];
  for (const element of elements) {
    const row = headers.map((key) => {
      const value = element[key];
      return serializeCell(key, value);
    });
    rows.push(row);
  }
  return stringify(rows, CSV_OPTIONS);
}

function extractElements(parsed: Record<string, unknown>): FormElement[] {
  const { elements } = parsed;
  if (!Array.isArray(elements)) throw new Error(messages.getMessage('error.noElementsArray'));
  if (elements.length === 0) throw new Error(messages.getMessage('error.emptyElementsArray'));
  return elements as FormElement[];
}

async function processJsonFile(filePath: string): Promise<ProcessResult> {
  const fileName = path.basename(filePath);
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    const parsed = JSON.parse(content) as Record<string, unknown>;
    const elements = extractElements(parsed);
    const headers = buildHeaders(elements);
    const csvContent = generateCsvContent(headers, elements);
    const csvPath = filePath.replace(/\.json$/i, '.csv');
    await fs.promises.writeFile(csvPath, csvContent, 'utf8');
    return { success: true, fileName };
  } catch (error) {
    return { success: false, fileName, reason: formatErrorMessage(error) };
  }
}

export default class Json2Csv extends SfCommand<Json2CsvResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public async run(): Promise<Json2CsvResult> {
    let files: string[];
    try {
      files = getJsonFiles(FORMS_DIRECTORY);
    } catch (error) {
      this.warn(messages.getMessage('error.directoryNotFound', [FORMS_DIRECTORY, formatErrorMessage(error)]));
      return { name: 'OK', converted: 0, skipped: 0 };
    }

    const results = await Promise.all(files.map((file) => processJsonFile(file)));
    let converted = 0;
    let skipped = 0;
    results.forEach((result) => {
      if (result.success) {
        converted++;
        return;
      }
      this.log(messages.getMessage('info.skipped', [result.fileName, result.reason]));
      skipped++;
    });
    this.log(messages.getMessage('info.summary', [converted, skipped]));

    return {
      name: 'OK',
      converted,
      skipped,
    };
  }
}
