import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { ValidateCommand } from '../../../src/commands/validate.js';

interface ValidateJsonOutput {
  items: unknown[];
  summary: { byType: Record<string, unknown> };
}

describe('ValidateCommand Lean defaults', () => {
  let tempDir: string;
  let originalCwd: string;
  let stdoutSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    originalCwd = process.cwd();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-validate-lean-default-'));
    process.chdir(tempDir);
    process.exitCode = undefined;
    stdoutSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    stderrSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await fs.mkdir(path.join(tempDir, 'openspec', 'specs', 'alpha'), { recursive: true });
    await fs.writeFile(path.join(tempDir, 'openspec', 'specs', 'alpha', 'spec.md'), [
      '## Purpose',
      'This spec exists to verify default Lean validation behavior.',
      '',
      '## Requirements',
      '',
      '### Requirement: Alpha SHALL be valid',
      'Alpha SHALL remain valid for command validation tests.',
      '',
      '#### Scenario: Validate alpha',
      '- **WHEN** validation runs',
      '- **THEN** alpha is valid',
    ].join('\n'), 'utf-8');
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    process.exitCode = undefined;
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  function readJsonOutput(): ValidateJsonOutput {
    return JSON.parse(stdoutSpy.mock.calls[0][0] as string);
  }

  function expectOnlyAlphaSpec(output: ValidateJsonOutput) {
    expect(process.exitCode).toBe(0);
    expect(output.items).toEqual([
      expect.objectContaining({ type: 'spec', id: 'alpha', valid: true }),
    ]);
    expect(output.summary.byType.lean).toBeUndefined();
  }

  function expectLeanFailure(output: ValidateJsonOutput) {
    expect(process.exitCode).toBe(1);
    expect(output.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'lean', id: 'formal', valid: false }),
    ]));
  }

  it('runs Lean by default for bulk validation', async () => {
    await new ValidateCommand().execute(undefined, { specs: true, json: true });

    const output = readJsonOutput();
    expectLeanFailure(output);
    expect(output.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'spec', id: 'alpha', valid: true }),
      expect.objectContaining({ type: 'lean', id: 'formal', valid: false }),
    ]));
    expect(output.summary.byType.lean).toEqual({ items: 1, passed: 0, failed: 1 });
  });

  it('skips Lean when --no-lean sets lean false', async () => {
    await new ValidateCommand().execute(undefined, { specs: true, json: true, lean: false });

    expectOnlyAlphaSpec(readJsonOutput());
  });

  it('skips default Lean when project config disables it', async () => {
    await fs.writeFile(path.join(tempDir, 'openspec', 'config.yaml'), 'schema: spec-driven\nlean:\n  enabled: false\n', 'utf-8');

    await new ValidateCommand().execute(undefined, { specs: true, json: true });

    expectOnlyAlphaSpec(readJsonOutput());
  });

  it('forces Lean when --lean is provided despite disabled config', async () => {
    await fs.writeFile(path.join(tempDir, 'openspec', 'config.yaml'), 'schema: spec-driven\nlean:\n  enabled: false\n', 'utf-8');

    await new ValidateCommand().execute(undefined, { specs: true, json: true, lean: true });

    expectLeanFailure(readJsonOutput());
  });
});
