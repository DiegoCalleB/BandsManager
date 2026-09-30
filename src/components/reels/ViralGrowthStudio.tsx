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
import { ShowIcon } from '../ui/ShowIcon';
import { Input } from '../ui';

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
    colorClass: 'text-[var(--acc-ink)] font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]',
    bgClass: 'bg-[var(--scrim)]/50 px-2.5 py-1 rounded-[var(--r-s)] bg-[var(--acc)]/10',
    fontClass: 'font-display',
    preview: 'CUANDO EL SOLO EXPLOTA 🔥🎸'
  },
  {
    id: 'neon',
    name: 'Cyber Neon (Hyperpop)',
    colorClass: 'text-[var(--acc-ink)] font-bold drop-shadow-[0_0_12px_rgba(6,182,212,0.9)]',
    bgClass: 'bg-[var(--sunken)]/80 px-2.5 py-1 rounded-[var(--r-s)] bg-[var(--acc)]/10',
    fontClass: 'font-mono',
    preview: 'ESTE RIFF CAMBIÓ TODO ⚡'
  },
  {
    id: 'cinematic',
    name: 'Cinematic White (Pill)',
    colorClass: 'text-[var(--ink)] font-extrabold ',
    bgClass: 'bg-[var(--scrim)]/75 px-3 py-1 rounded-full ',
    fontClass: 'font-sans tracking-wide',
    preview: 'El público no se lo esperaba 👀'
  },
  {
    id: 'minimal',
    name: 'Minimal Clean (Wave)',
    colorClass: 'text-[var(--ink)] font-bold ',
    bgClass: 'bg-transparent',
    fontClass: 'font-sans',
    preview: 'Grabado en directo en Madrid 🎤'
  }
];

export interface ViralGrowthStudioProps {
  colors: ThemeColors;
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
    if (!text || text.trim().length === 0) return { score: 25, label: 'Sin Gancho', color: 'text-[var(--ink-2)]', bg: 'bg-[var(--sunken)]' };
    
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

    if (score >= 85) return { score, label: 'Viral Explosivo', color: 'text-[var(--alert)]', bg: 'bg-[var(--alert)]/15 ' };
    if (score >= 70) return { score, label: 'Alto Impacto', color: 'text-[var(--acc-ink)]', bg: 'bg-[var(--acc)]/15 ' };
    return { score, label: 'Mejorable', color: 'text-[var(--acc-ink)]', bg: 'bg-[var(--acc)]/10 ' };
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
          title: 'Curiosidad / Hueco de Información',
          hookText: `El fallo en el segundo 14 que el público convirtió en el estribillo 🤯`,
          copyText: `Nadie en la sala se dio cuenta de lo que pasó hasta que terminamos de tocar... ¿Vosotros lo habéis visto? Dejadnos en comentarios en qué segundo exacto fue 👇🎸\n\n#${bandName.replace(/\s+/g, '')} #IndieRock #MusicaEnDirecto #Backstage`,
          score: 95,
          reason: 'Obliga a volver a ver el vídeo para encontrar el detalle, disparando el tiempo de retención a más del 110%.'
        },
        {
          id: 'var-debate',
          angle: 'debate',
          title: 'Debate / Pregunta Polarizante',
          hookText: `¿Esto es puro Rock de verdad o solo energía de directo? 🤔⚡`,
          copyText: `Hay quien dice que este tipo de canciones ya no se componen hoy en día. ¿Qué opináis vosotros? ¿Del 1 al 10 qué nota le dais a este solo del final? 🥁👇\n\nEscucha el tema completo en Spotify y añade ${bandName} a tu playlist favorita.\n\n#NuevosArtistas #RockEspañol #Conciertos #DescubreMusica`,
          score: 92,
          reason: 'Provoca respuestas inmediatas en comentarios. Cada comentario hace que el algoritmo recomiende el Reel a 50 personas más.'
        },
        {
          id: 'var-storytelling',
          angle: 'storytelling',
          title: 'Storytelling / Conexión Emocional',
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
    <div className={`rounded-[var(--r-m)] p-4 sm:p-5 space-y-4 transition-ui `}>
      
      {/* Header with Title & Quick Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--hair)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[var(--r-s)] flex items-center justify-center text-[var(--ink)] ">
            <Flame className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-display font-bold text-[var(--ink)]">
                Viral Retention Engine 4.0
              </h3>
              <span className="px-2 py-0.5 rounded-full text-micro font-mono font-bold bg-[var(--alert)]/20 text-[var(--ink)] ">
                PRO VIRALITY
              </span>
            </div>
            <p className="text-micro font-mono text-[var(--ink-2)]">
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
              className="px-3 py-1.5 rounded-[var(--r-pill)] hover:brightness-110 active:scale-[0.97] text-[var(--ink)] text-micro font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-ui select-none bg-[var(--acc)]/10"
              title="Aplica automáticamente el combo óptimo: Mejor hook, punch-in zoom, beat-drop, subtítulos oro y sincronía con gira"
            >
              <Sparkles className="w-3.5 h-3.5 fill-[var(--ink-3)] animate-spin" />
              <span>{magicAppliedNotification ? '¡COMBO VIRAL APLICADO!' : 'AUTO-DIRECTOR MÁGICO (1-CLICK)'}</span>
            </button>
          )}

          {/* Tab Buttons */}
          <div className="flex items-center gap-1 p-1 rounded-[var(--r-s)] bg-[var(--scrim)]/40 self-start sm:self-auto overflow-x-auto shrink-0 max-w-full">
            {[
              { id: 'hooks' as const, label: 'Ganchos A/B', icon: Sparkles },
              { id: 'retention' as const, label: 'Dinamismo & FX', icon: Repeat },
              { id: 'subtitles' as const, label: 'Subtítulos', icon: Smile },
              { id: 'overlays' as const, label: 'Stickers', icon: Layers },
              { id: 'layout' as const, label: 'Formatos', icon: Smartphone }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeStudioTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveStudioTab(tab.id)}
                  className={`px-3 py-1.5 rounded-[var(--r-pill)] text-micro font-mono font-bold flex items-center gap-1.5 transition-ui cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[var(--acc)] text-[var(--on-acc)] '
                      : 'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--sunken)]/60'
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
              <label className="text-micro font-mono font-bold text-[var(--ink-2)] flex items-center justify-between">
                <span>Gancho visual en pantalla (0 a 3 segundos):</span>
                <span className="text-micro text-[var(--ink-2)]">{currentHook.length} caracteres</span>
              </label>
              <div className="relative">
                <Input
                  size="sm"
                  type="text"
                  value={currentHook}
                  onChange={(e) => onUpdateHook(e.target.value)}
                  placeholder="Ej: El fallo en el segundo 14 que el público convirtió en estribillo…"
                  className="w-full pr-52"
                />
                <div className="absolute right-1.5 top-1.5 bottom-1.5 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleRunHookDoctor}
                    disabled={isAnalyzingDoctor}
                    className="px-2.5 h-full rounded-[var(--r-s)] bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] text-micro font-mono font-bold flex items-center gap-1 cursor-pointer transition-ui active:scale-[0.97] disabled:opacity-50"
                    title="Auditoría anti-Cringe y primer comentario fijado con IA"
                  >
                    <Stethoscope className={`w-3 h-3 ${isAnalyzingDoctor ? 'animate-spin' : ''}`} />
                    <span>{isAnalyzingDoctor ? 'Auditando...' : 'Hook Doctor IA'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateABVariants}
                    disabled={isGeneratingVariants}
                    className="px-2.5 h-full rounded-[var(--r-s)] hover:brightness-110 text-[var(--ink)] text-micro font-mono font-bold flex items-center gap-1 cursor-pointer transition-ui active:scale-[0.97] disabled:opacity-50"
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
              <div className={`p-3 rounded-[var(--r-s)] flex items-center justify-between gap-2.5 ${hookAnalysis.bg}`}>
                <div className="space-y-0.5">
                  <span className="text-micro font-mono font-bold text-[var(--ink-2)] block">
                    Viral Hook Score
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xl font-mono font-bold ${hookAnalysis.color}`}>
                      {hookAnalysis.score}
                    </span>
                    <span className="text-micro font-mono text-[var(--ink-2)]">/ 100</span>
                  </div>
                  <span className={`text-micro font-bold block ${hookAnalysis.color}`}>
                    {hookAnalysis.label}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-[var(--scrim)]/40 flex items-center justify-center shrink-0">
                  <Flame className={`w-5 h-5 ${hookAnalysis.color}`} />
                </div>
              </div>
            </div>
          </div>

          {/* AI Hook Doctor Diagnosis & Pinned Comment Card */}
          {doctorError && (
            <div className="p-3 bg-[var(--alert)]/10 rounded-[var(--r-s)] text-[var(--alert)] text-xs flex gap-2 items-center">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[var(--alert)]" />
              <span>{doctorError}</span>
            </div>
          )}

          {doctorDiagnosis && (
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--acc)]/40 space-y-3.5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[var(--hair)]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-[var(--r-s)] bg-[var(--acc)] flex items-center justify-center text-[var(--on-acc)]">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-bold text-[var(--ink)] ">
                      Diagnóstico AI Hook Doctor y Anti-Cringe
                    </h4>
                    <span className="text-micro font-sans text-[var(--acc-ink)]">
                      "{doctorDiagnosis.verdict}"
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Cringe Score Badge */}
                  <div className={`px-2.5 py-1 rounded-[var(--r-s)] text-micro font-mono font-bold flex items-center gap-1.5 ${
                    doctorDiagnosis.cringeScore <= 25 
                      ? 'bg-[var(--ok)]/15 text-[var(--ink)] '
                      : doctorDiagnosis.cringeScore <= 55
                        ? 'bg-[var(--acc)]/15 text-[var(--acc-ink)] '
                        : 'bg-[var(--alert)]/15 text-[var(--ink)] '
                  }`}>
                    <span>Cringe Factor: {doctorDiagnosis.cringeScore}/100</span>
                    <span className="text-micro opacity-80">
                      {doctorDiagnosis.cringeScore <= 25 ? '✓ Auténtico' : 'Cliché'}
                    </span>
                  </div>

                  {/* Estimated Retention Badge */}
                  <div className="px-2.5 py-1 rounded-[var(--r-s)] bg-[var(--acc)]/15 text-[var(--acc-ink)] text-micro font-mono font-bold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-[var(--acc-ink)]" />
                    <span>Retención 0-3s: {doctorDiagnosis.estimatedRetention3s}%</span>
                  </div>
                </div>
              </div>

              {/* Reasons / Anti-Cringe Advice */}
              {doctorDiagnosis.cringeReasons.length > 0 && (
                <div className="space-y-1">
                  <span className="text-micro font-mono font-bold text-[var(--acc-ink)]">Observaciones del Doctor:</span>
                  <div className="space-y-1">
                    {doctorDiagnosis.cringeReasons.map((reason, rIdx) => (
                      <div key={rIdx} className="text-micro font-sans text-[var(--ink-2)] flex items-start gap-1.5">
                        <span className="text-[var(--acc-ink)] mt-0.5">•</span>
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2-Column AI Recommendations: Improved Hook vs Pinned Comment Debate */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                
                {/* Improved Hook & Copy Box */}
                <div className="p-3 rounded-[var(--r-s)] bg-[var(--scrim)]/50 space-y-2 flex flex-col justify-between bg-[var(--acc)]/10">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-micro font-mono font-bold text-[var(--acc-ink)] flex items-center gap-1">
                        Gancho y copy mejorado
                      </span>
                    </div>
                    <p className="text-xs font-bold text-[var(--acc-ink)]">
                      "{doctorDiagnosis.improvedHook}"
                    </p>
                    {doctorDiagnosis.improvedCopy && (
                      <p className="text-micro text-[var(--ink-2)] font-sans line-clamp-2">
                        {doctorDiagnosis.improvedCopy}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyDoctorImprovement}
                    className="w-full py-1.5 rounded-[var(--r-s)] hover:brightness-110 active:scale-[0.97] text-[var(--ink)] text-micro font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-ui"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Aplicar mejora al reel</span>
                  </button>
                </div>

                {/* Pinned Comment Debate Box */}
                <div className="p-3 rounded-[var(--r-s)] bg-[var(--scrim)]/50 space-y-2 flex flex-col justify-between bg-[var(--acc)]/10">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-micro font-mono font-bold text-[var(--acc-ink)] flex items-center gap-1">
                        <MessageSquareQuote className="w-3 h-3 text-[var(--acc-ink)]" /> Primer comentario fijado (pinned comment)
                      </span>
                      <span className="text-micro font-mono text-[var(--on-acc)] bg-[var(--acc)] px-1 rounded">5x Comentarios</span>
                    </div>
                    <p className="text-xs font-bold text-[var(--acc-ink)]">
                      "{doctorDiagnosis.pinnedComment}"
                    </p>
                    <p className="text-micro text-[var(--ink-2)] font-mono">
                      <ShowIcon inline emoji="🎯" />{doctorDiagnosis.pinnedCommentGoal}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyPinnedComment}
                    className={`w-full py-1.5 rounded-[var(--r-s)] text-micro font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-ui ${
                      copiedPinnedComment
                        ? 'bg-[var(--ok)] text-[var(--on-ok)] font-bold'
                        : 'bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] '
                    }`}
                  >
                    {copiedPinnedComment ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>¡Comentario copiado al portapapeles!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar comentario fijado</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* Generated A/B/C Split-Testing Carousel */}
          {hookVariants.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[var(--hair)]">
              <div className="flex items-center justify-between">
                <span className="text-micro font-mono font-bold text-[var(--acc-ink)] flex items-center gap-1.5">
                  <Shuffle className="w-3.5 h-3.5" />
                  3 Variantes de Gancho para Test A/B/C:
                </span>
                <span className="text-micro font-mono text-[var(--ink-2)]">Haz clic en una para aplicarla</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {hookVariants.map((variant) => {
                  const isSelected = selectedVariantId === variant.id;
                  return (
                    <div
                      key={variant.id}
                      onClick={() => handleApplyVariant(variant)}
                      className={`p-3 rounded-[var(--r-s)] transition-ui cursor-pointer flex flex-col justify-between text-left space-y-2 relative ${
                        isSelected
                          ? 'bg-[var(--acc)]/15 ring-1 ring-[var(--acc)]'
                          : 'bg-[var(--sunken)]/70 hover:bg-[var(--sunken)]/90'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-micro font-mono font-bold text-[var(--ink-2)]">
                            {variant.title}
                          </span>
                          <span className="text-micro font-mono font-bold text-[var(--alert)] px-1.5 py-0.5 rounded bg-[var(--alert)]/10 ">
                            {variant.score} pts
                          </span>
                        </div>
                        <p className="text-xs font-bold font-sans text-[var(--acc-ink)] line-clamp-2">
                          "{variant.hookText}"
                        </p>
                        <p className="text-micro font-mono text-[var(--ink-2)] line-clamp-2 leading-tight">
                          {variant.reason}
                        </p>
                      </div>

                      <div className="pt-1 flex items-center justify-between text-micro font-mono font-bold">
                        <span className={isSelected ? 'text-[var(--acc-ink)]' : 'text-[var(--ink-2)]'}>
                          {isSelected ? '✓ Activo en Reel' : 'Aplicar esta variante'}
                        </span>
                        <ArrowRight className={`w-3 h-3 ${isSelected ? 'text-[var(--acc-ink)]' : 'text-[var(--ink-2)]'}`} />
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
            <div className="p-3.5 rounded-[var(--r-s)] bg-[var(--sunken)]/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[var(--alert)] font-bold text-xs font-mono ">
                  <Repeat className="w-4 h-4 text-[var(--alert)]" />
                  <span>Bucle infinito (120% watch-Time)</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={isSeamlessLoop}
                    onChange={(e) => onToggleSeamlessLoop(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[var(--sunken)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--ink)] after:rounded-full after:h-4 after:w-4 after:transition-ui peer-checked:bg-[var(--alert)]"></div>
                </label>
              </div>
              <p className="text-micro font-sans text-[var(--ink-2)] leading-relaxed">
                Ajusta los microsegundos finales con crossfade invisible para que la última nota enlace con el inicio sin pausa.
              </p>
            </div>

            {/* Punch-In Zoom Switch */}
            <div className="p-3.5 rounded-[var(--r-s)] bg-[var(--sunken)]/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[var(--acc-ink)] font-bold text-xs font-mono ">
                  <ZoomIn className="w-4 h-4 text-[var(--acc-ink)]" />
                  <span>Punch-in Zoom (0-3s y Picos)</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={isPunchInZoom}
                    onChange={(e) => onTogglePunchInZoom(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[var(--sunken)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--ink)] after:rounded-full after:h-4 after:w-4 after:transition-ui peer-checked:bg-[var(--acc)]"></div>
                </label>
              </div>
              <p className="text-micro font-sans text-[var(--ink-2)] leading-relaxed">
                Aplica un zoom cinemático dinámico del 10% en el gancho inicial para evitar que el usuario deslice en los primeros segundos.
              </p>
            </div>

            {/* ⚡ Beat-Drop Rhythm FX Switch */}
            <div className="p-3.5 rounded-[var(--r-s)] bg-[var(--sunken)]/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[var(--acc-ink)] font-bold text-xs font-mono ">
                  <Zap className="w-4 h-4 text-[var(--acc-ink)]" />
                  <span>Beat-Drop y rhythm impacts</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={beatDropFx}
                    onChange={(e) => onToggleBeatDropFx(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[var(--sunken)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--ink)] after:rounded-full after:h-4 after:w-4 after:transition-ui peer-checked:bg-[var(--acc)]"></div>
                </label>
              </div>
              <p className="text-micro font-sans text-[var(--ink-2)] leading-relaxed">
                Sincroniza micro-impactos luminosos y de contraste en los golpes de batería y drops de guitarra para máxima potencia física.
              </p>
            </div>

            {/* 🧠 Smart-Pan Stage Framing Switch */}
            <div className="p-3.5 rounded-[var(--r-s)] bg-[var(--sunken)]/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[var(--acc-ink)] font-bold text-xs font-mono ">
                  <Radio className="w-4 h-4 text-[var(--acc-ink)]" />
                  <span>Smart-Pan framing dinámico</span>
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
                  <div className="w-9 h-5 bg-[var(--sunken)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--ink)] after:rounded-full after:h-4 after:w-4 after:transition-ui peer-checked:bg-[var(--acc)]"></div>
                </label>
              </div>
              <p className="text-micro font-sans text-[var(--ink-2)] leading-relaxed">
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
            <span className="text-micro font-mono font-bold text-[var(--ink-2)]">
              Estilos cinemáticos de subtítulos (Karaoke Word-by-Word):
            </span>
            <div className="flex items-center gap-2">
              <label className="text-micro font-mono text-[var(--acc-ink)] flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={injectEmojis}
                  onChange={(e) => onToggleInjectEmojis(e.target.checked)}
                  className="rounded bg-[var(--sunken)] text-[var(--acc-ink)] focus:ring-0"
                />
                <span>Auto-Emojis en Palabras Clave (<ShowIcon inline emoji="🎸" />, <ShowIcon inline emoji="🔥" />, <ShowIcon inline emoji="⚡" />)</span>
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
                  className={`p-3 rounded-[var(--r-s)] text-left transition-ui cursor-pointer flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'bg-[var(--acc)]/15 ring-1 ring-[var(--acc)]'
                      : 'bg-[var(--sunken)]/70 hover:bg-[var(--sunken)]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-micro font-mono font-bold text-[var(--ink)]">
                      {style.name}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[var(--acc-ink)]" />}
                  </div>

                  <div className="w-full py-2 flex items-center justify-center bg-[var(--scrim)]/60 rounded-[var(--r-s)] ">
                    <span className={`text-micro ${style.fontClass} ${style.colorClass} ${style.bgClass}`}>
                      {style.preview}
                    </span>
                  </div>

                  <span className="text-micro font-mono text-[var(--ink-2)] block">
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
            <div className={`p-3 rounded-[var(--r-s)] space-y-2 transition-ui ${
              showSpotifyBadge ? 'bg-[var(--ok)]/10 ' : 'bg-[var(--sunken)]/70 '
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[var(--ok)] font-bold text-xs font-mono">
                  <Music className="w-3.5 h-3.5 text-[var(--ok)]" />
                  <span>Audio en Spotify</span>
                </div>
                <input
                  type="checkbox"
                  checked={showSpotifyBadge}
                  onChange={(e) => onToggleSpotifyBadge(e.target.checked)}
                  className="rounded bg-[var(--sunken)] text-[var(--ok)] focus:ring-0 cursor-pointer"
                />
              </div>
              <p className="text-micro font-mono text-[var(--ink-2)]">
                Pill flotante que anima al usuario a buscar el single en plataformas.
              </p>
            </div>

            {/* Retention Bar */}
            <div className={`p-3 rounded-[var(--r-s)] space-y-2 transition-ui ${
              showRetentionProgressBar ? 'bg-[var(--alert)]/10 ' : 'bg-[var(--sunken)]/70 '
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[var(--alert)] font-bold text-xs font-mono">
                  <Flame className="w-3.5 h-3.5 text-[var(--alert)]" />
                  <span>Barra Retención TikTok</span>
                </div>
                <input
                  type="checkbox"
                  checked={showRetentionProgressBar}
                  onChange={(e) => onToggleRetentionProgressBar(e.target.checked)}
                  className="rounded bg-[var(--sunken)] text-[var(--alert)] focus:ring-0 cursor-pointer"
                />
              </div>
              <p className="text-micro font-mono text-[var(--ink-2)]">
                Línea de progreso luminosa para mantener al usuario hasta el solo final.
              </p>
            </div>

            {/* Tour / Concert Sticker */}
            <div className={`p-3 rounded-[var(--r-s)] space-y-2 transition-ui ${
              showTourSticker ? 'bg-[var(--acc)]/10 ' : 'bg-[var(--sunken)]/70 '
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[var(--acc-ink)] font-bold text-xs font-mono">
                  <Ticket className="w-3.5 h-3.5 text-[var(--acc-ink)]" />
                  <span>Sticker próximo bolo</span>
                </div>
                <input
                  type="checkbox"
                  checked={showTourSticker}
                  onChange={(e) => onToggleTourSticker(e.target.checked)}
                  className="rounded bg-[var(--sunken)] text-[var(--acc-ink)] focus:ring-0 cursor-pointer"
                />
              </div>
              <Input
                size="sm"
                type="text"
                value={tourStickerText}
                onChange={(e) => onUpdateTourStickerText(e.target.value)}
                placeholder="Ej: 🎟️ Gira 2026 · Próxima parada: Madrid"
                className="w-full"
              />
              {onSyncFromTourCRM && (
                <button
                  type="button"
                  onClick={onSyncFromTourCRM}
                  className="w-full text-micro font-mono text-[var(--ink)] hover:text-[var(--acc-ink)] bg-[var(--scrim)]/40 hover:bg-[var(--scrim)]/60 rounded py-1 flex items-center justify-center gap-1 cursor-pointer transition-ui bg-[var(--acc)]/10"
                >
                  <Sparkles className="w-2.5 h-2.5" /> Sincronizar con próxima fecha CRM
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
            <div className="p-3.5 rounded-[var(--r-s)] bg-[var(--sunken)]/80 space-y-2.5 text-left">
              <span className="text-micro font-mono font-bold text-[var(--ink-2)] block">
                Encuadre de Vídeo (Formato Vertical 9:16 Nativo):
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'full' as const, label: 'Pantalla Completa 9:16', desc: 'Encuadre limpio vertical para Reels/TikTok' },
                  { id: 'pip' as const, label: 'Reacción / Selfie', desc: 'Miniatura de cámara en esquina' }
                ].map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => onChangeLayoutMode(l.id)}
                    className={`p-2.5 rounded-[var(--r-s)] text-left transition-ui cursor-pointer ${
                      layoutMode === l.id
                        ? 'bg-[var(--acc)] text-[var(--on-acc)] font-bold '
                        : 'bg-[var(--sunken)] text-[var(--ink-2)] '
                    }`}
                  >
                    <span className="text-micro font-mono block">{l.label}</span>
                    <span className="text-micro font-sans opacity-80 block truncate">{l.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Safe Zone Overlay Toggle */}
            <div className="p-3.5 rounded-[var(--r-s)] bg-[var(--sunken)]/80 space-y-2.5 text-left flex flex-col justify-between">
              <div>
                <span className="text-micro font-mono font-bold text-[var(--ink-2)] block">
                  Simulador de Safe-Zone (Zona Segura):
                </span>
                <p className="text-micro font-sans text-[var(--ink-2)] mt-1">
                  Muestra las áreas donde los botones de Like, comentarios y el reproductor de TikTok/Instagram tapan la cara o los textos.
                </p>
              </div>

              <button
                type="button"
                onClick={onToggleSafeZone}
                className={`py-2 px-3 rounded-[var(--r-pill)] text-xs font-mono font-bold flex items-center justify-center gap-2 transition-ui cursor-pointer ${
                  showSafeZone
                    ? 'bg-[var(--acc)]/20 text-[var(--acc-ink)] '
                    : 'bg-[var(--sunken)] text-[var(--ink-2)] hover:bg-[var(--sunken)]'
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
