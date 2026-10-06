import React, { useEffect, useRef, useState } from 'react';
import { Repeat, X } from 'lucide-react';
import type { AnalisisAcordes } from '../../types';
import { processChordText } from '../../utils/chordUtils';
import { indiceSegmentoEn, siguienteAcordeReal, rangoBucle, saltoDeBucle, RangoBucle } from '../../utils/lineaTiempoAcordes';

interface Props {
  analisis: AnalisisAcordes;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  transpose: number;
  notation: 'ES' | 'EN';
  isAnalyzing: boolean;
  onSeek: (segundos: number) => void;
  onReanalizar: () => void;
  onClose: () => void;
}

const formatearTiempo = (s: number) => {
  const m = Math.floor(s / 60);
  const seg = Math.floor(s % 60);
  return `${m}:${seg.toString().padStart(2, '0')}`;
};

type ModoBucle = 'off' | 'elegirInicio' | 'elegirFin';

/**
 * Línea de tiempo de acordes sincronizada con el audio: resalta el acorde actual y el siguiente,
 * sigue la reproducción, salta al tocar un tramo y permite repetir un fragmento en bucle.
 */
export const LineaTiempoAcordes: React.FC<Props> = ({
  analisis, audioRef, isPlaying, transpose, notation, isAnalyzing, onSeek, onReanalizar, onClose,
}) => {
  const { segmentos } = analisis;
  const [tiempo, setTiempo] = useState(0);
  const [modoBucle, setModoBucle] = useState<ModoBucle>('off');
  const [inicioBucle, setInicioBucle] = useState<number | null>(null);
  const [bucle, setBucle] = useState<RangoBucle | null>(null);
  const bucleRef = useRef<RangoBucle | null>(null);
  bucleRef.current = bucle;
  const carrilRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Cursor fino: timeupdate solo dispara ~4 veces por segundo, poco para un cambio de acorde.
  useEffect(() => {
    let raf = 0;
    const paso = () => {
      const audio = audioRef.current;
      if (audio) {
        const salto = saltoDeBucle(bucleRef.current, audio.currentTime);
        if (salto !== null) audio.currentTime = salto;
        setTiempo((prev) => (Math.abs(prev - audio.currentTime) > 0.04 ? audio.currentTime : prev));
      }
      if (isPlaying) raf = requestAnimationFrame(paso);
    };
    paso();
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, audioRef]);

  const actual = indiceSegmentoEn(segmentos, tiempo);
  const siguiente = siguienteAcordeReal(segmentos, actual);

  // Mantiene el acorde actual centrado en el carril (sin mover la página entera).
  useEffect(() => {
    const carril = carrilRef.current;
    const chip = chipsRef.current[actual];
    if (!isPlaying || !carril || !chip) return;
    carril.scrollTo({ left: chip.offsetLeft - carril.clientWidth / 2 + chip.clientWidth / 2, behavior: 'smooth' });
  }, [actual, isPlaying]);

  const nombre = (acorde: string) =>
    acorde === 'N' ? '—' : processChordText(`[${acorde}]`, transpose, notation).replace(/[[\]]/g, '');

  const ir = (segundos: number) => {
    onSeek(segundos);
    setTiempo(segundos); // en pausa no hay bucle de animación que lo refleje
  };

  const alTocar = (i: number) => {
    if (modoBucle === 'elegirInicio') {
      setInicioBucle(i);
      setModoBucle('elegirFin');
      return;
    }
    if (modoBucle === 'elegirFin' && inicioBucle !== null) {
      setBucle(rangoBucle(segmentos, inicioBucle, i));
      setModoBucle('off');
      ir(segmentos[Math.min(inicioBucle, i)].t0);
      return;
    }
    ir(segmentos[i].t0);
  };

  const quitarBucle = () => {
    setBucle(null);
    setInicioBucle(null);
    setModoBucle('off');
  };

  const enBucle = (i: number) => bucle !== null && segmentos[i].t0 >= bucle.desde - 1e-6 && segmentos[i].t1 <= bucle.hasta + 1e-6;
  const segundosHastaSiguiente = siguiente >= 0 ? Math.max(0, segmentos[siguiente].t0 - tiempo) : null;

  return (
    <div className="px-4 py-2.5 bg-[var(--sunken)] text-xs font-sans space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-[var(--ink)] min-w-0 truncate">
          Acordes del audio
          <span className="font-normal text-[var(--ink-2)]">
            {' '}· {analisis.fuente === 'instrumental' ? 'pista instrumental' : 'mezcla completa'}
            {analisis.tonalidad ? ` · ${analisis.tonalidad}` : ''}
          </span>
        </span>
        <span className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => (bucle || modoBucle !== 'off' ? quitarBucle() : setModoBucle('elegirInicio'))}
            className={`flex items-center gap-1 cursor-pointer ${bucle || modoBucle !== 'off' ? 'text-[var(--acc)] font-bold' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'}`}
            title="Repetir un fragmento: toca el primer y el último acorde"
          >
            <Repeat className="w-3.5 h-3.5" /> {bucle ? 'Quitar bucle' : modoBucle === 'off' ? 'Bucle' : 'Cancelar'}
          </button>
          <button type="button" onClick={onReanalizar} disabled={isAnalyzing} className="text-[var(--acc)] hover:text-[var(--ink)] cursor-pointer">
            {isAnalyzing ? 'Analizando…' : 'Reanalizar'}
          </button>
          <button type="button" onClick={onClose} className="text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer" aria-label="Cerrar">
            <X className="w-4 h-4" />
          </button>
        </span>
      </div>

      {/* Ahora / siguiente */}
      <div className="flex items-end gap-4">
        <div>
          <span className="block text-micro text-[var(--ink-2)]">Ahora</span>
          <span className="block text-2xl font-bold font-mono text-[var(--ink)] leading-none min-w-[3ch]" data-testid="acorde-actual">
            {actual >= 0 ? nombre(segmentos[actual].acorde) : '·'}
          </span>
        </div>
        <div className="text-[var(--ink-2)]">
          <span className="block text-micro">Siguiente{segundosHastaSiguiente !== null && isPlaying ? ` · ${segundosHastaSiguiente.toFixed(1)} s` : ''}</span>
          <span className="block text-lg font-mono leading-none">{siguiente >= 0 ? nombre(segmentos[siguiente].acorde) : '·'}</span>
        </div>
        <span className="ml-auto text-micro text-[var(--ink-2)] pb-0.5">{formatearTiempo(tiempo)} / {formatearTiempo(analisis.duracionSegundos)}</span>
      </div>

      {modoBucle !== 'off' && (
        <p className="text-micro text-[var(--acc)]">
          {modoBucle === 'elegirInicio' ? 'Toca el primer acorde del fragmento.' : 'Ahora toca el último acorde del fragmento.'}
        </p>
      )}

      {/* Carril de acordes */}
      <div ref={carrilRef} className="flex gap-1.5 overflow-x-auto pb-1">
        {segmentos.map((seg, i) => (
          <button
            key={`${seg.t0}-${i}`}
            ref={(el) => { chipsRef.current[i] = el; }}
            type="button"
            onClick={() => alTocar(i)}
            title={`${formatearTiempo(seg.t0)} – ${formatearTiempo(seg.t1)} · confianza ${Math.round(seg.confianza * 100)} %`}
            className={`shrink-0 px-2 py-1 rounded-[var(--r-s)] text-left cursor-pointer transition-ui ${
              i === actual
                ? 'bg-[var(--acc)] text-[var(--on-acc)] ring-2 ring-[var(--acc)]'
                : seg.acorde === 'N'
                  ? 'bg-transparent text-[var(--ink-2)] border border-dashed border-[var(--hair)]'
                  : i === siguiente
                    ? 'bg-[var(--acc-soft)] text-[var(--ink)] ring-1 ring-[var(--acc)]'
                    : seg.confianza < 0.4
                      ? 'bg-[var(--acc-soft)]/60 text-[var(--ink)]'
                      : 'bg-[var(--acc-soft)] text-[var(--ink)]'
            } ${enBucle(i) ? 'outline outline-2 outline-[var(--ok)]' : ''} ${inicioBucle === i && modoBucle === 'elegirFin' ? 'outline outline-2 outline-[var(--ok)]' : ''}`}
          >
            <span className="block text-micro opacity-70">{formatearTiempo(seg.t0)}</span>
            <span className="block font-bold font-mono">{nombre(seg.acorde)}{seg.editado ? '*' : ''}</span>
          </button>
        ))}
      </div>
      <p className="text-micro text-[var(--ink-2)]">
        Detección automática (75-85 % en triadas): revísala de oído. «—» = sin acorde claro; tenue = poco fiable. Toca un tramo para saltar a él.
      </p>
    </div>
  );
};
