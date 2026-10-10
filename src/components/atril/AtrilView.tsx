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
import { DetectedChordsPanel } from "./DetectedChordsPanel";


import { useAtril } from "./AtrilContext";

/**
 * Vista del Atril: cabecera, barra de controles, cuerpo del cifrado o la estructura y modales.
 * @returns El modal del Atril.
 */
export function AtrilView() {
  const { pantallaCompleta, alternarPantallaCompleta, onClose } = useAtril();

  return (
    <ModalPortal isOpen={true} onClose={onClose}>
      <div className={`fixed inset-0 z-[9999] bg-[var(--scrim)]/85 flex items-center justify-center overflow-y-auto overscroll-contain ${pantallaCompleta ? "p-0" : "p-2 sm:p-4"}`}>
  <div className={`relative bg-[var(--surface)] w-full ${pantallaCompleta ? "max-w-none rounded-none h-[100dvh]" : "max-w-5xl rounded-[var(--r-l)] h-[92vh]"} flex flex-col overflow-y-auto overscroll-contain md:overflow-hidden text-[var(--ink)] my-auto`}>
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
      className="absolute top-3 right-14 z-20"
      title={pantallaCompleta ? "Salir de pantalla completa" : "Pantalla completa"}
      aria-pressed={pantallaCompleta}
    >
      {pantallaCompleta ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
    </Button>

    {/* MODAL HEADER */}
    <AtrilHeader />

    {/* TOOLBAR CONTROLS BAR (LaCuerda / Ultimate Guitar Toolbar) */}
    <AtrilToolbar />

    {/* AI SUCCESS NOTIFICATION BANNER */}
    <AiSuccessBanner />

    {/* ACORDES DETECTADOS DEL AUDIO */}
    <DetectedChordsPanel />

    {/* MODAL BODY */}
    {/* En móvil la cabecera y los paneles de acordes ocupan casi toda la pantalla: el cuerpo tiene
        altura propia (75vh, con su scroll interno) y es el modal entero el que se desplaza hasta
        él. Con flex-1 el cuerpo se quedaba con una rendija y no se podía bajar a la letra. */}
    <AtrilBody />
  </div>

  <AtrilModals />

  {/* HIDDEN HTML AUDIO ELEMENT FOR IN-MODAL PLAYBACK */}
  <AtrilAudioElement />
      </div>
    </ModalPortal>
  );
}
