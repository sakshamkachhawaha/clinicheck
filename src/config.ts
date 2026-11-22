import fs from 'node:fs';
import path from 'node:path';
import type { CheckOptions, Locale, Rule, Severity } from './types.js';
import { getBuiltinRules } from './rules/index.js';

export interface CustomRuleConfig {
  id: string;
  severity: Severity;
  pattern: string;
  flags?: string;
  message: string;
  suggestion?: string;
}

export interface ClinicheckConfig {
  failOn?: Severity;
  locale?: Locale;
  rules?: string[];
  disable?: string[];
  severityOverrides?: Record<string, Severity>;
  piiInInput?: 'ignore' | 'warn';
  customRules?: CustomRuleConfig[];
}

const VALID_SEVERITIES: Set<string> = new Set(['critical', 'high', 'medium', 'low']);
const VALID_LOCALES: Set<string> = new Set(['GLOBAL', 'US', 'IN', 'UK', 'EU']);

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

export function findClosestRuleId(unknownId: string, knownIds: string[]): string | undefined {
  let bestMatch: string | undefined;
  let minDistance = 4; // max distance threshold to consider as a typo suggestion

  for (const id of knownIds) {
    const dist = levenshtein(unknownId.toLowerCase(), id.toLowerCase());
    if (dist < minDistance) {
      minDistance = dist;
      bestMatch = id;
    }
  }

  return bestMatch;
}

export function validateRuleId(id: string, knownIds: string[]): void {
  if (!knownIds.includes(id)) {
    const closest = findClosestRuleId(id, knownIds);
    if (closest) {
      throw new Error(`unknown rule id '${id}', did you mean '${closest}'?`);
    }
    throw new Error(`unknown rule id '${id}'`);
  }
}

export function validateConfig(config: unknown): ClinicheckConfig {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error('Config must be a valid JSON object');
  }

  const raw = config as Record<string, unknown>;
  const knownRuleIds = getBuiltinRules().map((r) => r.id);

  if (raw.failOn !== undefined) {
    if (typeof raw.failOn !== 'string' || !VALID_SEVERITIES.has(raw.failOn)) {
      throw new Error(`invalid failOn '${raw.failOn}', expected critical, high, medium, or low`);
    }
  }

  if (raw.locale !== undefined) {
    if (typeof raw.locale !== 'string' || !VALID_LOCALES.has(raw.locale)) {
      throw new Error(`invalid locale '${raw.locale}', expected GLOBAL, US, IN, UK, or EU`);
    }
  }

  if (raw.piiInInput !== undefined) {
    if (raw.piiInInput !== 'ignore' && raw.piiInInput !== 'warn') {
      throw new Error(`invalid piiInInput '${raw.piiInInput}', expected 'ignore' or 'warn'`);
    }
  }

  if (raw.rules !== undefined) {
    if (!Array.isArray(raw.rules)) {
      throw new Error('rules must be an array of rule id strings');
    }
    for (const r of raw.rules) {
      if (typeof r !== 'string') {
        throw new Error(`rule id must be a string, got ${typeof r}`);
      }
      validateRuleId(r, knownRuleIds);
    }
  }

  if (raw.disable !== undefined) {
    if (!Array.isArray(raw.disable)) {
      throw new Error('disable must be an array of rule id strings');
    }
    for (const d of raw.disable) {
      if (typeof d !== 'string') {
        throw new Error(`rule id in disable must be a string, got ${typeof d}`);
      }
      validateRuleId(d, knownRuleIds);
    }
  }

  if (raw.severityOverrides !== undefined) {
    if (typeof raw.severityOverrides !== 'object' || Array.isArray(raw.severityOverrides) || raw.severityOverrides === null) {
      throw new Error('severityOverrides must be an object map of rule ids to severities');
    }
    const overrides = raw.severityOverrides as Record<string, unknown>;
    for (const [key, val] of Object.entries(overrides)) {
      validateRuleId(key, knownRuleIds);
      if (typeof val !== 'string' || !VALID_SEVERITIES.has(val)) {
        throw new Error(`invalid severity '${val}' for override '${key}'`);
      }
    }
  }

  if (raw.customRules !== undefined) {
    if (!Array.isArray(raw.customRules)) {
      throw new Error('customRules must be an array of rule objects');
    }
    for (const cr of raw.customRules) {
      if (!cr || typeof cr !== 'object') {
        throw new Error('custom rule item must be an object');
      }
      const item = cr as Record<string, unknown>;
      if (!item.id || typeof item.id !== 'string') {
        throw new Error('custom rule must specify a string id');
      }
      if (!item.severity || typeof item.severity !== 'string' || !VALID_SEVERITIES.has(item.severity)) {
        throw new Error(`custom rule '${item.id}' has invalid severity '${item.severity}'`);
      }
      if (!item.pattern || typeof item.pattern !== 'string') {
        throw new Error(`custom rule '${item.id}' must specify a string pattern`);
      }
      if (!item.message || typeof item.message !== 'string') {
        throw new Error(`custom rule '${item.id}' must specify a string message`);
      }
      try {
        new RegExp(item.pattern, (item.flags as string) || 'gi');
      } catch (err) {
        throw new Error(`custom rule '${item.id}' has invalid regex pattern: ${item.pattern}`);
      }
    }
  }

  return raw as ClinicheckConfig;
}

export function buildCustomRules(customRuleConfigs?: CustomRuleConfig[]): Rule[] {
  if (!customRuleConfigs || customRuleConfigs.length === 0) return [];

  return customRuleConfigs.map((cr) => ({
    id: cr.id,
    description: cr.message,
    defaultSeverity: cr.severity,
    run(ctx) {
      const output = ctx.output || '';
      if (!output) return [];

      const findings = [];
      let flags = cr.flags ?? 'gi';
      if (!flags.includes('g')) {
        flags += 'g';
      }
      const regex = new RegExp(cr.pattern, flags);
      let m: RegExpExecArray | null;

      while ((m = regex.exec(output)) !== null) {
        findings.push({
          ruleId: cr.id,
          severity: ctx.options?.severityOverrides?.[cr.id] ?? cr.severity,
          message: cr.message,
          match: m[0],
          start: m.index,
          end: m.index + m[0].length,
          suggestion: cr.suggestion,
        });
      }

      return findings;
    },
  }));
}

export function loadConfig(customPath?: string): {
  config: ClinicheckConfig;
  customRules: Rule[];
} {
  let targetPath = customPath ? path.resolve(process.cwd(), customPath) : null;

  if (!targetPath) {
    const defaultFile = path.resolve(process.cwd(), 'clinicheck.config.json');
    if (fs.existsSync(defaultFile)) {
      targetPath = defaultFile;
    }
  }

  if (!targetPath) {
    return { config: {}, customRules: [] };
  }

  if (!fs.existsSync(targetPath)) {
    throw new Error(`Config file not found: ${customPath}`);
  }

  let fileContent = '';
  try {
    fileContent = fs.readFileSync(targetPath, 'utf8');
  } catch {
    throw new Error(`Failed to read config file: ${targetPath}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(fileContent);
  } catch {
    throw new Error(`Invalid JSON in config file: ${targetPath}`);
  }

  const validated = validateConfig(parsed);
  const customRules = buildCustomRules(validated.customRules);

  return {
    config: validated,
    customRules,
  };
}
