import React from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
} from "lucide-react";
import { ModalPortal } from "../common/ModalPortal";

export interface BulkProgressItem {
  id: string;
  name: string;
  status: "pending" | "processing" | "in_progress" | "success" | "error";
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
  onCancel,
}) => {
  if (!isOpen) return null;

  const percentage =
    totalCount > 0
      ? Math.round(((currentIndex + (isCompleted ? 1 : 0)) / totalCount) * 100)
      : 0;
  const successCount = items.filter((i) => i.status === "success").length;
  const errorCount = items.filter((i) => i.status === "error").length;

  return (
    <ModalPortal isOpen={isOpen} onClose={isCompleted ? onClose : undefined}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/80 overflow-y-auto overscroll-contain animate-fade-in">
        <div className="w-full max-w-lg bg-[var(--surface)]/40 rounded-[var(--r-l)] overflow-hidden flex flex-col max-h-[85vh] my-auto">
          {/* Header */}
          <div className="p-4 sm:p-5800 bg-gradient-to-r from-[var(--surface)] to-[var(--bg)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[var(--r-m)] bg-[var(--acc)]/20 flex items-center justify-center text-[var(--acc)]/70">
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-[var(--ok)]" />
                ) : (
                  <Sparkles className="w-5 h-5 text-[var(--acc)]/70 animate-spin" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--ink)] font-display">
                  {title}
                </h3>
                <p className="text-xs text-[var(--ink-2)] font-sans">
                  {subtitle ||
                    (isCompleted
                      ? "Proceso completado"
                      : `Procesando ${currentIndex + 1} de ${totalCount}...`)}
                </p>
              </div>
            </div>

            {isCompleted && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-[var(--ink-2)] hover:text-[var(--ink)] rounded-[var(--r-s)] bg-[var(--sunken)] hover:bg-[var(--ink-3)]/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div className="p-4 sm:p-5 space-y-3 bg-[var(--surface)]/60800">
            <div className="flex items-center justify-between text-xs font-sans">
              <span className="text-[var(--ink-2)] font-bold">
                Progreso global
              </span>
              <span className="text-[var(--acc)] font-bold">
                {percentage}% ({isCompleted ? totalCount : currentIndex}/
                {totalCount})
              </span>
            </div>

            <div className="w-full h-2.5 bg-[var(--sunken)] rounded-[var(--r-pill)] overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-[var(--r-pill)] ${
                  isCompleted
                    ? "bg-gradient-to-r from-[var(--ok)] to-[var(--ok)]"
                    : "bg-gradient-to-r from-[var(--acc)] via-[var(--acc)] to-[var(--acc)]"
                }`}
                style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
              />
            </div>

            {/* Stats summary */}
            <div className="flex items-center gap-3 text-xs font-sans pt-1">
              <span className="inline-flex items-center gap-1 text-[var(--ok)] bg-[var(--ok-soft)] px-2 py-0.5 rounded">
                <CheckCircle2 className="w-3 h-3" />
                {successCount} completados
              </span>
              {errorCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[var(--alert)] bg-[var(--alert-soft)] px-2 py-0.5 rounded">
                  <AlertTriangle className="w-3 h-3" />
                  {errorCount} con incidencias
                </span>
              )}
            </div>
          </div>

          {/* Items List */}
          <div className="p-3 sm:p-4 overflow-y-auto space-y-2 flex-1 divide-y divide-[var(--hair)]">
            {items.map((item, idx) => (
              <div
                key={item.id || idx}
                className="pt-2 first:pt-0 flex items-center justify-between gap-2 text-xs font-sans"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {item.status === "processing" && (
                    <Loader2 className="w-3.5 h-3.5 text-[var(--acc)] animate-spin shrink-0" />
                  )}
                  {item.status === "success" && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--ok)] shrink-0" />
                  )}
                  {item.status === "error" && (
                    <AlertTriangle className="w-3.5 h-3.5 text-[var(--alert)] shrink-0" />
                  )}
                  {item.status === "pending" && (
                    <div className="w-3.5 h-3.5 rounded-full600 shrink-0" />
                  )}
                  <span className="text-[var(--ink)] truncate font-semibold">
                    {item.name}
                  </span>
                </div>

                <span
                  className={`text-[11px] shrink-0 truncate max-w-[180px] ${
                    item.status === "processing"
                      ? "text-[var(--acc)]"
                      : item.status === "success"
                        ? "text-[var(--ok)]"
                        : item.status === "error"
                          ? "text-[var(--alert)]"
                          : "text-[var(--ink-2)]"
                  }`}
                >
                  {item.message ||
                    (item.status === "processing"
                      ? "Procesando..."
                      : item.status === "success"
                        ? "Listo"
                        : item.status === "error"
                          ? "Error"
                          : "En cola")}
                </span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4800 bg-[var(--bg)] flex items-center justify-end gap-2">
            {!isCompleted && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1.5 rounded-[var(--r-m)] text-xs font-sans font-bold bg-[var(--sunken)] hover:bg-[var(--ink-3)]/60 text-[var(--ink-2)] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            )}
            {isCompleted && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-[var(--r-m)] text-xs font-sans font-bold bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--on-acc)] transition-colors cursor-pointer"
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
