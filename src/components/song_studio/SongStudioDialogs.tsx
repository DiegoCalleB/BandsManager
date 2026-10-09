/**
 * Diálogos secundarios del estudio: IA, Iris, acordes, atajos, borrado, compartir, ensayo, stems y progreso
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { SongAudioIdea } from "../../types";
import { cancionConIdeas } from "../../utils/irisTracks";
import { Atril } from "../Atril";
import PracticeModePanel from "../PracticeModePanel";
import { ShareModal } from "../ShareModal";
import { getIdeaTracks } from "./ideaTracks";
import { SongStudioAiComposerModal } from "./SongStudioAiComposerModal";
import { SongStudioAiGeneratorModal } from "./SongStudioAiGeneratorModal";
import { SongStudioAiMusicModal } from "./SongStudioAiMusicModal";
import { SongStudioAiTrackGenModal } from "./SongStudioAiTrackGenModal";
import { useSongStudio } from "./SongStudioContext";
import { SongStudioCubaseHelpModal } from "./SongStudioCubaseHelpModal";
import { SongStudioDeleteConfirmModal } from "./SongStudioDeleteConfirmModal";
import { SongStudioIrisSheet } from "./SongStudioIrisSheet";
import { SongStudioMoisesStemsModal } from "./SongStudioMoisesStemsModal";
import { SongStudioStemProgressModal } from "./SongStudioStemProgressModal";

/**
 * Diálogos secundarios del estudio: IA, Iris, acordes, atajos, borrado, compartir, ensayo, stems y progreso
 * @returns Sección de interfaz.
 */
export function SongStudioDialogs() {
  const { showGenModalForIdea, setShowGenModalForIdea, genBpm, setGenBpm, genKey, setGenKey, includeDrums, setIncludeDrums, includeBass, setIncludeBass, drumStyle, setDrumStyle, genDuration, setGenDuration, isGeneratingAccompaniment, handleGenerateAccompaniment, showChordsModal, song, setShowChordsModal, onUpdateSong, showCubaseHelp, setShowCubaseHelp, confirmDeleteModal, setConfirmDeleteModal, shareModalData, setShareModalData, showAiMusicModal, setShowAiMusicModal, currentUsername, showAiComposerModal, setShowAiComposerModal, practiceModeIdea, currentUser, setPracticeModeIdea, showMoisesStemsModal, setShowMoisesStemsModal, moisesTab, setMoisesTab, moisesPreset, handleSelectMoisesPreset, handlePerformAiStemSeparation, showAiTrackGenModal, setShowAiTrackGenModal, stemProgressModal, setStemProgressModal } = useSongStudio();
  return (
    <>
      <SongStudioAiGeneratorModal
        showGenModalForIdea={showGenModalForIdea}
        onClose={() => setShowGenModalForIdea(null)}
        genBpm={genBpm}
        setGenBpm={setGenBpm}
        genKey={genKey}
        setGenKey={setGenKey}
        includeDrums={includeDrums}
        setIncludeDrums={setIncludeDrums}
        includeBass={includeBass}
        setIncludeBass={setIncludeBass}
        drumStyle={drumStyle}
        setDrumStyle={setDrumStyle}
        genDuration={genDuration}
        setGenDuration={setGenDuration}
        isGeneratingAccompaniment={isGeneratingAccompaniment}
        handleGenerateAccompaniment={handleGenerateAccompaniment}
      />

      <SongStudioIrisSheet />

      {/* CHORDS & SUBSTITUTE GUIDE VIEWER OVERLAY */}
      {showChordsModal && <Atril cancion={song} modo="Estudiar" onClose={() => setShowChordsModal(false)} onUpdateSong={onUpdateSong} />}

      {/* CUBASE KEYBOARD SHORTCUTS CHEAT SHEET MODAL */}
      {showCubaseHelp && <SongStudioCubaseHelpModal onClose={() => setShowCubaseHelp(false)} />}

      {/* CONFIRM DELETE MODAL DIALOG */}
      <SongStudioDeleteConfirmModal confirmDeleteModal={confirmDeleteModal} onClose={() => setConfirmDeleteModal(null)} />

      {/* SHARE MODAL */}
      <ShareModal
        isOpen={shareModalData.isOpen}
        onClose={() => setShareModalData((prev) => ({ ...prev, isOpen: false }))}
        title={shareModalData.title}
        subtitle={shareModalData.subtitle}
        initialText={shareModalData.text}
        itemType={shareModalData.itemType}
      />

      {/* AI MUSIC / SOUNDTRACK GENERATOR MODAL */}
      <SongStudioAiMusicModal
        isOpen={showAiMusicModal}
        onClose={() => setShowAiMusicModal(false)}
        song={song}
        onAddGeneratedAudio={(audioUrl, title) => {
          // Create new idea with generated soundtrack
          const newIdea: SongAudioIdea = {
            id: `idea-${Date.now()}`,
            titulo: title,
            seccion: 'general',
            audioUrl: audioUrl,
            fecha: new Date().toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            subidoPor: currentUsername || 'AI Lyria Engine',
            instrumento: 'Soundtrack IA',
            comentarios: [],
            pistas: [
              {
                id: `track-${Date.now()}-1`,
                nombre: title,
                audioUrl: audioUrl,
                autor: 'Lyria AI',
                instrumento: 'Soundtrack / Jingle',
                fecha: new Date().toLocaleDateString('es-ES'),
                volumen: 1,
                muted: false,
              },
            ],
          };
          const updatedIdeas = [newIdea, ...(song.audioIdeas || [])];
          onUpdateSong(cancionConIdeas(song, updatedIdeas));
        }}
      />

      {/* AI COMPOSER / MUSICIAN ARRANGEMENT MODAL */}
      <SongStudioAiComposerModal
        isOpen={showAiComposerModal}
        onClose={() => setShowAiComposerModal(false)}
        song={song}
        currentUsername={currentUsername}
        onAddIdea={(newIdea) => {
          const updatedIdeas = [newIdea, ...(song.audioIdeas || [])];
          onUpdateSong(cancionConIdeas(song, updatedIdeas));
        }}
      />

      {/* SALA DE ENSAYO INDIVIDUAL: mezcla 100% local, nunca escribe en `song` */}
      {practiceModeIdea && (
        <PracticeModePanel
          key={practiceModeIdea.id}
          song={song}
          idea={practiceModeIdea}
          tracks={getIdeaTracks(practiceModeIdea)}
          currentUser={currentUser}
          onClose={() => setPracticeModeIdea(null)}
          onApplyAsMainChords={(cifradoTexto, guiaSustituto) => {
            if (
              !window.confirm(
                'Esto sustituye el cifrado de acordes principal de la canción (visible para toda la banda) por el detectado en esta pista aislada. ¿Continuar?'
              )
            )
              return;
            onUpdateSong({ ...song, cifradoTexto, guiaSustituto });
          }}
        />
      )}

      {/* MODAL MOISES STEMS SEPARATION & MULTITRACK CONTROL */}
      <SongStudioMoisesStemsModal
        showMoisesStemsModal={showMoisesStemsModal}
        setShowMoisesStemsModal={setShowMoisesStemsModal}
        moisesTab={moisesTab}
        setMoisesTab={setMoisesTab}
        moisesPreset={moisesPreset}
        setMoisesPreset={handleSelectMoisesPreset}
        handlePerformAiStemSeparation={handlePerformAiStemSeparation}
        song={song}
        onUpdateSong={onUpdateSong}
      />

      {/* AI Instrument Track Generator Modal */}
      <SongStudioAiTrackGenModal
        showAiTrackGenModal={showAiTrackGenModal}
        setShowAiTrackGenModal={setShowAiTrackGenModal}
        isGeneratingAiTrack={false}
        handleGenerateAiInstrumentTrack={() => {}}
        song={song}
      />

      {/* MODAL DE PROGRESO DE SEPARACIÓN DE STEMS IA */}
      <SongStudioStemProgressModal stemProgressModal={stemProgressModal} setStemProgressModal={setStemProgressModal} />
    </>
  );
}
