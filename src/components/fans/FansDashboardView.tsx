import React from 'react';
import { ShieldCheck, MapPin, ExternalLink, TrendingUp, Users } from 'lucide-react';
import { Fan } from '../../types';
import { CurveSeries } from '../ui/CurveSeries';

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
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
        {[
          { label: 'Fans registrados', value: fans.length.toLocaleString('es-ES'), icon: Users },
          { label: 'Consentimiento RGPD', value: '100%', icon: ShieldCheck },
          { label: 'Ciudades activas', value: new Set(fans.map((f) => f.ciudad).filter(Boolean)).size.toLocaleString('es-ES'), icon: MapPin },
          { label: 'Clics en QR y redes', value: totalClicks.toLocaleString('es-ES'), icon: ExternalLink },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex flex-col justify-center rounded-[var(--r-l)] bg-[var(--surface)] p-4 md:p-6">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[var(--ink-2)]">
              <Icon aria-hidden className="size-3.5 shrink-0" />
              {label}
            </p>
            <p className="font-display text-3xl font-bold tabular-nums text-[var(--ink)] md:text-4xl">{value}</p>
          </div>
        ))}
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
                <span className="font-bold text-[var(--acc-ink)] tabular-nums">
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
              <p className="text-xs text-[var(--ink-2)]">Fans acumulados de {effectiveBandName}, mes a mes</p>
            </div>
            <span className="text-xs font-bold text-[var(--acc-ink)] bg-[var(--acc-soft)] px-2.5 py-1 rounded-[var(--r-pill)] shrink-0 tabular-nums">
              {fans.length} fans
            </span>
          </div>

          <div className="flex-1 min-h-0 flex items-end">
            {evolutionaryGrowthData.length === 0 ? (
              <p className="w-full self-center text-center text-xs text-[var(--ink-2)]">La sala está vacía. Vamos a llenarla.</p>
            ) : (
              <CurveSeries
                className="w-full"
                height={200}
                area
                formatValue={(v) => `${v.toLocaleString('es-ES')} fans`}
                series={[{ label: 'Fans acumulados', color: 'var(--acc)', data: evolutionaryGrowthData.map((d) => ({ label: String(d.date), value: Number(d.total || 0) })) }]}
              />
            )}
          </div>
        </div>

        {/* Canal de origen */}
        <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-6 min-h-[22rem] flex flex-col">
          <div className="mb-4">
            <p className="text-xs font-bold text-[var(--ink-2)]">Canal de origen</p>
            <p className="text-xs text-[var(--ink-2)]">De dónde llegan los registros</p>
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
