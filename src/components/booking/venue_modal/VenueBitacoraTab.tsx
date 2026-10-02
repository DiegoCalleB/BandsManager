import React, { useState } from 'react';
import { History, Plus, Trash2, PhoneCall, MessageCircle, Calendar, CheckCircle2 } from 'lucide-react';
import { Lead, InteractionLog } from '../../../types';
import { Button, Input, Select, Textarea } from '../../ui';

interface VenueBitacoraTabProps {
  lead: Lead;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
}

export const VenueBitacoraTab: React.FC<VenueBitacoraTabProps> = ({ lead, onUpdateLead }) => {
  const [tipo, setTipo] = useState<InteractionLog['tipo']>('Llamada');
  const [notas, setNotas] = useState('');
  const [resultado, setResultado] = useState<InteractionLog['resultado']>('Interesado');
  const [isAdding, setIsAdding] = useState(false);

  const logs: InteractionLog[] = lead.historial_contacto || [];

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notas.trim()) return;

    const newLog: InteractionLog = {
      id: `log-${Date.now()}`,
      fecha: new Date().toISOString().replace('T', ' ').slice(0, 16),
      tipo,
      notas: notas.trim(),
      resultado,
    };

    const updated = [newLog, ...logs];
    onUpdateLead(lead.id, { historial_contacto: updated });
    setNotas('');
    setIsAdding(false);
  };

  const handleDeleteLog = (id: string) => {
    const updated = logs.filter((l) => l.id !== id);
    onUpdateLead(lead.id, { historial_contacto: updated });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar p-4 sm:p-6 space-y-4">
      {/* 1. HEADER & ADD BUTTON */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold font-display text-[var(--ink)]">
            Bitácora de Contacto ({logs.length})
          </h4>
          <p className="text-xs text-[var(--ink-2)] mt-0.5">
            Registro de llamadas, reuniones y notas privadas con el programador.
          </p>
        </div>

        <Button
          variant={isAdding ? 'neutral' : 'primary'}
          size="xs"
          onClick={() => setIsAdding(!isAdding)}
          className="items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isAdding ? 'Cerrar formulario' : 'Añadir nota / llamada'}</span>
        </Button>
      </div>

      {/* 2. ADD FORM */}
      {isAdding && (
        <form
          onSubmit={handleAddLog}
          className="p-4 bg-[var(--surface)] rounded-[var(--r-l)] border border-[var(--hair)] space-y-3 animate-in fade-in duration-150"
        >
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-micro font-medium text-[var(--ink-2)] mb-1">Tipo de contacto</label>
              <Select
                size="sm"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                wrapperClassName="w-full text-xs"
              >
                <option value="Llamada">Llamada telefónica</option>
                <option value="WhatsApp">Mensaje WhatsApp</option>
                <option value="Email">Correo electrónico</option>
                <option value="Reunión">Reunión presencial / online</option>
                <option value="Otro">Otro</option>
              </Select>
            </div>

            <div>
              <label className="block text-micro font-medium text-[var(--ink-2)] mb-1">Resultado</label>
              <Select
                size="sm"
                value={resultado}
                onChange={(e) => setResultado(e.target.value as InteractionLog['resultado'])}
                wrapperClassName="w-full text-xs"
              >
                <option value="Interesado">Interesado (avanza)</option>
                <option value="Enviar propuesta">Enviar propuesta</option>
                <option value="Seguimiento pendiente">Seguimiento pendiente</option>
                <option value="Acuerdo cerrado">Acuerdo cerrado</option>
                <option value="Info recibida">Info recibida</option>
                <option value="Rechazado">Rechazado</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-micro font-medium text-[var(--ink-2)] mb-1">Notas de la conversación</label>
            <Textarea
              rows={2}
              placeholder="Ej: Hablado con Carlos. Me pide que le vuelva a escribir en 2 semanas cuando cuadre el trimestre..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full text-xs p-2.5"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button size="xs" variant="ghost" type="button" onClick={() => setIsAdding(false)}>
              Cancelar
            </Button>
            <Button size="xs" variant="primary" type="submit">
              Guardar en bitácora
            </Button>
          </div>
        </form>
      )}

      {/* 3. LOGS LIST */}
      {logs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
          <History className="w-8 h-8 text-[var(--hair)] mb-2" />
          <p className="text-xs text-[var(--ink-2)]">No hay registros manuales en la bitácora todavía.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 bg-[var(--surface)] rounded-[var(--r-m)] border border-[var(--hair)] flex items-start justify-between gap-3 text-xs"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[var(--ink)]">{log.tipo}</span>
                  <span className="text-micro font-mono text-[var(--ink-2)]">{log.fecha}</span>
                  {log.resultado && (
                    <span className="text-micro font-semibold px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc-soft)] text-[var(--acc-ink)]">
                      {log.resultado}
                    </span>
                  )}
                </div>
                <p className="text-[var(--ink)] whitespace-pre-wrap leading-relaxed">{log.notas}</p>
              </div>

              <button
                type="button"
                onClick={() => handleDeleteLog(log.id)}
                className="text-[var(--ink-2)] hover:text-[var(--alert)] transition-colors p-1 cursor-pointer"
                title="Eliminar este apunte"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
