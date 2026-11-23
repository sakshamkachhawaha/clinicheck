import type { TestCaseResult } from './pretty.js';

export function formatMarkdown(
  cases: TestCaseResult[],
  version: string = '0.2.1'
): string {
  const lines: string[] = [];
  lines.push(`### clinicheck Report (v${version})\n`);

  lines.push('| Case | Status | Score | Findings |');
  lines.push('|---|---|---|---|');

  let passedCount = 0;
  let failedCount = 0;

  for (const c of cases) {
    const status = c.passed ? '✅ PASS' : '❌ FAIL';
    if (c.passed) {
      passedCount++;
    } else {
      failedCount++;
    }

    let findingsText = 'None';
    if (c.result.findings.length > 0) {
      findingsText = c.result.findings
        .map(
          (f) =>
            `\`[${f.severity.toUpperCase()}] ${f.ruleId}\`: ${f.message.replace(/\|/g, '\\|')}`
        )
        .join('<br>');
    }

    lines.push(`| ${c.id} | ${status} | ${c.score} | ${findingsText} |`);
  }

  lines.push('');
  lines.push(
    `**Summary:** ${failedCount} failed, ${passedCount} passed (Total: ${cases.length} cases)`
  );

  return lines.join('\n');
}
