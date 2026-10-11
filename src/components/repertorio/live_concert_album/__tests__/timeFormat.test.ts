import { describe, expect, it } from 'vitest';
import { formatSeconds, parseTimeToSeconds } from '../timeFormat';

describe('formatSeconds', () => {
  it('formats minutes and seconds with zero padding', () => {
    expect(formatSeconds(0)).toBe('00:00');
    expect(formatSeconds(65)).toBe('01:05');
  });

  it('adds the hours segment only when needed', () => {
    expect(formatSeconds(3600)).toBe('1:00:00');
    expect(formatSeconds(3725)).toBe('1:02:05');
  });

  it('falls back to 00:00 for invalid or negative input', () => {
    expect(formatSeconds(Number.NaN)).toBe('00:00');
    expect(formatSeconds(-5)).toBe('00:00');
  });
});

describe('parseTimeToSeconds', () => {
  it('parses ss, mm:ss and h:mm:ss', () => {
    expect(parseTimeToSeconds('42')).toBe(42);
    expect(parseTimeToSeconds('1:05')).toBe(65);
    expect(parseTimeToSeconds('1:02:05')).toBe(3725);
  });

  it('returns 0 for empty or malformed input', () => {
    expect(parseTimeToSeconds('')).toBe(0);
    expect(parseTimeToSeconds('abc')).toBe(0);
  });

  it('round-trips with formatSeconds', () => {
    expect(parseTimeToSeconds(formatSeconds(754))).toBe(754);
  });
});
