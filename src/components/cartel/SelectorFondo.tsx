import React, { useState } from 'react';
import { ImagePlus, Sparkles } from 'lucide-react';
import { Button } from '../ui';
import { cn } from '../../utils/cn';
import { PALETAS, type FondoCartel } from '../../utils/cartel/render';
import { ESTILOS_CARTEL, ETIQUETA_ESTILO, type EstiloCartel } from '../../utils/cartel/estilos';
import type { PaletaBanda } from '../../utils/cartel/paleta';

interface Props {
  fondo: FondoCartel;
  onFondo: (f: FondoCartel) => void;
  foto: string | null;
  onFoto: (f: File | undefined) => void;
  fondosIa: string[];
  onGenerarIa: (estilo: EstiloCartel) => Promise<boolean>;
  generando: boolean;
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

export function SelectorFondo({ fondo, onFondo, foto, onFoto, fondosIa, onGenerarIa, generando, letrasIa, onLetrasIa, puedeLetrasIa, estiloInicial, paletaBanda, panelBanda, panelIdea }: Props) {
  const [iaAbierta, setIaAbierta] = useState(false);
  // Hasta que la persona toca un estilo, manda el de su banda (que puede llegar tarde, al cargar su ADN).
  const [estiloElegido, setEstiloElegido] = useState<EstiloCartel | null>(null);
  const estilo = estiloElegido ?? estiloInicial;
  const esImagen = (url: string) => fondo.tipo === 'imagen' && fondo.url === url;

  return (
    <div className="grid gap-3">
      <div className="no-scrollbar -mx-4 flex shrink-0 gap-2.5 overflow-x-auto px-4" role="group" aria-label="Fondo del cartel">
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
        <label className="group grid shrink-0 cursor-pointer justify-items-center gap-1.5" title="Usar una foto vuestra">
          <span className="grid size-12 place-items-center rounded-[var(--r-s)] bg-[var(--sunken)] text-[var(--ink-2)] transition-ui group-hover:text-[var(--ink)]">
            <ImagePlus className="size-5" aria-hidden />
          </span>
          <span className="h-1" />
          <input type="file" accept="image/*" className="sr-only" aria-label="Usar una foto vuestra"
            onChange={(e) => {
              onFoto(e.target.files?.[0]);
              e.target.value = '';
            }} />
        </label>

        {fondosIa.map((url, i) => (
          <Muestra key={url} etiqueta={`Fondo con IA ${i + 1}`} activa={esImagen(url)} onClick={() => onFondo({ tipo: 'imagen', url, origen: 'ia' })}>
            <img src={url} alt="" crossOrigin="anonymous" className="size-full object-cover" />
          </Muestra>
        ))}
        <button type="button" onClick={() => setIaAbierta((v) => !v)} aria-expanded={iaAbierta}
          className="group grid shrink-0 cursor-pointer justify-items-center gap-1.5" title="Fondo con IA">
          <span className={cn('grid size-12 place-items-center rounded-[var(--r-s)] transition-ui', iaAbierta ? 'bg-[var(--acc-soft)] text-[var(--acc-ink)]' : 'bg-[var(--sunken)] text-[var(--ink-2)] group-hover:text-[var(--ink)]')}>
            <Sparkles className="size-5" aria-hidden />
          </span>
          <span className="text-[11px] leading-none text-[var(--ink-2)]">IA</span>
        </button>
      </div>

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
