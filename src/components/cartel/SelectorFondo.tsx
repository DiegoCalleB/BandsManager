import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, Sparkles, Wand2 } from 'lucide-react';
import { Button, Textarea } from '../ui';
import { BotonVoz } from './BotonVoz';
import { cn } from '../../utils/cn';
import { PALETAS, type FondoCartel } from '../../utils/cartel/render';
import { ESTILOS_CARTEL, ETIQUETA_ESTILO, type EstiloCartel } from '../../utils/cartel/estilos';
import type { PaletaBanda } from '../../utils/cartel/paleta';
import { ETIQUETA_PLANTILLA, PLANTILLAS, dibujarPlantilla, type PlantillaId } from '../../utils/cartel/plantillas';

const MAX_RETOQUE = 300;
const EJEMPLOS_RETOQUE = ['Más oscuro', 'Más grano de papel', 'Colores más cálidos', 'Más contraste'];

interface Props {
  fondo: FondoCartel;
  onFondo: (f: FondoCartel) => void;
  foto: string | null;
  onFoto: (f: File | undefined) => void;
  fondosIa: string[];
  onGenerarIa: (estilo: EstiloCartel) => Promise<boolean>;
  generando: boolean;
  /** Retoca el fondo de IA que se ve con una instrucción (una versión nueva). */
  onRetocar: (instruccion: string, modo: 'libre' | 'fiel') => Promise<boolean>;
  retocando: boolean;
  /** La IA no pudo pintar el último fondo (sin cupo, caída…): se ofrecen los carteles de autor como respaldo. */
  iaFalla: boolean;
  /** La IA se equivocó en alguna letra del último fondo: se ofrece repetirlo con el texto exacto de la app. */
  letrasFallidas: boolean;
  onRepetirSinLetras: () => Promise<boolean>;
  /** La IA dibuja el título y la fecha dentro del arte (en vez de pintarlos la app encima). */
  letrasIa: boolean;
  onLetrasIa: (v: boolean) => void;
  puedeLetrasIa: boolean;
  /** Estilo con el que arranca el panel de IA (el de la banda: plantilla del dossier, género, favoritos). */
  estiloInicial: EstiloCartel;
  /** «Tus colores», sacados del logo. */
  paletaBanda: PaletaBanda | null;
  /** El ADN de la banda (referencias, anteriores, favoritos), dentro del panel de IA. */
  panelBanda?: React.ReactNode;
  /** «Tu idea»: lo que la persona imagina para este cartel (texto y boceto). */
  panelIdea?: React.ReactNode;
}

/** Muestra de una paleta: color de fondo con unas barras de la Onda en el acento. */
function MuestraPaleta({ fondo, acento }: { fondo: string; acento: string }) {
  return (
    <span className="flex size-full items-end justify-center gap-[3px] pb-2.5" style={{ background: fondo }}>
      {[10, 18, 13, 22, 9].map((h, i) => (
        <span key={i} className="w-[3px] rounded-[var(--r-pill)]" style={{ height: h, background: acento }} />
      ))}
    </span>
  );
}

/** Miniatura de una plantilla: el mismo dibujo que el cartel, a tamaño de muestra. */
function MuestraPlantilla({ id }: { id: PlantillaId }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current?.getContext('2d');
    if (c) dibujarPlantilla(id, c, 96, 120, 1);
  }, [id]);
  return <canvas ref={ref} width={96} height={120} aria-hidden className="size-full object-cover" />;
}

/** Miniatura elegible. La elegida se marca con una píldora debajo (sin bordes, Ley 1). */
function Muestra({ activa, etiqueta, onClick, children }: { activa: boolean; etiqueta: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={activa} aria-label={etiqueta} title={etiqueta}
      className="group grid shrink-0 cursor-pointer justify-items-center gap-1.5">
      <span className={cn('grid size-12 place-items-center overflow-hidden rounded-[var(--r-s)] transition-ui group-active:scale-[0.97]', !activa && 'opacity-80 group-hover:opacity-100')}>
        {children}
      </span>
      <span className={cn('h-1 w-5 rounded-[var(--r-pill)]', activa ? 'bg-[var(--acc)]' : 'bg-transparent')} />
    </button>
  );
}

export function SelectorFondo({ fondo, onFondo, foto, onFoto, fondosIa, onGenerarIa, generando, onRetocar, retocando, iaFalla, letrasFallidas, onRepetirSinLetras, letrasIa, onLetrasIa, puedeLetrasIa, estiloInicial, paletaBanda, panelBanda, panelIdea }: Props) {
  const [iaAbierta, setIaAbierta] = useState(false);
  // Hasta que la persona toca un estilo, manda el de su banda (que puede llegar tarde, al cargar su ADN).
  const [estiloElegido, setEstiloElegido] = useState<EstiloCartel | null>(null);
  const estilo = estiloElegido ?? estiloInicial;
  const [retoque, setRetoque] = useState('');
  const [modoRetoque, setModoRetoque] = useState<'libre' | 'fiel'>('libre');
  const conFondoIa = fondo.tipo === 'imagen' && fondo.origen === 'ia';
  const esImagen = (url: string) => fondo.tipo === 'imagen' && fondo.url === url;

  return (
    <div className="grid gap-3">
      {/* Los fondos fijos se desplazan; «subir foto» y «IA» van siempre a la derecha, a la vista (en el ordenador la fila se pasaba de ancho). */}
      <div className="flex items-start gap-2.5">
        <div className="no-scrollbar flex min-w-0 flex-1 gap-2.5 overflow-x-auto" role="group" aria-label="Fondo del cartel">
          {PALETAS.map((p) => (
            <Muestra key={p.id} etiqueta={`Fondo ${p.nombre}`} activa={fondo.tipo === 'paleta' && fondo.id === p.id} onClick={() => onFondo({ tipo: 'paleta', id: p.id })}>
              <MuestraPaleta fondo={p.fondo} acento={p.acento} />
            </Muestra>
          ))}
          {paletaBanda && (
            <Muestra etiqueta="Fondo Tus colores" activa={fondo.tipo === 'paleta' && fondo.id === 'banda'} onClick={() => onFondo({ tipo: 'paleta', id: 'banda' })}>
              <MuestraPaleta fondo={paletaBanda.fondo} acento={paletaBanda.acento} />
            </Muestra>
          )}
          {foto && (
            <Muestra etiqueta="Tu foto" activa={esImagen(foto)} onClick={() => onFondo({ tipo: 'imagen', url: foto, origen: 'foto' })}>
              <img src={foto} alt="" className="size-full object-cover" />
            </Muestra>
          )}
        </div>
        <div className="flex shrink-0 gap-2.5">
          <label className="group grid shrink-0 cursor-pointer justify-items-center gap-1.5" title="Usar una foto vuestra">
            <span className="grid size-12 place-items-center rounded-[var(--r-s)] bg-[var(--sunken)] text-[var(--ink-2)] transition-ui group-hover:text-[var(--ink)]">
              <ImagePlus className="size-5" aria-hidden />
            </span>
            <span className="text-[11px] leading-none text-[var(--ink-2)]">Foto</span>
            <input type="file" accept="image/*" className="sr-only" aria-label="Usar una foto vuestra"
              onChange={(e) => {
                onFoto(e.target.files?.[0]);
                e.target.value = '';
              }} />
          </label>
          <button type="button" onClick={() => setIaAbierta((v) => !v)} aria-expanded={iaAbierta}
            className="group grid shrink-0 cursor-pointer justify-items-center gap-1.5" title="Fondo con IA">
            <span className={cn('grid size-12 place-items-center rounded-[var(--r-s)] transition-ui', iaAbierta ? 'bg-[var(--acc-soft)] text-[var(--acc-ink)]' : 'bg-[var(--sunken)] text-[var(--ink-2)] group-hover:text-[var(--ink)]')}>
              <Sparkles className="size-5" aria-hidden />
            </span>
            <span className="text-[11px] leading-none text-[var(--ink-2)]">IA</span>
          </button>
        </div>
      </div>

      {/* Los fondos que ya se hicieron para este bolo (hasta 8): siempre visibles, no escondidos al final de una fila que se desplaza. */}
      {fondosIa.length > 0 && (
        <div className="grid gap-1.5" role="group" aria-label="Fondos con IA de este bolo">
          <p className="text-xs text-[var(--ink-2)]">Fondos con IA de este bolo · {fondosIa.length}</p>
          <div className="flex flex-wrap gap-2.5">
            {fondosIa.map((url, i) => (
              <Muestra key={url} etiqueta={`Fondo con IA ${i + 1}`} activa={esImagen(url)} onClick={() => onFondo({ tipo: 'imagen', url, origen: 'ia' })}>
                <img src={url} alt="" crossOrigin="anonymous" className="size-full object-cover" />
              </Muestra>
            ))}
          </div>
        </div>
      )}

      {/* Respaldo, no camino principal: solo si la IA ha fallado (o ya se eligió una plantilla, para poder cambiarla). */}
      {(iaFalla || fondo.tipo === 'plantilla') && (
        <div className="grid gap-2 rounded-[var(--r-m)] bg-[var(--sunken)] p-3" aria-label="Carteles de autor">
          <p className="text-xs text-[var(--ink-2)] text-pretty">
            {iaFalla ? 'La IA no ha podido pintar el fondo. Mientras tanto, elige un cartel de autor: sin IA y sin coste, con tu texto, QR y logo.' : 'Cartel de autor (sin IA).'}
          </p>
          <div className="no-scrollbar -mx-1 flex gap-2.5 overflow-x-auto px-1" role="group" aria-label="Plantillas">
            {PLANTILLAS.map((id) => (
              <Muestra key={id} etiqueta={`Plantilla ${ETIQUETA_PLANTILLA[id]}`} activa={fondo.tipo === 'plantilla' && fondo.id === id} onClick={() => onFondo({ tipo: 'plantilla', id })}>
                <MuestraPlantilla id={id} />
              </Muestra>
            ))}
          </div>
        </div>
      )}

      {letrasFallidas && (
        <div role="status" className="grid gap-2 rounded-[var(--r-m)] bg-[var(--acc-soft)] p-3 text-[var(--acc-ink)]">
          <p className="text-xs text-pretty">La IA ha fallado alguna letra del título o la fecha. Puedes repetir el fondo con el texto exacto de la app (3 imágenes más) o seguir retocando este.</p>
          <Button size="xs" variant="raised" className="w-fit" disabled={generando} onClick={() => void onRepetirSinLetras()}>
            {generando ? 'Pintando…' : 'Repetir con el texto exacto'}
          </Button>
        </div>
      )}

      {conFondoIa && (
        <div className="grid gap-2 rounded-[var(--r-m)] bg-[var(--sunken)] p-3" aria-label="Retocar el fondo">
          <p className="text-xs font-medium text-[var(--ink-2)]">Retocar este fondo</p>
          <p className="text-xs text-[var(--ink-2)] text-pretty">
            Cuéntale a la IA qué quieres cambiar. Cada retoque es una versión nueva (1 imagen) y las anteriores siguen en las miniaturas para volver.
          </p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Cómo retocar">
            <Button size="xs" variant={modoRetoque === 'libre' ? 'inverse' : 'raised'} aria-pressed={modoRetoque === 'libre'} onClick={() => setModoRetoque('libre')}>
              Libre, como en ChatGPT
            </Button>
            <Button size="xs" variant={modoRetoque === 'fiel' ? 'inverse' : 'raised'} aria-pressed={modoRetoque === 'fiel'} onClick={() => setModoRetoque('fiel')}>
              Solo lo que pida
            </Button>
          </div>
          <p className="text-xs text-[var(--ink-2)] text-pretty">
            {modoRetoque === 'libre' ? 'La IA vuelve a pintar el cartel con tu comentario: puede rehacer composición, luz y detalles para que quede coherente.' : 'Cambia solo lo que pidas y deja el resto como está; parte del original con todo lo que has ido pidiendo.'}
          </p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Ejemplos de retoque">
            {EJEMPLOS_RETOQUE.map((e) => (
              <Button key={e} size="xs" variant="raised" onClick={() => setRetoque(e)}>
                {e}
              </Button>
            ))}
          </div>
          <div className="relative">
            <Textarea rows={2} maxLength={MAX_RETOQUE} value={retoque} placeholder="Ej.: El cielo más oscuro y menos nubes" className="pr-10" aria-label="Qué quieres cambiar del fondo"
              onChange={(e) => setRetoque(e.target.value)} />
            <BotonVoz valor={retoque} maximo={MAX_RETOQUE} etiqueta="Dictar el retoque" onTexto={setRetoque} />
          </div>
          <Button variant="soft" disabled={retocando || !retoque.trim()} onClick={async () => { if (await onRetocar(retoque.trim(), modoRetoque)) setRetoque(''); }}>
            <Wand2 className="size-4" aria-hidden />
            {retocando ? 'Retocando…' : 'Retocar'}
          </Button>
        </div>
      )}

      {iaAbierta && (
        <div className="grid gap-3 rounded-[var(--r-m)] bg-[var(--sunken)] p-3">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Estilo del fondo">
            {ESTILOS_CARTEL.map((e) => (
              <Button key={e} size="xs" variant={estilo === e ? 'inverse' : 'raised'} aria-pressed={estilo === e} onClick={() => setEstiloElegido(e)}>
                {ETIQUETA_ESTILO[e]}
              </Button>
            ))}
          </div>
          {panelIdea}
          {panelBanda}
          {puedeLetrasIa && (
            <label className="flex cursor-pointer items-start gap-2 text-xs text-[var(--ink-2)]">
              <input type="checkbox" checked={letrasIa} onChange={(e) => onLetrasIa(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[var(--acc)]" />
              <span className="text-pretty">
                <span className="font-medium text-[var(--ink)]">La IA dibuja el título y la fecha</span>: letras integradas en el arte, más de cartel. Puede fallar alguna letra; si pasa, te lo decimos y puedes repetir sin esta opción.
              </span>
            </label>
          )}
          <Button variant="soft" disabled={generando} onClick={async () => { if (await onGenerarIa(estilo)) setIaAbierta(false); }}>
            <Sparkles className="size-4" aria-hidden />
            {generando ? 'Pintando el fondo…' : 'Pintar fondo'}
          </Button>
        </div>
      )}
    </div>
  );
}
