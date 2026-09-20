import React, { useState } from'react';
import { X, Upload, Sparkles, Link as LinkIcon, Trash2, Camera, Loader2, Check } from'lucide-react';
import { Lead } from'../../types';
import { apiFetch } from'../../utils/api';
import { uploadFileToServer } from'../../utils/audioStorage';
import { LeadAvatar } from'./LeadAvatar';
import { ModalPortal } from'../common/ModalPortal';

interface ChangeLeadImageModalProps {
 lead: Lead | null;
 isOpen: boolean;
 onClose: () => void;
 onUpdateLead: (id: string, updates: Partial<Lead>) => void;
 onLeadLogoUpload?: (file: File) => Promise<string | null> | void;
}

export const ChangeLeadImageModal: React.FC<ChangeLeadImageModalProps> = ({
 lead,
 isOpen,
 onClose,
 onUpdateLead,
 onLeadLogoUpload
}) => {
 const [isUploading, setIsUploading] = useState(false);
 const [isSearching, setIsSearching] = useState(false);
 const [customUrl, setCustomUrl] = useState('');
 const [showUrlInput, setShowUrlInput] = useState(false);
 const [statusMsg, setStatusMsg] = useState<{ type:'success' |'error'; text: string } | null>(null);

 if (!isOpen || !lead) return null;

 const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 if (!e.target.files || !e.target.files[0]) return;
 const file = e.target.files[0];
 setIsUploading(true);
 setStatusMsg(null);

 try {
 let uploadedUrl: string | null = null;
 if (onLeadLogoUpload) {
 uploadedUrl = (await onLeadLogoUpload(file)) || null;
 }
 if (!uploadedUrl) {
 uploadedUrl = await uploadFileToServer(file, { category:'leads' });
 }

 if (uploadedUrl) {
 onUpdateLead(lead.id, { imagen_url: uploadedUrl });
 setStatusMsg({ type:'success', text:'¡Imagen subida con éxito!' });
 setTimeout(() => {
 onClose();
 }, 600);
 } else {
 setStatusMsg({ type:'error', text:'Error al subir la imagen' });
 }
 } catch (err) {
 console.error('Error subiendo imagen:', err);
 setStatusMsg({ type:'error', text:'Fallo al procesar el archivo' });
 } finally {
 setIsUploading(false);
 }
 };

 const handleAutoSearchLogo = async () => {
 setIsSearching(true);
 setStatusMsg(null);

 try {
 const res = await apiFetch('/api/leads/ai-lookup', {
 method:'POST',
 headers: {'Content-Type':'application/json'
 },
 body: JSON.stringify({
 nombre_sala: lead.nombre_sala || (lead as any).nombre || (lead as any).nombreSala || (lead as any).name ||'',
 ciudad: lead.ciudad,
 leadId: lead.id
 })
 });

 if (res.success && res.data) {
 const newImg = res.data.imagen_url ||'';
 const newIcon = res.data.icono || lead.icono;
 const newWebsite = res.data.website || lead.website;
 
 onUpdateLead(lead.id, {
 imagen_url: newImg,
 icono: newIcon,
 website: newWebsite
 });

 if (newImg) {
 setStatusMsg({ type:'success', text:'¡Logo encontrado e instalado!' });
 } else {
 setStatusMsg({ type:'error', text:'No se encontró una imagen oficial pública' });
 }

 setTimeout(() => {
 onClose();
 }, 800);
 } else {
 setStatusMsg({ type:'error', text:'No se obtuvo respuesta de la búsqueda' });
 }
 } catch (err) {
 console.error('Error buscando logo con IA:', err);
 setStatusMsg({ type:'error', text:'Error en la búsqueda con IA' });
 } finally {
 setIsSearching(false);
 }
 };

 const handleSaveCustomUrl = () => {
 if (!customUrl.trim()) return;
 onUpdateLead(lead.id, { imagen_url: customUrl.trim() });
 setStatusMsg({ type:'success', text:'URL guardada' });
 setTimeout(() => {
 onClose();
 }, 500);
 };

 const handleRemoveImage = () => {
 onUpdateLead(lead.id, { imagen_url:'' });
 setStatusMsg({ type:'success', text:'Imagen eliminada' });
 setTimeout(() => {
 onClose();
 }, 500);
 };

 return (
 <ModalPortal isOpen={isOpen} onClose={onClose}>
 <div 
 className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto overscroll-contain"
 onClick={(e) => {
 e.stopPropagation();
 onClose();
 }}
 >
 <div 
 className="bg-[var(--surface)] border-[var(--hair)]800 rounded-[var(--r-l)] w-full max-w-md p-5 shadow-2xl relative text-[var(--ink)] flex flex-col gap-4 animate-scaleUp my-auto max-h-[90vh] overflow-y-auto"
 onClick={(e) => e.stopPropagation()}
 >
 {/* Header */}
 <div className="flex items-center justify-between border-b border-[var(--hair)]800 pb-3">
 <div className="flex items-center gap-2.5 min-w-0">
 <div className="p-2 bg-[var(--acc)]/10 rounded-[var(--r-m)] shrink-0">
 <Camera className="w-5 h-5 text-[var(--acc)]" />
 </div>
 <div className="min-w-0">
 <h3 className="font-display font-bold text-base text-[var(--ink)] truncate">
 Cambiar Imagen / Logo
 </h3>
 <p className="text-xs text-[var(--ink-2)] font-sans truncate">
 {lead.nombre_sala} {lead.ciudad ? `(${lead.ciudad})` :''}
 </p>
 </div>
 </div>
 <button
 onClick={onClose}
 className="p-1.5 hover:bg-zinc-800 rounded-[var(--r-s)] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Current Preview */}
 <div className="flex items-center justify-center py-2 bg-zinc-900/80 rounded-[var(--r-m)]">
 <LeadAvatar lead={lead} size="lg" showCameraHover={false} />
 </div>

 {statusMsg && (
 <div className={`px-3 py-2 rounded-[var(--r-m)] text-xs font-semibold text-center flex items-center justify-center gap-1.5 ${
 statusMsg.type ==='success' 
 ?'bg-[var(--ok-soft)] border-emerald-800 text-[var(--ink-2)]' 
 :'bg-[var(--alert-soft)] border-rose-800 text-[var(--ink-2)]'
 }`}>
 {statusMsg.type ==='success' && <Check className="w-4 h-4" />}
 <span>{statusMsg.text}</span>
 </div>
 )}

 {/* Options Stack */}
 <div className="flex flex-col gap-2.5">
 {/* Option 1: File Upload */}
 <label className="w-full p-3 bg-zinc-900 hover:bg-zinc-800 hover:/50 rounded-[var(--r-m)] flex items-center justify-between transition-all cursor-pointer group">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-zinc-800 group-hover:bg-[var(--acc)]/20 text-[var(--acc)] rounded-[var(--r-s)] transition-colors">
 {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
 </div>
 <div className="text-left">
 <span className="block font-bold text-xs text-[var(--ink)] group-hover:text-[var(--acc)]/70 transition-colors">
 {isUploading ?'Subiendo imagen...' :'Subir desde dispositivo'}
 </span>
 <span className="block text-[11px] text-[var(--ink-2)] font-sans">
 Formatos JPG, PNG, WEBP o SVG
 </span>
 </div>
 </div>
 <input
 type="file"
 accept="image/*"
 className="hidden"
 onChange={handleFileUpload}
 disabled={isUploading || isSearching}
 />
 </label>

 {/* Option 2: AI / Google Places Lookup */}
 <button
 type="button"
 onClick={handleAutoSearchLogo}
 disabled={isSearching || isUploading}
 className="w-full p-3 bg-[var(--acc)]/10 hover:bg-[var(--acc)]/20 hover:/60 rounded-[var(--r-m)] flex items-center justify-between transition-all cursor-pointer group disabled:opacity-50"
 >
 <div className="flex items-center gap-3">
 <div className="p-2 bg-[var(--acc)]/20 text-[var(--acc)]/70 rounded-[var(--r-s)]">
 {isSearching ? <Loader2 className="w-5 h-5 animate-spin text-[var(--acc)]" /> : <Sparkles className="w-5 h-5 text-[var(--acc)]" />}
 </div>
 <div className="text-left">
 <span className="block font-bold text-xs text-[var(--acc)]/70">
 {isSearching ?'Buscando logo oficial...' :'Buscar Logo con IA & Google'}
 </span>
 <span className="block text-[11px] text-[var(--acc)]/80 font-sans">
 Encuentra fotos de recintos o favicons oficiales
 </span>
 </div>
 </div>
 </button>

 {/* Option 3: Custom URL */}
 {!showUrlInput ? (
 <button
 type="button"
 onClick={() => setShowUrlInput(true)}
 className="w-full p-2.5 bg-zinc-900/60 hover:bg-zinc-800 border-[var(--hair)]800 hover:border-[var(--hair)]700 rounded-[var(--r-m)] flex items-center gap-2.5 text-xs text-[var(--ink-2)] font-medium transition-all"
 >
 <LinkIcon className="w-4 h-4 text-[var(--ink-2)]" />
 <span>Pegar URL directa de imagen</span>
 </button>
 ) : (
 <div className="p-3 bg-zinc-900 border-[var(--hair)]700 rounded-[var(--r-m)] space-y-2">
 <label className="block text-[10px] uppercase font-sans tracking-wider text-[var(--ink-2)]">
 Pegar enlace de imagen (URL)
 </label>
 <div className="flex gap-2">
 <input
 type="url"
 placeholder="https://ejemplo.com/logo.png"
 value={customUrl}
 onChange={(e) => setCustomUrl(e.target.value)}
 className="flex-1 bg-black/60 border-[var(--hair)]700 rounded-[var(--r-s)] px-2.5 py-1.5 text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--acc)]"
 />
 <button
 type="button"
 onClick={handleSaveCustomUrl}
 disabled={!customUrl.trim()}
 className="px-3 py-1.5 bg-[var(--acc)] text-[var(--acc-ink)] font-bold text-xs rounded-[var(--r-s)] hover:bg-[var(--acc)]/60 transition-colors disabled:opacity-50"
 >
 Guardar
 </button>
 </div>
 </div>
 )}

 {/* Option 4: Delete image */}
 {lead.imagen_url && (
 <button
 type="button"
 onClick={handleRemoveImage}
 className="w-full p-2 bg-[var(--alert-soft)] hover:bg-[var(--alert-soft)] hover:border-rose-800 rounded-[var(--r-m)] flex items-center justify-center gap-2 text-xs text-[var(--ink-2)] transition-all cursor-pointer mt-1"
 >
 <Trash2 className="w-4 h-4 text-rose-400" />
 <span>Eliminar imagen actual y restablecer icono</span>
 </button>
 )}
 </div>
 </div>
 </div>
 </ModalPortal>
 );
};
