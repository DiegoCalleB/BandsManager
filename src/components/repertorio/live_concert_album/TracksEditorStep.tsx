/**
 * Paso 2 del flujo: editor de cortes (avisos, barra de herramientas, línea de tiempo, filas y botón de generar).
 * Existe como componente propio para que el modal solo orqueste y el editor no se renderice sin cortes.
 */
import { AudioAvailabilityBanner } from './AudioAvailabilityBanner';
import { ConcertTimeline } from './ConcertTimeline';
import { EditorToolbar } from './EditorToolbar';
import { FirstTrackHint } from './FirstTrackHint';
import { GenerateAlbumButton } from './GenerateAlbumButton';
import { LinkedSourceNotice } from './LinkedSourceNotice';
import { useLiveConcertAlbum } from './LiveConcertAlbumContext';
import { TrackRow } from './TrackRow';
import { TranscribeAllProgress } from './TranscribeAllProgress';

/**
 * Editor de cortes del concierto; no pinta nada hasta que el análisis produce al menos un corte.
 * @returns El editor o `null` si aún no hay cortes.
 */
export function TracksEditorStep() {
  const { tracks } = useLiveConcertAlbum();
  if (tracks.length === 0) return null;

  return (
    <div className="space-y-4">
      <AudioAvailabilityBanner />
      <LinkedSourceNotice />
      <EditorToolbar />
      <FirstTrackHint />
      <ConcertTimeline />
      <TranscribeAllProgress />
      <div className="space-y-2">
  {tracks.map((track, idx) => (
    <TrackRow key={track.index} track={track} idx={idx} />
  ))}
      </div>
      <GenerateAlbumButton />
    </div>
  );
}
