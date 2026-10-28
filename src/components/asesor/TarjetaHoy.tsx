import React from 'react';
import { Button, Card, Chip } from '../ui';
import type { Tarjeta } from '../../utils/asesor/diagnostico';
import type { Formato, Red } from '../../utils/asesor/reglasFormato';

const FORMATO: Record<Formato, string> = { reel: 'Reel', carrusel: 'Carrusel', stories: 'Stories', post: 'Post' };
const RED: Record<Red, string> = { instagram: 'Instagram', tiktok: 'TikTok' };

interface Props {
  tarjeta: Tarjeta;
  onAtajo: (vista: 'carteleria', concertId: string) => void;
}

/** Una pieza que toca hoy: qué, dónde, cuánto cuesta y por qué. */
export function TarjetaHoy({ tarjeta: t, onAtajo }: Props) {
  return (
    <Card as="article" radius="m" className="grid gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip tone="acc">{FORMATO[t.formato]}</Chip>
        {t.redes.map((r) => <Chip key={r}>{RED[r]}</Chip>)}
        <span className="ml-auto text-xs text-[var(--ink-2)] tabular-nums">{t.esfuerzoMin} min</span>
      </div>
      <h3 className="text-base font-semibold text-[var(--ink)]">{t.titulo}</h3>
      <p className="text-sm text-[var(--ink)]">{t.idea}</p>
      <p className="text-xs text-[var(--ink-2)]">{t.porque}</p>
      {t.atajo && (
        <div>
          <Button size="sm" variant="neutral" onClick={() => onAtajo(t.atajo!.vista, t.atajo!.concertId)}>
            Abrir el cartel del bolo
          </Button>
        </div>
      )}
    </Card>
  );
}
