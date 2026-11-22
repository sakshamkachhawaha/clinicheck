import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import {
  validateConfig,
  buildCustomRules,
  loadConfig,
  findClosestRuleId,
} from '../src/config.js';

describe('Config loading & validation', () => {
  it('validates a correct configuration object', () => {
    const config = {
      failOn: 'high',
      locale: 'IN',
      disable: ['missing-referral'],
      severityOverrides: { 'miracle-claims': 'high' },
      piiInInput: 'ignore',
      customRules: [
        {
          id: 'no-brand-names',
          severity: 'low',
          pattern: 'Tylenol|Advil',
          flags: 'i',
          message: 'Brand name mentioned',
        },
      ],
    };

    const validated = validateConfig(config);
    expect(validated.failOn).toBe('high');
    expect(validated.locale).toBe('IN');
  });

  it('detects typo in rule id and suggests closest match (dosage-advise -> dosage-advice)', () => {
    expect(() =>
      validateConfig({
        disable: ['dosage-advise'],
      })
    ).toThrow("unknown rule id 'dosage-advise', did you mean 'dosage-advice'?");
  });

  it('detects typo in rules whitelist array', () => {
    expect(() =>
      validateConfig({
        rules: ['unknown-rule-xyz'],
      })
    ).toThrow("unknown rule id 'unknown-rule-xyz'");
  });

  it('rejects non-array rules or disable', () => {
    expect(() => validateConfig({ rules: 'not-an-array' })).toThrow();
    expect(() => validateConfig({ disable: 123 })).toThrow();
  });

  it('validates severityOverrides', () => {
    expect(() =>
      validateConfig({
        severityOverrides: { 'dosage-advice': 'invalid-sev' },
      })
    ).toThrow("invalid severity 'invalid-sev'");

    expect(() =>
      validateConfig({
        severityOverrides: 'not-an-object',
      })
    ).toThrow('severityOverrides must be an object');
  });

  it('rejects invalid failOn value', () => {
    expect(() =>
      validateConfig({
        failOn: 'extreme',
      })
    ).toThrow("invalid failOn 'extreme', expected critical, high, medium, or low");
  });

  it('rejects invalid locale', () => {
    expect(() =>
      validateConfig({
        locale: 'AUSTRALIA',
      })
    ).toThrow("invalid locale 'AUSTRALIA', expected GLOBAL, US, IN, UK, or EU");
  });

  it('rejects invalid piiInInput', () => {
    expect(() =>
      validateConfig({
        piiInInput: 'block',
      })
    ).toThrow("invalid piiInInput 'block', expected 'ignore' or 'warn'");
  });

  it('validates customRules structure and regex', () => {
    expect(() =>
      validateConfig({
        customRules: 'not-an-array',
      })
    ).toThrow();

    expect(() =>
      validateConfig({
        customRules: [{ id: '' }],
      })
    ).toThrow();

    expect(() =>
      validateConfig({
        customRules: [{ id: 'test', severity: 'invalid' }],
      })
    ).toThrow();

    expect(() =>
      validateConfig({
        customRules: [{ id: 'test', severity: 'low', pattern: '[unclosed', message: 'test' }],
      })
    ).toThrow('invalid regex pattern');
  });

  it('buildCustomRules executes regex pattern against output', () => {
    const customRules = buildCustomRules([
      {
        id: 'no-brand-names',
        severity: 'low',
        pattern: 'Tylenol|Advil',
        flags: 'i',
        message: 'Brand name mentioned',
        suggestion: 'use generic name',
      },
    ]);

    expect(customRules).toHaveLength(1);
    const rule = customRules[0];
    expect(rule.id).toBe('no-brand-names');

    const findings = rule.run({
      input: '',
      output: 'You can take Tylenol for your headache.',
      options: {},
    });
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe('no-brand-names');
    expect(findings[0].severity).toBe('low');
    expect(findings[0].match).toBe('Tylenol');
  });

  it('loadConfig loads file from disk and parses it', () => {
    const tempConfigPath = path.resolve(__dirname, 'temp_valid_config.json');
    fs.writeFileSync(
      tempConfigPath,
      JSON.stringify({
        failOn: 'medium',
        locale: 'UK',
      }),
      'utf8'
    );

    try {
      const res = loadConfig(tempConfigPath);
      expect(res.config.failOn).toBe('medium');
      expect(res.config.locale).toBe('UK');
    } finally {
      if (fs.existsSync(tempConfigPath)) fs.unlinkSync(tempConfigPath);
    }
  });

  it('loadConfig returns empty config when file does not exist and no default', () => {
    expect(() => loadConfig('nonexistent_cfg.json')).toThrow('Config file not found');
  });

  it('findClosestRuleId identifies closest string', () => {
    const known = ['emergency-escalation', 'dosage-advice', 'pii-leak'];
    expect(findClosestRuleId('dosage-advise', known)).toBe('dosage-advice');
    expect(findClosestRuleId('pii-leek', known)).toBe('pii-leak');
  });
});
