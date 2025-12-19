import {
  arrayTransformer,
  booleanTransformer,
  jsonTransformer,
  numberTransformer,
  stringTransformer,
  type Transformer,
} from './Transformers.js';

const elementKeys = [
  { key: 'id', transformer: stringTransformer },
  { key: 'note', transformer: jsonTransformer },
  { key: 'height', transformer: numberTransformer },
  { key: 'label', transformer: stringTransformer },
  { key: 'style', transformer: stringTransformer },
  { key: 'apiName', transformer: stringTransformer },
  { key: 'options', transformer: arrayTransformer },
  { key: 'formula', transformer: stringTransformer },
  { key: 'elemType', transformer: stringTransformer },
  { key: 'required', transformer: booleanTransformer },
  { key: 'defaultValueFormula', transformer: stringTransformer },
  { key: 'parentId', transformer: stringTransformer },
  { key: 'setToNow', transformer: booleanTransformer },
  { key: 'inputType', transformer: stringTransformer },
  { key: 'magicFill', transformer: jsonTransformer },
  { key: 'backgroundImage', transformer: stringTransformer },
  { key: 'mobileApp', transformer: jsonTransformer },
  { key: 'sectionId', transformer: stringTransformer },
  { key: 'addOptions', transformer: arrayTransformer },
  { key: 'visibility', transformer: stringTransformer },
  { key: 'defaultValue', transformer: jsonTransformer },
  { key: 'richDescription', transformer: stringTransformer },
  { key: 'validations', transformer: arrayTransformer },
  { key: 'annotation_config', transformer: stringTransformer },
  { key: 'labelFormula', transformer: stringTransformer },
  { key: 'sfMapping', transformer: arrayTransformer },
  { key: 'calendarFormat', transformer: stringTransformer },
  { key: 'setToNowButton', transformer: booleanTransformer },
  { key: 'sfFieldUpdate', transformer: arrayTransformer },
  { key: 'type', transformer: stringTransformer },
  { key: 'codeScan', transformer: jsonTransformer },
  { key: 'floatingLabel', transformer: booleanTransformer },
  { key: 'sfRecordMapping', transformer: arrayTransformer },
  { key: 'sfPullRecordMapping', transformer: arrayTransformer },
  { key: 'autocomplete', transformer: stringTransformer },
  { key: 'placeholder', transformer: stringTransformer },
  { key: 'disabledFormula', transformer: stringTransformer },
  { key: 'allowBlankUpdate', transformer: booleanTransformer },
  { key: 'preserveRelaunchValueFormula', transformer: stringTransformer },
  { key: 'max', transformer: numberTransformer },
  { key: 'min', transformer: numberTransformer },
  { key: 'decimal', transformer: booleanTransformer },
  { key: 'disabled', transformer: booleanTransformer },
  { key: 'description', transformer: stringTransformer },
  { key: 'info', transformer: stringTransformer },
  { key: 'columnLabels', transformer: arrayTransformer },
  { key: 'sortable', transformer: booleanTransformer },
  { key: 'addFormula', transformer: stringTransformer },
  { key: 'deleteFormula', transformer: stringTransformer },
  { key: 'size', transformer: stringTransformer },
  { key: 'readonly', transformer: booleanTransformer },
  { key: 'step', transformer: numberTransformer },
] as const satisfies ReadonlyArray<Readonly<{ key: string; transformer: Transformer }>>;

export const elementKeyOrder: readonly string[] = elementKeys.map((d) => d.key);

function getTransformer(header: string): Transformer {
  const keyDef = elementKeys.find((d) => d.key === header);
  if (!keyDef) throw new Error(`Unknown key "${header}"`);
  return keyDef.transformer;
}

export function parseCell(header: string, rawValue: string): unknown {
  return getTransformer(header).parse(rawValue);
}

export function serializeCell(header: string, value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (value === '') return '""';
  return getTransformer(header).serialize(value);
}
