import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  BookOpen,
  Music,
  QrCode,
  Calendar,
  Disc,
  FileText,
  Sliders,
  Sparkles,
  Share2,
  Mic,
  Users,
  Smartphone,
  Radio,
  Layers,
  Zap,
  HelpCircle,
  Printer,
  Target,
  MapPin,
  MousePointer,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { ModuleTutorialConfig, ModuleTutorialId } from "../../types/tutorial";
import { MODULE_TUTORIALS } from "../../config/moduleTutorials";
import { ModalPortal } from "./ModalPortal";

interface ModuleTutorialModalProps {
  moduleId: ModuleTutorialId;
  isOpen: boolean;
  onClose: (markAsSeen?: boolean) => void;
}

const ICON_MAP = {
  BookOpen,
  Music,
  QrCode,
  Calendar,
  Disc,
  FileText,
  Sliders,
  Sparkles,
  Share2,
  Mic,
  Users,
  Smartphone,
  Radio,
  Layers,
  Zap,
  HelpCircle,
  Printer,
};

export const ModuleTutorialModal: React.FC<ModuleTutorialModalProps> = ({
  moduleId,
  isOpen,
  onClose,
}) => {
  const tutorialConfig: ModuleTutorialConfig | undefined =
    MODULE_TUTORIALS[moduleId];
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(true);
  const [isFloatingMode, setIsFloatingMode] = useState(true);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : true,
  );
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [targetFound, setTargetFound] = useState(false);
  const [isHighlighting, setIsHighlighting] = useState(false);

  // Monitor window size to adapt between desktop floating mode and full-screen mobile
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Reset step index and default directly to floating mode whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setIsFloatingMode(true);
    }
  }, [isOpen]);

  const effectiveFloatingMode = isDesktop && isFloatingMode;
  const currentStep = tutorialConfig?.steps[currentStepIndex];

  // Locate target element in the DOM and calculate its bounding box
  const locateTargetElement = useCallback(
    (shouldScroll = false) => {
      if (!currentStep?.uiTarget?.selector) {
        setTargetRect(null);
        setTargetFound(false);
        return null;
      }

      const selectors = currentStep.uiTarget.selector
        .split(",")
        .map((s) => s.trim());
      let el: Element | null = null;
      for (const sel of selectors) {
        try {
          const found = document.querySelector(sel);
          if (found) {
            el = found;
            break;
          }
        } catch (err) {
          // Ignore invalid selectors safely
        }
      }

      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
        setTargetFound(true);

        if (shouldScroll) {
          el.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "center",
          });
        }

        setIsHighlighting(true);
        setTimeout(() => setIsHighlighting(false), 2600);
        return el;
      } else {
        setTargetRect(null);
        setTargetFound(false);
        return null;
      }
    },
    [currentStep?.uiTarget?.selector],
  );

  // Monitor position and scroll to target when step changes or floating mode is active
  useEffect(() => {
    if (!isOpen || !currentStep) return;

    const timer = setTimeout(() => {
      locateTargetElement(effectiveFloatingMode);
    }, 180);

    const handleScrollOrResize = () => {
      locateTargetElement(false);
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [
    isOpen,
    currentStepIndex,
    effectiveFloatingMode,
    locateTargetElement,
    currentStep,
  ]);

  // Keyboard navigation: Escape to close, Left/Right arrows to step
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose(dontShowAgain);
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // Reposicionar automáticamente la tarjeta flotante si coincide con la posición del elemento señalado en pantalla
  const dockPosition = useMemo<
    "bottom-right" | "bottom-left" | "top-right" | "top-left"
  >(() => {
    if (!targetRect || typeof window === "undefined") return "bottom-right";

    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const cardW = 460;
    const cardH = 490;
    const buffer = 40;

    const checkCollision = (area: {
      left: number;
      right: number;
      top: number;
      bottom: number;
    }) => {
      return (
        targetRect.left - buffer < area.right &&
        targetRect.right + buffer > area.left &&
        targetRect.top - buffer < area.bottom &&
        targetRect.bottom + buffer > area.top
      );
    };

    // 1. Por defecto: Esquina inferior derecha
    const bottomRightArea = {
      left: winW - cardW,
      right: winW,
      top: winH - cardH,
      bottom: winH,
    };
    if (!checkCollision(bottomRightArea)) {
      return "bottom-right";
    }

    // 2. Si tapa el control en la esquina inferior derecha, mover a la esquina inferior izquierda
    const bottomLeftArea = {
      left: 0,
      right: cardW,
      top: winH - cardH,
      bottom: winH,
    };
    if (!checkCollision(bottomLeftArea)) {
      return "bottom-left";
    }

    // 3. Si ambos lados inferiores colisionan, mover a la esquina superior derecha
    const topRightArea = {
      left: winW - cardW,
      right: winW,
      top: 0,
      bottom: cardH,
    };
    if (!checkCollision(topRightArea)) {
      return "top-right";
    }

    // 4. Último recurso: esquina superior izquierda
    return "top-left";
  }, [targetRect]);

  if (!isOpen || !tutorialConfig || !currentStep) return null;

  const totalSteps = tutorialConfig.steps.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose(dontShowAgain);
    } else {
      setCurrentStepIndex((prev) => Math.min(totalSteps - 1, prev + 1));
    }
  };

  const handlePrev = () => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  };

  // Color accents based on module
  const accentStyles = {
    purple: {
      badgeBg: "bg-[var(--tentative)]/15 text-[var(--tentative)]/80/30",
      iconBox: "bg-[var(--tentative)]/20 text-[var(--acc)]/30",
      activeDot: "bg-[var(--acc)] w-7",
      primaryBtn:
        "bg-[var(--acc)] hover:bg-[var(--tentative)] text-[var(--ink)]",
      hookBorder: "bg-[var(--tentative)]/10 text-[var(--ink)]",
      highlightText: "text-[var(--acc)]",
      targetCard: "bg-[var(--tentative)]/5",
      targetBadge: "bg-[var(--tentative)]/20 text-[var(--tentative)]/80",
      targetBtn:
        "bg-[var(--tentative)]/20 hover:bg-[var(--tentative)]/30 text-[var(--tentative)]/80/40",
    },
    amber: {
      badgeBg: "bg-[var(--acc)]/15 text-[var(--acc)]/70 /30",
      iconBox: "bg-[var(--acc)]/20 text-[var(--acc)] /30",
      activeDot: "bg-[var(--acc)]/60 w-7",
      primaryBtn:
        "bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--on-acc)] font-black",
      hookBorder: "/25 bg-[var(--acc)]/10 text-[var(--acc)]",
      highlightText: "text-[var(--acc)]",
      targetCard: "/40 bg-[var(--acc)]/5",
      targetBadge: "bg-[var(--acc)]/20 text-[var(--acc)]/70 /30",
      targetBtn:
        "bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--acc)]/70 /40",
    },
    blue: {
      badgeBg: "bg-[var(--acc)]/15 text-[var(--ink-2)]/30",
      iconBox: "bg-[var(--acc)]/20 text-[var(--ink-2)]/30",
      activeDot: "bg-[var(--tentative)] w-7",
      primaryBtn:
        "bg-[var(--acc)] hover:bg-[var(--tentative)] text-[var(--ink)] font-bold",
      hookBorder: "bg-[var(--acc)]/10 text-[var(--tentative)]/40",
      highlightText: "text-[var(--ink-2)]",
      targetCard: "border-[var(--acc)]/40 bg-[var(--acc)]/5",
      targetBadge: "bg-[var(--acc)]/20 text-[var(--ink-2)]/30",
      targetBtn:
        "bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--ink-2)]/40",
    },
    emerald: {
      badgeBg: "bg-[var(--ok)]/15 text-[var(--ink-2)]/30",
      iconBox: "bg-[var(--ok)]/20 text-[var(--ok)]/30",
      activeDot: "bg-[var(--ok)] w-7",
      primaryBtn:
        "bg-[var(--ok)] hover:bg-[var(--ok)] text-[var(--ink)] font-black",
      hookBorder: "bg-[var(--ok)]/10 text-[var(--ok)]/40",
      highlightText: "text-[var(--ok)]",
      targetCard: "bg-[var(--ok)]/5",
      targetBadge: "bg-[var(--ok)]/20 text-[var(--ink-2)]/30",
      targetBtn:
        "bg-[var(--ok)]/20 hover:bg-[var(--ok)]/30 text-[var(--ink-2)]/40",
    },
    rose: {
      badgeBg: "bg-[var(--alert)]/15 text-[var(--ink-2)]/30",
      iconBox: "bg-[var(--alert)]/20 text-[var(--alert)]/30",
      activeDot: "bg-[var(--alert)] w-7",
      primaryBtn:
        "bg-[var(--alert)] hover:bg-[var(--alert)] text-[var(--ink)] font-bold",
      hookBorder: "bg-[var(--alert)]/10 text-[var(--alert)]/40",
      highlightText: "text-[var(--alert)]",
      targetCard: "bg-[var(--alert)]/5",
      targetBadge: "bg-[var(--alert)]/20 text-[var(--ink-2)]/30",
      targetBtn:
        "bg-[var(--alert)]/20 hover:bg-[var(--alert)]/30 text-[var(--ink-2)]/40",
    },
  }[tutorialConfig.accent];

  const CurrentIcon = ICON_MAP[currentStep.iconName] || BookOpen;

  const dockClass = {
    "bottom-right": "items-end justify-end",
    "bottom-left": "items-end justify-start",
    "top-right": "items-start justify-end",
    "top-left": "items-start justify-start",
  }[dockPosition];

  return (
    <ModalPortal isOpen={isOpen} onClose={() => onClose(dontShowAgain)}>
      {/* SPOTLIGHT LIVE HIGHLIGHT ON THE APP'S SCREEN (Only on Desktop Floating Mode) */}
      {targetRect && effectiveFloatingMode && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          <div
            className="absolute sm:border-3 rounded-[var(--r-m)] transition-all duration-300 pointer-events-none"
            style={{
              top: Math.max(0, targetRect.top - 4),
              left: Math.max(0, targetRect.left - 4),
              width: targetRect.width + 8,
              height: targetRect.height + 8,
            }}
          >
            {/* Corner Ping Beacon */}
            <span className="absolute -top-2 -right-2 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--acc)]/60 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-[var(--acc)]"></span>
            </span>

            {/* Target Tooltip Badge */}
            <div
              className={`absolute ${targetRect.top < 36 ? "-bottom-7" : "-top-7"} left-0 px-2 py-0.5 rounded-md bg-[var(--acc)] text-[var(--ink)] font-sans font-black text-[10px] tracking-wider flex items-center gap-1 whitespace-nowrap`}
            >
              <span>👉 {currentStep.uiTarget?.label || "Aquí"}</span>
            </div>
          </div>
        </div>
      )}

      <div
        id={`tutorial-modal-overlay-${moduleId}`}
        className={
          effectiveFloatingMode
            ? `fixed inset-0 z-[10000] pointer-events-none p-3 sm:p-5 flex ${dockClass} transition-all duration-300`
            : "fixed inset-0 z-[10000] bg-[var(--scrim)]/85 flex items-center justify-center p-0 md:p-4 overflow-y-auto"
        }
        onClick={(e) => {
          if (!effectiveFloatingMode && e.target === e.currentTarget) {
            onClose(dontShowAgain);
          }
        }}
      >
        <motion.div
          id={`tutorial-modal-dialog-${moduleId}`}
          layout
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className={
            effectiveFloatingMode
              ? "pointer-events-auto relative w-full sm:w-[440px] max-w-[calc(100vw-24px)] bg-[var(--surface)]/95  rounded-[var(--r-l)] shadow-black/95 overflow-hidden flex flex-col"
              : "relative w-full h-full md:h-auto md:max-w-xl bg-[var(--surface)] rounded-none md:rounded-3xl shadow-black/80 overflow-hidden flex flex-col my-0 md:my-auto"
          }
        >
          {/* TOP BAR: Module Badge + Mode Switcher (Desktop only) + Steps dots + Close button */}
          <div className="p-3.5 sm:p-4/70 flex items-center justify-between bg-[var(--surface)]/80 shrink-0">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-bold tracking-wider ${accentStyles.badgeBg}`}
              >
                {tutorialConfig.badge}
              </span>
              <span className="text-[11px] font-sans text-[var(--ink-2)] hidden xs:inline">
                Paso {currentStepIndex + 1}/{totalSteps}
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Toggle Floating Tour Card / Centered Card - Only on Desktop */}
              {isDesktop && (
                <button
                  type="button"
                  onClick={() => {
                    const nextMode = !isFloatingMode;
                    setIsFloatingMode(nextMode);
                    if (nextMode) {
                      setTimeout(() => locateTargetElement(true), 150);
                    }
                  }}
                  className="p-1.5 px-2 rounded-[var(--r-s)] text-[var(--ink-2)] hover:text-[var(--acc)]/70 hover:bg-[var(--surface)]/60 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-sans"
                  title={
                    isFloatingMode
                      ? "Expandir a tarjeta centrada"
                      : "Fijar como tarjeta flotante en esquina para ver la pantalla"
                  }
                >
                  {isFloatingMode ? (
                    <>
                      <Maximize2 className="w-3.5 h-3.5 text-[var(--acc)]" />
                      <span>Centrar</span>
                    </>
                  ) : (
                    <>
                      <Minimize2 className="w-3.5 h-3.5 text-[var(--acc)]" />
                      <span>Flotante</span>
                    </>
                  )}
                </button>
              )}

              {/* Dots navigation */}
              <div className="flex items-center gap-1.5 mx-1">
                {tutorialConfig.steps.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentStepIndex(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === currentStepIndex
                        ? accentStyles.activeDot
                        : "w-1.5 bg-[var(--sunken)] hover:bg-[var(--sunken)]"
                    }`}
                    title={`Ir al paso ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                id={`tutorial-close-btn-${moduleId}`}
                type="button"
                onClick={() => onClose(dontShowAgain)}
                className="p-1.5 rounded-[var(--r-m)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]/60 transition-colors cursor-pointer"
                title="Cerrar guía (Esc)"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* MAIN STEP CONTENT */}
          <div
            className={`p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 ${effectiveFloatingMode ? "max-h-[60vh]" : "max-h-none md:max-h-[70vh]"}`}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.16 }}
                className="space-y-3.5"
              >
                {/* Step Header with Icon */}
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-[var(--r-m)] shrink-0 ${accentStyles.iconBox}`}
                  >
                    <CurrentIcon className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[10px] font-sans tracking-widest text-[var(--ink-2)] font-semibold block">
                      {currentStep.badge}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold font-display tracking-tight text-[var(--ink)] leading-snug">
                      {currentStep.title}
                    </h3>
                  </div>
                </div>

                {/* Practical Takeaway / Musician Hook */}
                <div
                  className={`p-3 rounded-[var(--r-m)] text-xs leading-relaxed font-sans ${accentStyles.hookBorder}`}
                >
                  <p className="font-medium">{currentStep.musicianHook}</p>
                </div>

                {/* TARJETITA DE REFERENCIA AL BOTÓN O SECCIÓN EN LA APP */}
                {currentStep.uiTarget && (
                  <div
                    className={`rounded-[var(--r-l)] p-3.5 space-y-2.5 ${accentStyles.targetCard}`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--acc)]/60 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--acc)]"></span>
                        </span>
                        <span className="text-[10px] font-sans font-bold tracking-wider text-[var(--acc)]/70">
                          {currentStep.uiTarget.type === "button"
                            ? "🔘 Botón en pantalla"
                            : currentStep.uiTarget.type === "tab"
                              ? "📑 Pestaña / Vista"
                              : currentStep.uiTarget.type === "menu"
                                ? "⚙️ Menú de opciones"
                                : currentStep.uiTarget.type === "section"
                                  ? "📦 Bloque / Sección"
                                  : "🎯 Control en pantalla"}
                        </span>
                      </div>

                      {/* Botón Señalar en Pantalla - SOLO EN ESCRITORIO (en móvil no cabe ni tiene sentido) */}
                      {isDesktop && currentStep.uiTarget.selector && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsFloatingMode(true);
                            setTimeout(() => locateTargetElement(true), 100);
                          }}
                          className={`text-[11px] font-sans font-bold px-2.5 py-1 rounded-[var(--r-s)] flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${accentStyles.targetBtn}`}
                          title="Fijar modo flotante y enfocar este elemento en la pantalla"
                        >
                          <Target className="w-3.5 h-3.5 text-[var(--acc)]" />
                          <span>Señalar en pantalla</span>
                        </button>
                      )}
                    </div>

                    {/* Nombre del elemento simulando botón o control */}
                    <div className="flex items-center gap-2 p-2 rounded-[var(--r-m)] bg-[var(--bg)]/90 text-xs">
                      <span className="text-[var(--acc)] font-sans font-black text-xs shrink-0">
                        {currentStep.uiTarget.type === "button" ? "▶" : "▪"}
                      </span>
                      <span className="font-bold text-[var(--ink)] font-sans truncate">
                        {currentStep.uiTarget.label}
                      </span>
                    </div>

                    {/* Ubicación y Para qué sirve */}
                    <div className="grid grid-cols-1 gap-1.5 text-[11px] font-sans text-[var(--ink-2)]/80">
                      <div className="flex items-start gap-1.5 text-[var(--ink-2)]">
                        <MapPin className="w-3.5 h-3.5 text-[var(--acc)] shrink-0 mt-0.5" />
                        <span className="leading-tight">
                          <strong className="text-[var(--ink-2)]/80 font-semibold">
                            Dónde está:
                          </strong>{" "}
                          {currentStep.uiTarget.location}
                        </span>
                      </div>
                      <div className="flex items-start gap-1.5 text-[var(--ink-2)]">
                        <MousePointer className="w-3.5 h-3.5 text-[var(--acc)] shrink-0 mt-0.5" />
                        <span className="leading-tight">
                          <strong className="text-[var(--ink-2)]/80 font-semibold">
                            Para qué sirve:
                          </strong>{" "}
                          {currentStep.uiTarget.actionHint}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step Description */}
                <p className="text-xs sm:text-sm text-[var(--ink-2)]/80 leading-relaxed">
                  {currentStep.description}
                </p>

                {/* Key takeaways pills / cards */}
                <div
                  className={`grid gap-2 pt-0.5 ${effectiveFloatingMode ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}
                >
                  {currentStep.keyPoints.map((point, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-[var(--r-m)] bg-[var(--surface)]/80 flex flex-col justify-between space-y-0.5 hover:bg-[var(--surface)] transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <Check
                          className={`w-3.5 h-3.5 shrink-0 ${accentStyles.highlightText}`}
                        />
                        <h4 className="text-xs font-bold text-[var(--ink)] font-sans">
                          {point.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-[var(--ink-2)] leading-normal pl-5">
                        {point.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* BOTTOM ACTIONS BAR */}
          <div className="p-3.5 sm:p-4/80 bg-[var(--bg)]/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
            {/* Don't show again toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-sans text-[var(--ink-2)] hover:text-[var(--ink-2)]/80">
              <input
                id={`tutorial-dont-show-again-checkbox-${moduleId}`}
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded bg-[var(--surface)]/80 text-[var(--acc)] focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
              />
              <span className="truncate">
                No volver a abrir automáticamente
              </span>
            </label>

            {/* Nav buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {!isFirstStep && (
                <button
                  id={`tutorial-prev-btn-${moduleId}`}
                  type="button"
                  onClick={handlePrev}
                  className="px-3 py-1.5 rounded-[var(--r-m)] bg-[var(--surface)]/60 hover:bg-[var(--sunken)] text-[var(--ink)]/80 text-xs font-sans font-bold transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Anterior</span>
                </button>
              )}

              <button
                id={`tutorial-next-btn-${moduleId}`}
                type="button"
                onClick={handleNext}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-[var(--r-m)] text-xs font-sans font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${accentStyles.primaryBtn}`}
              >
                {isLastStep ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>¡Entendido, a tocar!</span>
                  </>
                ) : (
                  <>
                    <span>Siguiente</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </ModalPortal>
  );
};
