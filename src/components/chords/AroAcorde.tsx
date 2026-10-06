import React from 'react';

interface Props {
  /** Nombre ya formateado del acorde (o «—» si no hay acorde claro). */
  nombre: string;
  /** 0-1: cuánto del acorde ha transcurrido; el aro se llena hasta el cambio. */
  progreso: number;
  /** Segundos que faltan para el cambio; null = no mostrar (pausa o sin siguiente). */
  restante: number | null;
  tamano?: number;
  /** Aro apagado y sin progreso (el acorde siguiente). */
  tenue?: boolean;
  etiqueta?: string;
  testId?: string;
}

/** Último segundo del acorde: el aro cambia de color para avisar «ya viene el cambio». */
const AVISO_CAMBIO = 0.8;

/**
 * Aro de progreso de un acorde, como los loops de GarageBand: se va llenando mientras suena y el
 * número del centro cuenta los segundos que faltan para el cambio. El color avisa en el último
 * momento para poder anticiparse al siguiente acorde.
 */
export const AroAcorde: React.FC<Props> = ({ nombre, progreso, restante, tamano = 84, tenue = false, etiqueta, testId }) => {
  const trazo = Math.max(4, Math.round(tamano / 14));
  const radio = (tamano - trazo) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const avisando = !tenue && restante !== null && restante <= AVISO_CAMBIO;
  const color = avisando ? 'var(--tentative)' : 'var(--acc)';
  return (
    <div
      translate="no"
      className="notranslate flex flex-col items-center gap-1 shrink-0"
      role="img"
      aria-label={`${etiqueta ? etiqueta + ': ' : ''}${nombre}${restante !== null ? `, cambia en ${restante.toFixed(1)} segundos` : ''}`}
    >
      {etiqueta && <span className="text-micro text-[var(--ink-2)] leading-none">{etiqueta}</span>}
      <div className="relative" style={{ width: tamano, height: tamano }}>
        <svg width={tamano} height={tamano} viewBox={`0 0 ${tamano} ${tamano}`} className="-rotate-90" aria-hidden="true">
          <circle cx={tamano / 2} cy={tamano / 2} r={radio} fill="none" stroke="var(--hair)" strokeWidth={trazo} strokeDasharray={tenue ? '3 5' : undefined} opacity={tenue ? 0.7 : 1} />
          {!tenue && (
            <circle
              cx={tamano / 2}
              cy={tamano / 2}
              r={radio}
              fill="none"
              stroke={color}
              strokeWidth={trazo}
              strokeLinecap="round"
              strokeDasharray={circunferencia}
              strokeDashoffset={circunferencia * (1 - Math.min(1, Math.max(0, progreso)))}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span
            data-testid={testId}
            className={`font-bold font-mono ${tenue ? 'text-[var(--ink-2)]' : 'text-[var(--ink)]'}`}
            style={{ fontSize: tamano * (nombre.length > 3 ? 0.25 : 0.32) }}
          >
            {nombre}
          </span>
          {restante !== null && (
            <span className={`font-mono mt-0.5 ${avisando ? 'text-[var(--tentative)] font-bold' : 'text-[var(--ink-2)]'}`} style={{ fontSize: Math.max(10, tamano * 0.15) }}>
              {restante.toFixed(1)} s
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
