import fs from 'node:fs';
import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import mock from 'mock-fs';
import Json2Csv from '../../../../src/commands/sharinpix/form/json2csv.js';
import Csv2Json from '../../../../src/commands/sharinpix/form/csv2json.js';

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
    expect(fs.existsSync('sharinpix/forms/Form1.csv')).to.be.true;
    expect(fs.existsSync('sharinpix/forms/NoElements.csv')).to.be.false;
    expect(fs.existsSync('sharinpix/forms/EmptyElements.csv')).to.be.false;
    expect(fs.existsSync('sharinpix/forms/Invalid.csv')).to.be.false;

    const csvContent = fs.readFileSync('sharinpix/forms/Form1.csv', 'utf8');
    const lines = csvContent.split('\n').filter((line) => line.trim() !== '');
    const [header, ...rows] = lines;
    expect(header).to.equal('id,label,type,options');
    const rowText = rows.join('\n');
    expect(rowText).to.include('1,Question 1,text,');
    expect(rowText).to.include('2,Question 2,select,');
    expect(rowText).to.include('A,B');
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
    expect(fs.existsSync('sharinpix/forms/RoundTripTest.csv')).to.be.true;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const csv2json = new Csv2Json(argv, config);
    const jsonResult = await csv2json.run();
    expect(jsonResult.name).to.equal('OK');
    expect(fs.existsSync('sharinpix/forms/RoundTripTest.json')).to.be.true;

    const convertedJsonContent = fs.readFileSync('sharinpix/forms/RoundTripTest.json', 'utf8');
    const convertedJson = JSON.parse(convertedJsonContent) as typeof originalJson;
    expect(convertedJson).to.deep.equal(originalJson);
  });

  it('should skip invalid JSON files, invalid elements shapes, and invalid element values', async () => {
    mock({
      'sharinpix/forms': {
        'Valid.json': JSON.stringify({
          name: 'Valid',
          elements: [{ id: '1', required: true, rows: 0, options: [] }],
        }),
        'ElementsNotArray.json': JSON.stringify({ elements: { bad: true } }),
        'ElementsNull.json': JSON.stringify({ elements: null }),
        'RootArray.json': JSON.stringify([]),
        'UnknownKey.json': JSON.stringify({ elements: [{ id: '1', customKey: 'x' }] }),
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
    expect(result.skipped).to.equal(5);
    expect(fs.existsSync('sharinpix/forms/Valid.csv')).to.be.true;
    expect(fs.existsSync('sharinpix/forms/ElementsNotArray.csv')).to.be.false;
    expect(fs.existsSync('sharinpix/forms/ElementsNull.csv')).to.be.false;
    expect(fs.existsSync('sharinpix/forms/RootArray.csv')).to.be.false;
    expect(fs.existsSync('sharinpix/forms/UnknownKey.csv')).to.be.false;
    expect(fs.existsSync('sharinpix/forms/WrongType.csv')).to.be.false;

    const csvContent = fs.readFileSync('sharinpix/forms/Valid.csv', 'utf8');
    expect(csvContent).to.include('id,options,required,rows');
    expect(csvContent).to.include('1,[],true,0');
    expect(logs.join('\n')).to.include(
      'Skipped WrongType.json: Failed to serialize value for key "required": Cannot serialize value for key "required": expected boolean, got string'
    );
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
          rows: 0,
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
    expect(fs.existsSync('sharinpix/forms/RoundTripComplex.csv')).to.be.true;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const csv2json = new Csv2Json(argv, config);
    const jsonResult = await csv2json.run();
    expect(jsonResult.name).to.equal('OK');

    const convertedJsonContent = fs.readFileSync('sharinpix/forms/RoundTripComplex.json', 'utf8');
    const convertedJson = JSON.parse(convertedJsonContent) as typeof originalJson;
    expect(convertedJson).to.deep.equal(originalJson);
  });
});
