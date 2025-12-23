import {
  arrayTransformer,
  booleanTransformer,
  jsonTransformer,
  numberTransformer,
  stringTransformer,
  type Transformer,
} from './transformers.js';

const elementKeys = [
  { key: 'id', transformer: stringTransformer },
  { key: 'index', transformer: numberTransformer },
  { key: 'label', transformer: stringTransformer },
  { key: 'type', transformer: stringTransformer },
  { key: 'elemType', transformer: stringTransformer },
  { key: 'richDescription', transformer: stringTransformer },
  { key: 'info', transformer: stringTransformer },
  { key: 'apiName', transformer: stringTransformer },
  { key: 'codeScan', transformer: jsonTransformer },
  { key: 'inputType', transformer: stringTransformer },
  { key: 'magicFill', transformer: jsonTransformer },
  { key: 'mobileApp', transformer: jsonTransformer },
  { key: 'sfMapping', transformer: arrayTransformer },
  { key: 'visibility', transformer: stringTransformer },
  { key: 'placeholder', transformer: stringTransformer },
  { key: 'validations', transformer: arrayTransformer },
  { key: 'autocomplete', transformer: stringTransformer },
  { key: 'defaultValue', transformer: stringTransformer },
  { key: 'labelFormula', transformer: stringTransformer },
  { key: 'sfFieldUpdate', transformer: arrayTransformer },
  { key: 'disabledFormula', transformer: stringTransformer },
  { key: 'allowBlankUpdate', transformer: booleanTransformer },
  { key: 'defaultValueFormula', transformer: stringTransformer },
  { key: 'preserveRelaunchValueFormula', transformer: stringTransformer },
  { key: 'max', transformer: numberTransformer },
  { key: 'min', transformer: numberTransformer },
  { key: 'decimal', transformer: booleanTransformer },
  { key: 'disabled', transformer: booleanTransformer },
  { key: 'setToNow', transformer: booleanTransformer },
  { key: 'calendarFormat', transformer: stringTransformer },
  { key: 'setToNowButton', transformer: booleanTransformer },
  { key: 'options', transformer: arrayTransformer },
  { key: 'description', transformer: stringTransformer },
  { key: 'required', transformer: booleanTransformer },
  { key: 'style', transformer: stringTransformer },
  { key: 'sfRecordMapping', transformer: arrayTransformer },
  { key: 'sfPullRecordMapping', transformer: arrayTransformer },
  { key: 'parentId', transformer: stringTransformer },
  { key: 'sectionId', transformer: stringTransformer },
  { key: 'columnLabels', transformer: arrayTransformer },
  { key: 'sortable', transformer: booleanTransformer },
  { key: 'addFormula', transformer: stringTransformer },
  { key: 'addOptions', transformer: arrayTransformer },
  { key: 'deleteFormula', transformer: stringTransformer },
  { key: 'height', transformer: numberTransformer },
  { key: 'size', transformer: numberTransformer },
  { key: 'readonly', transformer: booleanTransformer },
  { key: 'step', transformer: numberTransformer },
  { key: 'rows', transformer: numberTransformer },
  { key: 'cols', transformer: numberTransformer },
] as const satisfies ReadonlyArray<Readonly<{ key: string; transformer: Transformer }>>;

export const elementKeyOrder: readonly string[] = elementKeys.map((d) => d.key);

export function parseCell(header: string, rawValue: string, context?: { row?: number; column?: number }): unknown {
  const keyDef = elementKeys.find((d) => d.key === header);
  const locationHint = (): string => {
    const rowInfo = context?.row !== undefined ? ` at row ${context.row}` : '';
    const colInfo = context?.column !== undefined ? `, column ${context.column}` : '';
    return `${rowInfo}${colInfo}`;
  };

  if (!keyDef) {
    const error = `Unknown key "${header}"${locationHint()}`;
    // eslint-disable-next-line no-console
    console.error(error, { header, rawValue, context });
    throw new Error(error);
  }

  try {
    return keyDef.transformer.parse(rawValue);
  } catch (error) {
    const errorMsg = `Failed to parse value for key "${header}"${locationHint()}: ${
      error instanceof Error ? error.message : String(error)
    }`;
    // eslint-disable-next-line no-console
    console.error(errorMsg, { header, rawValue, context, error });
    throw new Error(errorMsg);
  }
}

export function serializeCell(header: string, value: unknown): string {
  const keyDef = elementKeys.find((d) => d.key === header);

  if (!keyDef) {
    const error = `Unknown key "${header}"`;
    // eslint-disable-next-line no-console
    console.error(error, { key: header, value });
    throw new Error(error);
  }

  try {
    return keyDef.transformer.serialize(value, header);
  } catch (error) {
    const errorMsg = `Failed to serialize value for key "${header}": ${
      error instanceof Error ? error.message : String(error)
    }`;
    // eslint-disable-next-line no-console
    console.error(errorMsg, { key: header, value, error });
    throw new Error(errorMsg);
  }
}
