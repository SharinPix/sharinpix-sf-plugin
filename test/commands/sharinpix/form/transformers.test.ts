import { expect } from 'chai';
import Csv2Json from '../../../../src/commands/sharinpix/form/csv2json.js';
import {
  arrayTransformer as arrayTransformerAny,
  booleanTransformer as booleanTransformerAny,
  jsonTransformer as jsonTransformerAny,
  numberTransformer as numberTransformerAny,
  stringTransformer as stringTransformerAny,
} from '../../../../src/helpers/form/transformers.js';
import {
  parseCell as parseCellAny,
  serializeCell as serializeCellAny,
} from '../../../../src/helpers/form/elementKeys.js';

// These imports are resolved at runtime via TS->ESM, but ESLint sometimes treats them as `any`.
// Add explicit local typings so the tests remain type-safe and satisfy no-unsafe-* rules.
type Transformer = Readonly<{
  parse: (rawValue: string) => unknown;
  serialize: (value: unknown) => string;
}>;

type ParseCell = (header: string, rawValue: string, context?: { row?: number; column?: number }) => unknown;
type SerializeCell = (header: string, value: unknown) => string;

const stringTransformer = stringTransformerAny as unknown as Transformer;
const booleanTransformer = booleanTransformerAny as unknown as Transformer;
const numberTransformer = numberTransformerAny as unknown as Transformer;
const jsonTransformer = jsonTransformerAny as unknown as Transformer;
const arrayTransformer = arrayTransformerAny as unknown as Transformer;

const parseCell = parseCellAny as unknown as ParseCell;
const serializeCell = serializeCellAny as unknown as SerializeCell;

describe('transformers', () => {
  it('should have command metadata defined', () => {
    expect(Csv2Json.description).to.be.a('string');
    expect(Csv2Json.examples).to.be.an('array');
  });

  describe('stringTransformer', () => {
    it('should preserve raw values on parse (no trimming)', () => {
      expect(stringTransformer.parse('  hello  ')).to.equal('  hello  ');
      expect(stringTransformer.parse('\n\t hello \r\n')).to.equal('\n\t hello \r\n');
      expect(stringTransformer.parse('   ')).to.equal('   ');
      expect(stringTransformer.parse('')).to.equal('');
    });

    it('should serialize only strings', () => {
      expect(stringTransformer.serialize('abc')).to.equal('abc');
      expect(stringTransformer.serialize('')).to.equal('');
      expect(() => stringTransformer.serialize(null)).to.throw('Cannot serialize string');
      expect(() => stringTransformer.serialize(undefined)).to.throw('Cannot serialize string');
      expect(() => stringTransformer.serialize(123)).to.throw('Cannot serialize string');
      expect(() => stringTransformer.serialize(false)).to.throw('Cannot serialize string');
    });
  });

  describe('booleanTransformer', () => {
    it('should parse booleans only when exactly "true" or "false"', () => {
      expect(() => booleanTransformer.parse(' true ')).to.throw(
        'Cannot parse boolean value: expected "true" or "false", got " true "'
      );
      expect(() => booleanTransformer.parse('\nfalse\t')).to.throw(
        'Cannot parse boolean value: expected "true" or "false", got "\nfalse\t"'
      );
      expect(booleanTransformer.parse('false')).to.equal(false);
      expect(() => booleanTransformer.parse('   ')).to.throw(
        'Cannot parse boolean value: expected "true" or "false", got "   "'
      );
      expect(() => booleanTransformer.parse('')).to.throw(
        'Cannot parse boolean value: expected "true" or "false", got ""'
      );
    });

    it('should reject non-true/false values', () => {
      expect(() => booleanTransformer.parse(' yes ')).to.throw(
        'Cannot parse boolean value: expected "true" or "false", got " yes "'
      );
      expect(() => booleanTransformer.parse('TRUE')).to.throw(
        'Cannot parse boolean value: expected "true" or "false", got "TRUE"'
      );
    });

    it('should serialize only booleans', () => {
      expect(booleanTransformer.serialize(true)).to.equal('true');
      expect(booleanTransformer.serialize(false)).to.equal('false');
      expect(() => booleanTransformer.serialize(null)).to.throw('Cannot serialize boolean');
      expect(() => booleanTransformer.serialize(undefined)).to.throw('Cannot serialize boolean');
      expect(() => booleanTransformer.serialize('true')).to.throw('Cannot serialize boolean');
      expect(() => booleanTransformer.serialize(0)).to.throw('Cannot serialize boolean');
      // eslint-disable-next-line no-new-wrappers
      expect(() => booleanTransformer.serialize(new Boolean(true))).to.throw('Cannot serialize boolean');
    });
  });

  describe('numberTransformer', () => {
    it('should parse numbers only when the raw string matches the numeric pattern exactly', () => {
      expect(() => numberTransformer.parse(' 42 ')).to.throw('Cannot parse number value: got " 42 "');
      expect(numberTransformer.parse('001')).to.equal(1);
      expect(numberTransformer.parse('-1')).to.equal(-1);
      expect(numberTransformer.parse('3.14')).to.equal(3.14);
      expect(numberTransformer.parse('1e3')).to.equal(1000);
      expect(numberTransformer.parse('1E-3')).to.equal(0.001);
      expect(() => numberTransformer.parse('   ')).to.throw('Cannot parse number value: got "   "');
      expect(() => numberTransformer.parse('')).to.throw('Cannot parse number value: got ""');
    });

    it('should reject invalid number strings', () => {
      expect(() => numberTransformer.parse('1,000')).to.throw('Cannot parse number value: got "1,000"');
      expect(() => numberTransformer.parse('NaN')).to.throw('Cannot parse number value: got "NaN"');
      expect(() => numberTransformer.parse('Infinity')).to.throw('Cannot parse number value: got "Infinity"');
      expect(() => numberTransformer.parse('+1')).to.throw('Cannot parse number value: got "+1"');
      expect(() => numberTransformer.parse('.1')).to.throw('Cannot parse number value: got ".1"');
      expect(() => numberTransformer.parse('1.')).to.throw('Cannot parse number value: got "1."');
      expect(() => numberTransformer.parse('1_000')).to.throw('Cannot parse number value: got "1_000"');
    });

    it('should serialize only numbers', () => {
      expect(numberTransformer.serialize(3)).to.equal('3');
      expect(numberTransformer.serialize(3.5)).to.equal('3.5');
      expect(numberTransformer.serialize(0)).to.equal('0');
      expect(() => numberTransformer.serialize(null)).to.throw('Cannot serialize number');
      expect(() => numberTransformer.serialize(undefined)).to.throw('Cannot serialize number');
      expect(() => numberTransformer.serialize('3')).to.throw('Cannot serialize number');
      // eslint-disable-next-line no-new-wrappers
      expect(() => numberTransformer.serialize(new Number(3))).to.throw('Cannot serialize number');
      expect(numberTransformer.serialize(Number.NaN)).to.equal('NaN');
      expect(numberTransformer.serialize(Number.POSITIVE_INFINITY)).to.equal('Infinity');
    });
  });

  describe('jsonTransformer', () => {
    it('should parse JSON using JSON.parse (no shape enforcement)', () => {
      expect(() => jsonTransformer.parse('   ')).to.throw('Cannot parse JSON value');
      expect(() => jsonTransformer.parse('')).to.throw('Cannot parse JSON value');
      expect(jsonTransformer.parse(' { "a": 1 } ')).to.deep.equal({ a: 1 });
      expect(jsonTransformer.parse('\n\t{"a":1}\r\n')).to.deep.equal({ a: 1 });
    });

    it('should allow any valid JSON value and reject invalid JSON', () => {
      expect(jsonTransformer.parse('[1, 2, 3]')).to.deep.equal([1, 2, 3]);
      expect(jsonTransformer.parse('"hello"')).to.equal('hello');
      expect(jsonTransformer.parse('123')).to.equal(123);
      expect(jsonTransformer.parse('true')).to.equal(true);
      expect(jsonTransformer.parse('null')).to.equal(null);
      expect(jsonTransformer.parse('[]')).to.deep.equal([]);

      for (const raw of ['hello', '{']) {
        expect(() => jsonTransformer.parse(raw)).to.throw('Cannot parse JSON value');
      }
    });

    it('should serialize any JSON-serializable value (except undefined)', () => {
      expect(jsonTransformer.serialize({ a: 1 })).to.equal('{"a":1}');
      expect(jsonTransformer.serialize({})).to.equal('{}');
      expect(jsonTransformer.serialize([])).to.equal('[]');
      expect(jsonTransformer.serialize('hello')).to.equal('"hello"');
      expect(jsonTransformer.serialize(123)).to.equal('123');
      expect(jsonTransformer.serialize(true)).to.equal('true');
      expect(jsonTransformer.serialize(null)).to.equal('null');
      expect(() => jsonTransformer.serialize(undefined)).to.throw('Cannot serialize undefined JSON value');
    });
  });

  describe('arrayTransformer', () => {
    it('should parse JSON arrays and treat empty as empty', () => {
      expect(() => arrayTransformer.parse('   ')).to.throw('Cannot parse array value');
      expect(() => arrayTransformer.parse('')).to.throw('Cannot parse array value');
      // parse requires the raw string to start with '[' (no trimming)
      expect(() => arrayTransformer.parse(' [1, 2, 3] ')).to.throw('Cannot parse array value');
      expect(() => arrayTransformer.parse('\n\t[{"a":1}]\r\n')).to.throw('Cannot parse array value');
      expect(arrayTransformer.parse('[1, 2, 3]')).to.deep.equal([1, 2, 3]);
      expect(arrayTransformer.parse('[{"a":1}]')).to.deep.equal([{ a: 1 }]);
      expect(arrayTransformer.parse('[]')).to.deep.equal([]);
    });

    it('should reject objects, non-array JSON values, and malformed JSON with a generic error', () => {
      for (const raw of ['{"a":1}', '{ "a": 1 }', '"hello"', '123', 'true', 'null', 'hello', '[']) {
        expect(() => arrayTransformer.parse(raw)).to.throw('Cannot parse array value');
      }
    });

    it('should serialize only arrays', () => {
      expect(arrayTransformer.serialize([{ a: 1 }])).to.equal('[{"a":1}]');
      expect(arrayTransformer.serialize([])).to.equal('[]');
      expect(() => arrayTransformer.serialize(null)).to.throw('Cannot serialize array');
      expect(() => arrayTransformer.serialize(undefined)).to.throw('Cannot serialize array');
      expect(() => arrayTransformer.serialize({ a: 1 })).to.throw('Cannot serialize array');
      expect(() => arrayTransformer.serialize('[]')).to.throw('Cannot serialize array');
      expect(() => arrayTransformer.serialize(123)).to.throw('Cannot serialize array');
    });
  });

  describe('element key parse/serialize wrappers', () => {
    // eslint-disable-next-line no-console
    const originalConsoleError = console.error;
    beforeEach(() => {
      // eslint-disable-next-line no-console
      console.error = () => undefined;
    });
    afterEach(() => {
      // eslint-disable-next-line no-console
      console.error = originalConsoleError;
    });

    it('parseCell should include row/column context in unknown-key errors', () => {
      // parseCell does not add context today
      expect(() => parseCell('customKey', '{"a":1}', { row: 2, column: 5 })).to.throw('Unknown key "customKey"');
    });

    it('parseCell should wrap transformer parse errors with key + context', () => {
      // parseCell does not wrap errors today
      expect(() => parseCell('required', 'yes', { row: 3, column: 4 })).to.throw(
        'Cannot parse boolean value: expected "true" or "false", got "yes"'
      );
    });

    it('serializeCell should error on unknown keys', () => {
      expect(() => serializeCell('customKey', 'anything')).to.throw('Unknown key "customKey"');
    });

    it('serializeCell should wrap transformer serialize errors with key', () => {
      expect(() => serializeCell('max', 'not-a-number')).to.throw('Cannot serialize number');
    });
  });
});
