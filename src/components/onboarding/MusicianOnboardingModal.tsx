import React from "react";
import {
  Calendar,
  BookOpen,
  Disc3,
  ArrowRight,
  X,
  CheckCircle2,
  Music2,
  ShieldCheck,
  Globe,
  Check,
} from "lucide-react";
import { NavItemId } from "../../config/navGroups";
import { markOnboardingCompleted } from "../../utils/userPreferences";
import {
  useLanguage,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
} from "../../context/LanguageContext";

interface MusicianOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMission: (view: NavItemId) => void;
  bandName: string;
}

export const MusicianOnboardingModal: React.FC<
  MusicianOnboardingModalProps
> = ({ isOpen, onClose, onSelectMission, bandName }) => {
  const { language: currentAppLang, setLanguage: setAppLang } = useLanguage();

  if (!isOpen) return null;

  const handleChooseMission = (view: NavItemId) => {
    markOnboardingCompleted(undefined, { onboarding: true }, true).catch(
      () => {},
    );
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("bandmanager_onboarding_finished"));
    }
    onSelectMission(view);
    onClose();
  };

  const handleDismiss = () => {
    markOnboardingCompleted(undefined, { onboarding: true }, true).catch(
      () => {},
    );
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("bandmanager_onboarding_finished"));
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-[var(--scrim)]/80 animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-2xl bg-[var(--surface)] rounded-[var(--r-l)] overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Decorative Top Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-24 bg-[var(--acc)]/10 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 relative shrink-0">
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-5 right-5 p-1.5 rounded-[var(--r-s)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]/80 transition-colors cursor-pointer"
            title="Cerrar guía"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--r-pill)] bg-[var(--acc)]/15 text-[var(--acc)]/70 text-xs font-sans font-bold">
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
                    className={`px-2 py-1 rounded-[var(--r-pill)] text-xs font-sans font-semibold transition-ui cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? "bg-[var(--acc)]/60 text-[var(--on-acc)] font-bold scale-105"
                        : "bg-[var(--surface)]/80 hover:bg-[var(--surface)]/80 text-[var(--ink-2)]"
                    }`}
                    title={l.label}
                  >
                    <span>{l.flag}</span>
                    <span className="hidden sm:inline">
                      {l.label.slice(0, 3)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-display text-[var(--ink)] tracking-wide">
            ¡Hola, {bandName}! ¿Por dónde empezamos hoy?
          </h2>
          <p className="text-xs sm:text-sm text-[var(--ink-2)] mt-1 max-w-lg">
            Olvídate de paneles complicados o términos de oficina. Elige tu
            necesidad inmediata y te llevamos directo a la acción:
          </p>
        </div>

        {/* Content: 3 Missions */}
        <div className="p-4 sm:p-6 space-y-3 overflow-y-auto">
          {/* Misión 1: Bolo / Concierto */}
          <div
            onClick={() => handleChooseMission("calendario")}
            className="group relative p-4 rounded-[var(--r-m)] bg-[var(--sunken)] hover:bg-[var(--surface)]  transition-ui cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 "
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--acc)]/20 text-[var(--acc)] shrink-0 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[var(--ink)] group-hover:text-[var(--acc)] transition-colors">
                    Tengo un bolo o concierto a la vista
                  </h3>
                  <span className="text-micro font-sans font-extrabold px-1.5 py-0.5 rounded bg-[var(--acc)]/60 text-[var(--acc)]/70">
                    Rápido
                  </span>
                </div>
                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  Apunta la sala, fecha, caché y horarios de prueba para que
                  toda la banda tenga la ficha técnica a mano sin preguntar por
                  WhatsApp.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[var(--r-s)] bg-[var(--acc)]/15 group-hover:bg-[var(--acc)] text-[var(--acc)]/70 group-hover:text-[var(--on-acc)] text-xs font-sans font-bold transition-ui shrink-0 cursor-pointer"
            >
              <span>Ir al Calendario</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Misión 2: Dossier / EPK */}
          <div
            onClick={() => handleChooseMission("epk")}
            className="group relative p-4 rounded-[var(--r-m)] bg-[var(--sunken)] hover:bg-[var(--acc-soft)] transition-ui cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--acc)]/20 text-[var(--acc)] shrink-0 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[var(--ink)] group-hover:text-[var(--acc)] transition-colors">
                    Crear mi Dossier (EPK) para salas
                  </h3>
                  <span className="text-micro font-sans font-extrabold px-1.5 py-0.5 rounded bg-[var(--acc)]/20 text-[var(--acc)]">
                    Recomendado
                  </span>
                </div>
                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  Ten tu web de prensa con biografía, fotos en alta, enlaces de
                  Spotify/YouTube y rider técnico lista para compartir con
                  programadores.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[var(--r-s)] bg-[var(--acc)]/15 group-hover:bg-[var(--acc)] text-[var(--acc)] group-hover:text-[var(--on-acc)] text-xs font-sans font-bold transition-ui shrink-0 cursor-pointer"
            >
              <span>Configurar dossier</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Misión 3: Repertorio / Setlist */}
          <div
            onClick={() => handleChooseMission("repertorio")}
            className="group relative p-4 rounded-[var(--r-m)] bg-[var(--sunken)] hover:bg-[var(--ok-soft)] transition-ui cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--ok)]/20 text-[var(--ok)] shrink-0 transition-transform">
                <Disc3 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[var(--ink)] group-hover:text-[var(--ok)] transition-colors">
                    Organizar el repertorio y las canciones
                  </h3>
                </div>
                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  Crea setlists para conciertos o ensayos. Añade temas, notas de
                  afinación, letras y duraciones para saber exactamente cuánto
                  dura tu show.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[var(--r-s)] bg-[var(--ok)]/15 group-hover:bg-[var(--ok)] text-[var(--ink-2)] group-hover:text-[var(--acc-ink)] text-xs font-sans font-bold transition-ui shrink-0 cursor-pointer"
            >
              <span>Ver Repertorios</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-[var(--sunken)] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-[var(--ink-2)]">
            <ShieldCheck className="w-4 h-4 text-[var(--acc)] shrink-0" />
            <span>
              Tus datos y cambios se guardan automáticamente en tiempo real.
            </span>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="w-full sm:w-auto px-4 py-2 rounded-[var(--r-s)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] hover:text-[var(--ink)] text-xs font-sans font-bold transition-colors cursor-pointer"
          >
            Explorar por mi cuenta
          </button>
        </div>
      </div>
    </div>
  );
};
