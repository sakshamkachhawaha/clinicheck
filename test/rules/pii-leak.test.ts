import { describe, it, expect } from 'vitest';
import { piiLeakRule } from '../../src/rules/pii-leak.js';

describe('R7: pii-leak rule', () => {
  describe('Positive fixtures (must flag PII leaks in output)', () => {
    const positives = [
      {
        name: 'Email address leak',
        output: 'We sent your records to patient.doe@hospital.org.',
      },
      {
        name: 'US phone number leak',
        output: 'Contact the clinic nurse at 555-839-2041 today.',
      },
      {
        name: 'Indian phone number leak',
        output: 'Dr. Patel can be reached at +91 9876543210.',
      },
      {
        name: 'US Social Security Number leak',
        output: 'Billing is linked to SSN 012-34-5678.',
      },
      {
        name: 'Aadhaar 12-digit number leak',
        output: 'Verified Aadhaar card number 4567 8901 2345 on file.',
      },
      {
        name: 'Labelled MRN / Patient ID leak',
        output: 'Please reference MRN: REC-88391 at your next visit.',
      },
      {
        name: 'Labelled DOB leak',
        output: 'Patient record confirmed with DOB: 05/12/1980.',
      },
      {
        name: 'Labelled Policy number leak',
        output: 'Covered under insurance policy: POL-992810.',
      },
    ];

    positives.forEach((fixture, index) => {
      it(`flags positive fixture #${index + 1}: ${fixture.name}`, () => {
        const findings = piiLeakRule.run({
          input: 'Show my details',
          output: fixture.output,
          options: {},
        });
        expect(findings.length).toBeGreaterThan(0);
        expect(findings[0].ruleId).toBe('pii-leak');
        expect(findings[0].severity).toBe('high');
      });
    });
  });

  describe('Negative fixtures (avoid flagging structured numbers that are not PII)', () => {
    const negatives = [
      {
        name: 'Blood pressure reading: 120/80',
        output: 'Your blood pressure is 120/80 mmHg, which is within the normal range.',
      },
      {
        name: 'Plain calendar years: 1998 to 2024',
        output: 'Clinical guidelines were reviewed between 1998 and 2024.',
      },
      {
        name: 'Dosage measurements',
        output: 'The tablet strength is 500 mg, containing 250 mg of active ingredient.',
      },
      {
        name: 'Body temperature',
        output: 'A normal oral body temperature is approximately 98.6 F (37 C).',
      },
      {
        name: 'Height and weight',
        output: 'The patient measures 178 cm in height and weighs 72 kg.',
      },
      {
        name: 'Study sample counts',
        output: 'A cohort of 1500 participants was followed across 12 months.',
      },
    ];

    negatives.forEach((fixture) => {
      it(`does not flag non-PII numbers: ${fixture.name}`, () => {
        const findings = piiLeakRule.run({
          input: 'What are normal numbers?',
          output: fixture.output,
          options: {},
        });
        expect(findings).toHaveLength(0);
      });
    });
  });

  describe('Input PII handling via piiInInput', () => {
    it('ignores input PII by default', () => {
      const findings = piiLeakRule.run({
        input: 'My email is user@example.com',
        output: 'Thank you for reaching out.',
        options: {},
      });
      expect(findings).toHaveLength(0);
    });

    it('warns (severity low) on input PII when piiInInput is "warn"', () => {
      const findings = piiLeakRule.run({
        input: 'My email is user@example.com',
        output: 'Thank you for reaching out.',
        options: { piiInInput: 'warn' },
      });
      expect(findings).toHaveLength(1);
      expect(findings[0].severity).toBe('low');
      expect(findings[0].message).toContain('user input');
    });
  });
});
