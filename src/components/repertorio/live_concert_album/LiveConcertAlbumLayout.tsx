/**
 * Maqueta del modal concierto→álbum: portal, cabecera, cuerpo por pasos y diálogos auxiliares.
 * Separada del modal para que este solo componga controlador y proveedor.
 */
import { ModalPortal } from '../../common/ModalPortal';
import { ConcertErrorBanner } from './ConcertErrorBanner';
import { GeneratedAlbumResult } from './GeneratedAlbumResult';
import { IngestStep } from './IngestStep';
import { useLiveConcertAlbum } from './LiveConcertAlbumContext';
import { ModalHeader } from './ModalHeader';
import { QuickNamingDialog } from './QuickNamingDialog';
import { TracksEditorStep } from './TracksEditorStep';
import { YoutubeCookiesDialog } from './YoutubeCookiesDialog';

/**
 * Estructura visual completa del modal.
 * @returns El portal con todos los pasos del flujo.
 */
export function LiveConcertAlbumLayout() {
  const { isOpen, onClose } = useLiveConcertAlbum();

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/80 overflow-y-auto overscroll-contain">
  <div className="relative w-full max-w-5xl my-auto rounded-[var(--r-l)] overflow-hidden bg-[var(--surface)] text-[var(--ink)] max-h-[92vh] flex flex-col">
    <ModalHeader />
    <div className="p-6 overflow-y-auto space-y-6 flex-1">
      <ConcertErrorBanner />
      <IngestStep />
      <TracksEditorStep />
      <GeneratedAlbumResult />
    </div>
    <YoutubeCookiesDialog />
    <QuickNamingDialog />
  </div>
      </div>
    </ModalPortal>
  );
}
