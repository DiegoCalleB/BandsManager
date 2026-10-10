import React, { useState } from 'react';
import { Lead, ThemeColors } from '../../types';
import { apiFetch } from '../../utils/api';
import { Bot, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';
import { Button, IconButton, Input, Select, Textarea } from '../ui';

interface BookingSimulationModalProps {
  colors: ThemeColors;
  lead: Lead;
  onClose: () => void;
  onCommit: (simulationRole: string, senderName: string, subject: string, message: string) => void;
}

export const BookingSimulationModal: React.FC<BookingSimulationModalProps> = ({ colors, lead, onClose, onCommit }) => {
  const [simulationRole, setSimulationRole] = useState<'sala' | 'banda'>('sala');
  const [simulationScenario, setSimulationScenario] = useState('taquilla');
  const [simulationSenderName, setSimulationSenderName] = useState(`Programador de ${lead.nombre_sala}`);
  const simulationSubject =
    lead.hilo_emails && lead.hilo_emails.length > 0
      ? `RE: ${lead.hilo_emails[lead.hilo_emails.length - 1].asunto}`
      : 'Re: Propuesta de concierto';
  const [simulationCustomInstruction, setSimulationCustomInstruction] = useState(
    'La sala muestra gran interés por el directo. Propone una fecha de viernes o sábado de noviembre, un reparto de taquilla del 70/30 a favor de la banda, y entradas a 12€.'
  );
  const [simulationMessage, setSimulationMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [simulationGenerated, setSimulationGenerated] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await apiFetch('/api/generate-simulated-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          role: simulationRole,
          scenario: simulationScenario,
          customInstruction: simulationCustomInstruction,
          senderName: simulationSenderName,
        }),
      });
      // apiFetch devuelve el JSON ya parseado (y lanza si la respuesta no fue 2xx),
      // así que no hay Response que interrogar con .ok / .json().
      const data = res as any;
      if (data?.message) {
        setSimulationMessage(data.message);
        setSimulationGenerated(true);
      } else {
        alert('Error al generar la simulación.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al generar la simulación.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCommit = () => {
    if (!simulationMessage) return;
    onCommit(simulationRole, simulationSenderName, simulationSubject, simulationMessage);
  };

  return (
    <ModalPortal isOpen={true} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/60 overflow-y-auto overscroll-contain animate-in fade-in">
        <div
          className="relative w-full max-w-2xl my-auto rounded-[var(--r-l)] overflow-hidden flex flex-col max-h-[90vh]"
          style={{ backgroundColor: colors.card }}
        >
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--acc)]/10 text-[var(--ink)]">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: colors.text }}>
                  Simulador de correo entrante / saliente
                </h3>
                <p className="text-xs text-[var(--ink-2)]">Genera una respuesta realista con IA para probar el flujo de hilo de correos</p>
              </div>
            </div>
            <IconButton
              label="Cerrar"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </IconButton>
          </div>

          <div className="p-6 overflow-y-auto space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[var(--ink-2)] mb-1 font-semibold">Rol del Remitente</label>
                <Select aria-label="Rol del Remitente"
                  value={simulationRole}
                  onChange={(e) => {
                    const role = e.target.value as 'sala' | 'banda';
                    setSimulationRole(role);
                    setSimulationSenderName(role === 'sala' ? `Programador de ${lead.nombre_sala}` : 'Booking de la banda');
                  }}
                  wrapperClassName="w-full"
                >
                  <option value="sala">Sala / promotor (respuesta entrante)</option>
                  <option value="banda">Banda (respuesta saliente)</option>
                </Select>
              </div>

              <div>
                <label className="block text-[var(--ink-2)] mb-1 font-semibold">Escenario</label>
                <Select aria-label="Escenario"
                  value={simulationScenario}
                  onChange={(e) => setSimulationScenario(e.target.value)}
                  wrapperClassName="w-full"
                >
                  <option value="taquilla">Propuesta de taquilla (70/30)</option>
                  <option value="cache">Propuesta de caché fijo</option>
                  <option value="rechazo">Agenda llena / rechazo amable</option>
                  <option value="mas_info">Petición de EPK / Dossier técnico</option>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-[var(--ink-2)] mb-1 font-semibold">Nombre del remitente</label>
              <Input aria-label="Nombre del remitente"
                type="text"
                value={simulationSenderName}
                onChange={(e) => setSimulationSenderName(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-[var(--ink-2)] mb-1 font-semibold">Instrucción especial / contexto</label>
              <Textarea
                rows={2}
                value={simulationCustomInstruction}
                onChange={(e) => setSimulationCustomInstruction(e.target.value)}
                placeholder="Ej: La sala acepta la fecha del 15 de noviembre y pide cartel…"
                className="w-full"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-2.5 rounded-[var(--r-m)] font-semibold text-[var(--on-acc)] bg-[var(--acc)] hover:brightness-95 disabled:opacity-50 transition-ui flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <span className="animate-pulse">Generando respuesta con Gemini IA…</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generar Correo Simulado con IA
                </>
              )}
            </button>

            {simulationGenerated && (
              <div className="p-4 rounded-[var(--r-m)] bg-[var(--surface)]/80 space-y-3">
                <div className="flex items-center justify-between pb-2">
                  <span className="font-semibold text-[var(--ink-2)]">Vista previa del mensaje</span>
                  <span className="text-micro px-2 py-0.5 rounded bg-[var(--acc)]/20 text-[var(--ink)]">Listo para registrar</span>
                </div>
                <Textarea
                  rows={5}
                  value={simulationMessage}
                  onChange={(e) => setSimulationMessage(e.target.value)}
                  className="w-full"
                />
              </div>
            )}
          </div>

          <div className="p-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-[var(--r-m)] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
            >
              Cancelar
            </button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCommit}
              disabled={!simulationMessage}
              className="items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Registrar en hilo de emails
            </Button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
