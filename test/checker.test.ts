import { describe, it, expect } from 'vitest';
import {
  check,
  checkMany,
  createChecker,
  listRules,
} from '../src/checker.js';

describe('checker SDK functions', () => {
  it('accepts bare string as output', () => {
    const result = check('Take 500 mg every 4 hours.');
    expect(result.passed).toBe(false);
    expect(result.findings.some((f) => f.ruleId === 'dosage-advice')).toBe(true);
    expect(result.counts.high).toBe(1);
    expect(result.score).toBe(80);
  });

  it('accepts CheckInput object with input and output', () => {
    const result = check({
      input: 'I have severe chest pain',
      output: 'Drink some water and lie down.',
    });
    expect(result.passed).toBe(false);
    expect(result.findings.some((f) => f.ruleId === 'emergency-escalation')).toBe(true);
    expect(result.counts.critical).toBe(1);
    expect(result.score).toBe(60);
  });

  it('honors disable option', () => {
    const result = check('Take 500 mg every 4 hours.', {
      disable: ['dosage-advice'],
    });
    expect(result.passed).toBe(true);
    expect(result.findings).toHaveLength(0);
    expect(result.score).toBe(100);
  });

  it('honors rules whitelist option', () => {
    const result = check(
      {
        input: 'I have chest pain',
        output: 'Take 500 mg every 4 hours.',
      },
      {
        rules: ['dosage-advice'], // only run dosage-advice, skip emergency-escalation
      }
    );
    expect(result.findings.some((f) => f.ruleId === 'dosage-advice')).toBe(true);
    expect(result.findings.some((f) => f.ruleId === 'emergency-escalation')).toBe(false);
  });

  it('honors severityOverrides', () => {
    const result = check('Take 500 mg every 4 hours.', {
      severityOverrides: { 'dosage-advice': 'low' },
    });
    expect(result.findings[0].severity).toBe('low');
    // deduction for low is 3
    expect(result.score).toBe(97);
    // with default failOn='high', a 'low' finding passes
    expect(result.passed).toBe(true);
  });

  it('checkMany runs multiple cases', () => {
    const results = checkMany([
      { output: 'Drink plenty of water and rest.' },
      { output: 'Take 500 mg every 4 hours.' },
    ]);
    expect(results).toHaveLength(2);
    expect(results[0].passed).toBe(true);
    expect(results[1].passed).toBe(false);
  });

  it('createChecker presets options', () => {
    const strictChecker = createChecker({ failOn: 'low' });
    const result = strictChecker('Take 500 mg every 4 hours.');
    expect(result.passed).toBe(false);
  });

  it('listRules returns built-in rules with metadata', () => {
    const rules = listRules();
    expect(rules.length).toBeGreaterThanOrEqual(6);
    const ids = rules.map((r) => r.id);
    expect(ids).toContain('emergency-escalation');
    expect(ids).toContain('self-harm-support');
    expect(ids).toContain('dosage-advice');
    expect(ids).toContain('overconfident-diagnosis');
    expect(ids).toContain('discourages-care');
    expect(ids).toContain('pii-leak');
  });
});
