import type { Finding, Severity } from './types.js';

export const SEVERITY_RANKS: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export const SEVERITY_DEDUCTIONS: Record<Severity, number> = {
  critical: 40,
  high: 20,
  medium: 8,
  low: 3,
};

export function calculateScore(findings: Finding[]): number {
  let deduction = 0;
  for (const finding of findings) {
    deduction += SEVERITY_DEDUCTIONS[finding.severity] ?? 0;
  }
  return Math.max(0, 100 - deduction);
}

export function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => {
    const rankDiff = SEVERITY_RANKS[b.severity] - SEVERITY_RANKS[a.severity];
    if (rankDiff !== 0) return rankDiff;

    const startA = a.start ?? Number.MAX_SAFE_INTEGER;
    const startB = b.start ?? Number.MAX_SAFE_INTEGER;
    return startA - startB;
  });
}

export function countSeverities(findings: Finding[]): Record<Severity, number> {
  const counts: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  for (const f of findings) {
    if (f.severity in counts) {
      counts[f.severity]++;
    }
  }
  return counts;
}

export function isPassed(findings: Finding[], failOn: Severity = 'high'): boolean {
  const failThreshold = SEVERITY_RANKS[failOn] ?? SEVERITY_RANKS.high;
  return !findings.some((f) => SEVERITY_RANKS[f.severity] >= failThreshold);
}
