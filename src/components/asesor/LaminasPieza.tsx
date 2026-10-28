import React from 'react';
// Las letras de cartel (Anton y DM Serif): solo se cargan con esta parte del asesor.
import '@fontsource/anton/latin-400.css';
import '@fontsource/dm-serif-display/latin-400.css';
import { Download } from 'lucide-react';
import { Button, Skeleton } from '../ui';
import { VOCES, VOCES_CARTEL } from '../../utils/cartel/voces';
import { MEDIDAS, type FormatoLamina } from '../../utils/asesor/laminas';
import type { Pieza } from '../../utils/asesor/pieza';
import { useLaminas, type BandaLaminas } from './hooks/useLaminas';

interface Props {
  pieza: Pieza;
  formato: FormatoLamina;
  banda: BandaLaminas;
}

/**
 * Las stories o el carrusel ya hechos imagen: se eligen colores y letra y se guardan o comparten.
 * El color de cada muestra sale de la paleta (es obra, no interfaz), por eso va en `style`.
 */
export function LaminasPieza({ pieza, formato, banda }: Props) {
  const l = useLaminas(pieza, formato, banda);
  const { ancho, alto } = MEDIDAS[formato];
  if (!l.laminas.length) return null;

  return (
    <section className="grid gap-3" aria-label="Imágenes listas para subir">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-medium text-[var(--ink-2)]">Imágenes listas para subir</h3>
        <span className="text-xs text-[var(--ink-2)] tabular-nums">{l.laminas.length} · {ancho}×{alto}</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {l.urls.length
          ? l.urls.map((u, i) => (
              <img key={u} src={u} alt={`Imagen ${i + 1} de ${l.urls.length}: ${l.laminas[i]?.texto ?? ''}`}
                className="h-56 w-auto shrink-0 rounded-[var(--r-s)]" style={{ aspectRatio: `${ancho} / ${alto}` }} />
            ))
          : l.laminas.map((x) => <Skeleton key={x.numero} radius="s" className="h-56 shrink-0" style={{ aspectRatio: `${ancho} / ${alto}` }} />)}
      </div>
      {l.error && <p role="alert" className="text-sm text-[var(--alert)]">{l.error}</p>}

      <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Colores">
        {l.paletas.map((p) => (
          <button key={p.id} type="button" role="radio" aria-checked={p.id === l.paleta.id} aria-label={p.nombre} title={p.nombre}
            onClick={() => l.setPaletaId(p.id)}
            className={`grid size-9 place-items-center rounded-[var(--r-pill)] ${p.id === l.paleta.id ? 'bg-[var(--ink)]' : 'bg-[var(--sunken)]'}`}>
            <span className="size-6 rounded-[var(--r-pill)]" style={{ background: `linear-gradient(135deg, ${p.fondo} 60%, ${p.acento} 60%)` }} />
          </button>
        ))}
      </div>

      <div className="flex gap-1 rounded-[var(--r-pill)] bg-[var(--sunken)] p-1" role="radiogroup" aria-label="Letra">
        {VOCES_CARTEL.map((v) => (
          <Button key={v} type="button" size="sm" role="radio" aria-checked={l.voz === v} variant={l.voz === v ? 'selected' : 'ghost'}
            className="flex-1" onClick={() => l.setVoz(v)}>
            {VOCES[v].etiqueta}
          </Button>
        ))}
      </div>

      <div>
        <Button size="sm" variant="neutral" onClick={() => void l.exportar()} disabled={l.pintando || l.exportando || !l.urls.length}>
          <Download className="size-4" aria-hidden />
          {l.laminas.length > 1 ? `Guardar las ${l.laminas.length} imágenes` : 'Guardar la imagen'}
        </Button>
      </div>
    </section>
  );
}
