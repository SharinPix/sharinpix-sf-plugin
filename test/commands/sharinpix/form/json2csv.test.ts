import fs from 'node:fs';
import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import mock from 'mock-fs';
import Json2Csv from '../../../../src/commands/sharinpix/form/json2csv.js';
import Csv2Json from '../../../../src/commands/sharinpix/form/csv2json.js';

describe('sharinpix form json2csv', () => {
  const $$ = new TestContext();

  beforeEach(() => {
    stubSfCommandUx($$.SANDBOX);
  });

  afterEach(() => {
    $$.restore();
    // Ensure the filesystem is reset if it was mocked in a test
    try {
      mock.restore();
      // eslint-disable-next-line no-empty
    } catch {}
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

    const argv: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = { bin: 'sf', name: 'test', root: '', version: '1.0.0' };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const json2csv = new Json2Csv(argv, config);

    const result = await json2csv.run();

    expect(result.name).to.equal('OK');

    // Only the valid file with a non-empty elements array should produce a CSV
    expect(fs.existsSync('sharinpix/forms/Form1.csv')).to.be.true;
    expect(fs.existsSync('sharinpix/forms/NoElements.csv')).to.be.false;
    expect(fs.existsSync('sharinpix/forms/EmptyElements.csv')).to.be.false;
    expect(fs.existsSync('sharinpix/forms/Invalid.csv')).to.be.false;

    const csvContent = fs.readFileSync('sharinpix/forms/Form1.csv', 'utf8');
    const lines = csvContent.split('\n').filter((line) => line.trim() !== '');
    const [header, ...rows] = lines;

    // Header row should reflect element key ordering
    expect(header).to.equal('id,label,type,options');

    // Data rows should be correctly formatted
    // Check that rows contain the expected element data
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

    const argv: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = { bin: 'sf', name: 'test', root: '', version: '1.0.0' };

    // Step 1: Convert JSON to CSV
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const json2csv = new Json2Csv(argv, config);
    const csvResult = await json2csv.run();
    expect(csvResult.name).to.equal('OK');
    expect(fs.existsSync('sharinpix/forms/RoundTripTest.csv')).to.be.true;

    // Step 2: Convert CSV back to JSON
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const csv2json = new Csv2Json(argv, config);
    const jsonResult = await csv2json.run();
    expect(jsonResult.name).to.equal('OK');
    expect(fs.existsSync('sharinpix/forms/RoundTripTest.json')).to.be.true;

    // Step 3: Compare original and converted JSON
    const convertedJsonContent = fs.readFileSync('sharinpix/forms/RoundTripTest.json', 'utf8');
    const convertedJson = JSON.parse(convertedJsonContent) as typeof originalJson;

    // Verify the converted JSON is identical to the original
    expect(convertedJson).to.deep.equal(originalJson);
  });
});
