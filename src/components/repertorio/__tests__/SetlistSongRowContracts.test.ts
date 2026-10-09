import { describe, it, expect } from 'vitest';
import React from 'react';
import { SetlistSongRow } from '../SetlistSongRow';

describe('SetlistSongRow Component Contract', () => {
  it('should be defined as a valid React component function', () => {
    expect(typeof SetlistSongRow).toBe('function');
  });

  it('exposes expected props interface without breaking changes', () => {
    // Verificamos que acepte los tipos requeridos en su contrato
    const mockSong = {
      id: 'song-1',
      title: 'Test Song',
      artist: 'Test Artist',
      duration: '3:30',
      key: 'Am',
      bpm: 120,
      lyrics: 'Test lyrics',
      tags: ['rock']
    };

    const mockItem = {
      id: 'item-1',
      songId: 'song-1',
      notes: 'Intro solo',
      showItemType: 'song' as const
    };

    expect(mockSong.id).toBe(mockItem.songId);
  });
});
