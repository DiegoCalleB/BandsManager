import React, { useState } from 'react';
import { buscarFormaGuitarra } from '../../utils/chordUtils';
import { CLASE_FUNCION, LETRA_FUNCION } from '../../utils/estiloArmonia';
import { instrumentoDelUsuario } from '../../utils/instrumentoProfesor';
import { CUERDAS_BAJO, COLOR_FUNCION, lineaDeBajo, notasParaDibujar, type ContextoAcorde, type VistaAcorde } from '../../utils/vistaAcordes';

const BLANCAS = [0, 2, 4, 5, 7, 9, 11];
/** Teclas negras: clase de nota y posición (en teclas blancas) del borde izquierdo de la negra. */
const NEGRAS: Array<[number, number]> = [[1, 0.65], [3, 1.65], [6, 3.65], [8, 4.65], [10, 5.65]];
const OCTAVAS = 2;

/** Teclado de 2 octavas con las notas del acorde iluminadas con el color de su función (la raíz, más fuerte). */
export const TecladoAcorde: React.FC<{ acorde: string; color?: string }> = ({ acorde, color = 'var(--acc)' }) => {
  const n = notasParaDibujar(acorde);
  if (!n) return <p className="text-micro text-[var(--ink-2)] font-sans">[Acorde no reconocido]</p>;
  const w = 10, h = 40, hn = 24;
  const total = BLANCAS.length * OCTAVAS;
  // Las teclas son claras y oscuras en cualquier tema (como un piano de verdad): tokens que no cambian con el tema.
  const relleno = (pc: number, base: string) => (n.notas.includes(pc) ? color : base);
  const opacidad = (pc: number) => (pc === n.raiz ? 1 : 0.62);
  return (
    <svg viewBox={`0 0 ${total * w} ${h}`} className="w-full" role="img" aria-label={`Teclado: ${acorde}`}>
      {Array.from({ length: total }, (_, i) => (
        <rect key={`b${i}`} x={i * w + 0.4} y={0} width={w - 0.8} height={h} rx={1} fill={relleno(BLANCAS[i % 7], 'var(--on-scrim)')} opacity={n.notas.includes(BLANCAS[i % 7]) ? opacidad(BLANCAS[i % 7]) : 1} />
      ))}
      {Array.from({ length: OCTAVAS }, (_, o) =>
        NEGRAS.map(([pc, x]) => (
          <rect key={`n${o}-${pc}`} x={(o * 7 + x) * w} y={0} width={w * 0.7} height={hn} rx={1} fill={relleno(pc, 'var(--scrim)')} opacity={n.notas.includes(pc) ? opacidad(pc) : 1} />
        ))
      )}
    </svg>
  );
};

const NOMBRE_ROL: Record<string, string> = { raiz: 'raíz', tercera: '3.ª', quinta: '5.ª', octava: '8.ª', paso: 'paso' };

/** Mástil de bajo (4 cuerdas) con una línea de un compás: raíz – 3.ª – 5.ª – nota de paso hacia el acorde siguiente. */
export const BajoAcorde: React.FC<{ acorde: string; siguiente?: string | null; color?: string }> = ({ acorde, siguiente, color = 'var(--acc)' }) => {
  const linea = lineaDeBajo(acorde, siguiente);
  if (!linea) return <p className="text-micro text-[var(--ink-2)] font-sans">[Acorde no reconocido]</p>;
  const minT = Math.min(...linea.map((x) => x.traste));
  const trastes = Math.max(5, Math.max(...linea.map((x) => x.traste)) - minT + 1);
  const w = 20, h = 13, izq = 12;
  return (
    <div className="space-y-1">
      <svg viewBox={`0 0 ${izq + (trastes + 0.5) * w} ${4 * h + 12}`} className="w-full" role="img" aria-label={`Bajo: ${acorde}`}>
        {CUERDAS_BAJO.map((c, i) => {
          const y = 12 + (3 - i) * h;
          return (
            <g key={c.nombre}>
              <line x1={izq} x2={izq + (trastes + 0.5) * w} y1={y} y2={y} stroke="var(--hair)" strokeWidth={1} />
              <text x={4} y={y + 2.5} textAnchor="middle" fontSize={7} fill="var(--ink-2)">{c.nombre}</text>
            </g>
          );
        })}
        {Array.from({ length: trastes }, (_, i) => (
          <g key={i}>
            <line x1={izq + (i + 1) * w} x2={izq + (i + 1) * w} y1={12} y2={12 + 3 * h} stroke="var(--hair)" strokeWidth={0.6} />
            <text x={izq + i * w + w / 2} y={8} textAnchor="middle" fontSize={6} fill="var(--ink-2)">{minT + i}</text>
          </g>
        ))}
        {linea.map((p, i) => {
          const x = izq + (p.traste - minT) * w + w / 2;
          const y = 12 + (3 - p.cuerda) * h;
          const paso = p.rol === 'paso';
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={5.2} fill={paso ? 'var(--tentative-soft)' : color} opacity={p.rol === 'raiz' || paso ? 1 : 0.7} />
              <text x={x} y={y + 2.4} textAnchor="middle" fontSize={7} fontWeight="bold" fill={paso ? 'var(--tentative)' : 'var(--surface)'}>{i + 1}</text>
            </g>
          );
        })}
      </svg>
      <p className="text-micro text-[var(--ink-2)] font-sans leading-tight">
        {linea.map((p, i) => `${i + 1} ${NOMBRE_ROL[p.rol]}`).join(' · ')}{siguiente && linea[3]?.rol === 'paso' ? ` → ${siguiente}` : ''}
      </p>
    </div>
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
export const CajaAcorde: React.FC<{ chord: string; vista: VistaAcorde; contexto?: ContextoAcorde; grado?: string }> = ({ chord, vista, contexto, grado }) => {
  const shape = vista === 'guitarra' ? buscarFormaGuitarra(chord) : undefined;
  const fn = contexto?.info?.funcion;
  const color = fn ? COLOR_FUNCION[fn] : undefined;
  return (
    <div translate="no" className={`notranslate bg-[var(--sunken)] p-2.5 rounded-[var(--r-m)] text-center space-y-1.5 ${contexto?.tonica ? 'ring-2 ring-[var(--ok)]' : ''}`}>
      <div className="flex items-center justify-center gap-1.5 text-xs font-bold font-sans">
        <span
          className={contexto?.tonica ? 'px-2 py-0.5 rounded-[var(--r-s)] bg-[var(--ok)] text-[var(--on-ok)]' : fn ? `px-2 py-0.5 rounded-[var(--r-pill)] ${CLASE_FUNCION[fn]}` : 'text-[var(--acc)]'}
          title={contexto?.tonica ? 'Tónica' : fn ? `Función ${LETRA_FUNCION[fn]}` : undefined}
        >{chord}</span>
        {grado && <span className="text-micro font-normal text-[var(--ink-2)]">{grado}</span>}
      </div>
      {vista === 'teclado' ? <TecladoAcorde acorde={chord} color={color} /> : vista === 'bajo' ? <BajoAcorde acorde={chord} siguiente={contexto?.siguiente} color={color} /> : shape ? (
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
