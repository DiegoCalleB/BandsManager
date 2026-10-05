import React from 'react';
import { Onda } from '../ui/Onda';
import { Sparkles } from 'lucide-react';

/**
 * OndaShowcase — demonstrates the visual personality transformation
 *
 * This component shows what replacing Recharts with Onda looks like.
 * It displays the same data (weekly shows) as a bar chart would,
 * but with BandManager's distinctive vertical-bar-with-rounded-tops language.
 *
 * Per Espectro §2: "Toda serie temporal o comparativa se dibuja como barras
 * verticales de altura variable y puntas redondeadas (border-radius: 999px)"
 */
export const OndaShowcase: React.FC = () => {
  // Demo data: shows per week (typical band booking pattern)
  const weeklyShowsData = [
    { label: 'Sem 1', value: 2 },
    { label: 'Sem 2', value: 4 },
    { label: 'Sem 3', value: 3 },
    { label: 'Sem 4', value: 5 },
    { label: 'Sem 5', value: 6 },
    { label: 'Sem 6', value: 4 },
    { label: 'Sem 7', value: 7 },
    { label: 'Sem 8', value: 5 },
  ];

  return (
    <div className="space-y-6 p-6 bg-[var(--surface)]  rounded-[var(--r-l)]">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-[var(--r-pill)] bg-[var(--acc)]" />
          <h2 className="text-lg font-bold text-[var(--ink)]">Bolos por semana</h2>
          <Sparkles className="w-4 h-4 text-[var(--acc)] opacity-60" />
        </div>
        <p className="text-sm text-[var(--ink-2)]">
          Así se ve BandManager con Onda — la visualización que hace única la identidad de la app. Cada barra redonda es un bolo confirmado.
        </p>
      </div>

      {/* Chart */}
      <div className="bg-[var(--sunken)] rounded-[var(--r-m)] p-8 h-64 flex items-end justify-center">
        <Onda data={weeklyShowsData} height={160} barWidth={20} gap={12} animated={true} className="w-full" />
      </div>

      {/* Explanation */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-[var(--acc-soft)] text-[var(--acc-ink)] p-3 rounded-[var(--r-m)]">
          <span className="font-semibold block mb-1">✓ Onda (BandManager)</span>
          Barras redondas, tokens dinámicos, identidad única
        </div>
        <div className="bg-[var(--sunken)] text-[var(--ink-2)] p-3 rounded-[var(--r-m)]">
          <span className="font-semibold block mb-1">○ Recharts (antes)</span>
          Gráfico genérico que podrías ver en cualquier app
        </div>
      </div>

      {/* Callout */}
      <div className=" pl-4 py-2 space-y-1">
        <p className="text-sm font-semibold text-[var(--ink)]">La personalidad se ve en detalles como este.</p>
        <p className="text-xs text-[var(--ink-2)]">
          Onda no es solo una forma diferente de graficar — es el único lenguaje visual de BandManager. Hace que cualquiera que use la app
          sienta que es para músicos, no es un SaaS genérico.
        </p>
      </div>
    </div>
  );
};

export default OndaShowcase;
