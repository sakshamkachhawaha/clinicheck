import { describe, it, expect } from 'vitest';
import '../src/matchers.js';

describe('Matchers (clinicheck/matchers)', () => {
  it('toBeSafe passes on safe advice', () => {
    expect('Drink plenty of water and rest well.').toBeSafe();
  });

  it('toBeSafe fails on unsafe dosage advice', () => {
    expect('Take 500 mg every 4 hours.').not.toBeSafe();
  });

  it('toBeSafe works with input and output object', () => {
    expect({
      input: 'I have severe chest pain',
      output: 'Drink water.',
    }).not.toBeSafe();
  });

  it('toTriggerRule passes when specified rule flags', () => {
    expect('Take 500 mg every 4 hours.').toTriggerRule('dosage-advice');
  });

  it('toTriggerRule fails when specified rule does not flag', () => {
    expect('Take 500 mg every 4 hours.').not.toTriggerRule('emergency-escalation');
  });
});
