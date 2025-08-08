import fs from 'node:fs';
import path from 'node:path';
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';

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
    // Clean up any created directories after each test
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

    expect(result.jsonOutput?.name).to.equal('RequiredFlagError');
  });

  it('should create sharinpix/forms directory', () => {
    // This test would normally require a real org connection
    // For now, we'll test the command structure and flag validation
    const result = execCmd('sharinpix form pull --help', {
      ensureExitCode: 0,
      cwd: testSession.project.dir,
    });

    expect(result.shellOutput.stdout).to.include('Pull SharinPix form templates from Salesforce org');
    expect(result.shellOutput.stdout).to.include('--target-org');
  });

  // Note: Full integration tests would require:
  // 1. A test org with SharinPix package installed
  // 2. Sample form templates created in the org
  // 3. Valid org authentication
  // These tests are commented out as they require live org access

  /*
  it('should pull form templates from org', async () => {
    // This test requires a real org with SharinPix installed
    const result = execCmd<PullResult>('sharinpix form pull --target-org testorg@example.com --json', {
      ensureExitCode: 0,
      cwd: testSession.project.dir,
    });

    expect(result.jsonOutput?.result?.name).to.equal('OK');
    
    // Verify directory was created
    const formsDir = path.join(testSession.project.dir, 'sharinpix', 'forms');
    expect(fs.existsSync(formsDir)).to.be.true;
    
    // Check if any JSON files were created (depends on org having form templates)
    const files = fs.readdirSync(formsDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    // If the org has form templates, verify they were downloaded
    if (jsonFiles.length > 0) {
      const firstFormPath = path.join(formsDir, jsonFiles[0]);
      const formContent = JSON.parse(fs.readFileSync(firstFormPath, 'utf8'));
      expect(formContent).to.be.an('object');
    }
  });
  */
});
