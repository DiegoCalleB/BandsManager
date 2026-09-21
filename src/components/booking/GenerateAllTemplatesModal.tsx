import React, { useState } from 'react';
import { Sparkles, Wand2, X, Check, Loader2, Info, Building2, Tent, Disc3, Radio, Users, Briefcase, Landmark } from 'lucide-react';
import { ThemeColors } from '../../types';

export interface GenerateAllTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  colors?: ThemeColors;
  isStitchLight?: boolean;
  initialBaseText?: string;
  onGenerateAll: (baseProposal: string) => Promise<boolean>;
  isGenerating: boolean;
  mode?: 'crm' | 'campaign';
  campaignContext?: {
    name?: string;
    targetCities?: string[];
    targetDates?: string[];
    minCapacity?: number;
    maxCapacity?: number;
    notes?: string;
  };
}

const CATEGORIES_PREVIEW = [
  { icon: Building2, name: 'Salas y Teatros', desc: 'Acústica, mimo cultural, temporada y aforos medios.' },
  { icon: Tent, name: 'Festivales', desc: 'Ultra-breve (<90 pal.), impacto en gran formato y cambio ágil.' },
  { icon: Disc3, name: 'Discotecas', desc: 'Live set electrónico bailable, horario noche y cabina DJ.' },
  { icon: Radio, name: 'Medios / Prensa', desc: 'Gancho periodístico, single/gira, streaming WAV y entrevistas.' },
  { icon: Users, name: 'Grupos (Co-booking)', desc: 'De músico a músico, intercambio de ciudades y backline.' },
  { icon: Briefcase, name: 'Managements', desc: 'Solvencia técnica, tracción de público y sinergias.' },
  { icon: Landmark, name: 'Ayuntamientos', desc: 'Tratamiento formal (usted), fiestas patronales y facturación oficial.' },
];

export function GenerateAllTemplatesModal({
  isOpen,
  onClose,
  colors,
  isStitchLight = false,
  initialBaseText = '',
  onGenerateAll,
  isGenerating,
  mode = 'crm',
  campaignContext
}: GenerateAllTemplatesModalProps) {
  const [baseProposal, setBaseProposal] = useState(initialBaseText);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isCampaign = mode === 'campaign';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baseProposal.trim()) {
      setErrorMsg('Por favor introduce la propuesta o enfoque base.');
      return;
    }
    setErrorMsg(null);
    const success = await onGenerateAll(baseProposal);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden ${
          isStitchLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#181818] border-white/10 text-white'
        }`}
      >
        {/* Header */}
        <div className={`p-5 flex items-center justify-between border-b ${
          isStitchLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1e1e1e] border-white/5'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black shadow-md ${
              isCampaign 
                ? 'bg-gradient-to-tr from-purple-500 to-purple-400 text-white shadow-purple-500/20' 
                : 'bg-gradient-to-tr from-amber-500 to-amber-300 text-stone-950 shadow-amber-500/20'
            }`}>
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-sans flex items-center gap-2">
                {isCampaign ? 'Generador Multi-Escenario para Campaña' : 'Generador Multi-Escenario IA'}
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${
                  isCampaign
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  7 Categorías en 1 Clic
                </span>
              </h3>
              <p className={`text-xs ${isStitchLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                {isCampaign 
                  ? `Adapta el objetivo de "${campaignContext?.name || 'la campaña'}" a los 7 tipos de programadores`
                  : 'Adapta automáticamente la propuesta de tu banda a los 7 tipos de programadores'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isStitchLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-white/10 text-neutral-400'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
              <span>{errorMsg}</span>
              <button type="button" onClick={() => setErrorMsg(null)} className="font-bold text-rose-400 hover:text-white">✕</button>
            </div>
          )}

          {/* Campaign Context Pill (if in campaign mode) */}
          {isCampaign && campaignContext && (
            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-200 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-purple-300">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Contexto de Campaña detectado:</span>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] pt-1">
                {campaignContext.targetCities?.length ? (
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/30">
                    📍 Ciudades: {campaignContext.targetCities.join(', ')}
                  </span>
                ) : null}
                {campaignContext.targetDates?.length ? (
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/30">
                    📅 Fechas: {campaignContext.targetDates.join(', ')}
                  </span>
                ) : null}
                {campaignContext.minCapacity || campaignContext.maxCapacity ? (
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/30">
                    👥 Aforo: {campaignContext.minCapacity || 100} - {campaignContext.maxCapacity || 500} pax
                  </span>
                ) : null}
              </div>
            </div>
          )}

          {/* Info pill */}
          <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-2 ${
            isCampaign
              ? 'bg-purple-950/30 border-purple-500/20 text-purple-200'
              : isStitchLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-500/10 border-amber-500/20 text-amber-200'
          }`}>
            <div className={`flex items-center gap-2 font-bold ${isCampaign ? 'text-purple-400' : 'text-amber-400'}`}>
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Reglas Maestras de Oro aplicadas automáticamente:</span>
            </div>
            <p className="text-[11px] opacity-90">
              La IA convertirá tu información en <strong>7 mensajes adaptados por sector</strong>, con brevedad radical (&lt;130 palabras), tono diferenciado por recinto y variables dinámicas (<code>{'{{nombre_sala}}'}</code>, <code>{'{{ciudad}}'}</code>).
            </p>
          </div>

          {/* Text Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-1.5 ${
                isCampaign ? 'text-purple-400' : 'text-amber-400'
              }`}>
                <span>{isCampaign ? 'Concepto y Enfoque de esta Campaña' : 'Propuesta Base, Sonido e Identidad de la Banda'}</span>
              </label>
              <span className={`text-[10px] ${isStitchLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                {isCampaign ? 'Detalles clave de la gira o lanzamiento' : 'Pega aquí tu biografía, instrumentos o formato'}
              </span>
            </div>
            <textarea
              rows={6}
              value={baseProposal}
              onChange={(e) => setBaseProposal(e.target.value)}
              disabled={isGenerating}
              className={`w-full p-4 rounded-xl text-xs font-sans leading-relaxed focus:outline-none transition-all resize-y ${
                isStitchLight
                  ? 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                  : 'bg-[#121212] border border-white/10 text-neutral-200 focus:border-purple-400/50'
              }`}
              placeholder={isCampaign
                ? "Ejemplo: Presentación de nuevo disco con escenografía de directo especial. Queremos cerrar fines de semana en salas medianas y festivales de otoño. Ofrecemos formato completo con 4 músicos y opción de colaborar con bandas locales para compartir gastos de sala."
                : "Ejemplo: Somos Bakandeya, directo de música mestizaje con loop station, electrónica vocal, violín solista, handpan y percusión reciclada. 4 miembros en escena, energía de festival y formato live performance..."
              }
            />
          </div>

          {/* Targets Grid Preview */}
          <div className="space-y-2">
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${isStitchLight ? 'text-slate-600' : 'text-neutral-400'}`}>
              Las 7 adaptaciones que se generarán:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {CATEGORIES_PREVIEW.map((cat, idx) => {
                const Icon = cat.icon;
                return (
                  <div 
                    key={idx}
                    className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${
                      isStitchLight ? 'bg-slate-50 border-slate-200' : 'bg-[#141414] border-white/5'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                      isCampaign ? 'bg-purple-500/15 text-purple-300' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold truncate">{cat.name}</div>
                      <div className={`text-[10px] line-clamp-2 ${isStitchLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                        {cat.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className={`p-4 px-6 flex items-center justify-between border-t ${
          isStitchLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1e1e1e] border-white/5'
        }`}>
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isStitchLight ? 'text-slate-600 hover:bg-slate-200' : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isGenerating || !baseProposal.trim()}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg hover:brightness-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              isCampaign
                ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-purple-500/25'
                : 'bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 shadow-amber-500/20'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className={`w-4 h-4 animate-spin ${isCampaign ? 'text-white' : 'text-stone-950'}`} />
                <span>Generando 7 plantillas de campaña...</span>
              </>
            ) : (
              <>
                <Sparkles className={`w-4 h-4 ${isCampaign ? 'text-white' : 'text-stone-950'}`} />
                <span>{isCampaign ? 'Generar y Aplicar a esta Campaña' : 'Generar y Guardar las 7 Plantillas'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
