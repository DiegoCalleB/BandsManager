/**
 * Vista de la comprobación de transición: compone cabecera, pistas, reproductor, diagnóstico y pie.
 */
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { ModalPortal } from "../../common/ModalPortal";
import { useSongTransition } from "./SongTransitionContext";
import { TransitionDiagnosisPanel } from "./TransitionDiagnosisPanel";
import { TransitionFooter } from "./TransitionFooter";
import { TransitionHeader } from "./TransitionHeader";
import { TransitionPlayer } from "./TransitionPlayer";
import { TransitionTrackCard } from "./TransitionTrackCard";

/** Puente entre las dos pistas: se ilumina mientras se funden. */
function TransitionBridge() {
  const { currentGains, config } = useSongTransition();
  return (
    <div className="md:col-span-1 flex flex-col items-center justify-center py-0.5 md:py-0">
      <div
        className={`w-7 h-7 rounded-[var(--r-pill)] flex items-center justify-center transition ${
          currentGains.isCrossfading
            ? "bg-[var(--ink)] text-[var(--bg)] scale-110"
            : "bg-[var(--sunken)] text-[var(--ink-2)]"
        }`}
      >
        <ArrowRight className="w-3.5 h-3.5" />
      </div>
      <span className="text-micro font-sans text-[var(--ink-2)] mt-0.5 font-bold text-center">
        {config.style === "crossfade" ? `${config.fadeDurationSec}s` : config.style === "segue" ? "0s" : "pausa"}
      </span>
    </div>
  );
}

/** Audios ocultos de las dos pistas y los inputs para subir un archivo propio. */
function TransitionMediaElements() {
  const { audioRefA, audioRefB, effectiveAudioUrl, setDuration, fileInputRefA, fileInputRefB, handleFileUpload } =
    useSongTransition();
  return (
    <>
      <audio
        ref={audioRefA}
        src={effectiveAudioUrl.A}
        preload="auto"
        onLoadedMetadata={(e) => setDuration("A", e.currentTarget.duration)}
      />
      <audio
        ref={audioRefB}
        src={effectiveAudioUrl.B}
        preload="auto"
        onLoadedMetadata={(e) => setDuration("B", e.currentTarget.duration)}
      />
      <input ref={fileInputRefA} type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileUpload(e, "A")} />
      <input ref={fileInputRefB} type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileUpload(e, "B")} />
    </>
  );
}

/** Modal completo de la comprobación de transición. */
export function SongTransitionView() {
  const { onClose } = useSongTransition();
  return (
    <ModalPortal isOpen onClose={onClose}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-3 bg-[var(--scrim)]/80 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          className="relative w-full max-w-4xl max-h-[calc(100dvh-1rem)] bg-[var(--surface)] rounded-[var(--r-l)] overflow-hidden flex flex-col text-[var(--ink)]"
        >
          <TransitionHeader />
          <TransitionMediaElements />
          <div className="p-2.5 sm:p-3 space-y-2 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-11 gap-2 items-stretch">
              <TransitionTrackCard track="A" />
              <TransitionBridge />
              <TransitionTrackCard track="B" />
            </div>
            <TransitionPlayer />
            <TransitionDiagnosisPanel />
          </div>
          <TransitionFooter />
        </motion.div>
      </div>
    </ModalPortal>
  );
}
