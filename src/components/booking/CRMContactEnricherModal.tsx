import React, { useState } from 'react';
import { Lead } from '../../types';
import { X, Sparkles, CheckCircle2, AlertCircle, Loader2, Globe, Mail, Phone, Instagram } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { ModalPortal } from '../common/ModalPortal';

interface CRMContactEnricherModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  onUpdateLead?: (updatedLead: Lead) => void;
  isStitchLight?: boolean;
}

export const CRMContactEnricherModal: React.FC<CRMContactEnricherModalProps> = ({
  isOpen,
  onClose,
  leads,
  onUpdateLead,
  isStitchLight = false
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [enrichedResults, setEnrichedResults] = useState<Array<{ leadId: string; name: string; email?: string; phone?: string; instagram?: string }>>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const incompleteLeads = leads.filter(l => !l.email_contacto || !l.telefono || !l.instagram);

  const handleStartEnrichment = async () => {
    setIsProcessing(true);
    setStatusMessage('Analizando salas y webs oficiales...');
    setProcessedCount(0);
    const enrichedList: Array<{ leadId: string; name: string; email?: string; phone?: string; instagram?: string }> = [];

    try {
      for (let i = 0; i < Math.min(incompleteLeads.length, 10); i++) {
        const lead = incompleteLeads[i];
        setStatusMessage(`Buscando datos de contacto para ${lead.nombre_sala}...`);
        
        try {
          const res = await apiFetch(`/api/leads/${lead.id}/enrich`, { method: 'POST' });
          if (res && res.success && res.data) {
            enrichedList.push({
              leadId: lead.id,
              name: lead.nombre_sala,
              email: res.data.email_contacto || lead.email_contacto,
              phone: res.data.telefono || lead.telefono,
              instagram: res.data.instagram || lead.instagram
            });
            if (onUpdateLead) {
              onUpdateLead({
                ...lead,
                email_contacto: res.data.email_contacto || lead.email_contacto,
                telefono: res.data.telefono || lead.telefono,
                instagram: res.data.instagram || lead.instagram,
                website: res.data.website || lead.website
              });
            }
          }
        } catch (err) {
          console.warn(`No se pudo enriquecer ${lead.nombre_sala}`);
        }
        setProcessedCount(i + 1);
      }

      setEnrichedResults(enrichedList);
      setStatusMessage(`Enriquecimiento finalizado. Se han procesado ${enrichedList.length} contactos.`);
    } catch (e: any) {
      setStatusMessage('Hubo un error durante el proceso de enriquecimiento.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto overscroll-contain animate-in fade-in duration-200">
        <div className={`relative w-full max-w-lg my-auto rounded-2xl shadow-2xl border p-6 overflow-hidden ${
          isStitchLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-neutral-100'
        }`}>
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Enriquecer Contactos de Booking</h2>
              <p className="text-xs text-neutral-400">Búsqueda automática de emails, teléfonos e Instagram</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-5 space-y-4 text-xs">
          <div className={`p-4 rounded-xl border ${isStitchLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950/60 border-neutral-800/80'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-neutral-300">Salas con información incompleta:</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold">{incompleteLeads.length}</span>
            </div>
            <p className="text-neutral-400 leading-relaxed">
              El asistente escaneará páginas web oficiales y directorios públicos para completar correos de booking y teléfonos de los promotores.
            </p>
          </div>

          {statusMessage && (
            <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center gap-2">
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              <span>{statusMessage}</span>
            </div>
          )}

          {enrichedResults.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Contactos actualizados:</span>
              {enrichedResults.map((r, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-neutral-800/50 border border-neutral-700/50 flex flex-col gap-1">
                  <span className="font-bold text-neutral-200">{r.name}</span>
                  <div className="flex flex-wrap gap-3 text-[11px] text-neutral-400">
                    {r.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-emerald-400" /> {r.email}</span>}
                    {r.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-blue-400" /> {r.phone}</span>}
                    {r.instagram && <span className="flex items-center gap-1"><Instagram className="w-3 h-3 text-pink-400" /> {r.instagram}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleStartEnrichment}
            disabled={isProcessing || incompleteLeads.length === 0}
            className="px-5 py-2.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enriqueciendo ({processedCount}/{Math.min(incompleteLeads.length, 10)})
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Iniciar Enriquecimiento
              </>
            )}
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};
