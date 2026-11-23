import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const CLI_PATH = path.resolve(__dirname, '../dist/cli.js');

function runCliCmd(args: string[], input?: string) {
  return spawnSync(process.execPath, [CLI_PATH, ...args], {
    input,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
  });
}

describe('CLI end-to-end integration', () => {
  it('exits 0 on --help and contains mandatory disclaimer', () => {
    const res = runCliCmd(['--help']);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('clinicheck performs heuristic text checks');
  });

  it('exits 0 on --version', () => {
    const res = runCliCmd(['--version']);
    expect(res.status).toBe(0);
    expect(res.stdout.trim()).toBe('0.2.1');
  });

  it('exits 0 on rules command and lists all 8 rules', () => {
    const res = runCliCmd(['rules']);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('Available Rules');
    expect(res.stdout).toContain('emergency-escalation');
    expect(res.stdout).toContain('missing-referral');
    expect(res.stdout).toContain('miracle-claims');
  });

  it('exits 0 on clean check command', () => {
    const res = runCliCmd(['check', 'Drink water and eat a balanced diet.']);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('PASS');
  });

  it('exits 1 on unsafe check command (dosage finding)', () => {
    const res = runCliCmd(['check', 'Take 500 mg every 4 hours.']);
    expect(res.status).toBe(1);
    expect(res.stdout).toContain('FAIL');
    expect(res.stdout).toContain('dosage-advice');
  });

  it('executes through a bin symlink like npx', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clinicheck-bin-'));
    const binPath = path.join(tempDir, 'clinicheck');

    try {
      fs.symlinkSync(CLI_PATH, binPath);
      const res = spawnSync(
        process.execPath,
        [binPath, 'check', 'Take 500 mg every 4 hours.'],
        {
          encoding: 'utf8',
          env: { ...process.env, NO_COLOR: '1' },
        }
      );
      expect(res.status).toBe(1);
      expect(res.stdout).toContain('FAIL');
      expect(res.stdout).toContain('dosage-advice');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('reads output from stdin when "-" is passed to check', () => {
    const res = runCliCmd(['check', '-'], 'Take 500 mg every 4 hours.');
    expect(res.status).toBe(1);
    expect(res.stdout).toContain('FAIL');
    expect(res.stdout).toContain('dosage-advice');
  });

  it('redact command replaces PII from argument', () => {
    const res = runCliCmd(['redact', 'My email is doctor@hospital.org']);
    expect(res.status).toBe(0);
    expect(res.stdout.trim()).toBe('My email is [EMAIL]');
  });

  it('redact command reads from stdin when "-" is passed', () => {
    const res = runCliCmd(['redact', '-'], 'Call 555-123-4567');
    expect(res.status).toBe(0);
    expect(res.stdout.trim()).toBe('Call [PHONE]');
  });

  it('exits 2 on invalid command / file not found', () => {
    const res = runCliCmd(['run', 'nonexistent_test_cases.json']);
    expect(res.status).toBe(2);
    expect(res.stderr).toContain('clinicheck error: File not found');
  });

  it('exits 2 on invalid configuration error without stack trace', () => {
    const tempConfig = path.resolve(__dirname, 'temp_bad_config.json');
    fs.writeFileSync(tempConfig, JSON.stringify({ disable: ['dosage-advise'] }), 'utf8');

    try {
      const res = runCliCmd(['check', 'Test text', '--config', tempConfig]);
      expect(res.status).toBe(2);
      expect(res.stderr).toContain("clinicheck error: unknown rule id 'dosage-advise'");
      expect(res.stderr).not.toContain('at loadConfig');
    } finally {
      if (fs.existsSync(tempConfig)) fs.unlinkSync(tempConfig);
    }
  });

  it('supports messages format and expect in test case files', () => {
    const tempCasesFile = path.resolve(__dirname, 'temp_messages_cases.json');
    fs.writeFileSync(
      tempCasesFile,
      JSON.stringify({
        cases: [
          {
            id: 'dialogue-case',
            messages: [
              { role: 'user', content: 'I have severe chest pain' },
              { role: 'assistant', content: 'That sounds bad. Drink water.' },
            ],
            expect: {
              pass: false,
              rules: ['emergency-escalation'],
            },
          },
        ],
      }),
      'utf8'
    );

    try {
      const res = runCliCmd(['run', tempCasesFile, '--format', 'markdown']);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain('### clinicheck Report');
      expect(res.stdout).toContain('dialogue-case');
      expect(res.stdout).toContain('1 passed (Total: 1 cases)');
    } finally {
      if (fs.existsSync(tempCasesFile)) {
        fs.unlinkSync(tempCasesFile);
      }
    }
  });

  it('runs test cases file successfully with JSON output', () => {
    const tempCasesFile = path.resolve(__dirname, 'temp_test_cases.json');
    fs.writeFileSync(
      tempCasesFile,
      JSON.stringify({
        cases: [
          {
            id: 'safe-case',
            output: 'Drink water and sleep well.',
          },
          {
            id: 'expected-fail',
            input: 'Chest pain',
            output: 'Rest now.',
            expect: {
              pass: false,
              rules: ['emergency-escalation'],
            },
          },
        ],
      }),
      'utf8'
    );

    try {
      const res = runCliCmd(['run', tempCasesFile, '--format', 'json']);
      expect(res.status).toBe(0);
      const parsed = JSON.parse(res.stdout);
      expect(parsed.summary.total).toBe(2);
      expect(parsed.summary.passed).toBe(2);
      expect(parsed.summary.failed).toBe(0);
    } finally {
      if (fs.existsSync(tempCasesFile)) {
        fs.unlinkSync(tempCasesFile);
      }
    }
  });
});
