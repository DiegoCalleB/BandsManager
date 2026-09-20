import React from 'react';
import { Calendar, BookOpen, Disc3, ArrowRight, Sparkles, X, CheckCircle2, Music2, ShieldCheck, Globe, Check } from 'lucide-react';
import { NavItemId } from '../../config/navGroups';
import { markOnboardingCompleted } from '../../utils/userPreferences';
import { useLanguage, SUPPORTED_LANGUAGES, SupportedLanguage } from '../../context/LanguageContext';

interface MusicianOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMission: (view: NavItemId) => void;
  bandName: string;
}

export const MusicianOnboardingModal: React.FC<MusicianOnboardingModalProps> = ({
  isOpen,
  onClose,
  onSelectMission,
  bandName,
}) => {
  const { language: currentAppLang, setLanguage: setAppLang } = useLanguage();

  if (!isOpen) return null;

  const handleChooseMission = (view: NavItemId) => {
    markOnboardingCompleted(undefined, { onboarding: true }, true).catch(() => {});
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bandmanager_onboarding_finished'));
    }
    onSelectMission(view);
    onClose();
  };

  const handleDismiss = () => {
    markOnboardingCompleted(undefined, { onboarding: true }, true).catch(() => {});
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bandmanager_onboarding_finished'));
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-2xl bg-[#141312] border border-[#2b2926] rounded-[var(--r-l)] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Decorative Top Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-24 bg-amber-500/10 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-[#23211e] relative shrink-0">
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-5 right-5 p-1.5 rounded-[var(--r-s)] text-text-[var(--ink-2)] hover:text-white hover:bg-neutral-800/60 transition-colors cursor-pointer"
            title="Cerrar guía"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border /30 text-amber-300 text-[11px] font-mono font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Primeros Pasos para Músicos</span>
            </div>

            {/* Quick Language Selector */}
            <div className="flex items-center gap-1 pr-8 sm:pr-0">
              {SUPPORTED_LANGUAGES.map((l) => {
                const isSelected = currentAppLang === l.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setAppLang(l.code)}
                    className={`px-2 py-1 rounded-[var(--r-s)] text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-amber-400 text-stone-950 font-bold shadow-sm scale-105'
                        : 'bg-neutral-800/70 hover:bg-neutral-800 text-text-[var(--ink-3)] border border-white/5'
                    }`}
                    title={l.label}
                  >
                    <span>{l.flag}</span>
                    <span className="hidden sm:inline">{l.label.slice(0, 3)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-wide">
            ¡Hola, {bandName}! ¿Por dónde empezamos hoy?
          </h2>
          <p className="text-xs sm:text-sm text-text-[var(--ink-2)] mt-1 max-w-lg">
            Olvídate de paneles complicados o términos de oficina. Elige tu necesidad inmediata y te llevamos directo a la acción:
          </p>
        </div>

        {/* Content: 3 Missions */}
        <div className="p-4 sm:p-6 space-y-3 overflow-y-auto">
          {/* Misión 1: Bolo / Concierto */}
          <div
            onClick={() => handleChooseMission('calendario')}
            className="group relative p-4 rounded-[var(--r-m)] bg-[#1b1917] hover:bg-[#23201d] border border-[#2b2926] hover:/50 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:shadow-amber-500/5"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-[var(--r-m)] bg-amber-500/20 text-amber-400 border /30 shrink-0 group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                    Tengo un bolo o concierto a la vista
                  </h3>
                  <span className="text-[9px] font-mono uppercase font-extrabold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300">
                    Rápido
                  </span>
                </div>
                <p className="text-xs text-text-[var(--ink-2)] leading-relaxed">
                  Apunta la sala, fecha, caché y horarios de prueba para que toda la banda tenga la ficha técnica a mano sin preguntar por WhatsApp.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[var(--r-s)] bg-amber-500/15 group-hover:bg-amber-500 text-amber-300 group-hover:text-stone-950 text-xs font-mono font-bold transition-all shrink-0 cursor-pointer"
            >
              <span>Ir al Calendario</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Misión 2: Dossier / EPK */}
          <div
            onClick={() => handleChooseMission('epk')}
            className="group relative p-4 rounded-[var(--r-m)] bg-[#1b1917] hover:bg-[#23201d] border border-[#2b2926] hover:border-sky-500/50 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:shadow-sky-500/5"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-[var(--r-m)] bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors">
                    Crear mi Dossier (EPK) para salas
                  </h3>
                  <span className="text-[9px] font-mono uppercase font-extrabold px-1.5 py-0.5 rounded bg-sky-400/20 text-sky-300">
                    Recomendado
                  </span>
                </div>
                <p className="text-xs text-text-[var(--ink-2)] leading-relaxed">
                  Ten tu web de prensa con biografía, fotos en alta, enlaces de Spotify/YouTube y rider técnico lista para compartir con programadores.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[var(--r-s)] bg-sky-500/15 group-hover:bg-sky-500 text-sky-300 group-hover:text-stone-950 text-xs font-mono font-bold transition-all shrink-0 cursor-pointer"
            >
              <span>Configurar Dossier</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Misión 3: Repertorio / Setlist */}
          <div
            onClick={() => handleChooseMission('repertorio')}
            className="group relative p-4 rounded-[var(--r-m)] bg-[#1b1917] hover:bg-[#23201d] border border-[#2b2926] hover:border-emerald-500/50 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:shadow-emerald-500/5"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-[var(--r-m)] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0 group-hover:scale-105 transition-transform">
                <Disc3 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                    Organizar el repertorio y las canciones
                  </h3>
                </div>
                <p className="text-xs text-text-[var(--ink-2)] leading-relaxed">
                  Crea setlists para conciertos o ensayos. Añade temas, notas de afinación, letras y duraciones para saber exactamente cuánto dura tu show.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[var(--r-s)] bg-emerald-500/15 group-hover:bg-emerald-500 text-emerald-300 group-hover:text-stone-950 text-xs font-mono font-bold transition-all shrink-0 cursor-pointer"
            >
              <span>Ver Repertorios</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#23211e] bg-[#100f0e] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-text-[var(--ink-2)]">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Tus datos y cambios se guardan automáticamente en tiempo real.</span>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="w-full sm:w-auto px-4 py-2 rounded-[var(--r-s)] bg-neutral-800 hover:bg-neutral-700 text-text-[var(--ink-3)] hover:text-white text-xs font-mono font-bold transition-colors cursor-pointer"
          >
            Explorar por mi cuenta
          </button>
        </div>
      </div>
    </div>
  );
};
