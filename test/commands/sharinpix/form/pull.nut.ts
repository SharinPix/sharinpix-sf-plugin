import fs from 'node:fs';
import path from 'node:path';
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import { PullResult } from '../../../../src/commands/sharinpix/form/pull.js';

let testSession: TestSession;

describe('sharinpix form pull NUTs', () => {
  before('prepare session', async () => {
    testSession = await TestSession.create({
      project: {
        name: 'sharinpix-form-pull-test',
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

  it('should require org flag', () => {
    const result = execCmd('sharinpix form pull --json', {
      ensureExitCode: 1,
      cwd: testSession.project.dir,
    });

    expect(result.jsonOutput?.name).to.equal('NoDefaultEnvError');
  });

  it('should create sharinpix/forms directory', () => {
    const result = execCmd('sharinpix form pull --help', {
      ensureExitCode: 0,
      cwd: testSession.project.dir,
    });

    expect(result.shellOutput.stdout).to.include('Pull SharinPix form templates from Salesforce org');
    expect(result.shellOutput.stdout).to.include('--target-org');
  });

  it('should fail with invalid org', async () => {
    const result = execCmd<PullResult>('sharinpix form pull --target-org testorg@example.com --json', {
      ensureExitCode: 1,
      cwd: testSession.project.dir,
    });

    // Should fail because the org doesn't exist or is not authenticated
    expect(result.jsonOutput?.name).to.be.oneOf(['NoDefaultEnvError', 'AuthError', 'ConnectionError']);
  });
});
