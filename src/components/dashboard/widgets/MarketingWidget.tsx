import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { Fan, Lead } from '../../../types';
import { Card, EmptyState, LinkButton, Onda } from '../../ui';
import { calcularIndicadores, textoVariacion, type ParActual } from '../../../utils/indicadoresMarketing';
import { listarEnlaces } from '../../../utils/promocionApi';

interface MarketingWidgetProps {
  fans: Fan[];
  leads: Lead[];
  onNavigate?: (view: string) => void;
}

interface CifraProps {
  etiqueta: string;
  valor: number;
  detalle: string;
  children?: React.ReactNode;
}

function Cifra({ etiqueta, valor, detalle, children }: CifraProps) {
  return (
    <div className="rounded-[var(--r-m)] bg-[var(--sunken)] p-4 space-y-1">
      <p className="text-xs text-[var(--ink-2)]">{etiqueta}</p>
      <p className="text-3xl font-semibold text-[var(--ink)] tabular-nums">{valor.toLocaleString('es-ES')}</p>
      <p className="text-xs text-[var(--ink-2)]">{detalle}</p>
      {children}
    </div>
  );
}

/**
 * «Tu marketing»: a cuánta gente llegas, cuántos fans apuntas, cuántas salas contestan y cuántas
 * dicen que sí. Mismo criterio honesto que «Lo que has cobrado»: solo hechos con fecha, comparados
 * con los 30 días anteriores, sin flechas ni colores de bolsa (ver src/utils/indicadoresMarketing.ts).
 */
export function MarketingWidget({ fans, leads, onNavigate }: MarketingWidgetProps) {
  const [clics7, setClics7] = useState<number[] | undefined>(undefined);

  // Los clics son un extra: si el servidor no responde, el widget funciona igual con el resto.
  useEffect(() => {
    let vivo = true;
    listarEnlaces()
      .then((l) => vivo && setClics7(l.totales.ultimos7))
      .catch(() => { /* ver comentario de arriba: sin clics el widget sigue sirviendo */ });
    return () => {
      vivo = false;
    };
  }, []);

  const ind = useMemo(() => calcularIndicadores({ fans, leads }), [fans, leads]);
  const totalClics = clics7?.reduce((a, b) => a + b, 0) ?? 0;
  const sinNada = ind.vacio && totalClics === 0;
  const par = (p: ParActual) => textoVariacion(p);

  return (
    <Card as="section" padding="md" className="space-y-4" data-modulo="fans" aria-label="Tu marketing">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[var(--ink-2)]">Tu marketing</h3>
          <p className="text-xs text-[var(--ink-2)]">últimos 30 días</p>
        </div>
        {onNavigate && (
          <LinkButton tone="muted" onClick={() => onNavigate('fans')}>
            Fans <ArrowRight className="w-3.5 h-3.5" />
          </LinkButton>
        )}
      </div>

      {sinNada ? (
        <EmptyState
          compact
          title="Todavía no ha sonado nada."
          description="Comparte el enlace de tu próximo bolo, pon el QR en la mesa de merch y escribe a una sala: aquí verás cuánta gente llega."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Cifra etiqueta="Gente que ha pulsado tus enlaces" valor={totalClics} detalle="en los últimos 7 días">
            {clics7 && totalClics > 0 && (
              <Onda data={clics7.map((v, i) => ({ label: String(i), value: v }))} height={36} barWidth={8} gap={4} showLabels={false} />
            )}
          </Cifra>
          <Cifra etiqueta="Fans nuevos" valor={ind.fans.actual} detalle={par(ind.fans)} />
          <Cifra etiqueta="Salas que han contestado" valor={ind.respondieron.actual} detalle={`de ${ind.enviados.actual} a las que has escrito`} />
          <Cifra etiqueta="Salas que han dicho que sí" valor={ind.dijeronSi.actual} detalle={par(ind.dijeronSi)} />
        </div>
      )}
    </Card>
  );
}
