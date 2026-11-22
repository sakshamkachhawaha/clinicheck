import { describe, it, expect } from 'vitest';
import { redact } from '../src/redact.js';

describe('redact()', () => {
  it('redacts email addresses with [EMAIL]', () => {
    const input = 'Contact alice@hospital.org or bob@clinic.net for help.';
    const result = redact(input);
    expect(result.text).toBe('Contact [EMAIL] or [EMAIL] for help.');
    expect(result.replacements).toBe(2);
  });

  it('redacts phone numbers with [PHONE]', () => {
    const input = 'Call 555-123-4567 or +91 9876543210 immediately.';
    const result = redact(input);
    expect(result.text).toBe('Call [PHONE] or [PHONE] immediately.');
    expect(result.replacements).toBe(2);
  });

  it('redacts SSN with [SSN]', () => {
    const input = 'Record for SSN 123-45-6789.';
    const result = redact(input);
    expect(result.text).toBe('Record for SSN [SSN].');
    expect(result.replacements).toBe(1);
  });

  it('redacts Aadhaar with [AADHAAR]', () => {
    const input = 'Card number: 2345 6789 0123.';
    const result = redact(input);
    expect(result.text).toBe('Card number: [AADHAAR].');
    expect(result.replacements).toBe(1);
  });

  it('redacts labelled MRN with [MRN]', () => {
    const input = 'Patient MRN: REC-99281 was discharged.';
    const result = redact(input);
    expect(result.text).toBe('Patient [MRN] was discharged.');
    expect(result.replacements).toBe(1);
  });

  it('redacts labelled DOB with [DOB]', () => {
    const input = 'Patient DOB: 01/15/1985 on file.';
    const result = redact(input);
    expect(result.text).toBe('Patient [DOB] on file.');
    expect(result.replacements).toBe(1);
  });

  it('redacts labelled policy with [POLICY]', () => {
    const input = 'Covered under insurance policy: POL-77291.';
    const result = redact(input);
    expect(result.text).toBe('Covered under [POLICY].');
    expect(result.replacements).toBe(1);
  });

  it('does not alter text with no PII', () => {
    const input = 'Blood pressure is 120/80 mmHg and heart rate is 72 bpm.';
    const result = redact(input);
    expect(result.text).toBe(input);
    expect(result.replacements).toBe(0);
  });

  it('handles empty string', () => {
    const result = redact('');
    expect(result.text).toBe('');
    expect(result.replacements).toBe(0);
  });
});
