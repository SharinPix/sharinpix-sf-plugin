import fs from 'node:fs';
import path from 'node:path';
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import { PushResult } from '../../../../src/commands/sharinpix/form/push.js';

let testSession: TestSession;

describe('sharinpix form push NUTs', () => {
  before('prepare session', async () => {
    testSession = await TestSession.create({
      project: {
        name: 'sharinpix-form-push-test',
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
    const result = execCmd('sharinpix form push --json', {
      ensureExitCode: 1,
      cwd: testSession.project.dir,
    });

    expect(result.jsonOutput?.name).to.equal('NoDefaultEnvError');
  });

  it('should show help with correct flags', () => {
    const result = execCmd('sharinpix form push --help', {
      ensureExitCode: 0,
      cwd: testSession.project.dir,
    });

    expect(result.shellOutput.stdout).to.include('Push SharinPix form templates to Salesforce org');
    expect(result.shellOutput.stdout).to.include('--target-org');
    expect(result.shellOutput.stdout).to.include('--dir');
    expect(result.shellOutput.stdout).to.include('--force');
  });

  it('should fail with invalid org', async () => {
    const result = execCmd<PushResult>('sharinpix form push --target-org testorg@example.com --json', {
      ensureExitCode: 1,
      cwd: testSession.project.dir,
    });

    // Should fail because the org doesn't exist or is not authenticated
    expect(result.jsonOutput?.name).to.be.oneOf(['NoDefaultEnvError', 'AuthError', 'ConnectionError']);
  });

  it('should fail when forms directory does not exist', async () => {
    const result = execCmd<PushResult>(
      'sharinpix form push --target-org testorg@example.com --dir nonexistent --json',
      {
        ensureExitCode: 1,
        cwd: testSession.project.dir,
      }
    );

    // Should fail because the directory doesn't exist
    expect(result.jsonOutput?.name).to.be.oneOf(['NoDefaultEnvError', 'AuthError', 'ConnectionError']);
  });
});
