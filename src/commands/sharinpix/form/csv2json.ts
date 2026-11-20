import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { SfCommand } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import {
  assertWithinLocalRoot,
  getCsvFiles,
  formatErrorMessage,
  orderElementKeys,
} from '../../../helpers/utils.js';
import { elementKeyOrder, parseCell } from '../../../helpers/form/elementKeys.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@sharinpix/sharinpix-sf-cli', 'sharinpix.form.csv2json');

const FORMS_DIRECTORY = 'sharinpix/forms';

const CSV_PARSE_OPTIONS = {
  skipEmptyLines: true,
  relaxColumnCount: true,
  relaxQuotes: true,
} as const;

export type Csv2JsonResult = {
  name: string;
  converted: number;
  skipped: number;
};

type FormElement = Record<string, unknown>;
type ProcessResult = { success: true; fileName: string } | { success: false; fileName: string; reason: string };

function parseCsvRows(content: string): string[][] {
  try {
    return parse(content, CSV_PARSE_OPTIONS);
  } catch (error) {
    // csv-parse messages can echo file content; report only the error code.
    const code = (error as { code?: string }).code ?? 'PARSE_ERROR';
    throw new Error(`Invalid CSV (${code})`, { cause: error });
  }
}

function mergeElementsIntoJson(
  existingJson: Record<string, unknown>,
  elements: FormElement[]
): Record<string, unknown> {
  return { ...existingJson, elements };
}

function createOrderedElement(merged: FormElement): FormElement {
  const orderedKeys = orderElementKeys(Object.keys(merged));
  const element: FormElement = {};
  for (const key of orderedKeys) {
    element[key] = merged[key];
  }
  return element;
}

function parseRowValues(
  headers: string[],
  row: string[],
  rowNumber: number
): { values: Map<string, unknown>; keysToClear: Set<string> } {
  const values = new Map<string, unknown>();
  const keysToClear = new Set<string>();
  for (let index = 0; index < headers.length; index++) {
    const header = (headers[index] ?? '').trim();
    const rawValue = row[index] ?? '';
    if (!header) continue;
    if (header === 'index') continue;

    if (rawValue === '') {
      keysToClear.add(header);
      continue;
    }

    if (rawValue === '""') {
      values.set(header, '');
      continue;
    }

    try {
      values.set(header, parseCell(header, rawValue));
    } catch (error) {
      // Cell and header text come from the file; omit them, keeping only known key names.
      const keyLabel = elementKeyOrder.includes(header) ? ` for key "${header}"` : '';
      const errorMsg = `Failed to parse value${keyLabel} at row ${rowNumber}, column ${index + 1}`;
      throw new Error(errorMsg, { cause: error });
    }
  }
  return { values, keysToClear };
}

async function loadAndValidateJson(jsonPath: string): Promise<Record<string, unknown>> {
  const jsonFileName = path.basename(jsonPath);
  let content: string;
  try {
    assertWithinLocalRoot(jsonPath);
    content = await fs.promises.readFile(jsonPath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      throw new Error(messages.getMessage('error.jsonNotFound', [jsonFileName]));
    throw new Error(messages.getMessage('error.jsonReadFailed', [jsonFileName, formatErrorMessage(error)]));
  }

  let existingJson: Record<string, unknown>;
  try {
    existingJson = JSON.parse(content) as Record<string, unknown>;
  } catch {
    // JSON.parse errors echo file content; report a fixed reason instead.
    throw new Error(messages.getMessage('error.jsonInvalid', [jsonFileName, 'syntax error']));
  }

  if (typeof existingJson !== 'object' || existingJson === null || Array.isArray(existingJson))
    throw new Error(messages.getMessage('error.jsonNotObject', [jsonFileName]));

  return existingJson;
}

async function processCsvFile(filePath: string): Promise<ProcessResult> {
  const fileName = path.basename(filePath);

  try {
    assertWithinLocalRoot(filePath);
    const content = await fs.promises.readFile(filePath, 'utf8');
    const rows = parseCsvRows(content);

    if (rows.length < 2) throw new Error(messages.getMessage('error.noDataRows'));

    const jsonPath = filePath.replace(/\.csv$/i, '.json');
    const existingJson = await loadAndValidateJson(jsonPath);
    const existingElementsRaw = existingJson.elements;
    const existingElements: unknown[] = Array.isArray(existingElementsRaw) ? existingElementsRaw : [];

    const headers = rows[0];
    const elements: FormElement[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 1;
      const elementIndex = i - 1;

      const { values, keysToClear } = parseRowValues(headers, row, rowNumber);

      const baseCandidate = existingElements[i - 1];
      const base: FormElement =
        typeof baseCandidate === 'object' && baseCandidate !== null && !Array.isArray(baseCandidate)
          ? (baseCandidate as FormElement)
          : {};

      const baseWithoutCleared: FormElement = { ...base };
      for (const key of keysToClear) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete baseWithoutCleared[key];
      }

      const merged: FormElement = { ...baseWithoutCleared, ...Object.fromEntries(values), index: elementIndex };
      elements.push(createOrderedElement(merged));
    }

    const mergedJson = mergeElementsIntoJson(existingJson, elements);

    assertWithinLocalRoot(jsonPath);
    await fs.promises.writeFile(jsonPath, JSON.stringify(mergedJson, null, 2), 'utf8');
    return { success: true, fileName };
  } catch (error) {
    return { success: false, fileName, reason: formatErrorMessage(error) };
  }
}

export default class Csv2Json extends SfCommand<Csv2JsonResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public async run(): Promise<Csv2JsonResult> {
    let files: string[];
    try {
      files = getCsvFiles(FORMS_DIRECTORY);
    } catch (error) {
      this.warn(messages.getMessage('error.directoryNotFound', [FORMS_DIRECTORY, formatErrorMessage(error)]));
      return { name: 'OK', converted: 0, skipped: 0 };
    }

    const results = await Promise.all(files.map((file) => processCsvFile(file)));
    let converted = 0;
    let skipped = 0;
    results.forEach((result) => {
      if (result.success) {
        converted++;
        return;
      } else {
        this.log(messages.getMessage('info.skipped', [result.fileName, result.reason]));
        skipped++;
      }
    });
    this.log(messages.getMessage('info.summary', [converted, skipped]));

    return {
      name: 'OK',
      converted,
      skipped,
    };
  }
}
