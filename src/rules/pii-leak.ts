import type { Finding, Rule, RuleContext, Severity } from '../types.js';

export interface PiiDetector {
  tag: string;
  regex: RegExp;
  description: string;
}

export const PII_DETECTORS: PiiDetector[] = [
  {
    tag: '[EMAIL]',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    description: 'Email address',
  },
  {
    tag: '[SSN]',
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    description: 'US Social Security Number',
  },
  {
    tag: '[AADHAAR]',
    regex: /\b[2-9]\d{3}\s\d{4}\s\d{4}\b/g,
    description: 'Aadhaar number',
  },
  {
    tag: '[PHONE]',
    // US Phone: (555) 123-4567, 555-123-4567, +1-555-123-4567
    regex: /(?:\+?1[-.\s]?)?(?:\([2-9]\d{2}\)|[2-9]\d{2})[-.\s]\d{3}[-.\s]\d{4}\b/g,
    description: 'US Phone number',
  },
  {
    tag: '[PHONE]',
    // Indian phone: +91 9876543210, +91-98765-43210, 9876543210
    regex: /(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?[0-9]{5}\b|(?:\+91[\s-]?)?[6-9]\d{9}\b/g,
    description: 'Indian Phone number',
  },
  {
    tag: '[PHONE]',
    // International phone with leading + and spaces/dashes
    regex: /\+[1-9]\d{0,2}[-.\s](?:\(?\d{1,4}\)?[-.\s])?\d{3,4}[-.\s]\d{3,4}\b/g,
    description: 'International Phone number',
  },
  {
    tag: '[MRN]',
    regex: /\b(?:mrn|medical\s+record\s+number|patient\s+id)[:\s#]+[A-Za-z0-9-]{5,}\b/gi,
    description: 'Medical Record Number / Patient ID',
  },
  {
    tag: '[DOB]',
    regex: /\b(?:dob|date\s+of\s+birth|born\s+on)[:\s#]+(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}|\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?),?\s+\d{4})\b/gi,
    description: 'Date of Birth',
  },
  {
    tag: '[POLICY]',
    regex: /\b(?:insurance(?:\s+(?:number|id|policy))?|policy(?:\s+(?:number|id))?)[:\s#]+[A-Za-z0-9-]{4,}\b/gi,
    description: 'Insurance or Policy Number',
  },
];

export interface PiiMatch {
  tag: string;
  match: string;
  start: number;
  end: number;
  description: string;
}

export function findPii(text: string): PiiMatch[] {
  if (!text) return [];

  const rawMatches: PiiMatch[] = [];

  for (const detector of PII_DETECTORS) {
    const re = new RegExp(detector.regex.source, detector.regex.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      rawMatches.push({
        tag: detector.tag,
        match: m[0],
        start: m.index,
        end: m.index + m[0].length,
        description: detector.description,
      });
    }
  }

  // Sort by start position
  rawMatches.sort((a, b) => a.start - b.start || b.end - a.end);

  // De-duplicate / remove overlapping matches (prefer longer/earlier match)
  const deduped: PiiMatch[] = [];
  let lastEnd = -1;

  for (const item of rawMatches) {
    if (item.start >= lastEnd) {
      deduped.push(item);
      lastEnd = item.end;
    }
  }

  return deduped;
}

export const piiLeakRule: Rule = {
  id: 'pii-leak',
  description: 'Flags personally identifiable information (emails, phones, SSNs, Aadhaar, MRN, DOB, policy numbers).',
  defaultSeverity: 'high',
  run(ctx: RuleContext): Finding[] {
    const findings: Finding[] = [];

    // Check output
    const output = ctx.output || '';
    if (output) {
      const outputMatches = findPii(output);
      const sev: Severity = ctx.options?.severityOverrides?.['pii-leak'] ?? 'high';

      for (const m of outputMatches) {
        findings.push({
          ruleId: 'pii-leak',
          severity: sev,
          message: `Detected potential PII leak (${m.description}): '${m.match}'`,
          match: m.match,
          start: m.start,
          end: m.end,
          suggestion: 'remove personally identifiable information before returning the response.',
        });
      }
    }

    // Check input if piiInInput is 'warn'
    if (ctx.options?.piiInInput === 'warn' && ctx.input) {
      const inputMatches = findPii(ctx.input);
      const inputSev: Severity = ctx.options?.severityOverrides?.['pii-leak'] ?? 'low';

      for (const m of inputMatches) {
        findings.push({
          ruleId: 'pii-leak',
          severity: inputSev,
          message: `Detected PII in user input (${m.description}): '${m.match}'`,
          match: m.match,
          start: m.start,
          end: m.end,
          suggestion: 'consider redacting user input before processing.',
        });
      }
    }

    return findings;
  },
};
