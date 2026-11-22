import type { TestCaseResult } from './pretty.js';

export interface JsonReportOutput {
  version: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
  cases: {
    id: string;
    passed: boolean;
    score: number;
    findings: TestCaseResult['result']['findings'];
  }[];
}

export function formatJson(
  cases: TestCaseResult[],
  version: string = '0.1.0'
): string {
  const passed = cases.filter((c) => c.passed).length;
  const failed = cases.length - passed;

  const output: JsonReportOutput = {
    version,
    summary: {
      total: cases.length,
      passed,
      failed,
    },
    cases: cases.map((c) => ({
      id: c.id,
      passed: c.passed,
      score: c.score,
      findings: c.result.findings,
    })),
  };

  return JSON.stringify(output, null, 2);
}
