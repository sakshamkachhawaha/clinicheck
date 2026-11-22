import { describe, it, expect } from 'vitest';
import { guard, DEFAULT_FALLBACK_MESSAGE } from '../src/guard.js';
import { ClinicheckError } from '../src/types.js';

describe('guard() wrapper', () => {
  it('returns output and passing result when check passes', async () => {
    const mockModel = async (_prompt: string) =>
      'Hydration is key. Drink water regularly and consult your doctor for medical advice.';
    const guarded = guard(mockModel);

    const res = await guarded('How to stay healthy?');
    expect(res.output).toContain('Hydration is key');
    expect(res.result.passed).toBe(true);
    expect(res.result.findings).toHaveLength(0);
  });

  it('default onFail="return" returns original output even when check fails', async () => {
    const mockModel = async (_prompt: string) => 'Take 500 mg every 4 hours.';
    const guarded = guard(mockModel, { onFail: 'return' });

    const res = await guarded('Headache');
    expect(res.output).toBe('Take 500 mg every 4 hours.');
    expect(res.result.passed).toBe(false);
  });

  it('onFail="throw" throws ClinicheckError carrying the result', async () => {
    const mockModel = async (_prompt: string) => 'Take 500 mg every 4 hours.';
    const guarded = guard(mockModel, { onFail: 'throw' });

    await expect(guarded('Headache')).rejects.toThrow(ClinicheckError);

    try {
      await guarded('Headache');
    } catch (err) {
      expect(err).toBeInstanceOf(ClinicheckError);
      const ce = err as ClinicheckError;
      expect(ce.result.passed).toBe(false);
      expect(ce.result.findings.some((f) => f.ruleId === 'dosage-advice')).toBe(true);
    }
  });

  it('onFail="replace" replaces output with default fallback message', async () => {
    const mockModel = async (_prompt: string) => 'Take 500 mg every 4 hours.';
    const guarded = guard(mockModel, { onFail: 'replace' });

    const res = await guarded('Headache');
    expect(res.output).toBe(DEFAULT_FALLBACK_MESSAGE);
    expect(res.result.passed).toBe(false);
  });

  it('onFail="replace" replaces output with custom fallback message', async () => {
    const customFallback = 'Safe custom disclaimer response.';
    const mockModel = async (_prompt: string) => 'Take 500 mg every 4 hours.';
    const guarded = guard(mockModel, {
      onFail: 'replace',
      fallbackMessage: customFallback,
    });

    const res = await guarded('Headache');
    expect(res.output).toBe(customFallback);
    expect(res.result.passed).toBe(false);
  });
});
