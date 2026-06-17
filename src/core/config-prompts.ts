import type { ProjectConfig } from './project-config.js';

/**
 * Serialize config to YAML string with helpful comments.
 *
 * @param config - Partial config object (schema required, context/rules optional)
 * @returns YAML string ready to write to file
 */
export function serializeConfig(config: Partial<ProjectConfig>): string {
  const lines: string[] = [];

  // Schema (required)
  lines.push(`schema: ${config.schema}`);
  lines.push('');

  if (config.lean) {
    lines.push('lean:');
    if (config.lean.enabled !== undefined) {
      lines.push(`  enabled: ${config.lean.enabled}`);
    }
    if (config.lean.root) {
      lines.push(`  root: ${config.lean.root}`);
    }
    if (config.lean.command) {
      lines.push(`  command: ${config.lean.command}`);
    }
    if (config.lean.args) {
      lines.push('  args:');
      for (const arg of config.lean.args) {
        lines.push(`    - ${arg}`);
      }
    }
    if (config.lean.timeoutMs !== undefined) {
      lines.push(`  timeoutMs: ${config.lean.timeoutMs}`);
    }
    lines.push('');
  }

  // Context section with comments
  lines.push('# Project context (optional)');
  lines.push('# This is shown to AI when creating artifacts.');
  lines.push('# Add your tech stack, conventions, style guides, domain knowledge, etc.');
  lines.push('# Example:');
  lines.push('#   context: |');
  lines.push('#     Tech stack: TypeScript, React, Node.js');
  lines.push('#     We use conventional commits');
  lines.push('#     Domain: e-commerce platform');
  lines.push('');

  // Rules section with comments
  lines.push('# Per-artifact rules (optional)');
  lines.push('# Add custom rules for specific artifacts.');
  lines.push('# Example:');
  lines.push('#   rules:');
  lines.push('#     proposal:');
  lines.push('#       - Keep proposals under 500 words');
  lines.push('#       - Always include a "Non-goals" section');
  lines.push('#     tasks:');
  lines.push('#       - Break tasks into chunks of max 2 hours');

  return lines.join('\n') + '\n';
}
