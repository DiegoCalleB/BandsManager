import React from "react";
import {
  Calendar,
  DollarSign,
  Sparkles,
  Disc3,
  ArrowRight,
} from "lucide-react";
import { Concert, Lead, Rehearsal } from "../../types";
import { ShowIcon } from '../ui/ShowIcon';

interface ExecutiveSummaryHeroProps {
  concerts?: Concert[];
  leads?: Lead[];
  rehearsals?: Rehearsal[];
  onNavigate?: (view: string, options?: any) => void;
}

const diasHasta = (fechaIso: string): number => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const objetivo = new Date(fechaIso);
  objetivo.setHours(0, 0, 0, 0);
  return Math.round((objetivo.getTime() - hoy.getTime()) / 86400000);
};

const formatearCuentaAtras = (dias: number): string => {
  if (dias === 0) return "¡Es hoy!";
  if (dias === 1) return "Mañana";
  if (dias > 1) return `En ${dias} días`;
  return "Hoy";
};

interface CardKpiProps {
  icon: React.ReactNode;
  accentVar: "--acc" | "--ok" | "--alert";
  label: string;
  valor: React.ReactNode;
  contexto: string;
  vacio?: string;
  onClick?: () => void;
}

const CardKpi: React.FC<CardKpiProps> = ({
  icon,
  accentVar,
  label,
  valor,
  contexto,
  vacio,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    className={`p-4 rounded-[var(--r-l)] bg-[var(--surface)] text-left space-y-2 transition-ui w-full ${
      onClick
        ? "cursor-pointer hover:brightness-[1.03] active:scale-[0.97]"
        : "cursor-default"
    }`}
  >
    <div className="flex items-center justify-between">
      <div
        className="p-1.5 rounded-[var(--r-s)]"
        style={{
          background: `color-mix(in srgb, var(${accentVar}) 15%, transparent)`,
          color: `var(${accentVar})`,
        }}
      >
        <ShowIcon inline emoji={icon} />
      </div>
      {onClick && <ArrowRight className="w-3.5 h-3.5 text-[var(--ink-2)]" />}
    </div>
    <p className="text-micro font-sans font-semibold text-[var(--ink-2)]">
      {label}
    </p>
    {vacio ? (
      <p className="text-sm font-semibold text-[var(--ink-2)] leading-snug">
        {vacio}
      </p>
    ) : (
      <>
        <p className="text-2xl font-bold text-[var(--ink)] tabular-nums leading-none">
          {valor}
        </p>
        <p className="text-xs text-[var(--ink-2)] leading-snug">{contexto}</p>
      </>
    )}
  </button>
);

/**
 * Los 4 números que un mánager mira antes que nada al abrir la app: cuándo es el próximo show,
 * cuánto le deben, quién espera respuesta suya y cuándo es el próximo ensayo. Widget del
 * catálogo personalizable (tipo 'executive_summary' en DashboardWidgetGrid) — el usuario decide
 * si lo tiene, dónde y con qué tamaño, como cualquier otro widget.
 */
export const ExecutiveSummaryHero: React.FC<ExecutiveSummaryHeroProps> = ({
  concerts = [],
  leads = [],
  rehearsals = [],
  onNavigate,
}) => {
  const hoyIso = new Date().toISOString().slice(0, 10);

  const proximoShow = concerts
    .filter((c) => c.fecha >= hoyIso)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))[0];

  const showsPorCobrar = concerts.filter(
    (c) => c.fecha < hoyIso && c.estado_pago !== "pagado",
  );
  const totalPorCobrar = showsPorCobrar.reduce(
    (sum, c) => sum + (c.cache || 0),
    0,
  );

  // Misma definición de "urgente" que CrmPipelineWidget (ModuleWidgets.tsx), para no tener dos
  // criterios distintos de qué es "necesita tu atención" en la misma pantalla.
  const leadsUrgentes = leads.filter(
    (l) =>
      l.estado === "pendiente_aprobacion" ||
      (l.pitch_generado && l.estado === "nuevo"),
  );

  const proximoEnsayo = rehearsals
    .filter((r) => r.fecha >= hoyIso && r.estado === "programado")
    .sort((a, b) => a.fecha.localeCompare(b.fecha))[0];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <CardKpi
        icon={<Calendar className="w-4 h-4" />}
        accentVar="--acc"
        label="Próximo Show"
        valor={
          proximoShow
            ? formatearCuentaAtras(diasHasta(proximoShow.fecha))
            : null
        }
        contexto={
          proximoShow ? `${proximoShow.sala} · ${proximoShow.ciudad}` : ""
        }
        vacio={
          !proximoShow
            ? "Sin bolos en la agenda. A por el siguiente."
            : undefined
        }
        onClick={onNavigate ? () => onNavigate("calendario") : undefined}
      />
      <CardKpi
        icon={<DollarSign className="w-4 h-4" />}
        accentVar={totalPorCobrar > 0 ? "--alert" : "--ok"}
        label="Por Cobrar"
        valor={
          totalPorCobrar > 0
            ? `${totalPorCobrar.toLocaleString("es-ES")}€`
            : null
        }
        contexto={`${showsPorCobrar.length} ${showsPorCobrar.length === 1 ? "bolo tocado sin liquidar" : "bolos tocados sin liquidar"}`}
        vacio={
          totalPorCobrar === 0 ? "Todo cobrado. Cuentas claras." : undefined
        }
        onClick={onNavigate ? () => onNavigate("finanzas") : undefined}
      />
      <CardKpi
        icon={<Sparkles className="w-4 h-4" />}
        accentVar={leadsUrgentes.length > 0 ? "--alert" : "--ok"}
        label="Esperan Tu Respuesta"
        valor={leadsUrgentes.length > 0 ? leadsUrgentes.length : null}
        contexto={
          leadsUrgentes.length === 1
            ? "pitch listo para revisar"
            : "pitches listos para revisar"
        }
        vacio={
          leadsUrgentes.length === 0
            ? "Bandeja limpia. Nada pendiente."
            : undefined
        }
        onClick={onNavigate ? () => onNavigate("booking") : undefined}
      />
      <CardKpi
        icon={<Disc3 className="w-4 h-4" />}
        accentVar="--acc"
        label="Próximo Ensayo"
        valor={
          proximoEnsayo
            ? formatearCuentaAtras(diasHasta(proximoEnsayo.fecha))
            : null
        }
        contexto={
          proximoEnsayo ? `${proximoEnsayo.lugar} · ${proximoEnsayo.hora}` : ""
        }
        vacio={!proximoEnsayo ? "Sin ensayo en el calendario." : undefined}
        onClick={onNavigate ? () => onNavigate("ensayos") : undefined}
      />
    </div>
  );
};
