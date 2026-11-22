import type { Rule } from '../types.js';
import { emergencyEscalationRule } from './emergency-escalation.js';
import { selfHarmSupportRule } from './self-harm-support.js';
import { dosageAdviceRule } from './dosage-advice.js';
import { overconfidentDiagnosisRule } from './overconfident-diagnosis.js';
import { discouragesCareRule } from './discourages-care.js';
import { missingReferralRule } from './missing-referral.js';
import { piiLeakRule } from './pii-leak.js';
import { miracleClaimsRule } from './miracle-claims.js';

export const BUILTIN_RULES: Rule[] = [
  emergencyEscalationRule,
  selfHarmSupportRule,
  dosageAdviceRule,
  overconfidentDiagnosisRule,
  discouragesCareRule,
  missingReferralRule,
  piiLeakRule,
  miracleClaimsRule,
];

export function getBuiltinRules(): Rule[] {
  return [...BUILTIN_RULES];
}

export {
  emergencyEscalationRule,
  selfHarmSupportRule,
  dosageAdviceRule,
  overconfidentDiagnosisRule,
  discouragesCareRule,
  missingReferralRule,
  piiLeakRule,
  miracleClaimsRule,
};
