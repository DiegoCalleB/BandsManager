import React, { useState } from 'react';
import { 
  Sparkles, Flame, Zap, Repeat, Eye, MessageSquare, 
  Layers, Smile, Check, ArrowRight, Star,
  Smartphone, BarChart2, Lightbulb, Shield, Shuffle,
  ZoomIn, Music, Radio, Ticket, PlaySquare,
  Stethoscope, MessageSquareQuote, CheckCheck, TrendingUp, AlertTriangle, Bot, Copy
} from 'lucide-react';
import { ThemeColors } from '../../types';
import { apiFetch } from '../../utils/api';

export interface ViralHookVariant {
  id: string;
  angle: 'curiosity' | 'debate' | 'storytelling' | 'challenge';
  title: string;
  hookText: string;
  copyText: string;
  score: number;
  reason: string;
}

export interface HookDoctorDiagnosis {
  cringeScore: number;
  estimatedRetention3s: number;
  verdict: string;
  cringeReasons: string[];
  improvedHook: string;
  improvedCopy: string;
  pinnedComment: string;
  pinnedCommentGoal: string;
}

export interface SubtitleStyleConfig {
  id: 'gold' | 'neon' | 'cinematic' | 'minimal';
  name: string;
  colorClass: string;
  bgClass: string;
  fontClass: string;
  preview: string;
}

export const SUBTITLE_STYLES: SubtitleStyleConfig[] = [
  {
    id: 'gold',
    name: 'Indie Gold (Viral Bounce)',
    colorClass: 'text-amber-300 font-black drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]',
    bgClass: 'bg-black/50 backdrop-blur-xs px-2.5 py-1 rounded-xl border border-amber-500/30',
    fontClass: 'font-display uppercase tracking-wider',
    preview: 'CUANDO EL SOLO EXPLOTA 🔥🎸'
  },
  {
    id: 'neon',
    name: 'Cyber Neon (Hyperpop)',
    colorClass: 'text-cyan-300 font-black drop-shadow-[0_0_12px_rgba(6,182,212,0.9)]',
    bgClass: 'bg-neutral-950/80 px-2.5 py-1 rounded-xl border border-cyan-500/50',
    fontClass: 'font-mono uppercase',
    preview: 'ESTE RIFF CAMBIÓ TODO ⚡'
  },
  {
    id: 'cinematic',
    name: 'Cinematic White (Pill)',
    colorClass: 'text-white font-extrabold drop-shadow-md',
    bgClass: 'bg-black/75 px-3 py-1 rounded-full border border-white/10',
    fontClass: 'font-sans tracking-wide',
    preview: 'El público no se lo esperaba 👀'
  },
  {
    id: 'minimal',
    name: 'Minimal Clean (Wave)',
    colorClass: 'text-neutral-100 font-bold drop-shadow',
    bgClass: 'bg-transparent',
    fontClass: 'font-sans',
    preview: 'Grabado en directo en Madrid 🎤'
  }
];

export interface ViralGrowthStudioProps {
  colors: ThemeColors;
  isStitchLight?: boolean;
  bandName?: string;
  songTitle?: string;
  currentHook: string;
  onUpdateHook: (hook: string) => void;
  currentCopy: string;
  onUpdateCopy: (copy: string) => void;
  // Seamless loop
  isSeamlessLoop: boolean;
  onToggleSeamlessLoop: (enabled: boolean) => void;
  // Dynamic Punch-in Zoom
  isPunchInZoom: boolean;
  onTogglePunchInZoom: (enabled: boolean) => void;
  // Beat-Drop Rhythm FX
  beatDropFx: boolean;
  onToggleBeatDropFx: (enabled: boolean) => void;
  // Smart-Pan Dynamic Framing
  smartPan: boolean;
  onToggleSmartPan: (enabled: boolean) => void;
  // Crop mode
  cropMode: 'crop' | 'blur' | 'none' | 'smart_pan';
  onChangeCropMode: (mode: 'crop' | 'blur' | 'none' | 'smart_pan') => void;
  // Subtitle styling
  activeSubtitleStyle: 'gold' | 'neon' | 'cinematic' | 'minimal';
  onChangeSubtitleStyle: (style: 'gold' | 'neon' | 'cinematic' | 'minimal') => void;
  // Contextual Emojis in captions
  injectEmojis: boolean;
  onToggleInjectEmojis: (enabled: boolean) => void;
  // Overlays & B-Roll Stickers
  showSpotifyBadge: boolean;
  onToggleSpotifyBadge: (enabled: boolean) => void;
  showRetentionProgressBar: boolean;
  onToggleRetentionProgressBar: (enabled: boolean) => void;
  showTourSticker: boolean;
  onToggleTourSticker: (enabled: boolean) => void;
  tourStickerText: string;
  onUpdateTourStickerText: (text: string) => void;
  onSyncFromTourCRM?: () => void;
  // Multi-angle layout
  layoutMode: 'full' | 'split' | 'pip';
  onChangeLayoutMode: (mode: 'full' | 'split' | 'pip') => void;
  // Safe zone
  showSafeZone: boolean;
  onToggleSafeZone: () => void;
  // 1-Click God Mode Autopilot
  onTriggerMagicAutopilot?: () => void;
  magicAppliedNotification?: boolean;
}

export const ViralGrowthStudio: React.FC<ViralGrowthStudioProps> = ({
  isStitchLight,
  bandName = 'Banda',
  songTitle = 'Tema',
  currentHook,
  onUpdateHook,
  currentCopy,
  onUpdateCopy,
  isSeamlessLoop,
  onToggleSeamlessLoop,
  isPunchInZoom,
  onTogglePunchInZoom,
  beatDropFx,
  onToggleBeatDropFx,
  smartPan,
  onToggleSmartPan,
  cropMode,
  onChangeCropMode,
  activeSubtitleStyle,
  onChangeSubtitleStyle,
  injectEmojis,
  onToggleInjectEmojis,
  showSpotifyBadge,
  onToggleSpotifyBadge,
  showRetentionProgressBar,
  onToggleRetentionProgressBar,
  showTourSticker,
  onToggleTourSticker,
  tourStickerText,
  onUpdateTourStickerText,
  onSyncFromTourCRM,
  layoutMode,
  onChangeLayoutMode,
  showSafeZone,
  onToggleSafeZone,
  onTriggerMagicAutopilot,
  magicAppliedNotification
}) => {
  const [activeStudioTab, setActiveStudioTab] = useState<'hooks' | 'retention' | 'subtitles' | 'overlays' | 'layout'>('hooks');
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false);
  const [hookVariants, setHookVariants] = useState<ViralHookVariant[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  // AI Hook Doctor & Anti-Cringe Scanner State
  const [isAnalyzingDoctor, setIsAnalyzingDoctor] = useState(false);
  const [doctorDiagnosis, setDoctorDiagnosis] = useState<HookDoctorDiagnosis | null>(null);
  const [doctorError, setDoctorError] = useState<string | null>(null);
  const [copiedPinnedComment, setCopiedPinnedComment] = useState(false);

  // Run AI Hook Doctor & Anti-Cringe Audit
  const handleRunHookDoctor = async () => {
    setIsAnalyzingDoctor(true);
    setDoctorError(null);
    try {
      const res = await apiFetch<any>('/api/reels/ai-hook-doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hookText: currentHook,
          copyText: currentCopy,
          songTitle,
          platform: 'Instagram',
          contentType: 'concierto'
        })
      });
      if (res?.success && res.diagnosis) {
        setDoctorDiagnosis(res.diagnosis);
      } else {
        setDoctorError(res?.error || 'No se pudo completar el diagnóstico.');
      }
    } catch (err: any) {
      setDoctorError(err?.message || 'Error conectando con el servicio de IA.');
    } finally {
      setIsAnalyzingDoctor(false);
    }
  };

  const handleApplyDoctorImprovement = () => {
    if (!doctorDiagnosis) return;
    onUpdateHook(doctorDiagnosis.improvedHook);
    if (doctorDiagnosis.improvedCopy) {
      onUpdateCopy(doctorDiagnosis.improvedCopy);
    }
  };

  const handleCopyPinnedComment = () => {
    if (!doctorDiagnosis?.pinnedComment) return;
    navigator.clipboard.writeText(doctorDiagnosis.pinnedComment);
    setCopiedPinnedComment(true);
    setTimeout(() => setCopiedPinnedComment(false), 3000);
  };

  // Calculate Real-Time Viral Hook Score (0-100)
  const calculateHookScore = (text: string) => {
    if (!text || text.trim().length === 0) return { score: 25, label: 'Sin Gancho', color: 'text-neutral-500', bg: 'bg-neutral-800' };
    
    let score = 50;
    const words = text.trim().split(/\s+/).length;
    
    // Ideal length 4-12 words
    if (words >= 4 && words <= 12) score += 20;
    else if (words > 12) score += 5;

    // Power keywords for music virality
    const powerWords = [
      'nadie', 'secreto', 'fallo', 'error', 'directo', 'locura', 'prohibido',
      'cuando', 'por qué', 'así', 'escucha', 'brutal', 'solo', 'guitarra', 'batería',
      'ensayo', 'público', 'inédito', 'rompió', 'gritaron', 'lloró', 'primer', 'final'
    ];
    const foundPower = powerWords.filter(pw => text.toLowerCase().includes(pw));
    score += Math.min(20, foundPower.length * 8);

    // Question or curiosity mark
    if (text.includes('?') || text.includes('...') || text.includes('!')) score += 10;

    // Emoji boost
    if (/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}]/u.test(text)) score += 10;

    score = Math.min(98, Math.max(20, score));

    if (score >= 85) return { score, label: 'Viral Explosivo 🔥', color: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-500/40' };
    if (score >= 70) return { score, label: 'Alto Impacto ⚡', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/40' };
    return { score, label: 'Mejorable 💡', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' };
  };

  const hookAnalysis = calculateHookScore(currentHook);

  // Generate 3 High-Retention A/B Variants
  const handleGenerateABVariants = () => {
    setIsGeneratingVariants(true);
    setTimeout(() => {
      const variants: ViralHookVariant[] = [
        {
          id: 'var-curiosity',
          angle: 'curiosity',
          title: '🎭 Curiosidad / Hueco de Información',
          hookText: `El fallo en el segundo 14 que el público convirtió en el estribillo 🤯`,
          copyText: `Nadie en la sala se dio cuenta de lo que pasó hasta que terminamos de tocar... ¿Vosotros lo habéis visto? Dejadnos en comentarios en qué segundo exacto fue 👇🎸\n\n#${bandName.replace(/\s+/g, '')} #IndieRock #MusicaEnDirecto #Backstage`,
          score: 95,
          reason: 'Obliga a volver a ver el vídeo para encontrar el detalle, disparando el tiempo de retención a más del 110%.'
        },
        {
          id: 'var-debate',
          angle: 'debate',
          title: '🔥 Debate / Pregunta Polarizante',
          hookText: `¿Esto es puro Rock de verdad o solo energía de directo? 🤔⚡`,
          copyText: `Hay quien dice que este tipo de canciones ya no se componen hoy en día. ¿Qué opináis vosotros? ¿Del 1 al 10 qué nota le dais a este solo del final? 🥁👇\n\nEscucha el tema completo en Spotify y añade ${bandName} a tu playlist favorita.\n\n#NuevosArtistas #RockEspañol #Conciertos #DescubreMusica`,
          score: 92,
          reason: 'Provoca respuestas inmediatas en comentarios. Cada comentario hace que el algoritmo recomiende el Reel a 50 personas más.'
        },
        {
          id: 'var-storytelling',
          angle: 'storytelling',
          title: '📖 Storytelling / Conexión Emocional',
          hookText: `Escribimos este tema pensando que nadie vendría a vernos y pasó esto... 🖤`,
          copyText: `Hace 2 años tocábamos en un local para 5 amigos. Ayer escuchamos a toda la sala cantando nuestra letra a pleno pulmón. Gracias a cada persona que comparte nuestra música y cree en los grupos independientes ✨🙌\n\n¿Desde qué ciudad nos escuchas? ¡Os leemos a todos!\n\n#${bandName.replace(/\s+/g, '')} #Directo #MusicosIndependientes #Concierto`,
          score: 89,
          reason: 'Conecta con la empatía del espectador y maximiza los "Guardados" y "Compartir por mensaje directo (DM)".'
        }
      ];

      setHookVariants(variants);
      setIsGeneratingVariants(false);
    }, 450);
  };

  const handleApplyVariant = (variant: ViralHookVariant) => {
    setSelectedVariantId(variant.id);
    onUpdateHook(variant.hookText);
    onUpdateCopy(variant.copyText);
  };

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 space-y-4 transition-all ${
      isStitchLight 
        ? 'bg-gradient-to-br from-indigo-50/50 via-white to-amber-50/40 border-indigo-200/80 shadow-md' 
        : 'bg-gradient-to-br from-neutral-900/95 via-neutral-900/80 to-[#1c1917]/90 border-neutral-700/80 shadow-xl'
    }`}>
      
      {/* Header with Title & Quick Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-700/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
            <Flame className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-display font-black uppercase tracking-wider text-white">
                Viral Retention Engine 4.0
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[8.5px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                PRO VIRALITY
              </span>
            </div>
            <p className="text-[10px] font-mono text-neutral-400">
              Ganchos 0-3s, bucles 120%, subtítulos kinetic, beat-drops, smart-pan y capas virales.
            </p>
          </div>
        </div>

        {/* 1-Click God Mode Autopilot Button & Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {onTriggerMagicAutopilot && (
            <button
              id="btn-magic-autopilot"
              type="button"
              onClick={onTriggerMagicAutopilot}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-110 active:scale-95 text-neutral-950 text-[10px] font-mono font-black flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer border border-amber-300 transition-all select-none"
              title="Aplica automáticamente el combo óptimo: Mejor hook, punch-in zoom, beat-drop, subtítulos oro y sincronía con gira"
            >
              <Sparkles className="w-3.5 h-3.5 fill-neutral-950 animate-spin" />
              <span>{magicAppliedNotification ? '¡COMBO VIRAL APLICADO! ✨' : '✨ AUTO-DIRECTOR MÁGICO (1-CLICK)'}</span>
            </button>
          )}

          {/* Tab Buttons */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-neutral-800 self-start sm:self-auto overflow-x-auto max-w-full">
            {[
              { id: 'hooks' as const, label: '🎯 Ganchos A/B', icon: Sparkles },
              { id: 'retention' as const, label: '⚡ Dinamismo & FX', icon: Repeat },
              { id: 'subtitles' as const, label: '💬 Subtítulos', icon: Smile },
              { id: 'overlays' as const, label: '🎨 Stickers', icon: Layers },
              { id: 'layout' as const, label: '📱 Formatos', icon: Smartphone }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeStudioTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveStudioTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-400 text-neutral-950 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* TAB 1: GANCHOS VIRALES & A/B TESTING */}
      {activeStudioTab === 'hooks' && (
        <div className="space-y-4 animate-fade-in">
          {/* Live Hook Score Meter */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-8 space-y-1.5">
              <label className="text-[10px] uppercase font-mono font-bold text-neutral-400 flex items-center justify-between">
                <span>Gancho Visual en Pantalla (0 a 3 segundos):</span>
                <span className="text-[9px] text-neutral-500">{currentHook.length} caracteres</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={currentHook}
                  onChange={(e) => onUpdateHook(e.target.value)}
                  placeholder="Ej: El fallo en el segundo 14 que el público convirtió en estribillo..."
                  className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3.5 py-2.5 text-xs font-sans font-bold text-white focus:outline-none focus:border-amber-400 pr-52 shadow-inner"
                />
                <div className="absolute right-1.5 top-1.5 bottom-1.5 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleRunHookDoctor}
                    disabled={isAnalyzingDoctor}
                    className="px-2.5 h-full rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[9.5px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    title="Auditoría Anti-Cringe y Primer Comentario Fijado con IA"
                  >
                    <Stethoscope className={`w-3 h-3 ${isAnalyzingDoctor ? 'animate-spin' : ''}`} />
                    <span>{isAnalyzingDoctor ? 'Auditando...' : '🩺 Hook Doctor IA'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateABVariants}
                    disabled={isGeneratingVariants}
                    className="px-2.5 h-full rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 hover:brightness-110 text-neutral-950 text-[9.5px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    title="Generar 3 variantes optimizadas para el algoritmo"
                  >
                    <Sparkles className={`w-3 h-3 ${isGeneratingVariants ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingVariants ? 'Creando...' : 'Generar A/B'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Score Card */}
            <div className="md:col-span-4">
              <div className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 ${hookAnalysis.bg}`}>
                <div className="space-y-0.5">
                  <span className="text-[8.5px] uppercase font-mono font-bold text-neutral-400 block">
                    Viral Hook Score
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xl font-mono font-black ${hookAnalysis.color}`}>
                      {hookAnalysis.score}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">/ 100</span>
                  </div>
                  <span className={`text-[9px] font-bold block ${hookAnalysis.color}`}>
                    {hookAnalysis.label}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-black/40 border border-neutral-700/60 flex items-center justify-center shrink-0">
                  <Flame className={`w-5 h-5 ${hookAnalysis.color}`} />
                </div>
              </div>
            </div>
          </div>

          {/* AI Hook Doctor Diagnosis & Pinned Comment Card */}
          {doctorError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex gap-2 items-center">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{doctorError}</span>
            </div>
          )}

          {doctorDiagnosis && (
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 space-y-3.5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-indigo-500/30">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                      Diagnóstico AI Hook Doctor & Anti-Cringe
                    </h4>
                    <span className="text-[9.5px] font-sans text-indigo-300">
                      "{doctorDiagnosis.verdict}"
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Cringe Score Badge */}
                  <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold flex items-center gap-1.5 ${
                    doctorDiagnosis.cringeScore <= 25 
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                      : doctorDiagnosis.cringeScore <= 55
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                        : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                  }`}>
                    <span>Cringe Factor: {doctorDiagnosis.cringeScore}/100</span>
                    <span className="text-[8.5px] opacity-80">
                      {doctorDiagnosis.cringeScore <= 25 ? '✓ Auténtico' : '⚠️ Cliché'}
                    </span>
                  </div>

                  {/* Estimated Retention Badge */}
                  <div className="px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-bold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-cyan-300" />
                    <span>Retención 0-3s: {doctorDiagnosis.estimatedRetention3s}%</span>
                  </div>
                </div>
              </div>

              {/* Reasons / Anti-Cringe Advice */}
              {doctorDiagnosis.cringeReasons.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-mono font-bold text-indigo-400">Observaciones del Doctor:</span>
                  <div className="space-y-1">
                    {doctorDiagnosis.cringeReasons.map((reason, rIdx) => (
                      <div key={rIdx} className="text-[10px] font-sans text-neutral-300 flex items-start gap-1.5">
                        <span className="text-indigo-400 mt-0.5">•</span>
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2-Column AI Recommendations: Improved Hook vs Pinned Comment Debate */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                
                {/* Improved Hook & Copy Box */}
                <div className="p-3 rounded-xl bg-black/50 border border-indigo-500/30 space-y-2 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-mono font-bold text-amber-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" /> Gancho y Copy Mejorado
                      </span>
                    </div>
                    <p className="text-xs font-bold text-amber-200">
                      "{doctorDiagnosis.improvedHook}"
                    </p>
                    {doctorDiagnosis.improvedCopy && (
                      <p className="text-[9.5px] text-neutral-400 font-sans line-clamp-2">
                        {doctorDiagnosis.improvedCopy}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyDoctorImprovement}
                    className="w-full py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-300 hover:brightness-110 active:scale-95 text-neutral-950 text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Aplicar Mejora al Reel</span>
                  </button>
                </div>

                {/* Pinned Comment Debate Box */}
                <div className="p-3 rounded-xl bg-black/50 border border-indigo-500/30 space-y-2 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-mono font-bold text-cyan-400 flex items-center gap-1">
                        <MessageSquareQuote className="w-3 h-3 text-cyan-400" /> Primer Comentario Fijado (Pinned Comment)
                      </span>
                      <span className="text-[8px] font-mono text-cyan-300/80 bg-cyan-950/60 px-1 rounded">5x Comentarios</span>
                    </div>
                    <p className="text-xs font-bold text-cyan-200">
                      "{doctorDiagnosis.pinnedComment}"
                    </p>
                    <p className="text-[9px] text-neutral-400 font-mono">
                      🎯 {doctorDiagnosis.pinnedCommentGoal}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyPinnedComment}
                    className={`w-full py-1.5 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      copiedPinnedComment
                        ? 'bg-emerald-500 text-neutral-950 font-black'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm'
                    }`}
                  >
                    {copiedPinnedComment ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>¡Comentario Copiado al Portapapeles!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Comentario Fijado</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* Generated A/B/C Split-Testing Carousel */}
          {hookVariants.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] uppercase font-mono font-bold text-amber-400 flex items-center gap-1.5">
                  <Shuffle className="w-3.5 h-3.5" />
                  3 Variantes de Gancho para Test A/B/C:
                </span>
                <span className="text-[8.5px] font-mono text-neutral-500">Haz clic en una para aplicarla</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {hookVariants.map((variant) => {
                  const isSelected = selectedVariantId === variant.id;
                  return (
                    <div
                      key={variant.id}
                      onClick={() => handleApplyVariant(variant)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between text-left space-y-2 relative ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-400 shadow-md ring-1 ring-amber-400'
                          : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/90'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono font-bold text-neutral-300">
                            {variant.title}
                          </span>
                          <span className="text-[8.5px] font-mono font-black text-rose-400 px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                            {variant.score} pts
                          </span>
                        </div>
                        <p className="text-xs font-bold font-sans text-amber-200 line-clamp-2">
                          "{variant.hookText}"
                        </p>
                        <p className="text-[9px] font-mono text-neutral-400 line-clamp-2 leading-tight">
                          {variant.reason}
                        </p>
                      </div>

                      <div className="pt-1 flex items-center justify-between text-[8.5px] font-mono font-bold">
                        <span className={isSelected ? 'text-amber-400' : 'text-neutral-500'}>
                          {isSelected ? '✓ Activo en Reel' : 'Aplicar esta variante'}
                        </span>
                        <ArrowRight className={`w-3 h-3 ${isSelected ? 'text-amber-400' : 'text-neutral-600'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RETENCIÓN (SEAMLESS LOOP, PUNCH-IN ZOOM, BEAT-DROP FX & SMART-PAN) */}
      {activeStudioTab === 'retention' && (
        <div className="space-y-3 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            
            {/* Seamless Loop Switch */}
            <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs font-mono uppercase">
                  <Repeat className="w-4 h-4 text-rose-400" />
                  <span>Bucle Infinito (120% Watch-Time)</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={isSeamlessLoop}
                    onChange={(e) => onToggleSeamlessLoop(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                </label>
              </div>
              <p className="text-[9.5px] font-sans text-neutral-400 leading-relaxed">
                Ajusta los microsegundos finales con crossfade invisible para que la última nota enlace con el inicio sin pausa.
              </p>
            </div>

            {/* Punch-In Zoom Switch */}
            <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs font-mono uppercase">
                  <ZoomIn className="w-4 h-4 text-amber-400" />
                  <span>Punch-in Zoom (0-3s & Picos)</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={isPunchInZoom}
                    onChange={(e) => onTogglePunchInZoom(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-400"></div>
                </label>
              </div>
              <p className="text-[9.5px] font-sans text-neutral-400 leading-relaxed">
                Aplica un zoom cinemático dinámico del 10% en el gancho inicial para evitar que el usuario deslice en los primeros segundos.
              </p>
            </div>

            {/* ⚡ Beat-Drop Rhythm FX Switch */}
            <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs font-mono uppercase">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>⚡ Beat-Drop & Rhythm Impacts</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={beatDropFx}
                    onChange={(e) => onToggleBeatDropFx(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-400"></div>
                </label>
              </div>
              <p className="text-[9.5px] font-sans text-neutral-400 leading-relaxed">
                Sincroniza micro-impactos luminosos y de contraste en los golpes de batería y drops de guitarra para máxima potencia física.
              </p>
            </div>

            {/* 🧠 Smart-Pan Stage Framing Switch */}
            <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs font-mono uppercase">
                  <Radio className="w-4 h-4 text-indigo-400" />
                  <span>🧠 Smart-Pan Framing Dinámico</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={smartPan || cropMode === 'smart_pan'}
                    onChange={(e) => {
                      onToggleSmartPan(e.target.checked);
                      if (e.target.checked) onChangeCropMode('smart_pan');
                      else if (cropMode === 'smart_pan') onChangeCropMode('crop');
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
                </label>
              </div>
              <p className="text-[9.5px] font-sans text-neutral-400 leading-relaxed">
                Barrido horizontal inteligente que sigue los movimientos de los músicos por el escenario en lugar de un recorte ciego estático.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: ESTILOS DE SUBTÍTULOS & EMOJIS */}
      {activeStudioTab === 'subtitles' && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-bold text-neutral-400">
              Estilos cinemáticos de subtítulos (Karaoke Word-by-Word):
            </span>
            <div className="flex items-center gap-2">
              <label className="text-[9.5px] font-mono text-amber-400 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={injectEmojis}
                  onChange={(e) => onToggleInjectEmojis(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-900 text-amber-400 focus:ring-0"
                />
                <span>Auto-Emojis en Palabras Clave (🎸, 🔥, ⚡)</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {SUBTITLE_STYLES.map((style) => {
              const isSelected = activeSubtitleStyle === style.id;
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => onChangeSubtitleStyle(style.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-400 shadow-md ring-1 ring-amber-400'
                      : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-mono font-bold text-white">
                      {style.name}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </div>

                  <div className="w-full py-2 flex items-center justify-center bg-black/60 rounded-lg border border-neutral-800/80">
                    <span className={`text-[10.5px] ${style.fontClass} ${style.colorClass} ${style.bgClass}`}>
                      {style.preview}
                    </span>
                  </div>

                  <span className="text-[8.5px] font-mono text-neutral-500 block">
                    Resaltado activo palabra por palabra
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: B-ROLL OVERLAYS & STICKERS VIRALES */}
      {activeStudioTab === 'overlays' && (
        <div className="space-y-3 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Spotify Pill */}
            <div className={`p-3 rounded-xl border space-y-2 transition-all ${
              showSpotifyBadge ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-neutral-950/70 border-neutral-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs font-mono">
                  <Music className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Audio en Spotify</span>
                </div>
                <input
                  type="checkbox"
                  checked={showSpotifyBadge}
                  onChange={(e) => onToggleSpotifyBadge(e.target.checked)}
                  className="rounded bg-neutral-900 border-neutral-700 text-emerald-500 focus:ring-0 cursor-pointer"
                />
              </div>
              <p className="text-[9px] font-mono text-neutral-400">
                Pill flotante que anima al usuario a buscar el single en plataformas.
              </p>
            </div>

            {/* Retention Bar */}
            <div className={`p-3 rounded-xl border space-y-2 transition-all ${
              showRetentionProgressBar ? 'bg-rose-500/10 border-rose-500/40' : 'bg-neutral-950/70 border-neutral-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs font-mono">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>Barra Retención TikTok</span>
                </div>
                <input
                  type="checkbox"
                  checked={showRetentionProgressBar}
                  onChange={(e) => onToggleRetentionProgressBar(e.target.checked)}
                  className="rounded bg-neutral-900 border-neutral-700 text-rose-500 focus:ring-0 cursor-pointer"
                />
              </div>
              <p className="text-[9px] font-mono text-neutral-400">
                Línea de progreso luminosa para mantener al usuario hasta el solo final.
              </p>
            </div>

            {/* Tour / Concert Sticker */}
            <div className={`p-3 rounded-xl border space-y-2 transition-all ${
              showTourSticker ? 'bg-amber-500/10 border-amber-500/40' : 'bg-neutral-950/70 border-neutral-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs font-mono">
                  <Ticket className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sticker Próximo Bolo</span>
                </div>
                <input
                  type="checkbox"
                  checked={showTourSticker}
                  onChange={(e) => onToggleTourSticker(e.target.checked)}
                  className="rounded bg-neutral-900 border-neutral-700 text-amber-400 focus:ring-0 cursor-pointer"
                />
              </div>
              <input
                type="text"
                value={tourStickerText}
                onChange={(e) => onUpdateTourStickerText(e.target.value)}
                placeholder="Ej: 🎟️ Gira 2026 · Próxima parada: Madrid"
                className="w-full text-[9.5px] font-mono rounded bg-black/60 border border-neutral-700 px-2 py-1 text-amber-200 focus:outline-none"
              />
              {onSyncFromTourCRM && (
                <button
                  type="button"
                  onClick={onSyncFromTourCRM}
                  className="w-full text-[8.5px] font-mono text-amber-400 hover:text-amber-200 bg-black/40 hover:bg-black/60 border border-amber-500/30 rounded py-1 flex items-center justify-center gap-1 cursor-pointer transition-all"
                >
                  <Sparkles className="w-2.5 h-2.5" /> Sincronizar con Próxima Fecha CRM
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* TAB 5: FORMATOS DE PANTALLA & SAFE-ZONE */}
      {activeStudioTab === 'layout' && (
        <div className="space-y-3 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Multi-angle layout selector */}
            <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2.5 text-left">
              <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 block">
                Encuadre de Vídeo (Formato Vertical 9:16 Nativo):
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'full' as const, label: '🎬 Pantalla Completa 9:16', desc: 'Encuadre limpio vertical para Reels/TikTok' },
                  { id: 'pip' as const, label: '🎙️ Reacción / Selfie', desc: 'Miniatura de cámara en esquina' }
                ].map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => onChangeLayoutMode(l.id)}
                    className={`p-2.5 rounded-lg text-left transition-all cursor-pointer border ${
                      layoutMode === l.id
                        ? 'bg-amber-400 text-neutral-950 font-bold border-amber-400 shadow-sm'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <span className="text-[10px] font-mono block">{l.label}</span>
                    <span className="text-[7.5px] font-sans opacity-80 block truncate">{l.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Safe Zone Overlay Toggle */}
            <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2.5 text-left flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 block">
                  Simulador de Safe-Zone (Zona Segura):
                </span>
                <p className="text-[9.5px] font-sans text-neutral-400 mt-1">
                  Muestra las áreas donde los botones de Like, comentarios y el reproductor de TikTok/Instagram tapan la cara o los textos.
                </p>
              </div>

              <button
                type="button"
                onClick={onToggleSafeZone}
                className={`py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                  showSafeZone
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                    : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{showSafeZone ? '✓ Safe-Zone Visible en Preview' : 'Activar Cuadrícula Safe-Zone'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
