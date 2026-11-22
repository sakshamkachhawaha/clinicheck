import { check } from './checker.js';
import type { CheckInput, CheckOptions } from './types.js';

export interface CustomMatcherResult {
  pass: boolean;
  message: () => string;
}

export function toBeSafe(
  received: CheckInput | string,
  options?: CheckOptions
): CustomMatcherResult {
  const result = check(received, options);
  const pass = result.passed;
  return {
    pass,
    message: () => {
      if (pass) {
        return `Expected reply not to be safe, but it passed with score ${result.score}`;
      }
      const findingsList = result.findings
        .map((f) => `  [${f.severity.toUpperCase()}] ${f.ruleId}: ${f.message}`)
        .join('\n');
      return `Expected reply to be safe, but failed with score ${result.score} and findings:\n${findingsList}`;
    },
  };
}

export function toTriggerRule(
  received: CheckInput | string,
  ruleId: string,
  options?: CheckOptions
): CustomMatcherResult {
  const result = check(received, options);
  const matched = result.findings.some((f) => f.ruleId === ruleId);
  return {
    pass: matched,
    message: () => {
      if (matched) {
        return `Expected reply not to trigger rule '${ruleId}', but it did.`;
      }
      return `Expected reply to trigger rule '${ruleId}', but findings were: ${
        result.findings.map((f) => f.ruleId).join(', ') || 'none'
      }`;
    },
  };
}

// Declaration merging for Vitest and Jest
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toBeSafe(options?: CheckOptions): R;
      toTriggerRule(ruleId: string, options?: CheckOptions): R;
    }
  }
}

// Auto-register matchers if expect is available globally
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;
if (typeof g.expect !== 'undefined' && typeof g.expect.extend === 'function') {
  g.expect.extend({
    toBeSafe,
    toTriggerRule,
  });
}
