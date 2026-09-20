import React from 'react';
import {
 ImageIcon,
 FileDown,
 FileText,
 Upload,
 Download,
 Trash2,
 Loader2
} from 'lucide-react';
import { EPKConfig } from '../../types';
import { EPKBlockWrapper } from './EPKBlockWrapper';
import { EPK_BLOCKS, EPKBlockMeta } from './epkBlocks';

interface EPKArchivosBlockProps {
 config: EPKConfig;
 setConfig: React.Dispatch<React.SetStateAction<EPKConfig>>;
 isBakandeya?: boolean;
 isUploadingLogo: boolean;
 handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
 subiendoGaleria: boolean;
 subirFotosGaleria: (files: FileList) => void;
 quitarFotoGaleria: (url: string) => void;
 isUploadingDossier: boolean;
 handleDossierUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
 isUploadingRider: boolean;
 handleRiderUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
 prevBlock?: EPKBlockMeta | null;
 nextBlock?: EPKBlockMeta | null;
 onNavigate?: (blockId: any) => void;
 onSave?: () => void;
 isAllView?: boolean;
}

export const EPKArchivosBlock: React.FC<EPKArchivosBlockProps> = ({
 config,
 setConfig,
 isBakandeya = false,
 isUploadingLogo,
 handleLogoUpload,
 subiendoGaleria,
 subirFotosGaleria,
 quitarFotoGaleria,
 isUploadingDossier,
 handleDossierUpload,
 isUploadingRider,
 handleRiderUpload,
 prevBlock,
 nextBlock,
 onNavigate,
 onSave,
 isAllView = false
}) => {
 return (
 <EPKBlockWrapper
 meta={EPK_BLOCKS[1]}
 prevBlock={prevBlock}
 nextBlock={nextBlock}
 onNavigate={onNavigate}
 onSave={onSave}
 isAllView={isAllView}
 >
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* LOGO DE LA BANDA */}
 <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-5 sm:p-6 space-y-4">
 <h3 className="text-base sm:text-lg font-bold text-[var(--acc)] flex items-center gap-2 pb-3">
 <ImageIcon className="w-5 h-5" /> Logo Oficial de la Banda
 </h3>

 <div className="flex flex-col sm:flex-row items-center gap-4">
 <div className="relative shrink-0">
 {config.logoUrl && config.logoUrl.trim() !=='' ? (
 <img
 src={config.logoUrl}
 alt="Logo de la banda"
 className="w-28 h-28 rounded-[var(--r-l)] object-contain p-1 /60 bg-[var(--surface)]"
 />
 ) : isBakandeya ? (
 <img
 src="/logo_bakandeya_bueno_sin_fondo.png"
 alt="Bakandeya Logo"
 className="w-28 h-28 rounded-[var(--r-l)] object-contain p-1 /60 bg-[var(--surface)]"
 />
 ) : (
 <div className="w-28 h-28 rounded-[var(--r-l)] bg-[var(--surface)] flex flex-col items-center justify-center text-[var(--ink-2)] p-2 text-center">
 <ImageIcon className="w-8 h-8 text-[var(--ink-2)] mb-1" />
 <span className="text-[10px] font-medium text-[var(--ink-2)]">Sin Logo</span>
 </div>
 )}
 </div>

 <div className="space-y-3 flex-1 w-full">
 <div className="flex items-center gap-2">
 <label className="flex-1 cursor-pointer bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--ink)] font-bold px-4 py-2.5 rounded-[var(--r-m)] text-xs flex items-center justify-center gap-2 transition">
 {isUploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
 <span>{isUploadingLogo ?'Subiendo Logo...' :'Subir Logo (PNG/JPG)'}</span>
 <input
 type="file"
 accept="image/*"
 onChange={handleLogoUpload}
 className="hidden"
 disabled={isUploadingLogo}
 />
 </label>

 {config.logoUrl && (
 <button
 type="button"
 onClick={() => setConfig({ ...config, logoUrl:'' })}
 className="p-2.5 bg-[var(--surface)] hover:bg-[var(--alert)]/20 text-[var(--ink-2)] hover:text-[var(--alert)] rounded-[var(--r-m)] transition cursor-pointer"
 title="Eliminar logo"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 )}
 </div>

 <div className="space-y-1">
 <label className="text-[11px] font-semibold text-[var(--ink-2)]">O introduce URL de la imagen:</label>
 <input
 type="text"
 value={config.logoUrl ||''}
 onChange={e => setConfig({ ...config, logoUrl: e.target.value })}
 placeholder="https://ejemplo.com/logo.jpg"
 className="w-full bg-[var(--surface)] focus: rounded-[var(--r-m)] px-3 py-1.5 text-xs font-sans text-[var(--ink)] outline-none"
 />
 </div>
 </div>
 </div>
 </div>

 {/* DOSSIER EN PDF O DOCUMENTO OFICIAL */}
 <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-5 sm:p-6 space-y-4">
 <h3 className="text-base sm:text-lg font-bold text-[var(--acc)] flex items-center gap-2 pb-3">
 <FileDown className="w-5 h-5" /> Dossier en PDF o Documento Oficial
 </h3>

 {config.dossierPdfUrl ? (
 <div className="p-4 bg-[var(--surface)] rounded-[var(--r-m)] space-y-3">
 <div className="flex items-center justify-between gap-3">
 <div className="flex items-center gap-3 overflow-hidden">
 <div className="w-10 h-10 rounded-[var(--r-s)] bg-[var(--acc)]/20 flex items-center justify-center text-[var(--acc)] shrink-0">
 <FileText className="w-5 h-5" />
 </div>
 <div className="truncate">
 <p className="font-bold text-xs text-[var(--ink)] truncate">
 {config.dossierPdfName ||'Dossier_Oficial.pdf'}
 </p>
 <p className="text-[10px] text-[var(--acc)] font-medium">Documento adjunto almacenado</p>
 </div>
 </div>

 <button
 type="button"
 onClick={() => setConfig({ ...config, dossierPdfUrl:'', dossierPdfName:'' })}
 className="p-2 bg-[var(--surface)] hover:bg-[var(--alert)]/20 text-[var(--ink-2)] hover:text-[var(--alert)] rounded-[var(--r-s)] transition shrink-0 cursor-pointer"
 title="Eliminar dossier"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>

 <div className="flex items-center gap-2 pt-1 /80">
 <a
 href={config.dossierPdfUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="flex-1 py-1.5 px-3 bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--acc)]/70 font-bold text-xs rounded-[var(--r-s)] flex items-center justify-center gap-1.5 transition"
 >
 <Download className="w-3.5 h-3.5" /> Descargar / Abrir Dossier
 </a>

 <label className="cursor-pointer py-1.5 px-3 bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] font-semibold text-xs rounded-[var(--r-s)] flex items-center gap-1.5 transition">
 <Upload className="w-3.5 h-3.5 text-[var(--acc)]" /> Cambiar
 <input
 type="file"
 accept=".pdf,.doc,.docx,.txt"
 onChange={handleDossierUpload}
 className="hidden"
 disabled={isUploadingDossier}
 />
 </label>
 </div>
 </div>
 ) : (
 <div className="p-5 bg-[var(--surface)] rounded-[var(--r-m)] text-center space-y-3">
 <div className="w-12 h-12 rounded-full bg-[var(--surface)] flex items-center justify-center text-[var(--ink-2)] mx-auto">
 <FileDown className="w-6 h-6 text-[var(--acc)]" />
 </div>
 <div className="space-y-1">
 <p className="text-xs font-bold text-[var(--ink)]">Sube aquí el Dossier Oficial (PDF o Word)</p>
 <p className="text-[11px] text-[var(--ink-2)]">PDF, Word o TXT. Estará listo para el envío automático en correos.</p>
 </div>

 <label className="inline-flex cursor-pointer bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--ink)] font-bold px-4 py-2 rounded-[var(--r-m)] text-xs items-center gap-2 transition">
 {isUploadingDossier ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
 <span>{isUploadingDossier ?'Subiendo Documento...' :'Seleccionar PDF / Dossier'}</span>
 <input
 type="file"
 accept=".pdf,.doc,.docx,.txt"
 onChange={handleDossierUpload}
 className="hidden"
 disabled={isUploadingDossier}
 />
 </label>
 </div>
 )}

 <div className="space-y-1 pt-1">
 <label className="text-[11px] font-semibold text-[var(--ink-2)]">
 O enlace externo al Dossier (Google Drive, Dropbox, etc.):
 </label>
 <input
 type="text"
 value={config.dossierPdfUrl ||''}
 onChange={e =>
 setConfig({
 ...config,
 dossierPdfUrl: e.target.value,
 dossierPdfName: e.target.value ? config.dossierPdfName ||'Enlace Dossier' :''
 })
 }
 placeholder="https://drive.google.com/file/d/..."
 className="w-full bg-[var(--surface)] focus: rounded-[var(--r-m)] px-3 py-1.5 text-xs font-sans text-[var(--ink)] outline-none"
 />
 </div>
 </div>

 {/* RIDER TÉCNICO */}
 <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-5 sm:p-6 space-y-4 lg:col-span-2">
 <div className="flex items-center justify-between pb-3 flex-wrap gap-2">
 <h3 className="text-base sm:text-lg font-bold text-[var(--acc)] flex items-center gap-2">
 <FileDown className="w-5 h-5" /> Rider Técnico (Biblioteca Interna)
 </h3>
 <span className="text-[10px] font-bold tracking-wider text-[var(--acc)] bg-[var(--acc)]/10 px-2.5 py-1 rounded-full">
 Solo visible aquí
 </span>
 </div>
 <p className="text-xs text-[var(--ink-2)]">
 Este texto y documento no se muestra en el enlace público. Úsalo como biblioteca para guardarlo aquí y enviarlo a las salas cuando sea necesario.
 </p>

 <div className="space-y-3">
 <label className="text-xs font-bold text-[var(--ink)] block">Archivo de Rider Técnico (PDF)</label>
 {config.riderPdfUrl ? (
 <div className="p-3 bg-[var(--surface)] rounded-[var(--r-m)] space-y-3">
 <div className="flex items-start justify-between gap-4">
 <div className="flex items-center gap-3 overflow-hidden">
 <div className="w-10 h-10 rounded-[var(--r-s)] bg-[var(--acc)]/10 text-[var(--acc)] flex items-center justify-center shrink-0">
 <FileDown className="w-5 h-5" />
 </div>
 <div className="min-w-0">
 <p className="text-xs font-bold text-[var(--ink)] truncate">{config.riderPdfName ||'Archivo subido'}</p>
 <p className="text-[10px] text-[var(--ink-2)] truncate mt-0.5">PDF guardado correctamente</p>
 </div>
 </div>
 <button
 type="button"
 onClick={() => setConfig({ ...config, riderPdfUrl:'', riderPdfName:'' })}
 className="p-1.5 hover:bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--alert)] rounded-[var(--r-s)] transition shrink-0 cursor-pointer"
 title="Eliminar PDF"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 <div className="flex items-center gap-2 pt-1 /80">
 <a
 href={config.riderPdfUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="flex-1 py-1.5 px-3 bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--acc)]/70 font-bold text-xs rounded-[var(--r-s)] flex items-center justify-center gap-1.5 transition"
 >
 <Download className="w-3.5 h-3.5" /> Descargar / Abrir Rider
 </a>

 <label className="cursor-pointer py-1.5 px-3 bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] font-semibold text-xs rounded-[var(--r-s)] flex items-center gap-1.5 transition">
 <Upload className="w-3.5 h-3.5 text-[var(--acc)]" /> Cambiar
 <input
 type="file"
 accept=".pdf,.doc,.docx"
 onChange={handleRiderUpload}
 className="hidden"
 disabled={isUploadingRider}
 />
 </label>
 </div>
 </div>
 ) : (
 <div className="p-5 bg-[var(--surface)] rounded-[var(--r-m)] text-center space-y-3">
 <div className="w-12 h-12 rounded-full bg-[var(--surface)] flex items-center justify-center text-[var(--ink-2)] mx-auto">
 <FileDown className="w-6 h-6 text-[var(--acc)]" />
 </div>
 <div className="space-y-1">
 <p className="text-xs font-bold text-[var(--ink)]">Sube aquí el Rider Técnico (PDF)</p>
 </div>

 <label className="inline-flex cursor-pointer bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--ink)] font-bold px-4 py-2 rounded-[var(--r-m)] text-xs items-center gap-2 transition">
 {isUploadingRider ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
 <span>{isUploadingRider ?'Subiendo Documento...' :'Seleccionar PDF / Rider'}</span>
 <input
 type="file"
 accept=".pdf,.doc,.docx"
 onChange={handleRiderUpload}
 className="hidden"
 disabled={isUploadingRider}
 />
 </label>
 </div>
 )}

 <div className="pt-2 space-y-1">
 <label className="text-[11px] font-semibold text-[var(--ink-2)]">Rider Técnico (Texto)</label>
 <textarea
 value={config.riderTecnico ||''}
 onChange={e => setConfig({ ...config, riderTecnico: e.target.value })}
 placeholder="Canales, microfonía, DIs, etc..."
 rows={4}
 className="w-full bg-[var(--surface)] focus: rounded-[var(--r-m)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition-colors font-sans leading-relaxed resize-none"
 />
 </div>
 </div>
 </div>

 {/* GALERÍA DE IMAGEN & PRENSA */}
 <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-5 sm:p-6 space-y-4 lg:col-span-2">
 <h3 className="text-base sm:text-lg font-bold text-[var(--acc)] flex items-center gap-2 pb-3">
 <ImageIcon className="w-5 h-5" /> Galería de Imagen &amp; Prensa
 </h3>
 <p className="text-xs text-[var(--ink-2)]">
 Fotos reales de directo o sesión de prensa. Es lo primero que ve alguien que nunca os ha visto tocar.
 </p>
 <label
 className={`cursor-pointer bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--ink)] font-bold px-4 py-2.5 rounded-[var(--r-m)] text-xs inline-flex items-center justify-center gap-2 transition ${
 subiendoGaleria ?'opacity-70 pointer-events-none' :''
 }`}
 >
 {subiendoGaleria ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
 <span>{subiendoGaleria ?'Subiendo fotos...' :'+ Subir fotos (puedes elegir varias a la vez)'}</span>
 <input
 type="file"
 accept="image/*"
 multiple
 className="hidden"
 disabled={subiendoGaleria}
 onChange={e => {
 const files = e.target.files;
 if (files && files.length > 0) subirFotosGaleria(files);
 e.target.value ='';
 }}
 />
 </label>
 {(config.bandPhotos || []).length === 0 ? (
 <div className="rounded-[var(--r-m)] bg-[var(--surface)] p-4 text-xs text-[var(--ink-2)]">
 Todavía no hay fotos de directo o prensa.
 </div>
 ) : (
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
 {(config.bandPhotos || []).filter(url => Boolean(url && url.trim() !=='')).map((url, idx) => (
 <div
 key={url + idx}
 className="group relative aspect-video rounded-[var(--r-m)] overflow-hidden bg-[var(--surface)]"
 >
 <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
 <button
 type="button"
 onClick={() => quitarFotoGaleria(url)}
 className="absolute top-1.5 right-1.5 p-1.5 bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--alert)] rounded-[var(--r-s)] opacity-0 group-hover:opacity-100 transition cursor-pointer"
 title="Quitar foto"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 </EPKBlockWrapper>
 );
};
