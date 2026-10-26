import { describe, expect, it } from 'vitest';
import { extensionDeAudio } from '../extensionDeAudio';

describe('extensionDeAudio', () => {
  it.each([
    ['audio/wav', 'wav'],
    ['audio/x-wav', 'wav'],
    ['audio/flac', 'flac'],
    ['audio/mpeg', 'mp3'],
    ['audio/webm', 'webm'],
    ['audio/webm;codecs=opus', 'webm'],
    ['audio/ogg', 'ogg'],
    ['audio/mp4', 'm4a'],
    ['audio/x-m4a', 'm4a'],
    ['audio/aac', 'aac'],
  ])('%s -> .%s', (tipo, ext) => {
    expect(extensionDeAudio(tipo)).toBe(ext);
  });

  it('sin tipo conocido usa mp3, como antes', () => {
    expect(extensionDeAudio('')).toBe('mp3');
    expect(extensionDeAudio('application/octet-stream')).toBe('mp3');
  });
});
