import { expect } from 'chai';
import { isJsonEqual, createSafeFilename } from '../../src/helpers/utils.js';

describe('Utils', () => {
  describe('isJsonEqual function', () => {
    it('should return true when JSONs are identical', () => {
      const obj1 = {
        name: 'Test Form',
        uuid: '12345',
        submit: { label: 'Submit' },
        elements: [
          { id: '1', label: 'Question 1', elemType: 'text' },
          { id: '2', label: 'Question 2', elemType: 'question' },
        ],
      };
      const obj2 = {
        name: 'Test Form',
        uuid: '12345',
        submit: { label: 'Submit' },
        elements: [
          { id: '1', label: 'Question 1', elemType: 'text' },
          { id: '2', label: 'Question 2', elemType: 'question' },
        ],
      };

      expect(isJsonEqual(obj1, obj2)).to.be.true;
    });

    it('should return false when JSONs have different content', () => {
      const obj1 = {
        name: 'Test Form',
        uuid: '12345',
        submit: { label: 'Submit' },
        elements: [{ id: '1', label: 'Question 1', elemType: 'text' }],
      };
      const obj2 = {
        name: 'Test Form',
        uuid: '12345',
        submit: { label: 'Submit' },
        elements: [
          { id: '1', label: 'Question 1', elemType: 'text' },
          { id: '2', label: 'Question 2', elemType: 'question' },
        ],
      };

      expect(isJsonEqual(obj1, obj2)).to.be.false;
    });

    it('should return false when JSONs have different UUIDs but same content', () => {
      const obj1 = {
        name: 'Test Form',
        uuid: '12345',
        submit: { label: 'Submit' },
        elements: [{ id: '1', label: 'Question 1', elemType: 'text' }],
      };
      const obj2 = {
        name: 'Test Form',
        uuid: '67890',
        submit: { label: 'Submit' },
        elements: [{ id: '1', label: 'Question 1', elemType: 'text' }],
      };

      expect(isJsonEqual(obj1, obj2)).to.be.false;
    });

    it('should return true for identical primitive values', () => {
      expect(isJsonEqual('test', 'test')).to.be.true;
      expect(isJsonEqual(123, 123)).to.be.true;
      expect(isJsonEqual(true, true)).to.be.true;
      expect(isJsonEqual(null, null)).to.be.true;
    });

    it('should return false for different primitive values', () => {
      expect(isJsonEqual('test', 'different')).to.be.false;
      expect(isJsonEqual(123, 456)).to.be.false;
      expect(isJsonEqual(true, false)).to.be.false;
      expect(isJsonEqual(null, undefined)).to.be.false;
    });

    it('should handle empty objects and arrays', () => {
      expect(isJsonEqual({}, {})).to.be.true;
      expect(isJsonEqual([], [])).to.be.true;
      expect(isJsonEqual({}, [])).to.be.false;
    });

    it('should handle nested objects and arrays', () => {
      const obj1 = {
        level1: {
          level2: {
            level3: ['a', 'b', { nested: true }],
          },
        },
      };
      const obj2 = {
        level1: {
          level2: {
            level3: ['a', 'b', { nested: true }],
          },
        },
      };

      expect(isJsonEqual(obj1, obj2)).to.be.true;
    });

    it('should handle undefined values', () => {
      expect(isJsonEqual(undefined, undefined)).to.be.true;
      expect(isJsonEqual(undefined, null)).to.be.false;
      expect(isJsonEqual(undefined, {})).to.be.false;
    });
  });

  describe('createSafeFilename function', () => {
    it('should create safe filename for simple names', () => {
      const result = createSafeFilename('TestForm');
      expect(result).to.equal('TestForm-9c4472b6');
    });

    it('should replace special characters with underscores', () => {
      const result = createSafeFilename('Test-Form@2024');
      expect(result).to.equal('Test_Form_2024-7ba0b8af');
    });

    it('should handle spaces and multiple special characters', () => {
      const result = createSafeFilename('My Test Form (v1.0)');
      expect(result).to.equal('My_Test_Form__v1_0_-577aa3f7');
    });

    it('should handle unicode characters', () => {
      const result = createSafeFilename('Formé-ç-ñ');
      expect(result).to.equal('Form_____-b0925a28');
    });

    it('should handle empty string', () => {
      const result = createSafeFilename('');
      expect(result).to.equal('-d41d8cd9');
    });

    it('should handle only special characters', () => {
      const result = createSafeFilename('!@#$%^&*()');
      expect(result).to.equal('__________-05b28d17');
    });

    it('should handle numbers and letters only', () => {
      const result = createSafeFilename('Form123');
      expect(result).to.equal('Form123-daf38af8');
    });

    it('should generate consistent hash for same input', () => {
      const input = 'Test Form';
      const result1 = createSafeFilename(input);
      const result2 = createSafeFilename(input);
      expect(result1).to.equal(result2);
    });

    it('should generate different hashes for different inputs', () => {
      const result1 = createSafeFilename('Form1');
      const result2 = createSafeFilename('Form2');
      expect(result1).to.not.equal(result2);
    });

    it('should handle very long names', () => {
      const longName = 'A'.repeat(100) + '!@#$%^&*()';
      const result = createSafeFilename(longName);
      expect(result).to.equal('A'.repeat(100) + '__________-7bd888ac');
    });

    it('should handle names with only underscores', () => {
      const result = createSafeFilename('___');
      expect(result).to.equal('___-948a13f1');
    });

    it('should handle mixed case names', () => {
      const result = createSafeFilename('TestForm123');
      expect(result).to.equal('TestForm123-3c14c1ae');
    });

    it('should handle names with dots', () => {
      const result = createSafeFilename('form.v1.0');
      expect(result).to.equal('form_v1_0-ab6ea996');
    });

    it('should handle names with slashes and backslashes', () => {
      const result = createSafeFilename('form/path\\file');
      expect(result).to.equal('form_path_file-df773922');
    });
  });
});
