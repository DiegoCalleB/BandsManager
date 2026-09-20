import React, { useState, useMemo } from'react';
import {
 X,
 Copy,
 CheckCircle2,
 AlertTriangle,
 ArrowRight,
 Trash2,
 Merge,
 Sparkles,
 MapPin,
 Mail,
 Phone,
 Globe,
 ExternalLink,
 ShieldCheck,
 Check
} from'lucide-react';
import { Lead } from'../../types';
import {
 findDuplicateLeads,
 DuplicateGroup,
 DuplicateMatchReason,
 mergeTwoLeads,
 calculateLeadCompletenessScore
} from'../../utils/duplicateLeads';
import { ModalPortal } from'../common/ModalPortal';
import { apiFetch } from'../../utils/api';

interface LeadDuplicatesModalProps {
 isOpen: boolean;
 onClose: () => void;
 leads: Lead[];
 onUpdateLead?: (lead: Lead) => void;
 onDeleteLead?: (id: string) => void;
 isStitchLight?: boolean;
}

export const LeadDuplicatesModal: React.FC<LeadDuplicatesModalProps> = ({
 isOpen,
 onClose,
 leads,
 onUpdateLead,
 onDeleteLead,
 isStitchLight = false
}) => {
 const [selectedFilter, setSelectedFilter] = useState<string>('all');
 const [isProcessing, setIsProcessing] = useState(false);
 const [ignoredGroupIds, setIgnoredGroupIds] = useState<Set<string>>(new Set());
 const [successMessage, setSuccessMessage] = useState<string | null>(null);

 // Analizar duplicados
 const rawGroups = useMemo(() => {
 return findDuplicateLeads(leads);
 }, [leads]);

 // Filtrar grupos ignorados o por tipo
 const duplicateGroups = useMemo(() => {
 return rawGroups.filter(g => {
 if (ignoredGroupIds.has(g.id)) return false;
 if (selectedFilter ==='all') return true;
 return g.matchReason === selectedFilter;
 });
 }, [rawGroups, ignoredGroupIds, selectedFilter]);

 const totalInvolvedLeads = useMemo(() => {
 const ids = new Set<string>();
 duplicateGroups.forEach(g => g.leads.forEach(l => ids.add(l.id)));
 return ids.size;
 }, [duplicateGroups]);

 if (!isOpen) return null;

 // Fusionar un grupo conservando el lead especificado
 const handleMergeGroup = async (group: DuplicateGroup, keepLeadId: string) => {
 setIsProcessing(true);
 try {
 const targetLead = group.leads.find(l => l.id === keepLeadId);
 if (!targetLead) return;

 let mergedLead = { ...targetLead };
 const secondaryLeads = group.leads.filter(l => l.id !== keepLeadId);

 for (const sec of secondaryLeads) {
 mergedLead = mergeTwoLeads(mergedLead, sec);
 }

 // 1. Actualizar el lead principal en el backend
 await apiFetch(`/api/leads/${mergedLead.id}`, {
 method:'PUT',
 body: JSON.stringify(mergedLead)
 });
 onUpdateLead?.(mergedLead);

 // 2. Eliminar los secundarios
 const idsToDelete = secondaryLeads.map(l => l.id);
 if (idsToDelete.length > 0) {
 try {
 await apiFetch('/api/leads/bulk-delete', {
 method:'POST',
 body: JSON.stringify({ ids: idsToDelete })
 });
 } catch {
 // Fallback a borrado individual si bulk falla
 for (const id of idsToDelete) {
 await apiFetch(`/api/leads/${id}`, { method:'DELETE' });
 }
 }

 idsToDelete.forEach(id => onDeleteLead?.(id));
 }

 setIgnoredGroupIds(prev => new Set(prev).add(group.id));
 window.dispatchEvent(new CustomEvent('app-data-updated'));
 setSuccessMessage(`Sala"${mergedLead.nombre_sala}" fusionada con éxito.`);
 setTimeout(() => setSuccessMessage(null), 3500);
 } catch (err: any) {
 console.error('Error al fusionar grupo:', err);
 alert('Hubo un error al fusionar las salas. Por favor, inténtalo de nuevo.');
 } finally {
 setIsProcessing(false);
 }
 };

 // Eliminar un lead individual duplicado
 const handleDeleteSingleLead = async (leadId: string, leadName: string) => {
 if (!confirm(`¿Seguro que deseas eliminar el registro duplicado"${leadName}"?`)) return;

 setIsProcessing(true);
 try {
 await apiFetch(`/api/leads/${leadId}`, { method:'DELETE' });
 onDeleteLead?.(leadId);
 window.dispatchEvent(new CustomEvent('app-data-updated'));
 setSuccessMessage(`Registro"${leadName}" eliminado.`);
 setTimeout(() => setSuccessMessage(null), 3000);
 } catch (err) {
 console.error('Error deleting lead:', err);
 alert('Error al eliminar el lead.');
 } finally {
 setIsProcessing(false);
 }
 };

 // Fusionar todos los duplicados automáticamente
 const handleMergeAllAuto = async () => {
 if (!confirm(`¿Deseas fusionar automáticamente los ${duplicateGroups.length} grupos detectados? Se conservará el registro más completo de cada grupo y se combinarán teléfonos, notas y datos de contacto.`)) {
 return;
 }

 setIsProcessing(true);
 let count = 0;
 try {
 for (const group of duplicateGroups) {
 const keepId = group.suggestedKeepId;
 const targetLead = group.leads.find(l => l.id === keepId);
 if (!targetLead) continue;

 let mergedLead = { ...targetLead };
 const secondaryLeads = group.leads.filter(l => l.id !== keepId);

 for (const sec of secondaryLeads) {
 mergedLead = mergeTwoLeads(mergedLead, sec);
 }

 await apiFetch(`/api/leads/${mergedLead.id}`, {
 method:'PUT',
 body: JSON.stringify(mergedLead)
 });
 onUpdateLead?.(mergedLead);

 const idsToDelete = secondaryLeads.map(l => l.id);
 if (idsToDelete.length > 0) {
 try {
 await apiFetch('/api/leads/bulk-delete', {
 method:'POST',
 body: JSON.stringify({ ids: idsToDelete })
 });
 } catch {
 for (const id of idsToDelete) {
 await apiFetch(`/api/leads/${id}`, { method:'DELETE' });
 }
 }
 idsToDelete.forEach(id => onDeleteLead?.(id));
 }
 count++;
 }

 window.dispatchEvent(new CustomEvent('app-data-updated'));
 setSuccessMessage(`Se han fusionado con éxito ${count} grupos de salas duplicadas.`);
 setTimeout(() => setSuccessMessage(null), 4000);
 } catch (err) {
 console.error('Error merging all leads:', err);
 alert('Ocurrió un problema durante la fusión automática masiva.');
 } finally {
 setIsProcessing(false);
 }
 };

 const reasonCounts = {
 all: rawGroups.length,
 same_email: rawGroups.filter(g => g.matchReason ==='same_email').length,
 same_name_and_city: rawGroups.filter(g => g.matchReason ==='same_name_and_city').length,
 similar_name_same_city: rawGroups.filter(g => g.matchReason ==='similar_name_same_city').length,
 same_website: rawGroups.filter(g => g.matchReason ==='same_website').length,
 };

 return (
 <ModalPortal>
 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
 <div
 className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[var(--r-l)] shadow-2xl overflow-hidden transition-all ${
 isStitchLight
 ?'bg-white text-[var(--ink)]'
 :'bg-[var(--surface)] text-zinc-100'
 }`}
 >
 {/* Header */}
 <div
 className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${
 isStitchLight
 ?'bg-[var(--bg)]'
 :'bg-[var(--surface)]'
 }`}
 >
 <div className="flex items-center gap-3">
 <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--acc)]/15 text-[var(--acc)]">
 <Copy className="w-5 h-5" />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
 Detector y Limpiador de Duplicados
 </h2>
 <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[var(--acc)]/15 text-[var(--acc)]/70">
 {duplicateGroups.length} {duplicateGroups.length === 1 ?'grupo' :'grupos'}
 </span>
 </div>
 <p className={`text-xs mt-0.5 ${isStitchLight ?'text-[var(--ink-2)]' :'text-zinc-400'}`}>
 Detecta salas y contactos repetidos por email idéntico, nombre y ciudad, o dominios coincidentes.
 </p>
 </div>
 </div>

 <button
 type="button"
 onClick={onClose}
 className={`p-2 rounded-[var(--r-m)] transition-colors cursor-pointer ${
 isStitchLight
 ?'hover:bg-[var(--sunken)] text-[var(--ink-2)]'
 :'hover:bg-neutral-800 text-zinc-400 hover:text-white'
 }`}
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Success Banner */}
 {successMessage && (
 <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-2.5 flex items-center gap-2 text-xs font-medium text-emerald-300 animate-in fade-in">
 <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
 <span>{successMessage}</span>
 </div>
 )}

 {/* Controls & Filter Bar */}
 <div
 className={`p-3 sm:px-5 border-b flex flex-wrap items-center justify-between gap-2.5 shrink-0 ${
 isStitchLight ?'bg-[var(--sunken)]/60' :'bg-[var(--surface)]/40'
 }`}
 >
 {/* Filter Pills */}
 <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full text-xs">
 <button
 type="button"
 onClick={() => setSelectedFilter('all')}
 className={`px-3 py-1.5 rounded-[var(--r-m)] font-medium transition cursor-pointer shrink-0 ${
 selectedFilter ==='all'
 ?'bg-[var(--acc)] text-[var(--acc-ink)] font-bold shadow-xs'
 : isStitchLight
 ?'bg-white text-[var(--ink-2)] hover:bg-[var(--sunken)]'
 :'bg-neutral-800 text-zinc-300 hover:bg-neutral-700'
 }`}
 >
 Todos ({reasonCounts.all})
 </button>
 {reasonCounts.same_email > 0 && (
 <button
 type="button"
 onClick={() => setSelectedFilter('same_email')}
 className={`px-3 py-1.5 rounded-[var(--r-m)] font-medium transition cursor-pointer shrink-0 ${
 selectedFilter ==='same_email'
 ?'bg-[var(--acc)] text-[var(--acc-ink)] font-bold shadow-xs'
 : isStitchLight
 ?'bg-white text-[var(--ink-2)] hover:bg-[var(--sunken)]'
 :'bg-neutral-800 text-zinc-300 hover:bg-neutral-700'
 }`}
 >
 Mismo Email ({reasonCounts.same_email})
 </button>
 )}
 {reasonCounts.same_name_and_city > 0 && (
 <button
 type="button"
 onClick={() => setSelectedFilter('same_name_and_city')}
 className={`px-3 py-1.5 rounded-[var(--r-m)] font-medium transition cursor-pointer shrink-0 ${
 selectedFilter ==='same_name_and_city'
 ?'bg-[var(--acc)] text-[var(--acc-ink)] font-bold shadow-xs'
 : isStitchLight
 ?'bg-white text-[var(--ink-2)] hover:bg-[var(--sunken)]'
 :'bg-neutral-800 text-zinc-300 hover:bg-neutral-700'
 }`}
 >
 Mismo Nombre y Ciudad ({reasonCounts.same_name_and_city})
 </button>
 )}
 {reasonCounts.similar_name_same_city > 0 && (
 <button
 type="button"
 onClick={() => setSelectedFilter('similar_name_same_city')}
 className={`px-3 py-1.5 rounded-[var(--r-m)] font-medium transition cursor-pointer shrink-0 ${
 selectedFilter ==='similar_name_same_city'
 ?'bg-[var(--acc)] text-[var(--acc-ink)] font-bold shadow-xs'
 : isStitchLight
 ?'bg-white text-[var(--ink-2)] hover:bg-[var(--sunken)]'
 :'bg-neutral-800 text-zinc-300 hover:bg-neutral-700'
 }`}
 >
 Nombre Similar ({reasonCounts.similar_name_same_city})
 </button>
 )}
 {reasonCounts.same_website > 0 && (
 <button
 type="button"
 onClick={() => setSelectedFilter('same_website')}
 className={`px-3 py-1.5 rounded-[var(--r-m)] font-medium transition cursor-pointer shrink-0 ${
 selectedFilter ==='same_website'
 ?'bg-[var(--acc)] text-[var(--acc-ink)] font-bold shadow-xs'
 : isStitchLight
 ?'bg-white text-[var(--ink-2)] hover:bg-[var(--sunken)]'
 :'bg-neutral-800 text-zinc-300 hover:bg-neutral-700'
 }`}
 >
 Misma Web ({reasonCounts.same_website})
 </button>
 )}
 </div>

 {/* Bulk Action */}
 {duplicateGroups.length > 0 && (
 <button
 type="button"
 disabled={isProcessing}
 onClick={handleMergeAllAuto}
 className="px-3 py-1.5 rounded-[var(--r-m)] text-xs font-bold bg-[var(--acc)] hover:bg-[var(--acc)] text-[var(--acc-ink)] transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 shrink-0 ml-auto"
 >
 <Sparkles className="w-3.5 h-3.5" />
 <span>Fusionar Todos Automáticamente</span>
 </button>
 )}
 </div>

 {/* List of Duplicate Groups */}
 <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
 {duplicateGroups.length === 0 ? (
 <div className="py-16 text-center space-y-3">
 <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
 <ShieldCheck className="w-6 h-6" />
 </div>
 <h3 className="text-base font-bold text-zinc-200">
 ¡No se han encontrado salas ni leads duplicados!
 </h3>
 <p className="text-xs text-zinc-400 max-w-md mx-auto">
 Tu base de datos está perfectamente limpia y organizada. No hay coincidencias conflictivas de nombres, correos ni recintos.
 </p>
 </div>
 ) : (
 duplicateGroups.map((group) => (
 <div
 key={group.id}
 className={`rounded-[var(--r-l)] p-4 transition-all ${
 isStitchLight
 ?'bg-[var(--bg)]/70 shadow-xs'
 :'bg-[var(--surface)]/60 /90'
 }`}
 >
 {/* Group Top Info */}
 <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b /60">
 <div className="flex items-center gap-2">
 <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[var(--acc)]/15 text-[var(--acc)]/70 flex items-center gap-1">
 <AlertTriangle className="w-3 h-3" />
 {group.matchReasonLabel}
 </span>
 <span className="text-[11px] text-zinc-400">
 {group.confidence}% de certeza
 </span>
 </div>

 <button
 type="button"
 onClick={() => setIgnoredGroupIds(prev => new Set(prev).add(group.id))}
 className="text-[11px] text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
 >
 Ignorar (No son duplicados)
 </button>
 </div>

 {/* Comparative Cards */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 {group.leads.map((lead) => {
 const isSuggested = lead.id === group.suggestedKeepId;
 const score = calculateLeadCompletenessScore(lead);

 return (
 <div
 key={lead.id}
 className={`rounded-[var(--r-m)] p-3.5 flex flex-col justify-between transition-all ${
 isSuggested
 ? isStitchLight
 ?'bg-amber-50/60'
 :'bg-[var(--surface)] /50 shadow-xs'
 : isStitchLight
 ?'bg-white'
 :'bg-[var(--surface)]'
 }`}
 >
 <div className="space-y-2">
 <div className="flex items-start justify-between gap-2">
 <div className="min-w-0">
 <div className="flex items-center gap-1.5 flex-wrap">
 <h4 className="font-bold text-sm text-zinc-100 truncate">
 {lead.nombre_sala}
 </h4>
 {isSuggested && (
 <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--acc)] text-[var(--acc-ink)]">
 ⭐ Recomendado
 </span>
 )}
 </div>
 <div className="flex items-center gap-1 text-xs text-zinc-400 mt-0.5">
 <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
 <span>{lead.ciudad ||'Sin ciudad'}</span>
 {lead.region && <span>· {lead.region}</span>}
 </div>
 </div>

 <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-800 text-zinc-300 capitalize shrink-0">
 {lead.estado ||'nuevo'}
 </span>
 </div>

 {/* Contact Details */}
 <div className="space-y-1 text-xs text-zinc-300 pt-1">
 {lead.email_contacto ? (
 <div className="flex items-center gap-1.5 truncate">
 <Mail className="w-3 h-3 text-zinc-400 shrink-0" />
 <span className="truncate">{lead.email_contacto}</span>
 </div>
 ) : (
 <div className="text-[11px] text-zinc-500 italic">Sin correo electrónico</div>
 )}

 {lead.telefono && (
 <div className="flex items-center gap-1.5 truncate">
 <Phone className="w-3 h-3 text-zinc-400 shrink-0" />
 <span>{lead.telefono}</span>
 </div>
 )}

 {lead.website && (
 <div className="flex items-center gap-1.5 truncate text-[11px] text-sky-400">
 <Globe className="w-3 h-3 shrink-0" />
 <span className="truncate">{lead.website}</span>
 </div>
 )}

 {lead.aforo ? (
 <div className="text-[11px] text-zinc-400">
 Aforo: <span className="font-medium text-zinc-200">{lead.aforo} personas</span>
 </div>
 ) : null}

 {lead.notas && (
 <p className="text-[11px] text-zinc-400 line-clamp-2 bg-black/20 p-1.5 rounded-[var(--r-s)] mt-1">
 {lead.notas}
 </p>
 )}
 </div>
 </div>

 {/* Card Actions */}
 <div className="mt-3.5 pt-2.5 border-t /80 flex items-center justify-between gap-2">
 <button
 type="button"
 disabled={isProcessing}
 onClick={() => handleMergeGroup(group, lead.id)}
 className={`px-2.5 py-1.5 rounded-[var(--r-s)] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
 isSuggested
 ?'bg-[var(--acc)] hover:bg-[var(--acc)] text-[var(--acc-ink)]'
 :'bg-neutral-800 hover:bg-neutral-700 text-zinc-200'
 }`}
 title="Conserva este lead y añade todos los teléfonos, notas y datos de los demás"
 >
 <Merge className="w-3.5 h-3.5" />
 <span>Conservar y Fusionar Aquí</span>
 </button>

 <button
 type="button"
 disabled={isProcessing}
 onClick={() => handleDeleteSingleLead(lead.id, lead.nombre_sala)}
 className="p-1.5 rounded-[var(--r-s)] text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition cursor-pointer"
 title="Eliminar solo este registro individual"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 ))
 )}
 </div>

 {/* Footer */}
 <div
 className={`p-3 sm:px-5 border-t flex items-center justify-between text-xs ${
 isStitchLight
 ?'bg-[var(--bg)] text-[var(--ink-2)]'
 :'bg-[var(--surface)] text-zinc-400'
 }`}
 >
 <span>
 Total analizado: <strong className="text-zinc-200">{leads.length}</strong> salas y leads.
 </span>
 <button
 type="button"
 onClick={onClose}
 className="px-4 py-1.5 rounded-[var(--r-m)] font-medium bg-neutral-800 hover:bg-neutral-700 text-zinc-200 transition cursor-pointer"
 >
 Cerrar
 </button>
 </div>
 </div>
 </div>
 </ModalPortal>
 );
};
