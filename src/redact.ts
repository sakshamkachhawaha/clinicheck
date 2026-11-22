import type { CheckOptions } from './types.js';
import { findPii } from './rules/pii-leak.js';

export interface RedactResult {
  text: string;
  replacements: number;
}

/**
 * Replaces detected PII in text with standardized redaction tags ([EMAIL], [PHONE], [SSN], [AADHAAR], [MRN], [DOB], [POLICY]).
 */
export function redact(text: string, _options?: CheckOptions): RedactResult {
  if (!text) {
    return { text: '', replacements: 0 };
  }

  const matches = findPii(text);
  if (matches.length === 0) {
    return { text, replacements: 0 };
  }

  let result = '';
  let lastIndex = 0;

  for (const m of matches) {
    result += text.slice(lastIndex, m.start);
    result += m.tag;
    lastIndex = m.end;
  }
  result += text.slice(lastIndex);

  return {
    text: result,
    replacements: matches.length,
  };
}
