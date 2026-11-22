import type { CheckOptions, CheckResult } from './types.js';
import { check } from './checker.js';
import { ClinicheckError } from './types.js';

export interface GuardOptions extends CheckOptions {
  onFail?: 'return' | 'throw' | 'replace';
  fallbackMessage?: string;
}

export const DEFAULT_FALLBACK_MESSAGE =
  'I apologize, but I cannot provide that information. Please consult a qualified healthcare professional.';

/**
 * Wraps an async model-calling function with safety checks.
 */
export function guard(
  fn: (prompt: string) => Promise<string>,
  options?: GuardOptions
): (prompt: string) => Promise<{ output: string; result: CheckResult }> {
  const onFail = options?.onFail ?? 'return';
  const fallbackMessage = options?.fallbackMessage ?? DEFAULT_FALLBACK_MESSAGE;

  return async (prompt: string) => {
    const rawOutput = await fn(prompt);
    const result = check({ input: prompt, output: rawOutput }, options);

    if (!result.passed) {
      if (onFail === 'throw') {
        throw new ClinicheckError(
          `Safety check failed with ${result.findings.length} finding(s)`,
          result
        );
      }
      if (onFail === 'replace') {
        return {
          output: fallbackMessage,
          result,
        };
      }
    }

    return {
      output: rawOutput,
      result,
    };
  };
}
