import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { runLeanCheck } from '../../../src/core/lean/checker.js';

describe('lean/checker', () => {
  let tempDir: string;
  let formalDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-lean-check-'));
    formalDir = path.join(tempDir, 'openspec', 'formal');
    fs.mkdirSync(formalDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns valid report when configured Lean command exits successfully', async () => {
    const script = path.join(tempDir, 'fake-lean-success.mjs');
    fs.writeFileSync(script, 'console.log("lean ok");\n');

    const report = await runLeanCheck({
      projectRoot: tempDir,
      lean: {
        root: 'openspec/formal',
        command: process.execPath,
        args: [script],
        timeoutMs: 5000,
      },
    });

    expect(report).toEqual({
      valid: true,
      issues: [],
      summary: { errors: 0, warnings: 0, info: 0 },
    });
  });

  it('returns an error issue when configured Lean command exits non-zero', async () => {
    const script = path.join(tempDir, 'fake-lean-failure.mjs');
    fs.writeFileSync(script, 'console.error("lean model failed"); process.exit(3);\n');

    const report = await runLeanCheck({
      projectRoot: tempDir,
      lean: {
        root: 'openspec/formal',
        command: process.execPath,
        args: [script],
        timeoutMs: 5000,
      },
    });

    expect(report.valid).toBe(false);
    expect(report.issues).toEqual([
      expect.objectContaining({
        level: 'ERROR',
        path: path.join('openspec', 'formal'),
        message: expect.stringContaining('lean model failed'),
      }),
    ]);
  });

  it('includes stdout when configured Lean command fails without stderr', async () => {
    const script = path.join(tempDir, 'fake-lean-stdout-failure.mjs');
    fs.writeFileSync(script, 'console.log("stdout failure detail"); process.exit(2);\n');

    const report = await runLeanCheck({
      projectRoot: tempDir,
      lean: {
        root: 'openspec/formal',
        command: process.execPath,
        args: [script],
        timeoutMs: 5000,
      },
    });

    expect(report.valid).toBe(false);
    expect(report.issues[0].message).toContain('stdout failure detail');
  });

  it('returns an error issue when configured Lean command is missing', async () => {
    const report = await runLeanCheck({
      projectRoot: tempDir,
      lean: {
        root: 'openspec/formal',
        command: 'definitely-not-a-real-lean-command-for-openspec-tests',
        args: [],
        timeoutMs: 5000,
      },
    });

    expect(report.valid).toBe(false);
    expect(report.issues[0].message).toContain('Lean command could not run');
  });

  it('returns an error issue when configured Lean command times out', async () => {
    const script = path.join(tempDir, 'fake-lean-timeout.mjs');
    fs.writeFileSync(script, 'setTimeout(() => {}, 10000);\n');

    const report = await runLeanCheck({
      projectRoot: tempDir,
      lean: {
        root: 'openspec/formal',
        command: process.execPath,
        args: [script],
        timeoutMs: 50,
      },
    });

    expect(report.valid).toBe(false);
    expect(report.issues[0].message).toContain('Lean check timed out after 50ms');
  });

  it('returns an error issue when Lean root is missing', async () => {
    const report = await runLeanCheck({
      projectRoot: tempDir,
      lean: {
        root: 'missing-formal',
        command: process.execPath,
        args: ['--version'],
        timeoutMs: 5000,
      },
    });

    expect(report.valid).toBe(false);
    expect(report.issues).toEqual([
      expect.objectContaining({
        level: 'ERROR',
        path: 'missing-formal',
        message: expect.stringContaining('Lean root not found'),
      }),
    ]);
  });
});
