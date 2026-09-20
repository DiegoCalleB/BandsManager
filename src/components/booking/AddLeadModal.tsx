import React, { useState } from'react';
import { X, Building2, Radio, Sparkles, Loader2, Upload, Search, Briefcase } from'lucide-react';
import { LeadType } from'../../types';
import { apiFetch } from'../../utils/api';
import { ModalPortal } from'../common/ModalPortal';

export interface NewLeadDataState {
 nombre_sala: string;
 ciudad: string;
 region: string;
 direccion?: string;
 aforo: number;
 genero: string;
 roster?: string;
 tipo?: LeadType;
 email_contacto: string;
 email_secundario?: string;
 telefono: string;
 website?: string;
 instagram: string;
 fuente: string;
 pitch_generado: string;
 notas: string;
 icono?: string;
 imagen_url?: string;
}

interface AddLeadModalProps {
 isOpen: boolean;
 sectionTab:'salas' |'medios' |'grupos';
 isStitchLight: boolean;
 textSub: string;
 newLeadData: NewLeadDataState;
 setNewLeadData: React.Dispatch<React.SetStateAction<NewLeadDataState>>;
 isModalScraping: boolean;
 modalScrapeStatus: string;
 modalScrapeError: string;
 modalScrapeSuccessMsg: string;
 isUploadingLeadLogo: boolean;
 onClose: () => void;
 onSubmit: (e: React.FormEvent) => void;
 onModalScrape: () => void;
 onLeadLogoUpload: (file: File) => Promise<string | null> | void;
}

export function AddLeadModal({
 isOpen,
 sectionTab,
 isStitchLight,
 textSub,
 newLeadData,
 setNewLeadData,
 isModalScraping,
 modalScrapeStatus,
 modalScrapeError,
 modalScrapeSuccessMsg,
 isUploadingLeadLogo,
 onClose,
 onSubmit,
 onModalScrape,
 onLeadLogoUpload
}: AddLeadModalProps) {
 const [isSearchingLogo, setIsSearchingLogo] = useState(false);

 if (!isOpen) return null;

 const handleAutoSearchLogo = async () => {
 if (!newLeadData.nombre_sala) return;
 setIsSearchingLogo(true);
 try {
 const res = await apiFetch('/api/leads/ai-lookup', {
 method:'POST',
 body: JSON.stringify({
 nombre_sala: newLeadData.nombre_sala,
 ciudad: newLeadData.ciudad
 })
 });
 if (res.success && res.data) {
 setNewLeadData(prev => ({
 ...prev,
 imagen_url: res.data.imagen_url || prev.imagen_url,
 icono: res.data.icono || prev.icono,
 website: res.data.website || prev.website,
 instagram: res.data.instagram || prev.instagram
 }));
 }
 } catch (err) {
 console.error('Error auto-searching logo in modal:', err);
 } finally {
 setIsSearchingLogo(false);
 }
 };

 return (
 <ModalPortal isOpen={isOpen} onClose={onClose}>
 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/80 backdrop-blur-sm overflow-y-auto overscroll-contain animate-fadeIn">
 <div
 className={`w-full max-w-lg p-5 rounded-[var(--r-l)] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto my-auto ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 >
 <div className="flex items-center justify-between pb-3">
 <div className="flex items-center gap-2">
 {sectionTab ==='medios' ? (
 <Radio className="w-5 h-5 text-[var(--alert)]" />
 ) : sectionTab ==='grupos' ? (
 <Briefcase className="w-5 h-5 text-[var(--acc)]" />
 ) : (
 <Building2 className="w-5 h-5 text-[var(--acc)]/80" />
 )}
 <h3
 className={`text-sm font-bold font-display uppercase tracking-widest ${
 isStitchLight ?'text-[var(--acc)]' :'text-[var(--acc)]'
 }`}
 >
 {sectionTab ==='medios'
 ?'Nuevo Medio o Prensa'
 : sectionTab ==='grupos'
 ?'Nuevo Contacto de Industria'
 :'Nueva Sala o Festival'}
 </h3>
 </div>
 <button
 onClick={onClose}
 className="text-[var(--ink-2)] hover:text-[var(--ink)] p-1 rounded-[var(--r-s)] transition-colors cursor-pointer"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <form onSubmit={onSubmit} className="space-y-3.5">
 <div>
 <div className="flex justify-between items-center mb-1">
 <label className={`block text-[10px] uppercase font-sans tracking-wider ${textSub}`}>
 {sectionTab ==='medios'
 ?'Nombre del Medio / Revista *'
 : sectionTab ==='grupos'
 ?'Nombre de la Entidad / Contacto *'
 :'Nombre de la Sala / Festival *'}
 </label>
 <button
 type="button"
 onClick={onModalScrape}
 disabled={isModalScraping || !newLeadData.nombre_sala}
 className={`px-2 py-1 text-[10px] font-sans rounded-[var(--r-s)] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
 isStitchLight
 ?'bg-[var(--acc)]/15 hover:bg-[var(--acc)]/50/15 text-[var(--acc)] disabled:opacity-50'
 :'bg-[var(--acc)]/10 hover:bg-[var(--acc)]/20 text-[var(--acc)] disabled:opacity-50'
 }`}
 title="Buscar automáticamente email, teléfono y ubicación con el Agente Scout IA"
 >
 {isModalScraping ? (
 <Loader2 className="w-3 h-3 animate-spin text-[var(--acc)]" />
 ) : (
 <Sparkles className="w-3 h-3 text-[var(--acc)]" />
 )}
 <span>{isModalScraping ?'Buscando datos...' :'✨ Autocompletar con IA Scout'}</span>
 </button>
 </div>
 <input
 type="text"
 required
 placeholder={
 sectionTab ==='medios'
 ?'Ej. Radio 3, Mondosonoro, MariskalRock'
 :'Ej. Sala El Sol, Festival Cabo de Plata'
 }
 value={newLeadData.nombre_sala}
 onChange={e => setNewLeadData(prev => ({ ...prev, nombre_sala: e.target.value }))}
 className={`w-full rounded-[var(--r-m)] px-2 py-1 text-[10px] focus:outline-none font-sans ${
 isStitchLight
 ?'bg-[var(--bg)] text-[var(--ink)] focus:ring-indigo-500'
 :'bg-[var(--surface)] text-[var(--ink)] focus:ring-[var(--acc)]'
 }`}
 />
 </div>

 {/* Logo Selector */}
 <div className="bg-[var(--bg)]/60 p-3 rounded-[var(--r-m)] border-[var(--hair)]800 space-y-2.5">
 <div className="flex items-center justify-between flex-wrap gap-2">
 <label className={`block text-[10px] uppercase font-sans tracking-wider ${textSub}`}>
 Icono o Logo del Medio / Sala
 </label>
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={handleAutoSearchLogo}
 disabled={isSearchingLogo || !newLeadData.nombre_sala}
 className="px-2.5 py-1 bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--acc)]/70 text-[10px] rounded-[var(--r-s)] flex items-center gap-1.5 font-bold transition-all cursor-pointer disabled:opacity-50"
 >
 <Sparkles className="w-3 h-3 text-[var(--acc)]" />
 <span>{isSearchingLogo ?'Buscando...' :'🔍 Buscar Logo'}</span>
 </button>
 <label className="cursor-pointer px-2.5 py-1 bg-[var(--sunken)] hover:bg-zinc-700 text-[var(--ink)] text-[10px] rounded-[var(--r-s)] flex items-center gap-1.5 font-bold transition-all border-[var(--hair)]700">
 <Upload className="w-3 h-3 text-[var(--acc)]" />
 <span>{isUploadingLeadLogo ?'Subiendo...' :'Subir Logo'}</span>
 <input
 type="file"
 accept="image/*"
 className="hidden"
 onChange={async e => {
 if (e.target.files && e.target.files[0]) {
 const file = e.target.files[0];
 const uploadedUrl = await onLeadLogoUpload(file);
 if (uploadedUrl) {
 setNewLeadData(prev => ({ ...prev, imagen_url: uploadedUrl }));
 }
 }
 }}
 disabled={isUploadingLeadLogo}
 />
 </label>
 </div>
 </div>

 {newLeadData.imagen_url ? (
 <div className="flex items-center gap-3 p-2 bg-zinc-950 rounded-[var(--r-s)] border-[var(--hair)]800">
 <img
 src={newLeadData.imagen_url}
 alt="Logo"
 className="w-10 h-10 rounded-[var(--r-s)] object-cover border-[var(--acc)]/50 shrink-0"
 />
 <div className="flex-1 min-w-0">
 <p className="text-[10px] text-[var(--ink-2)] font-bold truncate">
 {newLeadData.imagen_url}
 </p>
 <p className="text-[9px] text-[var(--ink-2)]">Logo oficial guardado</p>
 </div>
 <button
 type="button"
 onClick={() => setNewLeadData(prev => ({ ...prev, imagen_url:'' }))}
 className="text-[10px] text-[var(--alert)] hover:underline px-2 py-1 cursor-pointer"
 >
 Quitar
 </button>
 </div>
 ) : (
 <div className="space-y-1.5">
 <p className="text-[9px] text-[var(--ink-2)]">Selecciona un emoji característico:</p>
 <div className="flex flex-wrap gap-1.5">
 {['📻','📰','🌐','🎙️','📺','🏛️','🎪','🪩','🎸','💼','🎆','⚡','🔥'].map(
 emoji => (
 <button
 key={emoji}
 type="button"
 onClick={() => setNewLeadData(prev => ({ ...prev, icono: emoji }))}
 className={`w-7 h-7 rounded-[var(--r-s)] text-sm flex items-center justify-center transition-all cursor-pointer ${
 newLeadData.icono === emoji
 ?'bg-[var(--acc)] text-[var(--on-acc)] font-bold scale-110 shadow-md border-[var(--acc)]'
 :'bg-[var(--sunken)]/80 text-[var(--ink-2)] hover:bg-zinc-700'
 }`}
 >
 {emoji}
 </button>
 )
 )}
 </div>
 </div>
 )}
 </div>

 {/* Progress / Status Banner */}
 {isModalScraping && (
 <div
 className={`p-2.5 rounded-[var(--r-s)] text-[10px] font-sans flex items-center gap-2 animate-pulse ${
 isStitchLight ?'bg-[var(--acc)]/15 text-[var(--acc)]' :'bg-[var(--surface)]/30 text-[var(--acc)]'
 }`}
 >
 <Loader2 className="w-4 h-4 animate-spin text-[var(--acc)]/80 shrink-0" />
 <span className="text-[10px] font-bold">{modalScrapeStatus}</span>
 </div>
 )}

 {modalScrapeError && (
 <div className="p-2.5 rounded-[var(--r-s)] text-[10px] font-sans text-[var(--alert)] bg-[var(--alert)]/15">
 ⚠️ {modalScrapeError}
 </div>
 )}

 {modalScrapeSuccessMsg && (
 <div className="p-2.5 rounded-[var(--r-s)] text-[10px] font-sans text-[var(--ok)] bg-[var(--surface)]/15">
 {modalScrapeSuccessMsg}
 </div>
 )}

 <div>
 <label className={`block text-[10px] uppercase font-sans tracking-wider mb-1 ${textSub}`}>
 Dirección Exacta (Calle, Número...)
 </label>
 <input
 type="text"
 placeholder="Ej. Calle San Vicente Ferrer 33"
 value={newLeadData.direccion ||''}
 onChange={e => setNewLeadData(prev => ({ ...prev, direccion: e.target.value }))}
 className={`w-full rounded-[var(--r-m)] px-2 py-1 text-[10px] focus:outline-none font-sans ${
 isStitchLight
 ?'bg-[var(--bg)] text-[var(--ink)] focus:ring-indigo-500'
 :'bg-[var(--surface)] text-[var(--ink)] focus:ring-[var(--acc)]'
 }`}
 />
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className={`block text-[10px] uppercase font-sans tracking-wider mb-1 ${textSub}`}>
 Ciudad
 </label>
 <input
 type="text"
 placeholder="Ej. Madrid, Barcelona"
 value={newLeadData.ciudad}
 onChange={e => setNewLeadData(prev => ({ ...prev, ciudad: e.target.value }))}
 className={`w-full rounded-[var(--r-m)] px-2 py-1 text-[10px] focus:outline-none font-sans ${
 isStitchLight
 ?'bg-[var(--bg)] text-[var(--ink)] focus:ring-indigo-500'
 :'bg-[var(--surface)] text-[var(--ink)] focus:ring-[var(--acc)]'
 }`}
 />
 </div>
 <div>
 <label className={`block text-[10px] uppercase font-sans tracking-wider mb-1 ${textSub}`}>
 Región / Alcance
 </label>
 <input
 type="text"
 placeholder="Ej. Nacional, Cataluña, Andalucía"
 value={newLeadData.region}
 onChange={e => setNewLeadData(prev => ({ ...prev, region: e.target.value }))}
 className={`w-full rounded-[var(--r-m)] px-2 py-1 text-[10px] focus:outline-none font-sans ${
 isStitchLight
 ?'bg-[var(--bg)] text-[var(--ink)] focus:ring-indigo-500'
 :'bg-[var(--surface)] text-[var(--ink)] focus:ring-[var(--acc)]'
 }`}
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className={`block text-[10px] uppercase font-sans tracking-wider mb-1 ${textSub}`}>
 Email Principal (Contratación)
 </label>
 <input
 type="email"
 placeholder="info@salanazcaconciertos.com"
 value={newLeadData.email_contacto}
 onChange={e => setNewLeadData(prev => ({ ...prev, email_contacto: e.target.value }))}
 className={`w-full rounded-[var(--r-m)] px-2 py-1 text-[10px] focus:outline-none font-sans ${
 isStitchLight
 ?'bg-[var(--bg)] text-[var(--ink)] focus:ring-indigo-500'
 :'bg-[var(--surface)] text-[var(--ink)] focus:ring-[var(--acc)]'
 }`}
 />
 </div>

 <div>
 <label className={`block text-[10px] uppercase font-sans tracking-wider mb-1 ${textSub}`}>
 Email Secundario / Promotora
 </label>
 <input
 type="email"
 placeholder="info@magnetikproducciones.com"
 value={newLeadData.email_secundario ||''}
 onChange={e => setNewLeadData(prev => ({ ...prev, email_secundario: e.target.value }))}
 className={`w-full rounded-[var(--r-m)] px-2 py-1 text-[10px] focus:outline-none font-sans ${
 isStitchLight
 ?'bg-[var(--bg)] text-[var(--ink)] focus:ring-indigo-500'
 :'bg-[var(--surface)] text-[var(--ink)] focus:ring-[var(--acc)]'
 }`}
 />
 </div>
 </div>

 <div>
 <label className={`block text-[10px] uppercase font-sans tracking-wider mb-1 ${textSub}`}>
 {sectionTab ==='medios' ?'Tipo de Medio' : sectionTab ==='grupos' ?'Tipo de Organización' :'Tipo de Espacio'}
 </label>
 {sectionTab ==='medios' ? (
 <select
 value={newLeadData.genero}
 onChange={e => setNewLeadData(prev => ({ ...prev, genero: e.target.value }))}
 className={`w-full rounded-[var(--r-m)] px-2 py-1 text-[10px] focus:outline-none font-sans ${
 isStitchLight
 ?'bg-[var(--bg)] text-[var(--ink)] focus:ring-indigo-500'
 :'bg-[var(--surface)] text-[var(--ink)] focus:ring-[var(--acc)]'
 }`}
 >
 <option value="Radio">Radio / Programa</option>
 <option value="Televisión">Televisión / Vídeo</option>
 <option value="Prensa">Prensa Escrita / Revista / Blog</option>
 <option value="Redes Sociales">Redes Sociales / Creadores</option>
 <option value="Podcasts">Podcasts / Entrevistas</option>
 </select>
 ) : (
 <select
 value={newLeadData.tipo}
 onChange={e =>
 setNewLeadData(prev => ({ ...prev, tipo: e.target.value as LeadType }))
 }
 className={`w-full rounded-[var(--r-m)] px-2 py-1 text-[10px] focus:outline-none font-sans ${
 isStitchLight
 ?'bg-[var(--bg)] text-[var(--ink)] focus:ring-indigo-500'
 :'bg-[var(--surface)] text-[var(--ink)] focus:ring-[var(--acc)]'
 }`}
 >
 <option value="sala">Sala de Conciertos</option>
 <option value="festival">Festival</option>
 <option value="ayuntamiento">Ayuntamiento / Fiestas</option>
 <option value="agencia">Agencia de Booking</option>
 <option value="manager">Mánager / Representante</option>
 <option value="productora">Productora / Promotora</option>
 <option value="sello">Sello Discográfico</option>
 <option value="grupo">Banda / Grupo Amigo</option>
 </select>
 )}
 </div>

 {(newLeadData.tipo ==='agencia' || newLeadData.tipo ==='manager' || newLeadData.tipo ==='productora' || newLeadData.tipo ==='sello' || newLeadData.tipo ==='grupo' || sectionTab ==='grupos') && (
 <div>
 <label className={`block text-[10px] uppercase font-sans tracking-wider mb-1 ${textSub}`}>
 Róster de Artistas / Bandas Representadas
 </label>
 <input
 type="text"
 placeholder="Ej. Ska-P, Boikot, Zoo, La Raíz..."
 value={newLeadData.roster ||''}
 onChange={e => setNewLeadData(prev => ({ ...prev, roster: e.target.value }))}
 className={`w-full rounded-[var(--r-m)] px-2 py-1 text-[10px] focus:outline-none font-sans ${
 isStitchLight
 ?'bg-[var(--bg)] text-[var(--ink)] focus:ring-indigo-500'
 :'bg-[var(--surface)] text-[var(--ink)] focus:ring-[var(--acc)]'
 }`}
 />
 </div>
 )}

 <div>
 <label className={`block text-[10px] uppercase font-sans tracking-wider mb-1 ${textSub}`}>
 {sectionTab ==='medios'
 ?'Nota de Prensa / Propuesta de Presentación'
 :'Propuesta de Concierto'}
 </label>
 <textarea
 rows={3}
 placeholder={
 sectionTab ==='medios'
 ?'Escribe o personaliza el texto de presentación...'
 :'Propuesta de fecha, condiciones de taquilla, etc.'
 }
 value={newLeadData.pitch_generado}
 onChange={e => setNewLeadData(prev => ({ ...prev, pitch_generado: e.target.value }))}
 className={`w-full rounded-[var(--r-m)] p-3 text-[10px] focus:outline-none font-sans ${
 isStitchLight
 ?'bg-[var(--bg)] text-[var(--ink)] focus:ring-indigo-500'
 :'bg-[var(--surface)] text-[var(--ink)] focus:ring-[var(--acc)]'
 }`}
 />
 </div>

 <div>
 <label className={`block text-[10px] uppercase font-sans tracking-wider mb-1 ${textSub}`}>
 Notas Internas
 </label>
 <input
 type="text"
 placeholder="Ej. Redactor jefe Bruno, programa nocturno, etc."
 value={newLeadData.notas}
 onChange={e => setNewLeadData(prev => ({ ...prev, notas: e.target.value }))}
 className={`w-full rounded-[var(--r-m)] px-2 py-1 text-[10px] focus:outline-none font-sans ${
 isStitchLight
 ?'bg-[var(--bg)] text-[var(--ink)] focus:ring-indigo-500'
 :'bg-[var(--surface)] text-[var(--ink)] focus:ring-[var(--acc)]'
 }`}
 />
 </div>

 <div className="flex justify-end gap-3 pt-3">
 <button
 type="button"
 onClick={onClose}
 className={`px-2 py-1 rounded-[var(--r-m)] font-sans text-[10px] uppercase tracking-wider transition-colors cursor-pointer ${
 isStitchLight
 ?'bg-[var(--sunken)] hover:bg-[var(--sunken)] text-[var(--ink-2)]'
 :'bg-[var(--surface)] hover:bg-[var(--surface)]/80 text-[var(--ink-2)]'
 }`}
 >
 Cancelar
 </button>
 <button
 type="submit"
 className={`px-4 py-2 rounded-[var(--r-m)] font-sans text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg ${
 isStitchLight
 ?'bg-[var(--acc)] hover:bg-[var(--acc)] text-[var(--ink)]'
 :'bg-[var(--acc)] hover:bg-[var(--acc-soft)] text-[var(--on-acc)]'
 }`}
 >
 {sectionTab ==='medios' ?'Guardar Medio' : sectionTab ==='grupos' ?'Guardar Contacto' :'Guardar Sala'}
 </button>
 </div>
 </form>
 </div>
 </div>
 </ModalPortal>
 );
}
