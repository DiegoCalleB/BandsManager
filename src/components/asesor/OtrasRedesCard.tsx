import React, { useState } from 'react';
import { Card, Chip, Tabs, type TabItem } from '../ui';
import { fechaCorta } from '../../utils/campanaConcierto';
import { ETIQUETA_RED_METRICAS, type MetricasRed, type PorMedirOtrasRedes, type RedExtra } from '../../utils/asesor/metricasPorRed';
import { ETIQUETA_FORMATO } from '../../utils/asesor/resumen';
import { FormMetricasRed } from './FormMetricasRed';

interface Props {
  pieza: PorMedirOtrasRedes;
  onGuardar: (red: RedExtra, metricas: MetricasRed) => Promise<string | null>;
}

/** Un vídeo ya medido en la red principal que pudo salir también en otras redes: los números de cada una, opcionales. */
export function OtrasRedesCard({ pieza, onGuardar }: Props) {
  const [elegida, setElegida] = useState<RedExtra>(pieza.redes[0]);
  const red = pieza.redes.includes(elegida) ? elegida : pieza.redes[0];
  const pestanas: TabItem<RedExtra>[] = pieza.redes.map((r) => ({ id: r, label: ETIQUETA_RED_METRICAS[r] }));

  return (
    <Card as="article" radius="m" className="grid gap-3">
      <div className="grid gap-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip tone="acc">{ETIQUETA_FORMATO[pieza.formato]}</Chip>
          <span className="text-xs text-[var(--ink-2)]">Publicada el {fechaCorta(pieza.fecha)}</span>
        </div>
        <h3 className="text-base font-semibold text-[var(--ink)]">{pieza.titulo}</h3>
      </div>
      {pestanas.length > 1 && <Tabs<RedExtra> aria-label="Red" layout="fill" items={pestanas} value={red} onChange={setElegida} />}
      <FormMetricasRed key={red} red={red} etiqueta={`Resultados de ${pieza.titulo} en ${ETIQUETA_RED_METRICAS[red]}`} onGuardar={(m) => onGuardar(red, m)} />
    </Card>
  );
}
