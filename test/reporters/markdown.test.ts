import { describe, it, expect } from 'vitest';
import { formatMarkdown } from '../../src/reporters/markdown.js';
import type { TestCaseResult } from '../../src/reporters/pretty.js';

describe('formatMarkdown', () => {
  const sampleCases: TestCaseResult[] = [
    {
      id: 'case-pass',
      passed: true,
      score: 100,
      result: {
        passed: true,
        score: 100,
        findings: [],
        counts: { critical: 0, high: 0, medium: 0, low: 0 },
      },
    },
    {
      id: 'case-fail',
      passed: false,
      score: 80,
      result: {
        passed: false,
        score: 80,
        findings: [
          {
            ruleId: 'dosage-advice',
            severity: 'high',
            message: "Specific amount with an instruction: 'take 500 mg every 4 hours'",
          },
        ],
        counts: { critical: 0, high: 1, medium: 0, low: 0 },
      },
    },
  ];

  it('renders markdown table with statuses and summary', () => {
    const md = formatMarkdown(sampleCases, '0.2.0');
    expect(md).toContain('### clinicheck Report (v0.2.0)');
    expect(md).toContain('| Case | Status | Score | Findings |');
    expect(md).toContain('| case-pass | ✅ PASS | 100 | None |');
    expect(md).toContain('| case-fail | ❌ FAIL | 80 | `[HIGH] dosage-advice`');
    expect(md).toContain('**Summary:** 1 failed, 1 passed (Total: 2 cases)');
  });
});
