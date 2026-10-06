import React, { useMemo } from 'react';
import type { AnalisisAcordes } from '../../types';
import { processChordText } from '../../utils/chordUtils';
import {
  NOMBRE_FUNCION, SENSACION_FUNCION, escalasSugeridas, notasDelAcorde, nombreDeNota, usaBemoles,
  type AnalisisArmonico, type Funcion, type ResumenAcorde,
} from '../../utils/teoriaArmonica';
import { CLASE_FUNCION, LETRA_FUNCION } from '../../utils/estiloArmonia';
import { construirCuadricula } from '../../utils/cuadriculaCompases';
import { guiasDelProfesor } from '../../utils/guiasArmonia';

interface Props {
  armonia: AnalisisArmonico;
  analisis?: AnalisisAcordes;
  bpm?: number;
  notation: 'ES' | 'EN';
  transpose: number;
  /** Texto del «profesor» (IA) si ya se ha pedido, o null; el padre decide cómo pedirlo. */
  profesor?: React.ReactNode;
}

const ORDEN: Funcion[] = ['T', 'S', 'D', 'M', 'X'];

const ritmoArmonico = (cpm: number) => (cpm < 12 ? 'lento' : cpm < 30 ? 'tranquilo' : cpm < 60 ? 'medio' : 'rápido');

/**
 * Pestaña «Armonía»: lo que el código sabe de la canción, explicado como lo haría un profesor y SIN IA
 * (todo sale de `analizarArmonia`). Cada afirmación es un dato calculado; la fiabilidad la marca el
 * origen de los acordes (audio corregido por la banda, audio detectado o cifrado escrito).
 */
export const PanelArmonia: React.FC<Props> = ({ armonia, analisis, bpm, notation, transpose, profesor }) => {
  const { tonalidad, modo } = armonia;
  const bemoles = usaBemoles(tonalidad, modo.id);
  const nota = (pc: number) => nombreDeNota(pc + transpose, bemoles, notation);
  const acorde = (a: string) => processChordText(`[${a}]`, transpose, notation).replace(/[[\]]/g, '');
  const plantilla = (t: string, raiz: number) => t.replace('{R}', nota(raiz));
  const tonicaNombre = nota(tonalidad.tonica);

  const cuadricula = useMemo(
    () => (analisis ? construirCuadricula(analisis.segmentos, bpm, analisis.duracionSegundos, analisis.pulso) : null),
    [analisis, bpm],
  );
  const corregidos = analisis ? analisis.segmentos.filter((s) => s.editado).length : 0;
  const origen = !analisis
    ? 'los acordes escritos en el cifrado'
    : corregidos > 0
      ? `los acordes detectados en el audio, con ${corregidos} corregido${corregidos === 1 ? '' : 's'} por la banda`
      : 'los acordes detectados automáticamente en el audio (aún sin revisar)';
  const guias = useMemo(() => guiasDelProfesor(armonia, { yaModula: (analisis?.tonalidades?.length ?? 0) > 1 }), [armonia, analisis]);

  // Bloques: la progresión (en grados) de cada letra distinta de la cuadrícula.
  const bloques = useMemo(() => {
    if (!cuadricula || !analisis) return [];
    const porLetra = new Map<string, { letra: string; compases: string; grados: string[]; acordes: string[] }>();
    for (const b of cuadricula.bloques) {
      if (porLetra.has(b.letra)) continue;
      const tramos = analisis.segmentos
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => s.t1 > b.t0 + 0.05 && s.t0 < b.t1 - 0.05 && s.acorde !== 'N');
      const grados: string[] = [];
      const acordes: string[] = [];
      for (const { s, i } of tramos) {
        const g = armonia.porTramo[i]?.grado;
        if (g && g !== grados[grados.length - 1]) { grados.push(g); acordes.push(s.acorde); }
      }
      porLetra.set(b.letra, { letra: b.letra, compases: `compases ${b.desde}–${b.hasta}`, grados, acordes });
    }
    return [...porLetra.values()];
  }, [cuadricula, analisis, armonia]);

  return (
    <div className="space-y-5 max-w-3xl mx-auto font-sans text-sm" translate="no">
      {/* 1. Resumen tonal */}
      <section className="bg-[var(--sunken)] rounded-[var(--r-m)] p-4 space-y-3" aria-label="Resumen tonal">
        <div>
          <div className="text-lg font-bold text-[var(--ink)]">
            {tonicaNombre}{tonalidad.menor ? ' menor' : ' mayor'} · {modo.nombre}
          </div>
          <p className="text-[var(--ink-2)]">{modo.rasgo}.</p>
          {armonia.tonalidadEstimada && (
            <p className="text-xs text-[var(--ink-2)] mt-1">Tonalidad deducida de los acordes: si la ficha de la canción tiene otra, anótala y el análisis la usará.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-[var(--ink)]">
          {bpm ? <span><b className="font-bold">{Math.round(analisis?.pulso?.bpm ?? bpm)}</b> BPM{cuadricula ? ` · ${cuadricula.tiemposPorCompas}/4` : ''}</span> : null}
          <span>Ritmo armónico <b className="font-bold">{ritmoArmonico(armonia.cambiosPorMinuto)}</b> ({armonia.cambiosPorMinuto} cambios por minuto)</span>
          {analisis?.tonalidades && analisis.tonalidades.length > 1 && (
            <span>Cambia de tono: {analisis.tonalidades.map((t) => acorde(t.tonalidad)).join(' → ')}</span>
          )}
        </div>
        {/* Reparto de funciones */}
        <div>
          <div className="flex h-7 rounded-[var(--r-pill)] overflow-hidden" role="img" aria-label="Reparto del tiempo por función armónica">
            {ORDEN.filter((f) => armonia.funciones[f] > 0.005).map((f) => (
              <span
                key={f}
                style={{ width: `${armonia.funciones[f] * 100}%` }}
                className={`flex items-center justify-center text-xs font-bold ${CLASE_FUNCION[f]}`}
                title={`${NOMBRE_FUNCION[f]}: ${Math.round(armonia.funciones[f] * 100)} % del tiempo`}
              >
                {armonia.funciones[f] > 0.08 ? `${LETRA_FUNCION[f]} ${Math.round(armonia.funciones[f] * 100)}%` : ''}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-[var(--ink-2)]">
            {ORDEN.filter((f) => armonia.funciones[f] > 0.005).map((f) => (
              <span key={f}><b className="font-bold text-[var(--ink)]">{LETRA_FUNCION[f]} {NOMBRE_FUNCION[f]}</b>: {SENSACION_FUNCION[f]}</span>
            ))}
          </div>
        </div>
        {armonia.bucle && (
          <p className="text-[var(--ink)]">
            Bucle de la canción: <b className="font-bold">{armonia.bucle.grados.join(' – ')}</b>
            {' '}(<span className="text-[var(--ink-2)]">{armonia.bucle.grados.map((g) => {
              const r = armonia.acordes.find((a) => a.grado === g);
              return r ? acorde(r.acorde) : g;
            }).join(' – ')}</span>)
            {armonia.bucle.nombre ? <> — es {armonia.bucle.nombre}</> : null}. Se repite {armonia.bucle.veces} veces
            {armonia.bucle.cobertura < 0.95 ? ` y encaja en el ${Math.round(armonia.bucle.cobertura * 100)} % de los cambios` : ''}.
          </p>
        )}
      </section>

      {/* 2. Mapa de la canción (bloques) */}
      {bloques.length > 0 && (
        <section className="space-y-2" aria-label="Mapa de la canción">
          <h3 className="font-bold text-[var(--ink)]">Mapa de la canción</h3>
          <p className="text-xs text-[var(--ink-2)]">Los bloques con la misma progresión comparten letra: es lo que se repite de verdad, no una estructura inventada.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {bloques.map((b) => (
              <div key={b.letra} className="bg-[var(--sunken)] rounded-[var(--r-m)] p-3">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-[var(--ink)]">Bloque {b.letra}</span>
                  <span className="text-xs text-[var(--ink-2)]">{b.compases}</span>
                </div>
                <div className="font-mono text-[var(--ink)]">{b.grados.join(' – ')}</div>
                <div className="font-mono text-xs text-[var(--ink-2)]">{b.acordes.map(acorde).join(' – ')}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Los acordes de la canción */}
      <section className="space-y-2" aria-label="Acordes de la canción">
        <h3 className="font-bold text-[var(--ink)]">Los acordes y qué hacer sobre cada uno</h3>
        <div className="space-y-2">
          {armonia.acordes.slice(0, 12).map((r: ResumenAcorde) => {
            const notas = notasDelAcorde(r.acorde, r.funcion);
            const escalas = escalasSugeridas(r.acorde, tonalidad, modo.id).slice(0, 2);
            const total = armonia.acordes.reduce((x, y) => x + y.segundos, 0) || 1;
            return (
              <div key={r.acorde} className="bg-[var(--sunken)] rounded-[var(--r-m)] p-3 space-y-1.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className={`px-2.5 py-0.5 rounded-[var(--r-pill)] font-bold ${CLASE_FUNCION[r.funcion]}`}>{acorde(r.acorde)}</span>
                  <span className="font-bold text-[var(--ink)]">{r.grado}{r.secundario ? ` (${r.secundario})` : ''}</span>
                  <span className="text-[var(--ink-2)]">{NOMBRE_FUNCION[r.funcion]} · {Math.round((r.segundos / total) * 100)} % del tiempo · entra {r.veces} {r.veces === 1 ? 'vez' : 'veces'}</span>
                </div>
                {notas && (
                  <div className="text-[var(--ink)]">
                    Notas: {[notas.raiz, notas.tercera, notas.quinta, notas.septima].filter((x): x is number => x !== null).map(nota).join(' · ')}
                    <span className="text-[var(--ink-2)]"> — notas guía (las que «dibujan» el acorde): {notas.guia.map(nota).join(' y ')}</span>
                  </div>
                )}
                {escalas.map((e) => (
                  <div key={e.nombre} className="text-[var(--ink)]">
                    <b className="font-bold">{plantilla(e.nombre, e.raiz)}</b>
                    <span className="text-[var(--ink-2)]"> ({e.notas.map(nota).join(' ')}) — {e.motivo}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Para improvisar y componer */}
      <section className="space-y-2" aria-label="Para improvisar y componer">
        <h3 className="font-bold text-[var(--ink)]">Para improvisar y componer</h3>
        <ul className="space-y-2">
          {guias.map((g) => (
            <li key={g.id} className="bg-[var(--sunken)] rounded-[var(--r-m)] p-3 text-[var(--ink)]">
              {g.tipo === 'idea' && <span className="mr-2 px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc-soft)] text-[var(--acc-ink)] text-xs font-bold">Idea</span>}
              <b className="font-bold">{g.titulo}.</b> {g.texto.replace(/\{n:(\d+)\}/g, (_m, pc) => nota(Number(pc)))}
            </li>
          ))}
        </ul>
      </section>

      {/* 5. El profesor (IA), si se ha pedido */}
      {profesor}

      <p className="text-xs text-[var(--ink-2)]">
        Basado en {origen}. {analisis ? 'Si algún acorde está mal, corrígelo en «Acordes del audio» y esta ficha se recalcula.' : 'Analiza los acordes del audio para afinarla.'}
      </p>
    </div>
  );
};
