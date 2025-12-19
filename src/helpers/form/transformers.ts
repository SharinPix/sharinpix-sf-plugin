export type Transformer = Readonly<{
  parse: (rawValue: string) => unknown;
  serialize: (value: unknown) => string;
}>;

export const stringTransformer: Transformer = {
  parse: (rawValue: string): unknown => rawValue,
  serialize: (value: unknown): string => {
    if (typeof value !== 'string')
      throw new Error(`Cannot serialize string: got value of type "${typeof value}" with value "${String(value)}"`);
    return value;
  },
};

export const jsonTransformer: Transformer = {
  parse: (rawValue: string): unknown => {
    try {
      const parsed = JSON.parse(rawValue) as unknown;
      return parsed;
    } catch (error) {
      throw new Error(`Cannot parse JSON value: ${error instanceof Error ? error.message : String(error)}`, {
        cause: error,
      });
    }
  },
  serialize: (value: unknown): string => {
    if (value === undefined) throw new Error('Cannot serialize undefined JSON value');
    try {
      return JSON.stringify(value);
    } catch (error) {
      throw new Error(`Cannot serialize JSON value: ${error instanceof Error ? error.message : String(error)}`, {
        cause: error,
      });
    }
  },
};

export const arrayTransformer: Transformer = {
  parse: (rawValue: string): unknown => {
    const genericError = 'Cannot parse array value';
    try {
      if (!rawValue.startsWith('[')) throw new Error(genericError);
      const parsed = JSON.parse(rawValue) as unknown;
      if (!Array.isArray(parsed)) throw new Error(genericError);
      return parsed as unknown[];
    } catch {
      throw new Error(genericError);
    }
  },
  serialize: (value: unknown): string => {
    if (!Array.isArray(value))
      throw new Error(`Cannot serialize array: got value of type "${typeof value}" with value "${String(value)}"`);
    return JSON.stringify(value);
  },
};

export const booleanTransformer: Transformer = {
  parse: (rawValue: string): unknown => {
    if (rawValue === 'true') return true;
    if (rawValue === 'false') return false;
    throw new Error(`Cannot parse boolean value: expected "true" or "false", got "${rawValue}"`);
  },
  serialize: (value: unknown): string => {
    if (typeof value !== 'boolean')
      throw new Error(`Cannot serialize boolean: got value of type "${typeof value}" with value "${String(value)}"`);
    return value ? 'true' : 'false';
  },
};

export const numberTransformer: Transformer = {
  parse: (rawValue: string): unknown => {
    const numberPattern = /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/;
    const numValue = Number(rawValue);
    if (!Number.isNaN(numValue) && Number.isFinite(numValue) && numberPattern.test(rawValue)) return numValue;
    throw new Error(`Cannot parse number value: got "${rawValue}"`);
  },
  serialize: (value: unknown): string => {
    if (typeof value !== 'number') {
      throw new Error(`Cannot serialize number: got value of type "${typeof value}" with value "${String(value)}"`);
    }
    return value.toString();
  },
};
