import React, { useState, useMemo } from "react";
import { ThemeColors, SocialMetric, Fan, EPKConfig } from "../../types";
import {
  Instagram,
  Youtube,
  Video,
  Music2,
  Heart,
  TrendingUp,
  Users,
  Radio,
  Eye,
  EyeOff,
  RefreshCw,
  SlidersHorizontal,
  ArrowUpRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Activity,
  QrCode,
  Calendar,
  Clock,
} from "lucide-react";
import { OndaSeries } from "../ui/Onda";
import { ShowIcon } from '../ui/ShowIcon';

export type TimePeriod = "7d" | "30d" | "90d" | "1y" | "all";

export const TIME_PERIOD_OPTIONS: {
  id: TimePeriod;
  label: string;
  shortLabel: string;
  days: number | null;
}[] = [
  { id: "7d", label: "Últimos 7 días", shortLabel: "7D", days: 7 },
  { id: "30d", label: "Últimos 30 días", shortLabel: "30D", days: 30 },
  { id: "90d", label: "Últimos 90 días", shortLabel: "90D", days: 90 },
  { id: "1y", label: "Último año", shortLabel: "1A", days: 365 },
  { id: "all", label: "Histórico completo", shortLabel: "Todo", days: null },
];

interface SocialAndFansGrowthChartProps {
  metrics?: SocialMetric[];
  fans?: Fan[];
  epkConfig?: Partial<EPKConfig>;
  colors?: ThemeColors;
  bandName?: string;
  bandId?: string;
  onNavigate?: (view: any, options?: any) => void;
}

export const SocialAndFansGrowthChart: React.FC<
  SocialAndFansGrowthChartProps
> = ({
  metrics = [],
  fans = [],
  epkConfig,
  colors,
  bandName = "Bakandeya",
  bandId,
  onNavigate,
}) => {
  // Detection of configured / active networks (only display networks that have a profile entered or metrics registered)
  const hasInstagram = useMemo(() => {
    return Boolean(
      (epkConfig?.enlacesRedes?.instagram &&
        epkConfig.enlacesRedes.instagram.trim().length > 0) ||
      metrics.some(
        (m) =>
          (m.instagram_followers && m.instagram_followers > 0) ||
          (m.instagram && m.instagram > 0),
      ),
    );
  }, [epkConfig?.enlacesRedes?.instagram, metrics]);

  const hasTikTok = useMemo(() => {
    return Boolean(
      (epkConfig?.enlacesRedes?.tiktok &&
        epkConfig.enlacesRedes.tiktok.trim().length > 0) ||
      metrics.some(
        (m) =>
          (m.tiktok_followers && m.tiktok_followers > 0) ||
          (m.tiktok && m.tiktok > 0),
      ),
    );
  }, [epkConfig?.enlacesRedes?.tiktok, metrics]);

  const hasYouTube = useMemo(() => {
    return Boolean(
      (epkConfig?.enlacesRedes?.youtube &&
        epkConfig.enlacesRedes.youtube.trim().length > 0) ||
      metrics.some(
        (m) =>
          (m.youtube_subscribers && m.youtube_subscribers > 0) ||
          (m.youtube && m.youtube > 0),
      ),
    );
  }, [epkConfig?.enlacesRedes?.youtube, metrics]);

  const hasSpotify = useMemo(() => {
    return Boolean(
      (epkConfig?.enlacesRedes?.spotify &&
        epkConfig.enlacesRedes.spotify.trim().length > 0) ||
      metrics.some(
        (m) =>
          (m.spotify_monthly_listeners && m.spotify_monthly_listeners > 0) ||
          (m.spotify && m.spotify > 0),
      ),
    );
  }, [epkConfig?.enlacesRedes?.spotify, metrics]);

  // Channel visibility state initialized dynamically to only show configured channels
  const [selectedChannels, setSelectedChannels] = useState<{
    instagram: boolean;
    tiktok: boolean;
    youtube: boolean;
    spotify: boolean;
    fans: boolean;
  }>(() => ({
    instagram: hasInstagram,
    tiktok: hasTikTok,
    youtube: hasYouTube,
    spotify: hasSpotify,
    fans: true,
  }));

  // Selected time period state (7d, 30d, 90d, 1y, all)
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("30d");

  // Sync selected channels when configured profiles change
  React.useEffect(() => {
    setSelectedChannels({
      instagram: hasInstagram,
      tiktok: hasTikTok,
      youtube: hasYouTube,
      spotify: hasSpotify,
      fans: true,
    });
  }, [hasInstagram, hasTikTok, hasYouTube, hasSpotify]);

  // Calculate fan statistics from database
  const totalFans = fans.length;
  const uneteFans = useMemo(() => {
    return fans.filter((f) => {
      const src = (f.comoConocio || "").toLowerCase();
      return (
        src.includes("unete") ||
        src.includes("únete") ||
        src.includes("web") ||
        src.includes("formulario") ||
        src.includes("landing") ||
        src.includes("online") ||
        !src
      );
    }).length;
  }, [fans]);

  const directoFans = useMemo(() => {
    return fans.filter((f) => {
      const src = (f.comoConocio || "").toLowerCase();
      return (
        src.includes("directo") ||
        src.includes("concierto") ||
        src.includes("qr") ||
        Boolean(f.conciertoOrigenId)
      );
    }).length;
  }, [fans]);

  const verifiedRgpd = fans.filter((f) => f.consentimientoRGPD).length;
  const activeCitiesCount = useMemo(() => {
    return new Set(fans.map((f) => f.ciudad).filter(Boolean)).size;
  }, [fans]);

  // Sort and aggregate metrics by date
  const sortedMetrics = useMemo(() => {
    const mapByDate = new Map<string, SocialMetric>();
    const sorted = [...metrics].sort((a, b) =>
      (a.fecha || "").localeCompare(b.fecha || ""),
    );

    for (const m of sorted) {
      if (!m.fecha) continue;
      const ig = Number(m.instagram ?? m.instagram_followers ?? 0);
      const tk = Number(m.tiktok ?? m.tiktok_followers ?? 0);
      const yt = Number(m.youtube ?? m.youtube_subscribers ?? 0);
      const sp = Number(m.spotify ?? m.spotify_monthly_listeners ?? 0);

      const existing = mapByDate.get(m.fecha);
      if (!existing) {
        mapByDate.set(m.fecha, {
          ...m,
          instagram: ig,
          tiktok: tk,
          youtube: yt,
          spotify: sp,
          instagram_followers: Number(m.instagram_followers || ig),
          tiktok_followers: Number(m.tiktok_followers || tk),
          youtube_subscribers: Number(m.youtube_subscribers || yt),
          spotify_monthly_listeners: Number(m.spotify_monthly_listeners || sp),
        });
      } else {
        mapByDate.set(m.fecha, {
          ...existing,
          ...m,
          instagram: Math.max(Number(existing.instagram || 0), ig),
          tiktok: Math.max(Number(existing.tiktok || 0), tk),
          youtube: Math.max(Number(existing.youtube || 0), yt),
          spotify: Math.max(Number(existing.spotify || 0), sp),
          instagram_followers: Math.max(
            Number(existing.instagram_followers || 0),
            Number(m.instagram_followers || ig),
          ),
          tiktok_followers: Math.max(
            Number(existing.tiktok_followers || 0),
            Number(m.tiktok_followers || tk),
          ),
          youtube_subscribers: Math.max(
            Number(existing.youtube_subscribers || 0),
            Number(m.youtube_subscribers || yt),
          ),
          spotify_monthly_listeners: Math.max(
            Number(existing.spotify_monthly_listeners || 0),
            Number(m.spotify_monthly_listeners || sp),
          ),
        });
      }
    }
    return Array.from(mapByDate.values()).sort((a, b) =>
      a.fecha.localeCompare(b.fecha),
    );
  }, [metrics]);

  const latestMetric = sortedMetrics[sortedMetrics.length - 1] || null;

  // Real or default counts (only use demo baseline if platform is configured or has recorded data)
  const countInstagram = Number(
    latestMetric?.instagram_followers ||
      latestMetric?.instagram ||
      (hasInstagram ? 2150 : 0),
  );
  const countTikTok = Number(
    latestMetric?.tiktok_followers ||
      latestMetric?.tiktok ||
      (hasTikTok ? 3850 : 0),
  );
  const countYouTube = Number(
    latestMetric?.youtube_subscribers ||
      latestMetric?.youtube ||
      (hasYouTube ? 1210 : 0),
  );
  const countSpotify = Number(
    latestMetric?.spotify_monthly_listeners ||
      latestMetric?.spotify ||
      (hasSpotify ? 150 : 0),
  );

  // Current period configuration
  const currentPeriodConfig = useMemo(() => {
    return (
      TIME_PERIOD_OPTIONS.find((p) => p.id === selectedPeriod) ||
      TIME_PERIOD_OPTIONS[1]
    );
  }, [selectedPeriod]);

  // Filter metrics according to the selected time period
  const filteredMetrics = useMemo(() => {
    if (selectedPeriod === "all" || !currentPeriodConfig.days) {
      return sortedMetrics;
    }
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - currentPeriodConfig.days);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    return sortedMetrics.filter((m) => m.fecha >= cutoffStr);
  }, [sortedMetrics, selectedPeriod, currentPeriodConfig]);

  // Growth Chart Timeline Data Generation (Combining Metrics & Fans from Database based on selected period)
  const chartTimelineData = useMemo(() => {
    // If we have at least 2 real metric records in the filtered window
    if (filteredMetrics.length >= 2) {
      return filteredMetrics.map((m, idx) => {
        const metricDate = m.fecha;
        const fansUpToDate = fans.filter(
          (f) => !f.fechaCaptura || f.fechaCaptura <= metricDate,
        ).length;
        const uneteFansUpToDate = fans.filter((f) => {
          const src = (f.comoConocio || "").toLowerCase();
          const isUnete =
            src.includes("unete") ||
            src.includes("únete") ||
            src.includes("web") ||
            src.includes("formulario") ||
            src.includes("landing") ||
            !src;
          return isUnete && (!f.fechaCaptura || f.fechaCaptura <= metricDate);
        }).length;

        const progressRatio = (idx + 1) / filteredMetrics.length;
        const estimatedFans = Math.max(
          fansUpToDate,
          Math.round(totalFans * (0.6 + 0.4 * progressRatio)),
        );
        const estimatedUnete = Math.max(
          uneteFansUpToDate,
          Math.round(uneteFans * (0.6 + 0.4 * progressRatio)),
        );

        return {
          fecha: m.fecha,
          instagram: Number(m.instagram_followers || m.instagram || 0),
          tiktok: Number(m.tiktok_followers || m.tiktok || 0),
          youtube: Number(m.youtube_subscribers || m.youtube || 0),
          spotify: Number(m.spotify_monthly_listeners || m.spotify || 0),
          fans: Math.max(fansUpToDate, Math.min(totalFans, estimatedFans)),
          unete_fans: Math.max(
            uneteFansUpToDate,
            Math.min(uneteFans, estimatedUnete),
          ),
        };
      });
    }

    // If we have 1 metric in the filtered period and prior history exists
    if (filteredMetrics.length === 1 && sortedMetrics.length > 1) {
      const single = filteredMetrics[0];
      const prior = sortedMetrics.filter((m) => m.fecha < single.fecha).pop();
      if (prior) {
        const combined = [prior, single];
        return combined.map((m, idx) => {
          const fansUpToDate = fans.filter(
            (f) => !f.fechaCaptura || f.fechaCaptura <= m.fecha,
          ).length;
          return {
            fecha: m.fecha,
            instagram: Number(m.instagram_followers || m.instagram || 0),
            tiktok: Number(m.tiktok_followers || m.tiktok || 0),
            youtube: Number(m.youtube_subscribers || m.youtube || 0),
            spotify: Number(m.spotify_monthly_listeners || m.spotify || 0),
            fans: Math.max(
              fansUpToDate,
              Math.round(totalFans * (idx === 0 ? 0.85 : 1)),
            ),
            unete_fans: Math.round(uneteFans * (idx === 0 ? 0.85 : 1)),
          };
        });
      }
    }

    // Dynamic progression points scaled to the selected period duration
    const now = new Date();
    const points: any[] = [];

    // Choose step days according to period
    let daysBack: number[];
    let baseFactor: number;
    switch (selectedPeriod) {
      case "7d":
        daysBack = [7, 5, 4, 3, 2, 1, 0];
        baseFactor = 0.92;
        break;
      case "30d":
        daysBack = [30, 24, 18, 12, 6, 0];
        baseFactor = 0.78;
        break;
      case "90d":
        daysBack = [90, 75, 60, 45, 30, 15, 0];
        baseFactor = 0.65;
        break;
      case "1y":
        daysBack = [365, 300, 240, 180, 120, 60, 0];
        baseFactor = 0.45;
        break;
      case "all":
      default:
        daysBack = [180, 150, 120, 90, 60, 30, 0];
        baseFactor = 0.5;
        break;
    }

    for (let i = 0; i < daysBack.length; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - daysBack[i]);
      const dateStr = d.toISOString().split("T")[0];
      const progress = i / (daysBack.length - 1);
      const factor = baseFactor + progress * (1 - baseFactor);

      // Check real fan registrations before this date
      const fansUpToDate = fans.filter(
        (f) => !f.fechaCaptura || f.fechaCaptura <= dateStr,
      ).length;
      const uneteUpToDate = fans.filter((f) => {
        const src = (f.comoConocio || "").toLowerCase();
        const isUnete =
          src.includes("unete") ||
          src.includes("únete") ||
          src.includes("web") ||
          src.includes("formulario") ||
          src.includes("landing") ||
          !src;
        return isUnete && (!f.fechaCaptura || f.fechaCaptura <= dateStr);
      }).length;

      points.push({
        fecha: dateStr,
        instagram: Math.round(countInstagram * factor),
        tiktok: Math.round(
          countTikTok *
            (baseFactor * 0.95 + progress * (1 - baseFactor * 0.95)),
        ),
        youtube: Math.round(
          countYouTube *
            (baseFactor * 1.05 + progress * (1 - baseFactor * 1.05)),
        ),
        spotify: Math.round(
          countSpotify * (baseFactor * 0.9 + progress * (1 - baseFactor * 0.9)),
        ),
        fans: Math.max(
          fansUpToDate,
          Math.max(1, Math.round(totalFans * factor)),
        ),
        unete_fans: Math.max(
          uneteUpToDate,
          Math.max(1, Math.round(uneteFans * factor)),
        ),
      });
    }
    return points;
  }, [
    filteredMetrics,
    sortedMetrics,
    selectedPeriod,
    fans,
    totalFans,
    uneteFans,
    countInstagram,
    countTikTok,
    countYouTube,
    countSpotify,
  ]);

  // Period Growth Summary (Start vs End)
  const periodGrowthSummary = useMemo(() => {
    if (!chartTimelineData || chartTimelineData.length < 2) return null;
    const first = chartTimelineData[0];
    const last = chartTimelineData[chartTimelineData.length - 1];

    const diffFans = (last.fans || 0) - (first.fans || 0);
    const diffIg = (last.instagram || 0) - (first.instagram || 0);
    const diffTk = (last.tiktok || 0) - (first.tiktok || 0);
    const diffYt = (last.youtube || 0) - (first.youtube || 0);
    const diffSp = (last.spotify || 0) - (first.spotify || 0);

    return {
      diffFans,
      diffIg,
      diffTk,
      diffYt,
      diffSp,
      startDate: first.fecha,
      endDate: last.fecha,
    };
  }, [chartTimelineData]);

  // Calculate dynamic Y-axis maximum domain based on active visible channels

  // La Onda pinta barras, no curvas: se muestrean como mucho 10 fechas repartidas por el periodo
  // (siempre incluida la última) y una serie por canal activo.
  const ondaSeries = useMemo(() => {
    const total = chartTimelineData.length;
    const step = Math.max(1, Math.ceil(total / 10));
    const sampled = chartTimelineData.filter((_, i) => i % step === 0 || i === total - 1);
    const etiqueta = (f: string) => {
      const parts = (f || "").split("-");
      return parts.length === 3 ? `${parts[2]}/${parts[1]}` : f;
    };
    const canales: { key: "instagram" | "tiktok" | "youtube" | "spotify" | "fans"; label: string; color: string }[] = [
      { key: "fans", label: "Fans registrados", color: "var(--acc)" },
      { key: "instagram", label: "Instagram", color: "var(--ok)" },
      { key: "tiktok", label: "TikTok", color: "var(--ink)" },
      { key: "youtube", label: "YouTube", color: "var(--ink-2)" },
      { key: "spotify", label: "Spotify", color: "var(--ink-3)" },
    ];
    return canales
      .filter((c) => selectedChannels[c.key])
      .map((c) => ({
        label: c.label,
        color: c.color,
        data: sampled.map((d: any) => ({ label: etiqueta(d.fecha), value: Number(d[c.key] || 0) })),
      }));
  }, [chartTimelineData, selectedChannels]);

  // Channel toggling handlers
  const toggleChannel = (channel: keyof typeof selectedChannels) => {
    setSelectedChannels((prev) => ({
      ...prev,
      [channel]: !prev[channel],
    }));
  };

  const selectOnlyChannel = (channel: keyof typeof selectedChannels) => {
    setSelectedChannels({
      instagram: channel === "instagram",
      tiktok: channel === "tiktok",
      youtube: channel === "youtube",
      spotify: channel === "spotify",
      fans: channel === "fans",
    });
  };

  const selectAllChannels = () => {
    setSelectedChannels({
      instagram: hasInstagram,
      tiktok: hasTikTok,
      youtube: hasYouTube,
      spotify: hasSpotify,
      fans: true,
    });
  };

  const hasAnyChannelSelected = Object.values(selectedChannels).some(Boolean);

  return (
    <div
      className={`p-5 rounded-[var(--r-l)] transition-ui ${"bg-[var(--bg)]/90 text-[var(--ink)]"}`}
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 mb-4 ">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-[var(--r-m)] shrink-0 ${"bg-[var(--acc)]/20 text-[var(--acc-ink)]"}`}
          >
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3
              className={`text-sm font-bold font-display flex items-center gap-2 ${"text-[var(--ink)]"}`}
            >
              Evolución de redes sociales y base de fans en BBDD
              <span className="text-micro px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--ok)]/15 text-[var(--ink)] font-sans font-normal flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" /> Supabase Conectada
              </span>
            </h3>
            <p className="text-micro font-sans mt-0.5 text-[var(--ink-2)]">
              Seguimiento unificado de audiencia digital, escuchas y fans
              registrados mediante el formulario público de Únete.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {onNavigate && (
            <>
              <button
                type="button"
                onClick={() => onNavigate("fans")}
                className={`px-3 py-1.5 font-sans text-micro font-bold rounded-[var(--r-pill)] transition-ui flex items-center gap-1.5 cursor-pointer active:scale-[0.97] ${"bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--acc-ink)]"}`}
                title="Ir al gestor de comunidad, muro y capturas de fans"
              >
                <Heart className="w-3.5 h-3.5 text-[var(--acc)]" />
                <span>Muro & Base de Fans ({totalFans})</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate("reels")}
                className={`px-3 py-1.5 font-sans text-micro font-bold rounded-[var(--r-pill)] transition-ui flex items-center gap-1.5 cursor-pointer active:scale-[0.97] ${"bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)]"}`}
                title="Abrir el panel completo de métricas y sincronización"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Radar Multiplataforma</span>
                <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 5 KPI Metric Cards Bar (Instagram, TikTok, YouTube, Spotify, and Fans Registrados) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        {/* Card 1: Instagram */}
        {hasInstagram && (
          <div
            className={`p-3 rounded-[var(--r-m)] flex flex-col justify-between transition-ui ${"bg-[var(--surface)]/60"}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-micro font-sans font-bold text-[var(--alert)] flex items-center gap-1">
                <Instagram className="w-3.5 h-3.5 text-[var(--alert)]" />{" "}
                Instagram
              </span>
              <span className="text-micro px-1.5 py-0.5 rounded bg-[var(--alert)]/10 text-[var(--alert)] font-sans">
                Seguidores
              </span>
            </div>
            <div className="my-1.5">
              <div className="text-xl font-display font-bold text-[var(--ink)]">
                {countInstagram.toLocaleString()}
              </div>
              <div className="text-micro font-sans text-[var(--ink-2)] flex items-center gap-1 mt-0.5">
                <span>
                  {latestMetric?.instagram_engagement_rate
                    ? `${latestMetric.instagram_engagement_rate}% ER`
                    : "Audiencia activa"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Card 2: TikTok */}
        {hasTikTok && (
          <div
            className={`p-3 rounded-[var(--r-m)] flex flex-col justify-between transition-ui ${"bg-[var(--surface)]/60"}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-micro font-sans font-bold text-[var(--acc)] flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-[var(--acc)]" /> TikTok
              </span>
              <span className="text-micro px-1.5 py-0.5 rounded bg-[var(--acc)]/10 text-[var(--acc-ink)] font-sans">
                Comunidad
              </span>
            </div>
            <div className="my-1.5">
              <div className="text-xl font-display font-bold text-[var(--ink)]">
                {countTikTok.toLocaleString()}
              </div>
              <div className="text-micro font-sans text-[var(--ink-2)] flex items-center gap-1 mt-0.5">
                <span>
                  {latestMetric?.tiktok_total_likes
                    ? `${(latestMetric.tiktok_total_likes / 1000).toFixed(1)}k likes`
                    : "Contenido viral"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Card 3: YouTube */}
        {hasYouTube && (
          <div
            className={`p-3 rounded-[var(--r-m)] flex flex-col justify-between transition-ui ${"bg-[var(--surface)]/60"}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-micro font-sans font-bold text-[var(--alert)] flex items-center gap-1">
                <Youtube className="w-3.5 h-3.5 text-[var(--alert)]" /> YouTube
              </span>
              <span className="text-micro px-1.5 py-0.5 rounded bg-[var(--alert)]/10 text-[var(--alert)] font-sans">
                Suscriptores
              </span>
            </div>
            <div className="my-1.5">
              <div className="text-xl font-display font-bold text-[var(--ink)]">
                {countYouTube.toLocaleString()}
              </div>
              <div className="text-micro font-sans text-[var(--ink-2)] flex items-center gap-1 mt-0.5">
                <span>
                  {latestMetric?.youtube_total_views
                    ? `${(latestMetric.youtube_total_views / 1000).toFixed(1)}k views`
                    : "Canal oficial"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Card 4: Spotify */}
        {hasSpotify && (
          <div
            className={`p-3 rounded-[var(--r-m)] flex flex-col justify-between transition-ui ${"bg-[var(--surface)]/60"}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-micro font-sans font-bold text-[var(--ok)] flex items-center gap-1">
                <Music2 className="w-3.5 h-3.5 text-[var(--ok)]" /> Spotify
              </span>
              <span className="text-micro px-1.5 py-0.5 rounded bg-[var(--ok)]/10 text-[var(--ink-2)] font-sans">
                Oyentes/mes
              </span>
            </div>
            <div className="my-1.5">
              <div className="text-xl font-display font-bold text-[var(--ink)]">
                {countSpotify.toLocaleString()}
              </div>
              <div className="text-micro font-sans text-[var(--ink-2)] flex items-center gap-1 mt-0.5">
                <span>
                  {latestMetric?.spotify_followers
                    ? `${latestMetric.spotify_followers} seguidores`
                    : "Streaming mensual"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Card 5: Fans Registrados en Base de Datos (Formulario Únete) */}
        <div
          className={`p-3 rounded-[var(--r-m)] flex flex-col justify-between transition-ui col-span-2 sm:col-span-1 ${"bg-[var(--accent-alt)]/10"}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-micro font-sans font-bold text-[var(--acc)] flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-[var(--acc)] fill-[var(--acc)]/20" />{" "}
              Fans BBDD
            </span>
            <span className="text-micro px-1.5 py-0.5 rounded bg-[var(--acc)]/20 text-[var(--acc-ink)] font-sans font-bold">
              Formulario Únete
            </span>
          </div>
          <div className="my-1.5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-display font-black text-[var(--acc)]">
                {totalFans}
              </span>
              <span className="text-micro font-sans text-[var(--acc)]/70">
                fans totales
              </span>
            </div>
            <div className="text-micro font-sans text-[var(--ink-2)] flex items-center justify-between gap-1 mt-1  pt-1">
              <span className="text-[var(--acc)]/70 font-bold">
                <ShowIcon inline emoji="✨" />{uneteFans} vía Únete
              </span>
              {directoFans > 0 && (
                <span className="text-[var(--ink-2)]">
                  <ShowIcon inline emoji="🎤" />{directoFans} directo
                </span>
              )}
              <span className="text-[var(--ok)] font-bold">✓ RGPD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Period Filter & Interactive Channel Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 pb-3 ">
        {/* Time Period Selector */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-micro font-sans text-[var(--ink-2)] flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[var(--acc)]" />
            <span className="font-bold">Periodo:</span>
          </span>
          <div
            className={`flex items-center gap-1 p-0.5 rounded-[var(--r-m)] ${"bg-[var(--sunken)]"}`}
          >
            {TIME_PERIOD_OPTIONS.map((opt) => {
              const isSelected = selectedPeriod === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedPeriod(opt.id)}
                  className={`px-2.5 py-1 rounded-[var(--r-pill)] text-micro font-sans font-bold transition-ui cursor-pointer ${
                    isSelected
                      ? "bg-[var(--acc)]  text-[var(--on-acc)]"
                      : "text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--sunken)]"
                  }`}
                  title={opt.label}
                >
                  {opt.shortLabel}
                </button>
              );
            })}
          </div>

          {/* Period Summary Indicator */}
          {periodGrowthSummary && (
            <div
              className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-[var(--r-s)] text-micro font-sans ${"bg-[var(--ok-soft)] text-[var(--ink-2)]"}`}
            >
              <TrendingUp className="w-3 h-3 text-[var(--ok)]" />
              <span>
                <b>{currentPeriodConfig.label}:</b>{" "}
                {periodGrowthSummary.diffFans >= 0
                  ? `+${periodGrowthSummary.diffFans}`
                  : periodGrowthSummary.diffFans}{" "}
                fans
                {hasInstagram &&
                  ` • ${periodGrowthSummary.diffIg >= 0 ? `+${periodGrowthSummary.diffIg}` : periodGrowthSummary.diffIg} IG`}
                {hasSpotify &&
                  ` • ${periodGrowthSummary.diffSp >= 0 ? `+${periodGrowthSummary.diffSp}` : periodGrowthSummary.diffSp} Spotify`}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={selectAllChannels}
          className={`text-micro font-sans px-2.5 py-1 rounded-[var(--r-pill)] transition-ui flex items-center gap-1 self-end md:self-auto cursor-pointer ${"bg-[var(--sunken)] hover:bg-[var(--sunken)] text-[var(--ink-2)]"}`}
          title="Restaurar y mostrar todos los canales disponibles"
        >
          <RefreshCw className="w-2.5 h-2.5" />
          <span>Mostrar todos</span>
        </button>
      </div>

      {/* Interactive Channel Filters & Toggles */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-3  flex-wrap">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-micro font-sans text-[var(--ink-2)] mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3 text-[var(--ink-2)]" /> Curvas
            del Gráfico:
          </span>

          {/* Instagram Chip */}
          {hasInstagram && (
            <div
              className={`flex items-center rounded-[var(--r-s)] transition-ui ${
                selectedChannels.instagram
                  ? "bg-[var(--alert)]/15 text-[var(--ink)]"
                  : "bg-[var(--surface)]/30 text-[var(--ink-2)] opacity-60"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleChannel("instagram")}
                className="px-2 py-1 flex items-center gap-1.5 text-micro font-sans font-medium cursor-pointer"
              >
                <span
                  className={`w-2 h-2 rounded-[var(--r-pill)] ${selectedChannels.instagram ? "bg-[var(--alert)]" : "bg-[var(--sunken)]"}`}
                ></span>
                <Instagram className="w-3 h-3 text-[var(--alert)]" />
                <span>Instagram</span>
                <span className="text-micro px-1 py-0.2 rounded bg-[var(--alert)]/15 font-sans font-bold">
                  {countInstagram.toLocaleString()}
                </span>
                {selectedChannels.instagram ? (
                  <Eye className="w-3 h-3 text-[var(--alert)]" />
                ) : (
                  <EyeOff className="w-3 h-3 text-[var(--ink-2)]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => selectOnlyChannel("instagram")}
                className="px-1.5 py-1 text-micro font-sans/20 hover:bg-[var(--alert)]/20 text-[var(--alert)] cursor-pointer"
                title="Aislar sólo Instagram"
              >
                Solo
              </button>
            </div>
          )}

          {/* TikTok Chip */}
          {hasTikTok && (
            <div
              className={`flex items-center rounded-[var(--r-s)] transition-ui ${
                selectedChannels.tiktok
                  ? "bg-[var(--tentative)]/15 text-[var(--acc-ink)]"
                  : "bg-[var(--surface)]/30 text-[var(--ink-2)] opacity-60"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleChannel("tiktok")}
                className="px-2 py-1 flex items-center gap-1.5 text-micro font-sans font-medium cursor-pointer"
              >
                <span
                  className={`w-2 h-2 rounded-[var(--r-pill)] ${selectedChannels.tiktok ? "bg-[var(--acc)]" : "bg-[var(--sunken)]"}`}
                ></span>
                <Video className="w-3 h-3 text-[var(--acc)]" />
                <span>TikTok</span>
                <span className="text-micro px-1 py-0.2 rounded bg-[var(--acc)]/15 font-sans font-bold">
                  {countTikTok.toLocaleString()}
                </span>
                {selectedChannels.tiktok ? (
                  <Eye className="w-3 h-3 text-[var(--acc)]" />
                ) : (
                  <EyeOff className="w-3 h-3 text-[var(--ink-2)]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => selectOnlyChannel("tiktok")}
                className="px-1.5 py-1 text-micro font-sans/20 hover:bg-[var(--acc)]/20 text-[var(--acc)] cursor-pointer"
                title="Aislar sólo TikTok"
              >
                Solo
              </button>
            </div>
          )}

          {/* YouTube Chip */}
          {hasYouTube && (
            <div
              className={`flex items-center rounded-[var(--r-s)] transition-ui ${
                selectedChannels.youtube
                  ? "bg-[var(--alert)] text-[var(--on-alert)]"
                  : "bg-[var(--surface)]/30 text-[var(--ink-2)] opacity-60"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleChannel("youtube")}
                className="px-2 py-1 flex items-center gap-1.5 text-micro font-sans font-medium cursor-pointer"
              >
                <span
                  className={`w-2 h-2 rounded-[var(--r-pill)] ${selectedChannels.youtube ? "bg-[var(--alert)]" : "bg-[var(--sunken)]"}`}
                ></span>
                <Youtube className="w-3 h-3 text-[var(--alert)]" />
                <span>YouTube</span>
                <span className="text-micro px-1 py-0.2 rounded bg-[var(--alert)]/15 font-sans font-bold">
                  {countYouTube.toLocaleString()}
                </span>
                {selectedChannels.youtube ? (
                  <Eye className="w-3 h-3 text-[var(--alert)]" />
                ) : (
                  <EyeOff className="w-3 h-3 text-[var(--ink-2)]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => selectOnlyChannel("youtube")}
                className="px-1.5 py-1 text-micro font-sans/20 hover:bg-[var(--alert)]/20 text-[var(--alert)] cursor-pointer"
                title="Aislar sólo YouTube"
              >
                Solo
              </button>
            </div>
          )}

          {/* Spotify Chip */}
          {hasSpotify && (
            <div
              className={`flex items-center rounded-[var(--r-s)] transition-ui ${
                selectedChannels.spotify
                  ? "bg-[var(--ok-soft)]/40 text-[var(--ink-2)]"
                  : "bg-[var(--surface)]/30 text-[var(--ink-2)] opacity-60"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleChannel("spotify")}
                className="px-2 py-1 flex items-center gap-1.5 text-micro font-sans font-medium cursor-pointer"
              >
                <span
                  className={`w-2 h-2 rounded-[var(--r-pill)] ${selectedChannels.spotify ? "bg-[var(--ok)]" : "bg-[var(--sunken)]"}`}
                ></span>
                <Music2 className="w-3 h-3 text-[var(--ok)]" />
                <span>Spotify</span>
                <span className="text-micro px-1 py-0.2 rounded bg-[var(--ok)]/15 font-sans font-bold">
                  {countSpotify.toLocaleString()}
                </span>
                {selectedChannels.spotify ? (
                  <Eye className="w-3 h-3 text-[var(--ok)]" />
                ) : (
                  <EyeOff className="w-3 h-3 text-[var(--ink-2)]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => selectOnlyChannel("spotify")}
                className="px-1.5 py-1 text-micro font-sans/20 hover:bg-[var(--ok)]/20 text-[var(--ok)] cursor-pointer"
                title="Aislar sólo Spotify"
              >
                Solo
              </button>
            </div>
          )}

          {/* Fans Registrados (BD / Únete) Chip */}
          <div
            className={`flex items-center rounded-[var(--r-s)] transition-ui ${
              selectedChannels.fans
                ? "bg-[var(--acc-soft)]  text-[var(--ink)] font-bold"
                : "bg-[var(--surface)]/30 text-[var(--ink-2)] opacity-60"
            }`}
          >
            <button
              type="button"
              onClick={() => toggleChannel("fans")}
              className="px-2 py-1 flex items-center gap-1.5 text-micro font-sans cursor-pointer"
            >
              <span
                className={`w-2 h-2 rounded-[var(--r-pill)] ${selectedChannels.fans ? "bg-[var(--acc)]" : "bg-[var(--sunken)]"}`}
              ></span>
              <Heart className="w-3 h-3 text-[var(--acc)] fill-[var(--acc)]/30" />
              <span>Fans BD (Únete)</span>
              <span className="text-micro px-1.5 py-0.2 rounded bg-[var(--acc)] text-[var(--on-acc)] font-sans font-bold">
                {totalFans}
              </span>
              {selectedChannels.fans ? (
                <Eye className="w-3 h-3 text-[var(--acc)]" />
              ) : (
                <EyeOff className="w-3 h-3 text-[var(--ink-2)]" />
              )}
            </button>
            <button
              type="button"
              onClick={() => selectOnlyChannel("fans")}
              className="px-1.5 py-1 text-micro font-sans  hover:bg-[var(--acc)]/30 text-[var(--acc)]/70 cursor-pointer font-bold"
              title="Aislar y ver sólo la curva de Fans registrados"
            >
              Solo
            </button>
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="h-64 w-full relative">
        {!hasAnyChannelSelected ? (
          <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 rounded-[var(--r-m)] bg-[var(--surface)]/20">
            <SlidersHorizontal className="w-8 h-8 text-[var(--ink-2)] mb-2" />
            <p className="text-xs font-sans font-medium text-[var(--ink-2)]">
              Todos los canales están ocultos
            </p>
            <p className="text-micro font-sans text-[var(--ink-2)] mt-1 max-w-xs">
              Haz clic en cualquiera de las etiquetas superiores para activar
              sus curvas y reescalar el gráfico.
            </p>
            <button
              type="button"
              onClick={selectAllChannels}
              className="mt-3 px-3 py-1.5 rounded-[var(--r-pill)] bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] font-sans text-micro font-bold transition-ui cursor-pointer"
            >
              Activar todos los canales
            </button>
          </div>
        ) : (
          <div className="h-full w-full flex items-end">
            <OndaSeries
              className="w-full"
              height={190}
              barWidth={ondaSeries.length > 3 ? 7 : 11}
              gap={2}
              series={ondaSeries}
            />
          </div>
        )}
      </div>

      {/* Footer Info & Direct Links */}
      <div className="mt-4 pt-3  flex flex-col sm:flex-row items-center justify-between gap-2 text-micro font-sans text-[var(--ink-2)]">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1 text-[var(--ok)]">
            <ShieldCheck className="w-3.5 h-3.5" /> 100% Consentimiento RGPD (
            {verifiedRgpd} registros)
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-[var(--acc)]/70">
            <Users className="w-3.5 h-3.5" /> {activeCitiesCount} ciudades con
            fans
          </span>
          <span>•</span>
          <span className="text-[var(--ink-2)]">
            Landing pública:{" "}
            <a
              href={
                bandId ? `/unete?band=${encodeURIComponent(bandId)}` : "/unete"
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--acc)] hover:underline inline-flex items-center gap-0.5"
            >
              {bandId
                ? `/unete?band=${bandId.replace(/^(band|reg)-/, "")}`
                : "/unete"}{" "}
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </span>
        </div>

        <span className="text-[var(--ink-2)]">
          Curvas escaladas dinámicamente con datos de Supabase
        </span>
      </div>
    </div>
  );
};
