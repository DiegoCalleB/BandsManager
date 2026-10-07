import React, { useState } from 'react';
import { buscarFormaGuitarra } from '../../utils/chordUtils';
import { instrumentoDelUsuario } from '../../utils/instrumentoProfesor';
import { CUERDAS_BAJO, notasParaDibujar, posicionesDeBajo, type VistaAcorde } from '../../utils/vistaAcordes';

const BLANCAS = [0, 2, 4, 5, 7, 9, 11];
/** Teclas negras: clase de nota y posición (en teclas blancas) del borde izquierdo de la negra. */
const NEGRAS: Array<[number, number]> = [[1, 0.65], [3, 1.65], [6, 3.65], [8, 4.65], [10, 5.65]];
const OCTAVAS = 2;

/** Teclado de 2 octavas con las notas del acorde iluminadas (la raíz, más fuerte). */
export const TecladoAcorde: React.FC<{ acorde: string }> = ({ acorde }) => {
  const n = notasParaDibujar(acorde);
  if (!n) return <p className="text-micro text-[var(--ink-2)] font-sans">[Acorde no reconocido]</p>;
  const w = 10, h = 40, hn = 24;
  const total = BLANCAS.length * OCTAVAS;
  const claseNota = (pc: number, base: string) =>
    pc === n.raiz ? 'fill-[var(--acc)]' : n.notas.includes(pc) ? 'fill-[var(--acc-soft)]' : base;
  return (
    <svg viewBox={`0 0 ${total * w} ${h}`} className="w-full" role="img" aria-label={`Teclado: ${acorde}`}>
      {Array.from({ length: total }, (_, i) => (
        <rect key={`b${i}`} x={i * w + 0.5} y={0} width={w - 1} height={h} rx={1} className={claseNota(BLANCAS[i % 7], 'fill-[var(--surface)]')} />
      ))}
      {Array.from({ length: OCTAVAS }, (_, o) =>
        NEGRAS.map(([pc, x]) => (
          <rect key={`n${o}-${pc}`} x={(o * 7 + x) * w} y={0} width={w * 0.7} height={hn} rx={1} className={claseNota(pc, 'fill-[var(--ink)]')} />
        ))
      )}
    </svg>
  );
};

/** Mástil de bajo (4 cuerdas): raíz, quinta y octava, el patrón con el que un bajista sostiene el acorde. */
export const BajoAcorde: React.FC<{ acorde: string }> = ({ acorde }) => {
  const pos = posicionesDeBajo(acorde);
  if (!pos) return <p className="text-micro text-[var(--ink-2)] font-sans">[Acorde no reconocido]</p>;
  const trastes = 8, w = 14, h = 12;
  return (
    <svg viewBox={`0 0 ${(trastes + 1) * w} ${4 * h + 6}`} className="w-full" role="img" aria-label={`Bajo: ${acorde}`}>
      {CUERDAS_BAJO.map((c, i) => {
        const y = 4 + (3 - i) * h;
        return (
          <g key={c.nombre}>
            <line x1={w} x2={(trastes + 1) * w} y1={y} y2={y} stroke="var(--hair)" strokeWidth={1} />
            <text x={w / 2} y={y + 3} textAnchor="middle" fontSize={7} className="fill-[var(--ink-2)]">{c.nombre}</text>
          </g>
        );
      })}
      {Array.from({ length: trastes }, (_, i) => (
        <line key={i} x1={(i + 1) * w + w / 2} x2={(i + 1) * w + w / 2} y1={4} y2={4 + 3 * h} stroke="var(--hair)" strokeWidth={0.5} />
      ))}
      {pos.map((p) => {
        const cx = p.traste === 0 ? w * 0.75 : (p.traste + 1) * w - w / 2 + 0.5;
        const cy = 4 + (3 - p.cuerda) * h;
        return (
          <g key={p.rol}>
            <circle cx={cx} cy={cy} r={4.5} className={p.rol === 'raiz' ? 'fill-[var(--acc)]' : 'fill-[var(--acc-soft)]'} />
            <text x={cx} y={cy + 2.5} textAnchor="middle" fontSize={6.5} fontWeight="bold" className={p.rol === 'raiz' ? 'fill-[var(--surface)]' : 'fill-[var(--acc-ink)]'}>
              {p.traste}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export const ETIQUETA_VISTA: Record<VistaAcorde, string> = { guitarra: 'Guitarra', teclado: 'Piano', bajo: 'Bajo' };

/** Pastillas para elegir cómo se dibujan los acordes (guitarra / piano / bajo). */
export const SelectorVistaAcorde: React.FC<{ vista: VistaAcorde; onCambio: (v: VistaAcorde) => void }> = ({ vista, onCambio }) => (
  <span className="flex items-center gap-1 bg-[var(--surface)] rounded-[var(--r-pill)] p-0.5" role="group" aria-label="Instrumento de los diagramas">
    {(Object.keys(ETIQUETA_VISTA) as VistaAcorde[]).map((v) => (
      <button
        key={v}
        type="button"
        aria-pressed={v === vista}
        onClick={() => onCambio(v)}
        className={`px-2 py-0.5 rounded-[var(--r-pill)] text-micro font-sans cursor-pointer transition-ui ${v === vista ? 'bg-[var(--sunken)] text-[var(--ink)] font-bold' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'}`}
      >
        {ETIQUETA_VISTA[v]}
      </button>
    ))}
  </span>
);

const CLAVE_VISTA = 'bm_vista_acordes';

/** Instrumento con el que se dibujan los acordes: el último que eligió el usuario o, si no, el de su perfil. */
export function useVistaAcordes(): [VistaAcorde, (v: VistaAcorde) => void] {
  const [vista, setVista] = useState<VistaAcorde>(() => {
    try {
      const g = localStorage.getItem(CLAVE_VISTA);
      if (g === 'guitarra' || g === 'teclado' || g === 'bajo') return g;
    } catch { /* sin almacenamiento */ }
    const i = instrumentoDelUsuario();
    return i === 'teclado' || i === 'bajo' ? i : 'guitarra';
  });
  const cambiar = (v: VistaAcorde) => {
    setVista(v);
    try { localStorage.setItem(CLAVE_VISTA, v); } catch { /* vale solo esta sesión */ }
  };
  return [vista, cambiar];
}

/** Una ficha de acorde en el instrumento elegido (guitarra: tabla de formas; piano y bajo: calculados). */
export const CajaAcorde: React.FC<{ chord: string; vista: VistaAcorde }> = ({ chord, vista }) => {
  const shape = vista === 'guitarra' ? buscarFormaGuitarra(chord) : undefined;
  return (
    <div translate="no" className="notranslate bg-[var(--sunken)] p-2.5 rounded-[var(--r-m)] text-center space-y-1.5">
      <div className="text-xs font-bold text-[var(--acc)] font-sans">{chord}</div>
      {vista === 'teclado' ? <TecladoAcorde acorde={chord} /> : vista === 'bajo' ? <BajoAcorde acorde={chord} /> : shape ? (
        <div className="flex justify-center pt-1">
          <div className="w-24 bg-[var(--surface)] p-1.5 rounded text-micro font-sans">
            {shape.baseFret && shape.baseFret > 1 && <div className="text-micro text-[var(--acc)] font-bold text-left pl-1">Traste {shape.baseFret}</div>}
            <div className="grid grid-cols-6 gap-0.5 my-1 text-[var(--ink-2)] pb-0.5">
              {['E', 'A', 'D', 'G', 'B', 'E'].map((c, i) => <span key={i} className="text-center">{c}</span>)}
            </div>
            <div className="grid grid-cols-6 gap-0.5 my-1">
              {shape.frets.map((f, i) => (
                <span key={i} className={`text-center font-bold ${f === -1 ? 'text-[var(--alert)]' : f === 0 ? 'text-[var(--ok)]' : 'text-[var(--acc)]/70'}`}>
                  {f === -1 ? 'x' : f === 0 ? 'o' : f}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : <p className="text-micro text-[var(--ink-2)] font-sans">[Acorde estándar]</p>}
    </div>
  );
};
