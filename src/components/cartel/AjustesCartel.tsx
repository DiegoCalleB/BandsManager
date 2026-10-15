import React from 'react';
import { X } from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';
import { Field, IconButton, Input, Select, Switch } from '../ui';
import { TODAS } from '../../utils/cartel/datos';
import type { AjustesBolo } from './hooks/useEditorCartel';

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  ajustes: AjustesBolo;
  onCambiar: (cambio: Partial<AjustesBolo>) => void;
  bandas: string[];
  tieneHorario: boolean;
  tieneEnlace: boolean;
  puedeQuitarMarca: boolean;
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
export function AjustesCartel({ abierto, onCerrar, ajustes, onCambiar, bandas, tieneHorario, tieneEnlace, puedeQuitarMarca }: Props) {
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

          <Field label="Línea extra" optional hint="Precio, invitada, «Entrada libre»… Máximo 40 caracteres.">
            <Input maxLength={40} value={ajustes.extra} placeholder="Anticipada 10 € · Taquilla 12 €" onChange={(e) => onCambiar({ extra: e.target.value })} />
          </Field>

          <div className="grid gap-2">
            <Fila titulo="Horario" detalle={tieneHorario ? 'Puertas y show, de la hoja de ruta.' : 'Añade las horas en la hoja de ruta del bolo.'}>
              <Switch aria-label="Horario" checked={tieneHorario && ajustes.horario} disabled={!tieneHorario} onCheckedChange={(v) => onCambiar({ horario: v })} />
            </Fila>
            <Fila titulo="QR en el impreso" detalle={tieneEnlace ? 'Lleva a la página del bolo y cuenta cada escaneo.' : 'No hay enlace disponible ahora mismo.'}>
              <Switch aria-label="QR en el impreso" checked={tieneEnlace && ajustes.qr} disabled={!tieneEnlace} onCheckedChange={(v) => onCambiar({ qr: v })} />
            </Fila>
            <Fila titulo="Hecho con BandManager.io" detalle={puedeQuitarMarca ? 'Gracias por dejarla: así nos conocen otras bandas.' : 'Va incluida en los planes gratuitos.'}>
              <Switch aria-label="Marca BandManager" checked={puedeQuitarMarca ? ajustes.marca : true} disabled={!puedeQuitarMarca} onCheckedChange={(v) => onCambiar({ marca: v })} />
            </Fila>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
