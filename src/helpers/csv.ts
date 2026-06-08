import { parse } from 'csv-parse/sync';

export const CSV_PARSE_OPTIONS = {
  skipEmptyLines: true,
  relaxColumnCount: true,
  relaxQuotes: true,
} as const;

function isStringMatrix(value: unknown): value is string[][] {
  return (
    Array.isArray(value) &&
    value.every((row) => Array.isArray(row) && row.every((cell) => typeof cell === 'string'))
  );
}

export function parseCsv(content: string, options = CSV_PARSE_OPTIONS): string[][] {
  const result: unknown = parse(content, options);
  if (!isStringMatrix(result)) {
    throw new Error('Failed to parse CSV content');
  }
  return result;
}
