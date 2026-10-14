import React, { useMemo, useState } from 'react';
import { buscarFormaGuitarra } from '../../utils/chordUtils';
import { CLASE_FUNCION, LETRA_FUNCION } from '../../utils/estiloArmonia';
import { CUERDAS_BAJO, COLOR_FUNCION, lineaDeBajo, notasParaDibujar, type ContextoAcorde, type VistaAcorde } from '../../utils/vistaAcordes';
import { ETIQUETA_VISTA } from './useVistaAcordes';
import { AYUDA_NIVEL, ETIQUETA_NIVEL, NIVELES, etiquetaIntervalo, inversionesGuitarra, notaDePasoHacia, pasoEnGuitarra, powerChord, type NivelAcorde } from '../../utils/voicings';
import { DiagramaGuitarra } from './DiagramaGuitarra';
import { ETIQUETA_INVERSION, inversionRecomendada, inversionesDe, nombreInversion, vozTeclado } from '../../utils/inversiones';

const BLANCAS = [0, 2, 4, 5, 7, 9, 11];
/** Teclas negras: clase de nota y posición (en teclas blancas) del borde izquierdo de la negra. */
const NEGRAS: Array<[number, number]> = [[1, 0.65], [3, 1.65], [6, 3.65], [8, 4.65], [10, 5.65]];
const OCTAVAS = 2;

/**
 * Teclado de 2 octavas con las notas del acorde iluminadas con el color de su función (la raíz, más fuerte).
 * Básico: solo la tríada · Normal: con 7.ª · Pro: el intervalo escrito en cada tecla y la nota de paso hacia el siguiente.
 */
export const TecladoAcorde: React.FC<{ acorde: string; color?: string; nivel?: NivelAcorde; siguiente?: string | null; bajo?: number | null; inversion?: number }> = ({ acorde, color = 'var(--acc)', nivel = 'normal', siguiente, bajo, inversion }) => {
  const completo = notasParaDibujar(acorde);
  if (!completo) return <p className="text-micro text-[var(--ink-2)] font-sans">[Acorde no reconocido]</p>;
  const n = nivel === 'basico' ? { ...completo, notas: completo.notas.filter((pc) => pc === completo.raiz || pc === completo.tercera || pc === completo.quinta) } : completo;
  const paso = nivel === 'pro' ? notaDePasoHacia(acorde, siguiente)?.pc ?? null : null;
  const intervalos = nivel === 'pro';
  const w = 10, h = 40, hn = 24;
  const total = BLANCAS.length * OCTAVAS;
  const tecla = (i: number, pc: number) => Math.floor(i / 7) * 12 + pc;
  // Las teclas son claras y oscuras en cualquier tema (como un piano de verdad): tokens que no cambian con el tema.
  // Con inversión se encienden las teclas exactas de esa voz (la nota grave primero); sin ella, todas las del acorde.
  const voz = inversion === undefined ? null : vozTeclado(n.notas, Math.min(inversion, n.notas.length - 1));
  const suena = (pc: number, tecla: number) => (voz ? voz.includes(tecla) : n.notas.includes(pc));
  const relleno = (pc: number, tecla: number, base: string) => (suena(pc, tecla) ? color : pc === paso ? 'var(--tentative-soft)' : base);
  const opacidad = (pc: number, tecla: number) => (voz ? (tecla === voz[0] || pc === n.raiz ? 1 : 0.62) : pc === n.raiz || pc === bajo ? 1 : 0.62);
  const marca = (pc: number, tecla: number) => (suena(pc, tecla) ? etiquetaIntervalo(pc, n.raiz) : pc === paso ? '→' : null);
  return (
    <svg viewBox={`0 0 ${total * w} ${h}`} className="w-full" role="img" aria-label={`Teclado: ${acorde}`}>
      {Array.from({ length: total }, (_, i) => (
        <rect key={`b${i}`} x={i * w + 0.4} y={0} width={w - 0.8} height={h} rx={1} fill={relleno(BLANCAS[i % 7], tecla(i, BLANCAS[i % 7]), 'var(--on-scrim)')} opacity={suena(BLANCAS[i % 7], tecla(i, BLANCAS[i % 7])) ? opacidad(BLANCAS[i % 7], tecla(i, BLANCAS[i % 7])) : 1} />
      ))}
      {intervalos && Array.from({ length: OCTAVAS }, (_, o) => BLANCAS.map((pc, i) => marca(pc, o * 12 + pc) && (
        <text key={`tb${o}-${pc}`} x={(o * 7 + i) * w + w / 2} y={h - 4} textAnchor="middle" fontSize={4.6} fontWeight="bold" fill={pc === paso ? 'var(--tentative)' : 'var(--surface)'}>{marca(pc, o * 12 + pc)}</text>
      )))}
      {Array.from({ length: OCTAVAS }, (_, o) =>
        NEGRAS.map(([pc, x]) => (
          <rect key={`n${o}-${pc}`} x={(o * 7 + x) * w} y={0} width={w * 0.7} height={hn} rx={1} fill={relleno(pc, o * 12 + pc, 'var(--scrim)')} opacity={suena(pc, o * 12 + pc) ? opacidad(pc, o * 12 + pc) : 1} />
        ))
      )}
      {intervalos && Array.from({ length: OCTAVAS }, (_, o) => NEGRAS.map(([pc, x]) => marca(pc, o * 12 + pc) && (
        <text key={`tn${o}-${pc}`} x={(o * 7 + x) * w + w * 0.35} y={hn - 4} textAnchor="middle" fontSize={4.6} fontWeight="bold" fill={pc === paso ? 'var(--tentative)' : 'var(--surface)'}>{marca(pc, o * 12 + pc)}</text>
      )))}
    </svg>
  );
};

const NOMBRE_ROL: Record<string, string> = { raiz: 'raíz', tercera: '3.ª', quinta: '5.ª', septima: '7.ª', octava: '8.ª', paso: 'paso' };

/** Mástil de bajo (4 cuerdas) con una línea de un compás: raíz – 3.ª – 5.ª – nota de paso hacia el acorde siguiente. */
export const BajoAcorde: React.FC<{ acorde: string; siguiente?: string | null; color?: string; nivel?: NivelAcorde; inversion?: number }> = ({ acorde, siguiente, color = 'var(--acc)', nivel = 'normal', inversion }) => {
  const completa = lineaDeBajo(acorde, siguiente, inversion, nivel === 'pro');
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
          {linea.map((p, i) => `${i + 1} ${NOMBRE_ROL[p.rol]}`).join(' · ')}{siguiente && linea[linea.length - 1]?.rol === 'paso' ? ` → ${siguiente}` : ''}
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

/** Fila de pastillas para elegir la inversión; el puntito marca la que menos mueve la mano desde el acorde anterior. */
const ChipsInversion: React.FC<{ opciones: number[]; activa: number | null; recomendada: number | null; onElige: (i: number) => void }> = ({ opciones, activa, recomendada, onElige }) => (
  <div className="flex justify-center gap-1" role="group" aria-label="Inversión">
    {opciones.map((i) => (
      <button key={i} type="button" aria-pressed={i === activa} title={`${nombreInversion(i)}${i === recomendada ? ' · la que menos mueve la mano' : ''}`} onClick={() => onElige(i)} className={`px-1.5 py-0.5 rounded-[var(--r-pill)] text-micro font-sans cursor-pointer ${i === activa ? 'bg-[var(--surface)] text-[var(--ink)] font-bold' : 'text-[var(--ink-2)]'}`}>
        {ETIQUETA_INVERSION[i]}{i === recomendada && <span aria-hidden className="ml-0.5 inline-block w-1 h-1 rounded-full bg-[var(--ok)] align-middle" />}
      </button>
    ))}
  </div>
);

/** Una ficha de acorde en el instrumento elegido (guitarra: tabla de formas; piano y bajo: calculados). */
export const CajaAcorde: React.FC<{ chord: string; vista: VistaAcorde; contexto?: ContextoAcorde; grado?: string; sonando?: boolean; nivel?: NivelAcorde; previo?: string | null; conReloj?: boolean; id?: string }> = ({ chord, vista, contexto, grado, sonando, nivel = 'normal', previo, conReloj, id }) => {
  // La inversión que menos mueve la mano desde el acorde anterior viene puesta en piano y en guitarra Pro (y se puede cambiar);
  // en guitarra Normal sale la forma de siempre y en bajo la raíz, hasta que se elige otra.
  const [invElegida, setInvElegida] = useState<number | null>(null);
  const { total: totalMax, fija } = inversionesDe(chord);
  const totalInv = nivel === 'basico' ? Math.min(totalMax, 3) : totalMax;
  const recomendada = inversionRecomendada(chord, previo);
  const sugerida = previo ? recomendada : null;
  const invT = invElegida ?? recomendada;
  const invBajo = invElegida ?? (fija ?? 0);
  // Pro: el bajo arranca en la inversión recomendada (como piano y guitarra) y suma la 7.ª si el acorde la tiene.
  const invBajoPro = fija ?? invT;
  const inversiones = useMemo(() => (vista === 'guitarra' && nivel !== 'basico' ? inversionesGuitarra(chord) : []), [vista, nivel, chord]);
  const invGuitarra = nivel === 'pro' ? invT : invElegida;
  const shape = vista === 'guitarra' && nivel === 'normal' && invGuitarra === null ? buscarFormaGuitarra(chord) : undefined;
  const formaInv = invGuitarra === null ? null : inversiones.find((f) => f.inversion === invGuitarra) ?? inversiones[0] ?? null;
  const forma = vista === 'guitarra' ? (nivel === 'basico' ? powerChord(chord) : shape ? null : formaInv) : null;
  const paso = nivel === 'pro' && forma ? (() => { const p = notaDePasoHacia(chord, contexto?.siguiente); return p ? pasoEnGuitarra(forma, p.pc) : null; })() : null;
  const fn = contexto?.info?.funcion;
  const color = fn ? COLOR_FUNCION[fn] : undefined;
  return (
    <div id={id} translate="no" data-sonando={sonando ? 'true' : undefined} className={`notranslate p-2.5 rounded-[var(--r-m)] text-center space-y-1.5 transition-all duration-150 ${sonando ? `bg-[var(--acc-soft)] ${conReloj ? '' : 'ring-2 ring-[var(--acc)] scale-[1.03]'}` : `bg-[var(--sunken)] ${contexto?.tonica ? 'ring-2 ring-[var(--ok)]' : ''}`}`}>
      <div className="flex items-center justify-center gap-1.5 text-xs font-bold font-sans">
        <span
          className={contexto?.tonica ? 'px-2 py-0.5 rounded-[var(--r-s)] bg-[var(--ok)] text-[var(--on-ok)]' : fn ? `px-2 py-0.5 rounded-[var(--r-pill)] ${CLASE_FUNCION[fn]}` : 'text-[var(--acc)]'}
          title={contexto?.tonica ? 'Tónica' : fn ? `Función ${LETRA_FUNCION[fn]}` : undefined}
        >{chord}</span>
        {grado && <span className="text-micro font-normal text-[var(--ink-2)]">{grado}</span>}
      </div>
      {vista === 'teclado' ? (
        <div className="space-y-1">
          <TecladoAcorde acorde={chord} color={color} nivel={nivel} siguiente={contexto?.siguiente} bajo={inversiones.length ? null : notasParaDibujar(chord)?.bajo} inversion={invT} />
          {totalInv >= 3 && fija === null && <ChipsInversion opciones={Array.from({ length: totalInv }, (_, i) => i)} activa={invT} recomendada={sugerida} onElige={setInvElegida} />}
        </div>
      ) : vista === 'bajo' ? (
        <div className="space-y-1">
          <BajoAcorde acorde={chord} siguiente={contexto?.siguiente} color={color} nivel={nivel} inversion={nivel === 'pro' ? invBajoPro : invElegida === null && fija === null ? undefined : invBajo} />
          {totalInv >= 3 && fija === null && <ChipsInversion opciones={Array.from({ length: totalInv }, (_, i) => i)} activa={nivel === 'pro' ? invBajoPro : invBajo} recomendada={sugerida} onElige={setInvElegida} />}
        </div>
      ) : forma ? (
        <div className="space-y-1">
          <DiagramaGuitarra forma={forma} intervalos={nivel === 'pro'} paso={paso} color={color} etiqueta={`Guitarra: ${chord}, ${forma.nombre}`} />
          {nivel === 'basico' && <p className="text-micro text-[var(--ink-2)] font-sans">Power chord</p>}
          {inversiones.length > 1 && <ChipsInversion opciones={inversiones.map((f) => f.inversion)} activa={forma && formaInv ? formaInv.inversion : null} recomendada={sugerida} onElige={setInvElegida} />}
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
