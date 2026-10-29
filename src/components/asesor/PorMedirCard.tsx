import React, { useState } from 'react';
import { Button, Card, Chip, Field, Input } from '../ui';
import { fechaCorta } from '../../utils/campanaConcierto';
import { ETIQUETA_FORMATO, sanearMedidas, type Medidas, type PorMedir } from '../../utils/asesor/resumen';

interface Props {
  pieza: PorMedir;
  onGuardar: (m: Medidas) => Promise<string | null>;
}

/**
 * Una pieza publicada que espera sus números. Son tres, y están en «Estadísticas» de la publicación
 * en Instagram (lección de métricas clave: se miran a las 48 h). La tercera es opcional.
 */
export function PorMedirCard({ pieza, onGuardar }: Props) {
  const [alcance, setAlcance] = useState('');
  const [guardados, setGuardados] = useState('');
  const [noSeguidores, setNoSeguidores] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const medidas = sanearMedidas({ alcance, guardados, alcanceNoSeguidores: noSeguidores });
    if (typeof medidas === 'string') {
      setError(medidas);
      return;
    }
    setGuardando(true);
    setError(await onGuardar(medidas));
    setGuardando(false);
  };

  return (
    <Card as="article" radius="m" className="grid gap-3">
      <form onSubmit={enviar} className="grid gap-3" aria-label={`Resultados de ${pieza.titulo}`}>
        <div className="grid gap-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip tone="acc">{ETIQUETA_FORMATO[pieza.formato]}</Chip>
            <span className="text-xs text-[var(--ink-2)]">Publicada el {fechaCorta(pieza.fecha)}</span>
          </div>
          <h3 className="text-base font-semibold text-[var(--ink)]">{pieza.titulo}</h3>
          <p className="text-xs text-[var(--ink-2)]">En Instagram, abre la publicación y pulsa «Ver estadísticas».</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Cuentas alcanzadas">
            <Input type="number" inputMode="numeric" min={1} value={alcance} onChange={(e) => setAlcance(e.target.value)} />
          </Field>
          <Field label="Guardados">
            <Input type="number" inputMode="numeric" min={0} value={guardados} onChange={(e) => setGuardados(e.target.value)} />
          </Field>
        </div>
        <Field label="De las alcanzadas, las que no os seguían" optional hint="Sale en «Audiencia» de las estadísticas.">
          <Input type="number" inputMode="numeric" min={0} value={noSeguidores} onChange={(e) => setNoSeguidores(e.target.value)} />
        </Field>

        {error && <p role="alert" className="text-sm text-[var(--alert)]">{error}</p>}
        <div>
          <Button type="submit" size="sm" variant="neutral" disabled={guardando || !alcance || !guardados}>
            {guardando ? 'Guardando…' : 'Guardar los números'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
