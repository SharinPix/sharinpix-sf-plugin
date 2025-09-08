import { expect } from 'chai';
import { isJsonEqual } from '../../src/helpers/json-utils.js';

describe('jsonUtils', () => {
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
});
