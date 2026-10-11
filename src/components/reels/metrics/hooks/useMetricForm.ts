/**
 * Formulario de métricas manuales: alta, edición, cancelación y guardado.
 * Extraído de ReelsMetricsView.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React, { useState } from "react";
import { SocialMetric } from "../../../../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface MetricFormParams {
  onUpdateMetric: (id: string, updatedFields: Partial<SocialMetric>) => Promise<void>;
  onAddMetric: (metric: SocialMetric) => Promise<void>;
}

/**
 * Formulario de métricas manuales: alta, edición, cancelación y guardado.
 * @param params Estado y callbacks del contenedor ({@link MetricFormParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useMetricForm({ onUpdateMetric, onAddMetric }: MetricFormParams) {
  const [metricDate, setMetricDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Basic platform metrics
  const [metricInsta, setMetricInsta] = useState("");

  const [metricTiktok, setMetricTiktok] = useState("");

  const [metricYoutube, setMetricYoutube] = useState("");

  const [metricSpotify, setMetricSpotify] = useState("");

  // Advanced platform metrics
  const [metricSpotifyFollowers, setMetricSpotifyFollowers] = useState("");

  const [metricSpotifyPopularity, setMetricSpotifyPopularity] = useState("");

  const [metricYtViews, setMetricYtViews] = useState("");

  const [metricYtVideos, setMetricYtVideos] = useState("");

  const [metricIgFollowing, setMetricIgFollowing] = useState("");

  const [metricIgPosts, setMetricIgPosts] = useState("");

  const [metricIgEngagement, setMetricIgEngagement] = useState("");

  const [metricTkLikes, setMetricTkLikes] = useState("");

  const [metricTkVideos, setMetricTkVideos] = useState("");

  const [metricNotes, setMetricNotes] = useState("");

  const [showAdvancedFields, setShowAdvancedFields] = useState(false);

  const [editingMetricId, setEditingMetricId] = useState<string | null>(null);

  const [isSavingMetric, setIsSavingMetric] = useState(false);

  const [metricSuccess, setMetricSuccess] = useState("");

  const handleEditMetricClick = (m: SocialMetric) => {
    setEditingMetricId(m.id);
    setMetricDate(m.fecha || new Date().toISOString().split("T")[0]);
    setMetricInsta(
      m.instagram_followers
        ? String(m.instagram_followers)
        : m.instagram
          ? String(m.instagram)
          : "",
    );
    setMetricTiktok(
      m.tiktok_followers
        ? String(m.tiktok_followers)
        : m.tiktok
          ? String(m.tiktok)
          : "",
    );
    setMetricYoutube(
      m.youtube_subscribers
        ? String(m.youtube_subscribers)
        : m.youtube
          ? String(m.youtube)
          : "",
    );
    setMetricSpotify(
      m.spotify_monthly_listeners
        ? String(m.spotify_monthly_listeners)
        : m.spotify
          ? String(m.spotify)
          : "",
    );

    setMetricSpotifyFollowers(
      m.spotify_followers ? String(m.spotify_followers) : "",
    );
    setMetricSpotifyPopularity(
      m.spotify_popularity ? String(m.spotify_popularity) : "",
    );
    setMetricYtViews(
      m.youtube_total_views ? String(m.youtube_total_views) : "",
    );
    setMetricYtVideos(
      m.youtube_video_count ? String(m.youtube_video_count) : "",
    );
    setMetricIgFollowing(
      m.instagram_following ? String(m.instagram_following) : "",
    );
    setMetricIgPosts(
      m.instagram_posts_count ? String(m.instagram_posts_count) : "",
    );
    setMetricIgEngagement(
      m.instagram_engagement_rate ? String(m.instagram_engagement_rate) : "",
    );
    setMetricTkLikes(m.tiktok_total_likes ? String(m.tiktok_total_likes) : "");
    setMetricTkVideos(m.tiktok_video_count ? String(m.tiktok_video_count) : "");

    setMetricNotes(m.notas || "");
    if (
      m.spotify_followers ||
      m.youtube_total_views ||
      m.instagram_following ||
      m.tiktok_total_likes
    ) {
      setShowAdvancedFields(true);
    }
  };

  const handleCancelEditMetric = () => {
    setEditingMetricId(null);
    setMetricDate(new Date().toISOString().split("T")[0]);
    setMetricInsta("");
    setMetricTiktok("");
    setMetricYoutube("");
    setMetricSpotify("");
    setMetricSpotifyFollowers("");
    setMetricSpotifyPopularity("");
    setMetricYtViews("");
    setMetricYtVideos("");
    setMetricIgFollowing("");
    setMetricIgPosts("");
    setMetricIgEngagement("");
    setMetricTkLikes("");
    setMetricTkVideos("");
    setMetricNotes("");
    setShowAdvancedFields(false);
  };

  const handleSaveMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metricDate) return;

    setIsSavingMetric(true);
    setMetricSuccess("");

    try {
      const metricData: Omit<SocialMetric, "id"> = {
        fecha: metricDate,
        instagram: parseInt(metricInsta, 10) || 0,
        tiktok: parseInt(metricTiktok, 10) || 0,
        youtube: parseInt(metricYoutube, 10) || 0,
        spotify: parseInt(metricSpotify, 10) || 0,

        // Advanced fields
        spotify_monthly_listeners: parseInt(metricSpotify, 10) || 0,
        spotify_followers: parseInt(metricSpotifyFollowers, 10) || 0,
        spotify_popularity: parseInt(metricSpotifyPopularity, 10) || 0,

        youtube_subscribers: parseInt(metricYoutube, 10) || 0,
        youtube_total_views: parseInt(metricYtViews, 10) || 0,
        youtube_video_count: parseInt(metricYtVideos, 10) || 0,

        instagram_followers: parseInt(metricInsta, 10) || 0,
        instagram_following: parseInt(metricIgFollowing, 10) || 0,
        instagram_posts_count: parseInt(metricIgPosts, 10) || 0,
        instagram_engagement_rate: parseFloat(metricIgEngagement) || 0,

        tiktok_followers: parseInt(metricTiktok, 10) || 0,
        tiktok_total_likes: parseInt(metricTkLikes, 10) || 0,
        tiktok_video_count: parseInt(metricTkVideos, 10) || 0,

        notas: metricNotes,
      };

      if (editingMetricId) {
        if (onUpdateMetric) {
          await onUpdateMetric(editingMetricId, metricData);
        }
        setMetricSuccess("Registro actualizado con éxito en Supabase");
      } else {
        if (onAddMetric) {
          const newMetric: SocialMetric = {
            id: `m_${Date.now()}`,
            ...metricData,
          };
          await onAddMetric(newMetric);
        }
        setMetricSuccess("Nuevo snapshot guardado en Supabase");
      }

      handleCancelEditMetric();
      setTimeout(() => setMetricSuccess(""), 4000);
    } catch (err) {
      console.error("Error guardando métrica:", err);
    } finally {
      setIsSavingMetric(false);
    }
  };

  return { metricSuccess, editingMetricId, handleSaveMetric, metricDate, setMetricDate, metricInsta, setMetricInsta, metricTiktok, setMetricTiktok, metricYoutube, setMetricYoutube, metricSpotify, setMetricSpotify, setShowAdvancedFields, showAdvancedFields, metricSpotifyFollowers, setMetricSpotifyFollowers, metricSpotifyPopularity, setMetricSpotifyPopularity, metricYtViews, setMetricYtViews, metricTkLikes, setMetricTkLikes, metricNotes, setMetricNotes, isSavingMetric, handleCancelEditMetric, handleEditMetricClick };
}
