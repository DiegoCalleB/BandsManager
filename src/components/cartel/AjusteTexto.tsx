import React, { useRef } from 'react';
import { Eye, EyeOff, Minus, Plus, RotateCcw, Trash2, Type } from 'lucide-react';
import { Button, IconButton } from '../ui';
import { cn } from '../../utils/cn';
import { BLOQUES, BLOQUES_CON_COLOR, BLOQUES_CON_FUENTE, ETIQUETA_BLOQUE, LIBRES, esLibre, type AjusteBloque, type BloqueAjustable, type EstiloBloque, type EstilosBloques } from '../../utils/cartel/ajustesFinos';
import { MAX_TEXTO_LIBRE } from '../../utils/cartel/textosLibres';
import { VOCES, VOCES_CARTEL, type VozCartel } from '../../utils/cartel/voces';
import type { Rect } from '../../utils/cartel/layout';

interface PropsCapa {
  /** Cajas de los bloques, en píxeles del lienzo (`ancho` de ancho). */
  cajas: Partial<Record<BloqueAjustable, Rect>>;
  ancho: number;
  alto: number;
  ajustes: Partial<Record<BloqueAjustable, AjusteBloque>>;
  elegido: BloqueAjustable | null;
  onElegir: (b: BloqueAjustable) => void;
  onAjustar: (bloque: BloqueAjustable, cambio: Partial<AjusteBloque>) => void;
}

const PASO = 0.01;
const actualDe = (ajustes: Partial<Record<BloqueAjustable, AjusteBloque>>, b: BloqueAjustable): AjusteBloque => ajustes[b] ?? { dx: 0, dy: 0, escala: 1 };

/**
 * Capa sobre la vista previa para mover y escalar el texto a mano: cada bloque es un botón arrastrable (ratón o
 * dedo), solo con contorno para no tapar lo que se mueve. Las flechas y el tamaño están en `BarraAjusteTexto`.
 */
export function CapaAjusteTexto({ cajas, ancho, alto, ajustes, elegido, onElegir, onAjustar }: PropsCapa) {
  const arrastre = useRef<{ bloque: BloqueAjustable; x: number; y: number; dx: number; dy: number; anchoPx: number } | null>(null);

  const empezar = (e: React.PointerEvent<HTMLElement>, bloque: BloqueAjustable) => {
    const capa = e.currentTarget.parentElement!.getBoundingClientRect();
    e.currentTarget.setPointerCapture(e.pointerId);
    onElegir(bloque);
    arrastre.current = { bloque, x: e.clientX, y: e.clientY, dx: actualDe(ajustes, bloque).dx, dy: actualDe(ajustes, bloque).dy, anchoPx: capa.width };
  };
  const mover = (e: React.PointerEvent<HTMLElement>) => {
    const a = arrastre.current;
    if (!a) return;
    // Píxeles de pantalla → fracción del ancho del cartel.
    onAjustar(a.bloque, { dx: a.dx + (e.clientX - a.x) / a.anchoPx, dy: a.dy + (e.clientY - a.y) / a.anchoPx });
  };
  const soltar = () => {
    arrastre.current = null;
  };

  return (
    <div className="absolute inset-0" aria-label="Ajustar el texto">
      {BLOQUES.filter((b) => cajas[b]).map((b) => {
        const r = cajas[b]!;
        return (
          <button
            key={b}
            type="button"
            aria-label={`Mover ${ETIQUETA_BLOQUE[b]}`}
            aria-pressed={elegido === b}
            onPointerDown={(e) => empezar(e, b)}
            onPointerMove={mover}
            onPointerUp={soltar}
            onPointerCancel={soltar}
            onClick={() => onElegir(b)}
            className={cn('absolute cursor-grab touch-none rounded-[var(--r-s)] bg-transparent outline-none active:cursor-grabbing', elegido === b ? 'ring-2 ring-[var(--acc)]' : 'ring-1 ring-white/50 hover:ring-[var(--acc)]')}
            style={{ left: `${(r.x / ancho) * 100}%`, top: `${(r.y / alto) * 100}%`, width: `${(r.w / ancho) * 100}%`, height: `${(r.h / alto) * 100}%` }}
          />
        );
      })}
    </div>
  );
}

interface PropsBarra {
  elegido: BloqueAjustable | null;
  ajustes: Partial<Record<BloqueAjustable, AjusteBloque>>;
  onAjustar: (bloque: BloqueAjustable, cambio: Partial<AjusteBloque>) => void;
  onReiniciar: () => void;
  hayAjustes: boolean;
  estilos: EstilosBloques;
  /** Colores de la banda, a mano junto a los básicos. */
  paleta: string[];
  onEstilar: (bloque: BloqueAjustable, cambio: { [K in keyof EstiloBloque]?: EstiloBloque[K] | undefined }) => void;
  /** Textos sueltos: hasta 3; un hueco vacío es un hueco libre. */
  libres: string[];
  onLibre: (indice: number, texto: string) => void;
  onAnadirLibre: () => void;
}

const COLORES_BASE = ['#ffffff', '#111111', '#e63946', '#ffd166'];

/** Tamaño y flechas del bloque elegido, y «Volver al automático»: se puede ajustar sin arrastrar. */
export function BarraAjusteTexto({ elegido: elegidoPedido, ajustes, onAjustar, onReiniciar, hayAjustes, estilos, paleta, onEstilar, libres, onLibre, onAnadirLibre }: PropsBarra) {
  const indiceLibre = elegidoPedido && esLibre(elegidoPedido) ? LIBRES.indexOf(elegidoPedido as (typeof LIBRES)[number]) : -1;
  const hayHueco = LIBRES.some((_, i) => !libres[i]?.trim());
  const libreVacio = indiceLibre >= 0 && !libres[indiceLibre]?.trim();
  const elegido = elegidoPedido && !estilos[elegidoPedido]?.oculto && !libreVacio ? elegidoPedido : null;
  const estilo = elegido ? estilos[elegido] : undefined;
  const ocultos = BLOQUES.filter((b) => estilos[b]?.oculto);
  const colores = [...new Set([...paleta, ...COLORES_BASE].map((c) => c.toLowerCase()))].slice(0, 6);
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5" role="group" aria-label={elegido ? `Ajustar ${ETIQUETA_BLOQUE[elegido]}` : 'Ajustar el texto'}>
      {elegido ? (
        <>
          <span className="px-1 text-xs font-medium text-[var(--ink-2)]">{ETIQUETA_BLOQUE[elegido]}</span>
          <IconButton label="Más pequeño" size="icon-xs" variant="raised" onClick={() => onAjustar(elegido, { escala: actualDe(ajustes, elegido).escala - 0.05 })}>
            <Minus className="size-3.5" aria-hidden />
          </IconButton>
          <IconButton label="Más grande" size="icon-xs" variant="raised" onClick={() => onAjustar(elegido, { escala: actualDe(ajustes, elegido).escala + 0.05 })}>
            <Plus className="size-3.5" aria-hidden />
          </IconButton>
          <Button size="xs" variant="raised" aria-label="Subir" onClick={() => onAjustar(elegido, { dy: actualDe(ajustes, elegido).dy - PASO })}>↑</Button>
          <Button size="xs" variant="raised" aria-label="Bajar" onClick={() => onAjustar(elegido, { dy: actualDe(ajustes, elegido).dy + PASO })}>↓</Button>
          <Button size="xs" variant="raised" aria-label="A la izquierda" onClick={() => onAjustar(elegido, { dx: actualDe(ajustes, elegido).dx - PASO })}>←</Button>
          <Button size="xs" variant="raised" aria-label="A la derecha" onClick={() => onAjustar(elegido, { dx: actualDe(ajustes, elegido).dx + PASO })}>→</Button>
          {BLOQUES_CON_FUENTE.includes(elegido) && (
            <select
              aria-label={`Letra de ${ETIQUETA_BLOQUE[elegido]}`}
              value={estilo?.fuente ?? ''}
              onChange={(e) => onEstilar(elegido, { fuente: (e.target.value || undefined) as VozCartel | undefined })}
              className="h-7 rounded-[var(--r-s)] bg-[var(--raised)] px-2 text-xs text-[var(--ink)]"
            >
              <option value="">Letra automática</option>
              {VOCES_CARTEL.map((v) => (
                <option key={v} value={v}>{VOCES[v].etiqueta}</option>
              ))}
            </select>
          )}
          {BLOQUES_CON_COLOR.includes(elegido) && (
            <span className="flex items-center gap-1" role="group" aria-label={`Color de ${ETIQUETA_BLOQUE[elegido]}`}>
              <Button size="xs" variant={estilo?.color ? 'raised' : 'inverse'} aria-pressed={!estilo?.color} onClick={() => onEstilar(elegido, { color: undefined })}>Auto</Button>
              {colores.map((c) => (
                <button key={c} type="button" aria-label={`Color ${c}`} aria-pressed={estilo?.color === c} onClick={() => onEstilar(elegido, { color: c })}
                  className={cn('size-5 rounded-full ring-1 ring-black/20', estilo?.color === c && 'ring-2 ring-[var(--acc)]')} style={{ background: c }} />
              ))}
              <input type="color" aria-label="Otro color" value={estilo?.color ?? '#ffffff'} onChange={(e) => onEstilar(elegido, { color: e.target.value })} className="size-6 cursor-pointer rounded bg-transparent p-0" />
            </span>
          )}
          {indiceLibre >= 0 ? (
            <>
              <input aria-label="Texto" value={libres[indiceLibre] ?? ''} maxLength={MAX_TEXTO_LIBRE} onChange={(e) => onLibre(indiceLibre, e.target.value)}
                className="h-7 w-40 rounded-[var(--r-s)] bg-[var(--raised)] px-2 text-xs text-[var(--ink)]" />
              <Button size="xs" variant="raised" onClick={() => onLibre(indiceLibre, '')}>
                <Trash2 className="size-3.5" aria-hidden />
                Quitar
              </Button>
            </>
          ) : (
            <Button size="xs" variant="raised" onClick={() => onEstilar(elegido, { oculto: true })}>
              <EyeOff className="size-3.5" aria-hidden />
              Ocultar
            </Button>
          )}
        </>
      ) : (
        <span className="px-1 text-xs text-[var(--ink-2)]">Toca un texto para moverlo, cambiar su tamaño, su letra o su color.</span>
      )}
      <Button size="xs" variant="raised" disabled={!hayHueco} onClick={onAnadirLibre}>
        <Type className="size-3.5" aria-hidden />
        Añadir texto
      </Button>
      {ocultos.map((b) => (
        <Button key={b} size="xs" variant="raised" onClick={() => onEstilar(b, { oculto: undefined })}>
          <Eye className="size-3.5" aria-hidden />
          Mostrar {ETIQUETA_BLOQUE[b].toLowerCase()}
        </Button>
      ))}
      <Button size="xs" variant="raised" onClick={onReiniciar} disabled={!hayAjustes}>
        <RotateCcw className="size-3.5" aria-hidden />
        Volver al automático
      </Button>
    </div>
  );
}
