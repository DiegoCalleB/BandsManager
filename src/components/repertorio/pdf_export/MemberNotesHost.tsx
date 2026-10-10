/**
 * Modal de notas por miembro abierto desde la vista previa.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import type { ThemeColors } from "../../../types";
import { MemberNotesModal } from "../MemberNotesModal";
import { usePdfExport } from "./PdfExportContext";

/** El modal de notas solo usa `card` y `text`; el resto de tokens se resuelven con las variables globales. */
const NOTES_MODAL_COLORS: ThemeColors = {
  name: 'pdf-notes',
  bg: '',
  card: 'bg-[var(--surface)]',
  primary: '',
  primaryHover: '',
  text: 'text-[var(--ink)]',
  textMuted: '',
  accent: '',
  accentBg: '',
  badgeGreen: '',
  badgeYellow: '',
  badgeRed: '',
  badgeBlue: '',
  neonShadow: '',
  fontDisplay: '',
  fontSans: '',
};

/**
 * Modal de notas por miembro abierto desde la vista previa.
 * @returns Sección de interfaz.
 */
export function MemberNotesHost() {
  const { editingSongForNotes, resolvedMembers, setEditingSongForNotes, onUpdateSong } = usePdfExport();
  return (
    <>
      {/* Edit Member Notes Modal if clicked from preview */}
      {editingSongForNotes && (
        <MemberNotesModal
          isOpen={Boolean(editingSongForNotes)}
          song={editingSongForNotes}
          colors={NOTES_MODAL_COLORS}
          bandMembers={resolvedMembers}
          onClose={() => setEditingSongForNotes(null)}
          onSaveSongNotes={(updated) => {
            if (onUpdateSong) {
              onUpdateSong(updated);
            }
            setEditingSongForNotes(null);
          }}
        />
      )}
    </>
  );
}
