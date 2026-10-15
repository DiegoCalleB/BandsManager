/**
 * Serie temporal, resumen del periodo, dominio del eje y curvas del gráfico de métricas.
 * Extraído de ReelsMetricsView.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import type { MetricWithFans } from "../metricsTypes";
import React, { Dispatch, SetStateAction } from "react";
import { SocialMetric } from "../../../../types";
import { CANAL_COLOR } from "../../../../utils/canalColor";
import type { SocialMetricsPeriod } from "../metricsPeriods";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface MetricsChartParams {
  filteredSortedMetrics: SocialMetric[];
  sortedMetrics: SocialMetric[];
  selectedPeriod: SocialMetricsPeriod;
  latestMetric: SocialMetric;
  hasInstagram: boolean;
  hasTikTok: boolean;
  hasYouTube: boolean;
  hasSpotify: boolean;
  fansTotalCount: number;
  setSelectedChannels: Dispatch<SetStateAction<{ instagram: boolean; tiktok: boolean; youtube: boolean; spotify: boolean; fans: boolean; }>>;
  selectedChannels: { instagram: boolean; tiktok: boolean; youtube: boolean; spotify: boolean; fans: boolean; };
  hasFans: boolean;
}

/**
 * Serie temporal, resumen del periodo, dominio del eje y curvas del gráfico de métricas.
 * @param params Estado y callbacks del contenedor ({@link MetricsChartParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useMetricsChart({ filteredSortedMetrics, sortedMetrics, selectedPeriod, latestMetric, hasInstagram, hasTikTok, hasYouTube, hasSpotify, fansTotalCount, setSelectedChannels, selectedChannels, hasFans }: MetricsChartParams) {
  // Timeline data for the chart with proper period handling
  const chartTimelineData = React.useMemo(() => {
    if (filteredSortedMetrics.length >= 2) {
      return filteredSortedMetrics;
    }

    if (filteredSortedMetrics.length === 1 && sortedMetrics.length > 1) {
      const single = filteredSortedMetrics[0];
      const prior = sortedMetrics.filter((m) => m.fecha < single.fecha).pop();
      if (prior) return [prior, single];
    }

    if (sortedMetrics.length >= 2 && selectedPeriod === "all") {
      return sortedMetrics;
    }

    // Generate smooth progression points spanning the chosen period
    const now = new Date();
    const points: MetricWithFans[] = [];
    let daysBack: number[];
    let baseFactor: number;

    switch (selectedPeriod) {
      case "7d":
        daysBack = [7, 5, 4, 3, 2, 1, 0];
        baseFactor = 0.94;
        break;
      case "30d":
        daysBack = [30, 24, 18, 12, 6, 0];
        baseFactor = 0.8;
        break;
      case "90d":
        daysBack = [90, 75, 60, 45, 30, 15, 0];
        baseFactor = 0.68;
        break;
      case "1y":
        daysBack = [365, 300, 240, 180, 120, 60, 0];
        baseFactor = 0.5;
        break;
      case "all":
      default:
        daysBack = [180, 150, 120, 90, 60, 30, 0];
        baseFactor = 0.55;
        break;
    }

    const baseIg = Number(
      latestMetric?.instagram_followers ||
        latestMetric?.instagram ||
        (hasInstagram ? 2150 : 0),
    );
    const baseTk = Number(
      latestMetric?.tiktok_followers ||
        latestMetric?.tiktok ||
        (hasTikTok ? 3850 : 0),
    );
    const baseYt = Number(
      latestMetric?.youtube_subscribers ||
        latestMetric?.youtube ||
        (hasYouTube ? 1210 : 0),
    );
    const baseSp = Number(
      latestMetric?.spotify_monthly_listeners ||
        latestMetric?.spotify ||
        (hasSpotify ? 150 : 0),
    );
    const baseFans = fansTotalCount || latestMetric?.fans || 0;

    for (let i = 0; i < daysBack.length; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - daysBack[i]);
      const dateStr = d.toISOString().split("T")[0];
      const progress = i / (daysBack.length - 1);
      const factor = baseFactor + progress * (1 - baseFactor);

      points.push({
        fecha: dateStr,
        instagram: Math.round(baseIg * factor),
        tiktok: Math.round(
          baseTk * (baseFactor * 0.95 + progress * (1 - baseFactor * 0.95)),
        ),
        youtube: Math.round(
          baseYt * (baseFactor * 1.05 + progress * (1 - baseFactor * 1.05)),
        ),
        spotify: Math.round(
          baseSp * (baseFactor * 0.9 + progress * (1 - baseFactor * 0.9)),
        ),
        fans: Math.max(1, Math.round(baseFans * factor)),
        instagram_followers: Math.round(baseIg * factor),
        tiktok_followers: Math.round(
          baseTk * (baseFactor * 0.95 + progress * (1 - baseFactor * 0.95)),
        ),
        youtube_subscribers: Math.round(
          baseYt * (baseFactor * 1.05 + progress * (1 - baseFactor * 1.05)),
        ),
        spotify_monthly_listeners: Math.round(
          baseSp * (baseFactor * 0.9 + progress * (1 - baseFactor * 0.9)),
        ),
      });
    }
    return points;
  }, [
    filteredSortedMetrics,
    sortedMetrics,
    selectedPeriod,
    latestMetric,
    hasInstagram,
    hasTikTok,
    hasYouTube,
    hasSpotify,
    fansTotalCount,
  ]);

  // Period Growth Summary Stats (Start vs End)
  const periodSummaryStats = React.useMemo(() => {
    if (!chartTimelineData || chartTimelineData.length < 2) return null;
    const first = chartTimelineData[0];
    const last = chartTimelineData[chartTimelineData.length - 1];

    const diffIg =
      Number(last.instagram_followers || last.instagram || 0) -
      Number(first.instagram_followers || first.instagram || 0);
    const diffTk =
      Number(last.tiktok_followers || last.tiktok || 0) -
      Number(first.tiktok_followers || first.tiktok || 0);
    const diffYt =
      Number(last.youtube_subscribers || last.youtube || 0) -
      Number(first.youtube_subscribers || first.youtube || 0);
    const diffSp =
      Number(last.spotify_monthly_listeners || last.spotify || 0) -
      Number(first.spotify_monthly_listeners || first.spotify || 0);
    const diffFans =
      Number(last.fans || 0) - Number(first.fans || 0);

    return {
      diffIg,
      diffTk,
      diffYt,
      diffSp,
      diffFans,
      startDate: first.fecha,
      endDate: last.fecha,
    };
  }, [chartTimelineData]);

  const toggleChannel = (
    channel: "instagram" | "tiktok" | "youtube" | "spotify" | "fans",
  ) => {
    setSelectedChannels((prev) => ({
      ...prev,
      [channel]: !prev[channel],
    }));
  };

  const selectOnlyChannel = (
    channel: "instagram" | "tiktok" | "youtube" | "spotify" | "fans",
  ) => {
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
      instagram: true,
      tiktok: true,
      youtube: true,
      spotify: true,
      fans: true,
    });
  };

  // Dynamic scale computation for visible channels
  const maxVisibleValue = React.useMemo(() => {
    let max = 0;
    for (const m of chartTimelineData) {
      if (selectedChannels.instagram && hasInstagram) {
        max = Math.max(max, Number(m.instagram || m.instagram_followers || 0));
      }
      if (selectedChannels.tiktok && hasTikTok) {
        max = Math.max(max, Number(m.tiktok || m.tiktok_followers || 0));
      }
      if (selectedChannels.youtube && hasYouTube) {
        max = Math.max(max, Number(m.youtube || m.youtube_subscribers || 0));
      }
      if (selectedChannels.spotify && hasSpotify) {
        max = Math.max(
          max,
          Number(m.spotify || m.spotify_monthly_listeners || 0),
        );
      }
      if (selectedChannels.fans && hasFans) {
        max = Math.max(max, Number(m.fans || fansTotalCount));
      }
    }
    return max;
  }, [
    chartTimelineData,
    selectedChannels,
    hasInstagram,
    hasTikTok,
    hasYouTube,
    hasSpotify,
    hasFans,
    fansTotalCount,
  ]);

  const yAxisDomain = React.useMemo(() => {
    if (maxVisibleValue <= 0) return [0, 10];
    if (maxVisibleValue <= 50) return [0, Math.ceil(maxVisibleValue * 1.25)];
    if (maxVisibleValue <= 200) return [0, Math.ceil(maxVisibleValue * 1.2)];
    if (maxVisibleValue <= 1000) return [0, Math.ceil(maxVisibleValue * 1.15)];
    return [0, Math.ceil(maxVisibleValue * 1.1)];
  }, [maxVisibleValue]);

  // Evolución temporal = curva suave. Como mucho 60 fechas repartidas por el periodo (siempre la
  // última) y una serie por canal activo.
  const curveSeries = React.useMemo(() => {
    const total = chartTimelineData.length;
    const step = Math.max(1, Math.ceil(total / 60));
    const sampled = chartTimelineData.filter((_: unknown, i: number) => i % step === 0 || i === total - 1);
    const etiqueta = (f: string) => {
      const parts = (f || "").split("-");
      return parts.length === 3 ? `${parts[2]}/${parts[1]}` : f;
    };
    const canales = [
      { key: "instagram", on: hasInstagram && selectedChannels.instagram, label: "Instagram", color: CANAL_COLOR.instagram },
      { key: "tiktok", on: hasTikTok && selectedChannels.tiktok, label: "TikTok", color: CANAL_COLOR.tiktok },
      { key: "youtube", on: hasYouTube && selectedChannels.youtube, label: "YouTube", color: CANAL_COLOR.youtube },
      { key: "spotify", on: hasSpotify && selectedChannels.spotify, label: "Spotify", color: CANAL_COLOR.spotify },
    ];
    return canales
      .filter((c) => c.on)
      .map((c) => ({
        label: c.label,
        color: c.color,
        data: sampled.map((d) => ({ label: etiqueta(d.fecha), value: Number(d[c.key as keyof MetricWithFans] || 0) })),
      }));
  }, [chartTimelineData, selectedChannels, hasInstagram, hasTikTok, hasYouTube, hasSpotify]);

  const activeCount = [
    hasInstagram,
    hasTikTok,
    hasYouTube,
    hasSpotify,
    hasFans,
  ].filter(Boolean).length;

  const gridColsClass =
    activeCount === 1
      ? "grid-cols-1"
      : activeCount === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : activeCount === 3
          ? "grid-cols-1 sm:grid-cols-3"
          : activeCount === 4
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5";

  return { gridColsClass, yAxisDomain, selectAllChannels, periodSummaryStats, toggleChannel, selectOnlyChannel, curveSeries, activeCount };
}
