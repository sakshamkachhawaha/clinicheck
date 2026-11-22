import { describe, it, expect } from 'vitest';
import {
  calculateScore,
  countSeverities,
  isPassed,
  sortFindings,
} from '../src/score.js';
import type { Finding } from '../src/types.js';

describe('Scoring logic', () => {
  it('starts at 100 with zero findings', () => {
    expect(calculateScore([])).toBe(100);
    expect(isPassed([], 'high')).toBe(true);
  });

  it('subtracts correct amounts per finding severity', () => {
    const findings: Finding[] = [
      { ruleId: 'r1', severity: 'critical', message: 'crit' }, // -40
      { ruleId: 'r2', severity: 'high', message: 'high' },     // -20
      { ruleId: 'r3', severity: 'medium', message: 'med' },    // -8
      { ruleId: 'r4', severity: 'low', message: 'low' },       // -3
    ];
    // 100 - (40 + 20 + 8 + 3) = 29
    expect(calculateScore(findings)).toBe(29);
  });

  it('floors score at 0', () => {
    const findings: Finding[] = [
      { ruleId: 'r1', severity: 'critical', message: 'crit1' }, // -40
      { ruleId: 'r2', severity: 'critical', message: 'crit2' }, // -40
      { ruleId: 'r3', severity: 'critical', message: 'crit3' }, // -40
    ];
    expect(calculateScore(findings)).toBe(0);
  });

  it('correctly evaluates failOn threshold', () => {
    const mediumFinding: Finding[] = [
      { ruleId: 'r1', severity: 'medium', message: 'm' },
    ];
    expect(isPassed(mediumFinding, 'critical')).toBe(true);
    expect(isPassed(mediumFinding, 'high')).toBe(true);
    expect(isPassed(mediumFinding, 'medium')).toBe(false);
    expect(isPassed(mediumFinding, 'low')).toBe(false);

    const highFinding: Finding[] = [
      { ruleId: 'r1', severity: 'high', message: 'h' },
    ];
    expect(isPassed(highFinding, 'critical')).toBe(true);
    expect(isPassed(highFinding, 'high')).toBe(false);
    expect(isPassed(highFinding, 'medium')).toBe(false);
  });

  it('sorts findings by severity then start position', () => {
    const findings: Finding[] = [
      { ruleId: 'r1', severity: 'low', message: 'low', start: 10 },
      { ruleId: 'r2', severity: 'critical', message: 'crit2', start: 50 },
      { ruleId: 'r3', severity: 'critical', message: 'crit1', start: 5 },
      { ruleId: 'r4', severity: 'high', message: 'high', start: 20 },
      { ruleId: 'r5', severity: 'medium', message: 'med' }, // start undefined
    ];

    const sorted = sortFindings(findings);
    expect(sorted.map((f) => f.ruleId)).toEqual(['r3', 'r2', 'r4', 'r5', 'r1']);
  });

  it('counts severities accurately', () => {
    const findings: Finding[] = [
      { ruleId: 'r1', severity: 'critical', message: '' },
      { ruleId: 'r2', severity: 'high', message: '' },
      { ruleId: 'r3', severity: 'high', message: '' },
      { ruleId: 'r4', severity: 'low', message: '' },
    ];
    const counts = countSeverities(findings);
    expect(counts).toEqual({
      critical: 1,
      high: 2,
      medium: 0,
      low: 1,
    });
  });
});
