import fs from 'node:fs';
import path from 'node:path';
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import { PushResult } from '../../../../src/commands/sharinpix/permission/push.js';

let testSession: TestSession;

describe('sharinpix permission push NUTs', () => {
  before('prepare session', async () => {
    testSession = await TestSession.create({
      project: {
        name: 'sharinpix-permission-push-test',
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
    const result = execCmd('sharinpix permission push --json', {
      ensureExitCode: 1,
      cwd: testSession.project.dir,
    });

    expect(result.jsonOutput?.name).to.equal('NoDefaultEnvError');
  });

  it('should show help with correct flags', () => {
    const result = execCmd('sharinpix permission push --help', {
      ensureExitCode: 0,
      cwd: testSession.project.dir,
    });

    expect(result.shellOutput.stdout).to.include('Push SharinPix permissions to Salesforce org');
    expect(result.shellOutput.stdout).to.include('--target-org');
  });

  it('should fail with invalid org', async () => {
    const result = execCmd<PushResult>('sharinpix permission push --target-org testorg@example.com --json', {
      ensureExitCode: 1,
      cwd: testSession.project.dir,
    });

    // Should fail because the org doesn't exist or is not authenticated
    expect(result.jsonOutput?.name).to.be.oneOf(['NoDefaultEnvError', 'AuthError', 'ConnectionError']);
  });

  it('should show correct help information', () => {
    const result = execCmd('sharinpix permission push --help', {
      ensureExitCode: 0,
      cwd: testSession.project.dir,
    });

    expect(result.shellOutput.stdout).to.include('Uploads SharinPix permissions');
    expect(result.shellOutput.stdout).to.include('The Salesforce org to push SharinPix permissions to');
    expect(result.shellOutput.stdout).to.include('--target-org');
    expect(result.shellOutput.stdout).to.include('--org');
  });

  it('should accept org flag with short form', () => {
    const result = execCmd('sharinpix permission push --help', {
      ensureExitCode: 0,
      cwd: testSession.project.dir,
    });

    const normalized = result.shellOutput.stdout.replace(/\s+/g, ' ');
    expect(normalized).to.match(/-o,\s+--(?:target-org|org)(?:[=\s]|$)/);
  });

  it('should show examples in help', () => {
    const result = execCmd('sharinpix permission push --help', {
      ensureExitCode: 0,
      cwd: testSession.project.dir,
    });

    expect(result.shellOutput.stdout).to.include('Push all SharinPix permissions to the default org');
    expect(result.shellOutput.stdout).to.include('Push SharinPix permissions to a specific org');
  });

  it('should handle empty permission directory', async () => {
    // Create empty permission directory
    const permissionDir = path.join(testSession.project.dir, 'sharinpix', 'permission');
    fs.mkdirSync(permissionDir, { recursive: true });

    const result = execCmd<PushResult>('sharinpix permission push --target-org testorg@example.com --json', {
      ensureExitCode: 1,
      cwd: testSession.project.dir,
    });

    // Should fail because the org doesn't exist, but the command should handle empty directory
    expect(result.jsonOutput?.name).to.be.oneOf(['NoDefaultEnvError', 'AuthError', 'ConnectionError']);
  });

  it('should handle missing permission directory', async () => {
    const result = execCmd<PushResult>('sharinpix permission push --target-org testorg@example.com --json', {
      ensureExitCode: 1,
      cwd: testSession.project.dir,
    });

    // Should fail because the org doesn't exist, but the command should handle missing directory
    expect(result.jsonOutput?.name).to.be.oneOf(['NoDefaultEnvError', 'AuthError', 'ConnectionError']);
  });
});
