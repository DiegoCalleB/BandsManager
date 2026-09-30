import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Clock, Zap, AlertCircle } from "lucide-react";
import { ThemeColors } from "../../types";
import { Button, IconButton } from '../ui';

interface EnsayoCronometroProps {
  totalEstimatedMin?: number;
  initialElapsedSeg?: number;
  onTimeUpdate?: (elapsedSeg: number) => void;
  colors?: ThemeColors;
  isCompact?: boolean;
}

export function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function EnsayoCronometro({
  totalEstimatedMin = 120,
  initialElapsedSeg = 0,
  onTimeUpdate,
  colors,
  isCompact = false,
}: EnsayoCronometroProps) {
  const [seconds, setSeconds] = useState(initialElapsedSeg);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    setSeconds(initialElapsedSeg);
  }, [initialElapsedSeg]);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = window.setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1;
          if (onTimeUpdate && next % 5 === 0) {
            onTimeUpdate(next);
          }
          return next;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, onTimeUpdate]);

  const toggleTimer = () => {
    const nextState = !isActive;
    setIsActive(nextState);
    if (!nextState && onTimeUpdate) {
      onTimeUpdate(seconds);
    }
  };

  const resetTimer = () => {
    if (window.confirm("¿Reiniciar el cronómetro del ensayo a 00:00?")) {
      setIsActive(false);
      setSeconds(0);
      if (onTimeUpdate) onTimeUpdate(0);
    }
  };

  const totalTargetSec = (totalEstimatedMin || 120) * 60;
  const progressPct = Math.min(
    100,
    Math.round((seconds / totalTargetSec) * 100),
  );
  const isOvertime = seconds > totalTargetSec;

  if (isCompact) {
    return (
      <div className="flex items-center gap-2 bg-[var(--surface)] rounded-[var(--r-m)] px-3 py-1.5">
        <Clock
          className={`w-3.5 h-3.5 ${isActive ? "text-[var(--acc)]" : "text-[var(--ink-2)]"}`}
        />
        <span
          className={`font-sans font-bold text-sm ${isOvertime ? "text-[var(--alert)]" : "text-[var(--ink)]"}`}
        >
          {formatTime(seconds)}
        </span>
        <Button
          variant={isActive ? "soft" : "soft"}
          size="xs"
          onClick={toggleTimer}
          title={isActive ? "Pausar Cronómetro" : "Iniciar Cronómetro"}
        >
          {isActive ? (
            <Pause className="w-3 h-3" />
          ) : (
            <Play className="w-3 h-3 fill-current" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-[var(--r-l)] bg-[var(--surface)]  relative overflow-hidden">
      {/* Background soft when running */}
      {isActive && (
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--acc)]/10 rounded-[var(--r-pill)] blur-3xl pointer-events-none" />
      )}

      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-[var(--r-s)] ${isActive ? "bg-[var(--acc)] text-[var(--on-acc)]" : "bg-[var(--surface)]/80 text-[var(--ink-2)]"}`}
          >
            <Clock className={`w-4 h-4 ${isActive ? "" : ""}`} />
          </div>
          <div>
            <h4 className="text-xs font-sans font-bold text-[var(--ink)]">
              Cronómetro de ensayo
            </h4>
            <p className="text-micro font-sans text-[var(--ink-2)]">
              Objetivo: {totalEstimatedMin} min planificados
            </p>
          </div>
        </div>

        {isOvertime && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-[var(--r-pill)] text-micro font-sans font-bold bg-[var(--alert)]/15 text-[var(--ink)]">
            <AlertCircle className="w-3 h-3" /> Tiempo excedido
          </span>
        )}
      </div>

      {/* Big Display */}
      <div className="flex items-baseline justify-between gap-4 my-2">
        <div className="flex items-baseline gap-2">
          <span
            className={`text-3xl sm:text-4xl font-sans font-black tracking-tight ${
              isOvertime
                ? "text-[var(--alert)]"
                : isActive
                  ? "text-[var(--acc)]"
                  : "text-[var(--ink)]"
            }`}
          >
            {formatTime(seconds)}
          </span>
          <span className="text-xs font-sans text-[var(--ink-2)]">
            / {formatTime(totalTargetSec)}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <Button
            variant={isActive ? "primary" : "primary"}
            size="sm"
            onClick={toggleTimer}
            className="items-center gap-1.5"
          >
            {isActive ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Iniciar</span>
              </>
            )}
          </Button>

          <IconButton
            label="Reiniciar cronómetro"
            onClick={resetTimer}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </IconButton>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3">
        <div className="w-full h-2 rounded-[var(--r-pill)] bg-[var(--sunken)] overflow-hidden">
          <div
            className={`h-full rounded-[var(--r-pill)] transition-ui duration-300 ${
              isOvertime
                ? "bg-[var(--alert)] "
                : progressPct > 80
                  ? "bg-[var(--acc)] "
                  : "bg-[var(--ok)] "
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-micro font-sans text-[var(--ink-2)] mt-1">
          <span>{progressPct}% completado</span>
          <span>
            {Math.max(0, Math.round((totalTargetSec - seconds) / 60))} min
            restantes
          </span>
        </div>
      </div>
    </div>
  );
}
