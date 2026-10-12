
/**
 * Modales del Atril: progreso de stems, compartir, metrónomo, afinador, oído y subida de estructura.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { lazy,Suspense } from "react";
import { formatSongShareText } from "../../utils/shareUtils";
import { ModalOido } from "../chords/ModalOido";
import { ShareModal } from "../ShareModal";
import { SongStudioStemProgressModal } from "../song_studio/SongStudioStemProgressModal";
import { SongStudioStructureUploadModal } from "../song_studio/SongStudioStructureUploadModal";
import { useAtril } from "./AtrilContext";


const MetronomeModal = lazy(() => import("../MetronomeModal").then((m) => ({ default: m.MetronomeModal })));
const TunerModal = lazy(() => import("../TunerModal").then((m) => ({ default: m.TunerModal })));

/**
 * Modales del Atril: progreso de stems, compartir, metrónomo, afinador, oído y subida de estructura.
 * @returns Sección de interfaz.
 */
export function AtrilModals() {
  const { iris, showShareModal, setShowShareModal, song, showMetronomeModal, showTunerModal, setShowMetronomeModal, setShowTunerModal, isAnalyzingChords, isGeneratingAi, oidoOculto, setOidoOculto, showStructureUploadModal, setShowStructureUploadModal, onUpdateSong } = useAtril();
  return (
    <>
      <SongStudioStemProgressModal
        stemProgressModal={iris.stemProgressModal}
        setStemProgressModal={iris.setStemProgressModal}
      />

      {/* SHARE MODAL FOR WHATSAPP / APPS */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={song.titulo}
        subtitle="Canción y cifrado para WhatsApp"
        initialText={formatSongShareText(song, {
          includeChords: true,
          includeGuide: true,
        })}
        itemType="song"
      />

      {(showMetronomeModal || showTunerModal) && (
        <Suspense fallback={null}>
          {showMetronomeModal && (
            <MetronomeModal
              isOpen={showMetronomeModal}
              onClose={() => setShowMetronomeModal(false)}
              initialBpm={song.bpm || 120}
            />
          )}
          {showTunerModal && <TunerModal isOpen={showTunerModal} onClose={() => setShowTunerModal(false)} />}
        </Suspense>
      )}

      <ModalOido
        abierto={(isAnalyzingChords || isGeneratingAi) && !oidoOculto}
        tarea={isGeneratingAi ? "letra" : "acordes"}
        songId={song.id}
        titulo={song.titulo}
        onOcultar={() => setOidoOculto(true)}
      />

      {/* STRUCTURE UPLOAD MODAL */}
      <SongStudioStructureUploadModal
        song={song}
        isOpen={showStructureUploadModal}
        onClose={() => setShowStructureUploadModal(false)}
        onUpdateSong={onUpdateSong}
      />
    </>
  );
}
