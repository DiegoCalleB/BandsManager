import React, { useState } from'react';
import { BookingCampaign, PitchTemplateCategory } from'../../types';
import { HolidayDateWarning } from'../common/HolidayDateWarning';
import {
 Target, Calendar, MapPin, Users, Plus, X, Check, Trash2, Edit3, Sparkles,
 ChevronRight, Compass, ArrowRight, ShieldCheck, Flame,
 Building2, Tent, Disc3, Radio, Briefcase, Landmark
} from'lucide-react';

// Mismas 7 categorías y misma iconografía que src/components/booking/TemplateConfigSection.tsx
// (plantillas generales por tipo de lead), para que el mánager reconozca de un vistazo qué
// caso de uso está editando dentro de la campaña.
const PITCH_CATEGORIES: { id: PitchTemplateCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
 { id:'salas', label:'🏛️ Salas', icon: Building2 },
 { id:'festivales', label:'🎪 Festivales', icon: Tent },
 { id:'discotecas', label:'🪩 Discotecas', icon: Disc3 },
 { id:'medios', label:'📻 Medios', icon: Radio },
 { id:'grupos', label:'🎸 Grupos', icon: Users },
 { id:'managements', label:'💼 Managements', icon: Briefcase },
 { id:'ayuntamientos', label:'🎉 Ayuntamientos', icon: Landmark },
];

interface CampaignManagerModalProps {
 isOpen: boolean;
 onClose: () => void;
 campaigns: BookingCampaign[];
 activeCampaign: BookingCampaign | null;
 onSaveCampaign: (campaign: Partial<BookingCampaign>) => Promise<BookingCampaign>;
 onDeleteCampaign: (id: string) => Promise<void>;
 onSetActiveCampaign: (idOrCampaign: string | BookingCampaign | null) => Promise<void>;
 onNavigate?: (view: string, options?: any) => void;
}

export function CampaignManagerModal({
 isOpen,
 onClose,
 campaigns,
 activeCampaign,
 onSaveCampaign,
 onDeleteCampaign,
 onSetActiveCampaign,
 onNavigate
}: CampaignManagerModalProps) {
 const [isEditing, setIsEditing] = useState(false);
 const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
 const [formData, setFormData] = useState<Partial<BookingCampaign>>({
 name:'',
 targetCities: ['Madrid'],
 minCapacity: 300,
 maxCapacity: 500,
 targetDates: ['2026-12-04','2026-12-05'],
 notes:'',
 customPitchTemplates: {},
 color:'var(--acc)',
 isActive: true
 });
 const [newCityInput, setNewCityInput] = useState('');
 const [activePitchCategory, setActivePitchCategory] = useState<PitchTemplateCategory>('salas');

 if (!isOpen) return null;

 const handleStartCreate = () => {
 setEditingCampaignId(null);
 setFormData({
 name:'Nueva Campaña' + new Date().getFullYear(),
 targetCities: ['Madrid'],
 minCapacity: 250,
 maxCapacity: 500,
 targetDates: ['2026-12-04','2026-12-05'],
 notes:'Búsqueda de salas y fechas para la gira.',
 customPitchTemplates: {},
 color:'var(--acc)',
 isActive: true
 });
 setActivePitchCategory('salas');
 setIsEditing(true);
 };

 const handleStartEdit = (camp: BookingCampaign) => {
 setEditingCampaignId(camp.id);
 setFormData({
 name: camp.name,
 targetCities: [...(camp.targetCities || [])],
 minCapacity: camp.minCapacity || 0,
 maxCapacity: camp.maxCapacity || 0,
 targetDates: [...(camp.targetDates || [])],
 targetDatesText: camp.targetDatesText ||'',
 notes: camp.notes ||'',
 customPitchTemplates: { ...(camp.customPitchTemplates || {}) },
 color: camp.color ||'var(--acc)',
 isActive: camp.isActive
 });
 setActivePitchCategory('salas');
 setIsEditing(true);
 };

 const handleSave = async () => {
 if (!formData.name?.trim()) return;
 const dates = formData.targetDates || [];
 const formattedDatesText = dates.map(d => {
 const parts = d.split('-');
 if (parts.length === 3) {
 const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
 return date.toLocaleDateString('es-ES', { day:'numeric', month:'short' });
 }
 return d;
 }).join(',');

 const payload = {
 id: editingCampaignId || undefined,
 name: formData.name.trim(),
 targetCities: formData.targetCities || [],
 minCapacity: Number(formData.minCapacity || 0),
 maxCapacity: Number(formData.maxCapacity || 0),
 targetDates: dates,
 targetDatesText: formattedDatesText,
 notes: formData.notes ||'',
 customPitchTemplates: formData.customPitchTemplates || {},
 color: formData.color ||'var(--acc)',
 isActive: formData.isActive ?? true
 };


 await onSaveCampaign(payload);

 setIsEditing(false);
 setEditingCampaignId(null);
 };

 const handleAddDate = (newDate: string) => {
 if (!newDate) return;
 const current = formData.targetDates || [];
 if (!current.includes(newDate)) {
 const next = [...current, newDate].sort();
 setFormData({ ...formData, targetDates: next });
 }
 };

 const handleRemoveDate = (index: number) => {
 const current = [...(formData.targetDates || [])];
 current.splice(index, 1);
 setFormData({ ...formData, targetDates: current });
 };

 const handleAddCity = () => {
 if (!newCityInput.trim()) return;
 const current = formData.targetCities || [];
 if (!current.includes(newCityInput.trim())) {
 setFormData({ ...formData, targetCities: [...current, newCityInput.trim()] });
 }
 setNewCityInput('');
 };

 const handleRemoveCity = (city: string) => {
 setFormData({
 ...formData,
 targetCities: (formData.targetCities || []).filter(c => c !== city)
 });
 };

 const handlePitchTemplateChange = (category: PitchTemplateCategory, value: string) => {
 setFormData({
 ...formData,
 customPitchTemplates: { ...(formData.customPitchTemplates || {}), [category]: value }
 });
 };

 const filledPitchCategoriesCount = Object.values(formData.customPitchTemplates || {}).filter(v => (v ||'').trim()).length;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--scrim)]/80 animate-fade-in">
 <div className="bg-[var(--bg)] rounded-[var(--r-l)] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
 
 {/* Header */}
 <div className="p-5 flex items-center justify-between bg-gradient-to-r from-[var(--surface)] to-[var(--bg)]">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-[var(--r-m)] bg-[var(--tentative)]/20 text-[var(--tentative)]/80 flex items-center justify-center">
 <Target className="w-5 h-5" />
 </div>
 <div>
 <h2 className="text-base sm:text-lg font-bold font-display text-[var(--ink)] flex items-center gap-2">
 Gestor de Campañas de Booking
 <span className="text-[10px] font-sans font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--tentative)]/20 text-[var(--tentative)]/80">
 {campaigns.length} disponibles
 </span>
 </h2>
 <p className="text-xs text-[var(--ink-2)] font-sans mt-0.5">
 Configura los objetivos de fechas, ciudades y aforo. Al activar una campaña, toda la web, el calendario y los pitches de IA se enfocarán en ella.
 </p>
 </div>
 </div>
 <button 
 onClick={onClose}
 className="p-2 text-[var(--ink-2)] hover:text-[var(--ink)] rounded-[var(--r-s)] hover:bg-[var(--surface)]/80 transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Content Body */}
 <div className="p-5 overflow-y-auto space-y-5 flex-1">
 {isEditing ? (
 /* Editing / Creation Form */
 <div className="space-y-4">
 <div className="flex items-center justify-between pb-3">
 <span className="text-xs font-sans font-bold tracking-wider text-[var(--acc)]">
 {editingCampaignId ?'✎ Editar Campaña' :'➕ Crear Nueva Campaña'}
 </span>
 <button
 onClick={() => setIsEditing(false)}
 className="text-xs text-[var(--ink-2)] hover:text-[var(--ink)] underline cursor-pointer"
 >
 Volver a la lista
 </button>
 </div>

 {/* Name & Color */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 <div className="sm:col-span-2">
 <label className="block text-[11px] font-sans font-bold tracking-wider text-[var(--ink-2)] mb-1">
 Nombre de la Campaña *
 </label>
 <input
 type="text"
 value={formData.name ||''}
 onChange={e => setFormData({ ...formData, name: e.target.value })}
 placeholder="Ej: Campaña Diciembre 2026"
 className="w-full bg-[var(--surface)] rounded-[var(--r-m)] px-3 py-2 text-sm text-[var(--ink)] placeholder-[var(--ink-2)] focus:ring-1 focus:ring-purple-500"
 />
 </div>
 <div>
 <label className="block text-[11px] font-sans font-bold tracking-wider text-[var(--ink-2)] mb-1">
 Color en Calendario
 </label>
 <div className="flex items-center gap-2 mt-1">
 {['var(--acc)','var(--acc)','var(--ok)','var(--ok)','var(--alert)','var(--acc)'].map(col => (
 <button
 key={col}
 type="button"
 onClick={() => setFormData({ ...formData, color: col })}
 className={`w-7 h-7 rounded-[var(--r-s)] transition-transform cursor-pointer ${
 formData.color === col ?'scale-110 ring-2 ring-white/40' :'border-transparent opacity-70 hover:opacity-100'
 }`}
 style={{ backgroundColor: col }}
 />
 ))}
 </div>
 </div>
 </div>

 {/* Target Cities */}
 <div>
 <label className="block text-[11px] font-sans font-bold tracking-wider text-[var(--ink-2)] mb-1">
 Ciudades Objetivo *
 </label>
 <div className="flex flex-wrap gap-1.5 mb-2">
 {formData.targetCities?.map(city => (
 <span
 key={city}
 className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-[var(--r-s)] bg-[var(--acc)]/20 text-[var(--ink-3)]"
 >
 <MapPin className="w-3 h-3 text-[var(--ink-2)]" />
 {city}
 <button
 type="button"
 onClick={() => handleRemoveCity(city)}
 className="hover:text-[var(--alert)] ml-1"
 >
 <X className="w-3 h-3" />
 </button>
 </span>
 ))}
 </div>
 <div className="flex gap-2">
 <input
 type="text"
 value={newCityInput}
 onChange={e => setNewCityInput(e.target.value)}
 onKeyDown={e => { if (e.key ==='Enter') { e.preventDefault(); handleAddCity(); } }}
 placeholder="Añadir ciudad (ej. Barcelona) y pulsar Enter"
 className="flex-1 bg-[var(--surface)] rounded-[var(--r-m)] px-3 py-1.5 text-xs text-[var(--ink)] placeholder-[var(--ink-2)] />
 <button
 type="button"
 onClick={handleAddCity}
 className="px-3 py-1.5 bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink)] text-xs font-sans font-bold rounded-[var(--r-m)]"
 >
 + Añadir
 </button>
 </div>
 </div>

 {/* Capacity Range */}
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-[11px] font-sans font-bold tracking-wider text-[var(--ink-2)] mb-1">
 Aforo Mínimo (pax)
 </label>
 <input
 type="number"
 value={formData.minCapacity || 0}
 onChange={e => setFormData({ ...formData, minCapacity: parseInt(e.target.value) || 0 })}
 className="w-full bg-[var(--surface)] rounded-[var(--r-m)] px-3 py-2 text-sm text-[var(--ink)]"
 />
 </div>
 <div>
 <label className="block text-[11px] font-sans font-bold tracking-wider text-[var(--ink-2)] mb-1">
 Aforo Máximo (pax)
 </label>
 <input
 type="number"
 value={formData.maxCapacity || 0}
 onChange={e => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) || 0 })}
 className="w-full bg-[var(--surface)] rounded-[var(--r-m)] px-3 py-2 text-sm text-[var(--ink)]"
 />
 </div>
 </div>

 {/* Target Dates List & Quick Add */}
 <div>
 <label className="block text-[11px] font-sans font-bold tracking-wider text-[var(--ink-2)] mb-1">
 Fechas Objetivo (se marcarán en Calendario y pitches IA) *
 </label>
 <div className="space-y-2 mb-2.5">
 <div className="flex flex-wrap gap-2">
 {formData.targetDates?.map((date, idx) => (
 <div 
 key={idx}
 className="flex flex-col gap-1 bg-[var(--surface)] px-2.5 py-1.5 rounded-[var(--r-m)] text-[var(--ink)]"
 >
 <div className="flex items-center gap-1.5">
 <Calendar className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
 <input
 type="date"
 value={date}
 onChange={(e) => {
 if (!e.target.value) return;
 const next = [...(formData.targetDates || [])];
 next[idx] = e.target.value;
 next.sort();
 setFormData({ ...formData, targetDates: next });
 }}
 className="bg-transparent text-xs font-sans font-bold text-[var(--ink)] p-0 focus:ring-0 cursor-pointer"
 />
 <button
 type="button"
 onClick={() => handleRemoveDate(idx)}
 className="text-[var(--ink-2)] hover:text-[var(--alert)] ml-1"
 title="Eliminar fecha"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 </div>
 <HolidayDateWarning date={date} compact />
 </div>
 ))}

 <div className="flex items-center gap-1.5 bg-[var(--tentative)]/10 hover:bg-[var(--tentative)]/20 rounded-[var(--r-m)] px-2.5 py-1 text-[var(--tentative)]/80">
 <Plus className="w-3.5 h-3.5" />
 <span className="text-[11px] font-sans font-bold">Añadir Fecha:</span>
 <input
 type="date"
 onChange={(e) => {
 handleAddDate(e.target.value);
 e.target.value ='';
 }}
 className="bg-transparent text-xs font-sans text-[var(--acc)]/40 p-0 focus:ring-0 cursor-pointer"
 />
 </div>
 </div>
 </div>
 <p className="text-[11px] text-[var(--ink-2)] italic">
 💡 Consejo: Las fechas añadidas aparecerán destacadas con badge de campaña en el Calendario y serán propuestas automáticamente por los agentes de IA al redactar pitches a salas.
 </p>
 </div>

 {/* Notes / Co-booking details */}
 <div>
 <label className="block text-[11px] font-sans font-bold tracking-wider text-[var(--ink-2)] mb-1">
 Notas de Enfoque y Co-booking
 </label>
 <textarea
 rows={2}
 value={formData.notes ||''}
 onChange={e => setFormData({ ...formData, notes: e.target.value })}
 placeholder="Ej: Intercambio con bandas de ska/mestizaje locales para compartir backline y taquilla al 50%."
 className="w-full bg-[var(--surface)] rounded-[var(--r-m)] px-3 py-2 text-xs text-[var(--ink)] placeholder-[var(--ink-2)] />
 </div>

 {/* Campaign-specific pitch templates, one per lead use case */}
 <div>
 <label className="block text-[11px] font-sans font-bold tracking-wider text-[var(--ink-2)] mb-1 flex items-center gap-2">
 Plantilla de Pitch de Campaña por Caso de Uso (opcional)
 {filledPitchCategoriesCount > 0 && (
 <span className="text-[9px] font-sans font-extrabold px-1.5 py-0.5 rounded bg-[var(--tentative)]/20 text-[var(--tentative)]/80">
 {filledPitchCategoriesCount}/{PITCH_CATEGORIES.length} definidas
 </span>
 )}
 </label>
 <div className="flex flex-wrap gap-1.5 mb-2">
 {PITCH_CATEGORIES.map(cat => {
 const hasContent = !!(formData.customPitchTemplates?.[cat.id] ||'').trim();
 const isSelected = activePitchCategory === cat.id;
 return (
 <button
 key={cat.id}
 type="button"
 onClick={() => setActivePitchCategory(cat.id)}
 className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-[var(--r-s)] transition-colors ${
 isSelected
 ?'bg-[var(--acc)]/30 text-[var(--acc)]/40/60'
 :'bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink-2)] hover:'
 }`}
 >
 <cat.icon className="w-3 h-3" />
 {cat.label}
 {hasContent && <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)]" />}
 </button>
 );
 })}
 </div>
 <textarea
 key={activePitchCategory}
 rows={3}
 value={formData.customPitchTemplates?.[activePitchCategory] ||''}
 onChange={e => handlePitchTemplateChange(activePitchCategory, e.target.value)}
 placeholder={`Ej: Mensaje clave que el Redactor IA debe priorizar para"${PITCH_CATEGORIES.find(c => c.id === activePitchCategory)?.label}" mientras esta campaña esté activa. Déjalo vacío para usar solo la plantilla habitual de este tipo.`}
 className="w-full bg-[var(--surface)] rounded-[var(--r-m)] px-3 py-2 text-xs text-[var(--ink)] placeholder-[var(--ink-2)] />
 <p className="text-[11px] text-[var(--ink-2)] italic mt-1">
 💡 Cada caso de uso tiene su propio mensaje. Mientras esta campaña esté activa, el Redactor IA prioriza el mensaje de la categoría del lead sobre la plantilla habitual; las categorías sin mensaje definido siguen usando solo la plantilla habitual.
 </p>
 </div>

 {/* Action buttons */}
 <div className="flex justify-end gap-2 pt-3">
 <button
 type="button"
 onClick={() => setIsEditing(false)}
 className="px-4 py-2 rounded-[var(--r-m)] text-xs font-sans font-bold text-[var(--ink-2)] hover:text-[var(--ink)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70"
 >
 Cancelar
 </button>
 <button
 type="button"
 onClick={handleSave}
 className="px-4 py-2 rounded-[var(--r-m)] text-xs font-sans font-bold bg-[var(--acc)] hover:bg-[var(--tentative)] text-[var(--ink)] active:scale-95 flex items-center gap-2"
 >
 <Check className="w-4 h-4" />
 Guardar Campaña
 </button>
 </div>
 </div>
 ) : (
 /* Campaigns List & Switcher */
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <span className="text-xs font-sans font-bold tracking-wider text-[var(--ink-2)]">
 Campañas Registradas
 </span>
 </div>
 <button
 onClick={handleStartCreate}
 className="px-3 py-1.5 bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--tentative)]/80 rounded-[var(--r-m)] text-xs font-sans font-bold flex items-center gap-1.5 transition-all active:scale-95"
 >
 <Plus className="w-3.5 h-3.5" /> + Nueva Campaña
 </button>
 </div>

 {/* General Mode Button (No active filter) */}
 <div
 onClick={() => onSetActiveCampaign(null)}
 className={`p-3.5 rounded-[var(--r-m)] transition-all cursor-pointer flex items-center justify-between ${
 !activeCampaign
 ?'bg-[var(--surface)]/80 ring-1 ring-amber-400/30'
 :'bg-[var(--surface)] hover: text-[var(--ink-2)] hover:text-[var(--ink-2)]'
 }`}
 >
 <div className="flex items-center gap-3">
 <div className={`w-8 h-8 rounded-[var(--r-s)] flex items-center justify-center ${
 !activeCampaign ?'bg-[var(--acc)]/60/20 text-[var(--acc)]/70' :'bg-[var(--surface)]/80 text-[var(--ink-2)]'
 }`}>
 <Compass className="w-4 h-4" />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <span className="text-xs font-bold text-[var(--ink)]">
 Modo General (Sin Filtro de Campaña)
 </span>
 {!activeCampaign && (
 <span className="text-[9px] font-sans font-extrabold px-1.5 py-0.5 rounded bg-[var(--acc)]/60/20 text-[var(--acc)]/70">
 ACTIVO
 </span>
 )}
 </div>
 <p className="text-[11px] text-[var(--ink-2)]">
 Muestra todas las salas, bandas y conciertos sin filtrar por una campaña específica.
 </p>
 </div>
 </div>
 {!activeCampaign ? (
 <Check className="w-5 h-5 text-[var(--acc)]" />
 ) : (
 <span className="text-[10px] font-sans text-[var(--ink-2)] hover:text-[var(--ink-2)]">
 Seleccionar
 </span>
 )}
 </div>

 {/* List of custom campaigns */}
 <div className="space-y-3">
 {campaigns.map(camp => {
 const isActive = activeCampaign?.id === camp.id;
 const themeColor = camp.color ||'var(--acc)';
 return (
 <div
 key={camp.id}
 className={`p-4 rounded-[var(--r-m)] transition-all relative overflow-hidden ${
 isActive
 ?'bg-[var(--surface)]/60 ring-1 ring-purple-500/30'
 :'bg-[var(--surface)] hover:'
 }`}
 >
 {/* Left accent stripe */}
 <div 
 className="absolute top-0 left-0 bottom-0 w-1.5"
 style={{ backgroundColor: themeColor }}
 />

 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 ml-2">
 <div className="space-y-1.5 flex-1">
 <div className="flex items-center gap-2 flex-wrap">
 <span 
 className="w-2.5 h-2.5 rounded-full shrink-0" 
 style={{ backgroundColor: themeColor }}
 />
 <h3 className="text-sm font-bold font-display text-[var(--ink)]">
 {camp.name}
 </h3>
 {isActive ? (
 <span className="inline-flex items-center gap-1 text-[9px] font-sans font-extrabold px-2 py-0.5 rounded-full bg-[var(--tentative)]/20 text-[var(--tentative)]/80">
 <Flame className="w-2.5 h-2.5 text-[var(--acc)]" />
 MODO ACTIVO EN LA WEB
 </span>
 ) : (
 <button
 type="button"
 onClick={() => onSetActiveCampaign(camp)}
 className="text-[10px] font-sans font-bold text-[var(--acc)] hover:text-[var(--tentative)]/80 underline cursor-pointer"
 >
 Activar Modo Campaña
 </button>
 )}
 </div>

 <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--ink-2)] pt-0.5">
 <span className="flex items-center gap-1 text-[var(--ink-3)]">
 <MapPin className="w-3.5 h-3.5 text-[var(--ink-2)]" />
 {camp.targetCities?.join(',') ||'Cualquier ciudad'}
 </span>
 <span className="flex items-center gap-1 text-[var(--acc)]/70">
 <Users className="w-3.5 h-3.5 text-[var(--acc)]" />
 {camp.minCapacity} - {camp.maxCapacity} pax
 </span>
 <span className="flex items-center gap-1 text-[var(--alert)]/60">
 <Calendar className="w-3.5 h-3.5 text-[var(--alert)]" />
 {camp.targetDates?.length || 0} fechas ({camp.targetDatesText ||'Sin definir'})
 </span>
 {Object.values(camp.customPitchTemplates || {}).some(v => (v ||'').trim()) && (
 <span className="flex items-center gap-1 text-[var(--tentative)]/80">
 <Sparkles className="w-3.5 h-3.5 text-[var(--acc)]" />
 {Object.values(camp.customPitchTemplates || {}).filter(v => (v ||'').trim()).length} plantilla(s) propia(s)
 </span>
 )}
 </div>

 {camp.notes && (
 <p className="text-[11px] text-[var(--ink-2)] italic font-sans pt-1">
 &ldquo;{camp.notes}&rdquo;
 </p>
 )}
 </div>

 {/* Actions */}
 <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
 {isActive ? (
 <div className="flex items-center gap-2">
 {onNavigate && (
 <button
 type="button"
 onClick={() => {
 onClose();
 onNavigate('calendario', { selectedDate: camp.targetDates?.[0] });
 }}
 className="px-2.5 py-1.5 rounded-[var(--r-s)] text-[10px] font-sans font-bold bg-[var(--tentative)]/20 text-[var(--tentative)]/80 hover:bg-[var(--tentative)]/30 flex items-center gap-1"
 >
 <Calendar className="w-3 h-3" /> Ver en Calendario
 </button>
 )}
 <button
 type="button"
 onClick={() => onSetActiveCampaign(null)}
 className="px-2.5 py-1.5 rounded-[var(--r-s)] text-[10px] font-sans font-bold bg-[var(--surface)]/80 text-[var(--ink-2)] hover:bg-[var(--surface)]/70"
 >
 Desactivar
 </button>
 </div>
 ) : (
 <button
 type="button"
 onClick={() => onSetActiveCampaign(camp)}
 className="px-3 py-1.5 rounded-[var(--r-s)] text-xs font-sans font-bold bg-[var(--acc)] hover:bg-[var(--tentative)] text-[var(--ink)] flex items-center gap-1.5 transition-all active:scale-95"
 >
 <Target className="w-3.5 h-3.5" /> Activar
 </button>
 )}

 <button
 type="button"
 onClick={() => handleStartEdit(camp)}
 className="p-1.5 text-[var(--ink-2)] hover:text-[var(--ink)] rounded-[var(--r-s)] hover:bg-[var(--surface)]/80 transition-colors"
 title="Editar campaña"
 >
 <Edit3 className="w-4 h-4" />
 </button>

 <button
 type="button"
 onClick={() => {
 if (window.confirm(`¿Eliminar la campaña"${camp.name}"?`)) {
 onDeleteCampaign(camp.id);
 }
 }}
 className="p-1.5 text-[var(--ink-2)] hover:text-[var(--alert)] rounded-[var(--r-s)] hover:bg-[var(--surface)]/80 transition-colors"
 title="Eliminar campaña"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 )}
 </div>

 {/* Footer */}
 <div className="p-4 bg-[var(--surface)] flex justify-between items-center text-xs text-[var(--ink-2)]">
 <div className="flex items-center gap-2">
 <ShieldCheck className="w-4 h-4 text-[var(--ok)]" />
 <span>Persistencia en Supabase PostgreSQL</span>
 </div>
 <button
 onClick={onClose}
 className="px-4 py-1.5 rounded-[var(--r-m)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink)] font-sans font-bold text-xs"
 >
 Cerrar
 </button>
 </div>

 </div>
 </div>
 );
}
export default CampaignManagerModal;
