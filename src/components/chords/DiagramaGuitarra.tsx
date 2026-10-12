import React from 'react';
import type { FormaGuitarra, NotaGuitarra } from '../../utils/voicings';

const NOMBRE_CUERDA = ['E', 'A', 'D', 'G', 'B', 'E'];

/**
 * Mástil vertical de 5 trastes: puntos sobre las cuerdas que suenan, «x» en las que no, cejuela gruesa en posición
 * abierta. Con `intervalos` cada punto lleva su función (1, ♭3, 5…); `paso` dibuja la nota de paso hacia el siguiente.
 */
export const DiagramaGuitarra: React.FC<{
  forma: Pick<FormaGuitarra, 'trastes' | 'notas'>;
  intervalos?: boolean;
  paso?: NotaGuitarra | null;
  color?: string;
  etiqueta: string;
}> = ({ forma, intervalos, paso, color = 'var(--acc)', etiqueta }) => {
  const todos = [...forma.notas.map((n) => n.traste), ...(paso ? [paso.traste] : [])].filter((t) => t > 0);
  const min = todos.length ? Math.min(...todos) : 1;
  const max = todos.length ? Math.max(...todos) : 1;
  const abierta = max <= 4;
  const inicio = abierta ? 1 : min;
  const trastes = Math.max(4, max - inicio + 1);
  const dx = 12, dy = 11, izq = 12, arriba = 14;
  const ancho = izq + 5 * dx + 10;
  const alto = arriba + trastes * dy + 6;
  const x = (cuerda: number) => izq + cuerda * dx;
  const y = (traste: number) => arriba + (traste - inicio + 0.5) * dy;
  return (
    <svg viewBox={`0 0 ${ancho} ${alto}`} className="w-full max-w-[88px] mx-auto" role="img" aria-label={etiqueta}>
      {!abierta && <text x={3} y={arriba + dy * 0.62} fontSize={7} fontWeight="bold" fill="var(--acc-ink)">{inicio}</text>}
      {NOMBRE_CUERDA.map((c, i) => (
        <text key={i} x={x(i)} y={8} textAnchor="middle" fontSize={7} fill={forma.trastes[i] < 0 ? 'var(--ink-3)' : 'var(--ink-2)'}>
          {forma.trastes[i] < 0 ? '×' : c}
        </text>
      ))}
      <line data-cejuela={abierta ? 'true' : undefined} x1={x(0)} x2={x(5)} y1={arriba} y2={arriba} stroke={abierta ? 'var(--ink-2)' : 'var(--hair)'} strokeWidth={abierta ? 3 : 1} strokeLinecap="round" />
      {Array.from({ length: trastes }, (_, i) => (
        <line key={i} x1={x(0)} x2={x(5)} y1={arriba + (i + 1) * dy} y2={arriba + (i + 1) * dy} stroke="var(--hair)" strokeWidth={1} />
      ))}
      {NOMBRE_CUERDA.map((_, i) => (
        <line key={i} x1={x(i)} x2={x(i)} y1={arriba} y2={arriba + trastes * dy} stroke="var(--hair)" strokeWidth={1} />
      ))}
      {forma.notas.map((n, i) =>
        n.traste === 0 ? (
          <circle key={i} cx={x(n.cuerda)} cy={arriba - 5} r={3} fill="none" stroke="var(--ok)" strokeWidth={1.2} />
        ) : (
          <g key={i}>
            <circle cx={x(n.cuerda)} cy={y(n.traste)} r={4.8} fill={color} opacity={n.intervalo === '1' ? 1 : 0.75} />
            {intervalos && <text x={x(n.cuerda)} y={y(n.traste) + 2.4} textAnchor="middle" fontSize={5.6} fontWeight="bold" fill="var(--surface)">{n.intervalo}</text>}
          </g>
        )
      )}
      {paso && paso.traste > 0 && (
        <g>
          <circle cx={x(paso.cuerda)} cy={y(paso.traste)} r={4.8} fill="var(--tentative-soft)" stroke="var(--tentative)" strokeWidth={1.2} strokeDasharray="2 1.5" />
          <text x={x(paso.cuerda)} y={y(paso.traste) + 2.4} textAnchor="middle" fontSize={5.6} fontWeight="bold" fill="var(--tentative)">→</text>
        </g>
      )}
    </svg>
  );
};
