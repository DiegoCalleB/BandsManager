import React, { useState } from'react';
import { Lead } from'../../types';
import { X, Sparkles, CheckCircle2, AlertCircle, Loader2, Globe, Mail, Phone, Instagram } from'lucide-react';
import { apiFetch } from'../../utils/api';
import { ModalPortal } from'../common/ModalPortal';

interface CRMContactEnricherModalProps {
 isOpen: boolean;
 onClose: () => void;
 leads: Lead[];
 onUpdateLead?: (id: string, updatedFields: Partial<Lead>) => void;
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
 const res = await apiFetch(`/api/leads/${lead.id}/enrich`, { method:'POST' });
 if (res && res.success && res.data) {
 enrichedList.push({
 leadId: lead.id,
 name: lead.nombre_sala,
 email: res.data.email_contacto || lead.email_contacto,
 phone: res.data.telefono || lead.telefono,
 instagram: res.data.instagram || lead.instagram
 });
 if (onUpdateLead) {
 onUpdateLead(lead.id, {
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
 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/70 overflow-y-auto overscroll-contain animate-in fade-in duration-200">
 <div className={`relative w-full max-w-lg my-auto rounded-[var(--r-l)] p-6 overflow-hidden ${
 isStitchLight ?'bg-[var(--surface)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink-2)]'
 }`}>
 <div className="flex items-center justify-between pb-4 border-b border-[var(--hair)]">
 <div className="flex items-center gap-2">
 <div className="p-2 rounded-[var(--r-s)] bg-[var(--acc)]/10 text-[var(--acc)]">
 <Sparkles className="w-5 h-5" />
 </div>
 <div>
 <h2 className="text-base font-bold">Enriquecer Contactos de Booking</h2>
 <p className="text-xs text-[var(--ink-2)]">Búsqueda automática de emails, teléfonos e Instagram</p>
 </div>
 </div>
 <button
 onClick={onClose}
 disabled={isProcessing}
 className="p-1 rounded-[var(--r-s)] hover:bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink-2)] transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="my-5 space-y-4 text-xs">
 <div className={`p-4 rounded-[var(--r-m)] ${isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--surface)]/60 /80'}`}>
 <div className="flex items-center justify-between mb-2">
 <span className="font-semibold text-[var(--ink)]">Salas con información incompleta:</span>
 <span className="px-2 py-0.5 rounded-full bg-[var(--acc)]/10 text-[var(--acc)] font-bold">{incompleteLeads.length}</span>
 </div>
 <p className="text-[var(--ink-2)] leading-relaxed">
 El asistente escaneará páginas web oficiales y directorios públicos para completar correos de booking y teléfonos de los promotores.
 </p>
 </div>

 {statusMessage && (
 <div className="p-3 rounded-[var(--r-s)] bg-[var(--tentative)]/10 text-[var(--tentative)]/50 flex items-center gap-2">
 {isProcessing ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-[var(--ok)] shrink-0" />}
 <span>{statusMessage}</span>
 </div>
 )}

 {enrichedResults.length > 0 && (
 <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
 <span className="text-[11px] font-semibold text-[var(--ink-2)] tracking-wider">Contactos actualizados:</span>
 {enrichedResults.map((r, i) => (
 <div key={i} className="p-2.5 rounded-[var(--r-s)] bg-[var(--surface)]/80 flex flex-col gap-1">
 <span className="font-bold text-[var(--ink-2)]">{r.name}</span>
 <div className="flex flex-wrap gap-3 text-[11px] text-[var(--ink-2)]">
 {r.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-[var(--ok)]" /> {r.email}</span>}
 {r.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-[var(--acc)]" /> {r.phone}</span>}
 {r.instagram && <span className="flex items-center gap-1"><Instagram className="w-3 h-3 text-[var(--alert)]" /> {r.instagram}</span>}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--hair)]">
 <button
 type="button"
 onClick={onClose}
 disabled={isProcessing}
 className="px-4 py-2 text-xs font-semibold rounded-[var(--r-m)] text-[var(--ink-2)] hover:text-[var(--ink-2)] transition-colors"
 >
 Cerrar
 </button>
 <button
 type="button"
 onClick={handleStartEnrichment}
 disabled={isProcessing || incompleteLeads.length === 0}
 className="px-5 py-2.5 text-xs font-bold rounded-[var(--r-m)] bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--ink)] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
