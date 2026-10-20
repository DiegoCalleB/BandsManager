import {
Maximize2,
Minimize2,
X
} from "lucide-react";
import { ModalPortal } from "../common/ModalPortal";
import { Button } from '../ui';
import { AiSuccessBanner } from "./AiSuccessBanner";
import { AtrilAudioElement } from "./AtrilAudioElement";
import { AtrilBody } from "./AtrilBody";
import { AtrilHeader } from "./AtrilHeader";
import { AtrilModals } from "./AtrilModals";
import { AtrilToolbar } from "./AtrilToolbar";
import { BarraAcordeActual, DiagramasAcordeActual } from "../chords/AcordeActual";
import { useAcordeActual } from "../chords/acordeActualEstado";
import { DetectedChordsPanel } from "./DetectedChordsPanel";


import { useAtril } from "./AtrilContext";

/**
 * Vista del Atril: cabecera, barra de controles, cuerpo del cifrado o la estructura y modales.
 * @returns El modal del Atril.
 */
export function AtrilView() {
  const { pantallaCompleta, alternarPantallaCompleta, onClose, activeTab, acordeSonando, showChordDiagrams, sincronizado, acordeActivo, proximosAcordes, proximosIndices, setAudioCurrentTime, contextoAcordes, vistaAcordes, setVistaAcordes, nivelAcordes, setNivelAcordes, estiloArmonia, isPlayingAudio, audioUrl, handleToggleAudio, tiemposAcordes, analisisAcordes, audioRef, modoEscenario } = useAtril();
  const estadoActual = useAcordeActual(acordeSonando);
  const proximos = sincronizado && acordeActivo >= 0 ? proximosAcordes : undefined;

  const irAlAcorde = (k: number) => {
    const t = tiemposAcordes[k];
    if (t === undefined) return;
    if (audioRef.current) audioRef.current.currentTime = t;
    setAudioCurrentTime(t);
  };

  return (
    <ModalPortal isOpen={true} onClose={onClose}>
      <div className={`fixed inset-0 z-[9999] bg-[var(--scrim)]/85 flex items-center justify-center overflow-y-auto overscroll-contain ${pantallaCompleta ? "p-0" : "p-0 sm:p-4"}`}>
  <div data-escenario={modoEscenario} className={`group/esc relative bg-[var(--surface)] w-full ${pantallaCompleta ? "max-w-none rounded-none h-[100dvh]" : "max-w-5xl rounded-none sm:rounded-[var(--r-l)] h-[100dvh] sm:h-[92vh]"} flex flex-col overflow-hidden text-[var(--ink)] my-auto`}>
    {/* CLOSE BUTTON — fixed to the modal's top-right corner, independent of header actions */}
    <Button
      variant="neutral"
      size="xs"
      type="button"
      onClick={onClose}
      className="absolute top-3 right-3 z-20"
      title="Cerrar"
    >
      <X className="w-5 h-5" />
    </Button>

    <Button
      variant="neutral"
      size="xs"
      type="button"
      onClick={alternarPantallaCompleta}
      className="absolute top-3 right-14 z-20 hidden sm:inline-flex"
      title={pantallaCompleta ? "Salir de pantalla completa" : "Pantalla completa"}
      aria-pressed={pantallaCompleta}
    >
      {pantallaCompleta ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
    </Button>

    {/* MODAL HEADER, TOOLBAR y AVISO. En móvil son una franja con tope de altura y scroll propio (el
        cuerpo y el dock de acordes no se quedan sin sitio); en md+ no existe: `contents`. */}
    <div className="shrink-0 max-md:shrink max-md:min-h-0 max-md:max-h-[26dvh] max-md:overflow-y-auto max-md:overscroll-contain md:contents">
      <AtrilHeader />
      {/* TOOLBAR CONTROLS BAR (LaCuerda / Ultimate Guitar Toolbar) */}
      {!modoEscenario && activeTab === "chords" && <AtrilToolbar />}
      {/* AI SUCCESS NOTIFICATION BANNER */}
      {!modoEscenario && <AiSuccessBanner />}
      {/* ACORDES DETECTADOS DEL AUDIO (en móvil dentro de la franja, para no robarle sitio a la letra) */}
      {!modoEscenario && <DetectedChordsPanel />}
    </div>

    {/* ACORDE ACTUAL: barra con play y el que viene. En móvil va en el dock inferior (order-last),
        siempre a la vista mientras la letra hace su propio scroll. */}
    {activeTab === "chords" && (
      <div className="shrink-0 max-md:order-last max-md:pb-1">
        <BarraAcordeActual
          estado={estadoActual}
          proximos={proximos}
          reproduciendo={isPlayingAudio}
          onToggle={audioUrl ? handleToggleAudio : undefined}
        />
      </div>
    )}

    {/* DIAGRAMAS: en móvil, justo bajo la barra en el dock; con tope de altura y scroll interno */}
    {activeTab === "chords" && !modoEscenario && (
      <div className={`shrink-0 max-md:shrink max-md:min-h-0 max-md:order-last max-md:max-h-[24dvh] ${showChordDiagrams ? "max-md:hidden" : ""} max-md:overflow-y-auto max-md:overscroll-contain max-md:pb-[env(safe-area-inset-bottom)]`}>
        <DiagramasAcordeActual
          estado={estadoActual}
          sonando={acordeSonando}
          proximos={proximos}
          contexto={contextoAcordes}
          vista={vistaAcordes}
          onVista={setVistaAcordes}
          nivel={nivelAcordes}
          onNivel={setNivelAcordes}
          estiloArmonia={estiloArmonia}
          indices={proximosIndices}
          onIr={sincronizado && audioUrl ? irAlAcorde : undefined}
          reloj={proximos && analisisAcordes ? { indice: acordeActivo, tiempos: tiemposAcordes, duracion: analisisAcordes.duracionSegundos, audioRef } : undefined}
        />
      </div>
    )}

    {/* MODAL BODY */}
    {/* En móvil el panel mide la pantalla (100dvh) y no se desplaza: la letra hace su propio scroll
        dentro del cuerpo (flex-1 min-h-0) y la barra y los diagramas viven en el dock de abajo. */}
    <AtrilBody />
  </div>

  <AtrilModals />

  {/* HIDDEN HTML AUDIO ELEMENT FOR IN-MODAL PLAYBACK */}
  <AtrilAudioElement />
      </div>
    </ModalPortal>
  );
}
