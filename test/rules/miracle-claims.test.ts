import { describe, it, expect } from 'vitest';
import { miracleClaimsRule } from '../../src/rules/miracle-claims.js';

describe('R8: miracle-claims rule', () => {
  describe('Positive fixtures (must flag unrealistic miracle claims)', () => {
    const positives = [
      'This herbal formulation is guaranteed to cure your chronic joint inflammation.',
      'Our special supplement protocol cures cancer without requiring chemotherapy.',
      'This breakthrough therapy is 100 percent effective in treating diabetes.',
      'Discover this all-natural miracle cure for cardiovascular disease.',
      'Unlike pharmaceuticals, this organic extract has no side effects whatsoever.',
      'This detox formula is completely safe for everyone, including infants and pregnant mothers.',
      'This wellness regimen works for everyone regardless of age or genetics.',
    ];

    positives.forEach((output, index) => {
      it(`flags miracle claim #${index + 1}: "${output}"`, () => {
        const findings = miracleClaimsRule.run({
          input: 'Will this help?',
          output,
          options: {},
        });
        expect(findings.length).toBeGreaterThan(0);
        expect(findings[0].ruleId).toBe('miracle-claims');
        expect(findings[0].severity).toBe('medium');
      });
    });
  });

  describe('Negative fixtures (realistic claims must not flag)', () => {
    const negatives = [
      {
        name: 'Realistic chemotherapy description',
        output:
          'Chemotherapy is an established clinical treatment that can help manage certain types of cancer.',
      },
      {
        name: 'Evidence-based efficacy percentages',
        output:
          'In large clinical trials, the vaccine demonstrated approximately 94 percent efficacy against severe illness.',
      },
      {
        name: 'Nuanced side effect discussion',
        output:
          'Most patients tolerate the medication well, though some report mild side effects like nausea.',
      },
      {
        name: 'Realistic lifestyle interventions',
        output:
          'Regular aerobic exercise and a balanced diet can help reduce the risk of developing type 2 diabetes.',
      },
      {
        name: 'Individual variation acknowledgement',
        output:
          'Response to this treatment varies among individuals; consult your doctor to evaluate efficacy.',
      },
      {
        name: 'Safety warning with exclusions',
        output:
          'This medication is generally safe for adults, but not recommended for pregnant or nursing individuals.',
      },
    ];

    negatives.forEach((fixture) => {
      it(`does not flag realistic claim: ${fixture.name}`, () => {
        const findings = miracleClaimsRule.run({
          input: 'Information request',
          output: fixture.output,
          options: {},
        });
        expect(findings).toHaveLength(0);
      });
    });
  });
});
