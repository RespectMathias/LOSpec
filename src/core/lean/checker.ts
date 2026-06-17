import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import type { Readable } from 'node:stream';
import type { ProjectConfig } from '../project-config.js';
import type { ValidationIssue, ValidationReport } from '../validation/types.js';

export interface RunLeanCheckOptions {
  projectRoot: string;
  lean?: ProjectConfig['lean'];
}

const DEFAULT_ROOT = path.join('openspec', 'formal');
const DEFAULT_COMMAND = 'lake';
const DEFAULT_ARGS = ['build'];
const DEFAULT_TIMEOUT_MS = 120000;

export async function runLeanCheck(options: RunLeanCheckOptions): Promise<ValidationReport> {
  const lean = options.lean ?? {};
  const root = lean.root ?? DEFAULT_ROOT;
  const rootPath = path.resolve(options.projectRoot, root);
  const displayRoot = displayPath(options.projectRoot, rootPath, root);

  if (!existsSync(rootPath) || !statSync(rootPath).isDirectory()) {
    return createReport([{
      level: 'ERROR',
      path: displayRoot,
      message: `Lean root not found: ${displayRoot}`,
    }]);
  }

  const command = lean.command ?? DEFAULT_COMMAND;
  const args = lean.args ?? DEFAULT_ARGS;
  const timeoutMs = lean.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const result = await runCommand(command, args, rootPath, timeoutMs);

  if (result.ok) {
    return createReport([]);
  }

  return createReport([{
    level: 'ERROR',
    path: displayRoot,
    message: result.message,
  }]);
}

function runCommand(
  command: string,
  args: string[],
  cwd: string,
  timeoutMs: number
): Promise<{ ok: true } | { ok: false; message: string }> {
  return new Promise((resolve) => {
    let settled = false;
    let timedOut = false;
    const child = spawn(command, args, {
      cwd,
      shell: false,
      windowsHide: true,
    });
    const getStdout = collectOutput(child.stdout);
    const getStderr = collectOutput(child.stderr);

    const timeout = setTimeout(() => {
      if (!settled) {
        timedOut = true;
        child.kill('SIGKILL');
      }
    }, timeoutMs);

    child.on('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve({ ok: false, message: `Lean command could not run: ${error.message}` });
    });

    child.on('close', (code, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (timedOut) {
        resolve({ ok: false, message: `Lean check timed out after ${timeoutMs}ms` });
        return;
      }
      if (code === 0) {
        resolve({ ok: true });
        return;
      }
      const reason = signal ? `signal ${signal}` : `exit code ${code ?? 'unknown'}`;
      const output = [getStderr().trim(), getStdout().trim()].filter(Boolean).join('\n');
      resolve({
        ok: false,
        message: output ? `Lean check failed (${reason}): ${output}` : `Lean check failed (${reason})`,
      });
    });
  });
}

function collectOutput(stream: Readable | null): () => string {
  let output = '';
  stream?.setEncoding('utf-8');
  stream?.on('data', (chunk) => {
    output += chunk;
  });
  return () => output;
}

function createReport(issues: ValidationIssue[]): ValidationReport {
  const errors = issues.filter(issue => issue.level === 'ERROR').length;
  const warnings = issues.filter(issue => issue.level === 'WARNING').length;
  const info = issues.filter(issue => issue.level === 'INFO').length;
  return {
    valid: errors === 0,
    issues,
    summary: { errors, warnings, info },
  };
}

function displayPath(projectRoot: string, rootPath: string, configuredRoot: string): string {
  if (!path.isAbsolute(configuredRoot)) return path.normalize(configuredRoot);
  const relative = path.relative(projectRoot, rootPath);
  return relative && !relative.startsWith('..') ? relative : rootPath;
}
