import fs from 'node:fs';
import path from 'node:path';
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import { Csv2JsonResult } from '../../../../src/commands/sharinpix/form/csv2json.js';

let testSession: TestSession;

describe('sharinpix form csv2json NUTs', () => {
  before('prepare session', async () => {
    testSession = await TestSession.create({
      project: {
        name: 'sharinpix-form-csv2json-test',
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

  it('should show help for csv2json command', () => {
    const result = execCmd('sharinpix form csv2json --help', {
      ensureExitCode: 0,
      cwd: testSession.project.dir,
    });

    expect(result.shellOutput.stdout).to.include('sharinpix form csv2json');
  });

  it('should exit successfully when no forms directory exists', () => {
    const result = execCmd<Csv2JsonResult>('sharinpix form csv2json --json', {
      ensureExitCode: 0,
      cwd: testSession.project.dir,
    });

    expect(result.jsonOutput?.result?.name).to.equal('OK');
  });
});

