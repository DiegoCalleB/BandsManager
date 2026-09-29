import React from 'react';
import { ShieldCheck, MapPin, ExternalLink, TrendingUp } from 'lucide-react';
import { Fan } from '../../types';
import { Onda } from '../ui/Onda';

export interface FansDashboardViewProps {
  fans: Fan[];
  clickStats: Record<string, number>;
  effectiveBandName: string;
  evolutionaryGrowthData: any[];
  originData: any[];
  COLORS?: string[];
}

export const FansDashboardView: React.FC<FansDashboardViewProps> = ({
  fans,
  clickStats,
  effectiveBandName,
  evolutionaryGrowthData,
  originData,
}) => {
  const clickEntries = Object.entries(clickStats).filter(([k]) => !k.endsWith('_last_at'));
  const totalClicks = clickEntries.reduce((a, b) => a + Number(b[1] || 0), 0);
  const originTotal = originData.reduce((a, b) => a + Number(b.value || 0), 0) || 1;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-6 flex flex-col justify-center">
          <p className="text-xs font-semibold text-[var(--ink-2)] mb-2">Fans registrados</p>
          <h3 className="text-5xl font-black text-[var(--ink)] font-display tabular-nums">{fans.length}</h3>
        </div>
        <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-6 flex flex-col justify-center">
          <p className="text-xs font-semibold text-[var(--ink-2)] mb-2">Consentimiento RGPD</p>
          <h3 className="text-4xl font-black text-[var(--ok)] font-display flex items-center gap-2">
            <ShieldCheck className="w-8 h-8" />
            100%
          </h3>
        </div>
        <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-6 flex flex-col justify-center">
          <p className="text-xs font-semibold text-[var(--ink-2)] mb-2">Ciudades activas</p>
          <h3 className="text-4xl font-black text-[var(--acc)] font-display flex items-center gap-2 tabular-nums">
            <MapPin className="w-8 h-8" />
            {new Set(fans.map((f) => f.ciudad).filter(Boolean)).size}
          </h3>
        </div>
        <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-6 flex flex-col justify-center">
          <p className="text-xs font-semibold text-[var(--ink-2)] mb-2">Clics en QR y redes</p>
          <h3 className="text-4xl font-black text-[var(--acc)] font-display flex items-center gap-2 tabular-nums">
            <ExternalLink className="w-7 h-7" />
            {totalClicks}
          </h3>
        </div>
      </div>

      {/* Clics por canal: redes, métodos de pago y dossier */}
      {clickEntries.length > 0 && (
        <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-6 space-y-3">
          <h4 className="text-xs font-bold text-[var(--acc-ink)] flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Qué enlaces funcionan: clics por canal y donaciones
          </h4>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {clickEntries.map(([key, count]) => (
              <div
                key={key}
                className="px-3 py-1.5 rounded-[var(--r-pill)] bg-[var(--sunken)] text-xs flex items-center gap-2"
              >
                <span className="font-semibold text-[var(--ink-2)]">{key}</span>
                <span className="font-black text-[var(--acc-ink)] tabular-nums">
                  {count} {count === 1 ? 'clic' : 'clics'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crecimiento de la comunidad */}
        <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-6 min-h-[22rem] flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-bold text-[var(--ink-2)] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[var(--acc)]" />
                Crecimiento de la comunidad
              </p>
              <p className="text-[11px] text-[var(--ink-2)]">Fans acumulados de {effectiveBandName}, mes a mes</p>
            </div>
            <span className="text-xs font-bold text-[var(--acc-ink)] bg-[var(--acc-soft)] px-2.5 py-1 rounded-[var(--r-pill)] shrink-0 tabular-nums">
              {fans.length} fans
            </span>
          </div>

          <div className="flex-1 min-h-0 flex items-end">
            <Onda
              className="w-full"
              data={evolutionaryGrowthData.map((d) => ({ label: String(d.date), value: Number(d.total || 0) }))}
              height={180}
              barWidth={evolutionaryGrowthData.length <= 8 ? 44 : 22}
              gap={12}
              showValues={evolutionaryGrowthData.length <= 8}
              tooltipFormatter={(v) => `${v} fans acumulados`}
              emptyText="La sala está vacía. Vamos a llenarla."
            />
          </div>
        </div>

        {/* Canal de origen */}
        <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-6 min-h-[22rem] flex flex-col">
          <div className="mb-4">
            <p className="text-xs font-bold text-[var(--ink-2)]">Canal de origen</p>
            <p className="text-[11px] text-[var(--ink-2)]">De dónde llegan los registros</p>
          </div>

          {originData.length > 0 ? (
            <div className="space-y-3 overflow-y-auto max-h-72 pr-1">
              {originData.map((item, idx) => {
                const pct = Math.round((Number(item.value || 0) / originTotal) * 100);
                return (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-[var(--ink)] font-semibold truncate">{item.name}</span>
                      <span className="shrink-0 tabular-nums">
                        <span className="text-[var(--acc-ink)] font-bold">{item.value}</span>
                        <span className="text-[var(--ink-2)] ml-1.5">{item.percentage ?? pct}%</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-[var(--r-pill)] bg-[var(--sunken)] overflow-hidden">
                      <div
                        className="h-full rounded-[var(--r-pill)]"
                        style={{
                          width: `${Math.max(pct, 3)}%`,
                          backgroundColor: 'var(--acc)',
                          opacity: Math.max(0.35, 1 - idx * 0.15),
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[var(--ink-2)] text-xs text-center">
              Aún no hay registros. Pon el QR en la mesa de merchan y esto se llena solo.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
