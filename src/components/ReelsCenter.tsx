import React, { useState, useEffect } from "react";
import {
  ThemeColors,
  SocialPost,
  SocialMetric,
  BandSocialAccount,
} from "../types";
import { apiFetch } from "../utils/api";
import {
  Sparkles,
  Play,
  Flame,
  Heart,
  MessageCircle,
  Share2,
  Music,
  Upload,
  Layers,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  RefreshCw,
  Video,
  Calendar,
  Clock,
  Trash2,
  Film,
  Check,
  ExternalLink,
  Gauge,
  ChevronRight,
  ChevronLeft,
  Plus,
  TrendingUp,
  LineChart,
  Instagram,
  Youtube,
  Edit,
  Table,
  Volume2,
  VolumeX,
  Maximize2,
  X,
  Star,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  Camera,
  Download,
  FileText,
  Send,
  Disc,
  Copy,
  Lightbulb,
  Zap,
  Radio,
  Globe,
  ShieldCheck,
  Rocket,
} from "lucide-react";
import { PublicoSilhouette } from "./ui/PublicoSilhouette";
import { ShowIcon } from './ui/ShowIcon';

interface ReelsCenterProps {
  colors: ThemeColors;
  posts: SocialPost[];
  onAddPost: (post: SocialPost) => Promise<void>;
  onUpdatePost: (
    id: string,
    updatedFields: Partial<SocialPost>,
  ) => Promise<void>;
  metrics?: SocialMetric[];
  onAddMetric?: (metric: SocialMetric) => Promise<void>;
  onUpdateMetric?: (
    id: string,
    updatedFields: Partial<SocialMetric>,
  ) => Promise<void>;
  onDeleteMetric?: (id: string) => Promise<void>;
  bandName?: string;
  instagramHandle?: string;
  /** El backend ya rastrea Instagram, TikTok, YouTube y Facebook: basta con tener uno configurado. */
  hasAnySocialLink?: boolean;
}

import {
  ReelCard,
  HighlightClip,
  OptimalTime,
  getYouTubeId,
  getStartTimeInSeconds,
  defaultScheduleDate,
  validateScheduleReadiness,
  getCadenceWarnings,
} from "../utils/reelsUtils";
import { BandToneModal, ToneAnalysisData } from "./bandCRM/BandToneModal";
import { ViralGrowthStudio, SUBTITLE_STYLES } from "./reels/ViralGrowthStudio";
import { ReelsPhoneMockup } from "./reels/ReelsPhoneMockup";
import { ReelsTheaterModal } from "./reels/ReelsTheaterModal";
import { Input, Select, Textarea } from './ui';

export type { ReelCard, HighlightClip, OptimalTime };

export interface YoutubeVideoMeta {
  videoId: string;
  title: string;
  author: string;
  duration: number;
  durationKnown: boolean;
  thumbnail: string;
  hasTranscript: boolean;
  transcriptLines: number;
  isLive?: boolean;
}

/** Clave estable para un archivo local: no sube el vídeo, solo permite reconocerlo si se
 * vuelve a abrir el mismo (mismo nombre y tamaño) para recuperar su análisis guardado. */
function videoKeyDeArchivo(
  file: { name: string; size: number } | null,
): string | undefined {
  if (!file) return undefined;
  return `file:${file.name}-${file.size}`;
}

function parseRangeTimes(rangeStr?: string) {
  if (!rangeStr) return { start: 0, end: 0, duration: 0 };
  const parts = rangeStr.split("-");
  const startStr = parts[0]?.trim() || "";
  const endStr = parts[1]?.trim() || "";

  const parseTime = (timeStr: string) => {
    const timeParts = timeStr.split(":");
    if (timeParts.length === 3) {
      const hrs = parseInt(timeParts[0], 10) || 0;
      const mins = parseInt(timeParts[1], 10) || 0;
      const secs = parseInt(timeParts[2], 10) || 0;
      return hrs * 3600 + mins * 60 + secs;
    } else if (timeParts.length === 2) {
      const mins = parseInt(timeParts[0], 10) || 0;
      const secs = parseInt(timeParts[1], 10) || 0;
      return mins * 60 + secs;
    } else if (timeParts.length === 1) {
      return parseInt(timeParts[0], 10) || 0;
    }
    return 0;
  };

  const start = parseTime(startStr);
  const end = parseTime(endStr);
  const duration = Math.max(0, end - start);
  return { start, end, duration };
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// El tono no es el mismo en cada red (Facebook más institucional, TikTok más gamberro...), así
// que el texto que se propone para programar el post tiene que seguir a la red elegida, no
// enseñar siempre el copy de Instagram aunque el usuario haya marcado TikTok o Facebook.
function copyForPlatform(
  clip: HighlightClip | undefined | null,
  platform: "Instagram" | "TikTok" | "YouTube" | "Facebook",
): string {
  if (!clip) return "";
  if (platform === "TikTok")
    return clip.copyTikTok || clip.recommendedCopy || "";
  if (platform === "YouTube")
    return clip.copyYouTube || clip.recommendedCopy || "";
  if (platform === "Facebook")
    return clip.copyFacebook || clip.recommendedCopy || "";
  return clip.recommendedCopy || "";
}

// Qué iconos de interacción tapan el lateral derecho del vídeo en cada red: no es solo el
// copy lo que cambia por plataforma, la propia UI de la app también se come parte del encuadre
// de forma distinta (Instagram añade guardar, YouTube separa like/dislike, etc.), así que un
// hookText o un subtítulo pegado al borde derecho puede quedar tapado en una red y no en otra.
const PLATFORM_UI_ICONS: Record<
  "Instagram" | "TikTok" | "YouTube" | "Facebook",
  (typeof Heart)[]
> = {
  Instagram: [Heart, MessageCircle, Share2, Bookmark],
  TikTok: [Heart, MessageCircle, Bookmark, Share2],
  YouTube: [ThumbsUp, MessageCircle, Share2],
  Facebook: [ThumbsUp, MessageCircle, Share2],
};

// Arsenal de Ganchos Virales categorizados para la industria musical (0-3s Hook Presets)
const VIRAL_HOOK_PRESETS = [
  {
    categoria: "🎸 En Vivo & Directo",
    icon: "🔥",
    hooks: [
      "Cuando el público canta más fuerte que la banda",
      "El momento exacto en que se descontroló el bolo",
      "Este solo de guitarra casi rompe el escenario",
      "La energía de esta sala fue de otro planeta",
      "Nadie esperaba que el concierto terminara así",
    ],
  },
  {
    categoria: "🥁 Ensayo & Backstage",
    icon: "⚡",
    hooks: [
      "3 horas peleando este ritmo hasta que sonó así",
      "Lo que nadie te enseña de la prueba de sonido",
      "La parte de la canción que casi borramos",
      "Cuando el batería mete un redoble improvisado",
      "El secreto detrás de nuestro sonido en el local",
    ],
  },
  {
    categoria: "🚀 Lanzamiento & Temazo",
    icon: "✨",
    hooks: [
      "Si escuchas indie/rock, este tema te va a flipar",
      "La historia real detrás de esta letra",
      "La canción que compusimos en una noche de furia",
      "Nuevo single en Spotify (link en bio)",
      "El estribillo que no te vas a poder sacar de la cabeza",
    ],
  },
  {
    categoria: "🤣 Humor & Músicos",
    icon: "🎭",
    hooks: [
      "POV: El cantante olvida la letra en directo",
      "Dime que tocas en una banda sin decírmelo",
      "Nadie te prepara para romper una cuerda en el solo",
      "Cuando el técnico de sonido te mira así",
    ],
  },
];

export default function ReelsCenter({
  colors,
  posts = [],
  onAddPost,
  onUpdatePost,
  metrics = [],
  onAddMetric,
  onUpdateMetric,
  onDeleteMetric,
  bandName,
  instagramHandle,
  hasAnySocialLink,
}: ReelsCenterProps) {
  // Tabs:'pipeline' (existing Kanban + Writer) vs'analyzer' (new AI Video Highlight Extractor)
  const [activeTab, setActiveTab] = useState<"pipeline" | "analyzer">(
    "pipeline",
  );

  // Esta pantalla estaba llena de"Bakandeya" a pelo, así que cualquier otra banda veía por
  // todas partes el nombre de la banda del fundador en vez del suyo.
  const nombreBanda = (bandName || "").trim() || "tu banda";

  // Band Tone Analysis State
  const [isBakandeyaToneModalOpen, setIsBakandeyaToneModalOpen] =
    useState(false);
  const [bakandeyaToneData, setBakandeyaToneData] =
    useState<ToneAnalysisData | null>(null);
  const [isAnalyzingBakandeyaTone, setIsAnalyzingBakandeyaTone] =
    useState(false);
  // Si el backend confirmó que guardó el ADN de tono en Supabase (y no solo en esta pantalla).
  // El usuario preguntó explícitamente si esto se guardaba: antes no había forma de saberlo.
  const [toneAnalysisSaved, setToneAnalysisSaved] = useState(false);

  // Abrir el modal disparaba SIEMPRE un análisis nuevo con IA, aunque ya hubiera un ADN guardado
  // (de una edición manual o de un análisis anterior): cada vez que el usuario solo quería
  // consultarlo, se lo pisaba con un resultado nuevo de la IA y perdía sus correcciones a mano.
  // Ahora primero se mira qué hay ya guardado; solo se lanza la IA si no hay nada todavía.
  const handleOpenToneModal = async () => {
    setIsBakandeyaToneModalOpen(true);
    setIsAnalyzingBakandeyaTone(true);
    try {
      const res = await apiFetch("/api/bands/tone-dna");
      const json = res as any;
      if (json?.success && json.data) {
        setBakandeyaToneData(json.data);
        setToneAnalysisSaved(true);
        setIsAnalyzingBakandeyaTone(false);
        return;
      }
    } catch (err) {
      console.error("Error cargando el ADN de tono guardado:", err);
    }
    // Sin nada guardado todavía: se cae al análisis con IA de siempre.
    await handleAnalyzeBakandeyaTone();
  };

  // Refresca solo lo guardado en Supabase (incluidas las reglas de Self-Refining Tone DNA
  // recién generadas por"Entrenar ADN de tono ahora"), sin relanzar el rastreo de redes.
  const handleRefreshLearnedRules = async () => {
    try {
      const res = await apiFetch("/api/bands/tone-dna");
      const json = res as any;
      if (json?.success && json.data) {
        setBakandeyaToneData(json.data);
        setToneAnalysisSaved(true);
      }
    } catch (err) {
      console.error("Error refrescando el ADN de tono aprendido:", err);
    }
  };

  // Antes esto analizaba siempre @bakandeya en Instagram, sin importar qué banda estuviera
  // usando la app: el botón"Analizar tono de voz" de CUALQUIER banda escaneaba la cuenta de
  // Instagram del fundador en vez de la suya propia.
  const handleAnalyzeBakandeyaTone = async () => {
    // El backend ya rastrea Instagram, TikTok, YouTube y Facebook (lee el EPK real de la banda),
    // así que exigir Instagram en concreto bloqueaba a cualquier banda que solo tuviera, por
    // ejemplo, TikTok configurado.
    if (!instagramHandle && !hasAnySocialLink) {
      alert(
        "Configura al menos una red social de tu banda (Instagram, TikTok, YouTube o Facebook) en el EPK antes de analizar el tono de voz.",
      );
      return;
    }
    setIsAnalyzingBakandeyaTone(true);
    setIsBakandeyaToneModalOpen(true);
    setToneAnalysisSaved(false);
    try {
      const res = await apiFetch("/api/bands/analyze-tone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_entidad: bandName || "Tu Banda",
          instagram: instagramHandle,
          estilo_musical: "",
          localizacion: "",
          tipo: "Banda / Artista Emisora",
          is_sender: true,
        }),
      });
      const json = res as any;
      if (json?.success && json.data) {
        setBakandeyaToneData(json.data);
        // El backend guarda el ADN en Supabase de forma automática cuando is_sender es true;
        // savedPermanently confirma que la escritura no falló, para poder decírselo al usuario.
        setToneAnalysisSaved(Boolean(json.savedPermanently));
      }
    } catch (err) {
      console.error("Error analyzing Bakandeya tone:", err);
    } finally {
      setIsAnalyzingBakandeyaTone(false);
    }
  };

  // Sync state
  const [isSyncingReels, setIsSyncingReels] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState("");
  const [syncErrorMessage, setSyncErrorMessage] = useState("");

  const handleSyncReels = async () => {
    setIsSyncingReels(true);
    setSyncSuccessMessage("");
    setSyncErrorMessage("");
    try {
      const res = await fetch("/api/posts/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncSuccessMessage(
          data.message || "Publicaciones y Reels sincronizados con éxito.",
        );
        // clear after 6 seconds
        setTimeout(() => setSyncSuccessMessage(""), 6000);
      } else {
        setSyncErrorMessage(
          data.error || "Error al intentar sincronizar los Reels.",
        );
      }
    } catch (error) {
      console.error("Error synchronizing reels:", error);
      setSyncErrorMessage("Error de conexión con el servidor.");
    } finally {
      setIsSyncingReels(false);
    }
  };

  const [selectedPostInPhone, setSelectedPostInPhone] =
    useState<SocialPost | null>(null);
  const [reelIdea, setReelIdea] = useState("");
  const [generatedCopy, setGeneratedCopy] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // New AI Analyzer States
  const [inputType, setInputType] = useState<"file" | "youtube">("file");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
  } | null>(null);
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);
  // Duración real del archivo subido. Sin ella, al analizar un vídeo local el backend
  // trabajaba a ciegas y repartía los cortes sobre una duración inventada.
  const [localVideoDuration, setLocalVideoDuration] = useState<number>(0);
  const [isPreviewMuted, setIsPreviewMuted] = useState(true);
  const [isExpandedPreview, setIsExpandedPreview] = useState(false);

  useEffect(() => {
    if (isExpandedPreview) {
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        const modalEl = document.getElementById("theater-mode-modal");
        if (modalEl) modalEl.scrollTop = 0;
        window.scrollTo({ top: 0, behavior: "instant" as any });
      }, 10);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isExpandedPreview]);

  const [videoTopic, setVideoTopic] = useState("");
  // Duración objetivo del CLIP que queremos sacar (15/30/60), no la del vídeo de origen.
  const [videoDuration, setVideoDuration] = useState(30);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Ficha real del vídeo de YouTube. Antes la línea de tiempo asumía siempre 120 s, así que
  // en un directo de 40 minutos los marcadores no se correspondían con nada.
  const [videoMeta, setVideoMeta] = useState<YoutubeVideoMeta | null>(null);
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [analysisNotice, setAnalysisNotice] = useState<string | null>(null);
  // Tramos con más volumen medidos en el audio real. Es lo que permite acertar en material
  // instrumental, donde no hay transcripción de la que tirar.
  const [energyWindows, setEnergyWindows] = useState<
    Array<{ start: number; end: number; score: number }>
  >([]);
  // Versión con el desglose por señal (volumen / arranque / ritmo visual). Cuando el backend
  // no llega a calcularla (p.ej. sin yt-dlp para leer el audio en streaming) se cae a
  // energyWindows, que solo trae el score combinado.
  const [viralWindows, setViralWindows] = useState<
    Array<{
      start: number;
      end: number;
      energia: number;
      arranque: number;
      dinamismo: number;
      score: number;
      motivo: string;
    }>
  >([]);

  // Opciones de renderizado del clip físico
  const [cropMode, setCropMode] = useState<"crop" | "blur" | "none">("crop");
  const [burnSubtitles, setBurnSubtitles] = useState(false);
  // Resaltado palabra por palabra (estilo TikTok/CapCut) en vez del subtítulo estático de siempre.
  const [karaokeSubtitles, setKaraokeSubtitles] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Results from Backend
  const [highlights, setHighlights] = useState<HighlightClip[]>([]);
  const [optimalTime, setOptimalTime] = useState<OptimalTime | null>(null);
  const [selectedHighlightIndex, setSelectedHighlightIndex] =
    useState<number>(0);
  const [simulatedTime, setSimulatedTime] = useState<number>(0);
  const [ytLoopCount, setYtLoopCount] = useState<number>(0);
  const [draggingBoundary, setDraggingBoundary] = useState<
    "start" | "end" | null
  >(null);

  // Real physical video cutting and subtitle states
  const [renderedClipUrl, setRenderedClipUrl] = useState<string | null>(null);
  const [renderedSubUrl, setRenderedSubUrl] = useState<string | null>(null);
  const [subtitleCues, setSubtitleCues] = useState<
    Array<{ text: string; start: number; end: number }>
  >([]);
  const [wordOffsets, setWordOffsets] = useState<
    Array<{ word: string; start: number; end: number }>
  >([]);
  const [isWhisperTranscribed, setIsWhisperTranscribed] = useState(false);
  const [currentSubtitleText, setCurrentSubtitleText] = useState<string>("");
  const [isCuttingVideo, setIsCuttingVideo] = useState(false);
  const [cuttingProgressText, setCuttingProgressText] = useState("");
  const [cuttingError, setCuttingError] = useState<string | null>(null);
  const [sinTranscripcionReal, setSinTranscripcionReal] =
    useState<boolean>(false);
  const [renderedClipSize, setRenderedClipSize] = useState<number>(0);
  const [renderedBurnedSubs, setRenderedBurnedSubs] = useState<boolean>(false);
  // Si el clip se subió a Supabase Storage sobrevive a un redeploy; si no, solo vive en el
  // disco del servidor hasta el próximo despliegue.
  const [renderedStoredPermanently, setRenderedStoredPermanently] =
    useState<boolean>(false);
  // Cuándo se guardó el análisis que se está viendo, si viene recuperado de la BD en vez de
  // recién calculado. null cuando el análisis en pantalla es fresco (o no hay ninguno).
  const [loadedFromSaveAt, setLoadedFromSaveAt] = useState<string | null>(null);
  // Cómo está grabado el material: cambia qué busca la IA y cómo titula.'auto' deja que el
  // servidor lo adivine del título/descripción reales; el usuario puede fijarlo a mano.
  const [contentType, setContentType] = useState<
    "auto" | "concierto" | "videoclip" | "ensayo"
  >("auto");
  const [detectedContentType, setDetectedContentType] = useState<string | null>(
    null,
  );

  // Framework Viral 3.0: 3 modos de copy + simulador Safe-Zone + Arsenal de Ganchos
  const [copyObjective, setCopyObjective] = useState<
    "viral" | "comunidad" | "conversion"
  >("viral");
  const [showSafeZone, setShowSafeZone] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const [showHookArsenal, setShowHookArsenal] = useState<boolean>(false);
  const [packDownloadedSuccess, setPackDownloadedSuccess] =
    useState<boolean>(false);
  const [thumbnailCapturedSuccess, setThumbnailCapturedSuccess] =
    useState<boolean>(false);

  // Despacho Automático y Cuentas Sociales Oficiales
  const [autoPublishEnabled, setAutoPublishEnabled] = useState<boolean>(true);
  const [socialAccounts, setSocialAccounts] = useState<BandSocialAccount[]>([]);
  const [isPublishingNow, setIsPublishingNow] = useState<boolean>(false);
  const [publishNowSuccess, setPublishNowSuccess] = useState<string | null>(
    null,
  );
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(
    null,
  );
  const [connectHandleInput, setConnectHandleInput] = useState<string>("");

  // Viral Growth Engine 4.0: Bucle Infinito + Estilo de Subtítulos + Layouts + Punch-In Zoom + B-Roll Overlays
  const [isSeamlessLoop, setIsSeamlessLoop] = useState<boolean>(true);
  const [isPunchInZoom, setIsPunchInZoom] = useState<boolean>(true);
  const [activeSubtitleStyle, setActiveSubtitleStyle] = useState<
    "gold" | "neon" | "cinematic" | "minimal"
  >("gold");
  const [injectEmojis, setInjectEmojis] = useState<boolean>(true);
  const [showSpotifyBadge, setShowSpotifyBadge] = useState<boolean>(true);
  const [showRetentionProgressBar, setShowRetentionProgressBar] =
    useState<boolean>(true);
  const [showTourSticker, setShowTourSticker] = useState<boolean>(false);
  const [tourStickerText, setTourStickerText] = useState<string>(
    "🎟️ Gira 2026 · Próximo Bolo en Madrid",
  );
  const [layoutMode, setLayoutMode] = useState<"full" | "split" | "pip">(
    "full",
  );
  const [beatDropFx, setBeatDropFx] = useState<boolean>(true);
  const [smartPan, setSmartPan] = useState<boolean>(false);
  const [magicAppliedNotification, setMagicAppliedNotification] =
    useState<boolean>(false);

  // ✨ Auto-Director Mágico (1-Click God Mode)
  const handleTriggerMagicAutopilot = () => {
    if (highlights.length > 0) {
      let bestIdx = 0;
      let maxScore = -1;
      highlights.forEach((h, idx) => {
        const score = Number(h.virality || (h as any).score || 80);
        if (score > maxScore) {
          maxScore = score;
          bestIdx = idx;
        }
      });
      handleSelectHighlight(bestIdx);
    }

    setIsPunchInZoom(true);
    setIsSeamlessLoop(true);
    setBeatDropFx(true);
    setActiveSubtitleStyle("gold");
    setInjectEmojis(true);
    setShowSpotifyBadge(true);
    setShowRetentionProgressBar(true);
    setShowTourSticker(true);

    const bestClip = highlights[selectedHighlightIndex] || highlights[0];
    const autoHook =
      bestClip?.hookText ||
      "El momento exacto en que la sala entera explotó 🤯🔥";
    setHighlights((prev) =>
      prev.map((clip, idx) =>
        idx === selectedHighlightIndex ? { ...clip, hookText: autoHook } : clip,
      ),
    );

    if (!tourStickerText || tourStickerText.includes("Gira")) {
      setTourStickerText(
        "🎟️ Gira 2026 · " + (bandName || "En Concierto") + " (Entradas en Bio)",
      );
    }

    setMagicAppliedNotification(true);
    setTimeout(() => setMagicAppliedNotification(false), 4000);
  };

  // 🎟️ Sincronizar con Conciertos de la Banda
  const handleSyncFromTourCRM = async () => {
    try {
      const res = await apiFetch<any>("/api/concerts");
      if (
        res?.success &&
        Array.isArray(res.concerts) &&
        res.concerts.length > 0
      ) {
        const proximo = res.concerts[0];
        setTourStickerText(
          "🎟️ " +
            (proximo.fecha || "Próx. Fecha") +
            " · " +
            (proximo.ciudad || "Directo") +
            " (" +
            (proximo.lugar || bandName) +
            ")",
        );
        setShowTourSticker(true);
      } else {
        setTourStickerText(
          "🎟️ Gira 2026 · " + bandName + " (Entradas en Link de Bio)",
        );
        setShowTourSticker(true);
      }
    } catch {
      setTourStickerText(
        "🎟️ Gira 2026 · " + bandName + " (Entradas en Link de Bio)",
      );
      setShowTourSticker(true);
    }
  };

  // Cargar cuentas vinculadas
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await apiFetch<any>("/api/social/accounts");
        if (res?.success && Array.isArray(res.accounts)) {
          setSocialAccounts(res.accounts);
        }
      } catch (err) {
        console.warn("No se pudieron cargar las cuentas sociales:", err);
      }
    };
    fetchAccounts();
  }, []);

  // Conectar cuenta social en 1 clic
  const handleConnectSocialAccount = async (
    platform: "Instagram" | "TikTok" | "YouTube",
  ) => {
    setConnectingPlatform(platform);
    try {
      const defaultHandle = `@${(bandName || "banda").toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
      const handleToUse = connectHandleInput.trim() || defaultHandle;
      const res = await apiFetch<any>("/api/social/accounts/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plataforma: platform,
          handle: handleToUse,
          account_name: `${bandName || "Banda"} Oficial`,
        }),
      });
      if (res?.success && res.account) {
        setSocialAccounts((prev) => [
          res.account,
          ...prev.filter((a) => a.plataforma !== platform),
        ]);
        setShowConnectModal(false);
        setConnectHandleInput("");
      }
    } catch (err: any) {
      console.error("Error conectando cuenta:", err);
      alert("No se pudo vincular la cuenta.");
    } finally {
      setConnectingPlatform(null);
    }
  };

  // Publicación inmediata 1-clic
  const handlePublishNowDirectly = async () => {
    setIsPublishingNow(true);
    setPublishNowSuccess(null);
    try {
      const newPostId = `post-${Date.now()}`;
      const activeAccount = socialAccounts.find(
        (a) => a.plataforma?.toLowerCase() === selectedPlatform.toLowerCase(),
      );
      const handleToUse =
        activeAccount?.handle ||
        `@${(bandName || "banda").toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;

      const newPost: SocialPost = {
        id: newPostId,
        fecha: scheduledDate,
        hora_programada: scheduledTime,
        plataforma: selectedPlatform,
        contenido: editedCopy,
        estado: "en_cola",
        responsable: "Banda",
        video_url: renderedClipUrl || youtubeUrl,
        media_type: "reel",
        auto_publish: true,
        account_handle: handleToUse,
      };

      await onAddPost(newPost);

      const res = await apiFetch<any>(`/api/social/publish-now/${newPostId}`, {
        method: "POST",
      });

      if (res?.success) {
        setPublishNowSuccess(
          `¡Publicado con éxito en ${selectedPlatform}! (${handleToUse}) 🎉`,
        );
        setTimeout(() => setPublishNowSuccess(null), 6000);
      } else {
        alert(res?.error || "Error al publicar.");
      }
    } catch (err: any) {
      console.error("Error en publicación directa:", err);
      alert("Error de conexión al despachar el Reel.");
    } finally {
      setIsPublishingNow(false);
    }
  };

  // Al escribir/pegar una URL de YouTube pedimos su ficha real (título, duración, canal,
  // si tiene subtítulos). Sin esto trabajábamos a ciegas y la línea de tiempo mentía.
  useEffect(() => {
    const videoId = getYouTubeId(youtubeUrl);
    if (inputType !== "youtube" || !videoId) {
      setVideoMeta(null);
      setMetaError(null);
      setIsFetchingMeta(false);
      return;
    }

    if (videoMeta && videoMeta.videoId === videoId) return;

    let cancelado = false;
    setIsFetchingMeta(true);
    setMetaError(null);

    const temporizador = setTimeout(async () => {
      try {
        const data = await apiFetch<any>(
          `/api/youtube-meta?url=${encodeURIComponent(youtubeUrl)}`,
        );
        if (cancelado) return;
        if (data?.success && data.meta) {
          setVideoMeta(data.meta as YoutubeVideoMeta);
          // Rellenamos el contexto con el título real en vez del texto genérico de relleno.
          setVideoTopic((prev) =>
            prev.trim() ? prev : data.meta.title || prev,
          );

          // Si este vídeo ya se analizó antes, recuperamos ese análisis en vez de dejar la
          // pantalla vacía hasta que el usuario pulse"Analizar" (y sin gastar otra llamada a
          // Gemini). Solo si no hay ya algo en pantalla: nunca se pisa un análisis en curso.
          try {
            const guardado = await apiFetch<any>(
              `/api/reel-analysis?youtubeUrl=${encodeURIComponent(youtubeUrl)}`,
            );
            if (!cancelado && guardado?.success && guardado.found) {
              setHighlights((prev) => {
                if (prev.length > 0) return prev;
                setSelectedHighlightIndex(0);
                setEditedCopy(
                  copyForPlatform(guardado.highlights?.[0], selectedPlatform),
                );
                setOptimalTime(guardado.optimalTime || null);
                setEnergyWindows(
                  Array.isArray(guardado.energyWindows)
                    ? guardado.energyWindows
                    : [],
                );
                setViralWindows(
                  Array.isArray(guardado.videoMeta?.viralWindows)
                    ? guardado.videoMeta.viralWindows
                    : [],
                );
                setDetectedContentType(guardado.videoMeta?.contentType || null);
                setLoadedFromSaveAt(
                  guardado.savedAt || new Date().toISOString(),
                );
                return guardado.highlights || [];
              });
            }
          } catch (err) {
            // Recuperar el análisis guardado es una comodidad: si falla, simplemente no aparece
            // y el flujo normal de"pegar URL y Analizar" sigue funcionando igual.
            console.warn("No se pudo recuperar un análisis guardado:", err);
          }
        } else {
          setMetaError(data?.error || "No se pudo leer la ficha del vídeo.");
        }
      } catch (err: any) {
        if (!cancelado)
          setMetaError(err?.message || "No se pudo leer la ficha del vídeo.");
      } finally {
        if (!cancelado) setIsFetchingMeta(false);
      }
    }, 600);

    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
    // videoMeta queda fuera a propósito: solo se relee cuando cambia la URL o el tipo de entrada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeUrl, inputType]);

  // Al salir del centro de Reels hay que soltar los blobs: sin esto, el vídeo local y el clip
  // renderizado se quedaban retenidos en memoria hasta recargar la página entera.
  const urlsVivas = React.useRef<{
    local: string | null;
    clip: string | null;
    subs: string | null;
  }>({
    local: null,
    clip: null,
    subs: null,
  });

  useEffect(() => {
    urlsVivas.current = {
      local: localVideoUrl,
      clip: renderedClipUrl,
      subs: renderedSubUrl,
    };
  }, [localVideoUrl, renderedClipUrl, renderedSubUrl]);

  useEffect(() => {
    return () => {
      for (const url of Object.values(urlsVivas.current)) {
        if (url && url.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(url);
          } catch (err) {
            /* ya revocado */
          }
        }
      }
    };
  }, []);

  /** Duración de referencia para la línea de tiempo: la real si la conocemos. */
  const timelineDuration = React.useMemo(() => {
    if (inputType === "file" && localVideoDuration > 0)
      return localVideoDuration;
    if (videoMeta?.durationKnown && videoMeta.duration > 0)
      return videoMeta.duration;
    const clip = highlights[selectedHighlightIndex];
    const { end } = parseRangeTimes(clip?.range);
    return Math.max(120, end + 30);
  }, [
    videoMeta,
    highlights,
    selectedHighlightIndex,
    inputType,
    localVideoDuration,
  ]);

  // Clip Re-analysis states
  const [clipUserNote, setClipUserNote] = useState<string>("");
  const [isReanalyzingClip, setIsReanalyzingClip] = useState<boolean>(false);
  const [reanalyzeSuccessMsg, setReanalyzeSuccessMsg] = useState<string | null>(
    null,
  );
  // Valorar el título/copy anterior con estrellas + decidir si la corrección se recuerda para
  // todos los próximos Reels de la banda o es solo un ajuste puntual de este corte.
  const [clipToneRating, setClipToneRating] = useState<number>(0);
  const [clipContentRating, setClipContentRating] = useState<number>(0);
  const [clipFeedbackScope, setClipFeedbackScope] = useState<
    "este_reel" | "global"
  >("este_reel");

  const handleReanalyzeClip = async () => {
    const activeClip = highlights[selectedHighlightIndex];
    if (!activeClip) return;

    setIsReanalyzingClip(true);
    setReanalyzeSuccessMsg(null);

    const { start, duration } = parseRangeTimes(activeClip.range);

    try {
      const response = await apiFetch("/api/reanalyze-clip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtubeUrl,
          fileName: selectedFile?.name,
          videoTitle: videoTopic || selectedFile?.name,
          start,
          duration,
          userNotes: clipUserNote,
          currentTitle: activeClip.title,
          currentCopy: activeClip.recommendedCopy,
          // Para que el highlight reanalizado se actualice también en lo que ya se guardó en BD,
          // no solo en la pantalla actual.
          highlightId: activeClip.id,
          videoKey:
            inputType === "file" ? videoKeyDeArchivo(selectedFile) : undefined,
          contentType:
            contentType !== "auto"
              ? contentType
              : detectedContentType || undefined,
          tonoRating: clipToneRating || undefined,
          contenidoRating: clipContentRating || undefined,
          alcance: clipFeedbackScope,
        }),
      });

      const data = response as any;
      if (data?.success && data.analysis) {
        const {
          title,
          reason,
          recommendedCopy,
          hashtags,
          energyLevel,
          confidence,
          hookText,
          copyTikTok,
          copyFacebook,
          cta,
        } = data.analysis;

        let clipActualizado: HighlightClip | null = null;
        setHighlights((prev) =>
          prev.map((clip, idx) => {
            if (idx === selectedHighlightIndex) {
              clipActualizado = {
                ...clip,
                title: title || clip.title,
                reason: reason || clip.reason,
                recommendedCopy: recommendedCopy || clip.recommendedCopy,
                hashtags: hashtags || clip.hashtags,
                energyLevel: energyLevel || clip.energyLevel,
                confidence: confidence || clip.confidence,
                hookText: hookText || clip.hookText,
                copyTikTok: copyTikTok || clip.copyTikTok,
                copyFacebook: copyFacebook || clip.copyFacebook,
                cta: cta || clip.cta,
              };
              return clipActualizado;
            }
            return clip;
          }),
        );

        if (clipActualizado) {
          setEditedCopy(copyForPlatform(clipActualizado, selectedPlatform));
        }

        const huboFeedback = Boolean(
          clipUserNote.trim() || clipToneRating || clipContentRating,
        );
        setReanalyzeSuccessMsg(
          data.generatedByAI === false
            ? "Fragmento actualizado (la IA no estaba disponible: se ha usado una plantilla con tus notas)."
            : huboFeedback && clipFeedbackScope === "global"
              ? "¡Análisis refinado! Este ajuste se recordará también en tus próximos Reels."
              : "¡Análisis del fragmento refinado con éxito!",
        );
        setTimeout(() => setReanalyzeSuccessMsg(null), 5000);
        // Se resetea la valoración tras usarla: es feedback sobre ESA versión, no debe arrastrarse
        // a la siguiente regeneración como si aplicara también a ella.
        setClipToneRating(0);
        setClipContentRating(0);
      } else {
        alert(data?.error || "No se pudo reanalizar el fragmento.");
      }
    } catch (err) {
      console.error("Error reanalyzing clip:", err);
      alert("Hubo un problema al conectar con el servidor para el reanálisis.");
    } finally {
      setIsReanalyzingClip(false);
    }
  };

  const handleCutPhysicalVideo = async () => {
    const activeClip = highlights[selectedHighlightIndex];
    if (!activeClip || !youtubeUrl) return;

    setIsCuttingVideo(true);
    setCuttingError(null);
    setCuttingProgressText("Conectando con el servidor...");
    setWordOffsets([]);
    setIsWhisperTranscribed(false);
    setSinTranscripcionReal(false);

    const { start, duration } = parseRangeTimes(activeClip.range);
    const clipId = `reel-${selectedHighlightIndex}-${Date.now()}`;

    const progressSteps = [
      "Descargando el vídeo de YouTube...",
      "Extrayendo la mejor pista de vídeo y audio disponible...",
      "Preparando ffmpeg...",
      `Recortando de ${formatTime(start)} a ${formatTime(start + duration)}...`,
      cropMode === "blur"
        ? "Componiendo fondo desenfocado en 9:16 (no se recorta a nadie)..."
        : cropMode === "crop"
          ? "Aplicando encuadre vertical 9:16..."
          : "Manteniendo el encuadre original...",
      "Buscando la transcripción de YouTube para los subtítulos...",
      burnSubtitles
        ? "Incrustando los subtítulos en la imagen..."
        : "Generando la pista de subtítulos (.vtt)...",
      "Codificando el MP4 final...",
      "Últimos ajustes...",
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < progressSteps.length - 1) {
        currentStep++;
        setCuttingProgressText(progressSteps[currentStep]);
      }
    }, 2500);

    try {
      const res = await apiFetch("/api/cut-video-clip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtubeUrl,
          start,
          duration,
          clipId,
          cropMode,
          burnSubtitles,
          karaokeSubtitles,
          // Flag antiguo, por si el servidor todavía no está actualizado.
          cropVertical: cropMode !== "none",
        }),
      });

      clearInterval(interval);

      // apiFetch ya devuelve el JSON parseado, no una Response: llamar a res.json() aquí
      // reventaba con"res.json is not a function" y res.ok era siempre undefined.
      const data = res as any;
      if (!data?.success) {
        throw new Error(data?.error || "Error al codificar el clip de vídeo.");
      }

      // Los blobs anteriores dejan de hacer falta en cuanto llega un clip nuevo.
      if (renderedClipUrl && renderedClipUrl.startsWith("blob:")) {
        URL.revokeObjectURL(renderedClipUrl);
      }
      if (renderedSubUrl && renderedSubUrl.startsWith("blob:")) {
        URL.revokeObjectURL(renderedSubUrl);
      }

      // El servidor sirve ahora el clip como archivo estático. El base64 se mantiene como
      // respaldo: metía 30 MB dentro de un JSON y reventaba el límite del body.
      let nuevaUrl: string | null = null;
      if (data.clipUrl) {
        nuevaUrl = String(data.clipUrl);
      } else if (data.videoBase64) {
        const parts = String(data.videoBase64).split(",");
        const mimeString = parts[0].split(":")[1].split(";")[0];
        const byteString = atob(parts[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        nuevaUrl = URL.createObjectURL(new Blob([ab], { type: mimeString }));
      }

      if (!nuevaUrl) {
        throw new Error("El servidor no devolvió ningún clip renderizado.");
      }
      setRenderedClipUrl(nuevaUrl);
      setRenderedClipSize(Number(data.fileSize) || 0);
      setRenderedBurnedSubs(Boolean(data.burnedSubtitles));
      setRenderedStoredPermanently(Boolean(data.storedPermanently));

      if (data.vttContent) {
        const vttBlob = new Blob([data.vttContent], { type: "text/vtt" });
        setRenderedSubUrl(URL.createObjectURL(vttBlob));
      } else {
        setRenderedSubUrl(null);
      }

      setSubtitleCues(data.subtitles || []);
      setWordOffsets(data.words || []);
      setSinTranscripcionReal(Boolean(data.sinTranscripcionReal));
      setIsWhisperTranscribed(false);
      setCuttingProgressText("¡Clip renderizado y listo para descargar!");
    } catch (err: any) {
      clearInterval(interval);
      setCuttingError(err?.message || "Error al renderizar el clip.");
    } finally {
      setIsCuttingVideo(false);
    }
  };

  // Global drag handler for timeline dragging
  useEffect(() => {
    if (!draggingBoundary) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const container = document.getElementById(
        "interactive-timeline-container",
      );
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickPct = Math.max(0, Math.min(1, clickX / rect.width));

      const currentClip = highlights[selectedHighlightIndex];
      if (!currentClip) return;
      const { start, end } = parseRangeTimes(currentClip.range);
      const totalDuration = timelineDuration;
      const targetSeconds = Math.round(clickPct * totalDuration);

      let newStart = start;
      let newEnd = end;

      if (draggingBoundary === "start") {
        newStart = Math.max(0, Math.min(targetSeconds, end - 1));
      } else if (draggingBoundary === "end") {
        // No dejamos arrastrar más allá del final real del vídeo: un rango imposible
        // llegaba a ffmpeg y devolvía un recorte vacío.
        newEnd = Math.min(totalDuration, Math.max(targetSeconds, start + 1));
      }

      const formatSecsToMMSS = (totalSecs: number) => {
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      };

      const newRange = `${formatSecsToMMSS(newStart)}-${formatSecsToMMSS(newEnd)}`;
      setHighlights((prev) =>
        prev.map((clip, idx) =>
          idx === selectedHighlightIndex ? { ...clip, range: newRange } : clip,
        ),
      );
    };

    const handleGlobalMouseUp = () => {
      setDraggingBoundary(null);
      setSimulatedTime(0);
      setYtLoopCount((c) => c + 1);
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);

    const handleGlobalTouchMove = (e: TouchEvent) => {
      const container = document.getElementById(
        "interactive-timeline-container",
      );
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const touch = e.touches[0];
      if (!touch) return;
      const clickX = touch.clientX - rect.left;
      const clickPct = Math.max(0, Math.min(1, clickX / rect.width));

      const currentClip = highlights[selectedHighlightIndex];
      if (!currentClip) return;
      const { start, end } = parseRangeTimes(currentClip.range);
      const totalDuration = timelineDuration;
      const targetSeconds = Math.round(clickPct * totalDuration);

      let newStart = start;
      let newEnd = end;

      if (draggingBoundary === "start") {
        newStart = Math.max(0, Math.min(targetSeconds, end - 1));
      } else if (draggingBoundary === "end") {
        // No dejamos arrastrar más allá del final real del vídeo: un rango imposible
        // llegaba a ffmpeg y devolvía un recorte vacío.
        newEnd = Math.min(totalDuration, Math.max(targetSeconds, start + 1));
      }

      const formatSecsToMMSS = (totalSecs: number) => {
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      };

      const newRange = `${formatSecsToMMSS(newStart)}-${formatSecsToMMSS(newEnd)}`;
      setHighlights((prev) =>
        prev.map((clip, idx) =>
          idx === selectedHighlightIndex ? { ...clip, range: newRange } : clip,
        ),
      );
    };

    const handleGlobalTouchEnd = () => {
      setDraggingBoundary(null);
      setSimulatedTime(0);
      setYtLoopCount((c) => c + 1);
    };

    window.addEventListener("touchmove", handleGlobalTouchMove, {
      passive: true,
    });
    window.addEventListener("touchend", handleGlobalTouchEnd);

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("touchmove", handleGlobalTouchMove);
      window.removeEventListener("touchend", handleGlobalTouchEnd);
    };
  }, [draggingBoundary, highlights, selectedHighlightIndex, timelineDuration]);

  // Simulated playback time for highlight looping
  useEffect(() => {
    let interval: any = null;
    const currentClip = highlights[selectedHighlightIndex];
    if (currentClip && activeTab === "analyzer") {
      const { duration } = parseRangeTimes(currentClip.range);
      setSimulatedTime(0);
      setYtLoopCount(0);
      if (duration > 0) {
        interval = setInterval(() => {
          setSimulatedTime((prev) => {
            if (prev >= duration - 1) {
              setYtLoopCount((c) => c + 1);
              return 0; // loop back to 0
            }
            return prev + 1;
          });
        }, 1000);
      }
    } else {
      setSimulatedTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedHighlightIndex, highlights, activeTab]);

  // Close expanded preview modal when Escape is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpandedPreview) {
        setIsExpandedPreview(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpandedPreview]);

  // Form values for Scheduling
  const [editedCopy, setEditedCopy] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<
    "Instagram" | "TikTok" | "YouTube" | "Facebook"
  >("Instagram");
  const [scheduledDate, setScheduledDate] = useState(() =>
    defaultScheduleDate(1),
  );
  const [scheduledTime, setScheduledTime] = useState("20:30");
  const [isScheduling, setIsScheduling] = useState(false);
  const [schedulingSuccess, setSchedulingSuccess] = useState(false);
  // Antes solo se comprobaba que el copy no estuviera vacío, y en silencio: el botón no hacía
  // nada y no se explicaba por qué. Ahora se avisa de qué falta (hashtag, fecha pasada...).
  const [scheduleErrors, setScheduleErrors] = useState<string[]>([]);
  // Avisos de cadencia (no bloquean programar, son sobre estrategia: dos posts pegados en la
  // misma red, o un hueco largo sin publicar nada).
  const [scheduleWarnings, setScheduleWarnings] = useState<string[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);

  // Metrics Form States
  const [metricDate, setMetricDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [metricInsta, setMetricInsta] = useState("");
  const [metricTiktok, setMetricTiktok] = useState("");
  const [metricYoutube, setMetricYoutube] = useState("");
  const [metricNotes, setMetricNotes] = useState("");
  const [editingMetricId, setEditingMetricId] = useState<string | null>(null);
  const [isSavingMetric, setIsSavingMetric] = useState(false);
  const [metricSuccess, setMetricSuccess] = useState("");
  const [isSyncingMetrics, setIsSyncingMetrics] = useState(false);
  const [isScanningMetrics, setIsScanningMetrics] = useState(false);
  // Vídeos reales que devuelve el escaneo de métricas. Arrancaba con cuatro vídeos
  // inventados de Bakandeya (todos apuntando al mismo enlace de relleno), que en cualquier
  // otra banda eran datos falsos de un grupo ajeno.
  const [realVideos, setRealVideos] = useState<any[]>([]);

  const handleSaveMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metricInsta || !metricTiktok || !metricYoutube) {
      alert("Por favor rellena todos los campos de seguidores.");
      return;
    }

    setIsSavingMetric(true);
    setMetricSuccess("");

    try {
      if (editingMetricId) {
        if (onUpdateMetric) {
          await onUpdateMetric(editingMetricId, {
            fecha: metricDate,
            instagram: parseInt(metricInsta),
            tiktok: parseInt(metricTiktok),
            youtube: parseInt(metricYoutube),
            notas: metricNotes,
          });
          setMetricSuccess("✓ Registro actualizado correctamente.");
        }
      } else {
        if (onAddMetric) {
          const newId = `metric-${Date.now()}`;
          await onAddMetric({
            id: newId,
            fecha: metricDate,
            instagram: parseInt(metricInsta),
            tiktok: parseInt(metricTiktok),
            youtube: parseInt(metricYoutube),
            notas: metricNotes,
          });
          setMetricSuccess("✓ Nuevo checkpoint registrado correctamente.");
        }
      }

      // Reset form
      setMetricDate(new Date().toISOString().split("T")[0]);
      setMetricInsta("");
      setMetricTiktok("");
      setMetricYoutube("");
      setMetricNotes("");
      setEditingMetricId(null);
      setTimeout(() => setMetricSuccess(""), 4000);
    } catch (error) {
      console.error("Error saving metric:", error);
    } finally {
      setIsSavingMetric(false);
    }
  };

  const handleEditMetricClick = (m: SocialMetric) => {
    setEditingMetricId(m.id);
    setMetricDate(m.fecha);
    setMetricInsta(String(m.instagram));
    setMetricTiktok(String(m.tiktok));
    setMetricYoutube(String(m.youtube));
    setMetricNotes(m.notas);
  };

  const handleCancelEditMetric = () => {
    setEditingMetricId(null);
    setMetricDate(new Date().toISOString().split("T")[0]);
    setMetricInsta("");
    setMetricTiktok("");
    setMetricYoutube("");
    setMetricNotes("");
  };

  const handleSyncMetricsTab = async () => {
    setIsSyncingMetrics(true);
    setMetricSuccess("");
    try {
      const res = await fetch("/api/metrics/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMetricSuccess("✓ Sincronizado con éxito.");
        setTimeout(() => setMetricSuccess(""), 4000);
      } else {
        alert(data.error || "Error al sincronizar seguidores.");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión.");
    } finally {
      setIsSyncingMetrics(false);
    }
  };

  const handleScanRealMetrics = async () => {
    setIsScanningMetrics(true);
    setMetricSuccess("");
    try {
      const resData = await apiFetch<any>("/api/metrics/real", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (resData && resData.success) {
        const { data, metric } = resData;
        if (data) {
          setMetricInsta(data.instagramFollowers?.toString() || "0");
          setMetricTiktok(data.tiktokFollowers?.toString() || "0");
          setMetricYoutube(data.youtubeSubscribers?.toString() || "0");
          setMetricNotes(`Radar Scan. Spotify: ${data.spotifyListeners || 0}`);
          if (data.videos && data.videos.length > 0) {
            setRealVideos(data.videos);
          }
        }

        if (onAddMetric && metric) {
          await onAddMetric(metric);
        }

        setMetricSuccess(
          `✓ Sincronización en directo realizada desde perfiles oficiales (IG: ${data?.instagramFollowers ?? 0}, TK: ${data?.tiktokFollowers ?? 0}, YT: ${data?.youtubeSubscribers ?? 0}, Spotify: ${data?.spotifyListeners ?? 0}).`,
        );
        setTimeout(() => setMetricSuccess(""), 6000);
      } else {
        alert(resData?.error || "Error al escanear datos reales.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Error de conexión al escanear redes reales.");
    } finally {
      setIsScanningMetrics(false);
    }
  };

  // Pasos reales del backend. Los de antes describían un análisis espectral y un modelo de
  // BPM que no existen en ningún sitio del código.
  const getLoadingSteps = () => {
    const firstStep =
      inputType === "youtube"
        ? "Leyendo la ficha del vídeo de YouTube..."
        : "Preparando el metraje subido...";
    return [
      firstStep,
      "Descargando la transcripción con marcas de tiempo (si la hay)...",
      "Midiendo el volumen del audio para localizar los subidones...",
      "Enviando el contexto real de tu banda al modelo...",
      `Buscando los mejores fragmentos de ~${videoDuration} s...`,
      "Redactando copys, hooks y hashtags...",
    ];
  };

  // Drag & Drop helper
  /**
   * Cambia el vídeo local revocando antes el blob anterior. Elegir otro archivo sin pasar por
   * el botón de"eliminar" dejaba el vídeo previo entero retenido en memoria por su object URL.
   */
  const cambiarVideoLocal = (file: File | null) => {
    setLocalVideoUrl((prev) => {
      if (prev && prev.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(prev);
        } catch (err) {
          /* ya revocado */
        }
      }
      if (!file) return null;
      try {
        return URL.createObjectURL(file);
      } catch (err) {
        console.error("Error creating Object URL for video:", err);
        return null;
      }
    });
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile({
        name: file.name,
        size: file.size,
      });
      setLocalVideoDuration(0);
      cambiarVideoLocal(file);
      // Try to auto-extract context from file name
      const cleanName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/_/g, " ")
        .replace(/-/g, " ");
      setVideoTopic(cleanName);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile({
        name: file.name,
        size: file.size,
      });
      setLocalVideoDuration(0);
      cambiarVideoLocal(file);
      const cleanName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/_/g, " ")
        .replace(/-/g, " ");
      setVideoTopic(cleanName);
    }
  };

  // Trigger Highlight Extraction via backend API
  const handleAnalyzeVideo = async () => {
    if (inputType === "file" && !selectedFile) return;
    if (inputType === "youtube" && !youtubeUrl) return;

    // Reset physical clip and subtitle state for the new video
    setRenderedClipUrl(null);
    setRenderedClipSize(0);
    setRenderedBurnedSubs(false);
    setRenderedStoredPermanently(false);
    setRenderedSubUrl(null);
    setSubtitleCues([]);
    setWordOffsets([]);
    setIsWhisperTranscribed(false);
    setCurrentSubtitleText("");
    setCuttingError(null);

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisNotice(null);
    setEnergyWindows([]);
    setViralWindows([]);
    // Un análisis pedido a propósito siempre es fresco, así que no arrastramos el aviso de
    //"esto es lo que había guardado" de una vez anterior.
    setLoadedFromSaveAt(null);
    setLoadingStep(0);
    // El tipo detectado se pisa con el que devuelva este análisis nuevo; hasta entonces no
    // mostramos el de un vídeo anterior.
    setDetectedContentType(null);

    const steps = getLoadingSteps();

    // Simulate stepping for user feedback
    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, 1500);

    try {
      const targetYtUrl =
        inputType === "youtube" ? youtubeUrl : youtubeUrl || undefined;
      const res = await apiFetch("/api/analyze-video-highlights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: inputType === "file" ? selectedFile?.name : undefined,
          youtubeUrl: targetYtUrl,
          // targetDuration = cuánto debe durar cada clip; knownDuration = cuánto dura el vídeo.
          // Antes ambas cosas viajaban en el mismo campo y la IA recibía"el vídeo dura 30 s".
          targetDuration: videoDuration,
          knownDuration:
            inputType === "file"
              ? localVideoDuration > 0
                ? localVideoDuration
                : undefined
              : videoMeta?.durationKnown
                ? videoMeta.duration
                : undefined,
          // Sin esto, un vídeo subido como archivo nunca se podía guardar ni recuperar: el
          // servidor nunca ve el archivo en sí, así que necesita esta clave para reconocerlo.
          videoKey:
            inputType === "file" ? videoKeyDeArchivo(selectedFile) : undefined,
          contentType: contentType !== "auto" ? contentType : undefined,
          videoDuration: videoDuration,
          videoTopic: videoTopic || undefined,
        }),
      });

      clearInterval(stepInterval);

      // apiFetch resuelve ya con el JSON parseado (o lanza si la respuesta no fue 2xx),
      // así que aquí no hay ninguna Response sobre la que llamar a .json().
      const data = res as any;

      if (!data?.success) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Error al procesar el vídeo en el servidor. Revisa tu sesión o inténtalo de nuevo.",
        );
      }

      setHighlights(data.highlights || []);
      setOptimalTime(data.optimalTime || null);
      setSelectedHighlightIndex(0);
      setAnalysisNotice(data.notice || null);
      setEnergyWindows(
        Array.isArray(data.energyWindows) ? data.energyWindows : [],
      );
      setViralWindows(
        Array.isArray(data.viralWindows) ? data.viralWindows : [],
      );
      setDetectedContentType(data.contentType || null);
      if (data.videoMeta && data.videoMeta.videoId) {
        setVideoMeta(data.videoMeta as YoutubeVideoMeta);
      }

      // Initialize editing form fields
      if (data.highlights && data.highlights.length > 0) {
        setEditedCopy(
          copyForPlatform(data.highlights[0], selectedPlatform) ||
            data.highlights[0].copy ||
            "",
        );
      }
      if (data.optimalTime) {
        setScheduledDate(data.optimalTime.date || "2026-07-30");
        setScheduledTime(data.optimalTime.time || "20:30");
      }
    } catch (err: any) {
      clearInterval(stepInterval);
      setAnalysisError(err.message || "Error de conexión con la IA.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Submit and Schedule Post
  const handleSchedulePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const problemas = validateScheduleReadiness({
      copy: editedCopy,
      scheduledDate,
      scheduledTime,
    });
    setScheduleErrors(problemas);
    // La cadencia es un aviso, no un bloqueo: se calcula igualmente para enseñarlo junto al post ya programado.
    setScheduleWarnings(
      getCadenceWarnings({
        posts,
        platform: selectedPlatform,
        scheduledDate,
        scheduledTime,
      }),
    );
    if (problemas.length > 0) return;

    setIsScheduling(true);
    setSchedulingSuccess(false);

    try {
      const activeAccount = socialAccounts.find(
        (a) => a.plataforma?.toLowerCase() === selectedPlatform.toLowerCase(),
      );
      const handleToUse =
        activeAccount?.handle ||
        instagramHandle ||
        `@${(bandName || "banda").toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;

      const newPost: SocialPost = {
        id: `post-${Date.now()}`,
        fecha: scheduledDate,
        hora_programada: scheduledTime,
        plataforma: selectedPlatform,
        contenido: editedCopy,
        estado: "aprobado",
        responsable: "Banda",
        video_url: renderedClipUrl || youtubeUrl,
        media_type: "reel",
        auto_publish: autoPublishEnabled,
        account_handle: handleToUse,
      };

      await onAddPost(newPost);
      setSchedulingSuccess(true);
      setScheduleErrors([]);

      // Auto-clear success state after a few seconds
      setTimeout(() => {
        setSchedulingSuccess(false);
      }, 5000);
    } catch (err) {
      console.error("Error al programar publicación:", err);
      alert("Hubo un error al guardar la publicación en el servidor local.");
    } finally {
      setIsScheduling(false);
    }
  };

  // Change active highlight in lighttable
  const handleSelectHighlight = (index: number) => {
    setSelectedHighlightIndex(index);
    // Reset physical cutting states when switching segments
    setRenderedClipUrl(null);
    setRenderedClipSize(0);
    setRenderedBurnedSubs(false);
    setRenderedStoredPermanently(false);
    setRenderedSubUrl(null);
    setSubtitleCues([]);
    setWordOffsets([]);
    setIsWhisperTranscribed(false);
    setCurrentSubtitleText("");
    setCuttingError(null);
    setClipUserNote("");
    setReanalyzeSuccessMsg(null);

    const clip = highlights[index];
    if (clip) {
      if (copyObjective === "viral" && clip.copyViral) {
        setEditedCopy(clip.copyViral);
      } else if (copyObjective === "comunidad" && clip.copyComunidad) {
        setEditedCopy(clip.copyComunidad);
      } else if (copyObjective === "conversion" && clip.copyConversion) {
        setEditedCopy(clip.copyConversion);
      } else {
        setEditedCopy(copyForPlatform(clip, selectedPlatform));
      }
    }
  };

  const handleSwitchCopyObjective = (
    obj: "viral" | "comunidad" | "conversion",
  ) => {
    setCopyObjective(obj);
    const clip = highlights[selectedHighlightIndex];
    if (!clip) return;
    if (obj === "viral") {
      setEditedCopy(clip.copyViral || clip.recommendedCopy || "");
    } else if (obj === "comunidad") {
      setEditedCopy(clip.copyComunidad || clip.recommendedCopy || "");
    } else if (obj === "conversion") {
      setEditedCopy(clip.copyConversion || clip.recommendedCopy || "");
    }
  };

  const handleCopyFormattedPost = () => {
    const clip = highlights[selectedHighlightIndex];
    if (!clip) return;

    const hook = clip.hookText
      ? `🎯 [GANCHO EN PANTALLA: "${clip.hookText}"]\n\n`
      : "";
    const copyText = editedCopy.trim();
    const ctaText = clip.cta ? `\n\n👉 ${clip.cta}` : "";
    const tagsText =
      clip.hashtags && clip.hashtags.length > 0
        ? `\n\n${clip.hashtags.map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ")}`
        : "";

    const fullFormatted = `${hook}${copyText}${ctaText}${tagsText}`;

    navigator.clipboard
      .writeText(fullFormatted)
      .then(() => {
        setCopiedNotification(true);
        setTimeout(() => setCopiedNotification(false), 2500);
      })
      .catch((err) => {
        console.error("Error al copiar post formateado:", err);
      });
  };

  // Selector de gancho predefinido del Arsenal
  const handleSelectHookPreset = (hook: string) => {
    setHighlights((prev) =>
      prev.map((clip, idx) =>
        idx === selectedHighlightIndex ? { ...clip, hookText: hook } : clip,
      ),
    );
    setShowHookArsenal(false);
  };

  // Captura instantánea de fotograma / miniatura para la portada
  const handleCaptureThumbnail = () => {
    const clip = highlights[selectedHighlightIndex];
    const bName = (bandName || "banda")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    const clipName = clip?.title
      ? clip.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .slice(0, 20)
      : `clip-${selectedHighlightIndex + 1}`;

    const video = document.querySelector("video") as HTMLVideoElement | null;
    if (video && video.videoWidth > 0) {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
          const a = document.createElement("a");
          a.href = dataUrl;
          a.download = `portada_reel_${bName}_${clipName}.jpg`;
          a.click();
          setThumbnailCapturedSuccess(true);
          setTimeout(() => setThumbnailCapturedSuccess(false), 2500);
          return;
        }
      } catch (e) {
        console.warn("No se pudo capturar canvas directo:", e);
      }
    }

    const ytid = getYouTubeId(youtubeUrl);
    if (ytid) {
      const highResThumb = `https://img.youtube.com/vi/${ytid}/maxresdefault.jpg`;
      const a = document.createElement("a");
      a.href = highResThumb;
      a.target = "_blank";
      a.download = `portada_reel_${bName}_${clipName}.jpg`;
      a.click();
      setThumbnailCapturedSuccess(true);
      setTimeout(() => setThumbnailCapturedSuccess(false), 2500);
    }
  };

  // Descarga del Pack Completo en 1-Click (Video + Subtítulos + Copy TXT + Portada)
  const handleDownloadCompletePack = () => {
    const clip = highlights[selectedHighlightIndex];
    if (!clip) return;

    const bName = (bandName || "banda")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    const clipName = clip.title
      ? clip.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .slice(0, 25)
      : `clip-${selectedHighlightIndex + 1}`;

    // 1. Descargar Ficha de Publicación TXT
    const hookText = clip.hookText
      ? `🎯 GANCHO VISUAL EN PANTALLA (0-3s):\n"${clip.hookText}"\n\n`
      : "";
    const copyText = `📝 TEXTO PARA EL POST (${selectedPlatform.toUpperCase()}):\n${editedCopy.trim()}\n\n`;
    const ctaText = clip.cta ? `👉 LLAMADA A LA ACCIÓN:\n${clip.cta}\n\n` : "";
    const tagsText =
      clip.hashtags && clip.hashtags.length > 0
        ? `🏷️ HASHTAGS:\n${clip.hashtags.map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ")}\n\n`
        : "";
    const horaOptima = optimalTime
      ? `⏰ MEJOR HORA RECOMENDADA PARA PUBLICAR:\n${optimalTime.time} (${optimalTime.reason})\n\n`
      : "";
    const metaInfo = `🎵 ARTISTA: ${nombreBanda}\n🎬 RECORTE: ${clip.range || "0:00-0:30"} (${clip.duration || 30}s)\n⚡ OBJETIVO: ${copyObjective.toUpperCase()}\n`;

    const txtContent = `${hookText}${copyText}${ctaText}${tagsText}${horaOptima}${metaInfo}`;
    const blobTxt = new Blob([txtContent], {
      type: "text/plain;charset=utf-8",
    });
    const urlTxt = URL.createObjectURL(blobTxt);
    const aTxt = document.createElement("a");
    aTxt.href = urlTxt;
    aTxt.download = `post_${selectedPlatform.toLowerCase()}_${bName}_${clipName}.txt`;
    aTxt.click();
    URL.revokeObjectURL(urlTxt);

    // 2. Descargar Subtítulos VTT si están disponibles
    if (renderedSubUrl) {
      const aSub = document.createElement("a");
      aSub.href = renderedSubUrl;
      aSub.download = `subtitulos_${bName}_${clipName}.vtt`;
      aSub.click();
    } else if (subtitleCues.length > 0) {
      let vttContent = "WEBVTT\n\n";
      subtitleCues.forEach((c, idx) => {
        vttContent += `${idx + 1}\n${formatTime(c.start)}.000 --> ${formatTime(c.end)}.000\n${c.text}\n\n`;
      });
      const blobVtt = new Blob([vttContent], {
        type: "text/vtt;charset=utf-8",
      });
      const urlVtt = URL.createObjectURL(blobVtt);
      const aVtt = document.createElement("a");
      aVtt.href = urlVtt;
      aVtt.download = `subtitulos_${bName}_${clipName}.vtt`;
      aVtt.click();
      URL.revokeObjectURL(urlVtt);
    }

    // 3. Descargar Vídeo MP4 si ya está renderizado
    if (renderedClipUrl) {
      const aVid = document.createElement("a");
      aVid.href = renderedClipUrl;
      aVid.download = `video_reel_${bName}_${clipName}.mp4`;
      aVid.click();
    }

    // 4. Capturar miniatura
    handleCaptureThumbnail();

    setPackDownloadedSuccess(true);
    setTimeout(() => setPackDownloadedSuccess(false), 3500);
  };

  // Copy text to clipboard helper
  const handleCopyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch((err) => {
        console.error("Error copying to clipboard:", err);
      });
  };

  // Crop edit adjustments (Extending or trimming from left or right)
  const handleAdjustCrop = (
    direction: "start_minus" | "start_plus" | "end_minus" | "end_plus",
  ) => {
    const currentClip = highlights[selectedHighlightIndex];
    if (!currentClip) return;

    const { start, end } = parseRangeTimes(currentClip.range);
    let newStart = start;
    let newEnd = end;

    if (direction === "start_minus") {
      newStart = Math.max(0, start - 1);
    } else if (direction === "start_plus") {
      newStart = Math.min(end - 1, start + 1);
    } else if (direction === "end_minus") {
      newEnd = Math.max(start + 1, end - 1);
    } else if (direction === "end_plus") {
      newEnd = end + 1;
    }

    const formatSecsToMMSS = (totalSecs: number) => {
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const newRange = `${formatSecsToMMSS(newStart)}-${formatSecsToMMSS(newEnd)}`;

    // Update state
    setHighlights((prev) =>
      prev.map((clip, index) =>
        index === selectedHighlightIndex ? { ...clip, range: newRange } : clip,
      ),
    );
    setSimulatedTime(0); // reset playback timer to restart from new crop
    setYtLoopCount((c) => c + 1); // trigger iframe refresh
  };

  // Move existing pipeline reels
  const moveReel = (id: string, newStage: "draft" | "edit" | "ready") => {
    onUpdatePost(id, {
      estado:
        newStage === "ready"
          ? "publicado"
          : newStage === "edit"
            ? "aprobado"
            : "borrador",
    });
  };

  const handleGenerateCopy = async (style: "hype" | "chill") => {
    setIsGenerating(true);
    try {
      const response = await apiFetch("/api/write-reels-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: reelIdea, style }),
      });
      const data = response as any;
      if (data?.success && data.text) {
        setGeneratedCopy(data.text);
      } else {
        alert(
          "Hubo un problema al generar el texto. Mostrando plantilla de respaldo.",
        );
      }
    } catch (err) {
      console.error(err);
      if (style === "hype") {
        setGeneratedCopy(
          `⚡️ ¡FUEGO EN EL ESCENARIO! 🔥\n\n${nombreBanda} no tiene freno: ${reelIdea}. ¡Prepárate para sudar la camiseta! 🔥🎸\n\n#MusicaEnDirecto #Directo`,
        );
      } else {
        setGeneratedCopy(
          `🌊 Respirando hondo, dejando fluir el ritmo... 🍀\n\n${nombreBanda} conectando ideas en el local: ${reelIdea}. Buenas energías para el camino. ✨\n\n#MusicaEnDirecto #Local`,
        );
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSimulateUpload = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return null;
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setUploadProgress(null), 1500);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  // Select dynamic display text for phone screen mock
  const phoneText = selectedPostInPhone
    ? selectedPostInPhone.contenido
    : activeTab === "analyzer" && highlights.length > 0
      ? editedCopy
      : generatedCopy;

  const phoneTitle = selectedPostInPhone
    ? `${selectedPostInPhone.plataforma} · ${selectedPostInPhone.responsable}`
    : activeTab === "analyzer" && highlights.length > 0
      ? highlights[selectedHighlightIndex]?.title || `Reel de ${nombreBanda}`
      : `Reels de ${nombreBanda}`;

  const phoneDuration = selectedPostInPhone
    ? selectedPostInPhone.fecha
    : activeTab === "analyzer" && highlights.length > 0
      ? highlights[selectedHighlightIndex]?.range || "0:30"
      : "0:30";

  const textTitle = "text-[var(--ink)]";
  const textSub = "text-[var(--ink-2)]";
  const textMuted = "text-[var(--ink-2)]";

  return (
    <div
      data-modulo="reels"
      className={`space-y-6 text-[var(--ink)] font-sans w-full max-w-full overflow-x-hidden`}
    >
      {/* Header con Sincronización en Excel */}
      <div
        className={`flex justify-between items-start md:items-center pb-4 mb-2 gap-4 `}
      >
        {/* HEADER / TITULO PRINCIPAL */}
        <div className="mb-2">
          <h1 className="page-title mb-1">
            Medios
          </h1>
          <p className="text-sm font-sans text-[var(--ink-2)]">
            Analítica social y prensa
          </p>
        </div>
        <div className="flex gap-2.5 items-center flex-wrap">
          <button
            onClick={handleOpenToneModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-pill)] text-micro font-sans font-bold bg-[var(--acc)]/15 hover:bg-[var(--acc)]/25 text-[var(--acc-ink)] transition-ui cursor-pointer"
            title={`Ver el tono de voz guardado de ${instagramHandle || nombreBanda}, o analizarlo si todavía no existe`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--acc)]" />
            <span>Tono de voz en redes</span>
          </button>

          <button
            id="sync-reels-excel-btn"
            onClick={handleSyncReels}
            disabled={isSyncingReels}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-pill)] text-micro font-sans font-bold transition-ui cursor-pointer active:scale-[0.97] ${
              isSyncingReels
                ? "bg-[var(--surface)]/80 text-[var(--ink-2)]"
                : "bg-[var(--acc)]/10 hover:bg-[var(--acc)]/20 text-[var(--acc-ink)] "
            }`}
            title="Sincronizar todas las publicaciones de redes sociales"
          >
            <RefreshCw
              className={`w-3 h-3 ${isSyncingReels ? "animate-spin" : ""}`}
            />
            {isSyncingReels ? "Sincronizando..." : "Actualizar en Excel"}
          </button>

          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-micro font-sans font-bold bg-[var(--ok)]/10 text-[var(--ok)]`}
          >
            <span className="w-1.5 h-1.5 rounded-[var(--r-pill)] bg-[var(--ok)] animate-ping shrink-0" />{" "}
            Auto-sync
          </span>
        </div>
      </div>

      {/* Notificaciones de Sincronización */}
      {syncSuccessMessage && (
        <div
          className={`p-2 px-3 rounded-[var(--r-s)] text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-250 bg-[var(--ok)]/10 text-[var(--ok)]`}
        >
          <CheckCircle2 className="w-4 h-4 text-[var(--ok)] shrink-0" />
          <span className="flex-1 font-sans text-micro">
            {syncSuccessMessage}
          </span>
          <button
            onClick={() => setSyncSuccessMessage("")}
            className="text-micro hover:opacity-80 font-bold px-1 font-sans"
          >
            ×
          </button>
        </div>
      )}
      {syncErrorMessage && (
        <div
          className={`p-2 px-3 rounded-[var(--r-s)] text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-250 bg-[var(--alert)]/10 text-[var(--alert)]`}
        >
          <AlertCircle className="w-4 h-4 text-[var(--alert)] shrink-0" />
          <span className="flex-1 font-sans text-micro">
            {syncErrorMessage}
          </span>
          <button
            onClick={() => setSyncErrorMessage("")}
            className="text-micro hover:opacity-80 font-bold px-1 font-sans"
          >
            ×
          </button>
        </div>
      )}

      {/* Dynamic Segment Tab Selector */}
      <div className={`flex pb-4 mb-2 flex-wrap gap-3 `}>
        <button
          id="tab-btn-pipeline"
          onClick={() => setActiveTab("pipeline")}
          className={`px-5 py-2.5 font-sans text-micro transition-ui duration-300 rounded-[var(--r-pill)] cursor-pointer ${
            activeTab === "pipeline"
              ? "bg-[var(--acc)] text-[var(--on-acc)] font-bold/10"
              : "text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--bg)] bg-[var(--surface)]"
          }`}
        >
          Pipeline y redactor de copy
        </button>
        <button
          id="tab-btn-analyzer"
          onClick={() => setActiveTab("analyzer")}
          className={`px-5 py-2.5 font-sans text-micro transition-ui duration-300 rounded-[var(--r-pill)] flex items-center gap-1.5 cursor-pointer ${
            activeTab === "analyzer"
              ? "bg-[var(--acc)] text-[var(--on-acc)] font-bold/10"
              : "text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--bg)] bg-[var(--surface)]"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> Analizador de vídeos IA
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* LEFT COLUMN: ACTIVE WORKSPACE TAB (8 columns) */}
        <div className="xl:col-span-8 space-y-6 flex flex-col justify-between min-w-0">
          {activeTab === "pipeline" ? (
            /* TAB 1: KANBAN PIPELINE AND COPY GENERATOR */
            <div className="space-y-6">
              {/* 1. Pipeline Kanban */}
              <div className={`${colors.card} p-5 space-y-4`}>
                <div className={` pb-3 `}>
                  <h3
                    className={`text-sm font-bold font-display text-[var(--acc)]`}
                  >
                    Pipeline de Reels y contenido
                  </h3>
                  <p className={`text-micro font-sans mt-1 ${textSub}`}>
                    Visualiza los vídeos grabados por la banda en la carretera y
                    arrástralos / muévelos de etapa para coordinar la
                    publicación.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Borradores */}
                  <div
                    className={`space-y-3 rounded-[var(--r-s)] p-3 bg-[var(--sunken)]`}
                  >
                    <span
                      className={`text-micro font-sans font-bold block pb-1.5 text-[var(--acc)]`}
                    >
                      Borradores (
                      {posts.filter((r) => r.estado === "borrador").length})
                    </span>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {posts
                        .filter((r) => r.estado === "borrador")
                        .map((post) => (
                          <div
                            key={post.id}
                            onClick={() => setSelectedPostInPhone(post)}
                            className={` rounded-[var(--r-s)] p-2.5 cursor-pointer transition-ui space-y-1.5 bg-[var(--surface)] ${
                              selectedPostInPhone?.id === post.id
                                ? "-[var(--acc)]"
                                : " hover:-indigo-300"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-1">
                              <span
                                className={`text-micro font-sans px-1.5 py-0.5 rounded font-bold ${
                                  post.plataforma === "Instagram"
                                    ? "bg-[var(--acc)]/10 text-[var(--acc-ink)]"
                                    : post.plataforma === "TikTok"
                                      ? "bg-[var(--acc)]/10 text-[var(--acc-ink)]"
                                      : "bg-[var(--surface)]/80 text-[var(--ink)]"
                                }`}
                              >
                                {post.plataforma}
                              </span>
                              <span className="text-micro font-sans text-[var(--ink-2)]">
                                {post.responsable}
                              </span>
                            </div>
                            <p
                              className={`text-xs font-medium leading-snug font-sans line-clamp-3 ${textTitle}`}
                            >
                              {post.contenido}
                            </p>
                            <div
                              className={`flex justify-between items-center pt-1 `}
                            >
                              <span className="text-micro font-sans text-[var(--ink-2)]">
                                {post.fecha}
                              </span>
                              <button
                                id={`btn-move-aprobado-${post.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdatePost(post.id, { estado: "aprobado" });
                                }}
                                className={`text-micro font-sans hover:underline cursor-pointer bg-transparent -none p-0 text-[var(--acc)]`}
                              >
                                Aprobar →
                              </button>
                            </div>
                          </div>
                        ))}
                      {posts.filter((r) => r.estado === "borrador").length ===
                        0 && (
                        <div className="flex flex-col items-center justify-center py-8 gap-2">
                          <PublicoSilhouette opacity={0.1} size="small" />
                          <p className="text-xs text-[var(--ink-2)]">
                            Nada en borrador. Graba algo en el próximo ensayo.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* En Edición / Aprobados */}
                  <div
                    className={`space-y-3 rounded-[var(--r-s)] p-3 bg-[var(--sunken)]`}
                  >
                    <span
                      className={`text-micro font-sans font-bold block pb-1.5 text-[var(--acc)]`}
                    >
                      En Edición / Aprobados (
                      {posts.filter((r) => r.estado === "aprobado").length})
                    </span>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {posts
                        .filter((r) => r.estado === "aprobado")
                        .map((post) => (
                          <div
                            key={post.id}
                            onClick={() => setSelectedPostInPhone(post)}
                            className={` rounded-[var(--r-s)] p-2.5 cursor-pointer transition-ui space-y-1.5 bg-[var(--surface)] ${
                              selectedPostInPhone?.id === post.id
                                ? ""
                                : "bg-[var(--surface)] hover:bg-[var(--acc-soft)]"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-1">
                              <span
                                className={`text-micro font-sans px-1.5 py-0.5 rounded font-bold ${
                                  post.plataforma === "Instagram"
                                    ? "bg-[var(--acc)]/10 text-[var(--acc-ink)]"
                                    : post.plataforma === "TikTok"
                                      ? "bg-[var(--acc)]/10 text-[var(--acc-ink)]"
                                      : "bg-[var(--surface)]/80 text-[var(--ink)]"
                                }`}
                              >
                                {post.plataforma}
                              </span>
                              <span className="text-micro font-sans text-[var(--ink-2)]">
                                {post.responsable}
                              </span>
                            </div>
                            <p
                              className={`text-xs font-medium leading-snug font-sans line-clamp-3 ${textTitle}`}
                            >
                              {post.contenido}
                            </p>
                            <div
                              className={`flex justify-between items-center pt-1 `}
                            >
                              <button
                                id={`btn-move-borrador-${post.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdatePost(post.id, { estado: "borrador" });
                                }}
                                className="text-micro font-sans text-[var(--ink-2)] hover:underline cursor-pointer bg-transparent -none p-0"
                              >
                                ← Borrador
                              </button>
                              <button
                                id={`btn-move-publicado-${post.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdatePost(post.id, {
                                    estado: "publicado",
                                  });
                                }}
                                className="text-micro font-sans text-[var(--ok)] hover:underline cursor-pointer font-bold bg-transparent -none p-0"
                              >
                                Publicar →
                              </button>
                            </div>
                          </div>
                        ))}
                      {posts.filter((r) => r.estado === "aprobado").length ===
                        0 && (
                        <div className="flex flex-col items-center justify-center py-8 gap-2">
                          <PublicoSilhouette opacity={0.1} size="small" />
                          <p className="text-xs text-[var(--ink-2)]">
                            Nada en edición todavía.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Listos / Publicados */}
                  <div
                    className={`space-y-3 rounded-[var(--r-s)] p-3 bg-[var(--sunken)]`}
                  >
                    <span
                      className={`text-micro font-sans text-[var(--ok)] font-bold block pb-1.5 `}
                    >
                      Listos / Publicados (
                      {posts.filter((r) => r.estado === "publicado").length})
                    </span>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {posts
                        .filter((r) => r.estado === "publicado")
                        .map((post) => (
                          <div
                            key={post.id}
                            onClick={() => setSelectedPostInPhone(post)}
                            className={` rounded-[var(--r-s)] p-2.5 cursor-pointer transition-ui space-y-1.5 bg-[var(--surface)] ${
                              selectedPostInPhone?.id === post.id
                                ? ""
                                : " hover:-emerald-300"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-1">
                              <span
                                className={`text-micro font-sans px-1.5 py-0.5 rounded font-bold ${
                                  post.plataforma === "Instagram"
                                    ? "bg-[var(--acc)]/10 text-[var(--acc-ink)]"
                                    : post.plataforma === "TikTok"
                                      ? "bg-[var(--acc)]/10 text-[var(--acc-ink)]"
                                      : "bg-[var(--surface)]/80 text-[var(--ink)]"
                                }`}
                              >
                                {post.plataforma}
                              </span>
                              <span className="text-micro font-sans text-[var(--ink-2)]">
                                {post.responsable}
                              </span>
                            </div>
                            <p
                              className={`text-xs font-medium leading-snug font-sans line-clamp-3 ${textTitle}`}
                            >
                              {post.contenido}
                            </p>
                            <div
                              className={`flex justify-between items-center pt-1 `}
                            >
                              <button
                                id={`btn-move-aprobado-back-${post.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdatePost(post.id, { estado: "aprobado" });
                                }}
                                className="text-micro font-sans text-[var(--ink-2)] hover:underline cursor-pointer bg-transparent -none p-0"
                              >
                                ← Re-editar
                              </button>
                              <span className="text-micro font-sans text-[var(--ok)] flex items-center gap-0.5 font-bold">
                                <CheckCircle2 className="w-2.5 h-2.5" />{" "}
                                Publicado
                              </span>
                            </div>
                          </div>
                        ))}
                      {posts.filter((r) => r.estado === "publicado").length ===
                        0 && (
                        <div className="flex flex-col items-center justify-center py-8 gap-2">
                          <PublicoSilhouette opacity={0.1} size="small" />
                          <p className="text-xs text-[var(--ink-2)]">
                            Aún no has publicado ninguno.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Structured Soul AI Writer */}
              <div className={`${colors.card} p-5 space-y-4`}>
                <div className={` pb-3 `}>
                  <h3
                    className={`text-sm font-bold font-display flex items-center gap-1.5 text-[var(--acc)]`}
                  >
                    AI Reels Writer (Redacción
                    Estructurada)
                  </h3>
                  <p className={`text-micro font-sans mt-1 ${textSub}`}>
                    Escribe la idea general del Reels. Elige una de las dos
                    vibras sonoras identitarias de la banda para generar una
                    copia adaptada mediante Gemini.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-micro font-sans text-[var(--ink-2)]">
                      Idea de contenido o anécdota
                    </label>
                    <Textarea
                      id="reels-idea-input"
                      rows={3}
                      value={reelIdea}
                      onChange={(e) => setReelIdea(e.target.value)}
                      placeholder="Ej: R-violin tocando el violín a toda velocidad o elyar ensayando con el hang pan en el camerino…"
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    <div className="lg:col-span-4 space-y-2.5">
                      <span className="block text-micro font-sans text-[var(--ink-2)]">
                        Seleccionar tonalidad AI
                      </span>
                      <button
                        id="btn-reels-hype"
                        onClick={() => handleGenerateCopy("hype")}
                        disabled={isGenerating}
                        className={`w-full py-3 font-sans font-bold text-xs rounded-[var(--r-s)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.97] transition-ui disabled:opacity-50 bg-[var(--acc)] text-[var(--on-acc)]`}
                      >
                        <Flame className="w-4 h-4" /> Hype festivo <ShowIcon inline emoji="🎺" /><ShowIcon inline emoji="🔥" />
                      </button>
                      <button
                        id="btn-reels-chill"
                        onClick={() => handleGenerateCopy("chill")}
                        disabled={isGenerating}
                        className={`w-full py-3 font-sans font-bold text-xs rounded-[var(--r-s)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.97] transition-ui disabled:opacity-50 bg-[var(--surface)] hover:bg-[var(--sunken)] text-[var(--ok)]`}
                      >
                        <Music className="w-4 h-4" /> Reggae Chill <ShowIcon inline emoji="🌿" /><ShowIcon inline emoji="🕊️" />
                      </button>

                      {isGenerating && (
                        <div className="text-micro font-sans text-[var(--ink-2)] text-center flex items-center justify-center gap-1.5 mt-2">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Consultando a Gemini…</span>
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-8 space-y-1.5">
                      <span className="block text-micro font-sans text-[var(--ink-2)]">
                        Publicación generada (Listo para copiar)
                      </span>
                      <Textarea
                        id="reels-generated-output"
                        rows={6}
                        value={generatedCopy}
                        onChange={(e) => setGeneratedCopy(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: BRAND NEW AI VIDEO HIGHLIGHT EXTRACTOR */
            <div className="space-y-6">
              {/* 1. Drag & Drop & Upload Area */}
              <div className={`${colors.card} p-5 space-y-4`}>
                <div className={` pb-3 `}>
                  <h3
                    className={`text-sm font-bold font-display flex items-center gap-1.5 text-[var(--acc)]`}
                  >
                    <Video className={`w-4 h-4 text-[var(--acc)]`} />{" "}
                    Extraer Highlights de Vídeos de Ensayos / Directos
                  </h3>
                  <p className={`text-micro font-sans mt-1 ${textSub}`}>
                    Sube tu metraje bruto en formato vídeo o pega un enlace de
                    YouTube. Nuestro modelo buscará ganchos acústicos,
                    transiciones y saltos rítmicos para recortar los mejores
                    15-60s.
                  </p>
                </div>

                {/* Selector de Origen de Vídeo */}
                <div
                  className="flex gap-1.5 p-1 rounded-[var(--r-m)] w-fit"
                  style={{ borderColor: "#e2e8f0" }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setInputType("file");
                      setAnalysisError(null);
                    }}
                    className={`px-3.5 py-1.5 text-micro font-sans rounded-[var(--r-pill)] transition-ui cursor-pointer ${
                      inputType === "file"
                        ? "bg-[var(--acc)] text-[var(--on-acc)] font-bold"
                        : "text-[var(--ink-2)] hover:text-[var(--ink)]"
                    }`}
                  >
                    <ShowIcon inline emoji="📂" />Archivo de vídeo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInputType("youtube");
                      setAnalysisError(null);
                    }}
                    className={`px-3.5 py-1.5 text-micro font-sans rounded-[var(--r-pill)] transition-ui cursor-pointer ${
                      inputType === "youtube"
                        ? "bg-[var(--acc)] text-[var(--on-acc)] font-bold"
                        : "text-[var(--ink-2)] hover:text-[var(--ink)]"
                    }`}
                  >
                    <ShowIcon inline emoji="📺" />Enlace de YouTube
                  </button>
                </div>

                {/* Drag & Drop or YouTube Link Input */}
                {inputType === "file" ? (
                  <div
                    id="video-dropzone"
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleFileDrop}
                    onClick={() =>
                      document.getElementById("video-file-input")?.click()
                    }
                    className={` -dashed rounded-[var(--r-l)] p-8 text-center cursor-pointer transition-ui ${
                      dragActive
                        ? " bg-[var(--acc)]/5 scale-[1.01]"
                        : selectedFile
                          ? " bg-[var(--ok)]/[0.02]"
                          : "-[#99907c]/25 hover:-[var(--acc)]/40 bg-[var(--surface)]/50"
                    }`}
                  >
                    <input
                      id="video-file-input"
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    {selectedFile ? (
                      <div className="space-y-3">
                        <div className="w-12 h-12 rounded-[var(--r-pill)] bg-[var(--ok)]/10 text-[var(--ok)] flex items-center justify-center mx-auto">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <p
                            className={`text-xs font-bold text-[var(--ink)]`}
                          >
                            {selectedFile.name}
                          </p>
                          <p className="text-micro text-[var(--ink-2)] font-sans mt-0.5">
                            {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                          </p>
                        </div>
                        <button
                          id="btn-clear-file"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                            cambiarVideoLocal(null);
                            setLocalVideoDuration(0);
                            setHighlights([]);
                            setOptimalTime(null);
                            setEnergyWindows([]);
                            setViralWindows([]);
                            setLoadedFromSaveAt(null);
                            setDetectedContentType(null);
                          }}
                          className="text-micro font-sans text-[var(--alert)] hover:underline hover:text-[var(--alert)] bg-transparent -none p-0 cursor-pointer"
                        >
                          Eliminar archivo y elegir otro
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div
                          className={`w-12 h-12 rounded-[var(--r-pill)] flex items-center justify-center mx-auto bg-[var(--acc)]/10 text-[var(--acc-ink)]`}
                        >
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <p
                            className={`text-xs font-bold text-[var(--ink-2)]`}
                          >
                            Suelta tu vídeo aquí o haz clic para buscar
                          </p>
                          <p className="text-micro text-[var(--ink-2)] font-sans mt-1">
                            Soporta .mp4, .mov, .m4v (Vídeo bruto de conciertos
                            o ensayos, máx 100MB)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={` rounded-[var(--r-l)] p-8 transition-ui bg-[var(--surface)]`}
                  >
                    <div className="space-y-4 max-w-xl mx-auto text-center">
                      <div
                        className={`w-12 h-12 rounded-[var(--r-pill)] flex items-center justify-center mx-auto bg-[var(--acc)]/10 text-[var(--acc-ink)]`}
                      >
                        <Youtube className="w-5 h-5" />
                      </div>
                      <div>
                        <p
                          className={`text-xs font-bold text-[var(--ink-2)]`}
                        >
                          Introduce la URL del vídeo de YouTube
                        </p>
                        <p className="text-micro text-[var(--ink-2)] font-sans mt-1">
                          Extrae highlights de cualquier vídeo público de
                          YouTube, Shorts o directo
                        </p>
                      </div>
                      <div className="relative">
                        <Input
                          size="sm"
                          id="youtube-url-input"
                          type="url"
                          value={youtubeUrl}
                          onChange={(e) => setYoutubeUrl(e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=… o https://youtu.be/…"
                          className="w-full pl-3 pr-10"
                        />
                        {youtubeUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setYoutubeUrl("");
                              setHighlights([]);
                              setOptimalTime(null);
                              setEnergyWindows([]);
                              setViralWindows([]);
                              setLoadedFromSaveAt(null);
                              setDetectedContentType(null);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-2)] hover:text-[var(--ink)] text-xs font-sans bg-transparent -none cursor-pointer"
                          >
                            ×
                          </button>
                        )}
                      </div>

                      {/* Ficha real del vídeo: sin esto el usuario no sabía si la URL era la correcta
 hasta después de gastar un análisis entero. */}
                      {isFetchingMeta && (
                        <div className="flex items-center justify-center gap-2 text-micro font-sans text-[var(--ink-2)] pt-1">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Leyendo la ficha del vídeo…</span>
                        </div>
                      )}

                      {!isFetchingMeta && metaError && (
                        <div className="p-2 rounded-[var(--r-s)] bg-[var(--acc)]/10 -[var(--acc)]/20 text-micro text-[var(--acc-ink)] font-sans text-left flex items-start gap-2">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>
                            {metaError} Puedes analizarlo igualmente, pero los
                            rangos serán aproximados.
                          </span>
                        </div>
                      )}

                      {!isFetchingMeta && videoMeta && (
                        <div
                          className={`flex gap-3 items-center p-2.5 rounded-[var(--r-m)] text-left bg-[var(--sunken)]`}
                        >
                          {videoMeta.thumbnail && (
                            <img
                              src={videoMeta.thumbnail}
                              alt=""
                              className="w-20 h-12 object-cover rounded-[var(--r-s)] shrink-0"
                              loading="lazy"
                            />
                          )}
                          <div className="min-w-0 flex-1 space-y-1">
                            <p
                              className={`text-xs font-bold truncate text-[var(--ink)]`}
                            >
                              {videoMeta.title || "Vídeo de YouTube"}
                            </p>
                            <div className="flex flex-wrap gap-1.5 items-center text-micro font-sans">
                              {videoMeta.author && (
                                <span className="text-[var(--ink-2)] truncate max-w-[120px]">
                                  {videoMeta.author}
                                </span>
                              )}
                              {videoMeta.durationKnown ? (
                                <span
                                  className={`px-1.5 py-0.5 rounded font-bold bg-[var(--acc)]/10 text-[var(--acc-ink)]`}
                                >
                                  {formatTime(videoMeta.duration)}
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-[var(--surface)]/80 text-[var(--ink-2)]">
                                  duración desconocida
                                </span>
                              )}
                              <span
                                className={`px-1.5 py-0.5 rounded font-bold ${
                                  videoMeta.hasTranscript
                                    ? "bg-[var(--ok)]/10 text-[var(--ok)]"
                                    : "bg-[var(--surface)]/80 text-[var(--ink-2)]"
                                }`}
                              >
                                {videoMeta.hasTranscript
                                  ? `subtítulos ✓ (${videoMeta.transcriptLines})`
                                  : "sin subtítulos"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Configurations */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-micro font-sans text-[var(--ink-2)]">
                      Tipo de material
                      {contentType === "auto" && detectedContentType && (
                        <span className="normal-case font-sans text-[var(--ink-2)]">
                          {" "}
                          (detectado: {detectedContentType})
                        </span>
                      )}
                    </label>
                    <Select
                      size="sm"
                      id="video-content-type-select"
                      value={contentType}
                      onChange={(e) =>
                        setContentType(e.target.value as typeof contentType)
                      }
                      title="Un concierto, un videoclip y un ensayo se buscan y se titulan de forma distinta: cambia qué momentos prioriza la IA."
                      wrapperClassName="w-full"
                    >
                      <option value="auto">Detectar automáticamente</option>
                      <option value="concierto">Concierto / directo</option>
                      <option value="videoclip">Videoclip</option>
                      <option value="ensayo">Ensayo / local</option>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-micro font-sans text-[var(--ink-2)]">
                      Contexto / Anécdota de apoyo (IA)
                    </label>
                    <Input
                      size="sm"
                      id="video-topic-input"
                      type="text"
                      value={videoTopic}
                      onChange={(e) => setVideoTopic(e.target.value)}
                      placeholder="Ej: Solo de violín rápido o improvisación de loops con percusión…"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-micro font-sans text-[var(--ink-2)]">
                      Límite de duración deseado
                    </label>
                    <Select
                      size="sm"
                      id="video-duration-select"
                      value={videoDuration}
                      onChange={(e) => setVideoDuration(Number(e.target.value))}
                      wrapperClassName="w-full"
                    >
                      <option value={15}>
                        15 segundos (Ideal para Reels cortos / Stories)
                      </option>
                      <option value={30}>
                        30 segundos (Súper dinámico / Recomendado)
                      </option>
                      <option value={60}>
                        60 segundos (Explicativo completo de bases)
                      </option>
                    </Select>
                  </div>
                </div>

                {/* Aviso de análisis recuperado: sin esto, el usuario no sabría por qué ya hay
 clips sugeridos sin haber pulsado"Analizar" en esta visita. */}
                {loadedFromSaveAt && highlights.length > 0 && !isAnalyzing && (
                  <div
                    className={`p-3 rounded-[var(--r-s)] text-xs flex items-center gap-2 bg-[var(--ok)]/10 text-[var(--ok)]`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      Recuperado el análisis guardado de este vídeo (
                      {new Date(loadedFromSaveAt).toLocaleString("es-ES", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      ). Pulsa “Analizar highlights con IA” si quieres uno nuevo.
                    </span>
                  </div>
                )}

                {/* Analysis Button */}
                <div className="pt-2">
                  <button
                    id="btn-analyze-video"
                    onClick={handleAnalyzeVideo}
                    disabled={
                      (inputType === "file" ? !selectedFile : !youtubeUrl) ||
                      isAnalyzing
                    }
                    className={`w-full py-3.5 rounded-[var(--r-m)] font-sans text-xs font-bold cursor-pointer flex items-center justify-center gap-2 transition-ui ${
                      (inputType === "file" ? selectedFile : youtubeUrl)
                        ? "bg-[var(--acc)] text-[var(--on-acc)] "
                        : "bg-[var(--surface)]/80 text-[var(--ink-2)] cursor-not-allowed"
                    }`}
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw
                          className={`w-4 h-4 animate-spin text-[var(--acc-ink)]`}
                        />
                        <span>PROCESANDO METRAJE…</span>
                      </>
                    ) : (
                      <>
                        <Sparkles
                          className={`w-4 h-4 text-[var(--acc-ink)]`}
                        />
                        <span>ANALIZAR HIGHLIGHTS CON IA</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Loading indicator with detailed analytical logs */}
                {isAnalyzing && (
                  <div
                    className={`p-4 rounded-[var(--r-m)] space-y-3 bg-[var(--sunken)]`}
                  >
                    <div className="flex justify-between items-center text-micro font-sans">
                      <span className={`font-bold text-[var(--acc)]`}>
                        Estado del análisis:
                      </span>
                      <span className="text-[var(--ink-2)]">
                        Paso {loadingStep + 1} de {getLoadingSteps().length}
                      </span>
                    </div>
                    <p
                      className={`text-xs font-sans leading-normal text-[var(--ink-2)]`}
                    >
                      <ShowIcon inline emoji="⚡️" />{" "}
                      <span className={"text-[var(--acc)]"}>
                        {getLoadingSteps()[loadingStep]}
                      </span>
                    </p>
                    <div
                      className={`w-full h-1.5 rounded-[var(--r-pill)] overflow-hidden bg-[var(--surface)]`}
                    >
                      <div
                        className={`h-full transition-ui duration-300 bg-[var(--acc)] `}
                        style={{
                          width: `${((loadingStep + 1) / getLoadingSteps().length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {analysisError && (
                  <div className="p-3 bg-[var(--alert)]/10 rounded-[var(--r-s)] text-[var(--alert)] text-xs flex gap-2 items-center">
                    <AlertCircle className="w-4 h-4 text-[var(--alert)] shrink-0" />
                    <span>{analysisError}</span>
                  </div>
                )}

                {/* Cuando la IA no ha intervenido lo decimos: antes los cortes de respaldo se
 presentaban como si los hubiera elegido el modelo. */}
                {!analysisError && analysisNotice && (
                  <div className="p-3 bg-[var(--acc)]/10 -[var(--acc)]/20 rounded-[var(--r-s)] text-[var(--acc-ink)] text-xs flex gap-2 items-start">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{analysisNotice}</span>
                  </div>
                )}
              </div>

              {/* 2. Lighttable (Mesa de Luz con los Clips Detectados) */}
              {highlights.length > 0 && (
                <div className={`${colors.card} p-5 space-y-4`}>
                  <div className={` pb-2 `}>
                    <h3
                      className={`text-sm font-bold font-display flex items-center gap-2 text-[var(--acc)]`}
                    >
                      <Layers className="w-4 h-4" /> Mesa de Luz de Clips
                      Sugeridos (Highlights)
                    </h3>
                    <p className={`text-micro font-sans mt-1 ${textSub}`}>
                      Hemos localizado {highlights.length} momentos de alto
                      potencial. Haz clic en un clip para seleccionarlo,
                      previsualizarlo y ajustar su programación.
                    </p>
                  </div>

                  {/* Mapa de señales: si hay desglose (volumen/arranque/ritmo visual) se usa ese, porque
 explica MEJOR por qué se ha elegido cada momento; si no, se cae al de solo energía. */}
                  {(viralWindows.length > 0 || energyWindows.length > 0) &&
                    timelineDuration > 0 &&
                    (() => {
                      const ventanas =
                        viralWindows.length > 0 ? viralWindows : energyWindows;
                      const conDesglose = viralWindows.length > 0;
                      return (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-micro font-sans text-[var(--ink-2)]">
                              {conDesglose
                                ? "Señales medidas (volumen · arranque · montaje)"
                                : "Energía medida en el audio"}
                            </span>
                            <span className="text-micro font-sans text-[var(--ok)]">
                              ● {ventanas.length} tramos con potencial
                            </span>
                          </div>
                          <div
                            className={`relative w-full h-7 rounded-[var(--r-s)] overflow-hidden bg-[var(--surface)]`}
                          >
                            {ventanas.map((v, i) => {
                              const izq = Math.max(
                                0,
                                Math.min(
                                  100,
                                  (v.start / timelineDuration) * 100,
                                ),
                              );
                              const ancho = Math.max(
                                0.8,
                                Math.min(
                                  100 - izq,
                                  ((v.end - v.start) / timelineDuration) * 100,
                                ),
                              );
                              const titulo =
                                conDesglose && "motivo" in v
                                  ? `${formatTime(v.start)} - ${formatTime(v.end)} · potencial ${v.score}/100\nvolumen ${(v as any).energia} · arranque ${(v as any).arranque} · montaje ${(v as any).dinamismo}\n${(v as any).motivo}`
                                  : `${formatTime(v.start)} - ${formatTime(v.end)} · energía ${v.score}/100`;
                              return (
                                <div
                                  key={`${v.start}-${i}`}
                                  className="absolute top-0 bottom-0 rounded-[var(--r-s)]"
                                  title={titulo}
                                  style={{
                                    left: `${izq}%`,
                                    width: `${ancho}%`,
                                    background: "var(--acc)",
                                    opacity:
                                      0.25 +
                                      (Math.max(0, Math.min(100, v.score)) /
                                        100) *
                                        0.75,
                                  }}
                                />
                              );
                            })}
                            {/* Dónde ha caído el clip seleccionado sobre ese mapa */}
                            {(() => {
                              const clip = highlights[selectedHighlightIndex];
                              if (!clip) return null;
                              const { start, end } = parseRangeTimes(
                                clip.range,
                              );
                              if (end <= start) return null;
                              const izq = Math.max(
                                0,
                                Math.min(100, (start / timelineDuration) * 100),
                              );
                              const ancho = Math.max(
                                0.8,
                                Math.min(
                                  100 - izq,
                                  ((end - start) / timelineDuration) * 100,
                                ),
                              );
                              return (
                                <div
                                  className="absolute top-0 bottom-0 -2 rounded-[var(--r-s)] pointer-events-none"
                                  style={{
                                    left: `${izq}%`,
                                    width: `${ancho}%`,
                                    boxShadow:
                                      "0 0 0 1px rgba(16,185,129,0.6) inset",
                                  }}
                                />
                              );
                            })()}
                          </div>
                          <p className="text-micro font-sans text-[var(--ink-2)] leading-tight">
                            {conDesglose
                              ? "Cuanto más intenso, más potencial combinado (volumen + arranque + montaje). El recuadro verde es el corte seleccionado."
                              : "Cuanto más intenso, más suena la banda en ese punto. El recuadro verde es el corte seleccionado."}
                          </p>
                          {(() => {
                            // El motivo de la ventana que coincide con el corte seleccionado, para no obligar a
                            // pasar el ratón por encima de una barra diminuta para leerlo.
                            const clip = highlights[selectedHighlightIndex];
                            if (!clip || !conDesglose) return null;
                            const { start } = parseRangeTimes(clip.range);
                            const ventana = (viralWindows as any[]).find(
                              (v) => Math.abs(v.start - start) <= 2,
                            );
                            if (!ventana?.motivo) return null;
                            return (
                              <p
                                className={`text-micro font-sans italic leading-snug pt-0.5 text-[var(--acc)]`}
                              >
                                "{ventana.motivo}"
                              </p>
                            );
                          })()}
                        </div>
                      );
                    })()}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {highlights.map((clip, index) => {
                      const isSelected = selectedHighlightIndex === index;
                      return (
                        <div
                          id={`clip-card-${index}`}
                          key={clip.id || index}
                          onClick={() => handleSelectHighlight(index)}
                          className={` rounded-[var(--r-m)] p-3.5 cursor-pointer transition-ui space-y-3 relative group overflow-hidden ${
                            isSelected
                              ? "-[var(--acc)] bg-[var(--acc)]/5"
                              : "-neutral-200 bg-[var(--surface)] hover:-indigo-300 hover:bg-[var(--bg)]/50"
                          }`}
                        >
                          {/* Simulated miniature video thumbnail track design */}
                          <div
                            className={`w-full h-20 rounded-[var(--r-s)] relative flex flex-col justify-between p-2 overflow-hidden bg-[var(--sunken)]`}
                          >
                            {/* Waveforms illustration background */}
                            <div className="absolute inset-x-0 bottom-0 h-8 flex items-end gap-[2px] opacity-25 px-1">
                              {[
                                35, 45, 60, 20, 80, 50, 95, 30, 45, 75, 25, 40,
                                60, 80, 25, 50, 70, 90, 40, 20, 45, 80, 60,
                              ].map((h, i) => (
                                <div
                                  key={i}
                                  className={`flex-1 bg-[var(--acc)]`}
                                  style={{
                                    height: `${isSelected ? h : h * 0.7}%`,
                                  }}
                                />
                              ))}
                            </div>
                            <span
                              className={`text-micro font-sans font-bold px-1.5 py-0.5 rounded self-start z-10 bg-[var(--acc)] text-[var(--on-acc)]`}
                            >
                              {clip.range}
                            </span>
                            <div className="absolute inset-0 flex items-center justify-center z-0 opacity-80 transition-transform">
                              <div className="w-8 h-8 rounded-[var(--r-pill)] bg-[var(--surface)] flex items-center justify-center text-[var(--acc)]">
                                <Play className="w-3.5 h-3.5 fill-[var(--acc)] ml-0.5" />
                              </div>
                            </div>
                            <span className="text-micro font-sans text-[var(--ink-2)] self-end z-10 bg-[var(--surface)] px-1 rounded truncate w-full">
                              CLIP-{index + 1}.mp4
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <h4
                              className={`text-xs font-bold font-sans line-clamp-1 flex items-center gap-1 transition-colors text-[var(--ink-2)] group-hover:text-[var(--acc)]`}
                            >
                              {clip.title}
                            </h4>
                            <p
                              className={`text-micro font-sans leading-normal line-clamp-2 ${textSub}`}
                            >
                              {clip.description}
                            </p>
                          </div>

                          {/* Virality score meter */}
                          <div className={`space-y-1 pt-1.5 `}>
                            <div className="flex justify-between items-center text-micro font-sans text-[var(--ink-2)]">
                              <span className="flex items-center gap-1">
                                <Flame
                                  className={`w-3 h-3 text-[var(--acc)]`}
                                />{" "}
                                Virality Score:
                              </span>
                              <span
                                className={`font-bold text-[var(--acc)]`}
                              >
                                {clip.virality}%
                              </span>
                            </div>
                            <div
                              className={`w-full h-1 rounded-[var(--r-pill)] overflow-hidden bg-[var(--sunken)]`}
                            >
                              <div
                                className={`h-full bg-[var(--acc)]`}
                                style={{ width: `${clip.virality}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Editor & Scheduler Form for Selected Highlight */}
              {highlights.length > 0 && (
                <div className={`${colors.card} p-5 space-y-4`}>
                  <div className={` pb-2 `}>
                    <h3
                      className={`text-sm font-bold font-display flex items-center gap-2 text-[var(--acc)]`}
                    >
                      <Calendar className="w-4 h-4" /> Personalizar Publicación
                      y Programar en Calendario
                    </h3>
                    <p className={`text-micro font-sans mt-1 ${textSub}`}>
                      Edita el pie de foto (copy) propuesto por la IA y confirma
                      la fecha recomendada de publicación para el feed de la
                      banda.
                    </p>
                  </div>

                  <form onSubmit={handleSchedulePost} className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                      {/* Left Block: Configs & copy */}
                      <div className="lg:col-span-8 space-y-4">
                        {/* Selected Clip summary header */}
                        <div
                          className={`p-3 rounded-[var(--r-m)] flex justify-between items-center gap-3 bg-[var(--surface)]`}
                        >
                          <div className="space-y-0.5 flex-1">
                            <span className="text-micro font-sans text-[var(--ink-2)]">
                              TÍTULO DEL CORTE (EDITABLE):
                            </span>
                            <input
                              type="text"
                              value={
                                highlights[selectedHighlightIndex]?.title || ""
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                setHighlights((prev) =>
                                  prev.map((clip, idx) =>
                                    idx === selectedHighlightIndex
                                      ? { ...clip, title: val }
                                      : clip,
                                  ),
                                );
                              }}
                              className={`w-full bg-transparent text-xs font-bold font-sans -dashed focus:-[var(--acc)] focus:outline-none py-0.5 ${textTitle}`}
                              placeholder="Escribe un título para este corte…"
                            />
                          </div>
                          <span
                            className={`text-xs font-sans font-bold px-2.5 py-1 rounded shrink-0 bg-[var(--acc)]/10 text-[var(--acc-ink)]`}
                          >
                            {highlights[selectedHighlightIndex]?.range}
                          </span>
                        </div>

                        {/* AI Re-analyzer & User Notes Panel */}
                        <div
                          className={`p-3.5 rounded-[var(--r-l)] space-y-3 bg-[var(--surface)]/90 `}
                        >
                          <div className="flex justify-between items-center flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-sans font-bold ${textTitle}`}
                              >
                                Reanalizar y refinar fragmento con IA
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={handleReanalyzeClip}
                              disabled={isReanalyzingClip}
                              className={`px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-sans font-bold flex items-center gap-2 transition-ui cursor-pointer active:scale-[0.97] ${
                                isReanalyzingClip
                                  ? "bg-[var(--surface)]/80 text-[var(--ink-2)] cursor-not-allowed"
                                  : "bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)]"
                              }`}
                            >
                              <Sparkles
                                className={`w-3.5 h-3.5 ${isReanalyzingClip ? "animate-spin" : ""}`}
                              />
                              {isReanalyzingClip
                                ? "Reanalizando..."
                                : "Reanalizar Corte con IA"}
                            </button>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-micro font-sans text-[var(--ink-2)]">
                              Notas u Observaciones del Fragmento (Opcional -
                              ej:"En este tramo toca el bajo Jon","Sólo
                              instrumental","Presentación de la banda")
                            </label>
                            <Input
                              size="sm"
                              type="text"
                              value={clipUserNote}
                              onChange={(e) => setClipUserNote(e.target.value)}
                              placeholder="Ej: En este tramo del 0:15 al 0:45 sólo toca el bajo Jon y la batería, no hay violín…"
                              className="w-full"
                            />
                          </div>

                          {/* Valorar la versión anterior (como el entrenamiento de pitches en Booking CRM):
 estrellas + comentario ya existente arriba, y decidir si se recuerda para siempre
 o es solo un ajuste puntual de este corte. */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div
                              className={`p-2 rounded-[var(--r-m)] space-y-1 bg-[var(--surface)]`}
                            >
                              <span className="text-micro font-sans text-[var(--ink-2)] block">
                                Tono (versión anterior)
                              </span>
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={`clip-tone-${star}`}
                                    type="button"
                                    onClick={() =>
                                      setClipToneRating(
                                        clipToneRating === star ? 0 : star,
                                      )
                                    }
                                    className={`p-0.5 rounded cursor-pointer transition-colors ${clipToneRating >= star ? "text-[var(--acc)]" : "text-[var(--ink-2)] hover:text-[var(--ink-2)]"}`}
                                    title={`Valorar el tono: ${star}/5`}
                                  >
                                    <Star className="w-3.5 h-3.5 fill-current" />
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div
                              className={`p-2 rounded-[var(--r-m)] space-y-1 bg-[var(--surface)]`}
                            >
                              <span className="text-micro font-sans text-[var(--ink-2)] block">
                                Contenido (versión anterior)
                              </span>
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={`clip-content-${star}`}
                                    type="button"
                                    onClick={() =>
                                      setClipContentRating(
                                        clipContentRating === star ? 0 : star,
                                      )
                                    }
                                    className={`p-0.5 rounded cursor-pointer transition-colors ${clipContentRating >= star ? "text-[var(--acc)]" : "text-[var(--ink-2)] hover:text-[var(--ink-2)]"}`}
                                    title={`Valorar el contenido: ${star}/5`}
                                  >
                                    <Star className="w-3.5 h-3.5 fill-current" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-micro font-sans">
                            <span className="text-[var(--ink-2)]">
                              Alcance del ajuste:
                            </span>
                            <button
                              type="button"
                              onClick={() => setClipFeedbackScope("este_reel")}
                              className={`px-2 py-1 rounded-[var(--r-pill)] cursor-pointer transition-ui ${
                                clipFeedbackScope === "este_reel"
                                  ? "bg-[var(--surface)]/70 text-[var(--ink)] font-bold"
                                  : "bg-transparent text-[var(--ink-2)] hover:text-[var(--ink)]"
                              }`}
                            >
                              Solo este corte
                            </button>
                            <button
                              type="button"
                              onClick={() => setClipFeedbackScope("global")}
                              className={`px-2 py-1 rounded-[var(--r-pill)] cursor-pointer transition-ui flex items-center gap-1 ${
                                clipFeedbackScope === "global"
                                  ? "bg-[var(--acc)]/20 text-[var(--acc-ink)] font-bold"
                                  : "bg-transparent text-[var(--ink-2)] hover:text-[var(--ink)]"
                              }`}
                              title="La IA recordará esta corrección también para futuros Reels de la banda"
                            >
                              <Sparkles className="w-3 h-3" /> Recordar para
                              siempre
                            </button>
                          </div>

                          {reanalyzeSuccessMsg && (
                            <div className="text-xs font-sans text-[var(--ok)] flex items-center gap-1.5 bg-[var(--ok)]/10 p-2 rounded-[var(--r-s)] ">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--ok)] shrink-0" />
                              <span>{reanalyzeSuccessMsg}</span>
                            </div>
                          )}

                          {highlights[selectedHighlightIndex]?.reason && (
                            <div
                              className={`p-2.5 rounded-[var(--r-m)] text-xs font-sans leading-relaxed bg-[var(--surface)]/80 text-[var(--ink-2)]`}
                            >
                              <span className="font-sans text-micro font-bold text-[var(--ink-2)] block mb-0.5">
                                Diagnóstico IA del Fragmento:
                              </span>
                              <p>
                                {highlights[selectedHighlightIndex]?.reason}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* 🚀 Viral Growth Studio 4.0 (Ganchos A/B + Bucle 120% + Subtítulos + Punch-In Zoom + Stickers B-Roll) */}
                        <ViralGrowthStudio
                          colors={colors}
                          bandName={bandName}
                          songTitle={
                            videoMeta?.title ||
                            highlights[selectedHighlightIndex]?.title ||
                            ""
                          }
                          currentHook={
                            highlights[selectedHighlightIndex]?.hookText || ""
                          }
                          onUpdateHook={(newHook) => {
                            setHighlights((prev) =>
                              prev.map((clip, idx) =>
                                idx === selectedHighlightIndex
                                  ? { ...clip, hookText: newHook }
                                  : clip,
                              ),
                            );
                          }}
                          currentCopy={editedCopy}
                          onUpdateCopy={(newCopy) => setEditedCopy(newCopy)}
                          isSeamlessLoop={isSeamlessLoop}
                          onToggleSeamlessLoop={(enabled) =>
                            setIsSeamlessLoop(enabled)
                          }
                          isPunchInZoom={isPunchInZoom}
                          onTogglePunchInZoom={(enabled) =>
                            setIsPunchInZoom(enabled)
                          }
                          beatDropFx={beatDropFx}
                          onToggleBeatDropFx={(enabled) =>
                            setBeatDropFx(enabled)
                          }
                          smartPan={smartPan}
                          onToggleSmartPan={(enabled) => setSmartPan(enabled)}
                          cropMode={cropMode as any}
                          onChangeCropMode={(cm) => setCropMode(cm as any)}
                          activeSubtitleStyle={activeSubtitleStyle}
                          onChangeSubtitleStyle={(st) =>
                            setActiveSubtitleStyle(st)
                          }
                          injectEmojis={injectEmojis}
                          onToggleInjectEmojis={(enabled) =>
                            setInjectEmojis(enabled)
                          }
                          showSpotifyBadge={showSpotifyBadge}
                          onToggleSpotifyBadge={(enabled) =>
                            setShowSpotifyBadge(enabled)
                          }
                          showRetentionProgressBar={showRetentionProgressBar}
                          onToggleRetentionProgressBar={(enabled) =>
                            setShowRetentionProgressBar(enabled)
                          }
                          showTourSticker={showTourSticker}
                          onToggleTourSticker={(enabled) =>
                            setShowTourSticker(enabled)
                          }
                          tourStickerText={tourStickerText}
                          onUpdateTourStickerText={(txt) =>
                            setTourStickerText(txt)
                          }
                          onSyncFromTourCRM={handleSyncFromTourCRM}
                          onTriggerMagicAutopilot={handleTriggerMagicAutopilot}
                          magicAppliedNotification={magicAppliedNotification}
                          layoutMode={layoutMode}
                          onChangeLayoutMode={(lm) => setLayoutMode(lm)}
                          showSafeZone={showSafeZone}
                          onToggleSafeZone={() =>
                            setShowSafeZone(!showSafeZone)
                          }
                        />

                        {/* Copy editor with 3.0 Objective Tabs */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="block text-micro font-mono text-[var(--ink-2)]">
                              Variante de copy con ADN
                            </label>
                            <div className="flex gap-1">
                              {[
                                {
                                  id: "viral" as const,
                                  label: "Viral",
                                  tip: "Algoritmo y debate en comentarios",
                                },
                                {
                                  id: "comunidad" as const,
                                  label: "Comunidad",
                                  tip: "Conexión y lore de la banda",
                                },
                                {
                                  id: "conversion" as const,
                                  label: "Conversión",
                                  tip: "Spotify, entradas y EPK",
                                },
                              ].map((tab) => (
                                <button
                                  key={tab.id}
                                  type="button"
                                  onClick={() =>
                                    handleSwitchCopyObjective(tab.id)
                                  }
                                  title={tab.tip}
                                  className={`px-2 py-1 rounded text-micro font-mono font-bold transition-ui cursor-pointer ${
                                    copyObjective === tab.id
                                      ? "bg-[var(--acc)] text-[var(--on-acc)] "
                                      : "bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--sunken)]"
                                  }`}
                                >
                                  {tab.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <Textarea
                            id="highlight-copy-editor"
                            rows={4}
                            value={editedCopy}
                            onChange={(e) => setEditedCopy(e.target.value)}
                            className="w-full"
                          />

                          {/* Quick action: 1-Click Formatted Copy for Instagram/TikTok */}
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {highlights[selectedHighlightIndex]?.hashtags
                                ?.slice(0, 4)
                                .map((tag, tIdx) => (
                                  <span
                                    key={tIdx}
                                    className="text-micro font-mono text-[var(--ink-2)] bg-[var(--sunken)] px-1.5 py-0.5 rounded "
                                  >
                                    {tag.startsWith("#") ? tag : `#${tag}`}
                                  </span>
                                ))}
                            </div>
                            <button
                              type="button"
                              onClick={handleCopyFormattedPost}
                              className={`px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-mono font-bold flex items-center gap-1.5 transition-ui cursor-pointer shrink-0 ${
                                copiedNotification
                                  ? "bg-[var(--ok)] text-[var(--on-ok)] font-bold scale-105"
                                  : "bg-[var(--sunken)] hover:bg-[var(--sunken)] text-[var(--acc-ink)] bg-[var(--acc)]/10"
                              }`}
                              title="Copia el gancho, el copy y los hashtags formateados listos para pegar en Instagram o TikTok"
                            >
                              {copiedNotification ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>¡Copiado para redes!</span>
                                </>
                              ) : (
                                <>
                                  <Bookmark className="w-3.5 h-3.5" />
                                  <span>1-Click copiar formato</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Recommendation Tips */}
                        {optimalTime && (
                          <div
                            className={`p-3 rounded-[var(--r-m)] flex gap-3 items-start text-xs leading-relaxed bg-[var(--acc)]/5 text-[var(--ink)]`}
                          >
                            <Clock
                              className={`w-4.5 h-4.5 mt-0.5 shrink-0 text-[var(--acc)]`}
                            />
                            <div className="space-y-0.5">
                              <span
                                className={`font-sans text-micro font-bold text-[var(--acc)]`}
                              >
                                ¿Por qué este horario?
                              </span>
                              <p
                                className={`font-sans text-[var(--ink-2)]`}
                              >
                                {optimalTime.reason}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Block: Platform, Date/Time & Submit */}
                      <div className="lg:col-span-4 space-y-4">
                        {/* Platform Selector */}
                        <div className="space-y-1.5">
                          <span className="block text-micro font-sans text-[var(--ink-2)]">
                            Plataforma objetivo
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { id: "Instagram", name: "Instagram Reels" },
                              { id: "TikTok", name: "TikTok Video" },
                              { id: "YouTube", name: "YouTube Shorts" },
                              { id: "Facebook", name: "Facebook" },
                            ].map((plat) => (
                              <button
                                type="button"
                                key={plat.id}
                                onClick={() => {
                                  const nuevaPlataforma = plat.id as
                                    | "Instagram"
                                    | "TikTok"
                                    | "YouTube"
                                    | "Facebook";
                                  setSelectedPlatform(nuevaPlataforma);
                                  setEditedCopy(
                                    copyForPlatform(
                                      highlights[selectedHighlightIndex],
                                      nuevaPlataforma,
                                    ),
                                  );
                                }}
                                className={`py-2 px-2 rounded-[var(--r-pill)] text-micro font-sans text-center transition-ui cursor-pointer ${
                                  selectedPlatform === plat.id
                                    ? "bg-[var(--acc)] -[var(--acc)] text-[var(--on-acc)] font-bold"
                                    : " hover:-indigo-200 bg-[var(--surface)] text-[var(--ink-2)]"
                                }`}
                              >
                                {plat.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Interactive Scheduler Inputs */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <span className="block text-micro font-sans text-[var(--ink-2)]">
                              Fecha de envío
                            </span>
                            <Input
                              size="sm"
                              type="date"
                              value={scheduledDate}
                              onChange={(e) => setScheduledDate(e.target.value)}
                              className="w-full"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="block text-micro font-sans text-[var(--ink-2)]">
                              Hora sugerida
                            </span>
                            <Input
                              size="sm"
                              type="time"
                              value={scheduledTime}
                              onChange={(e) => setScheduledTime(e.target.value)}
                              className="w-full"
                            />
                          </div>
                        </div>

                        {/* ⚡ Subida Automática Desatendida & Conexión de Cuenta */}
                        <div
                          className={`p-3 rounded-[var(--r-s)] space-y-2 ${
                            autoPublishEnabled
                              ? "bg-[var(--acc)]/10 "
                              : "bg-[var(--sunken)]/60 "
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Zap
                                className={`w-3.5 h-3.5 ${autoPublishEnabled ? "text-[var(--acc-ink)] fill-[var(--acc)]" : "text-[var(--ink-2)]"}`}
                              />
                              <span className="text-micro font-mono font-bold text-[var(--ink)]">
                                Subida Automática a {selectedPlatform}
                              </span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={autoPublishEnabled}
                                onChange={(e) =>
                                  setAutoPublishEnabled(e.target.checked)
                                }
                                className="sr-only peer"
                              />
                              <div className="w-7 h-4 bg-[var(--sunken)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--ink)] after:rounded-full after:h-3 after:w-3 after:transition-ui peer-checked:bg-[var(--acc)]"></div>
                            </label>
                          </div>

                          {/* Cuenta vinculada actual */}
                          {(() => {
                            const acc = socialAccounts.find(
                              (a) =>
                                a.plataforma?.toLowerCase() ===
                                selectedPlatform.toLowerCase(),
                            );
                            if (acc && acc.status === "conectado") {
                              return (
                                <div className="flex items-center justify-between text-micro font-mono bg-[var(--scrim)]/40 p-2 rounded-[var(--r-s)] bg-[var(--ok)]/10">
                                  <div className="flex items-center gap-1 text-[var(--ok)] font-bold truncate">
                                    <ShieldCheck className="w-3 h-3 text-[var(--ok)] shrink-0" />
                                    <span className="truncate">
                                      {acc.handle}
                                    </span>
                                  </div>
                                  <span className="text-[var(--ok)] text-micro font-bold shrink-0">
                                    ● Conectado
                                  </span>
                                </div>
                              );
                            }
                            return (
                              <div className="flex items-center justify-between text-micro font-mono bg-[var(--scrim)]/40 p-2 rounded-[var(--r-s)] bg-[var(--acc)]/10">
                                <span className="text-[var(--ink-2)]">
                                  Sin cuenta vinculada
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowConnectModal(true);
                                    setConnectHandleInput(
                                      instagramHandle ||
                                        `@${(bandName || "banda").toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
                                    );
                                  }}
                                  className="text-[var(--acc-ink)] hover:text-[var(--acc-ink)] font-bold underline cursor-pointer flex items-center gap-1"
                                >
                                  <span><ShowIcon inline emoji="🔗" />Conectar en 1 clic</span>
                                </button>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Master Actions: Marie Kondo Clean & Zen Tiers */}
                        <div className="space-y-2 pt-2">
                          <button
                            type="button"
                            onClick={handleDownloadCompletePack}
                            className={`w-full py-2.5 px-3 rounded-[var(--r-s)] font-mono text-xs font-bold tracking-wider cursor-pointer flex items-center justify-center gap-2 transition-ui ${
                              packDownloadedSuccess
                                ? "bg-[var(--ok)] text-[var(--on-ok)] font-bold"
                                : "bg-[var(--sunken)] hover:bg-[var(--sunken)] text-[var(--acc-ink)] "
                            }`}
                            title="Descarga el vídeo, subtítulos, portada y copy formateado"
                          >
                            {packDownloadedSuccess ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>¡PACK 4-EN-1 DESCARGADO!</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4" />
                                <span>Descargar pack completo</span>
                              </>
                            )}
                          </button>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={handleCaptureThumbnail}
                              className={`py-2 px-3 rounded-[var(--r-pill)] text-micro font-mono font-bold flex items-center justify-center gap-1.5 transition-ui cursor-pointer ${
                                thumbnailCapturedSuccess
                                  ? "bg-[var(--ok)]/20 text-[var(--ink)] "
                                  : "bg-[var(--sunken)] hover:bg-[var(--sunken)] text-[var(--ink-2)] "
                              }`}
                              title="Captura el fotograma actual en alta resolución para usar de portada"
                            >
                              <Camera className="w-3.5 h-3.5 text-[var(--acc-ink)]" />
                              <span>
                                {thumbnailCapturedSuccess
                                  ? "¡Portada Guardada!"
                                  : "Guardar Portada"}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={handleCopyFormattedPost}
                              className="py-2 px-3 rounded-[var(--r-pill)] bg-[var(--sunken)] hover:bg-[var(--sunken)] text-micro font-mono font-bold text-[var(--ink-2)] flex items-center justify-center gap-1.5 transition-ui cursor-pointer"
                              title="Copia el texto formateado al portapapeles"
                            >
                              <Copy className="w-3.5 h-3.5 text-[var(--acc-ink)]" />
                              <span>Copiar copy</span>
                            </button>
                          </div>

                          {/* Action Buttons: Publicar Ahora (1-Clic) vs Programar en Calendario */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            <button
                              type="button"
                              onClick={handlePublishNowDirectly}
                              disabled={isPublishingNow}
                              className={`py-3 px-2 rounded-[var(--r-s)] font-mono text-xs font-bold tracking-wider cursor-pointer flex items-center justify-center gap-1.5 transition-ui ${
                                isPublishingNow
                                  ? "bg-[var(--sunken)] text-[var(--ink-2)] cursor-not-allowed"
                                  : "bg-[var(--alert)] hover:brightness-95 text-[var(--on-alert)] active:scale-[0.97]"
                              }`}
                              title="Publica inmediatamente este Reel en tu cuenta oficial"
                            >
                              {isPublishingNow ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>PUBLICANDO…</span>
                                </>
                              ) : (
                                <>
                                  <Rocket className="w-3.5 h-3.5" />
                                  <span>PUBLICAR AHORA</span>
                                </>
                              )}
                            </button>

                            <button
                              type="submit"
                              disabled={isScheduling}
                              className={`py-3 px-2 rounded-[var(--r-s)] font-mono text-xs font-bold tracking-wider cursor-pointer flex items-center justify-center gap-1.5 transition-ui ${
                                isScheduling
                                  ? "bg-[var(--sunken)] text-[var(--ink-2)] cursor-not-allowed"
                                  : "bg-[var(--sunken)] hover:bg-[var(--sunken)] text-[var(--ink)] "
                              }`}
                            >
                              {isScheduling ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>AGENDANDO…</span>
                                </>
                              ) : (
                                <>
                                  <Calendar className="w-3.5 h-3.5 text-[var(--acc-ink)]" />
                                  <span>AGENDAR</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {publishNowSuccess && (
                          <div className="p-2.5 bg-[var(--alert)]/10 rounded-[var(--r-s)] text-[var(--alert)] text-xs text-center font-mono animate-fade-in mt-2 flex items-center justify-center gap-1.5">
                            <Check className="w-4 h-4 text-[var(--alert)]" />
                            <span>{publishNowSuccess}</span>
                          </div>
                        )}

                        {schedulingSuccess && (
                          <div className="p-2.5 bg-[var(--ok)]/10 rounded-[var(--r-s)] text-[var(--ok)] text-xs text-center font-sans animate-bounce mt-2 flex items-center justify-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-[var(--ok)]" />
                            <span>¡Reel programado con éxito!</span>
                          </div>
                        )}
                        {scheduleErrors.length > 0 && (
                          <div className="p-2.5 bg-[var(--alert)]/10 rounded-[var(--r-s)] text-[var(--alert)] text-xs font-sans mt-2 space-y-1">
                            {scheduleErrors.map((problema) => (
                              <div
                                key={problema}
                                className="flex items-center gap-1.5"
                              >
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>{problema}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {scheduleWarnings.length > 0 && (
                          <div className="p-2.5 bg-[var(--acc)]/10 -[var(--acc)]/30 rounded-[var(--r-s)] text-[var(--acc-ink)] text-xs font-sans mt-2 space-y-1">
                            {scheduleWarnings.map((aviso) => (
                              <div
                                key={aviso}
                                className="flex items-center gap-1.5"
                              >
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>{aviso}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* 4. Calendario de Publicaciones de la Banda List */}
              <div className={`${colors.card} p-5 space-y-4`}>
                <div
                  className={` pb-2 flex justify-between items-center `}
                >
                  <div>
                    <h3
                      className={`text-sm font-bold font-display flex items-center gap-1.5 text-[var(--acc)]`}
                    >
                      <Calendar className="w-4 h-4" /> Calendario de
                      Publicaciones de la Banda ({posts.length})
                    </h3>
                    <p className={`text-micro font-sans mt-1 ${textSub}`}>
                      Aquí puedes ver la parrilla de contenidos aprobada y
                      programada de {nombreBanda}.
                    </p>
                  </div>
                  <span
                    className={`text-micro font-sans px-2 py-0.5 rounded text-[var(--ink-2)] bg-[var(--bg)]`}
                  >
                    Live Database
                  </span>
                </div>

                {posts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <PublicoSilhouette opacity={0.12} size="small" />
                    <p className="mt-4 font-medium text-[var(--ink)] text-xs">
                      Sin publicaciones programadas
                    </p>
                    <p className="mt-2 text-[var(--ink-2)] text-xs max-w-xs">
                      Sube un vídeo y genera un clip viral para comenzar tu
                      campaña.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {[...posts].reverse().map((post) => (
                      <div
                        key={post.id}
                        className={` rounded-[var(--r-m)] p-3 flex flex-col md:flex-row justify-between gap-3 items-stretch transition-ui bg-[var(--bg)]/50 hover:bg-[var(--sunken)]`}
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-micro font-sans px-2 py-0.5 rounded font-bold ${
                                post.plataforma === "Instagram"
                                  ? "bg-[var(--acc)]/10 text-[var(--acc-ink)]"
                                  : post.plataforma === "TikTok"
                                    ? "bg-[var(--acc)]/10 text-[var(--acc-ink)]"
                                    : "bg-[var(--surface)]/80 text-[var(--ink)]"
                              }`}
                            >
                              {post.plataforma}
                            </span>
                            <span className="text-micro font-sans text-[var(--ink-2)] flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[var(--ink-2)]" />{" "}
                              {post.fecha}
                            </span>
                            <span className="text-micro font-sans px-1.5 py-0.5 rounded bg-[var(--surface)]/15 text-[var(--ok)] font-bold">
                              {post.estado}
                            </span>
                          </div>
                          <p
                            className={`text-xs line-clamp-3 leading-relaxed font-sans font-medium text-[var(--ink)]`}
                          >
                            {post.contenido}
                          </p>
                        </div>

                        <div
                          className={`flex md:flex-col justify-end items-end gap-2 md: md: pt-2.5 md:pt-0 md:pl-4 shrink-0 `}
                        >
                          <span className="text-micro font-sans text-[var(--ink-2)]">
                            Responsable:{" "}
                            {post.responsable || "Community Manager"}
                          </span>
                          <button
                            id={`delete-post-${post.id}`}
                            onClick={async () => {
                              if (
                                confirm(
                                  `¿Seguro que deseas eliminar esta publicación del calendario de ${nombreBanda}?`,
                                )
                              ) {
                                await onUpdatePost(post.id, {
                                  estado: "borrador",
                                }); // or we can handle direct deletion or mock update
                                alert(
                                  "Publicación desactivada/movida a borrador.",
                                );
                              }
                            }}
                            className="p-1 text-[var(--ink-2)] hover:text-[var(--alert)] transition-colors bg-transparent -none cursor-pointer"
                            title="Eliminar del calendario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: HIGH-FIDELITY PHONE PREVIEW MOCKUP (4 columns) */}
        <div
          className={`xl:col-span-4 rounded-[var(--r-m)] p-5 flex flex-col justify-between select-none ${colors.card}`}
        >
          <div className="space-y-3">
            <div className={` pb-2 `}>
              <h3 className={`text-xs font-sans text-[var(--acc)]`}>
                Vista previa en redes
              </h3>
              <p className="text-micro text-[var(--ink-2)] font-sans mt-0.5">
                Visualiza cómo se verá la copia y el contenido en directo
              </p>
            </div>

            <ReelsPhoneMockup
              colors={colors}
              activeTab={activeTab}
              selectedPlatform={selectedPlatform}
              nombreBanda={nombreBanda}
              instagramHandle={instagramHandle}
              phoneTitle={phoneTitle}
              phoneText={phoneText}
              phoneDuration={phoneDuration}
              inputType={inputType}
              youtubeUrl={youtubeUrl}
              localVideoUrl={localVideoUrl}
              renderedClipUrl={renderedClipUrl}
              renderedSubUrl={renderedSubUrl}
              renderedBurnedSubs={renderedBurnedSubs}
              subtitleCues={subtitleCues}
              currentSubtitleText={currentSubtitleText}
              setCurrentSubtitleText={setCurrentSubtitleText}
              setLocalVideoDuration={setLocalVideoDuration}
              isPreviewMuted={isPreviewMuted}
              setIsPreviewMuted={setIsPreviewMuted}
              isExpandedPreview={isExpandedPreview}
              setIsExpandedPreview={setIsExpandedPreview}
              showSafeZone={showSafeZone}
              setShowSafeZone={setShowSafeZone}
              ytLoopCount={ytLoopCount}
              simulatedTime={simulatedTime}
              highlights={highlights}
              selectedHighlightIndex={selectedHighlightIndex}
              videoMeta={videoMeta}
              isSeamlessLoop={isSeamlessLoop}
              isPunchInZoom={isPunchInZoom}
              activeSubtitleStyle={activeSubtitleStyle}
              showSpotifyBadge={showSpotifyBadge}
              showRetentionProgressBar={showRetentionProgressBar}
              showTourSticker={showTourSticker}
              tourStickerText={tourStickerText}
              uploadProgress={uploadProgress}
              handleSimulateUpload={handleSimulateUpload}
            />
          </div>
        </div>
      </div>

      {/* 🎬 MODO CINE / PREVISUALIZADOR EXPANDIDO MODULAR */}
      <ReelsTheaterModal
        isOpen={isExpandedPreview}
        onClose={() => setIsExpandedPreview(false)}
        colors={colors}
        nombreBanda={nombreBanda}
        instagramHandle={instagramHandle}
        bandName={bandName}
        selectedPlatform={selectedPlatform}
        setSelectedPlatform={setSelectedPlatform}
        phoneDuration={phoneDuration}
        inputType={inputType}
        youtubeUrl={youtubeUrl}
        localVideoUrl={localVideoUrl}
        renderedClipUrl={renderedClipUrl}
        renderedSubUrl={renderedSubUrl}
        renderedBurnedSubs={renderedBurnedSubs}
        renderedClipSize={renderedClipSize}
        renderedStoredPermanently={renderedStoredPermanently}
        sinTranscripcionReal={sinTranscripcionReal}
        subtitleCues={subtitleCues}
        currentSubtitleText={currentSubtitleText}
        setCurrentSubtitleText={setCurrentSubtitleText}
        wordOffsets={wordOffsets}
        isPreviewMuted={isPreviewMuted}
        setIsPreviewMuted={setIsPreviewMuted}
        showSafeZone={showSafeZone}
        ytLoopCount={ytLoopCount}
        setYtLoopCount={setYtLoopCount}
        simulatedTime={simulatedTime}
        setSimulatedTime={setSimulatedTime}
        timelineDuration={timelineDuration}
        highlights={highlights}
        setHighlights={setHighlights}
        selectedHighlightIndex={selectedHighlightIndex}
        videoMeta={videoMeta}
        editedCopy={editedCopy}
        setEditedCopy={setEditedCopy}
        copySuccess={copySuccess}
        handleCopyToClipboard={handleCopyToClipboard}
        copyForPlatform={copyForPlatform}
        cropMode={cropMode}
        setCropMode={setCropMode}
        burnSubtitles={burnSubtitles}
        setBurnSubtitles={setBurnSubtitles}
        karaokeSubtitles={karaokeSubtitles}
        setKaraokeSubtitles={setKaraokeSubtitles}
        isCuttingVideo={isCuttingVideo}
        cuttingProgressText={cuttingProgressText}
        cuttingError={cuttingError}
        handleCutPhysicalVideo={handleCutPhysicalVideo}
        handleAdjustCrop={handleAdjustCrop}
        setDraggingBoundary={setDraggingBoundary}
        scheduledDate={scheduledDate}
        setScheduledDate={setScheduledDate}
        scheduledTime={scheduledTime}
        setScheduledTime={setScheduledTime}
        optimalTime={optimalTime}
        isScheduling={isScheduling}
        schedulingSuccess={schedulingSuccess}
        scheduleErrors={scheduleErrors}
        scheduleWarnings={scheduleWarnings}
        handleSchedulePost={handleSchedulePost}
        platformIcons={PLATFORM_UI_ICONS}
      />

      {/* Modal de Tono de Expresión de la banda activa */}
      <BandToneModal
        isOpen={isBakandeyaToneModalOpen}
        onClose={() => setIsBakandeyaToneModalOpen(false)}
        band={{
          id: instagramHandle || "",
          nombre_banda: bandName || "Tu Banda",
          estilo_musical: "",
          localizacion: "",
          estado_relacion: "colegas_aliados",
          ultimo_contacto: "Hoy",
        }}
        toneData={bakandeyaToneData}
        isLoading={isAnalyzingBakandeyaTone}
        isSaved={toneAnalysisSaved}
        editable
        onSaved={(data) => {
          setBakandeyaToneData(data);
          setToneAnalysisSaved(true);
        }}
        onReAnalyze={handleAnalyzeBakandeyaTone}
        onRefreshLearnedRules={handleRefreshLearnedRules}
      />

      {/* Modal de Conexión de Cuentas Oficiales (1-Clic sin fricción) */}
      {showConnectModal && (
        <div className="fixed inset-0 z-[9999] bg-[var(--scrim)]/80 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[var(--sunken)] w-full max-w-md rounded-[var(--r-m)] p-6 space-y-5 text-left relative">
            <button
              onClick={() => setShowConnectModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-[var(--r-s)] text-[var(--ink-2)] hover:text-[var(--ink)] bg-[var(--surface)] hover:bg-[var(--sunken)] transition-ui cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[var(--acc-ink)]">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="text-sm font-bold font-mono text-[var(--ink)]">
                  Vincular cuenta oficial
                </h3>
              </div>
              <p className="text-xs text-[var(--ink-2)] font-sans">
                Conecta tu perfil oficial en 1 clic para publicar
                automáticamente a la hora que elijas y monitorizar las
                reproducciones sin contraseñas ni paneles raros.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-micro font-mono font-bold text-[var(--ink-2)] block">
                Nombre de usuario / Handle oficial:
              </label>
              <Input
                size="sm"
                type="text"
                value={connectHandleInput}
                onChange={(e) => setConnectHandleInput(e.target.value)}
                placeholder="@tubanda_oficial"
                className="w-full"
              />
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-micro font-mono font-bold text-[var(--ink-2)] block">
                Elige la red a vincular:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    id: "Instagram" as const,
                    name: "Instagram",
                    color: "hover:text-[var(--alert)] bg-[var(--alert)]/10",
                  },
                  {
                    id: "YouTube" as const,
                    name: "YouTube",
                    color: "hover:text-[var(--alert)] bg-[var(--alert)]/10",
                  },
                  {
                    id: "TikTok" as const,
                    name: "TikTok",
                    color: "hover:text-[var(--acc-ink)] bg-[var(--acc)]/10",
                  },
                ].map((plat) => (
                  <button
                    key={plat.id}
                    type="button"
                    disabled={connectingPlatform !== null}
                    onClick={() => handleConnectSocialAccount(plat.id)}
                    className={`p-3 rounded-[var(--r-s)] bg-[var(--sunken)]/80 text-xs font-mono font-bold text-center transition-ui cursor-pointer flex flex-col items-center gap-1.5 ${plat.color} active:scale-[0.97] disabled:opacity-50`}
                  >
                    {connectingPlatform === plat.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-[var(--acc-ink)]" />
                    ) : (
                      <Zap className="w-4 h-4 text-[var(--acc-ink)]" />
                    )}
                    <span>{plat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-[var(--sunken)]/80 rounded-[var(--r-s)] text-micro font-mono text-[var(--ink-2)] flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[var(--ok)] shrink-0 mt-0.5" />
              <span>
                Tus permisos se almacenan de forma cifrada y solo se usan para
                tus posts autorizados.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
