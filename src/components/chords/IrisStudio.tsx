import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { MOTORES_IRIS, type MotorIris } from '../../utils/separacionIris';

/**
 * Puerta de Iris dentro del Atril. Iris es una acción de la CANCIÓN (separar su audio en pistas),
 * no de una idea. Con pistas es la cabecera del mezclador; sin pistas, la invitación a separarlas.
 * No separa nada: deja elegir el motor y avisa al que la pinta, que es quien lanza la separación.
 */
const SelectorMotor: React.FC<{ onElegir: (m: MotorIris) => void }> = ({ onElegir }) => (
  <div className="flex flex-wrap gap-2 w-full" data-iris-motores>
    {MOTORES_IRIS.map(m => (
      <button
        key={m.motor}
        type="button"
        onClick={() => onElegir(m.motor)}
        className="flex flex-col items-start px-3 py-1.5 rounded-[var(--r-s)] bg-[var(--sunken)] text-[var(--ink)] hover:bg-[var(--acc-soft)] cursor-pointer transition-ui text-left"
      >
        <span className="text-xs font-bold font-sans">{m.nombre}</span>
        <span className="text-micro font-sans text-[var(--ink-2)]">{m.nota}</span>
      </button>
    ))}
  </div>
);

export const IrisStudio: React.FC<{
  pistas: number;
  motor?: string;
  tieneAudio: boolean;
  separando?: boolean;
  onSeparar?: (motor: MotorIris) => void;
}> = ({ pistas, motor, tieneAudio, separando, onSeparar }) => {
  const [eligiendo, setEligiendo] = useState(false);
  if (!tieneAudio) return null;
  const elegir = (m: MotorIris) => {
    setEligiendo(false);
    onSeparar?.(m);
  };

  if (pistas > 1) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-micro font-sans text-[var(--ink-2)]" data-iris-studio="listo">
        <span className="flex items-center gap-1.5 font-bold text-[var(--ink)]">
          <Sparkles className="w-3.5 h-3.5 text-[var(--acc-ink)]" aria-hidden="true" /> Iris Studio
        </span>
        <span>{pistas} pistas</span>
        {motor && <span className="px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--sunken)]">{motor}</span>}
        {onSeparar && (
          <button
            type="button"
            onClick={() => setEligiendo(v => !v)}
            disabled={separando}
            className="ml-auto px-2.5 py-0.5 rounded-[var(--r-pill)] bg-[var(--sunken)] text-[var(--ink)] hover:bg-[var(--acc-soft)] cursor-pointer transition-ui"
            title="Volver a separar con otro motor de Iris"
          >
            Cambiar motor
          </button>
        )}
        {eligiendo && onSeparar && <SelectorMotor onElegir={elegir} />}
      </div>
    );
  }

  if (!onSeparar) return null;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[var(--r-m)] bg-[var(--sunken)] p-3" data-iris-studio="vacio">
      <Sparkles className="w-5 h-5 text-[var(--acc-ink)] shrink-0" aria-hidden="true" />
      <p className="flex-1 min-w-[12rem] text-xs font-sans text-[var(--ink-2)]">
        <span className="font-bold text-[var(--ink)]">Iris Studio.</span> Separa voz, batería, bajo y más para tocar
        encima, aislar tu instrumento o ensayar sin él.
      </p>
      <button
        type="button"
        onClick={() => setEligiendo(v => !v)}
        disabled={separando}
        className="px-3 py-1 rounded-[var(--r-pill)] bg-[var(--acc)] text-[var(--on-acc)] text-xs font-bold font-sans cursor-pointer transition-ui"
      >
        Separar con Iris
      </button>
      {eligiendo && <SelectorMotor onElegir={elegir} />}
    </div>
  );
};
