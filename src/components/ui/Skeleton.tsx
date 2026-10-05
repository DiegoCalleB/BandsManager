import React from 'react';

type SkeletonRadius = 's' | 'm' | 'l' | 'pill';

const RADIUS_VAR: Record<SkeletonRadius, string> = {
  s: 'var(--r-s)',
  m: 'var(--r-m)',
  l: 'var(--r-l)',
  pill: 'var(--r-pill)',
};

export interface SkeletonProps {
  className?: string;
  radius?: SkeletonRadius;
  style?: React.CSSProperties;
}

/** Bloque base de carga: superficie `--sunken` con pulso, respeta prefers-reduced-motion
 *  (ver .animate-pulse en index.css). El tamaño lo pone quien lo usa vía className. */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '', radius = 'm', style }) => (
  <div data-carga="skeleton" className={`animate-pulse bg-[var(--sunken)] ${className}`} style={{ borderRadius: RADIUS_VAR[radius], ...style }} />
);

/** Fila de texto simulada: varias líneas de ancho decreciente, como un párrafo cargando. */
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ lines = 2, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} radius="s" className={`h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
    ))}
  </div>
);

/** Tarjeta KPI cargando: icono + etiqueta + valor grande, mismo hueco que CardKpi real. */
export const SkeletonKpiCard: React.FC = () => (
  <div className="p-4 rounded-[var(--r-l)] bg-[var(--surface)] space-y-3">
    <Skeleton radius="s" className="w-7 h-7" />
    <Skeleton radius="s" className="h-2.5 w-20" />
    <Skeleton radius="s" className="h-6 w-16" />
  </div>
);

/** Panel de dashboard cargando: fila de KPIs + dos tarjetas de widget grandes — la forma
 *  aproximada del panel real, para que la carga no sea "pantalla en blanco → todo de golpe". */
export const SkeletonDashboard: React.FC = () => (
  <div className="space-y-4 w-full">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonKpiCard key={i} />
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="p-5 rounded-[var(--r-l)] bg-[var(--surface)] space-y-4 h-64">
          <Skeleton radius="s" className="h-4 w-40" />
          <Skeleton radius="m" className="h-40 w-full" />
        </div>
      ))}
    </div>
  </div>
);

/** Tarjeta / fila de Lead CRM cargando: avatar + textos de sala + badges */
export const SkeletonLeadRow: React.FC = () => (
  <div className="p-3.5 sm:p-4 rounded-[var(--r-m)] bg-[var(--surface)] flex items-center gap-3.5 w-full">
    <Skeleton radius="m" className="w-10 h-10 shrink-0" />
    <div className="flex-1 space-y-2 min-w-0">
      <Skeleton radius="s" className="h-3.5 w-48" />
      <Skeleton radius="s" className="h-2.5 w-32" />
    </div>
    <div className="hidden sm:flex items-center gap-2">
      <Skeleton radius="pill" className="h-5 w-20" />
      <Skeleton radius="pill" className="h-5 w-16" />
    </div>
  </div>
);

/** Fila de canción del repertorio cargando: índice + título + tono + duración */
export const SkeletonSongRow: React.FC = () => (
  <div className="py-2 px-3 rounded-[var(--r-s)] bg-[var(--surface)] flex items-center justify-between gap-3 w-full">
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <Skeleton radius="s" className="w-5 h-4 shrink-0" />
      <Skeleton radius="s" className="h-3.5 w-40" />
    </div>
    <div className="flex items-center gap-2">
      <Skeleton radius="pill" className="h-4 w-12" />
      <Skeleton radius="s" className="h-3.5 w-10" />
    </div>
  </div>
);

