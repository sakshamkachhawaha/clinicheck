export {
  check,
  checkMany,
  createChecker,
  listRules,
} from './checker.js';

export { redact, type RedactResult } from './redact.js';

export {
  guard,
  type GuardOptions,
  DEFAULT_FALLBACK_MESSAGE,
} from './guard.js';

export {
  type Severity,
  type Finding,
  type CheckInput,
  type CheckResult,
  type Locale,
  type CheckOptions,
  type RuleContext,
  type Rule,
  ClinicheckError,
} from './types.js';

export {
  calculateScore,
  sortFindings,
  countSeverities,
  isPassed,
  SEVERITY_DEDUCTIONS,
  SEVERITY_RANKS,
} from './score.js';

export { splitSentences, type SentenceSpan } from './text.js';
