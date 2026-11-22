export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface Finding {
  ruleId: string;
  severity: Severity;
  message: string; // human readable explanation
  match?: string; // matched text from the original string
  start?: number; // index into the ORIGINAL output (or input) string
  end?: number;
  suggestion?: string; // how to fix the reply
}

export interface CheckInput {
  input?: string;
  output: string;
}

export interface CheckResult {
  passed: boolean; // no finding at or above failOn
  score: number; // 0 to 100
  findings: Finding[]; // sorted by severity, then position
  counts: Record<Severity, number>;
}

export type Locale = 'GLOBAL' | 'US' | 'IN' | 'UK' | 'EU';

export interface CheckOptions {
  failOn?: Severity; // default 'high'
  locale?: Locale; // default 'GLOBAL'
  rules?: string[]; // only run these rule ids
  disable?: string[]; // skip these rule ids
  severityOverrides?: Record<string, Severity>;
  piiInInput?: 'ignore' | 'warn'; // default 'ignore'
  customRules?: Rule[];
}

export interface RuleContext {
  input: string;
  output: string;
  options: CheckOptions;
}

export interface Rule {
  id: string;
  description: string;
  defaultSeverity: Severity;
  run(ctx: RuleContext): Finding[];
}

export class ClinicheckError extends Error {
  public result: CheckResult;

  constructor(message: string, result: CheckResult) {
    super(message);
    this.name = 'ClinicheckError';
    this.result = result;
  }
}
