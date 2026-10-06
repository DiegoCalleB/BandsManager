// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import React from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';

export interface BulkProgressItem {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'in_progress' | 'success' | 'error';
  message?: string;
  detail?: string;
}

interface BulkProgressModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  items: BulkProgressItem[];
  currentIndex: number;
  totalCount: number;
  isCompleted: boolean;
  onClose: () => void;
  onCancel?: () => void;
}

export const BulkProgressModal: React.FC<BulkProgressModalProps> = ({
  isOpen,
  title,
  subtitle,
  items,
  currentIndex,
  totalCount,
  isCompleted,
  onClose,
  onCancel
}) => {
  if (!isOpen) return null;

  const percentage = totalCount > 0 ? Math.round(((currentIndex + (isCompleted ? 1 : 0)) / totalCount) * 100) : 0;
  const successCount = items.filter(i => i.status === 'success').length;
  const errorCount = items.filter(i => i.status === 'error').length;

  return (
    <ModalPortal isOpen={isOpen} onClose={isCompleted ? onClose : undefined}>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto overscroll-contain animate-fade-in">
        <div className="w-full max-w-lg bg-[#141210] border border-[#f2ca50]/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] my-auto">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-zinc-800 bg-gradient-to-r from-[#1e1c18] to-[#121110] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100 font-display">
                  {title}
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  {subtitle || (isCompleted ? 'Proceso completado' : `Procesando ${currentIndex + 1} de ${totalCount}...`)}
                </p>
              </div>
            </div>

            {isCompleted && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div className="p-4 sm:p-5 space-y-3 bg-[#181715]/60 border-b border-zinc-800">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-300 font-bold">Progreso global</span>
              <span className="text-[#f2ca50] font-bold">{percentage}% ({isCompleted ? totalCount : currentIndex}/{totalCount})</span>
            </div>

            <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700/60">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isCompleted 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                    : 'bg-gradient-to-r from-amber-500 via-[#f2ca50] to-yellow-300'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
              />
            </div>

            {/* Stats summary */}
            <div className="flex items-center gap-3 text-xs font-mono pt-1">
              <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
                <CheckCircle2 className="w-3 h-3" />
                {successCount} completados
              </span>
              {errorCount > 0 && (
                <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-950/50 px-2 py-0.5 rounded border border-rose-800/40">
                  <AlertTriangle className="w-3 h-3" />
                  {errorCount} con incidencias
                </span>
              )}
            </div>
          </div>

          {/* Items List */}
          <div className="p-3 sm:p-4 overflow-y-auto space-y-2 flex-1 divide-y divide-zinc-800/40">
            {items.map((item, idx) => (
              <div key={item.id || idx} className="pt-2 first:pt-0 flex items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {item.status === 'processing' && (
                    <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                  )}
                  {item.status === 'success' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  )}
                  {item.status === 'error' && (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  )}
                  {item.status === 'pending' && (
                    <div className="w-3.5 h-3.5 rounded-full border border-zinc-600 shrink-0" />
                  )}
                  <span className="text-zinc-200 truncate font-semibold">
                    {item.name}
                  </span>
                </div>

                <span className={`text-[11px] shrink-0 truncate max-w-[180px] ${
                  item.status === 'processing' ? 'text-amber-400' :
                  item.status === 'success' ? 'text-emerald-400' :
                  item.status === 'error' ? 'text-rose-400' : 'text-zinc-500'
                }`}>
                  {item.message || (
                    item.status === 'processing' ? 'Procesando...' :
                    item.status === 'success' ? 'Listo' :
                    item.status === 'error' ? 'Error' : 'En cola'
                  )}
                </span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-800 bg-[#121110] flex items-center justify-end gap-2">
            {!isCompleted && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            )}
            {isCompleted && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#f2ca50] hover:bg-amber-400 text-black shadow-md transition-colors cursor-pointer"
              >
                Cerrar y ver resultados
              </button>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
