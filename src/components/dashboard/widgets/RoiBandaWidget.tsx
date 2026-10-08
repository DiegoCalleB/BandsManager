import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { Concert, Payment } from '../../../types';
import { Card, Chip, EmptyState, LinkButton, Onda } from '../../ui';
import { calcularRoi, clicsDeEntradas } from '../../../utils/roiBanda';
import { listarEnlaces } from '../../../utils/promocionApi';

interface RoiBandaWidgetProps {
  concerts: Concert[];
  payments: Payment[];
  /** Plan de la sesión (sin normalizar). */
  plan?: string;
  /** El dinero solo lo ven los líderes, igual que en Finanzas y en el chatbot. */
  puedeVerDinero: boolean;
  onNavigate?: (view: string) => void;
}

const eur = (n: number) => `${Math.round(n).toLocaleString('es-ES')} €`;
const etiquetaMes = (m: string) => new Date(`${m}-01T12:00:00Z`).toLocaleDateString('es-ES', { month: 'short', timeZone: 'UTC' }).replace('.', '');
const hoyMadrid = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });

/**
 * «Lo que has cobrado» frente a lo que cuesta el plan. Honesto por diseño: solo dinero cobrado, sin
 * previsiones ni pendientes, y no dice que BandManager lo haya generado (ver src/utils/roiBanda.ts).
 */
export function RoiBandaWidget({ concerts, payments, plan, puedeVerDinero, onNavigate }: RoiBandaWidgetProps) {
  const [clicsEntradas, setClicsEntradas] = useState<number | undefined>(undefined);

  // Los clics a entradas son un extra: si el servidor no responde, el widget funciona igual sin ellos.
  useEffect(() => {
    if (!puedeVerDinero) return;
    let vivo = true;
    listarEnlaces()
      .then((l) => vivo && setClicsEntradas(clicsDeEntradas(l.enlaces)))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [puedeVerDinero]);

  const roi = useMemo(() => calcularRoi({ concerts, payments, plan, hoy: hoyMadrid(), clicsEntradas }), [concerts, payments, plan, clicsEntradas]);

  if (!puedeVerDinero) return null;

  const datos = roi.meses.map((m, i) => ({ label: etiquetaMes(m), value: roi.porMes[i] }));

  return (
    <Card as="section" padding="md" className="space-y-4" aria-label="Lo que has cobrado">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[var(--ink-2)]">Lo que has cobrado</h3>
          <p
            className="text-xs text-[var(--ink-2)]"
            title="Caché de los bolos marcados como pagados y otros ingresos cobrados en Finanzas, de los últimos 3 meses. No incluye lo pendiente ni lo previsto."
          >
            últimos 3 meses
          </p>
        </div>
        {onNavigate && (
          <LinkButton tone="muted" onClick={() => onNavigate('finanzas')}>
            Finanzas <ArrowRight className="w-3.5 h-3.5" />
          </LinkButton>
        )}
      </div>

      {roi.estado === 'sin_datos' ? (
        <EmptyState
          compact
          title="Aquí aparecerá lo que cobres."
          description="Marca un bolo como pagado en el calendario y se suma solo."
        />
      ) : roi.ingresos === 0 ? (
        <>
          <p className="text-sm text-[var(--ink-2)]">Todavía no has cobrado ningún bolo en estos meses.</p>
          <p className="text-xs text-[var(--ink-2)] tabular-nums">
            {roi.entradasVendidas} entradas vendidas
            {roi.clicsEntradas > 0 && ` · ${roi.clicsEntradas} clics a entradas en 90 días`}
          </p>
        </>
      ) : (
        <>
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <p className="text-3xl font-bold tabular-nums">{eur(roi.ingresos)}</p>
            {roi.multiplo !== null ? (
              <Chip tone="acc" title={`Tu plan cuesta ${eur(roi.costePlan)} en estos 3 meses. No significa que BandManager lo haya generado: es lo cobrado frente a lo que pagas.`}>
                ×{roi.multiplo.toLocaleString('es-ES')} lo que cuesta tu plan
              </Chip>
            ) : (
              roi.precioMensual === 0 && <Chip title="Con un plan gratuito todo lo que cobras es tuyo.">plan gratuito</Chip>
            )}
          </div>

          <Onda data={datos} height={72} barWidth={28} gap={10} showValues valueFormatter={(v) => (v > 0 ? eur(v) : '')} animated={false} />

          <p className="text-xs text-[var(--ink-2)] tabular-nums">
            {roi.bolosCobrados} {roi.bolosCobrados === 1 ? 'bolo cobrado' : 'bolos cobrados'} · {roi.entradasVendidas} entradas vendidas
            {roi.clicsEntradas > 0 && ` · ${roi.clicsEntradas} clics a entradas en 90 días`}
          </p>
        </>
      )}
    </Card>
  );
}
