import type { Song } from '../../types';

/** Canción con el campo `audioUrl` heredado del formato antiguo (anterior a `audioPrincipalUrl`). */
type SongWithLegacyAudio = Song & { audioUrl?: string };

/**
 * Audio principal de la canción: `audioPrincipalUrl` o, en canciones antiguas, `audioUrl`.
 * @param song Canción a consultar.
 * @returns La URL, o cadena vacía si la canción no tiene audio principal.
 */
export const getSongMainAudioUrl = (song: Song): string =>
  song.audioPrincipalUrl || (song as SongWithLegacyAudio).audioUrl || '';
