import React, { useEffect, useRef, useState } from 'react';
import { Repeat, X, Pencil } from 'lucide-react';
import type { AnalisisAcordes, SegmentoAcordeAnalizado } from '../../types';
import { processChordText } from '../../utils/chordUtils';
import { indiceSegmentoEn, siguienteAcordeReal, rangoBucle, saltoDeBucle, corregirAcorde, normalizarAcorde, RangoBucle } from '../../utils/lineaTiempoAcordes';

interface Props {
  analisis: AnalisisAcordes;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  transpose: number;
  notation: 'ES' | 'EN';
  isAnalyzing: boolean;
  onSeek: (segundos: number) => void;
  onReanalizar: () => void;
  onCorregir: (segmentos: SegmentoAcordeAnalizado[]) => void;
  /** Resultado de alinear el cifrado escrito con el audio; null si no hay acordes en el texto. */
  sincronizacion: { calidad: number; desplazamiento: number; usable: boolean } | null;
  seguir: boolean;
  onSeguir: (valor: boolean) => void;
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
  analisis, audioRef, isPlaying, transpose, notation, isAnalyzing, onSeek, onReanalizar, onCorregir, sincronizacion, seguir, onSeguir, onClose,
}) => {
  const { segmentos } = analisis;
  const [tiempo, setTiempo] = useState(0);
  const [modoBucle, setModoBucle] = useState<ModoBucle>('off');
  const [inicioBucle, setInicioBucle] = useState<number | null>(null);
  const [bucle, setBucle] = useState<RangoBucle | null>(null);
  const bucleRef = useRef<RangoBucle | null>(null);
  bucleRef.current = bucle;
  // Corrección manual
  const [corrigiendo, setCorrigiendo] = useState(false);
  const [editando, setEditando] = useState<number | null>(null);
  const [borrador, setBorrador] = useState('');
  const [errorBorrador, setErrorBorrador] = useState<string | null>(null);
  const [confirmarReanalisis, setConfirmarReanalisis] = useState(false);
  const corregidos = segmentos.filter((s) => s.editado).length;
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

  const abrirEditor = (i: number) => {
    setEditando(i);
    setBorrador(segmentos[i].acorde === 'N' ? '' : segmentos[i].acorde);
    setErrorBorrador(null);
    ir(segmentos[i].t0);
  };

  const cerrarEditor = () => {
    setEditando(null);
    setErrorBorrador(null);
  };

  const guardarBorrador = (texto: string) => {
    if (editando === null) return;
    const acorde = normalizarAcorde(texto);
    if (!acorde) {
      setErrorBorrador('No reconozco ese acorde. Prueba con Am, Do, F#m7, Sib…');
      return;
    }
    onCorregir(corregirAcorde(segmentos, editando, acorde));
    cerrarEditor();
  };

  const alTocar = (i: number) => {
    if (corrigiendo && modoBucle === 'off') {
      abrirEditor(i);
      return;
    }
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
            {' '}· {analisis.fuente === 'instrumental' ? 'pista instrumental' : analisis.fuente === 'armonia' ? 'stems de armonía (Iris)' : 'mezcla completa'}
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
          <button
            type="button"
            onClick={() => { setCorrigiendo((v) => !v); cerrarEditor(); }}
            className={`flex items-center gap-1 cursor-pointer ${corrigiendo ? 'text-[var(--acc)] font-bold' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'}`}
            title="Corregir acordes mal detectados"
          >
            <Pencil className="w-3.5 h-3.5" /> {corrigiendo ? 'Terminar' : 'Corregir'}
          </button>
          <button
            type="button"
            onClick={() => (corregidos > 0 ? setConfirmarReanalisis(true) : onReanalizar())}
            disabled={isAnalyzing}
            className="text-[var(--acc)] hover:text-[var(--ink)] cursor-pointer"
          >
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
          <span translate="no" className="notranslate block text-2xl font-bold font-mono text-[var(--ink)] leading-none min-w-[3ch]" data-testid="acorde-actual">
            {actual >= 0 ? nombre(segmentos[actual].acorde) : '·'}
          </span>
        </div>
        <div className="text-[var(--ink-2)]">
          <span className="block text-micro">Siguiente{segundosHastaSiguiente !== null && isPlaying ? ` · ${segundosHastaSiguiente.toFixed(1)} s` : ''}</span>
          <span translate="no" className="notranslate block text-lg font-mono leading-none">{siguiente >= 0 ? nombre(segmentos[siguiente].acorde) : '·'}</span>
        </div>
        <span className="ml-auto text-micro text-[var(--ink-2)] pb-0.5">{formatearTiempo(tiempo)} / {formatearTiempo(analisis.duracionSegundos)}</span>
      </div>

      {modoBucle !== 'off' && (
        <p className="text-micro text-[var(--acc)]">
          {modoBucle === 'elegirInicio' ? 'Toca el primer acorde del fragmento.' : 'Ahora toca el último acorde del fragmento.'}
        </p>
      )}

      {/* Estado de la fusión con el cifrado escrito */}
      <div className="flex flex-wrap items-center gap-2 text-micro text-[var(--ink-2)]">
        {sincronizacion === null ? (
          <span>El cifrado no tiene acordes entre corchetes [Am] que sincronizar con el audio.</span>
        ) : sincronizacion.usable ? (
          <>
            <span>
              Cifrado sincronizado: {Math.round(sincronizacion.calidad * 100)} % de los acordes coincide
              {sincronizacion.desplazamiento !== 0 ? ` · el cifrado está ${sincronizacion.desplazamiento} semitonos por debajo del audio` : ''}.
            </span>
            <label className="flex items-center gap-1 cursor-pointer text-[var(--ink)]">
              <input type="checkbox" checked={seguir} onChange={(e) => onSeguir(e.target.checked)} /> Seguir en el cifrado
            </label>
          </>
        ) : (
          <span>
            El cifrado se parece poco al audio ({Math.round(sincronizacion.calidad * 100)} % de coincidencia): no se sincroniza.
            Corrige los acordes detectados o revisa el cifrado.
          </span>
        )}
      </div>

      {confirmarReanalisis && (
        <div className="flex flex-wrap items-center gap-2 p-2 rounded-[var(--r-s)] bg-[var(--acc-soft)] text-[var(--ink)]">
          <span>Reanalizar sustituye todo y perderás {corregidos} {corregidos === 1 ? 'corrección' : 'correcciones'} manual{corregidos === 1 ? '' : 'es'}.</span>
          <button type="button" className="font-bold text-[var(--acc)] cursor-pointer" onClick={() => { setConfirmarReanalisis(false); onReanalizar(); }}>Sí, reanalizar</button>
          <button type="button" className="text-[var(--ink-2)] cursor-pointer" onClick={() => setConfirmarReanalisis(false)}>No</button>
        </div>
      )}

      {corrigiendo && editando === null && (
        <p className="text-micro text-[var(--acc)]">Toca un acorde para corregirlo{corregidos > 0 ? ` · ${corregidos} corregido${corregidos === 1 ? '' : 's'} (*)` : ''}.</p>
      )}

      {editando !== null && segmentos[editando] && (
        <div className="flex flex-wrap items-center gap-2 p-2 rounded-[var(--r-s)] bg-[var(--surface)]">
          <span className="text-[var(--ink-2)]">Tramo {formatearTiempo(segmentos[editando].t0)}–{formatearTiempo(segmentos[editando].t1)}</span>
          <input
            autoFocus
            value={borrador}
            onChange={(e) => { setBorrador(e.target.value); setErrorBorrador(null); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') guardarBorrador(borrador);
              if (e.key === 'Escape') cerrarEditor();
            }}
            placeholder="Am, Do, F#m7…"
            aria-label="Acorde correcto"
            className="w-28 px-2 py-1 rounded-[var(--r-s)] bg-[var(--sunken)] text-[var(--ink)] font-mono"
          />
          <button type="button" className="font-bold text-[var(--acc)] cursor-pointer" onClick={() => guardarBorrador(borrador)}>Guardar</button>
          <button type="button" className="text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer" onClick={() => guardarBorrador('N')}>Sin acorde</button>
          <button type="button" className="text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer" onClick={cerrarEditor}>Cancelar</button>
          {errorBorrador && <span className="w-full text-[var(--alert)]" role="alert">{errorBorrador}</span>}
        </div>
      )}

      {/* Carril de acordes */}
      <div ref={carrilRef} translate="no" className="notranslate flex gap-1.5 overflow-x-auto pb-1 shrink-0">
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
            } ${enBucle(i) || editando === i ? 'outline outline-2 outline-[var(--ok)]' : ''} ${inicioBucle === i && modoBucle === 'elegirFin' ? 'outline outline-2 outline-[var(--ok)]' : ''}`}
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
