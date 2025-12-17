import fs from 'node:fs';
import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { parse } from 'csv-parse/sync';
import mock from 'mock-fs';
import Csv2Json from '../../../../src/commands/sharinpix/form/csv2json.js';
import Json2Csv from '../../../../src/commands/sharinpix/form/json2csv.js';

describe('sharinpix form csv2json', () => {
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
    expect(Csv2Json.summary).to.be.a('string');
    expect(Csv2Json.description).to.be.a('string');
    expect(Csv2Json.examples).to.be.an('array');
  });

  it('should generate JSON files from CSV form definitions', async () => {
    const csvContent = [
      'id,label,type,options',
      '1,Question 1,text,',
      '2,Question 2,select,"[{""label"":""A,B""},{""label"":""C""}]"',
    ].join('\n');

    const jsonContent = JSON.stringify({
      name: 'Form1',
      elements: [
        { id: '1', label: 'Question 1', type: 'text' },
        { id: '2', label: 'Question 2', type: 'select', options: [{ label: 'A,B' }, { label: 'C' }] },
      ],
    });

    mock({
      'sharinpix/forms': {
        'Form1.csv': csvContent,
        'Form1.json': jsonContent,
        'Empty.csv': 'id,label,type,options\n',
      },
    });
    fsMocked = true;

    const argv: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = { bin: 'sf', name: 'test', root: '', version: '1.0.0' };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const csv2json = new Csv2Json(argv, config);
    const result = await csv2json.run();
    expect(result.name).to.equal('OK');
    expect(fs.existsSync('sharinpix/forms/Form1.json')).to.be.true;
    expect(fs.existsSync('sharinpix/forms/Empty.json')).to.be.false;

    const readJsonContent = fs.readFileSync('sharinpix/forms/Form1.json', 'utf8');
    const parsed = JSON.parse(readJsonContent) as { elements: Array<Record<string, unknown>> };
    expect(parsed.elements).to.have.lengthOf(2);
    expect(parsed.elements[0]).to.include({
      id: '1',
      label: 'Question 1',
      type: 'text',
    });
    expect(parsed.elements[1]).to.include({
      id: '2',
      label: 'Question 2',
      type: 'select',
    });

    const options = parsed.elements[1]?.options as Array<{ label: string }>;
    expect(options).to.have.lengthOf(2);
    expect(options[0]?.label).to.equal('A,B');
    expect(options[1]?.label).to.equal('C');
  });

  it('should handle CSV with quoted values containing commas', async () => {
    const csvContent = ['id,label,type', '1,"Question, with comma",text', '2,"Another, question",select'].join('\n');

    const formWithCommasJson = JSON.stringify({
      name: 'FormWithCommas',
      elements: [
        { id: '1', label: 'Question, with comma', type: 'text' },
        { id: '2', label: 'Another, question', type: 'select' },
      ],
    });

    mock({
      'sharinpix/forms': {
        'FormWithCommas.csv': csvContent,
        'FormWithCommas.json': formWithCommasJson,
      },
    });
    fsMocked = true;

    const argv: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = { bin: 'sf', name: 'test', root: '', version: '1.0.0' };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const csv2json = new Csv2Json(argv, config);
    const result = await csv2json.run();
    expect(result.name).to.equal('OK');
    expect(fs.existsSync('sharinpix/forms/FormWithCommas.json')).to.be.true;

    const readJsonContent = fs.readFileSync('sharinpix/forms/FormWithCommas.json', 'utf8');
    const parsed = JSON.parse(readJsonContent) as { elements: Array<Record<string, unknown>> };
    expect(parsed.elements).to.have.lengthOf(2);
    expect(parsed.elements[0]?.label).to.equal('Question, with comma');
    expect(parsed.elements[1]?.label).to.equal('Another, question');
  });

  it('should handle CSV with escaped quotes', async () => {
    const csvContent = ['id,label,type', '1,"Question with ""quotes""",text', '2,Regular question,select'].join('\n');

    const formWithQuotesJson = JSON.stringify({
      name: 'FormWithQuotes',
      elements: [
        { id: '1', label: 'Question with "quotes"', type: 'text' },
        { id: '2', label: 'Regular question', type: 'select' },
      ],
    });

    mock({
      'sharinpix/forms': {
        'FormWithQuotes.csv': csvContent,
        'FormWithQuotes.json': formWithQuotesJson,
      },
    });
    fsMocked = true;

    const argv: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = { bin: 'sf', name: 'test', root: '', version: '1.0.0' };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const csv2json = new Csv2Json(argv, config);
    const result = await csv2json.run();
    expect(result.name).to.equal('OK');
    expect(fs.existsSync('sharinpix/forms/FormWithQuotes.json')).to.be.true;

    const jsonContent = fs.readFileSync('sharinpix/forms/FormWithQuotes.json', 'utf8');
    const parsed = JSON.parse(jsonContent) as { elements: Array<Record<string, unknown>> };
    expect(parsed.elements).to.have.lengthOf(2);
    expect(parsed.elements[0]?.label).to.equal('Question with "quotes"');
  });

  it('should handle CSV with newlines in quoted values', async () => {
    const csvContent = ['id,label,type', '1,"Question with\nnewline",text'].join('\n');

    const formWithNewlineJson = JSON.stringify({
      name: 'FormWithNewline',
      elements: [{ id: '1', label: 'Question with\nnewline', type: 'text' }],
    });

    mock({
      'sharinpix/forms': {
        'FormWithNewline.csv': csvContent,
        'FormWithNewline.json': formWithNewlineJson,
      },
    });
    fsMocked = true;

    const argv: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = { bin: 'sf', name: 'test', root: '', version: '1.0.0' };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const csv2json = new Csv2Json(argv, config);
    const result = await csv2json.run();
    expect(result.name).to.equal('OK');
    expect(fs.existsSync('sharinpix/forms/FormWithNewline.json')).to.be.true;

    const jsonContent = fs.readFileSync('sharinpix/forms/FormWithNewline.json', 'utf8');
    const parsed = JSON.parse(jsonContent) as { elements: Array<Record<string, unknown>> };
    expect(parsed.elements).to.have.lengthOf(1);
    expect(parsed.elements[0]?.label).to.equal('Question with\nnewline');
  });

  it('should skip CSV files with only header row', async () => {
    const validJson = JSON.stringify({
      name: 'Valid',
      elements: [{ id: '1', label: 'Question 1', type: 'text' }],
    });

    mock({
      'sharinpix/forms': {
        'HeaderOnly.csv': 'id,label,type,options\n',
        'Valid.csv': 'id,label,type\n1,Question 1,text\n',
        'Valid.json': validJson,
      },
    });
    fsMocked = true;

    const argv: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = { bin: 'sf', name: 'test', root: '', version: '1.0.0' };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const csv2json = new Csv2Json(argv, config);
    const result = await csv2json.run();
    expect(result.name).to.equal('OK');
    expect(fs.existsSync('sharinpix/forms/HeaderOnly.json')).to.be.false;
    expect(fs.existsSync('sharinpix/forms/Valid.json')).to.be.true;
  });

  it('should handle CSV with empty cells', async () => {
    const csvContent = ['id,label,type,options', '1,Question 1,text,', '2,,select,', '3,Question 3,,'].join('\n');

    const formWithEmptyJson = JSON.stringify({
      name: 'FormWithEmpty',
      elements: [
        { id: '1', label: 'Question 1', type: 'text' },
        { id: '2', type: 'select' },
        { id: '3', label: 'Question 3' },
      ],
    });

    mock({
      'sharinpix/forms': {
        'FormWithEmpty.csv': csvContent,
        'FormWithEmpty.json': formWithEmptyJson,
      },
    });
    fsMocked = true;

    const argv: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = { bin: 'sf', name: 'test', root: '', version: '1.0.0' };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const csv2json = new Csv2Json(argv, config);
    const result = await csv2json.run();
    expect(result.name).to.equal('OK');
    expect(fs.existsSync('sharinpix/forms/FormWithEmpty.json')).to.be.true;

    const jsonContent = fs.readFileSync('sharinpix/forms/FormWithEmpty.json', 'utf8');
    const parsed = JSON.parse(jsonContent) as { elements: Array<Record<string, unknown>> };
    expect(parsed.elements).to.have.lengthOf(3);
    expect(parsed.elements[0]).to.include({ id: '1', label: 'Question 1', type: 'text' });
    expect(parsed.elements[1]).to.include({ id: '2', type: 'select' });
    expect(parsed.elements[1]).to.not.have.property('label');
    expect(parsed.elements[2]).to.include({ id: '3', label: 'Question 3' });
    expect(parsed.elements[2]).to.not.have.property('type');
  });

  it('should remove existing JSON keys when the corresponding CSV cell is blank', async () => {
    const csvContent = ['id,label,type,options,defaultValue', '1,,text,,""""""'].join('\n');
    const originalJson = JSON.stringify({
      name: 'FormBlankRemoves',
      elements: [
        {
          id: '1',
          label: 'Old label',
          type: 'select',
          options: [{ label: 'Old option' }],
          defaultValue: 'keep-me-unless-explicitly-overridden',
        },
      ],
    });

    mock({
      'sharinpix/forms': {
        'FormBlankRemoves.csv': csvContent,
        'FormBlankRemoves.json': originalJson,
      },
    });
    fsMocked = true;

    const argv: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = { bin: 'sf', name: 'test', root: '', version: '1.0.0' };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const csv2json = new Csv2Json(argv, config);
    const result = await csv2json.run();
    expect(result.name).to.equal('OK');
    expect(result.converted).to.equal(1);

    const jsonContent = fs.readFileSync('sharinpix/forms/FormBlankRemoves.json', 'utf8');
    const parsed = JSON.parse(jsonContent) as { elements: Array<Record<string, unknown>> };
    expect(parsed.elements).to.have.lengthOf(1);
    const el = parsed.elements[0] ?? {};

    expect(el).to.include({ id: '1', type: 'text' });
    expect(el).to.not.have.property('label');
    expect(el).to.not.have.property('options');

    expect(el).to.have.property('defaultValue');
    expect(el.defaultValue).to.equal('');
  });

  it('should skip CSV conversion when an array-typed cell (options) is not valid JSON', async () => {
    const csvContent = ['id,label,type,options', '1,Question 1,text,plain-text-option'].join('\n');

    const originalJson = JSON.stringify({
      name: 'FormWithPlainOptions',
      elements: [{ id: '1', label: 'Question 1', type: 'text', options: 'plain-text-option' }],
    });

    mock({
      'sharinpix/forms': {
        'FormWithPlainOptions.csv': csvContent,
        'FormWithPlainOptions.json': originalJson,
      },
    });
    fsMocked = true;

    const argv: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = { bin: 'sf', name: 'test', root: '', version: '1.0.0' };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const csv2json = new Csv2Json(argv, config);

    const result = await csv2json.run();

    expect(result.name).to.equal('OK');
    expect(result.converted).to.equal(0);
    expect(result.skipped).to.equal(1);
    expect(fs.readFileSync('sharinpix/forms/FormWithPlainOptions.json', 'utf8')).to.equal(originalJson);
  });

  it('should skip CSV conversion when the target JSON is missing, invalid, or not an object', async () => {
    const goodJson = JSON.stringify({ name: 'Good', elements: [] });

    mock({
      'sharinpix/forms': {
        'Good.csv': 'id,label,type\n1,Ok,text\n',
        'Good.json': goodJson,

        'MissingJson.csv': 'id,label,type\n1,Ok,text\n',

        'InvalidJson.csv': 'id,label,type\n1,Ok,text\n',
        'InvalidJson.json': 'not-json',

        'ArrayRoot.csv': 'id,label,type\n1,Ok,text\n',
        'ArrayRoot.json': '[]',
      },
    });
    fsMocked = true;

    const argv: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = { bin: 'sf', name: 'test', root: '', version: '1.0.0' };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const csv2json = new Csv2Json(argv, config);

    const result = await csv2json.run();
    expect(result.name).to.equal('OK');
    expect(result.converted).to.equal(1);
    expect(result.skipped).to.equal(3);

    const goodOut = JSON.parse(fs.readFileSync('sharinpix/forms/Good.json', 'utf8')) as { elements: unknown[] };
    expect(goodOut.elements).to.have.lengthOf(1);
    expect(fs.existsSync('sharinpix/forms/MissingJson.json')).to.be.false;
    expect(fs.readFileSync('sharinpix/forms/InvalidJson.json', 'utf8')).to.equal('not-json');
    expect(fs.readFileSync('sharinpix/forms/ArrayRoot.json', 'utf8')).to.equal('[]');
  });

  it('should skip CSV conversion when a typed cell cannot be parsed and keep the existing JSON unchanged', async () => {
    const originalJson = JSON.stringify({
      name: 'BadCell',
      elements: [{ id: 'pre', label: 'existing', type: 'text' }],
    });

    mock({
      'sharinpix/forms': {
        'BadCell.csv': 'id,required\n1,TRUE\n',
        'BadCell.json': originalJson,
      },
    });
    fsMocked = true;

    const argv: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = { bin: 'sf', name: 'test', root: '', version: '1.0.0' };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const csv2json = new Csv2Json(argv, config);
    const logs: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    (csv2json as any).log = (msg: string) => logs.push(msg);

    const result = await csv2json.run();
    expect(result.name).to.equal('OK');
    expect(result.converted).to.equal(0);
    expect(result.skipped).to.equal(1);
    expect(fs.readFileSync('sharinpix/forms/BadCell.json', 'utf8')).to.equal(originalJson);
    expect(logs.join('\n')).to.include(
      'Skipped BadCell.csv: Failed to parse value for key "required" at row 2, column 2'
    );
  });

  it('should round-trip CSV -> JSON -> CSV with mixed datatypes', async () => {
    const csvContent = [
      'id,max,required,options,sfMapping,label',
      'elem1,1e3,false,[],"[{""a"":1}]","Question, line1\nline2"',
    ].join('\n');

    const jsonContent = JSON.stringify({
      name: 'CsvRoundTrip',
      elements: [],
    });

    mock({
      'sharinpix/forms': {
        'CsvRoundTrip.csv': csvContent,
        'CsvRoundTrip.json': jsonContent,
      },
    });
    fsMocked = true;

    const argv: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = { bin: 'sf', name: 'test', root: '', version: '1.0.0' };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const csv2json = new Csv2Json(argv, config);
    const jsonResult = await csv2json.run();
    expect(jsonResult.name).to.equal('OK');
    expect(jsonResult.converted).to.equal(1);
    expect(fs.existsSync('sharinpix/forms/CsvRoundTrip.json')).to.be.true;

    const parsed = JSON.parse(fs.readFileSync('sharinpix/forms/CsvRoundTrip.json', 'utf8')) as {
      elements: Array<Record<string, unknown>>;
    };
    const el = parsed.elements[0] ?? {};
    expect(el.index).to.equal(0);
    expect(el.index).to.be.a('number');
    expect(el.max).to.equal(1000);
    expect(el.max).to.be.a('number');
    expect(el.required).to.equal(false);
    expect(el.required).to.be.a('boolean');
    expect(el.options).to.deep.equal([]);
    expect(el.sfMapping).to.deep.equal([{ a: 1 }]);
    expect(el.label).to.equal('Question, line1\nline2');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const json2csv = new Json2Csv(argv, config);
    const csvResult = await json2csv.run();
    expect(csvResult.name).to.equal('OK');
    expect(fs.existsSync('sharinpix/forms/CsvRoundTrip.csv')).to.be.true;

    const outCsv = fs.readFileSync('sharinpix/forms/CsvRoundTrip.csv', 'utf8');
    const rows = parse(outCsv, { skipEmptyLines: true, relaxColumnCount: true, relaxQuotes: true });
    const headers = rows[0] ?? [];
    const dataRow = rows[1] ?? [];
    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      record[h] = dataRow[idx] ?? '';
    });

    expect(record.id).to.equal('elem1');
    expect(record).to.not.have.property('index');
    expect(record.max).to.equal('1000');
    expect(record.required).to.equal('false');
    expect(record.options).to.equal('[]');
    expect(record.sfMapping).to.equal('[{"a":1}]');
    expect(record.label).to.equal('Question, line1\nline2');
  });

  it('should handle multiple CSV files with mixed success and failure', async () => {
    const valid1Json = JSON.stringify({
      name: 'Valid1',
      elements: [{ id: '1', label: 'Question 1', type: 'text' }],
    });
    const valid2Json = JSON.stringify({
      name: 'Valid2',
      elements: [{ id: '2', label: 'Question 2', type: 'select' }],
    });

    mock({
      'sharinpix/forms': {
        'Valid1.csv': 'id,label,type\n1,Question 1,text\n',
        'Valid1.json': valid1Json,
        'Valid2.csv': 'id,label,type\n2,Question 2,select\n',
        'Valid2.json': valid2Json,
        'Empty.csv': 'id,label,type\n',
      },
    });
    fsMocked = true;

    const argv: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = { bin: 'sf', name: 'test', root: '', version: '1.0.0' };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const csv2json = new Csv2Json(argv, config);
    const result = await csv2json.run();
    expect(result.name).to.equal('OK');
    expect(fs.existsSync('sharinpix/forms/Valid1.json')).to.be.true;
    expect(fs.existsSync('sharinpix/forms/Valid2.json')).to.be.true;
    expect(fs.existsSync('sharinpix/forms/Empty.json')).to.be.false;
  });

  it('should handle missing directory gracefully', async () => {
    mock({});
    fsMocked = true;

    const argv: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = { bin: 'sf', name: 'test', root: '', version: '1.0.0' };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const csv2json = new Csv2Json(argv, config);
    const result = await csv2json.run();
    expect(result.name).to.equal('OK');
  });

  it('should handle CSV files with Windows line endings', async () => {
    const csvContent = 'id,label,type\r\n1,Question 1,text\r\n';
    const formWindowsJson = JSON.stringify({
      name: 'FormWindows',
      elements: [{ id: '1', label: 'Question 1', type: 'text' }],
    });

    mock({
      'sharinpix/forms': {
        'FormWindows.csv': csvContent,
        'FormWindows.json': formWindowsJson,
      },
    });
    fsMocked = true;

    const argv: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = { bin: 'sf', name: 'test', root: '', version: '1.0.0' };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const csv2json = new Csv2Json(argv, config);
    const result = await csv2json.run();
    expect(result.name).to.equal('OK');
    expect(fs.existsSync('sharinpix/forms/FormWindows.json')).to.be.true;

    const jsonContent = fs.readFileSync('sharinpix/forms/FormWindows.json', 'utf8');
    const parsed = JSON.parse(jsonContent) as { elements: Array<Record<string, unknown>> };
    expect(parsed.elements).to.have.lengthOf(1);
    expect(parsed.elements[0]).to.include({ id: '1', label: 'Question 1', type: 'text' });
  });

  it('should skip CSV conversion when the CSV includes unknown keys', async () => {
    const csvContent = ['id,required,rows,customKey', 'elem1,true,3,{"a":1}'].join('\n');

    const originalJson = JSON.stringify({
      name: 'TypedParsing',
      elements: [{ id: 'elem1', index: 0, required: true, rows: 3, customKey: '{"a":1}' }],
    });

    mock({
      'sharinpix/forms': {
        'TypedParsing.csv': csvContent,
        'TypedParsing.json': originalJson,
      },
    });
    fsMocked = true;

    const argv: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = { bin: 'sf', name: 'test', root: '', version: '1.0.0' };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const csv2json = new Csv2Json(argv, config);
    const result = await csv2json.run();
    expect(result.name).to.equal('OK');
    expect(result.converted).to.equal(0);
    expect(result.skipped).to.equal(1);
    expect(fs.readFileSync('sharinpix/forms/TypedParsing.json', 'utf8')).to.equal(originalJson);
  });
});
