import { expect } from 'chai';
import Csv2Json from '../../../../src/commands/sharinpix/form/csv2json.js';
import {
  arrayTransformer,
  booleanTransformer,
  jsonTransformer,
  numberTransformer,
  stringTransformer,
} from '../../../../src/helpers/form/transformers.js';
import { parseCell, serializeCell } from '../../../../src/helpers/form/elementKeys.js';

describe('transformers', () => {
  it('should have command metadata defined', () => {
    expect(Csv2Json.description).to.be.a('string');
    expect(Csv2Json.examples).to.be.an('array');
  });

  describe('stringTransformer', () => {
    it('should trim values on parse (including empty)', () => {
      expect(stringTransformer.parse('  hello  ')).to.equal('hello');
      expect(stringTransformer.parse('\n\t hello \r\n')).to.equal('hello');
      expect(stringTransformer.parse('   ')).to.equal('');
      expect(stringTransformer.parse('')).to.equal('');
    });

    it('should serialize strings and reject non-strings', () => {
      expect(stringTransformer.serialize('abc', 'label')).to.equal('abc');
      expect(stringTransformer.serialize('', 'label')).to.equal('');
      expect(stringTransformer.serialize(null, 'label')).to.equal('');
      expect(stringTransformer.serialize(undefined, 'label')).to.equal('');
      expect(() => stringTransformer.serialize(123, 'label')).to.throw(
        'Cannot serialize value for key "label": expected string, got number'
      );
      expect(() => stringTransformer.serialize(false, 'label')).to.throw(
        'Cannot serialize value for key "label": expected string, got boolean'
      );
    });
  });

  describe('booleanTransformer', () => {
    it('should parse booleans and treat empty as empty', () => {
      expect(booleanTransformer.parse(' true ')).to.equal(true);
      expect(booleanTransformer.parse('\nfalse\t')).to.equal(false);
      expect(booleanTransformer.parse('false')).to.equal(false);
      expect(() => booleanTransformer.parse('   ')).to.throw(
        'Cannot parse boolean value: expected "true" or "false", got ""'
      );
      expect(() => booleanTransformer.parse('')).to.throw('Cannot parse boolean value: expected "true" or "false", got ""');
    });

    it('should reject non-true/false values', () => {
      expect(() => booleanTransformer.parse(' yes ')).to.throw(
        'Cannot parse boolean value: expected "true" or "false", got "yes"'
      );
      expect(() => booleanTransformer.parse('TRUE')).to.throw(
        'Cannot parse boolean value: expected "true" or "false", got "TRUE"'
      );
    });

    it('should serialize booleans and reject non-booleans', () => {
      expect(booleanTransformer.serialize(true, 'required')).to.equal('true');
      expect(booleanTransformer.serialize(false, 'required')).to.equal('false');
      expect(booleanTransformer.serialize(null, 'required')).to.equal('');
      expect(booleanTransformer.serialize(undefined, 'required')).to.equal('');
      expect(() => booleanTransformer.serialize('true', 'required')).to.throw(
        'Cannot serialize value for key "required": expected boolean, got string'
      );
      expect(() => booleanTransformer.serialize(0, 'required')).to.throw(
        'Cannot serialize value for key "required": expected boolean, got number'
      );
      // eslint-disable-next-line no-new-wrappers
      expect(() => booleanTransformer.serialize(new Boolean(true), 'required')).to.throw(
        'Cannot serialize value for key "required": expected boolean, got object'
      );
    });
  });

  describe('numberTransformer', () => {
    it('should parse numbers (including decimals and scientific notation) and treat empty as empty', () => {
      expect(numberTransformer.parse(' 42 ')).to.equal(42);
      expect(numberTransformer.parse('001')).to.equal(1);
      expect(numberTransformer.parse('-1')).to.equal(-1);
      expect(numberTransformer.parse('3.14')).to.equal(3.14);
      expect(numberTransformer.parse('1e3')).to.equal(1000);
      expect(numberTransformer.parse('1E-3')).to.equal(0.001);
      expect(() => numberTransformer.parse('   ')).to.throw('Cannot parse number value: got ""');
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

    it('should serialize numbers and reject non-numbers', () => {
      expect(numberTransformer.serialize(3, 'rows')).to.equal('3');
      expect(numberTransformer.serialize(3.5, 'rows')).to.equal('3.5');
      expect(numberTransformer.serialize(0, 'rows')).to.equal('0');
      expect(numberTransformer.serialize(null, 'rows')).to.equal('');
      expect(numberTransformer.serialize(undefined, 'rows')).to.equal('');
      expect(() => numberTransformer.serialize('3', 'rows')).to.throw(
        'Cannot serialize value for key "rows": expected number, got string'
      );
      // eslint-disable-next-line no-new-wrappers
      expect(() => numberTransformer.serialize(new Number(3), 'rows')).to.throw(
        'Cannot serialize value for key "rows": expected number, got object'
      );
      expect(() => numberTransformer.serialize(Number.NaN, 'rows')).to.throw(
        'Cannot serialize value for key "rows": expected number, got number'
      );
      expect(() => numberTransformer.serialize(Number.POSITIVE_INFINITY, 'rows')).to.throw(
        'Cannot serialize value for key "rows": expected number, got number'
      );
    });
  });

  describe('jsonTransformer', () => {
    it('should parse JSON objects and treat empty as empty', () => {
      expect(() => jsonTransformer.parse('   ')).to.throw('Cannot parse object value');
      expect(() => jsonTransformer.parse('')).to.throw('Cannot parse object value');

      expect(jsonTransformer.parse(' { "a": 1 } ')).to.deep.equal({ a: 1 });
      expect(jsonTransformer.parse('\n\t{"a":1}\r\n')).to.deep.equal({ a: 1 });
    });

    it('should reject arrays, non-object JSON values, and malformed JSON with a generic error', () => {
      for (const raw of ['[1, 2, 3]', '"hello"', '123', 'true', 'null', 'hello', '{', '[]']) {
        expect(() => jsonTransformer.parse(raw)).to.throw('Cannot parse object value');
      }
    });

    it('should serialize objects and reject non-objects', () => {
      expect(jsonTransformer.serialize({ a: 1 }, 'codeScan')).to.equal('{"a":1}');
      expect(jsonTransformer.serialize({}, 'codeScan')).to.equal('{}');
      expect(jsonTransformer.serialize(null, 'codeScan')).to.equal('');
      expect(jsonTransformer.serialize(undefined, 'codeScan')).to.equal('');
      expect(() => jsonTransformer.serialize([], 'codeScan')).to.throw(
        'Cannot serialize value for key "codeScan": expected object, got object'
      );
      expect(() => jsonTransformer.serialize('{"a":1}', 'codeScan')).to.throw(
        'Cannot serialize value for key "codeScan": expected object, got string'
      );
      expect(() => jsonTransformer.serialize(123, 'codeScan')).to.throw(
        'Cannot serialize value for key "codeScan": expected object, got number'
      );
    });
  });

  describe('arrayTransformer', () => {
    it('should parse JSON arrays and treat empty as empty', () => {
      expect(() => arrayTransformer.parse('   ')).to.throw('Cannot parse array value');
      expect(() => arrayTransformer.parse('')).to.throw('Cannot parse array value');
      expect(arrayTransformer.parse(' [1, 2, 3] ')).to.deep.equal([1, 2, 3]);
      expect(arrayTransformer.parse('\n\t[{"a":1}]\r\n')).to.deep.equal([{ a: 1 }]);
      expect(arrayTransformer.parse('[]')).to.deep.equal([]);
    });

    it('should reject objects, non-array JSON values, and malformed JSON with a generic error', () => {
      for (const raw of ['{"a":1}', '{ "a": 1 }', '"hello"', '123', 'true', 'null', 'hello', '[']) {
        expect(() => arrayTransformer.parse(raw)).to.throw('Cannot parse array value');
      }
    });

    it('should serialize arrays and reject non-arrays', () => {
      expect(arrayTransformer.serialize([{ a: 1 }], 'options')).to.equal('[{"a":1}]');
      expect(arrayTransformer.serialize([], 'options')).to.equal('[]');
      expect(arrayTransformer.serialize(null, 'options')).to.equal('');
      expect(arrayTransformer.serialize(undefined, 'options')).to.equal('');
      expect(() => arrayTransformer.serialize({ a: 1 }, 'options')).to.throw(
        'Cannot serialize value for key "options": expected array, got object'
      );
      expect(() => arrayTransformer.serialize('[]', 'options')).to.throw(
        'Cannot serialize value for key "options": expected array, got string'
      );
      expect(() => arrayTransformer.serialize(123, 'options')).to.throw(
        'Cannot serialize value for key "options": expected array, got number'
      );
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
      expect(() => parseCell('customKey', '{"a":1}', { row: 2, column: 5 })).to.throw(
        'Unknown key "customKey" at row 2, column 5'
      );
    });

    it('parseCell should wrap transformer parse errors with key + context', () => {
      expect(() => parseCell('required', 'yes', { row: 3, column: 4 })).to.throw(
        'Failed to parse value for key "required" at row 3, column 4: Cannot parse boolean value: expected "true" or "false", got "yes"'
      );
    });

    it('serializeCell should error on unknown keys', () => {
      expect(() => serializeCell('customKey', 'anything')).to.throw('Unknown key "customKey"');
    });

    it('serializeCell should wrap transformer serialize errors with key', () => {
      expect(() => serializeCell('rows', '3')).to.throw(
        'Failed to serialize value for key "rows": Cannot serialize value for key "rows": expected number, got string'
      );
    });
  });
});
