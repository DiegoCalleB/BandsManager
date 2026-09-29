import React from 'react';
import { Bell, Loader2, Send } from 'lucide-react';
import { Concert, Rehearsal } from '../../types';

interface CalendarReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  isStitchLight?: boolean;
  selectedConcert: Concert | null;
  selectedRehearsal: Rehearsal | null;
  selectedDate: Date;
  monthNames: string[];
  effectiveBandMembers: any[];
  reminderNotes: string;
  setReminderNotes: (val: string) => void;
  reminderSendPush: boolean;
  setReminderSendPush: (val: boolean) => void;
  reminderSendEmail: boolean;
  setReminderSendEmail: (val: boolean) => void;
  reminderSending: boolean;
  reminderSuccessMsg: string | null;
  reminderErrorMsg: string | null;
  handleSendEventReminder: () => void;
}

export const CalendarReminderModal: React.FC<CalendarReminderModalProps> = ({
  isOpen,
  onClose,
  isStitchLight = false,
  selectedConcert,
  selectedRehearsal,
  selectedDate,
  monthNames,
  effectiveBandMembers,
  reminderNotes,
  setReminderNotes,
  reminderSendPush,
  setReminderSendPush,
  reminderSendEmail,
  setReminderSendEmail,
  reminderSending,
  reminderSuccessMsg,
  reminderErrorMsg,
  handleSendEventReminder,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[var(--scrim)]/80 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      <div
        className={`max-w-md w-full rounded-[var(--r-l)] p-5 relative ${
          'bg-[var(--surface)] text-[var(--ink)]'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--hair)]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-[var(--r-m)] bg-[var(--acc)]/10 text-[var(--acc)]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Enviar Recordatorio a la Banda</h3>
              <p className="text-[10px] text-[var(--ink-2)] font-mono truncate max-w-[200px]">
                {selectedConcert ? `Concierto: ${selectedConcert.sala}` : selectedRehearsal?.asunto || selectedRehearsal?.lugar || 'Evento'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--ink-2)] hover:text-[var(--ink)] text-sm font-bold cursor-pointer p-1">
            ✕
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs">
          {reminderSuccessMsg && (
            <div className="p-3 bg-[var(--ok)]/10 text-[var(--ok)] rounded-[var(--r-m)] font-mono text-[11px]">
              {reminderSuccessMsg}
            </div>
          )}

          {reminderErrorMsg && (
            <div className="p-3 bg-[var(--alert)]/10 text-[var(--alert)] rounded-[var(--r-m)] font-mono text-[11px]">
              {reminderErrorMsg}
            </div>
          )}

          <div
            className={`p-3 rounded-[var(--r-m)] ${'bg-[var(--sunken)] '}`}
          >
            <div className="font-mono text-[10px] text-[var(--acc)] font-bold mb-1">Detalles del Evento</div>
            <p className="font-semibold">
              {selectedConcert
                ? `Concierto en ${selectedConcert.sala} (${selectedConcert.ciudad})`
                : selectedRehearsal?.asunto || selectedRehearsal?.lugar || 'Ensayo/Reunión'}
            </p>
            <p className="text-[11px] text-[var(--ink-2)] font-mono mt-0.5">
              📅 {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}, {selectedDate.getFullYear()}
              {selectedRehearsal?.hora ? ` a las ${selectedRehearsal.hora}` : ''}
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1">
              Destinatarios ({effectiveBandMembers.length} miembros)
            </label>
            <div className="flex flex-wrap gap-1 font-mono text-[10px]">
              {effectiveBandMembers.map((m: any, idx: number) => (
                <span key={idx} className="px-2 py-0.5 rounded-[var(--r-s)] bg-[var(--acc)]/10 text-[var(--acc)] ">
                  👤 {m.name} {m.email ? `(${m.email})` : ''}
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1">
              Nota adicional / Indicaciones (Opcional)
            </label>
            <textarea
              value={reminderNotes}
              onChange={(e) => setReminderNotes(e.target.value)}
              placeholder="Ej: Traer la lista de repertorio revisada o llegar 15 min antes para probar sonido..."
              rows={3}
              className={`w-full p-2 text-xs rounded-[var(--r-m)] outline-none font-sans ${
                'bg-[var(--sunken)] text-[var(--ink)]'
              }`}
            />
          </div>

          <div className="space-y-2 pt-1 border-t border-[var(--hair)]">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="chk-send-push"
                checked={reminderSendPush}
                onChange={(e) => setReminderSendPush(e.target.checked)}
                className="rounded cursor-pointer accent-sky-500"
              />
              <label
                htmlFor="chk-send-push"
                className="text-[11px] text-[var(--acc)] cursor-pointer font-mono font-medium flex items-center gap-1"
              >
                📱 Notificación Push en móvil / navegador (PWA)
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="chk-send-email"
                checked={reminderSendEmail}
                onChange={(e) => setReminderSendEmail(e.target.checked)}
                className="rounded cursor-pointer accent-sky-500"
              />
              <label htmlFor="chk-send-email" className="text-[11px] text-[var(--ink-2)] cursor-pointer font-mono flex items-center gap-1">
                📧 Enviar correo electrónico a la banda
              </label>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-[var(--hair)] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-[var(--r-m)] text-xs text-[var(--ink-2)] hover:bg-[var(--sunken)] font-mono cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={reminderSending}
            onClick={handleSendEventReminder}
            className="px-4 py-1.5 rounded-[var(--r-m)] bg-[var(--acc)] hover:bg-[var(--acc)] text-xs font-bold text-[var(--ink)] font-mono flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
          >
            {reminderSending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Enviar Recordatorio</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
