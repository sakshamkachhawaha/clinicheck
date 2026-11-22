import type { CheckResult, Severity } from '../types.js';

export interface TestCaseResult {
  id: string;
  passed: boolean;
  score: number;
  result: CheckResult;
}

export interface PrettyReporterOptions {
  version?: string;
  failOn?: Severity;
  useColor?: boolean;
}

function shouldUseColor(): boolean {
  if (process.env.NO_COLOR !== undefined && process.env.NO_COLOR !== '') {
    return false;
  }
  return !!process.stdout && !!process.stdout.isTTY;
}

export function formatPretty(
  cases: TestCaseResult[],
  options?: PrettyReporterOptions
): string {
  const version = options?.version ?? '0.2.0';
  const failOn = options?.failOn ?? 'high';
  const useColor = options?.useColor ?? shouldUseColor();

  const c = {
    red: (str: string) => (useColor ? `\x1b[31m${str}\x1b[0m` : str),
    green: (str: string) => (useColor ? `\x1b[32m${str}\x1b[0m` : str),
    yellow: (str: string) => (useColor ? `\x1b[33m${str}\x1b[0m` : str),
    bold: (str: string) => (useColor ? `\x1b[1m${str}\x1b[0m` : str),
    dim: (str: string) => (useColor ? `\x1b[2m${str}\x1b[0m` : str),
  };

  const lines: string[] = [];
  const total = cases.length;
  lines.push(`clinicheck v${version} (${total} ${total === 1 ? 'case' : 'cases'}, fail-on: ${failOn})\n`);

  let passedCount = 0;
  let failedCount = 0;

  for (const item of cases) {
    if (item.passed) {
      passedCount++;
      lines.push(`${c.green('PASS')} ${item.id}  ${c.dim('score')} ${item.score}`);
    } else {
      failedCount++;
      lines.push(`${c.red('FAIL')} ${item.id}  ${c.dim('score')} ${item.score}`);
      for (const f of item.result.findings) {
        const sevUpper = f.severity.toUpperCase();
        const sevColor =
          f.severity === 'critical'
            ? c.red
            : f.severity === 'high'
            ? c.red
            : f.severity === 'medium'
            ? c.yellow
            : c.dim;
        lines.push(`  ${sevColor(c.bold(sevUpper))} ${f.ruleId} ${f.message}`);
        if (f.suggestion) {
          lines.push(`    ${c.dim('fix:')} ${f.suggestion}`);
        }
      }
    }
  }

  lines.push('');
  if (failedCount > 0) {
    lines.push(`${failedCount} failed, ${passedCount} passed`);
  } else {
    lines.push(`${passedCount} passed`);
  }

  return lines.join('\n');
}
