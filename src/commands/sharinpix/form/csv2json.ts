import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { SfCommand } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { getCsvFiles, formatErrorMessage, orderElementKeys } from '../../../helpers/utils.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@sharinpix/sharinpix-sf-cli', 'sharinpix.form.csv2json');

const FORMS_DIRECTORY = 'sharinpix/forms';
const NUMERIC_FIELDS = ['index', 'max', 'min', 'step', 'rows', 'cols'];

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
  return parse(content, CSV_PARSE_OPTIONS);
}

function parseCellValue(header: string, rawValue: string): unknown {
  const trimmed = rawValue.trim();
  if (trimmed === '') return '';
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (typeof parsed === 'object' && parsed !== null) return parsed;
    } catch {
      // Ignore parse errors, continue with other type detection
    }
  }

  if (NUMERIC_FIELDS.includes(header)) {
    const numValue = Number(trimmed);
    const numberPattern = /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/;
    if (!Number.isNaN(numValue) && isFinite(numValue) && numberPattern.test(trimmed)) {
      return numValue;
    }
  }

  return trimmed;
}

function parseElementRow(row: string[], headers: string[]): FormElement {
  const values = new Map<string, unknown>();
  for (let index = 0; index < headers.length; index++) {
    const header = headers[index];
    const rawValue = row[index] ?? '';
    if (header && rawValue !== '') {
      values.set(header, parseCellValue(header, rawValue));
    }
  }

  const orderedKeys = orderElementKeys(Array.from(values.keys()));
  const element: FormElement = {};
  for (const key of orderedKeys) {
    element[key] = values.get(key);
  }
  return element;
}

function preserveElementTypes(csvElements: FormElement[], originalElements: FormElement[]): FormElement[] {
  const originalElementsById = new Map(originalElements.map((el) => [String(el.id), el]));
  return csvElements.map((csvElement) => {
    const typedElement: FormElement = { ...csvElement };
    const originalElement = originalElementsById.get(String(csvElement.id));
    if (originalElement) {
      for (const [key, csvValue] of Object.entries(csvElement)) {
        const originalValue = originalElement[key];
        if (typeof csvValue === 'string' && (csvValue === 'true' || csvValue === 'false'))
          if (typeof originalValue === 'boolean') typedElement[key] = csvValue === 'true';
      }
    }

    return typedElement;
  });
}

function mergeElementsIntoJson(
  existingJson: Record<string, unknown>,
  elements: FormElement[]
): Record<string, unknown> {
  const originalElements = Array.isArray(existingJson.elements) ? (existingJson.elements as FormElement[]) : [];
  const typedElements = preserveElementTypes(elements, originalElements);

  const merged: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(existingJson)) {
    merged[key] = key === 'elements' ? typedElements : value;
  }
  return merged;
}

async function loadAndValidateJson(jsonPath: string): Promise<Record<string, unknown>> {
  const jsonFileName = path.basename(jsonPath);
  let content: string;
  try {
    content = await fs.promises.readFile(jsonPath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      throw new Error(messages.getMessage('error.jsonNotFound', [jsonFileName]));
    throw new Error(messages.getMessage('error.jsonReadFailed', [jsonFileName, formatErrorMessage(error)]));
  }

  let existingJson: Record<string, unknown>;
  try {
    existingJson = JSON.parse(content) as Record<string, unknown>;
  } catch (error) {
    throw new Error(messages.getMessage('error.jsonInvalid', [jsonFileName, formatErrorMessage(error)]));
  }

  if (typeof existingJson !== 'object' || existingJson === null || Array.isArray(existingJson))
    throw new Error(messages.getMessage('error.jsonNotObject', [jsonFileName]));

  return existingJson;
}

async function processCsvFile(filePath: string): Promise<ProcessResult> {
  const fileName = path.basename(filePath);

  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    const rows = parseCsvRows(content);

    if (rows.length < 2) throw new Error(messages.getMessage('error.noDataRows'));

    const headers = rows[0];
    const elements: FormElement[] = [];

    for (let i = 1; i < rows.length; i++) {
      elements.push(parseElementRow(rows[i], headers));
    }

    const jsonPath = filePath.replace(/\.csv$/i, '.json');
    const existingJson = await loadAndValidateJson(jsonPath);
    const mergedJson = mergeElementsIntoJson(existingJson, elements);

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
