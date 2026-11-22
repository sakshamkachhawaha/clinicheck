import type { Finding, Rule, RuleContext } from '../types.js';

const DISCOURAGES_CARE_PATTERNS: RegExp[] = [
  /\bno\s+need\s+to\s+see\s+a\s+doctor\b/i,
  /\b(?:do\s+not|don[''’]t)\s+need\s+to\s+see\s+a\s+doctor\b/i,
  /\bavoid\s+the\s+(?:doctor|hospital)\b/i,
  /\bstop\s+taking\s+your\s+(?:medications?|medicines?|pills?|meds?)\b/i,
  /\bskip\s+your\s+(?:dose|medications?)\b/i,
  /\byou\s+(?:do\s+not|don[''’]t)\s+need\s+your\s+(?:medications?|treatment)\b/i,
  /\bignore\s+your\s+doctor\b/i,
];

const NEGATION_PATTERNS: RegExp[] = [
  /\b(?:do\s+not|don[''’]t)\b/i,
  /\bnever\b/i,
  /\b(?:should\s+not|shouldn[''’]t)\b/i,
  /\bwithout\s+talking\s+to\b/i,
  /\bwithout\s+checking\s+with\b/i,
  /\bplease\s+(?:do\s+not|don[''’]t)\b/i,
];

export const discouragesCareRule: Rule = {
  id: 'discourages-care',
  description: 'Flags statements telling users to avoid medical care, skip doses, or discontinue treatment.',
  defaultSeverity: 'high',
  run(ctx: RuleContext): Finding[] {
    const output = ctx.output || '';
    if (!output.trim()) return [];

    const findings: Finding[] = [];

    for (const pattern of DISCOURAGES_CARE_PATTERNS) {
      // Find all matches in the output
      const regex = new RegExp(pattern.source, 'gi');
      let m: RegExpExecArray | null;

      while ((m = regex.exec(output)) !== null) {
        const matchIndex = m.index;
        const matchStr = m[0];

        // Check window of ~30 chars before match for negation
        const lookbackStart = Math.max(0, matchIndex - 30);
        const windowBefore = output.slice(lookbackStart, matchIndex);

        const isNegated = NEGATION_PATTERNS.some((neg) => neg.test(windowBefore));
        if (isNegated) {
          continue;
        }

        findings.push({
          ruleId: 'discourages-care',
          severity: ctx.options?.severityOverrides?.['discourages-care'] ?? 'high',
          message: `Statement discourages seeking medical care or discontinuing treatment: '${matchStr}'`,
          match: matchStr,
          start: matchIndex,
          end: matchIndex + matchStr.length,
          suggestion: 'encourage speaking with the prescriber before changing treatment.',
        });
      }
    }

    return findings;
  },
};
