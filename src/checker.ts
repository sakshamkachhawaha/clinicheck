import type {
  CheckInput,
  CheckOptions,
  CheckResult,
  Finding,
  Rule,
  Severity,
} from './types.js';
import { getBuiltinRules } from './rules/index.js';
import {
  calculateScore,
  countSeverities,
  isPassed,
  sortFindings,
} from './score.js';

export function check(
  data: CheckInput | string,
  options?: CheckOptions
): CheckResult {
  const inputObj: CheckInput =
    typeof data === 'string' ? { output: data } : data;

  const normalizedInput = inputObj.input ?? '';
  const normalizedOutput = inputObj.output ?? '';
  const opts = options ?? {};

  const allRules: Rule[] = [
    ...getBuiltinRules(),
    ...(opts.customRules ?? []),
  ];

  const enabledRules = allRules.filter((rule) => {
    if (opts.rules && opts.rules.length > 0) {
      if (!opts.rules.includes(rule.id)) return false;
    }
    if (opts.disable && opts.disable.length > 0) {
      if (opts.disable.includes(rule.id)) return false;
    }
    return true;
  });

  const rawFindings: Finding[] = [];
  const ctx = {
    input: normalizedInput,
    output: normalizedOutput,
    options: opts,
  };

  for (const rule of enabledRules) {
    const findings = rule.run(ctx);
    for (const f of findings) {
      rawFindings.push(f);
    }
  }

  const findings = sortFindings(rawFindings);
  const counts = countSeverities(findings);
  const score = calculateScore(findings);
  const failOn = opts.failOn ?? 'high';
  const passed = isPassed(findings, failOn);

  return {
    passed,
    score,
    findings,
    counts,
  };
}

export function checkMany(
  cases: CheckInput[],
  options?: CheckOptions
): CheckResult[] {
  return cases.map((c) => check(c, options));
}

export function createChecker(
  options?: CheckOptions
): (data: CheckInput | string) => CheckResult {
  return (data: CheckInput | string) => check(data, options);
}

export function listRules(): {
  id: string;
  description: string;
  defaultSeverity: Severity;
}[] {
  return getBuiltinRules().map((r) => ({
    id: r.id,
    description: r.description,
    defaultSeverity: r.defaultSeverity,
  }));
}
