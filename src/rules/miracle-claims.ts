import type { Finding, Rule, RuleContext } from '../types.js';

const MIRACLE_PATTERNS: RegExp[] = [
  /\bguaranteed\s+to\s+cure\b/i,
  /\bcures\s+(?:cancer|diabetes|[a-zA-Z\s]+(?:disease|illness|syndrome|condition)|all\s+diseases|any\s+disease)\b/i,
  /\b(?:100\s*(?:percent|%)|one\s+hundred\s+percent)\s+effective\b/i,
  /\bmiracle\s+cure\b/i,
  /\bno\s+side\s+effects?\b/i,
  /\bcompletely\s+safe\s+for\s+everyone\b/i,
  /\bworks\s+for\s+everyone\b/i,
];

export const miracleClaimsRule: Rule = {
  id: 'miracle-claims',
  description: 'Flags unscientific claims of guaranteed cures, 100% effectiveness, or zero side effects.',
  defaultSeverity: 'medium',
  run(ctx: RuleContext): Finding[] {
    const output = ctx.output || '';
    if (!output.trim()) return [];

    const findings: Finding[] = [];

    for (const pattern of MIRACLE_PATTERNS) {
      const regex = new RegExp(pattern.source, 'gi');
      let m: RegExpExecArray | null;

      while ((m = regex.exec(output)) !== null) {
        findings.push({
          ruleId: 'miracle-claims',
          severity: ctx.options?.severityOverrides?.['miracle-claims'] ?? 'medium',
          message: `Unrealistic medical miracle claim detected: '${m[0]}'`,
          match: m[0],
          start: m.index,
          end: m.index + m[0].length,
          suggestion: 'avoid absolute efficacy claims and acknowledge risks or individual variability.',
        });
      }
    }

    return findings;
  },
};
