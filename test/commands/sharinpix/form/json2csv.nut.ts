import fs from 'node:fs';
import path from 'node:path';
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import { Json2CsvResult } from '../../../../src/commands/sharinpix/form/json2csv.js';

let testSession: TestSession;

describe('sharinpix form json2csv NUTs', () => {
  before('prepare session', async () => {
    testSession = await TestSession.create({
      project: {
        name: 'sharinpix-form-json2csv-test',
      },
    });
  });

  after(async () => {
    await testSession?.clean();
  });

  afterEach(() => {
    const formsDir = path.join(testSession.project.dir, 'sharinpix', 'forms');
    if (fs.existsSync(formsDir)) {
      fs.rmSync(path.join(testSession.project.dir, 'sharinpix'), { recursive: true, force: true });
    }
  });

  it('should show help for json2csv command', () => {
    const result = execCmd('sharinpix form json2csv --help', {
      ensureExitCode: 0,
      cwd: testSession.project.dir,
    });

    expect(result.shellOutput.stdout).to.include('sharinpix form json2csv');
  });

  it('should exit successfully when no forms directory exists', () => {
    const result = execCmd<Json2CsvResult>('sharinpix form json2csv --json', {
      ensureExitCode: 0,
      cwd: testSession.project.dir,
    });

    expect(result.jsonOutput?.result?.name).to.equal('OK');
  });
});
