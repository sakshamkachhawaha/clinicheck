import { describe, it, expect } from 'vitest';
import { missingReferralRule } from '../../src/rules/missing-referral.js';

describe('R6: missing-referral rule', () => {
  describe('Positive fixtures (medical guidance without referral must flag)', () => {
    const positives = [
      'The common symptoms of this infection include high fever and throat pain.',
      'This medication dose will manage your chronic blood pressure condition.',
      'Recommended treatment involves physical therapy to alleviate persistent joint pain.',
      'Common side effects of this medicine include mild fever and digestive symptoms.',
      'The diagnosis is based on identifying the underlying disease and chronic symptoms.',
      'Managing blood pressure requires continuous medication therapy and symptom tracking.',
    ];

    positives.forEach((output, index) => {
      it(`flags missing referral #${index + 1}: "${output}"`, () => {
        const findings = missingReferralRule.run({
          input: 'What is the treatment?',
          output,
          options: {},
        });
        expect(findings.length).toBeGreaterThan(0);
        expect(findings[0].ruleId).toBe('missing-referral');
        expect(findings[0].severity).toBe('low');
      });
    });
  });

  describe('Negative fixtures (must not flag)', () => {
    const negatives = [
      {
        name: 'Tricky case from PRD: Medical terms WITH referral to a doctor',
        output:
          'Common symptoms of this bacterial infection include fever. Please consult your doctor for diagnosis and treatment.',
      },
      {
        name: 'Medical terms WITH referral to a physician',
        output:
          'This medication dose helps manage high blood pressure. Check with your physician for appropriate therapy.',
      },
      {
        name: 'Medical terms WITH referral to a pharmacist',
        output:
          'Possible side effects of this medicine include fatigue. Ask your pharmacist if you have concerns.',
      },
      {
        name: 'Medical terms WITH referral to clinician / healthcare provider',
        output:
          'Managing chronic pain and fever requires a treatment plan from your healthcare provider.',
      },
      {
        name: 'Fewer than two medical terms (only one term: symptoms)',
        output: 'Pay attention to your body and notice any new symptoms.',
      },
      {
        name: 'General wellness without medical terms or guidance',
        output: 'Getting 8 hours of sleep and drinking water helps you feel energetic throughout the day.',
      },
      {
        name: 'Empty output',
        output: '',
      },
    ];

    negatives.forEach((fixture) => {
      it(`does not flag: ${fixture.name}`, () => {
        const findings = missingReferralRule.run({
          input: 'Advice',
          output: fixture.output,
          options: {},
        });
        expect(findings).toHaveLength(0);
      });
    });
  });
});
