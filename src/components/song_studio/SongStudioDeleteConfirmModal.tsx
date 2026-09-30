import React from 'react';
import { Trash2 } from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';

interface DeleteConfirmModalData {
  title: string;
  description: string;
  onConfirm: () => void;
}

interface SongStudioDeleteConfirmModalProps {
  confirmDeleteModal: DeleteConfirmModalData | null;
  onClose: () => void;
}

export const SongStudioDeleteConfirmModal: React.FC<SongStudioDeleteConfirmModalProps> = ({ confirmDeleteModal, onClose }) => {
  if (!confirmDeleteModal) return null;

  return (
    <ModalPortal isOpen={!!confirmDeleteModal} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] bg-[var(--scrim)]/80 flex items-center justify-center p-4 overflow-y-auto overscroll-contain">
        <div className="bg-[var(--surface)] rounded-[var(--r-l)] max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 my-auto max-h-[90vh] overflow-y-auto">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-[var(--r-m)] bg-[var(--alert)]/20 text-[var(--alert)] shrink-0">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--ink)]">{confirmDeleteModal.title}</h3>
              <p className="text-xs text-[var(--ink-2)] mt-1.5 leading-relaxed">{confirmDeleteModal.description}</p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[var(--r-m)] text-xs font-bold text-[var(--ink-2)] hover:text-[var(--ink)] bg-[var(--ink)]/5 hover:bg-[var(--ink)]/10 transition-ui cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                const action = confirmDeleteModal.onConfirm;
                onClose();
                action();
              }}
              className="px-5 py-2 rounded-[var(--r-m)] text-xs font-bold text-[var(--on-alert)] bg-[var(--alert)] hover:brightness-95 transition-ui cursor-pointer"
            >
              Sí, Eliminar
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
