export interface SentenceSpan {
  text: string;
  start: number;
  end: number;
}

export const APOSTROPHE = "[''’]";

/**
 * Split text into sentences after period, question mark, exclamation mark or newline.
 * Returns trimmed sentence text along with accurate start and end indices into the original string.
 */
export function splitSentences(text: string): SentenceSpan[] {
  const result: SentenceSpan[] = [];
  if (!text) return result;

  let currentStart = 0;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];
    if (ch === '.' || ch === '?' || ch === '!' || ch === '\n' || ch === '\r') {
      // Consume consecutive punctuation or newlines of the same boundary
      while (
        i + 1 < text.length &&
        (text[i + 1] === '.' ||
          text[i + 1] === '?' ||
          text[i + 1] === '!' ||
          text[i + 1] === '\n' ||
          text[i + 1] === '\r')
      ) {
        i++;
      }

      const raw = text.slice(currentStart, i + 1);
      const leadingSpaceMatch = raw.match(/^\s*/);
      const trailingSpaceMatch = raw.match(/\s*$/);
      const leadingLen = leadingSpaceMatch ? leadingSpaceMatch[0].length : 0;
      const trailingLen = trailingSpaceMatch ? trailingSpaceMatch[0].length : 0;

      const trimmed = raw.slice(leadingLen, raw.length - trailingLen);
      if (trimmed.length > 0) {
        const spanStart = currentStart + leadingLen;
        const spanEnd = spanStart + trimmed.length;
        result.push({
          text: trimmed,
          start: spanStart,
          end: spanEnd,
        });
      }

      currentStart = i + 1;
    }
    i++;
  }

  if (currentStart < text.length) {
    const raw = text.slice(currentStart);
    const leadingSpaceMatch = raw.match(/^\s*/);
    const trailingSpaceMatch = raw.match(/\s*$/);
    const leadingLen = leadingSpaceMatch ? leadingSpaceMatch[0].length : 0;
    const trailingLen = trailingSpaceMatch ? trailingSpaceMatch[0].length : 0;

    const trimmed = raw.slice(leadingLen, raw.length - trailingLen);
    if (trimmed.length > 0) {
      const spanStart = currentStart + leadingLen;
      const spanEnd = spanStart + trimmed.length;
      result.push({
        text: trimmed,
        start: spanStart,
        end: spanEnd,
      });
    }
  }

  return result;
}
