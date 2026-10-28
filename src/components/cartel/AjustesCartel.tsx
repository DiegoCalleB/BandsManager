import React from 'react';
import { ImagePlus, X } from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';
import { Field, IconButton, Input, Select, Switch } from '../ui';
import { TODAS } from '../../utils/cartel/datos';
import { MAX_LOGOS } from '../../utils/cartel/config';
import { ELECCIONES_COMPOSICION, ETIQUETA_COMPOSICION, ETIQUETA_LETRA, LETRAS_CARTEL, type ComposicionElegida, type LetraCartel } from '../../utils/cartel/voces';
import type { AjustesBolo } from './hooks/useEditorCartel';

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  ajustes: AjustesBolo;
  onCambiar: (cambio: Partial<AjustesBolo>) => void;
  bandas: string[];
  tieneHorario: boolean;
  tieneDireccion: boolean;
  tieneEnlace: boolean;
  tieneLogo: boolean;
  puedeQuitarMarca: boolean;
  /** Logos de otras bandas del bolo (subidos para este cartel). */
  logos: string[];
  subiendoLogo: boolean;
  onSubirLogo: (archivo: File | undefined) => void;
  onQuitarLogo: (url: string) => void;
}

function Fila({ titulo, detalle, children }: { titulo: string; detalle: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="min-w-0">
        <p className="text-sm text-[var(--ink)]">{titulo}</p>
        <p className="text-xs text-[var(--ink-2)]">{detalle}</p>
      </div>
      {children}
    </div>
  );
}

/** Lo que casi nadie toca, fuera de la pantalla principal (AGENTS.md §6). Se guarda por bolo. */
export function AjustesCartel({ abierto, onCerrar, ajustes, onCambiar, bandas, tieneHorario, tieneDireccion, tieneEnlace, tieneLogo, puedeQuitarMarca, logos, subiendoLogo, onSubirLogo, onQuitarLogo }: Props) {
  if (!abierto) return null;
  return (
    <ModalPortal isOpen onClose={onCerrar}>
      <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-[var(--scrim)]/60 sm:items-center sm:p-4" onClick={onCerrar}>
        <div role="dialog" aria-modal="true" aria-label="Ajustes del cartel" onClick={(e) => e.stopPropagation()}
          className="grid max-h-[85dvh] w-full max-w-md gap-4 overflow-y-auto rounded-t-[var(--r-xl)] bg-[var(--surface)] p-5 sm:rounded-[var(--r-xl)]">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--ink)]">Ajustes del cartel</h2>
            <IconButton label="Cerrar" onClick={onCerrar}>
              <X className="size-4" />
            </IconButton>
          </div>

          {bandas.length > 1 && (
            <Field label="Cabeza de cartel">
              <Select value={ajustes.cabeza ?? TODAS} onChange={(e) => onCambiar({ cabeza: e.target.value })}>
                {bandas.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
                <option value={TODAS}>Todas al mismo tamaño</option>
              </Select>
            </Field>
          )}

          <Field label="Letra del nombre y la fecha" hint="Automática elige según el estilo de vuestra banda.">
            <Select value={ajustes.letra} onChange={(e) => onCambiar({ letra: e.target.value as LetraCartel })}>
              {LETRAS_CARTEL.map((l) => (
                <option key={l} value={l}>{ETIQUETA_LETRA[l]}</option>
              ))}
            </Select>
          </Field>

          <Field label="Composición" hint="Cómo se reparte el cartel. Automática la elige según la letra.">
            <Select value={ajustes.composicion} onChange={(e) => onCambiar({ composicion: e.target.value as ComposicionElegida })}>
              {ELECCIONES_COMPOSICION.map((k) => (
                <option key={k} value={k}>{ETIQUETA_COMPOSICION[k]}</option>
              ))}
            </Select>
          </Field>

          <Field label="Línea extra" optional hint="Precio, invitada, «Entrada libre»… Máximo 40 caracteres.">
            <Input maxLength={40} value={ajustes.extra} placeholder="Anticipada 10 € · Taquilla 12 €" onChange={(e) => onCambiar({ extra: e.target.value })} />
          </Field>

          <div className="grid gap-2">
            <Fila titulo="Horario" detalle={tieneHorario ? 'Puertas y show, de la hoja de ruta.' : 'Añade las horas en la hoja de ruta del bolo.'}>
              <Switch aria-label="Horario" checked={tieneHorario && ajustes.horario} disabled={!tieneHorario} onCheckedChange={(v) => onCambiar({ horario: v })} />
            </Fila>
            <Fila titulo="Dirección" detalle={tieneDireccion ? 'La calle de la sala, de la ficha del bolo.' : 'Añade la dirección en la ficha del bolo.'}>
              <Switch aria-label="Dirección" checked={tieneDireccion && ajustes.direccion} disabled={!tieneDireccion} onCheckedChange={(v) => onCambiar({ direccion: v })} />
            </Fila>
            <Fila titulo="Logo de la banda" detalle={tieneLogo ? 'En la fila de logos, encima de los datos.' : 'Sube el logo en el dossier para poder usarlo.'}>
              <Switch aria-label="Logo de la banda" checked={tieneLogo && ajustes.logo} disabled={!tieneLogo} onCheckedChange={(v) => onCambiar({ logo: v })} />
            </Fila>
            {((tieneLogo && ajustes.logo) || logos.length > 0) && (
              <Fila titulo="Logos en una tinta" detalle="Como impresos con el resto del cartel. Apagado, van a color sobre una placa clara.">
                <Switch aria-label="Logos en una tinta" checked={ajustes.logosTinta} onCheckedChange={(v) => onCambiar({ logosTinta: v })} />
              </Fila>
            )}
            <Fila titulo="QR en el impreso" detalle={tieneEnlace ? 'Lleva a la página del bolo y cuenta cada escaneo.' : 'No hay enlace disponible ahora mismo.'}>
              <Switch aria-label="QR en el impreso" checked={tieneEnlace && ajustes.qr} disabled={!tieneEnlace} onCheckedChange={(v) => onCambiar({ qr: v })} />
            </Fila>
            <Fila titulo="QR también en Feed e Historia" detalle={tieneEnlace ? 'Para quien lo vea en otra pantalla o lo imprima de la captura.' : 'No hay enlace disponible ahora mismo.'}>
              <Switch aria-label="QR también en Feed e Historia" checked={tieneEnlace && ajustes.qr && ajustes.qrDigital} disabled={!tieneEnlace || !ajustes.qr} onCheckedChange={(v) => onCambiar({ qrDigital: v })} />
            </Fila>
            <Fila titulo="Hecho con BandManager.io" detalle={puedeQuitarMarca ? 'Gracias por dejarla: así nos conocen otras bandas.' : 'Va incluida en los planes gratuitos.'}>
              <Switch aria-label="Marca BandManager" checked={puedeQuitarMarca ? ajustes.marca : true} disabled={!puedeQuitarMarca} onCheckedChange={(v) => onCambiar({ marca: v })} />
            </Fila>
          </div>

          <div className="grid gap-2">
            <div>
              <p className="text-sm text-[var(--ink)]">Logos de las otras bandas</p>
              <p className="text-xs text-[var(--ink-2)]">Salen en una fila encima de los datos, junto al de tu banda. Hasta {MAX_LOGOS}. Mejor un PNG sin fondo.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {logos.map((u, i) => (
                <div key={u} className="relative size-14 shrink-0 overflow-hidden rounded-[var(--r-s)] bg-[var(--sunken)]">
                  <img src={u} alt={`Logo ${i + 1}`} className="size-full object-contain p-1.5" />
                  <IconButton label="Quitar logo" size="icon-xs" variant="raised" className="absolute right-0.5 top-0.5" onClick={() => onQuitarLogo(u)}>
                    <X className="size-3" aria-hidden />
                  </IconButton>
                </div>
              ))}
              {logos.length < MAX_LOGOS && (
                <label className="grid size-14 shrink-0 cursor-pointer place-items-center rounded-[var(--r-s)] bg-[var(--sunken)] text-[var(--ink-2)] transition-ui hover:text-[var(--ink)]" title="Añadir un logo">
                  <ImagePlus className="size-5" aria-hidden />
                  <input type="file" accept="image/*" disabled={subiendoLogo} className="sr-only" aria-label="Añadir un logo"
                    onChange={(e) => {
                      onSubirLogo(e.target.files?.[0]);
                      e.target.value = '';
                    }} />
                </label>
              )}
            </div>
            {subiendoLogo && <p className="text-xs text-[var(--ink-2)]">Subiendo el logo…</p>}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
