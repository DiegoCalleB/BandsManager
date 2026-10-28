import React from 'react';
import { Check, Sparkles } from 'lucide-react';
import { ActionMenu, Button, Card, Chip, type ActionMenuItem } from '../ui';
import type { Tarjeta } from '../../utils/asesor/opciones';
import type { AccionAsesor } from '../../utils/asesorApi';
import { NOMBRE_FORMATO, NOMBRE_RED } from './nombres';

interface Props {
  tarjeta: Tarjeta;
  /** Una idea recomendada se ve entera; una alternativa, en una fila compacta. */
  compacta?: boolean;
  ocupada: boolean;
  onPreparar: (t: Tarjeta) => void;
  onAccion: (id: string, accion: AccionAsesor) => void;
  onAtajo: (vista: 'carteleria', concertId: string) => void;
}

/**
 * Una idea de hoy: qué, dónde, cuánto cuesta y por qué. Una sola acción visible (preparar la pieza)
 * y «Hecho» al lado; lo demás (saltar, abrir el cartel) en el «⋯».
 */
export function TarjetaHoy({ tarjeta: t, compacta = false, ocupada, onPreparar, onAccion, onAtajo }: Props) {
  const menu: ActionMenuItem[] = [
    { label: 'Abrir el cartel del bolo', onSelect: () => t.atajo && onAtajo(t.atajo.vista, t.atajo.concertId), hidden: !t.atajo },
    { label: 'Hoy no, otra idea', onSelect: () => onAccion(t.id, 'saltado'), hidden: t.hecha },
    { label: 'Deshacer «hecha»', onSelect: () => onAccion(t.id, 'pendiente'), hidden: !t.hecha },
  ];

  return (
    <Card as="article" radius="m" tone={compacta ? 'sunken' : 'surface'} padding={compacta ? 'sm' : 'md'} className="grid gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip tone={t.hecha ? 'ok' : 'acc'}>{t.hecha ? 'Hecha' : NOMBRE_FORMATO[t.formato]}</Chip>
        {!compacta && t.redes.map((r) => <Chip key={r}>{NOMBRE_RED[r]}</Chip>)}
        <span className="ml-auto text-xs text-[var(--ink-2)] tabular-nums">{t.esfuerzoMin} min</span>
      </div>

      <h3 className={`font-semibold text-[var(--ink)] ${compacta ? 'text-sm' : 'text-base'}`}>{t.titulo}</h3>
      {!compacta && (
        <>
          <p className="text-sm text-[var(--ink)]">{t.idea}</p>
          <p className="text-xs text-[var(--ink-2)]">{t.porque}</p>
        </>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" variant={compacta ? 'raised' : 'neutral'} onClick={() => onPreparar(t)}>
          <Sparkles className="size-4" aria-hidden />
          {compacta ? 'Elegir esta' : 'Preparar pieza'}
        </Button>
        {!t.hecha && (
          <Button size="sm" variant="ghost" disabled={ocupada} onClick={() => onAccion(t.id, 'hecho')}>
            <Check className="size-4" aria-hidden />
            Hecho
          </Button>
        )}
        <ActionMenu label={`Más opciones de «${t.titulo}»`} items={menu} className="ml-auto" />
      </div>
    </Card>
  );
}
