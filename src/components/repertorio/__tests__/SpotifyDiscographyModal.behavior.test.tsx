// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import type { ThemeColors } from '../../../types';

const apiFetch = vi.hoisted(() => vi.fn());
vi.mock('../../../utils/api', () => ({ apiFetch }));
vi.mock('../../common/ModalPortal', () => ({ ModalPortal: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

import { SpotifyDiscographyModal } from '../SpotifyDiscographyModal';

const discografia = {
  success: true,
  discography: {
    artist: { id: 'a1', name: 'Los Test' },
    albums: [
      {
        id: 'al1', name: 'Primero', albumType: 'album', releaseYear: '2020', totalTracks: 1, genres: [],
        coverUrl: '', coverUrlMedium: '', spotifyUrl: '', uri: '', releaseDate: '2020-01-01',
        tracks: [{ id: 't1', name: 'Tema Uno', trackNumber: 1, discNumber: 1, durationMs: 1000, durationFormatted: '0:01', durationSeconds: 1, previewUrl: 'http://x/p.mp3', explicit: false, spotifyUrl: '', uri: '' }],
      },
    ],
  },
};

const audios: { pause: ReturnType<typeof vi.fn> }[] = [];
class AudioFalso {
  volume = 1;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  pause = vi.fn();
  play = vi.fn(() => Promise.resolve());
  constructor(public src: string) { audios.push(this); }
}

const props = { colors: {} as ThemeColors, existingSongs: [], onClose: vi.fn(), onSongsImported: vi.fn() };

describe('SpotifyDiscographyModal', () => {
  beforeEach(() => {
    audios.length = 0;
    apiFetch.mockReset();
    apiFetch.mockResolvedValue(discografia);
    vi.stubGlobal('Audio', AudioFalso);
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it('cerrado no pinta nada ni busca', () => {
    render(<SpotifyDiscographyModal {...props} isOpen={false} bandName="Los Test" />);
    expect(apiFetch).not.toHaveBeenCalled();
    expect(screen.queryByText('Importar discografía de Spotify')).toBeNull();
  });

  it('al abrir busca con el nombre de la banda y rellena el campo', async () => {
    render(<SpotifyDiscographyModal {...props} isOpen bandName="Los Test" />);
    expect(apiFetch).toHaveBeenCalledTimes(1);
    expect(apiFetch.mock.calls[0][0]).toBe('/api/spotify/artist-discography?query=Los%20Test');
    expect((screen.getByPlaceholderText(/Nombre de tu banda/) as HTMLInputElement).value).toBe('Los Test');
    await waitFor(() => expect(screen.getByText('Primero')).toBeTruthy());
  });

  it('al cerrar para el audio y al reabrir vuelve a buscar', async () => {
    const { rerender } = render(<SpotifyDiscographyModal {...props} isOpen bandName="Los Test" />);
    await waitFor(() => expect(screen.getByText('Tema Uno')).toBeTruthy());
    fireEvent.click(screen.getByTitle('Reproducir preview 30s de Spotify/Deezer'));
    await waitFor(() => expect(audios).toHaveLength(1));
    rerender(<SpotifyDiscographyModal {...props} isOpen={false} bandName="Los Test" />);
    expect(audios[0].pause).toHaveBeenCalled();
    rerender(<SpotifyDiscographyModal {...props} isOpen bandName="Los Test" />);
    expect(apiFetch).toHaveBeenCalledTimes(2);
  });
});
