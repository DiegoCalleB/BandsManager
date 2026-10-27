import React, { useEffect, useMemo, useRef, useState } from 'react';
import { posicionEnCuadricula, type Cuadricula } from '../../utils/cuadriculaCompases';
import { compasesPorFila, etiquetasDeCompas, filasDeCompases, nombresDeBloques } from '../../utils/vistaCompases';

interface Props {
  cuadricula: Cuadricula;
  /** Letra que cae en cada compás (índice = número de compás − 1). */
  letras?: string[];
  /** Nombre ya formateado (transposición y notación) de un acorde. */
  nombre: (acorde: string) => string;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  /** Instante del audio cuando no suena (tras un salto o en pausa). */
  tiempo: number;
  onIr: (segundos: number) => void;
  /** Casilla (por su instante) elegida para mover su cambio de acorde. */
  seleccion?: number | null;
  /** Si se pasa, tocar una casilla donde cambia el acorde la elige además de saltar ahí. */
  onSeleccion?: (t0: number | null) => void;
}

/**
 * Compases de la canción en rejilla (como Chordify o Moises): una casilla por tiempo, el acorde
 * escrito donde cambia, el tiempo que suena iluminado y la letra debajo de su compás. Caben más
 * compases por fila cuanto más ancho es el hueco, y cada sección empieza fila.
 */
export const VistaCompases: React.FC<Props> = ({ cuadricula, letras, nombre, audioRef, isPlaying, tiempo, onIr, seleccion, onSeleccion }) => {
  const contenedor = useRef<HTMLDivElement>(null);
  const filasRef = useRef<(HTMLDivElement | null)[]>([]);
  const [ancho, setAncho] = useState(360);
  const [reloj, setReloj] = useState(tiempo);

  useEffect(() => {
    const el = contenedor.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => setAncho(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Reloj fino mientras suena (timeupdate llega ~4 veces/s, poco para seguir un pulso); en pausa manda `tiempo`.
  useEffect(() => {
    if (!isPlaying) return;
    let raf = 0;
    let ultimo = '';
    const paso = () => {
      const a = audioRef.current;
      if (a) {
        // Solo se repinta al cambiar de tiempo: la rejilla tiene cientos de casillas.
        const p = posicionEnCuadricula(cuadricula, a.currentTime);
        const clave = p ? `${p.compas}:${p.tiempo}` : '';
        if (clave !== ultimo) { ultimo = clave; setReloj(a.currentTime); }
      }
      raf = requestAnimationFrame(paso);
    };
    paso();
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, audioRef, cuadricula]);

  const ahora = isPlaying ? reloj : tiempo;
  const porFila = compasesPorFila(ancho, cuadricula.tiemposPorCompas);
  const filas = useMemo(() => filasDeCompases(cuadricula, porFila, letras), [cuadricula, porFila, letras]);
  const secciones = useMemo(() => nombresDeBloques(cuadricula), [cuadricula]);
  const posicion = posicionEnCuadricula(cuadricula, ahora);
  const compasActual = posicion?.compas ?? -1;
  const filaActual = filas.findIndex((f) => f.compases.some((c) => c.n === compasActual));

  // Sigue la reproducción: la fila que suena se queda a la vista sin saltos bruscos.
  useEffect(() => {
    if (!isPlaying || filaActual < 0) return;
    filasRef.current[filaActual]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [filaActual, isPlaying]);

  return (
    <div ref={contenedor} translate="no" className="notranslate space-y-3 font-sans" aria-label="Compases">
      {/* Secciones: salto directo, como las píldoras de Moises */}
      <div className="sticky top-0 z-10 -mx-1 px-1 py-1.5 bg-[var(--bg)] flex gap-1.5 overflow-x-auto shrink-0" aria-label="Secciones">
        {cuadricula.bloques.map((b) => {
          const activo = posicion?.bloque === b.indice;
          return (
            <button
              key={b.indice}
              type="button"
              onClick={() => onIr(b.t0)}
              aria-current={activo || undefined}
              title={`Compases ${b.desde}–${b.hasta}`}
              className={`shrink-0 min-w-9 px-3 py-1 rounded-[var(--r-pill)] text-xs font-bold cursor-pointer transition-ui ${activo ? 'bg-[var(--acc)] text-[var(--on-acc)]' : 'bg-[var(--sunken)] text-[var(--ink)] hover:bg-[var(--surface)]'}`}
            >
              {secciones[b.indice]}
            </button>
          );
        })}
      </div>

      <p className="text-micro text-[var(--ink-3)] tabular-nums">
        {posicion ? `Compás ${posicion.compas} de ${cuadricula.compases.length} · ` : ''}
        {Math.round(cuadricula.bpm)} BPM · {cuadricula.tiemposPorCompas}/4 · {cuadricula.delAudio ? 'pulso y compases escuchados en el audio' : 'compases deducidos de los acordes del audio'}
      </p>

      {filas.map((fila, i) => (
        <div key={`${fila.bloque}-${fila.compases[0].n}`} ref={(el) => { filasRef.current[i] = el; }} className="space-y-1">
          {fila.primeraDelBloque && (
            <span className="inline-block px-2 rounded-[var(--r-pill)] bg-[var(--acc-soft)] text-[var(--acc-ink)] text-micro font-bold">
              {secciones[fila.bloque]}
            </span>
          )}
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${porFila}, minmax(0, 1fr))` }}>
            {fila.compases.map((c) => {
              const activo = c.n === compasActual;
              return (
                <div key={c.n} className="min-w-0">
                  <span className={`block text-micro tabular-nums leading-4 ${activo ? 'text-[var(--acc-ink)] font-bold' : 'text-[var(--ink-3)]'}`}>{c.n}</span>
                  {/* Casillas de tiempo debajo y, encima, cada nombre extendido hasta el siguiente cambio */}
                  <div className="grid gap-0.5 rounded-[var(--r-s)] overflow-hidden" style={{ gridTemplateColumns: `repeat(${c.casillas.length}, minmax(0, 1fr))` }}>
                    {c.casillas.map((k, j) => {
                      const suena = activo && posicion?.tiempo === j + 1;
                      return (
                        <button
                          key={j}
                          type="button"
                          onClick={() => { onIr(k.t0); onSeleccion?.(k.cambia ? (seleccion === k.t0 ? null : k.t0) : null); }}
                          aria-pressed={onSeleccion && k.cambia ? seleccion === k.t0 : undefined}
                          aria-label={`Compás ${c.n}, tiempo ${j + 1}${k.acorde === 'N' ? '' : `: ${nombre(k.acorde)}`}`}
                          style={{ gridColumn: j + 1, gridRow: 1 }}
                          className={`h-12 group-data-[escenario=true]/esc:h-16 cursor-pointer transition-ui ${
                            seleccion === k.t0 ? 'bg-[var(--acc)]/70' : suena ? 'bg-[var(--acc)]/45' : activo ? 'bg-[var(--acc-soft)]' : 'bg-[var(--surface)] hover:bg-[var(--sunken)]'
                          }`}
                        />
                      );
                    })}
                    {etiquetasDeCompas(c.casillas).map((e) => (
                      <span
                        key={e.desde}
                        aria-hidden="true"
                        style={{ gridColumn: `${e.desde + 1} / span ${e.largo}`, gridRow: 1 }}
                        className={`pointer-events-none relative z-[1] self-center px-1.5 truncate ${e.tenue ? 'text-sm text-[var(--ink-3)]' : 'font-bold text-base sm:text-lg group-data-[escenario=true]/esc:text-2xl text-[var(--ink)]'}`}
                      >
                        {nombre(e.acorde)}
                      </span>
                    ))}
                  </div>
                  {c.letra && (
                    <p className={`mt-1 text-sm group-data-[escenario=true]/esc:text-lg leading-snug line-clamp-2 ${activo ? 'text-[var(--ink)] font-semibold' : 'text-[var(--ink-2)]'}`}>{c.letra}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
