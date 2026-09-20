import React, { useRef } from'react';
import { Layers, Upload, FileText, CheckCircle2, Loader2, Trash2, Check } from'lucide-react';

interface StepRiderProps {
 riderTecnicoText: string;
 setRiderTecnicoText: (text: string) => void;
 riderPdfUrl: string;
 setRiderPdfUrl: (url: string) => void;
 riderPdfName: string;
 setRiderPdfName: (name: string) => void;
 isUploadingRider: boolean;
 onRiderUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
 canalesMesa: number;
 setCanalesMesa: (n: number) => void;
 llevaMicrofoniaPropia: boolean;
 setLlevaMicrofoniaPropia: (v: boolean) => void;
 llevaInEars: boolean;
 setLlevaInEars: (v: boolean) => void;
 necesitaBacklineBateria: boolean;
 setNecesitaBacklineBateria: (v: boolean) => void;
}

export const StepRider: React.FC<StepRiderProps> = ({
 riderTecnicoText,
 setRiderTecnicoText,
 riderPdfUrl,
 setRiderPdfUrl,
 riderPdfName,
 setRiderPdfName,
 isUploadingRider,
 onRiderUpload,
 canalesMesa,
 setCanalesMesa,
 llevaMicrofoniaPropia,
 setLlevaMicrofoniaPropia,
 llevaInEars,
 setLlevaInEars,
 necesitaBacklineBateria,
 setNecesitaBacklineBateria,
}) => {
 const fileInputRef = useRef<HTMLInputElement | null>(null);

 return (
 <div className="space-y-6 animate-in fade-in duration-200">
 <div className="flex items-center gap-2 pb-2 border-b border-[var(--hair)]">
 <Layers className="w-5 h-5 text-[var(--acc)]" />
 <h3 className="text-base font-semibold text-[var(--ink)]">Rider Técnico, Stage Plot & Requerimientos</h3>
 </div>

 <p className="text-xs text-[var(--ink-2)]">
 Facilita el trabajo de los técnicos de sonido de salas y festivales para que todo suene perfecto desde la prueba de sonido.
 </p>

 {/* Quick Specs Grid */}
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
 <div className="p-3 rounded-[var(--r-m)] bg-[var(--bg)] border-[var(--hair)] space-y-1">
 <label className="block text-[11px] font-medium text-[var(--ink-2)]">Canales de Mesa Mínimos</label>
 <input
 type="number"
 min={4}
 max={64}
 value={canalesMesa}
 onChange={(e) => setCanalesMesa(Number(e.target.value))}
 className="w-full px-2.5 py-1.5 rounded-[var(--r-s)] bg-[var(--sunken)] border-[var(--hair)] text-[var(--ink)] text-xs focus:outline-none focus:"
 />
 </div>

 <button
 type="button"
 onClick={() => setLlevaMicrofoniaPropia(!llevaMicrofoniaPropia)}
 className={`p-3 rounded-[var(--r-m)] text-left transition-all ${
 llevaMicrofoniaPropia
 ?'bg-[var(--acc)]/10 /30 text-[var(--acc)]/70'
 :'bg-[var(--bg)] border-[var(--hair)] text-[var(--ink-2)] hover:border-[var(--hair)]'
 }`}
 >
 <div className="flex items-center justify-between">
 <span className="text-xs font-semibold">Microfonía Propia</span>
 {llevaMicrofoniaPropia && <Check className="w-3.5 h-3.5 text-[var(--acc)]" />}
 </div>
 <span className="text-[10px] text-[var(--ink-2)] block mt-1">Llevamos set propio de micros</span>
 </button>

 <button
 type="button"
 onClick={() => setLlevaInEars(!llevaInEars)}
 className={`p-3 rounded-[var(--r-m)] text-left transition-all ${
 llevaInEars
 ?'bg-[var(--acc)]/10 /30 text-[var(--acc)]/70'
 :'bg-[var(--bg)] border-[var(--hair)] text-[var(--ink-2)] hover:border-[var(--hair)]'
 }`}
 >
 <div className="flex items-center justify-between">
 <span className="text-xs font-semibold">Monitoraje In-Ears</span>
 {llevaInEars && <Check className="w-3.5 h-3.5 text-[var(--acc)]" />}
 </div>
 <span className="text-[10px] text-[var(--ink-2)] block mt-1">Sistema propio de monitores</span>
 </button>

 <button
 type="button"
 onClick={() => setNecesitaBacklineBateria(!necesitaBacklineBateria)}
 className={`p-3 rounded-[var(--r-m)] text-left transition-all ${
 necesitaBacklineBateria
 ?'bg-[var(--acc)]/10 /30 text-[var(--acc)]/70'
 :'bg-[var(--bg)] border-[var(--hair)] text-[var(--ink-2)] hover:border-[var(--hair)]'
 }`}
 >
 <div className="flex items-center justify-between">
 <span className="text-xs font-semibold">Backline Sala</span>
 {necesitaBacklineBateria && <Check className="w-3.5 h-3.5 text-[var(--acc)]" />}
 </div>
 <span className="text-[10px] text-[var(--ink-2)] block mt-1">Batería básica aportada por sala</span>
 </button>
 </div>

 {/* Subida de Archivo PDF de Rider / Stage Plot */}
 <div className="pt-2 border-t border-[var(--hair)] space-y-3">
 <label className="block text-xs font-medium text-[var(--ink-2)]">
 Documento PDF de Rider Técnico / Plano de Escenario (Stage Plot)
 </label>

 <input
 type="file"
 ref={fileInputRef}
 onChange={onRiderUpload}
 accept=".pdf,image/*"
 className="hidden"
 />

 {riderPdfUrl ? (
 <div className="flex items-center justify-between p-3 rounded-[var(--r-m)] bg-emerald-500/10">
 <div className="flex items-center gap-3">
 <FileText className="w-6 h-6 text-emerald-400" />
 <div>
 <span className="text-xs font-semibold text-[var(--ink-2)] block">
 {riderPdfName ||'Rider_Tecnico_Oficial.pdf'}
 </span>
 <span className="text-[10px] text-emerald-400/80">Documento listo en el EPK interactivo</span>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => fileInputRef.current?.click()}
 className="text-xs text-[var(--ink-2)] hover:text-[var(--ink)] underline"
 >
 Cambiar
 </button>
 <button
 type="button"
 onClick={() => { setRiderPdfUrl(''); setRiderPdfName(''); }}
 className="p-1 rounded text-[var(--ink-2)] hover:text-red-400"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 ) : (
 <div
 onClick={() => fileInputRef.current?.click()}
 className="border-2 border-dashed border-[var(--hair)] hover:/40 rounded-[var(--r-m)] p-5 text-center cursor-pointer bg-[var(--bg)]/40 hover:bg-[var(--surface)]/70 transition-colors"
 >
 <Upload className="w-6 h-6 text-[var(--ink-2)] mx-auto mb-1.5" />
 <span className="text-xs font-medium text-[var(--ink-2)] block">
 Subir PDF de Rider Técnico o imagen de Stage Plot
 </span>
 <span className="text-[10px] text-[var(--ink-2)]">
 PDF, JPG o PNG hasta 20 MB
 </span>
 {isUploadingRider && (
 <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-[var(--acc)]">
 <Loader2 className="w-3.5 h-3.5 animate-spin" /> Subiendo rider...
 </div>
 )}
 </div>
 )}
 </div>

 {/* Notas técnicas en texto */}
 <div className="pt-2 border-t border-[var(--hair)]">
 <label className="block text-xs font-medium text-[var(--ink-2)] mb-1.5">
 Notas de Escenario & Requerimientos Adicionales (Texto)
 </label>
 <textarea
 rows={3}
 value={riderTecnicoText}
 onChange={(e) => setRiderTecnicoText(e.target.value)}
 placeholder="Ej. Requerimos 4 tomas de corriente en escenario (220V), 3 envíos independientes de monitores, tarima para batería de al menos 2x2m..."
 className="w-full px-3 py-2 rounded-[var(--r-m)] bg-[var(--bg)] border-[var(--hair)] text-[var(--ink)] placeholder-[var(--ink-2)] text-xs focus:outline-none focus: leading-relaxed"
 />
 </div>
 </div>
 );
};
