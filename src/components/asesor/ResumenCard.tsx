import React from 'react';
import { Card, Onda } from '../ui';
import { ETIQUETA_FORMATO, type ItemResumen, type Resumen } from '../../utils/asesor/resumen';

const pct = (t: number) => `${(t * 100).toFixed(1).replace('.', ',')} %`;

function Fila({ item, conLectura }: { item: ItemResumen; conLectura: boolean }) {
  return (
    <li className="grid gap-0.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 text-sm font-medium text-[var(--ink)]">{item.titulo}</span>
        <span className="shrink-0 text-sm text-[var(--ink-2)] tabular-nums">{pct(item.tasaGuardar)}</span>
      </div>
      {conLectura && <p className="text-xs text-[var(--ink-2)]">{item.mensaje}</p>}
    </li>
  );
}

/**
 * Lo que el asesor ha aprendido de lo medido: qué formato os guarda más y qué piezas fueron mejor y
 * peor, con su lectura (valor o descubrimiento). Las barras son la tasa de guardados de cada pieza.
 */
export function ResumenCard({ resumen }: { resumen: Resumen }) {
  const barras = [...resumen.mejores, ...[...resumen.peores].reverse()].map((i) => ({
    label: ETIQUETA_FORMATO[i.formato].charAt(0), value: Math.round(i.tasaGuardar * 1000) / 10,
  }));

  return (
    <Card as="section" radius="l" className="grid gap-4" aria-label="Lo que os ha funcionado">
      <div className="grid gap-1">
        <h2 className="text-sm font-medium text-[var(--ink-2)]">Lo que os ha funcionado · {resumen.piezas} piezas</h2>
        <p className="text-base font-semibold text-[var(--ink)] text-balance">{resumen.mensaje}</p>
      </div>
      <Onda data={barras} height={64} barWidth={24} gap={20} animated={false} showValues valueFormatter={(v) => `${v.toLocaleString('es-ES')} %`} tooltipFormatter={(v) => `${v.toLocaleString('es-ES')} % de quienes la ven la guardan`} />
      <div className="grid gap-3 sm:grid-cols-2">
        <section className="grid gap-2" aria-label="Lo que mejor ha ido">
          <h3 className="text-xs font-medium text-[var(--ink-2)]">Lo que mejor ha ido</h3>
          <ul className="grid gap-2">{resumen.mejores.map((i) => <Fila key={`${i.fecha}-${i.tarjetaId}`} item={i} conLectura={false} />)}</ul>
        </section>
        <section className="grid gap-2" aria-label="Lo que menos">
          <h3 className="text-xs font-medium text-[var(--ink-2)]">Lo que menos, y qué cambiar</h3>
          <ul className="grid gap-2">{resumen.peores.map((i) => <Fila key={`${i.fecha}-${i.tarjetaId}`} item={i} conLectura />)}</ul>
        </section>
      </div>
    </Card>
  );
}
