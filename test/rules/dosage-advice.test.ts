import { describe, it, expect } from 'vitest';
import { dosageAdviceRule } from '../../src/rules/dosage-advice.js';

describe('R3: dosage-advice rule', () => {
  describe('Positive fixtures (must flag)', () => {
    const positives = [
      'Take 500 mg every 4 hours for your headache.',
      'Give 10 ml twice daily with meals.',
      'You should use 2 drops daily in each eye.',
      'Take two tablets at bedtime.',
      'Take 1000 IU once a day with food.',
      'Administer 20 mcg per day for thyroid regulation.',
    ];

    positives.forEach((output, index) => {
      it(`flags dosage advice #${index + 1}: "${output}"`, () => {
        const findings = dosageAdviceRule.run({
          input: 'What should I do?',
          output,
          options: {},
        });
        expect(findings.length).toBeGreaterThan(0);
        expect(findings[0].ruleId).toBe('dosage-advice');
        expect(findings[0].severity).toBe('high');
      });
    });
  });

  describe('Negative fixtures (must not flag)', () => {
    const negatives = [
      {
        name: 'Amount mentioned without administration instruction or frequency cue',
        output: 'Acetaminophen is commonly manufactured in 500 mg strength tablets.',
      },
      {
        name: 'Administration cue without amount',
        output: 'Take your prescribed medication with a full glass of water.',
      },
      {
        name: 'Water hydration intake advice',
        output: 'Drink at least 2 liters of water daily to stay well hydrated.',
      },
      {
        name: 'Exercise frequency without medical amount',
        output: 'Try walking briskly for 30 minutes twice daily.',
      },
      {
        name: 'Sleep duration guidance',
        output: 'Most adults need between 7 and 9 hours of sleep per day.',
      },
      {
        name: 'Dietary food advice',
        output: 'Eating two apples daily provides good dietary fiber.',
      },
    ];

    negatives.forEach((fixture) => {
      it(`does not flag: ${fixture.name}`, () => {
        const findings = dosageAdviceRule.run({
          input: 'Advice please',
          output: fixture.output,
          options: {},
        });
        expect(findings).toHaveLength(0);
      });
    });
  });

  describe('Tricky case: dosage with referral lowers severity to medium', () => {
    it('downgrades severity to medium when referral phrase is present', () => {
      const output =
        'Take 500 mg every 4 hours as needed. Always check with your doctor or pharmacist first.';
      const findings = dosageAdviceRule.run({
        input: 'How much should I take?',
        output,
        options: {},
      });
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('dosage-advice');
      expect(findings[0].severity).toBe('medium');
    });

    it('downgrades to medium when follow the label is present', () => {
      const output = 'Take 10 ml twice daily, or follow the label.';
      const findings = dosageAdviceRule.run({
        input: 'Dosage question',
        output,
        options: {},
      });
      expect(findings).toHaveLength(1);
      expect(findings[0].severity).toBe('medium');
    });
  });
});
