import React, { useMemo, useState } from 'react';
import { buscarFormaGuitarra } from '../../utils/chordUtils';
import { CLASE_FUNCION, LETRA_FUNCION } from '../../utils/estiloArmonia';
import { CUERDAS_BAJO, COLOR_FUNCION, lineaDeBajo, notasParaDibujar, type ContextoAcorde, type VistaAcorde } from '../../utils/vistaAcordes';
import { ETIQUETA_VISTA } from './useVistaAcordes';
import { AYUDA_NIVEL, ETIQUETA_NIVEL, NIVELES, etiquetaIntervalo, inversionesGuitarra, notaDePasoHacia, pasoEnGuitarra, powerChord, type NivelAcorde } from '../../utils/voicings';
import { DiagramaGuitarra } from './DiagramaGuitarra';

const BLANCAS = [0, 2, 4, 5, 7, 9, 11];
/** Teclas negras: clase de nota y posición (en teclas blancas) del borde izquierdo de la negra. */
const NEGRAS: Array<[number, number]> = [[1, 0.65], [3, 1.65], [6, 3.65], [8, 4.65], [10, 5.65]];
const OCTAVAS = 2;

/**
 * Teclado de 2 octavas con las notas del acorde iluminadas con el color de su función (la raíz, más fuerte).
 * Básico: solo la tríada · Normal: con 7.ª · Pro: el intervalo escrito en cada tecla y la nota de paso hacia el siguiente.
 */
export const TecladoAcorde: React.FC<{ acorde: string; color?: string; nivel?: NivelAcorde; siguiente?: string | null; bajo?: number | null }> = ({ acorde, color = 'var(--acc)', nivel = 'normal', siguiente, bajo }) => {
  const completo = notasParaDibujar(acorde);
  if (!completo) return <p className="text-micro text-[var(--ink-2)] font-sans">[Acorde no reconocido]</p>;
  const n = nivel === 'basico' ? { ...completo, notas: completo.notas.filter((pc) => pc === completo.raiz || pc === completo.tercera || pc === completo.quinta) } : completo;
  const paso = nivel === 'pro' ? notaDePasoHacia(acorde, siguiente)?.pc ?? null : null;
  const intervalos = nivel === 'pro';
  const w = 10, h = 40, hn = 24;
  const total = BLANCAS.length * OCTAVAS;
  // Las teclas son claras y oscuras en cualquier tema (como un piano de verdad): tokens que no cambian con el tema.
  const relleno = (pc: number, base: string) => (n.notas.includes(pc) ? color : pc === paso ? 'var(--tentative-soft)' : base);
  const opacidad = (pc: number) => (pc === n.raiz || pc === bajo ? 1 : 0.62);
  const marca = (pc: number) => (n.notas.includes(pc) ? etiquetaIntervalo(pc, n.raiz) : pc === paso ? '→' : null);
  return (
    <svg viewBox={`0 0 ${total * w} ${h}`} className="w-full" role="img" aria-label={`Teclado: ${acorde}`}>
      {Array.from({ length: total }, (_, i) => (
        <rect key={`b${i}`} x={i * w + 0.4} y={0} width={w - 0.8} height={h} rx={1} fill={relleno(BLANCAS[i % 7], 'var(--on-scrim)')} opacity={n.notas.includes(BLANCAS[i % 7]) ? opacidad(BLANCAS[i % 7]) : 1} />
      ))}
      {intervalos && Array.from({ length: OCTAVAS }, (_, o) => BLANCAS.map((pc, i) => marca(pc) && (
        <text key={`tb${o}-${pc}`} x={(o * 7 + i) * w + w / 2} y={h - 4} textAnchor="middle" fontSize={4.6} fontWeight="bold" fill={pc === paso ? 'var(--tentative)' : 'var(--surface)'}>{marca(pc)}</text>
      )))}
      {Array.from({ length: OCTAVAS }, (_, o) =>
        NEGRAS.map(([pc, x]) => (
          <rect key={`n${o}-${pc}`} x={(o * 7 + x) * w} y={0} width={w * 0.7} height={hn} rx={1} fill={relleno(pc, 'var(--scrim)')} opacity={n.notas.includes(pc) ? opacidad(pc) : 1} />
        ))
      )}
      {intervalos && Array.from({ length: OCTAVAS }, (_, o) => NEGRAS.map(([pc, x]) => marca(pc) && (
        <text key={`tn${o}-${pc}`} x={(o * 7 + x) * w + w * 0.35} y={hn - 4} textAnchor="middle" fontSize={4.6} fontWeight="bold" fill={pc === paso ? 'var(--tentative)' : 'var(--surface)'}>{marca(pc)}</text>
      )))}
    </svg>
  );
};

const NOMBRE_ROL: Record<string, string> = { raiz: 'raíz', tercera: '3.ª', quinta: '5.ª', octava: '8.ª', paso: 'paso' };

/** Mástil de bajo (4 cuerdas) con una línea de un compás: raíz – 3.ª – 5.ª – nota de paso hacia el acorde siguiente. */
export const BajoAcorde: React.FC<{ acorde: string; siguiente?: string | null; color?: string; nivel?: NivelAcorde }> = ({ acorde, siguiente, color = 'var(--acc)', nivel = 'normal' }) => {
  const completa = lineaDeBajo(acorde, siguiente);
  // Básico: solo la raíz (lo que sostiene el acorde). Normal: la línea del compás. Pro: la línea con su intervalo.
  const linea = completa && nivel === 'basico' ? completa.slice(0, 1) : completa;
  const raiz = notasParaDibujar(acorde)?.raiz ?? 0;
  const marca = (p: { rol: string; pitch: number }, i: number) => (nivel !== 'pro' ? String(i + 1) : p.rol === 'paso' ? '→' : etiquetaIntervalo(((p.pitch % 12) + 12) % 12, raiz));
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
            <line x1={izq + (i + 1) * w} x2={izq + (i + 1) * w} y1={12} y2={12 + 3 * h} stroke={i === 0 && minT === 0 ? 'var(--ink-2)' : 'var(--hair)'} strokeWidth={i === 0 && minT === 0 ? 3 : 0.6} strokeLinecap="round" />
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
              <text x={x} y={y + 2.4} textAnchor="middle" fontSize={7} fontWeight="bold" fill={paso ? 'var(--tentative)' : 'var(--surface)'}>{marca(p, i)}</text>
            </g>
          );
        })}
      </svg>
      {nivel !== 'basico' && (
        <p className="text-micro text-[var(--ink-2)] font-sans leading-tight">
          {linea.map((p, i) => `${i + 1} ${NOMBRE_ROL[p.rol]}`).join(' · ')}{siguiente && linea[3]?.rol === 'paso' ? ` → ${siguiente}` : ''}
        </p>
      )}
    </div>
  );
};

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

/** Nivel de detalle de los diagramas: Básico (power chords) · Normal · Pro (inversiones, intervalos, nota de paso). */
export const SelectorNivel: React.FC<{ nivel: NivelAcorde; onCambio: (n: NivelAcorde) => void }> = ({ nivel, onCambio }) => (
  <span className="flex items-center gap-1 bg-[var(--surface)] rounded-[var(--r-pill)] p-0.5" role="group" aria-label="Nivel de los diagramas" title={AYUDA_NIVEL[nivel]}>
    {NIVELES.map((n) => (
      <button
        key={n}
        type="button"
        aria-pressed={n === nivel}
        onClick={() => onCambio(n)}
        className={`px-2 py-0.5 rounded-[var(--r-pill)] text-micro font-sans cursor-pointer transition-ui ${n === nivel ? 'bg-[var(--sunken)] text-[var(--ink)] font-bold' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'}`}
      >
        {ETIQUETA_NIVEL[n]}
      </button>
    ))}
  </span>
);

/** Una ficha de acorde en el instrumento elegido (guitarra: tabla de formas; piano y bajo: calculados). */
export const CajaAcorde: React.FC<{ chord: string; vista: VistaAcorde; contexto?: ContextoAcorde; grado?: string; sonando?: boolean; nivel?: NivelAcorde }> = ({ chord, vista, contexto, grado, sonando, nivel = 'normal' }) => {
  const [inv, setInv] = useState(0);
  const shape = vista === 'guitarra' && nivel === 'normal' ? buscarFormaGuitarra(chord) : undefined;
  const inversiones = useMemo(() => (vista === 'guitarra' && nivel === 'pro' ? inversionesGuitarra(chord) : []), [vista, nivel, chord]);
  const forma = vista === 'guitarra' ? (nivel === 'basico' ? powerChord(chord) : inversiones[Math.min(inv, inversiones.length - 1)] ?? null) : null;
  const paso = nivel === 'pro' && forma ? (() => { const p = notaDePasoHacia(chord, contexto?.siguiente); return p ? pasoEnGuitarra(forma, p.pc) : null; })() : null;
  const fn = contexto?.info?.funcion;
  const color = fn ? COLOR_FUNCION[fn] : undefined;
  return (
    <div translate="no" data-sonando={sonando ? 'true' : undefined} className={`notranslate p-2.5 rounded-[var(--r-m)] text-center space-y-1.5 transition-all duration-150 ${sonando ? 'bg-[var(--acc-soft)] ring-2 ring-[var(--acc)] scale-[1.03]' : `bg-[var(--sunken)] ${contexto?.tonica ? 'ring-2 ring-[var(--ok)]' : ''}`}`}>
      <div className="flex items-center justify-center gap-1.5 text-xs font-bold font-sans">
        <span
          className={contexto?.tonica ? 'px-2 py-0.5 rounded-[var(--r-s)] bg-[var(--ok)] text-[var(--on-ok)]' : fn ? `px-2 py-0.5 rounded-[var(--r-pill)] ${CLASE_FUNCION[fn]}` : 'text-[var(--acc)]'}
          title={contexto?.tonica ? 'Tónica' : fn ? `Función ${LETRA_FUNCION[fn]}` : undefined}
        >{chord}</span>
        {grado && <span className="text-micro font-normal text-[var(--ink-2)]">{grado}</span>}
      </div>
      {vista === 'teclado' ? <TecladoAcorde acorde={chord} color={color} nivel={nivel} siguiente={contexto?.siguiente} bajo={inversiones.length ? null : notasParaDibujar(chord)?.bajo} /> : vista === 'bajo' ? <BajoAcorde acorde={chord} siguiente={contexto?.siguiente} color={color} nivel={nivel} /> : forma ? (
        <div className="space-y-1">
          <DiagramaGuitarra forma={forma} intervalos={nivel === 'pro'} paso={paso} color={color} etiqueta={`Guitarra: ${chord}, ${forma.nombre}`} />
          {nivel === 'basico' && <p className="text-micro text-[var(--ink-2)] font-sans">Power chord</p>}
          {nivel === 'pro' && inversiones.length > 1 && (
            <div className="flex justify-center gap-1" role="group" aria-label="Inversión">
              {inversiones.map((f, i) => (
                <button key={f.nombre} type="button" aria-pressed={i === inv} title={f.nombre} onClick={() => setInv(i)} className={`px-1.5 py-0.5 rounded-[var(--r-pill)] text-micro font-sans cursor-pointer ${i === inv ? 'bg-[var(--surface)] text-[var(--ink)] font-bold' : 'text-[var(--ink-2)]'}`}>{f.inversion === 0 ? 'Fund.' : `${f.inversion}.ª`}</button>
              ))}
            </div>
          )}
        </div>
      ) : shape ? (
        <div className="flex justify-center pt-1">
          <div className="w-24 bg-[var(--surface)] p-1.5 rounded text-micro font-sans">
            {shape.baseFret && shape.baseFret > 1 && <div className="text-micro text-[var(--acc)] font-bold text-left pl-1">Traste {shape.baseFret}</div>}
            <div className="grid grid-cols-6 gap-0.5 my-1 text-[var(--ink-2)] pb-0.5">
              {['E', 'A', 'D', 'G', 'B', 'E'].map((c, i) => <span key={i} className="text-center">{c}</span>)}
            </div>
            {/* Cejuela: línea gruesa entre la cuerda al aire (o) y el traste 1, solo en posición abierta. */}
            <div data-cejuela={!shape.baseFret || shape.baseFret <= 1 ? 'true' : undefined} className={`mx-0.5 rounded-full ${!shape.baseFret || shape.baseFret <= 1 ? 'h-[3px] bg-[var(--ink-2)]' : 'h-px bg-[var(--hair)]'}`} />
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
