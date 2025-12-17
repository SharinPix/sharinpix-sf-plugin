import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { parse } from 'csv-parse/sync';
import mock from 'mock-fs';
import Json2Csv from '../../../../src/commands/sharinpix/form/json2csv.js';
import Csv2Json from '../../../../src/commands/sharinpix/form/csv2json.js';
import { elementKeyOrder } from '../../../../src/helpers/form/elementKeys.js';

function schemaHeadersFromKeys(allKeys: Set<string>): string[] {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const schemaOrder: readonly string[] = elementKeyOrder as unknown as readonly string[];
  return schemaOrder.filter((k) => k !== 'index' && allKeys.has(k));
}

describe('sharinpix form json2csv', () => {
  const $$ = new TestContext();
  let fsMocked = false;

  beforeEach(() => {
    stubSfCommandUx($$.SANDBOX);
  });

  afterEach(() => {
    $$.restore();
    if (fsMocked) {
      mock.restore();
      fsMocked = false;
    }
  });

  it('should have command metadata defined', () => {
    expect(Json2Csv.summary).to.be.a('string');
    expect(Json2Csv.description).to.be.a('string');
    expect(Json2Csv.examples).to.be.an('array');
  });

  it('should generate CSV files from JSON form definitions', async () => {
    mock({
      'sharinpix/forms': {
        'Form1.json': JSON.stringify({
          elements: [
            { id: '1', label: 'Question 1', type: 'text' },
            {
              id: '2',
              label: 'Question 2',
              type: 'select',
              options: [{ label: 'A,B' }, { label: 'C' }],
            },
          ],
        }),
        'NoElements.json': JSON.stringify({}),
        'EmptyElements.json': JSON.stringify({ elements: [] }),
        'Invalid.json': 'not-json',
      },
    });
    fsMocked = true;

    const argv: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = { bin: 'sf', name: 'test', root: '', version: '1.0.0' };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const json2csv = new Json2Csv(argv, config);
    const result = await json2csv.run();
    expect(result.name).to.equal('OK');
    expect(result.converted).to.equal(1);
    expect(result.skipped).to.equal(3);
    expect(fs.existsSync('sharinpix/forms/Form1.csv')).to.be.true;
    expect(fs.existsSync('sharinpix/forms/NoElements.csv')).to.be.false;
    expect(fs.existsSync('sharinpix/forms/EmptyElements.csv')).to.be.false;
    expect(fs.existsSync('sharinpix/forms/Invalid.csv')).to.be.false;
  });

  it('should produce identical JSON after round-trip conversion (json2csv -> csv2json)', async () => {
    const originalJson = {
      name: 'RoundTripTest',
      beta: true,
      overwriteWithNullValues: false,
      submit: {
        label: 'Submit',
      },
      elements: [
        {
          index: 0,
          id: 'elem1',
          apiName: 'field1',
          elemType: 'question',
          label: 'Question 1',
          disabled: true,
          required: false,
          inputType: 'string',
          parentId: 'parent1',
          sectionId: 'section1',
        },
        {
          index: 1,
          id: 'elem2',
          elemType: 'question',
          label: 'Question 2',
          required: true,
          inputType: 'number',
          decimal: true,
          options: [
            { label: 'Option A', value: 'a' },
            { label: 'Option B', value: 'b' },
          ],
        },
      ],
      enableSaveButton: true,
      pdfLinkOnSubmit: false,
    };

    mock({
      'sharinpix/forms': {
        'RoundTripTest.json': JSON.stringify(originalJson),
      },
    });
    fsMocked = true;

    const argv: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = { bin: 'sf', name: 'test', root: '', version: '1.0.0' };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const json2csv = new Json2Csv(argv, config);
    const csvResult = await json2csv.run();
    expect(csvResult.name).to.equal('OK');
    expect(csvResult.converted).to.equal(1);
    expect(csvResult.skipped).to.equal(0);
    expect(fs.existsSync('sharinpix/forms/RoundTripTest.csv')).to.be.true;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const csv2json = new Csv2Json(argv, config);
    const jsonResult = await csv2json.run();
    expect(jsonResult.name).to.equal('OK');
    expect(jsonResult.converted).to.equal(1);
    expect(jsonResult.skipped).to.equal(0);

    const updatedJson = JSON.parse(fs.readFileSync('sharinpix/forms/RoundTripTest.json', 'utf8')) as unknown;
    expect(updatedJson).to.deep.equal(originalJson);
  });

  it('should skip invalid JSON files, invalid elements shapes, and invalid element values', async () => {
    mock({
      'sharinpix/forms': {
        'Valid.json': JSON.stringify({
          name: 'Valid',
          elements: [{ id: '1', required: true, options: [] }],
        }),
        'ElementsNotArray.json': JSON.stringify({ elements: { bad: true } }),
        'ElementsNull.json': JSON.stringify({ elements: null }),
        'RootArray.json': JSON.stringify([]),
        'WrongType.json': JSON.stringify({ elements: [{ id: '1', required: 'true' }] }),
      },
    });
    fsMocked = true;

    const argv: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = { bin: 'sf', name: 'test', root: '', version: '1.0.0' };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const json2csv = new Json2Csv(argv, config);
    const logs: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    (json2csv as any).log = (msg: string) => logs.push(msg);
    const result = await json2csv.run();
    expect(result.name).to.equal('OK');
    expect(result.converted).to.equal(1);
    expect(result.skipped).to.equal(4);
    expect(fs.existsSync('sharinpix/forms/Valid.csv')).to.be.true;
    expect(fs.existsSync('sharinpix/forms/ElementsNotArray.csv')).to.be.false;
    expect(fs.existsSync('sharinpix/forms/ElementsNull.csv')).to.be.false;
    expect(fs.existsSync('sharinpix/forms/RootArray.csv')).to.be.false;
    expect(fs.existsSync('sharinpix/forms/WrongType.csv')).to.be.false;

    const csvContent = fs.readFileSync('sharinpix/forms/Valid.csv', 'utf8');
    expect(csvContent).to.include('id,options,required');
    expect(csvContent).to.include('1,[],true');
    expect(logs.join('\n')).to.include('Skipped WrongType.json:');
  });

  it('should ignore unknown keys when generating CSV', async () => {
    mock({
      'sharinpix/forms': {
        'UnknownKey.json': JSON.stringify({ elements: [{ id: '1', customKey: 'x', label: 'Hello' }] }),
      },
    });
    fsMocked = true;

    const argv: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = { bin: 'sf', name: 'test', root: '', version: '1.0.0' };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const json2csv = new Json2Csv(argv, config);
    const result = await json2csv.run();
    expect(result.name).to.equal('OK');
    expect(result.converted).to.equal(1);
    expect(result.skipped).to.equal(0);
    expect(fs.existsSync('sharinpix/forms/UnknownKey.csv')).to.be.true;

    const csvContent = fs.readFileSync('sharinpix/forms/UnknownKey.csv', 'utf8');
    expect(csvContent).to.include('id,label');
    expect(csvContent).to.not.include('customKey');
    expect(csvContent).to.include('1,Hello');
  });

  it('should keep empty-string values in the schema and write explicit "" cells', async () => {
    mock({
      'sharinpix/forms': {
        'EmptyStringMissing.json': JSON.stringify({
          name: 'EmptyStringMissing',
          elements: [
            { id: '1', required: '', placeholder: '' },
            { id: '2', required: true, placeholder: '' },
          ],
        }),
      },
    });
    fsMocked = true;

    const argv: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = { bin: 'sf', name: 'test', root: '', version: '1.0.0' };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const json2csv = new Json2Csv(argv, config);
    const result = await json2csv.run();
    expect(result.name).to.equal('OK');
    expect(result.converted).to.equal(1);
    expect(result.skipped).to.equal(0);
    expect(fs.existsSync('sharinpix/forms/EmptyStringMissing.csv')).to.be.true;

    const csvContent = fs.readFileSync('sharinpix/forms/EmptyStringMissing.csv', 'utf8');
    const rows = parse(csvContent, {
      skipEmptyLines: true,
      relaxColumnCount: true,
      relaxQuotes: true,
    });
    const headers: string[] = rows[0] ?? [];
    const row1: string[] = rows[1] ?? [];
    const row2: string[] = rows[2] ?? [];
    const idxPlaceholder = headers.indexOf('placeholder');
    const idxRequired = headers.indexOf('required');

    expect(headers).to.include.members(['id', 'placeholder', 'required']);
    expect(row1[headers.indexOf('id')]).to.equal('1');
    expect(row1[idxPlaceholder]).to.equal('""');
    expect(row1[idxRequired]).to.equal('""');

    expect(row2[headers.indexOf('id')]).to.equal('2');
    expect(row2[idxPlaceholder]).to.equal('""');
    expect(row2[idxRequired]).to.equal('true');
  });

  it('should round-trip complex typed values (booleans, numbers, objects, arrays, and quoting)', async () => {
    const originalJson = {
      name: 'RoundTripComplex',
      beta: false,
      submit: { label: 'Submit' },
      elements: [
        {
          index: 0,
          id: 'elem1',
          label: 'Question, line1\nline2',
          elemType: 'question',
          required: false,
          min: -1,
          max: 3.5,
          options: [],
          visibility: 'true',
          sfMapping: [{ Account: { field: 'Name' } }],
          validations: [{ type: 'required', message: 'Required' }],
          style: 'fold',
        },
        {
          index: 1,
          id: 'elem2',
          label: 'Simple',
          elemType: 'question',
          required: true,
          decimal: true,
          step: 0.25,
          options: [{ label: 'A', value: 'a' }],
        },
      ],
    };

    mock({
      'sharinpix/forms': {
        'RoundTripComplex.json': JSON.stringify(originalJson),
      },
    });
    fsMocked = true;

    const argv: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = { bin: 'sf', name: 'test', root: '', version: '1.0.0' };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const json2csv = new Json2Csv(argv, config);
    const csvResult = await json2csv.run();
    expect(csvResult.name).to.equal('OK');
    expect(csvResult.converted).to.equal(1);
    expect(csvResult.skipped).to.equal(0);
    expect(fs.existsSync('sharinpix/forms/RoundTripComplex.csv')).to.be.true;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const csv2json = new Csv2Json(argv, config);
    const jsonResult = await csv2json.run();
    expect(jsonResult.name).to.equal('OK');
    expect(jsonResult.converted).to.equal(1);
    expect(jsonResult.skipped).to.equal(0);

    const updatedJson = JSON.parse(fs.readFileSync('sharinpix/forms/RoundTripComplex.json', 'utf8')) as unknown;
    expect(updatedJson).to.deep.equal(originalJson);
  });

  describe('fixture roundtrips (json2csv <-> csv2json)', () => {
    const FIXTURES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
    const FIXTURES = fs
      .readdirSync(FIXTURES_DIR)
      .filter((f) => f.endsWith('.json'))
      .sort();

    for (const fixtureName of FIXTURES) {
      it(`should round-trip ${fixtureName} with no changes`, async () => {
        const fixturePath = path.join(FIXTURES_DIR, fixtureName);
        const originalJson = JSON.parse(mock.bypass(() => fs.readFileSync(fixturePath, 'utf8'))) as unknown;

        mock({
          'sharinpix/forms': {
            [fixtureName]: JSON.stringify(originalJson),
          },
        });
        fsMocked = true;

        const argv: string[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const config: any = { bin: 'sf', name: 'test', root: '', version: '1.0.0' };

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const json2csv1 = new Json2Csv(argv, config);
        const r1 = await json2csv1.run();
        expect(r1.converted).to.equal(1);
        expect(r1.skipped).to.equal(0);
        const csvPath = `sharinpix/forms/${fixtureName.replace(/\.json$/i, '.csv')}`;
        expect(fs.existsSync(csvPath)).to.be.true;

        const csvContent = fs.readFileSync(csvPath, 'utf8');
        const rows = parse(csvContent, { skipEmptyLines: true, relaxColumnCount: true, relaxQuotes: true });
        const headers: string[] = rows[0] ?? [];

        const original = originalJson as { elements?: Array<Record<string, unknown>> };
        const elements = Array.isArray(original.elements) ? original.elements : [];
        const allKeys = new Set<string>();
        for (const el of elements) {
          for (const k of Object.keys(el)) {
            if (k === 'index') continue;
            allKeys.add(k);
          }
        }
        const expectedHeaders = schemaHeadersFromKeys(allKeys);
        expect(headers).to.deep.equal(expectedHeaders);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const csv2json1 = new Csv2Json(argv, config);
        const r2 = await csv2json1.run();
        expect(r2.converted).to.equal(1);
        expect(r2.skipped).to.equal(0);

        const afterJson1 = JSON.parse(fs.readFileSync(`sharinpix/forms/${fixtureName}`, 'utf8')) as unknown;
        expect(afterJson1).to.deep.equal(originalJson);

        const after = afterJson1 as { elements?: Array<Record<string, unknown>> };
        const afterElements = Array.isArray(after.elements) ? after.elements : [];
        const before = originalJson as { elements?: Array<Record<string, unknown>> };
        const beforeElements = Array.isArray(before.elements) ? before.elements : [];

        expect(Object.keys(afterJson1 as Record<string, unknown>)).to.deep.equal(
          Object.keys(originalJson as Record<string, unknown>)
        );

        for (let idx = 0; idx < Math.min(afterElements.length, beforeElements.length); idx++) {
          expect(Object.keys(afterElements[idx] ?? {})).to.deep.equal(Object.keys(beforeElements[idx] ?? {}));
        }
      });
    }
  });
});
