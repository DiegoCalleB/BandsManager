import React from 'react';
import { Trash2, FolderMinus, X } from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';

export interface ConfirmDeleteAlbumData {
  albumName: string;
  songCount: number;
}

interface ConfirmDeleteAlbumModalProps {
  data: ConfirmDeleteAlbumData | null;
  onClose: () => void;
  onUnassignSongs: (albumName: string) => void;
  onDeleteAlbumAndSongs: (albumName: string) => void;
}

export function ConfirmDeleteAlbumModal({ data, onClose, onUnassignSongs, onDeleteAlbumAndSongs }: ConfirmDeleteAlbumModalProps) {
  if (!data) return null;

  return (
    <ModalPortal isOpen={!!data} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] bg-[var(--scrim)]/80 flex items-center justify-center p-4 overflow-y-auto overscroll-contain">
        <div className="bg-[var(--surface)] rounded-[var(--r-l)] max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 text-[var(--ink)] my-auto max-h-[90vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-[var(--r-m)] bg-[var(--alert)]/20 text-[var(--alert)] shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--ink)]">Eliminar Disco</h3>
                <p className="text-xs text-[var(--ink-2)] font-sans mt-0.5">"{data.albumName}"</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-[var(--r-s)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--ink)]/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-[var(--ink-2)] leading-relaxed bg-[var(--surface)]/80 p-3 rounded-[var(--r-m)]">
            Este disco contiene{' '}
            <strong className="text-[var(--ink)] font-bold">
              {data.songCount} {data.songCount === 1 ? 'canción' : 'canciones'}
            </strong>
            . Selecciona la opción que prefieras para las canciones:
          </p>

          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={() => {
                onUnassignSongs(data.albumName);
                onClose();
              }}
              className="w-full text-left p-3.5 rounded-[var(--r-m)] bg-[var(--acc)]/10 hover:bg-[var(--acc)]/20 transition-all cursor-pointer group flex items-center gap-3"
            >
              <div className="p-2 rounded-[var(--r-s)] bg-[var(--acc)]/20 text-[var(--acc)] group-hover:scale-105 transition-transform shrink-0">
                <FolderMinus className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-[var(--acc)]/70">Desvincular canciones (Recomendado)</div>
                <div className="text-[11px] text-[var(--ink)]/70 mt-0.5">
                  Elimina el disco de la discografía pero mantiene sus canciones en el catálogo como"Sin Disco".
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onDeleteAlbumAndSongs(data.albumName);
                onClose();
              }}
              className="w-full text-left p-3.5 rounded-[var(--r-m)] bg-[var(--alert)]/10 hover:bg-[var(--alert)]/20 transition-all cursor-pointer group flex items-center gap-3"
            >
              <div className="p-2 rounded-[var(--r-s)] bg-[var(--alert)]/20 text-[var(--alert)] group-hover:scale-105 transition-transform shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-[var(--ink-2)]">Eliminar disco y todas sus canciones</div>
                <div className="text-[11px] text-[var(--ink)]/70 mt-0.5">
                  Elimina permanentemente el disco y sus {data.songCount} canciones del catálogo y repertorios.
                </div>
              </div>
            </button>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[var(--r-m)] text-xs font-bold text-[var(--ink-2)] hover:text-[var(--ink)] bg-[var(--ink)]/5 hover:bg-[var(--ink)]/10 transition-all cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
