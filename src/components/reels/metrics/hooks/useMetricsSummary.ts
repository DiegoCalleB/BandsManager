/**
 * Periodo y canales seleccionados, métricas ordenadas y plataformas con datos.
 * Extraído de ReelsMetricsView.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React, { useState } from "react";
import { EPKConfig, Fan, SocialMetric } from "../../../../types";
import { PERIOD_OPTIONS, type SocialMetricsPeriod } from "../metricsPeriods";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface MetricsSummaryParams {
  fans: Fan[];
  metrics: SocialMetric[];
  epkConfig: Partial<EPKConfig>;
}

/**
 * Periodo y canales seleccionados, métricas ordenadas y plataformas con datos.
 * @param params Estado y callbacks del contenedor ({@link MetricsSummaryParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useMetricsSummary({ fans, metrics, epkConfig }: MetricsSummaryParams) {
  const [selectedPeriod, setSelectedPeriod] =
    useState<SocialMetricsPeriod>("30d");

  // User selected channels to display and rescale the chart
  const [selectedChannels, setSelectedChannels] = useState<{
    instagram: boolean;
    tiktok: boolean;
    youtube: boolean;
    spotify: boolean;
    fans: boolean;
  }>({
    instagram: true,
    tiktok: true,
    youtube: true,
    spotify: true,
    fans: true,
  });

  const fansTotalCount = fans.length;

  const uneteFansCount = fans.filter((f) => {
    const src = (f.comoConocio || "").toLowerCase();
    return (
      src.includes("unete") ||
      src.includes("únete") ||
      src.includes("web") ||
      src.includes("formulario") ||
      src.includes("landing") ||
      !src
    );
  }).length;

  const sortedMetrics = React.useMemo(() => {
    if (!metrics || metrics.length === 0) return [];
    const mapByDate = new Map<string, SocialMetric>();
    const sorted = [...metrics].sort((a, b) => a.fecha.localeCompare(b.fecha));

    for (const m of sorted) {
      const ig = Number(m.instagram ?? m.instagram_followers ?? 0);
      const tk = Number(m.tiktok ?? m.tiktok_followers ?? 0);
      const yt = Number(m.youtube ?? m.youtube_subscribers ?? 0);
      const sp = Number(m.spotify ?? m.spotify_monthly_listeners ?? 0);
      const fn = Number(m.fans ?? fansTotalCount);

      const existing = mapByDate.get(m.fecha);
      if (!existing) {
        mapByDate.set(m.fecha, {
          ...m,
          instagram: ig,
          tiktok: tk,
          youtube: yt,
          spotify: sp,
          fans: fn,
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
          fans: Math.max(Number(existing.fans || 0), fn),
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
  }, [metrics, fansTotalCount]);

  const latestMetric = sortedMetrics[sortedMetrics.length - 1];


  // Active platforms dynamic detection based on EPK config & real non-zero metric records
  const hasInstagram = Boolean(
    epkConfig?.enlacesRedes?.instagram ||
    (latestMetric &&
      ((latestMetric.instagram_followers &&
        latestMetric.instagram_followers > 0) ||
        (latestMetric.instagram && latestMetric.instagram > 0))) ||
    metrics.some(
      (m) =>
        (m.instagram_followers && m.instagram_followers > 0) ||
        (m.instagram && m.instagram > 0),
    ),
  );

  const hasTikTok = Boolean(
    epkConfig?.enlacesRedes?.tiktok ||
    (latestMetric &&
      ((latestMetric.tiktok_followers && latestMetric.tiktok_followers > 0) ||
        (latestMetric.tiktok && latestMetric.tiktok > 0))) ||
    metrics.some(
      (m) =>
        (m.tiktok_followers && m.tiktok_followers > 0) ||
        (m.tiktok && m.tiktok > 0),
    ),
  );

  const hasYouTube = Boolean(
    epkConfig?.enlacesRedes?.youtube ||
    (latestMetric &&
      ((latestMetric.youtube_subscribers &&
        latestMetric.youtube_subscribers > 0) ||
        (latestMetric.youtube && latestMetric.youtube > 0))) ||
    metrics.some(
      (m) =>
        (m.youtube_subscribers && m.youtube_subscribers > 0) ||
        (m.youtube && m.youtube > 0),
    ),
  );

  const hasSpotify = Boolean(
    (epkConfig?.enlacesRedes?.spotify &&
      epkConfig.enlacesRedes.spotify.trim().length > 0) ||
    (latestMetric &&
      ((latestMetric.spotify_monthly_listeners &&
        latestMetric.spotify_monthly_listeners > 0) ||
        (latestMetric.spotify && latestMetric.spotify > 0))) ||
    metrics.some(
      (m) =>
        (m.spotify_monthly_listeners && m.spotify_monthly_listeners > 0) ||
        (m.spotify && m.spotify > 0),
    ),
  );

  const hasFans = Boolean(fansTotalCount > 0 || fans.length > 0);

  const currentPeriodOption = React.useMemo(() => {
    return (
      PERIOD_OPTIONS.find((p) => p.id === selectedPeriod) || PERIOD_OPTIONS[1]
    );
  }, [selectedPeriod]);

  // Filter sorted metrics according to chosen time period
  const filteredSortedMetrics = React.useMemo(() => {
    if (selectedPeriod === "all" || !currentPeriodOption.days) {
      return sortedMetrics;
    }
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - currentPeriodOption.days);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    return sortedMetrics.filter((m) => m.fecha >= cutoffStr);
  }, [sortedMetrics, selectedPeriod, currentPeriodOption]);

  return { filteredSortedMetrics, sortedMetrics, selectedPeriod, latestMetric, hasInstagram, hasTikTok, hasYouTube, hasSpotify, fansTotalCount, setSelectedChannels, selectedChannels, hasFans, uneteFansCount, PERIOD_OPTIONS, setSelectedPeriod, currentPeriodOption };
}
