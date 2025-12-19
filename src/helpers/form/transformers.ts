export type Transformer = Readonly<{
  parse: (rawValue: string) => unknown;
  serialize: (value: unknown, key: string) => string;
}>;

function validate(
  value: unknown,
  key: string,
  expectedType: string,
  typeCheck: (value: unknown) => boolean,
  serialize: (value: unknown) => string
): string {
  if (value === null || value === undefined) return '';
  if (!typeCheck(value)) {
    const error = `Cannot serialize value for key "${key}": expected ${expectedType}, got ${typeof value}`;
    throw new Error(error);
  }
  return serialize(value);
}

export const stringTransformer: Transformer = {
  parse: (rawValue: string): unknown => rawValue.trim(),
  serialize: (value: unknown, key: string): string =>
    validate(
      value,
      key,
      'string',
      (v) => typeof v === 'string',
      (v) => v as string
    ),
};

export const jsonTransformer: Transformer = {
  parse: (rawValue: string): unknown => {
    const value = rawValue.trim();
    const genericError = 'Cannot parse object value';
    try {
      if (!value.startsWith('{')) throw new Error(genericError);
      const parsed = JSON.parse(value) as unknown;
      if (typeof parsed !== 'object' || parsed === null) throw new Error(genericError);
      return parsed as Record<string, unknown>;
    } catch {
      throw new Error(genericError);
    }
  },
  serialize: (value: unknown, key: string): string =>
    validate(
      value,
      key,
      'object',
      (v) => typeof v === 'object' && v !== null && !Array.isArray(v),
      (v) => JSON.stringify(v)
    ),
};

export const arrayTransformer: Transformer = {
  parse: (rawValue: string): unknown => {
    const value = rawValue.trim();
    const genericError = 'Cannot parse array value';
    try {
      if (!value.startsWith('[')) throw new Error(genericError);
      const parsed = JSON.parse(value) as unknown;
      if (!Array.isArray(parsed)) throw new Error(genericError);
      return parsed as unknown[];
    } catch {
      throw new Error(genericError);
    }
  },
  serialize: (value: unknown, key: string): string =>
    validate(
      value,
      key,
      'array',
      (v) => Array.isArray(v),
      (v) => JSON.stringify(v)
    ),
};

export const booleanTransformer: Transformer = {
  parse: (rawValue: string): unknown => {
    const value = rawValue.trim();
    if (value === 'true') return true;
    if (value === 'false') return false;
    throw new Error(`Cannot parse boolean value: expected "true" or "false", got "${value}"`);
  },
  serialize: (value: unknown, key: string): string =>
    validate(
      value,
      key,
      'boolean',
      (v) => typeof v === 'boolean',
      (v) => String(v)
    ),
};

export const numberTransformer: Transformer = {
  parse: (rawValue: string): unknown => {
    const value = rawValue.trim();

    const numberPattern = /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/;
    const numValue = Number(value);
    if (!Number.isNaN(numValue) && Number.isFinite(numValue) && numberPattern.test(value)) return numValue;

    throw new Error(`Cannot parse number value: got "${value}"`);
  },
  serialize: (value: unknown, key: string): string =>
    validate(
      value,
      key,
      'number',
      (v) => typeof v === 'number' && Number.isFinite(v),
      (v) => String(v)
    ),
};
