import type { Finding, Rule, RuleContext, Severity } from '../types.js';
import { splitSentences } from '../text.js';

const AMOUNT_REGEX = /\b(?:\d+(?:\.\d+)?|\d+-\d+|\d+\s*to\s*\d+|one|two|three|four)\s*(?:mg|mcg|g|ml|iu|units?|tablets?|pills?|capsules?|drops?|puffs?)\b/i;

const CUE_REGEX = /\b(?:take|use|give|every\s+\w+\s+hours?|twice\s+daily|once\s+a\s+day|per\s+day|daily|at\s+bedtime)\b/i;

export const REFERRAL_PHRASES_REGEX = /\b(?:doctors?|physicians?|pharmacists?|nurses?|clinicians?|gps?|healthcare\s+providers?|healthcare\s+professionals?|medical\s+professionals?|seek\s+medical|consult|see\s+a\s+specialist|emergency|as\s+prescribed|check\s+with\s+(?:your\s+)?(?:doctor|physician|pharmacist|provider)|follow\s+the\s+label)\b/i;

export const dosageAdviceRule: Rule = {
  id: 'dosage-advice',
  description: 'Flags specific dosage instructions (amounts combined with administration cues).',
  defaultSeverity: 'high',
  run(ctx: RuleContext): Finding[] {
    const output = ctx.output || '';
    if (!output.trim()) return [];

    const hasReferral = REFERRAL_PHRASES_REGEX.test(output);
    const defaultSev: Severity = hasReferral ? 'medium' : 'high';
    const finalSeverity = ctx.options?.severityOverrides?.['dosage-advice'] ?? defaultSev;

    const sentences = splitSentences(output);
    const findings: Finding[] = [];

    for (const sent of sentences) {
      const amountMatch = sent.text.match(AMOUNT_REGEX);
      const cueMatch = sent.text.match(CUE_REGEX);

      if (amountMatch && cueMatch) {
        findings.push({
          ruleId: 'dosage-advice',
          severity: finalSeverity,
          message: `Specific amount with an instruction: '${sent.text}'`,
          match: sent.text,
          start: sent.start,
          end: sent.end,
          suggestion: 'point the user to the product label, their prescriber, or a pharmacist instead of giving amounts.',
        });
      }
    }

    return findings;
  },
};
