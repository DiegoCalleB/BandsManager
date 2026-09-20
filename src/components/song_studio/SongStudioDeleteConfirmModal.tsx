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

export const SongStudioDeleteConfirmModal: React.FC<SongStudioDeleteConfirmModalProps> = ({
 confirmDeleteModal,
 onClose
}) => {
 if (!confirmDeleteModal) return null;

 return (
 <ModalPortal isOpen={!!confirmDeleteModal} onClose={onClose}>
 <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto overscroll-contain">
 <div className="bg-[var(--surface)] rounded-[var(--r-l)] max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 my-auto max-h-[90vh] overflow-y-auto">
 <div className="flex items-start gap-3">
 <div className="p-3 rounded-[var(--r-m)] bg-rose-500/20 text-rose-400 shrink-0">
 <Trash2 className="w-6 h-6" />
 </div>
 <div>
 <h3 className="text-lg font-bold text-white">{confirmDeleteModal.title}</h3>
 <p className="text-xs text-[var(--ink-3)] mt-1.5 leading-relaxed">{confirmDeleteModal.description}</p>
 </div>
 </div>
 <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
 <button
 type="button"
 onClick={onClose}
 className="px-4 py-2 rounded-[var(--r-m)] text-xs font-bold text-[var(--ink-2)] hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
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
 className="px-5 py-2 rounded-[var(--r-m)] text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all cursor-pointer shadow-lg shadow-rose-950/50"
 >
 Sí, Eliminar
 </button>
 </div>
 </div>
 </div>
 </ModalPortal>
 );
};
