import fs from 'node:fs';
import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import mock from 'mock-fs';
import Csv2Json from '../../../../src/commands/sharinpix/form/csv2json.js';

describe('sharinpix form csv2json', () => {
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

    const argv: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = { bin: 'sf', name: 'test', root: '', version: '1.0.0' };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const csv2json = new Csv2Json(argv, config);

    const result = await csv2json.run();

    expect(result.name).to.equal('OK');

    // Only the file with data rows should produce a JSON file
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

  it('should handle options field with non-JSON values', async () => {
    const csvContent = ['id,label,type,options', '1,Question 1,text,plain-text-option'].join('\n');

    const formWithPlainOptionsJson = JSON.stringify({
      name: 'FormWithPlainOptions',
      elements: [{ id: '1', label: 'Question 1', type: 'text', options: 'plain-text-option' }],
    });

    mock({
      'sharinpix/forms': {
        'FormWithPlainOptions.csv': csvContent,
        'FormWithPlainOptions.json': formWithPlainOptionsJson,
      },
    });

    const argv: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = { bin: 'sf', name: 'test', root: '', version: '1.0.0' };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const csv2json = new Csv2Json(argv, config);

    const result = await csv2json.run();

    expect(result.name).to.equal('OK');
    expect(fs.existsSync('sharinpix/forms/FormWithPlainOptions.json')).to.be.true;

    const jsonContent = fs.readFileSync('sharinpix/forms/FormWithPlainOptions.json', 'utf8');
    const parsed = JSON.parse(jsonContent) as { elements: Array<Record<string, unknown>> };

    expect(parsed.elements).to.have.lengthOf(1);
    expect(parsed.elements[0]?.options).to.equal('plain-text-option');
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
});
