import React, { useState, useEffect, useMemo } from "react";
import {
  Building2,
  DollarSign,
  Users,
  ArrowRight,
  Zap,
  TrendingUp,
} from "lucide-react";
import { Lead, Concert, Fan, ThemeColors, Setlist, Song } from "../../../types";
import { getEnergyInfo } from "../../../utils/energyPacingUtils";
import { Onda, OndaSeries } from "../../ui/Onda";
import { api } from "../../../services/api";

// Espectro resuelve claro/oscuro en tokens: las ramas `isStitchLight` que llegan de main no deben
// activarse nunca (traerían de vuelta slate/indigo). Se eliminan en el restyle de este fichero.
const isStitchLight = false;

export interface ChartWidgetProps {
  /** Heredado de main: Espectro resuelve el tema en tokens, así que se acepta y se ignora. */
  isStitchLight?: boolean;
  leads?: Lead[];
  concerts?: Concert[];
  fans?: Fan[];
  setlists?: Setlist[];
  songs?: Song[];
  currentUser?: Record<string, unknown>;
  activeBandName?: string;
  colors?: ThemeColors;
  onNavigate?: (view: string, options?: Record<string, unknown>) => void;
  heightMode?: "compact" | "normal" | "tall";
}

/* 1. GRÁFICO DE ENERGÍA DE REPERTORIO & SETLIST */
export function RepertorioEnergyChartWidget({
  onNavigate,
  heightMode = "normal",
  setlists: providedSetlists,
  songs: providedSongs,
}: ChartWidgetProps) {
  const [setlistsList, setSetlistsList] = useState<Setlist[]>(
    providedSetlists || [],
  );
  const [songsList, setSongsList] = useState<Song[]>(providedSongs || []);
  const [selectedRepertorioId, setSelectedRepertorioId] =
    useState<string>("all");

  // Dashboard.tsx ya carga setlists/songs una sola vez y se los pasa a TODOS sus widgets — este
  // efecto solo debe reflejar esas props (aunque de entrada lleguen vacías, mientras el padre
  // sigue cargando) y sincronizarse cuando cambien. Antes, comprobar `.length` en vez de
  // `undefined` hacía que el widget disparara su PROPIO fetch en paralelo con el del padre en
  // cuanto llegaba un array vacío (justo lo que pasa en el primer render, antes de que el padre
  // termine de cargar) — dos peticiones idénticas a la vez, cada vez que se abre el dashboard.
  // El fetch propio queda solo para cuando NADIE pasa estas props (undefined de verdad, p.ej.
  // este widget usado aislado, sin Dashboard.tsx de por medio).
  useEffect(() => {
    if (providedSetlists !== undefined || providedSongs !== undefined) {
      setSetlistsList(providedSetlists || []);
      setSongsList(providedSongs || []);
      return;
    }

    const loadData = async () => {
      try {
        const [setlistsRes, songsRes] = await Promise.all([
          api.getSetlists(),
          api.getSongs(),
        ]);
        setSetlistsList(setlistsRes?.setlists || []);
        setSongsList(songsRes?.songs || []);
      } catch (err) {
        console.error("[Dashboard] Error fetching setlists/songs:", err);
      }
    };

    loadData();
  }, [providedSetlists, providedSongs]);

  // Prepare chart data for active setlist or fallback demo setlist
  let chartData: Array<{
    num: number;
    title: string;
    energy: number;
    bpm: number;
    keyStr: string;
    label: string;
    hexColor: string;
    durationMin: number;
  }> = [];

  // Use selected repertorio/setlist or active setlist
  const activeSetlist =
    selectedRepertorioId === "all"
      ? setlistsList[0]
      : setlistsList.find((s) => s.id === selectedRepertorioId);

  if (
    activeSetlist?.items &&
    Array.isArray(activeSetlist.items) &&
    activeSetlist.items.length > 0
  ) {
    chartData = activeSetlist.items.map((item, idx: number) => {
      const itemAny = item as unknown as Record<string, unknown>;
      const matchedSong =
        songsList.find(
          (s) =>
            s.id === itemAny.song_id ||
            s.titulo === itemAny.title ||
            s.id === itemAny.songId,
        ) || (itemAny.song as Song | undefined);
      const energyVal =
        (itemAny.energia as number) || matchedSong?.energia || 12;
      const energyInfo = getEnergyInfo(energyVal);
      return {
        num: idx + 1,
        title:
          (itemAny.title as string) || matchedSong?.titulo || `Tema ${idx + 1}`,
        energy: energyVal,
        bpm: (itemAny.bpm as number) || matchedSong?.bpm || 120,
        keyStr: (itemAny.tonalidad as string) || matchedSong?.tonalidad || "Am",
        label: energyInfo.label,
        hexColor: energyInfo.hexColor,
        durationMin: (itemAny.duracion_segundos as number)
          ? Math.round((itemAny.duracion_segundos as number) / 60)
          : 4,
      };
    });
  } else if (songsList.length > 0) {
    chartData = songsList.slice(0, 20).map((song, idx: number) => {
      const songAny = song as unknown as Record<string, unknown>;
      const energyVal =
        (songAny.energia as number) ||
        ((songAny.bpm as number) >= 140
          ? 18
          : (songAny.bpm as number) <= 95
            ? 6
            : 12);
      const energyInfo = getEnergyInfo(energyVal);
      return {
        num: idx + 1,
        title: (songAny.titulo as string) || `Canción ${idx + 1}`,
        energy: energyVal,
        bpm: (songAny.bpm as number) || 120,
        keyStr: (songAny.tonalidad as string) || "C",
        label: energyInfo.label,
        hexColor: energyInfo.hexColor,
        durationMin: Math.round(
          (Number(songAny.duracionSegundos ?? songAny.duracion_segundos) ||
            240) / 60,
        ),
      };
    });
  } else {
    // Fallback demo data
    const demoItems = [
      { title: "Intro: Despegue", energy: 6, bpm: 90, keyStr: "Em", dur: 2 },
      {
        title: "Ritmo en las Calles",
        energy: 12,
        bpm: 124,
        keyStr: "G",
        dur: 4,
      },
      { title: "Furia Eléctrica", energy: 16, bpm: 132, keyStr: "A", dur: 4 },
      {
        title: "Balada de Medianoche",
        energy: 8,
        bpm: 85,
        keyStr: "C",
        dur: 5,
      },
      { title: "Clímax Festival", energy: 19, bpm: 140, keyStr: "D", dur: 4 },
      {
        title: "Bis: Himno de la Banda",
        energy: 17,
        bpm: 138,
        keyStr: "A",
        dur: 5,
      },
    ];
    chartData = demoItems.map((item, idx) => {
      const energyInfo = getEnergyInfo(item.energy);
      return {
        num: idx + 1,
        title: item.title,
        energy: item.energy,
        bpm: item.bpm,
        keyStr: item.keyStr,
        label: energyInfo.label,
        hexColor: energyInfo.hexColor,
        durationMin: item.dur,
      };
    });
  }

  const avgEnergy =
    chartData.length > 0
      ? (
          chartData.reduce((acc, curr) => acc + curr.energy, 0) /
          chartData.length
        ).toFixed(1)
      : "12.0";
  const totalDuration = chartData.reduce(
    (acc, curr) => acc + curr.durationMin,
    0,
  );

  // Height container class based on heightMode
  const minHeightClass =
    heightMode === "compact"
      ? "h-[220px]"
      : heightMode === "tall"
        ? "h-[380px]"
        : "h-[290px]";

  return (
    <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)] space-y-3 flex flex-col justify-between h-full">
      {/* Repertorio/Setlist Selector - Above the chart */}
      <div className="flex flex-col gap-2 pb-3">
        <label className="text-micro font-semibold text-[var(--ink-2)]">
          Repertorio
        </label>
        <div className="relative">
          <select aria-label="Repertorio"
            value={selectedRepertorioId}
            onChange={(e) => setSelectedRepertorioId(e.target.value)}
            className="w-full bg-[var(--sunken)] text-[var(--ink)] text-xs font-medium rounded-[var(--r-s)] px-3 py-2 pr-8 cursor-pointer outline-none focus:ring-2 focus:ring-[var(--acc)]"
          >
            <option value="all">Todos los setlists</option>
            {setlistsList.length > 0 ? (
              setlistsList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre || "Setlist sin nombre"}
                </option>
              ))
            ) : (
              <option disabled>Sin setlists disponibles</option>
            )}
          </select>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-[var(--r-m)] bg-[var(--acc-soft)] text-[var(--acc-ink)] shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--ink)] flex items-center gap-2">
              Energía del repertorio
            </h3>
            <p className="text-xs text-[var(--ink-2)]">
              {activeSetlist
                ? activeSetlist.nombre || "Setlist activo"
                : "Perfil de ritmo del bolo"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate("repertorio")}
              className="text-xs text-[var(--acc-ink)] hover:opacity-80 font-semibold flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>Setlists</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--sunken)]">
          <span className="text-micro text-[var(--ink-2)] block">Temas</span>
          <span className="font-semibold text-[var(--acc-ink)] text-sm tabular-nums">
            {chartData.length}
          </span>
        </div>
        <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--sunken)]">
          <span className="text-micro text-[var(--ink-2)] block">
            Energía media
          </span>
          <span className="font-semibold text-[var(--ink)] text-sm tabular-nums">
            {avgEnergy} / 20
          </span>
        </div>
        <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--sunken)]">
          <span className="text-micro text-[var(--ink-2)] block">
            Duración
          </span>
          <span className="font-semibold text-[var(--ok)] text-sm tabular-nums">
            ~{totalDuration} min
          </span>
        </div>
      </div>

      {/* Energía del setlist como Onda: una barra por tema, altura = energía, color = nivel de energía */}
      <div className={`w-full ${minHeightClass} pt-2 flex items-end`}>
        <Onda
          className="w-full"
          data={chartData.map((d) => ({
            label: `${d.num}. ${d.title}`,
            value: d.energy,
            color: d.hexColor,
          }))}
          height={heightMode === "compact" ? 150 : heightMode === "tall" ? 300 : 220}
          barWidth={22}
          gap={6}
          showLabels={false}
          tooltipFormatter={(v) => `${v}/20`}
        />
      </div>
    </div>
  );
}

/* 2. GRÁFICO DE EMBUDO Y CONVERSIÓN DE BOOKING */
export function BookingFunnelChartWidget({
  leads = [],
  onNavigate,
  heightMode = "normal",
  isStitchLight = false,
}: ChartWidgetProps) {
  const counts = {
    nuevo: leads.filter((l) => l.estado === "nuevo").length,
    contactado: leads.filter(
      (l) => l.estado === "contactado" || l.estado === "esperando_respuesta",
    ).length,
    aprobacion: leads.filter((l) => l.estado === "pendiente_aprobacion").length,
    negociando: leads.filter(
      (l) =>
        l.estado === "respondido" ||
        l.estado === "interesado" ||
        l.estado === "negociando",
    ).length,
    confirmado: leads.filter((l) => l.estado === "confirmado").length,
  };

  const funnelData = [
    { name: "Nuevos", count: counts.nuevo, color: "var(--hair)" },
    { name: "Contactados", count: counts.contactado, color: "var(--ink-3)" },
    { name: "Por Aprobar", count: counts.aprobacion, color: "var(--ink-2)" },
    { name: "Negociando", count: counts.negociando, color: "var(--acc)" },
    { name: "Confirmados", count: counts.confirmado, color: "var(--ok)" },
  ];

  const total = leads.length || 1;
  const conversionRate = ((counts.confirmado / total) * 100).toFixed(1);

  const minHeightClass =
    heightMode === "compact"
      ? "h-[200px]"
      : heightMode === "tall"
        ? "h-[360px]"
        : "h-[270px]";

  return (
    <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)] space-y-3 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-[var(--r-m)] bg-[var(--acc)]/15 text-[var(--ink-2)] shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-display text-[var(--ink)]">
              Embudo de contrataciones
            </h3>
            <p className="text-xs font-sans text-[var(--ink-2)]">
              Conversión de salas y festivales
            </p>
          </div>
        </div>

        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate("booking")}
            className="text-xs font-sans text-[var(--acc)] hover:text-[var(--acc)]/70 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Ver CRM</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between px-3 py-2 rounded-[var(--r-m)] bg-[var(--sunken)] text-xs font-sans">
        <span className="text-[var(--ink-2)]">
          Tasa de Conversión a Conciertos:
        </span>
        <span className="font-bold text-[var(--ok)] flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5" /> {conversionRate}% (
          {counts.confirmado} cierres)
        </span>
      </div>

      <div
        className={`w-full ${minHeightClass} pt-2 flex flex-col items-center justify-center`}
      >
        <Onda
          data={funnelData.map((d) => ({
            label: d.name,
            value: d.count,
            color: d.color,
          }))}
          height={
            heightMode === "compact" ? 140 : heightMode === "tall" ? 300 : 200
          }
          barWidth={
            heightMode === "compact" ? 12 : heightMode === "tall" ? 18 : 14
          }
          gap={heightMode === "compact" ? 6 : heightMode === "tall" ? 10 : 8}
          showLabels={true}
          animated={true}
          tooltipFormatter={(val) => {
            const pct = ((val / total) * 100).toFixed(1);
            return `${val} salas (${pct}%)`;
          }}
          className="w-full"
        />
      </div>
    </div>
  );
}

/* 3. GRÁFICO DE FINANZAS & CACHÉ POR CONCIERTO */
export function FinancesChartWidget({
  concerts = [],
  onNavigate,
  heightMode = "normal",
}: ChartWidgetProps) {
  // Últimos 6 meses con datos reales: ingresos = caché de los bolos confirmados; gastos = desglose
  // de gastosDetalle. Nada inventado — sin bolos con caché, el widget lo dice en vez de pintar cifras.
  const months = useMemo(() => {
    const NOMBRES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const hoy = new Date();
    const buckets = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - (5 - i), 1);
      return {
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        month: NOMBRES[d.getMonth()],
        ingresos: 0,
        gastos: 0,
      };
    });
    for (const c of concerts) {
      if (c.is_posible || c.tipo === "posible") continue;
      const b = buckets.find((x) => (c.fecha || "").startsWith(x.key));
      if (!b) continue;
      b.ingresos += Number(c.cache) || 0;
      const g = c.gastosDetalle;
      if (g) {
        b.gastos +=
          (g.gasolina || 0) + (g.dietas || 0) + (g.alquilerVehiculo || 0) + (g.alojamiento || 0) + (g.otros || 0);
      }
    }
    return buckets;
  }, [concerts]);

  const totalIngresos = months.reduce((acc, m) => acc + m.ingresos, 0);
  const totalGastos = months.reduce((acc, m) => acc + m.gastos, 0);
  const beneficio = totalIngresos - totalGastos;
  const hayDatos = totalIngresos > 0 || totalGastos > 0;
  const eur = (n: number) => `${n.toLocaleString("es-ES")}€`;

  const minHeightClass =
    heightMode === "compact"
      ? "h-[200px]"
      : heightMode === "tall"
        ? "h-[360px]"
        : "h-[270px]";

  return (
    <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)] space-y-3 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-[var(--r-m)] bg-[var(--ok)]/15 text-[var(--ok)] shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-display text-[var(--ink)]">
              Evolución Financiera & Caché
            </h3>
            <p className="text-xs font-sans text-[var(--ink-2)]">
              Ingresos vs gastos de directos
            </p>
          </div>
        </div>

        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate("finanzas")}
            className="text-xs font-sans text-[var(--acc)] hover:text-[var(--acc)]/70 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Finanzas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 font-sans text-xs text-center">
        <div className="p-2 rounded-[var(--r-m)] bg-[var(--sunken)]">
          <span className="text-micro text-[var(--ink-2)] block">
            Ingresos totales
          </span>
          <span className="font-bold text-[var(--ok)] text-sm">
            {eur(totalIngresos)}
          </span>
        </div>
        <div className="p-2 rounded-[var(--r-m)] bg-[var(--sunken)]">
          <span className="text-micro text-[var(--ink-2)] block">
            Neto / Beneficio
          </span>
          <span className="font-bold text-[var(--acc)] text-sm">
            {eur(beneficio)}
          </span>
        </div>
      </div>

      <div className={`w-full ${minHeightClass} pt-2 flex items-end`}>
        {!hayDatos ? (
          <p className="w-full text-center self-center text-xs text-[var(--ink-2)] font-sans px-4">
            Aún no hay cachés registrados en estos 6 meses. Cuando cierres un bolo con su caché, aparecerá aquí.
          </p>
        ) : (
        <OndaSeries
          className="w-full"
          series={[
            { label: "Ingresos", color: "var(--acc)", data: months.map((m) => ({ label: m.month, value: m.ingresos })) },
            { label: "Gastos", color: "var(--ink-3)", data: months.map((m) => ({ label: m.month, value: m.gastos })) },
          ]}
          height={heightMode === "compact" ? 120 : heightMode === "tall" ? 260 : 180}
          barWidth={14}
          gap={3}
        />
        )}
      </div>
    </div>
  );
}

/* 4. GRÁFICO DE CRECIMIENTO DE FANS & SOCIAL */
export function SocialFansGrowthWidget({
  fans = [],
  onNavigate,
  heightMode = "normal",
  isStitchLight = false,
}: ChartWidgetProps) {
  const fansCount = fans.length;
  // Acumulado real de fans por mes de captura (últimos 6 meses). Nada inventado.
  const growthData = useMemo(() => {
    const NOMBRES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const hoy = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - (5 - i), 1);
      const finMes = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString().slice(0, 10);
      return {
        mes: NOMBRES[d.getMonth()],
        fans: fans.filter((f) => (f.fechaCaptura || "").slice(0, 10) < finMes).length,
      };
    });
  }, [fans]);

  const minHeightClass =
    heightMode === "compact"
      ? "h-[200px]"
      : heightMode === "tall"
        ? "h-[360px]"
        : "h-[270px]";

  return (
    <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)] space-y-3 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-[var(--r-m)] bg-[var(--acc-soft)] text-[var(--acc-ink)] shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-display text-[var(--ink)]">
              Captación de fans y QR
            </h3>
            <p className="text-xs font-sans text-[var(--ink-2)]">
              Crecimiento en registro de seguidores
            </p>
          </div>
        </div>

        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate("fans")}
            className="text-xs font-sans text-[var(--acc)] hover:text-[var(--acc)]/70 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Captura QR</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between px-3 py-2 rounded-[var(--r-m)] bg-[var(--sunken)] text-xs font-sans">
        <span className="text-[var(--ink-2)]">Fans Registrados:</span>
        <span className="font-bold text-[var(--acc)] text-sm">
          {fansCount} seguidores
        </span>
      </div>

      <div
        className={`w-full ${minHeightClass} pt-2 flex flex-col items-center justify-center`}
      >
        {fansCount === 0 ? (
          <p className="text-xs text-[var(--ink-2)] font-sans px-4 text-center">
            Aún no hay fans registrados. Pon el QR en la mesa de merchan y esto empieza a moverse.
          </p>
        ) : (
        <Onda
          data={growthData.map((d) => ({
            label: d.mes,
            value: d.fans,
            color: "var(--acc)",
          }))}
          height={
            heightMode === "compact" ? 140 : heightMode === "tall" ? 300 : 200
          }
          barWidth={
            heightMode === "compact" ? 12 : heightMode === "tall" ? 18 : 14
          }
          gap={heightMode === "compact" ? 6 : heightMode === "tall" ? 10 : 8}
          showLabels={true}
          animated={true}
          tooltipFormatter={(val) => `${val} fans acumulados`}
          className="w-full"
        />
        )}
      </div>
    </div>
  );
}
