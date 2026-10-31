import React, { useState } from 'react';
import { Button, Field, Input } from '../ui';
import { CAMPOS, sanearMetricasRed, type MetricasRed, type RedExtra } from '../../utils/asesor/metricasPorRed';

interface Props {
  red: RedExtra;
  /** Nombre accesible del formulario (la pieza y la red). */
  etiqueta: string;
  /** Guarda los números ya validados; devuelve el motivo si no se pudo, para enseñarlo junto a los campos. */
  onGuardar: (metricas: MetricasRed) => Promise<string | null>;
}

/**
 * Los números de una pieza en TikTok o YouTube Shorts. Los campos salen de `CAMPOS`, con el nombre que
 * tiene cada número en la app de su red para que se encuentre a la primera. Solo el primero es obligatorio.
 */
export function FormMetricasRed({ red, etiqueta, onGuardar }: Props) {
  const campos = CAMPOS[red];
  const [valores, setValores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const obligatorios = campos.filter((c) => c.obligatorio);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const metricas = sanearMetricasRed(red, valores);
    if (typeof metricas === 'string') {
      setError(metricas);
      return;
    }
    setGuardando(true);
    setError(await onGuardar(metricas));
    setGuardando(false);
  };

  return (
    <form onSubmit={enviar} className="grid gap-3" aria-label={etiqueta}>
      <div className="grid gap-3 sm:grid-cols-2">
        {campos.map((c) => (
          <Field key={c.id} label={c.etiqueta} hint={c.ayuda} optional={!c.obligatorio}>
            <Input type="number" inputMode={c.tipo === 'entero' ? 'numeric' : 'decimal'} min={0} step={c.tipo === 'entero' ? 1 : 0.1}
              value={valores[c.id] ?? ''} onChange={(e) => setValores((v) => ({ ...v, [c.id]: e.target.value }))} />
          </Field>
        ))}
      </div>
      {error && <p role="alert" className="text-sm text-[var(--alert)]">{error}</p>}
      <div>
        <Button type="submit" size="sm" variant="neutral" disabled={guardando || obligatorios.some((c) => !valores[c.id])}>
          {guardando ? 'Guardando…' : 'Guardar los números'}
        </Button>
      </div>
    </form>
  );
}
