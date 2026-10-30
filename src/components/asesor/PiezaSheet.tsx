import React, { useState } from 'react';
import { Check, Copy, RefreshCw, X } from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';
import { Button, Chip, IconButton, SkeletonText, Tabs, type TabItem } from '../ui';
import { copyToClipboard } from '../../utils/shareUtils';
import type { Tarjeta } from '../../utils/asesor/opciones';
import { ETIQUETA_PASO, partirTextoYoutube, type Pieza } from '../../utils/asesor/pieza';
import type { Red } from '../../utils/asesor/reglasFormato';
import type { EstadoPieza } from './hooks/useAsesor';
import { NOMBRE_FORMATO, NOMBRE_RED } from './nombres';
import { LaminasPieza } from './LaminasPieza';
import { esFormatoLamina } from '../../utils/asesor/laminas';
import type { BandaLaminas } from './hooks/useLaminas';

interface Props {
  tarjeta: Tarjeta;
  banda: BandaLaminas;
  estado: EstadoPieza | undefined;
  ocupada: boolean;
  onCerrar: () => void;
  onOtraVersion: () => void;
  onHecha: () => void;
}

function BotonCopiar({ texto, etiqueta = 'Copiar' }: { texto: string; etiqueta?: string }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    if (await copyToClipboard(texto)) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    }
  };
  return (
    <Button size="xs" variant="ghost" onClick={copiar}>
      {copiado ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      {copiado ? 'Copiado' : etiqueta}
    </Button>
  );
}

function Bloque({ titulo, children, copiar }: { titulo: string; children: React.ReactNode; copiar?: string }) {
  return (
    <section className="grid gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-medium text-[var(--ink-2)]">{titulo}</h3>
        {copiar && <BotonCopiar texto={copiar} />}
      </div>
      {children}
    </section>
  );
}

/** El texto de la red elegida, listo para pegar: cuerpo y hashtags. */
const textoParaPegar = (p: Pieza, red: Red) => {
  const t = p.textos.find((x) => x.red === red);
  return t ? [t.texto, t.hashtags.join(' ')].filter(Boolean).join('\n\n') : '';
};

/** YouTube Studio tiene dos campos: se enseñan y se copian por separado, no un texto junto. */
function TextoYoutube({ texto, hashtags }: { texto: string; hashtags: string[] }) {
  const { titulo, descripcion } = partirTextoYoutube(texto);
  const descripcionCompleta = [descripcion, hashtags.join(' ')].filter(Boolean).join('\n\n');
  return (
    <>
      <Bloque titulo={`Título (${titulo.length} de 70 caracteres)`} copiar={titulo}>
        <p className="text-base font-semibold text-[var(--ink)]">{titulo}</p>
      </Bloque>
      {descripcionCompleta && (
        <Bloque titulo="Descripción" copiar={descripcionCompleta}>
          {descripcion && <p className="whitespace-pre-line text-sm text-[var(--ink)]">{descripcion}</p>}
          {hashtags.length > 0 && <p className="text-sm text-[var(--acc-ink)]">{hashtags.join(' ')}</p>}
        </Bloque>
      )}
    </>
  );
}

function ContenidoPieza({ pieza: p, banda }: { pieza: Pieza; banda: BandaLaminas }) {
  const [red, setRed] = useState<Red>(p.textos[0].red);
  const redes: TabItem<Red>[] = p.textos.map((t) => ({ id: t.red, label: NOMBRE_RED[t.red] }));
  const actual = p.textos.find((t) => t.red === red) ?? p.textos[0];

  return (
    <div className="grid gap-5">
      <Bloque titulo={p.formato === 'reel' ? 'Los 3 primeros segundos' : 'Gancho'} copiar={p.gancho}>
        <p className="text-lg font-semibold text-[var(--ink)] text-balance">{p.gancho}</p>
      </Bloque>

      {p.pasos.length > 0 && (
        <Bloque titulo={p.formato === 'reel' ? 'Guion' : p.formato === 'carrusel' ? 'Slides' : 'Pantallas'}>
          <ol className="grid gap-2">
            {p.pasos.map((paso, i) => (
              <li key={i} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 rounded-[var(--r-s)] bg-[var(--sunken)] p-3">
                <span className="text-xs font-medium text-[var(--acc-ink)] tabular-nums">{ETIQUETA_PASO[p.formato]} {i + 1}</span>
                <div className="grid gap-0.5">
                  {paso.titulo && <p className="text-sm font-medium text-[var(--ink)]">{paso.titulo}</p>}
                  {paso.detalle && <p className="text-sm text-[var(--ink-2)]">{paso.detalle}</p>}
                </div>
              </li>
            ))}
          </ol>
        </Bloque>
      )}

      {esFormatoLamina(p.formato) && <LaminasPieza pieza={p} formato={p.formato} banda={banda} />}

      {p.portada && (
        <Bloque titulo="Texto de la portada" copiar={p.portada}>
          <p className="text-base font-semibold text-[var(--ink)]">{p.portada}</p>
        </Bloque>
      )}

      {redes.length > 1 && <Tabs<Red> aria-label="Red" layout="fill" items={redes} value={actual.red} onChange={setRed} />}
      {actual.red === 'youtube' ? <TextoYoutube texto={actual.texto} hashtags={actual.hashtags} /> : (
        <Bloque titulo="Texto para publicar" copiar={textoParaPegar(p, actual.red)}>
          <p className="whitespace-pre-line text-sm text-[var(--ink)]">{actual.texto}</p>
          {actual.hashtags.length > 0 && <p className="text-sm text-[var(--acc-ink)]">{actual.hashtags.join(' ')}</p>}
        </Bloque>
      )}

      {p.cta && (
        <Bloque titulo="Para cerrar">
          <p className="text-sm text-[var(--ink)]">{p.cta}</p>
        </Bloque>
      )}
    </div>
  );
}

/** La pieza lista para publicar: se lee de arriba abajo en el orden en que se graba y se publica. */
export function PiezaSheet({ tarjeta: t, banda, estado, ocupada, onCerrar, onOtraVersion, onHecha }: Props) {
  return (
    <ModalPortal isOpen onClose={onCerrar}>
      <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-[var(--scrim)]/75 sm:items-center sm:p-4" onClick={onCerrar}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Pieza: ${t.titulo}`}
          data-modulo="reels"
          className="flex max-h-[92vh] w-full max-w-xl flex-col rounded-t-[var(--r-xl)] bg-[var(--surface)] text-[var(--ink)] sm:rounded-[var(--r-xl)]"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="flex items-start gap-3 px-5 pb-3 pt-5">
            <div className="grid min-w-0 flex-1 gap-1">
              <div className="flex flex-wrap gap-1.5">
                <Chip tone="acc">{NOMBRE_FORMATO[t.formato]}</Chip>
                {t.redes.map((r) => <Chip key={r}>{NOMBRE_RED[r]}</Chip>)}
              </div>
              <h2 className="text-lg font-semibold text-balance">{t.titulo}</h2>
            </div>
            <IconButton label="Cerrar" variant="ghost" onClick={onCerrar}><X className="size-5" aria-hidden /></IconButton>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
            {(!estado || estado.estado === 'cargando') && (
              <div className="grid gap-3 py-2" aria-live="polite">
                <p className="text-sm text-[var(--ink-2)]">Escribiéndola con vuestra voz…</p>
                <SkeletonText lines={7} />
              </div>
            )}
            {estado?.estado === 'error' && (
              <div className="grid justify-items-start gap-3 py-2">
                <p role="alert" className="text-sm text-[var(--alert)]">{estado.mensaje}</p>
                <Button size="sm" onClick={onOtraVersion}>Reintentar</Button>
              </div>
            )}
            {estado?.estado === 'lista' && <ContenidoPieza key={estado.pieza.gancho} pieza={estado.pieza} banda={banda} />}
          </div>

          <footer className="flex items-center gap-2 px-5 pb-5 pt-3">
            <Button variant="ghost" size="sm" onClick={onOtraVersion} disabled={estado?.estado === 'cargando'}>
              <RefreshCw className="size-4" aria-hidden />
              Otra versión
            </Button>
            {t.hecha ? (
              <Chip tone="ok" className="ml-auto">Ya está hecha</Chip>
            ) : (
              <Button variant="primary" className="ml-auto" disabled={ocupada || estado?.estado !== 'lista'} onClick={onHecha}>
                <Check className="size-4" aria-hidden />
                Marcar como publicada
              </Button>
            )}
          </footer>
        </div>
      </div>
    </ModalPortal>
  );
}
