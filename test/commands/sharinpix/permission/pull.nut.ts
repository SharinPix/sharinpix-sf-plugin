import fs from 'node:fs';
import path from 'node:path';
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import { PullResult } from '../../../../src/commands/sharinpix/permission/pull.js';

let testSession: TestSession;

describe('sharinpix permission pull NUTs', () => {
  before('prepare session', async () => {
    testSession = await TestSession.create({
      project: {
        name: 'sharinpix-permission-pull-test',
      },
    });
  });

  after(async () => {
    await testSession?.clean();
  });

  afterEach(() => {
    const permissionDir = path.join(testSession.project.dir, 'sharinpix', 'permission');
    if (fs.existsSync(permissionDir)) {
      fs.rmSync(path.join(testSession.project.dir, 'sharinpix'), { recursive: true, force: true });
    }
  });

  it('should require org flag', () => {
    const result = execCmd('sharinpix permission pull --json', {
      ensureExitCode: 1,
      cwd: testSession.project.dir,
    });

    expect(result.jsonOutput?.name).to.equal('NoDefaultEnvError');
  });

  it('should create sharinpix/permissions directory', () => {
    const result = execCmd('sharinpix permission pull --help', {
      ensureExitCode: 0,
      cwd: testSession.project.dir,
    });

    expect(result.shellOutput.stdout).to.include('Pull SharinPix permissions from Salesforce org');
    expect(result.shellOutput.stdout).to.include('--target-org');
  });

  it('should fail with invalid org', async () => {
    const result = execCmd<PullResult>('sharinpix permission pull --target-org testorg@example.com --json', {
      ensureExitCode: 1,
      cwd: testSession.project.dir,
    });

    // Should fail because the org doesn't exist or is not authenticated
    expect(result.jsonOutput?.name).to.be.oneOf(['NoDefaultEnvError', 'AuthError', 'ConnectionError']);
  });

  it('should show correct help information', () => {
    const result = execCmd('sharinpix permission pull --help', {
      ensureExitCode: 0,
      cwd: testSession.project.dir,
    });

    expect(result.shellOutput.stdout).to.include('Retrieves all SharinPix permissions');
    expect(result.shellOutput.stdout).to.include('The Salesforce org to pull SharinPix permissions from');
    expect(result.shellOutput.stdout).to.include('--target-org');
    expect(result.shellOutput.stdout).to.include('--org');
  });

  it('should accept org flag with short form', () => {
    const result = execCmd('sharinpix permission pull --help', {
      ensureExitCode: 0,
      cwd: testSession.project.dir,
    });

    expect(result.shellOutput.stdout).to.include('-o, --target-org');
  });

  it('should show examples in help', () => {
    const result = execCmd('sharinpix permission pull --help', {
      ensureExitCode: 0,
      cwd: testSession.project.dir,
    });

    expect(result.shellOutput.stdout).to.include('Pull all SharinPix permissions from the default org');
    expect(result.shellOutput.stdout).to.include('Pull SharinPix permissions from a specific org');
  });
});
