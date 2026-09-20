import React from'react';
import { FileText, Sparkles, Clock, Users } from'lucide-react';

interface StepBioProps {
 slogan: string;
 setSlogan: (slogan: string) => void;
 bio: string;
 setBio: (bio: string) => void;
 formato: string;
 setFormato: (formato: string) => void;
 numMusicos: number;
 setNumMusicos: (n: number) => void;
 duracionDirecto: string;
 setDuracionDirecto: (dur: string) => void;
 onGenerateBioAI: () => void;
}

export const StepBio: React.FC<StepBioProps> = ({
 slogan,
 setSlogan,
 bio,
 setBio,
 formato,
 setFormato,
 numMusicos,
 setNumMusicos,
 duracionDirecto,
 setDuracionDirecto,
 onGenerateBioAI,
}) => {
 return (
 <div className="space-y-6 animate-in fade-in duration-200">
 <div className="flex items-center gap-2 pb-2 border-b border-[var(--hair)]">
 <FileText className="w-5 h-5 text-[var(--acc)]" />
 <h3 className="text-base font-semibold text-[var(--ink)]">Biografía, Slogan & Formato Directo</h3>
 </div>

 {/* Slogan */}
 <div>
 <label className="block text-xs font-medium text-[var(--ink-2)] mb-1.5">
 Slogan / Frase de Impacto
 </label>
 <input
 type="text"
 value={slogan}
 onChange={(e) => setSlogan(e.target.value)}
 placeholder="Ej. Guitarras afiladas y melodías directas al corazón"
 className="w-full px-4 py-2.5 rounded-[var(--r-m)] bg-[var(--bg)] border-[var(--hair)] text-[var(--ink)] placeholder-zinc-500 focus:outline-none focus: text-sm"
 />
 <p className="text-[11px] text-[var(--ink-3)] mt-1">
 Aparece en la cabecera del Dossier de Prensa interactivo (EPK) y en el QR de fans.
 </p>
 </div>

 {/* Biografía con Asistente */}
 <div>
 <div className="flex items-center justify-between mb-1.5">
 <label className="text-xs font-medium text-[var(--ink-2)]">
 Biografía / Resumen de Prensa
 </label>
 <button
 type="button"
 onClick={onGenerateBioAI}
 className="inline-flex items-center gap-1.5 text-xs text-[var(--acc)] hover:text-[var(--acc)]/70 font-medium px-2 py-1 rounded-[var(--r-s)] bg-[var(--acc)]/10 hover:bg-[var(--acc)]/20 transition-colors"
 >
 <Sparkles className="w-3.5 h-3.5" />
 Redactar con IA / Sugerencia
 </button>
 </div>
 <textarea
 rows={5}
 value={bio}
 onChange={(e) => setBio(e.target.value)}
 placeholder="Cuenta la trayectoria de la banda, influencias, lanzamientos destacados y lo que transmitís en vuestros conciertos..."
 className="w-full px-4 py-3 rounded-[var(--r-m)] bg-[var(--bg)] border-[var(--hair)] text-[var(--ink)] placeholder-zinc-500 focus:outline-none focus: text-sm leading-relaxed"
 />
 </div>

 {/* Formato de Directo */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-[var(--hair)]">
 <div>
 <label className="block text-xs font-medium text-[var(--ink-2)] mb-1.5">
 Formato de Escenario
 </label>
 <input
 type="text"
 value={formato}
 onChange={(e) => setFormato(e.target.value)}
 placeholder="Ej. Banda completa, Trío acústico..."
 className="w-full px-3 py-2 rounded-[var(--r-m)] bg-[var(--bg)] border-[var(--hair)] text-[var(--ink)] placeholder-zinc-500 focus:outline-none focus: text-sm"
 />
 </div>

 <div>
 <label className="block text-xs font-medium text-[var(--ink-2)] mb-1.5">
 Músicos en Escenario
 </label>
 <input
 type="number"
 min={1}
 max={25}
 value={numMusicos}
 onChange={(e) => setNumMusicos(Number(e.target.value))}
 className="w-full px-3 py-2 rounded-[var(--r-m)] bg-[var(--bg)] border-[var(--hair)] text-[var(--ink)] focus:outline-none focus: text-sm"
 />
 </div>

 <div>
 <label className="block text-xs font-medium text-[var(--ink-2)] mb-1.5">
 Duración Típica del Show
 </label>
 <input
 type="text"
 value={duracionDirecto}
 onChange={(e) => setDuracionDirecto(e.target.value)}
 placeholder="Ej. 60 - 75 min"
 className="w-full px-3 py-2 rounded-[var(--r-m)] bg-[var(--bg)] border-[var(--hair)] text-[var(--ink)] placeholder-zinc-500 focus:outline-none focus: text-sm"
 />
 </div>
 </div>
 </div>
 );
};
