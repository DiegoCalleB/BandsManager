import { describe, expect, it } from 'vitest';
import { copyForPlatform, formatTime, parseRangeTimes, videoKeyDeArchivo } from '../reelsHelpers';
import type { HighlightClip } from '../../../utils/reelsUtils';

describe('parseRangeTimes', () => {
  it('parses mm:ss ranges into start, end and duration', () => {
    expect(parseRangeTimes('01:10 - 01:40')).toEqual({ start: 70, end: 100, duration: 30 });
  });

  it('supports h:mm:ss and bare seconds', () => {
    expect(parseRangeTimes('1:00:00 - 1:00:30')).toEqual({ start: 3600, end: 3630, duration: 30 });
    expect(parseRangeTimes('5 - 20')).toEqual({ start: 5, end: 20, duration: 15 });
  });

  it('never yields a negative duration and tolerates empty input', () => {
    expect(parseRangeTimes('02:00 - 01:00').duration).toBe(0);
    expect(parseRangeTimes(undefined)).toEqual({ start: 0, end: 0, duration: 0 });
  });
});

describe('formatTime', () => {
  it('pads minutes and seconds', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(125)).toBe('02:05');
  });
});

describe('videoKeyDeArchivo', () => {
  it('builds a stable key from name and size without uploading the file', () => {
    expect(videoKeyDeArchivo({ name: 'bolo.mp4', size: 10 })).toBe('file:bolo.mp4-10');
    expect(videoKeyDeArchivo(null)).toBeUndefined();
  });
});

describe('copyForPlatform', () => {
  const clip = {
    recommendedCopy: 'general',
    copyTikTok: 'tiktok',
    copyFacebook: 'facebook',
  } as HighlightClip;

  it('picks the copy written for each network', () => {
    expect(copyForPlatform(clip, 'TikTok')).toBe('tiktok');
    expect(copyForPlatform(clip, 'Facebook')).toBe('facebook');
    expect(copyForPlatform(clip, 'Instagram')).toBe('general');
  });

  it('falls back to the recommended copy and to an empty string without a clip', () => {
    expect(copyForPlatform(clip, 'YouTube')).toBe('general');
    expect(copyForPlatform(null, 'TikTok')).toBe('');
  });
});
