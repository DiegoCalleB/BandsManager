/**
 * Maquetación del estudio: fondo modal, cuenta atrás, tarjeta (cabecera, cuerpo, mini-transporte) y diálogos
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ModalPortal } from "../common/ModalPortal";
import { ShowIcon } from "../ui/ShowIcon";
import { SongStudioContentBody } from "./SongStudioContentBody";
import { useSongStudio } from "./SongStudioContext";
import { SongStudioDialogs } from "./SongStudioDialogs";
import { SongStudioHeader } from "./SongStudioHeader";
import { SongStudioMiniTransport } from "./SongStudioMiniTransport";

/**
 * Maquetación del estudio: fondo modal, cuenta atrás, tarjeta (cabecera, cuerpo, mini-transporte) y diálogos
 * @returns Sección de interfaz.
 */
export function SongStudioLayout() {
  const { onClose, isFullScreen, countInCountdown } = useSongStudio();
  return (
    <>
      <ModalPortal isOpen={true} onClose={onClose}>
          <div
      className={`fixed inset-0 z-[9999] bg-[var(--scrim)]/80 flex items-center justify-center overflow-y-auto overscroll-contain animate-in fade-in duration-200 ${
        isFullScreen ? 'p-0' : 'p-2 sm:p-4'
      }`}
          >
      {countInCountdown !== null && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[10000] bg-[var(--acc)]  text-[var(--on-acc)] font-sans font-bold px-6 py-3 rounded-[var(--r-l)] flex items-center gap-3">
          <span className="text-2xl"><ShowIcon inline emoji="🥁" /></span>
          <div className="text-sm">
            <div>PREPARANDO GRABACIÓN MULTIPISTA…</div>
            <div className="text-xs opacity-80 font-bold">Arranca en: ¡{countInCountdown}!</div>
          </div>
          <span className="text-3xl font-black ml-2 bg-[var(--sunken)] text-[var(--acc)] px-3.5 py-1 rounded-[var(--r-m)]">
            {countInCountdown}
          </span>
        </div>
      )}
      <div
        className={`w-full ${
          isFullScreen
            ? 'fixed inset-0 z-[9999] w-screen h-screen max-w-none max-h-none rounded-none m-0 shadow-none'
            : 'max-w-4xl rounded-[var(--r-l)] overflow-hidden my-auto max-h-[92vh]'
        } flex flex-col ${'bg-[var(--surface)] text-[var(--ink-2)]'}`}
      >
        <SongStudioHeader />

        <SongStudioContentBody />

        <SongStudioMiniTransport />
      </div>

      <SongStudioDialogs />
          </div>
        </ModalPortal>
    </>
  );
}
