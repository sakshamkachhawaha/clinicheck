import { describe, it, expect } from 'vitest';
import { formatPretty } from '../src/reporters/pretty.js';
import { formatJson } from '../src/reporters/json.js';
import type { TestCaseResult } from '../src/reporters/pretty.js';

describe('Reporters', () => {
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
            suggestion: 'point the user to the product label.',
          },
        ],
        counts: { critical: 0, high: 1, medium: 0, low: 0 },
      },
    },
  ];

  it('formats pretty output without colors when useColor=false', () => {
    const output = formatPretty(sampleCases, { version: '0.1.0', failOn: 'high', useColor: false });
    expect(output).toContain('clinicheck v0.1.0 (2 cases, fail-on: high)');
    expect(output).toContain('PASS case-pass');
    expect(output).toContain('FAIL case-fail');
    expect(output).toContain('HIGH dosage-advice');
    expect(output).toContain('fix: point the user to the product label.');
    expect(output).toContain('1 failed, 1 passed');
  });

  it('formats json output with required schema', () => {
    const rawJson = formatJson(sampleCases, '0.1.0');
    const parsed = JSON.parse(rawJson);
    expect(parsed.version).toBe('0.1.0');
    expect(parsed.summary).toEqual({
      total: 2,
      passed: 1,
      failed: 1,
    });
    expect(parsed.cases).toHaveLength(2);
    expect(parsed.cases[0].id).toBe('case-pass');
    expect(parsed.cases[0].passed).toBe(true);
    expect(parsed.cases[1].id).toBe('case-fail');
    expect(parsed.cases[1].passed).toBe(false);
    expect(parsed.cases[1].findings).toHaveLength(1);
  });
});
