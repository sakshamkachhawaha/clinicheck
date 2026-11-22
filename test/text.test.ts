import { describe, it, expect } from 'vitest';
import { splitSentences } from '../src/text.js';

describe('splitSentences', () => {
  it('splits sentences ending with periods', () => {
    const text = 'Take 500 mg every 4 hours. Follow the label.';
    const spans = splitSentences(text);
    expect(spans).toHaveLength(2);
    expect(spans[0].text).toBe('Take 500 mg every 4 hours.');
    expect(spans[0].start).toBe(0);
    expect(spans[0].end).toBe(26);
    expect(spans[1].text).toBe('Follow the label.');
    expect(spans[1].start).toBe(27);
    expect(spans[1].end).toBe(44);
    expect(text.slice(spans[0].start, spans[0].end)).toBe(spans[0].text);
    expect(text.slice(spans[1].start, spans[1].end)).toBe(spans[1].text);
  });

  it('splits on exclamation marks and question marks', () => {
    const text = 'Are you feeling sick? Call a doctor! That is important.';
    const spans = splitSentences(text);
    expect(spans).toHaveLength(3);
    expect(spans[0].text).toBe('Are you feeling sick?');
    expect(spans[1].text).toBe('Call a doctor!');
    expect(spans[2].text).toBe('That is important.');
  });

  it('splits on newlines', () => {
    const text = 'First line\nSecond line\r\nThird line';
    const spans = splitSentences(text);
    expect(spans).toHaveLength(3);
    expect(spans[0].text).toBe('First line');
    expect(spans[1].text).toBe('Second line');
    expect(spans[2].text).toBe('Third line');
  });

  it('handles multiple consecutive punctuation marks', () => {
    const text = 'Wait... what happened?! Rest now.';
    const spans = splitSentences(text);
    expect(spans).toHaveLength(3);
    expect(spans[0].text).toBe('Wait...');
    expect(spans[1].text).toBe('what happened?!');
    expect(spans[2].text).toBe('Rest now.');
  });

  it('handles empty or whitespace strings', () => {
    expect(splitSentences('')).toEqual([]);
    expect(splitSentences('   \n  ')).toEqual([]);
  });
});
