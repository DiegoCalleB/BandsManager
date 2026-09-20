import React, { useState, useEffect } from'react';
import { BookingCampaign } from'../../types';
import { Target, MapPin, Users, Calendar, Plus, X, Check, Search } from'lucide-react';

interface BookingCampaignPanelProps {
 onCampaignChange: (campaign: BookingCampaign | null) => void;
}

export default function BookingCampaignPanel({ onCampaignChange }: BookingCampaignPanelProps) {
 const [activeCampaign, setActiveCampaign] = useState<BookingCampaign | null>(null);
 const [isEditing, setIsEditing] = useState(false);
 const [campaignForm, setCampaignForm] = useState<Partial<BookingCampaign>>({
 name:'Campaña Concierto Especial',
 targetCities: ['Madrid'],
 minCapacity: 300,
 maxCapacity: 500,
 targetDates: ['2026-12-04','2026-12-05','2027-04-11','2027-04-12'],
 });

 useEffect(() => {
 const saved = localStorage.getItem('bandmanager_active_campaign');
 if (saved) {
 try {
 const parsed = JSON.parse(saved);
 setActiveCampaign(parsed);
 setCampaignForm(parsed);
 onCampaignChange(parsed);
 } catch (e) {
 console.error("Error parsing campaign");
 }
 }
 }, []);

 const formatDateText = (dates: string[]) => {
 if (!dates || dates.length === 0) return'Sin fechas';
 // Format each date nicely (e.g. 4 dic) without timezone shift
 const formatted = dates.map(d => {
 if (!d) return'';
 const parts = d.split('-');
 if (parts.length === 3) {
 const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
 return date.toLocaleDateString('es-ES', { day:'numeric', month:'short' });
 }
 const date = new Date(d);
 return date.toLocaleDateString('es-ES', { day:'numeric', month:'short' });
 }).filter(Boolean);
 return formatted.join(',');
 };

 const handleSave = () => {
 const dates = campaignForm.targetDates || [];
 const newCampaign: BookingCampaign = {
 id: Date.now().toString(),
 name: campaignForm.name ||'Nueva Campaña',
 targetCities: campaignForm.targetCities || [],
 minCapacity: campaignForm.minCapacity || 0,
 maxCapacity: campaignForm.maxCapacity || 0,
 targetDates: dates,
 targetDatesText: formatDateText(dates),
 campaignStartDate: campaignForm.campaignStartDate,
 campaignEndDate: campaignForm.campaignEndDate,
 isActive: true
 };

 setActiveCampaign(newCampaign);
 localStorage.setItem('bandmanager_active_campaign', JSON.stringify(newCampaign));
 onCampaignChange(newCampaign);
 setIsEditing(false);
 };

 const handleClear = () => {
 setActiveCampaign(null);
 localStorage.removeItem('bandmanager_active_campaign');
 onCampaignChange(null);
 };

 if (!activeCampaign && !isEditing) {
 return (
 <div className="mb-6 p-6 border-dashed rounded-[var(--r-m)] bg-[var(--sunken)] flex flex-col items-center justify-center gap-3 text-[var(--ink-2)]">
 <Target className="w-5 h-5 text-[var(--ink-2)]" />
 <div className="text-center">
 <p className="font-medium text-[var(--ink)]">Sin campaña de booking activa</p>
 <p className="text-xs text-[var(--ink-2)] mt-1">Define objetivos de aforo y fechas para activar el Scout IA.</p>
 </div>
 <button
 onClick={() => setIsEditing(true)}
 className="flex items-center gap-1 text-xs font-semibold text-[var(--ink)] hover:text-[var(--ink)] bg-[var(--acc)] px-3 py-2 rounded-[var(--r-s)]"
 >
 <Plus className="w-3.5 h-3.5" /> Configurar Campaña
 </button>
 </div>
 );
 }

 if (isEditing) {
 return (
 <div className="mb-6 p-5 border-[var(--hair)] rounded-[var(--r-m)] bg-[var(--surface)] shadow-sm">
 <div className="flex justify-between items-center mb-4">
 <h3 className="font-semibold text-lg flex items-center gap-2">
 <Target className="w-5 h-5" /> Configurar Campaña
 </h3>
 <button onClick={() => setIsEditing(false)} className="text-[var(--ink-2)] hover:text-[var(--ink-2)]">
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
 <div>
 <label className="block text-xs text-[var(--ink-2)] font-medium mb-1 uppercase tracking-wider">Nombre</label>
 <input 
 type="text" 
 value={campaignForm.name} 
 onChange={e => setCampaignForm({...campaignForm, name: e.target.value})}
 className="w-full text-sm rounded-[var(--r-s)] focus:ring-black focus:border-[var(--hair)]"
 />
 </div>
 <div>
 <label className="block text-xs text-[var(--ink-2)] font-medium mb-1 uppercase tracking-wider">Ciudad/Región</label>
 <input 
 type="text" 
 value={campaignForm.targetCities?.join(',')} 
 onChange={e => setCampaignForm({...campaignForm, targetCities: e.target.value.split(',').map(s => s.trim())})}
 className="w-full text-sm rounded-[var(--r-s)] focus:ring-black focus:border-[var(--hair)]"
 placeholder="Ej: Madrid, Barcelona"
 />
 </div>
 <div>
 <label className="block text-xs text-[var(--ink-2)] font-medium mb-1 uppercase tracking-wider">Aforo Objetivo</label>
 <div className="flex items-center gap-2">
 <input 
 type="number" 
 value={campaignForm.minCapacity} 
 onChange={e => setCampaignForm({...campaignForm, minCapacity: parseInt(e.target.value) || 0})}
 className="w-full text-sm rounded-[var(--r-s)] focus:ring-black focus:border-[var(--hair)]"
 />
 <span className="text-[var(--ink-2)]">-</span>
 <input 
 type="number" 
 value={campaignForm.maxCapacity} 
 onChange={e => setCampaignForm({...campaignForm, maxCapacity: parseInt(e.target.value) || 0})}
 className="w-full text-sm rounded-[var(--r-s)] focus:ring-black focus:border-[var(--hair)]"
 />
 </div>
 </div>
 
 <div className="md:col-span-2 lg:col-span-3">
 <label className="block text-xs text-[var(--ink-2)] font-medium mb-2 uppercase tracking-wider">Fechas Clave del Concierto</label>
 <div className="flex gap-2 flex-wrap items-center">
 {campaignForm.targetDates?.map((date, idx) => (
 <div key={idx} className="flex items-center gap-1.5 hover:bg-[var(--surface)] hover:bg-[var(--surface)]/80 px-2.5 py-1.5 rounded-[var(--r-s)] transition-colors">
 <Calendar className="w-3.5 h-3.5 text-[var(--ink-2)] shrink-0" />
 <input
 type="date"
 value={date}
 onChange={(e) => {
 if (!e.target.value) return;
 const newDates = [...(campaignForm.targetDates || [])];
 newDates[idx] = e.target.value;
 newDates.sort();
 setCampaignForm({ ...campaignForm, targetDates: newDates });
 }}
 className="text-xs font-semibold text-[var(--ink)] bg-transparent border-0 p-0 focus:ring-0 cursor-pointer"
 title="Haz clic para modificar esta fecha"
 />
 <button 
 type="button"
 onClick={() => {
 const newDates = [...(campaignForm.targetDates || [])];
 newDates.splice(idx, 1);
 setCampaignForm({...campaignForm, targetDates: newDates});
 }} 
 className="text-[var(--ink-2)] hover:text-[var(--alert)] p-0.5 rounded transition-colors ml-0.5"
 title="Eliminar esta fecha"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 </div>
 ))}
 <div className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100/80 text-blue-700 px-3 py-1.5 rounded-[var(--r-s)] border-[var(--acc)] border-dashed transition-colors">
 <Plus className="w-3.5 h-3.5 shrink-0" />
 <span className="text-xs font-semibold shrink-0">Añadir Fecha:</span>
 <input 
 type="date" 
 onChange={e => {
 if (e.target.value && !campaignForm.targetDates?.includes(e.target.value)) {
 const newDates = [...(campaignForm.targetDates || []), e.target.value];
 newDates.sort();
 setCampaignForm({...campaignForm, targetDates: newDates});
 }
 e.target.value =''; // reset after selection
 }}
 className="text-xs font-semibold text-blue-900 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer"
 title="Seleccionar nueva fecha para añadir"
 />
 </div>
 </div>
 <p className="text-xs text-[var(--ink-2)] mt-2">
 Puedes hacer clic en cualquier fecha para editarla en el calendario o añadir nuevas fechas. Los agentes mencionarán automáticamente estas fechas ({formatDateText(campaignForm.targetDates || [])}) en las propuestas.
 </p>
 </div>

 <div className="md:col-span-2 lg:col-span-3">
 <label className="block text-xs text-[var(--ink-2)] font-medium mb-2 uppercase tracking-wider">🎪 Rango de Fechas para Filtrar Festivales/Eventos</label>
 <p className="text-xs text-[var(--ink-2)] mb-2">Define el rango de fechas para mostrar solo los festivales y fiestas que coincidan con esta campaña.</p>
 <div className="grid grid-cols-2 gap-2">
 <div>
 <label className="block text-xs text-[var(--ink-2)] mb-1">Desde</label>
 <input
 type="date"
 value={campaignForm.campaignStartDate ||''}
 onChange={e => setCampaignForm({...campaignForm, campaignStartDate: e.target.value})}
 className="w-full text-sm rounded-[var(--r-s)] focus:ring-amber-500 focus:"
 />
 </div>
 <div>
 <label className="block text-xs text-[var(--ink-2)] mb-1">Hasta</label>
 <input
 type="date"
 value={campaignForm.campaignEndDate ||''}
 onChange={e => setCampaignForm({...campaignForm, campaignEndDate: e.target.value})}
 className="w-full text-sm rounded-[var(--r-s)] focus:ring-amber-500 focus:"
 />
 </div>
 </div>
 </div>
 </div>

 <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-[var(--hair)]">
 <button 
 onClick={() => setIsEditing(false)}
 className="px-4 py-2 text-sm text-[var(--ink-2)] hover:hover:bg-[var(--surface)] rounded-[var(--r-s)] font-medium"
 >
 Cancelar
 </button>
 <button 
 onClick={handleSave}
 className="px-4 py-2 text-sm bg-[var(--sunken)] text-[var(--ink)] hover:bg-[var(--surface)]800 rounded-[var(--r-s)] font-medium flex items-center gap-2"
 >
 <Check className="w-4 h-4" /> Guardar y Activar
 </button>
 </div>
 </div>
 );
 }

 return (
 <div className="mb-6 bg-[var(--sunken)] text-[var(--ink)] rounded-[var(--r-m)] overflow-hidden shadow-lg relative">
 <div className="absolute top-0 right-0 p-4">
 <button 
 onClick={handleClear}
 className="text-[var(--ink-2)] hover:text-[var(--ink)] bg-[var(--ink)]/10 rounded-full p-1"
 title="Desactivar campaña"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 <div className="p-5">
 <div className="flex items-center gap-2 mb-1">
 <Target className="w-5 h-5 text-[var(--ok)]" />
 <h3 className="font-bold text-lg">Campaña Activa: {activeCampaign?.name}</h3>
 </div>
 <p className="text-[var(--ink-2)] text-sm mb-4">El Scout IA y el generador de propuestas están configurados para estos objetivos.</p>
 
 <div className="flex flex-wrap gap-4">
 <div className="flex items-center gap-2 bg-[var(--ink)]/10 px-3 py-1.5 rounded-[var(--r-s)] text-sm">
 <MapPin className="w-4 h-4 text-[var(--acc)]/80" />
 <span>{activeCampaign?.targetCities.join(',')}</span>
 </div>
 <div className="flex items-center gap-2 bg-[var(--ink)]/10 px-3 py-1.5 rounded-[var(--r-s)] text-sm">
 <Users className="w-4 h-4 text-[var(--acc)]/80" />
 <span>{activeCampaign?.minCapacity} - {activeCampaign?.maxCapacity} pax</span>
 </div>
 <div className="flex items-center gap-2 bg-[var(--ink)]/10 px-3 py-1.5 rounded-[var(--r-s)] text-sm">
 <Calendar className="w-4 h-4 text-pink-300" />
 <span>{activeCampaign?.targetDates?.length || 0} fechas ({activeCampaign?.targetDatesText})</span>
 </div>
 </div>
 </div>
 <div className="bg-[var(--ink)]/5 px-5 py-3 border-t border-[var(--hair)] flex justify-between items-center">
 <div className="text-xs text-[var(--ink-2)]">
 * Los pitches generados por la IA mencionarán automáticamente estas fechas y el formato de Co-booking.
 </div>
 <button 
 onClick={() => {
 if (activeCampaign) {
 setCampaignForm({
 name: activeCampaign.name,
 targetCities: [...(activeCampaign.targetCities || [])],
 minCapacity: activeCampaign.minCapacity,
 maxCapacity: activeCampaign.maxCapacity,
 targetDates: [...(activeCampaign.targetDates || [])],
 targetDatesText: activeCampaign.targetDatesText,
 campaignStartDate: activeCampaign.campaignStartDate,
 campaignEndDate: activeCampaign.campaignEndDate,
 notes: activeCampaign.notes
 });
 }
 setIsEditing(true);
 }}
 className="text-xs font-medium text-[var(--ink)] hover:text-[var(--ink-2)] underline cursor-pointer"
 >
 Editar parámetros
 </button>
 </div>
 </div>
 );
}
