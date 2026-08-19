import { useState, FormEvent } from 'react';
import { Lead, InteractionLog } from '../types';

export function useInteractionLog(
  selectedLead: Lead | null,
  setSelectedLead: (updater: (prev: Lead | null) => Lead | null) => void,
  onUpdateLead: (leadId: string, updatedFields: Partial<Lead>, expectedStatus?: string) => void
) {
  const [interactionType, setInteractionType] = useState<'Llamada' | 'WhatsApp' | 'Email' | 'Reunión' | 'Otro'>('Llamada');
  const [interactionNotes, setInteractionNotes] = useState<string>('');
  const [interactionResultado, setInteractionResultado] = useState<'Interesado' | 'Enviar propuesta' | 'Seguimiento pendiente' | 'Rechazado' | 'Info recibida' | 'Acuerdo cerrado'>('Seguimiento pendiente');
  const [interactionAutor, setInteractionAutor] = useState<string>('Diego / Filgue');

  const handleAddInteractionLog = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !interactionNotes.trim()) return;

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newLog: InteractionLog = {
      id: `log-${Date.now()}`,
      fecha: nowStr,
      tipo: interactionType,
      autor: interactionAutor,
      notas: interactionNotes.trim(),
      resultado: interactionResultado
    };

    const existingLogs = selectedLead.historial_contacto || [];
    const updatedLogs = [newLog, ...existingLogs];

    let newStatus = selectedLead.estado;
    if (interactionResultado === 'Interesado' && selectedLead.estado !== 'interesado') {
      newStatus = 'interesado';
    } else if (interactionResultado === 'Acuerdo cerrado' && selectedLead.estado !== 'negociando') {
      newStatus = 'negociando';
    } else if (interactionResultado === 'Rechazado' && selectedLead.estado !== 'no_interesado') {
      newStatus = 'no_interesado';
    }

    onUpdateLead(selectedLead.id, {
      historial_contacto: updatedLogs,
      estado: newStatus,
      fecha_ultima_respuesta: new Date().toISOString().slice(0, 10)
    });

    setSelectedLead(prev => prev ? {
      ...prev,
      historial_contacto: updatedLogs,
      estado: newStatus,
      fecha_ultima_respuesta: new Date().toISOString().slice(0, 10)
    } : null);

    setInteractionNotes('');
  };

  const handleDeleteInteractionLog = (logId: string) => {
    if (!selectedLead || !selectedLead.historial_contacto) return;
    const updated = selectedLead.historial_contacto.filter(l => l.id !== logId);
    onUpdateLead(selectedLead.id, { historial_contacto: updated });
    setSelectedLead(prev => prev ? { ...prev, historial_contacto: updated } : null);
  };

  return {
    interactionType, setInteractionType,
    interactionNotes, setInteractionNotes,
    interactionResultado, setInteractionResultado,
    interactionAutor, setInteractionAutor,
    handleAddInteractionLog,
    handleDeleteInteractionLog,
  };
}
