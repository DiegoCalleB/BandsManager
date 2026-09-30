import React, { useState, useEffect } from "react";
import {
  Heart,
  Check,
  Download,
  Tag,
  Loader2,
  PartyPopper,
  Shield,
  X,
  Flame,
  Music,
  Sparkles,
  Calendar,
  Briefcase,
  Mail,
  Phone,
  MessageCircle,
  Lock as LockIcon,
  ExternalLink,
  BookOpen,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Copy,
  Users,
  Headphones,
  MapPin,
  Share2,
  Play,
  Pause,
  Volume2,
  Ticket,
} from "lucide-react";
import {
  SocialPlatformsList,
  SocialLinks,
  PayPalLogo,
  BizumLogo,
} from "./SocialPlatformsList";
import { useFanFormLanguage } from "../hooks/useFanFormLanguage";
import {
  FAN_FORM_TRANSLATIONS,
  FAN_FORM_LANGUAGES,
  FanFormLanguage,
  interpolate,
  idiomasDisponiblesParaConcierto,
} from "../i18n/fansTranslations";
import { renderBold } from "../utils/richText";
import { safeUrl } from "../utils/safeUrl";
import { sanitizeConcertDisplayName } from "../utils/fanUtils";
import { ShowIcon } from './ui/ShowIcon';

import { Concert, EPKConfig, BandMember } from "../types";
import {
  getWhatsAppUrl,
  openWhatsAppChat,
  WHATSAPP_WINDOW_NAME,
} from "../utils/whatsapp";
import { decodeBandIdClient } from "../utils/bandHash";
import { Input, Textarea } from './ui';

export interface FansLandingProps {
  currentBandId?: string;
  currentBandName?: string;
  currentBandLogo?: string;
  isPreview?: boolean;
  previewLanguage?: FanFormLanguage;
  previewConfig?: Partial<EPKConfig>;
  previewConcert?: Concert | null;
  previewConcertName?: string;
  previewView?: "form" | "success";
  onClosePreview?: () => void;
}

const FlagIcon: React.FC<{ code: FanFormLanguage; className?: string }> = ({
  code,
  className = "w-4 h-3",
}) => {
  if (code === "es") {
    return (
      <svg
        className={`${className} rounded-xs object-cover shrink-0`}
        viewBox="0 0 640 480"
      >
        <path fill="#c60b1e" d="M0 0h640v480H0z" />
        <path fill="#ffc400" d="M0 120h640v240H0z" />
      </svg>
    );
  }
  if (code === "en") {
    return (
      <svg
        className={`${className} rounded-xs object-cover shrink-0`}
        viewBox="0 0 640 480"
      >
        <path fill="#012169" d="M0 0h640v480H0z" />
        <path
          fill="#fff"
          d="m75 0 245 180L565 0h75v55L415 240l225 185v55h-75L320 300 75 480H0v-55l225-185L0 55V0z"
        />
        <path
          fill="#c8102e"
          d="m425 240 215 175v25h-35L390 265zm-210 0L0 415v25h35l215-175zm210 0L640 65V40h-35L390 215zm-210 0L0 65V40h35l215 175z"
        />
        <path fill="#fff" d="M240 0v480h160V0zM0 160v160h640V160z" />
        <path fill="#c8102e" d="M270 0v480h100V0zM0 190v100h640V190z" />
      </svg>
    );
  }
  if (code === "it") {
    return (
      <svg
        className={`${className} rounded-xs object-cover shrink-0`}
        viewBox="0 0 640 480"
      >
        <path fill="#009246" d="M0 0h213.3v480H0z" />
        <path fill="#fff" d="M213.3 0h213.4v480H213.3z" />
        <path fill="#ce2b37" d="M426.7 0H640v480H426.7z" />
      </svg>
    );
  }
  if (code === "cs") {
    return (
      <svg
        className={`${className} rounded-xs object-cover shrink-0`}
        viewBox="0 0 640 480"
      >
        <path fill="#d7141a" d="M0 0h640v480H0z" />
        <path fill="#fff" d="M0 0h640v240H0z" />
        <path fill="#11457e" d="M0 0l320 240L0 480z" />
      </svg>
    );
  }
  return null;
};

const FanFormLanguageSwitcher: React.FC<{
  language: FanFormLanguage;
  onChange: (lang: FanFormLanguage) => void;
  languages: typeof FAN_FORM_LANGUAGES;
}> = ({ language, onChange, languages }) => (
  <div className="flex items-center justify-center gap-1.5">
    {languages.map((l) => (
      <button
        key={l.code}
        type="button"
        onClick={() => onChange(l.code)}
        title={l.label}
        className={`px-2.5 py-1.5 rounded-[var(--r-pill)] text-xs font-sans font-bold flex items-center gap-1.5 transition-ui cursor-pointer ${
          language === l.code
            ? "bg-[var(--acc)]/20  text-[var(--acc-ink)] scale-105"
            : "bg-[var(--surface)]/80 text-[var(--ink-2)] hover:hover:text-[var(--ink)] opacity-80 hover:opacity-100"
        }`}
      >
        <FlagIcon code={l.code} className="w-4 h-3 shrink-0" />
        <span className="">
          {l.code === "en" ? "GB" : l.code.toUpperCase()}
        </span>
      </button>
    ))}
  </div>
);

export const FansLanding: React.FC<FansLandingProps> = ({
  currentBandId: initialBandId,
  currentBandName: initialBandName,
  currentBandLogo: initialBandLogo,
  isPreview = false,
  previewLanguage,
  previewConfig,
  previewConcert,
  previewConcertName,
  previewView = "form",
  onClosePreview,
}) => {
  const [activeTab, setActiveTab] = useState<"redes" | "form">("redes");
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    ciudad: "",
    comoConocio: "",
    cancionFavorita: "",
    mensaje: "",
    instagram: "",
    consentimiento: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<any>(null);
  const [concertId, setConcertId] = useState("");
  const [concertName, setConcertName] = useState("");
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isConcertLink, setIsConcertLink] = useState(
    Boolean(previewConcert || previewConcertName),
  );
  const [language, setLanguage] = useFanFormLanguage(
    isPreview ? previewLanguage : undefined,
  );

  // El idioma"del concierto": el que trae el QR (o el de la previsualización), capturado una
  // sola vez al montar. A propósito NO seguimos a `language` según el fan va tocando el
  // selector: si es-tiquetara"English" en un show en Praga, tomar ahí el ancla habría hecho
  // desaparecer el checo del selector (es/en da solo 2 idiomas). El idioma de fondo del
  // concierto se queda fijo; solo decide QUÉ 2-3 banderas se ofrecen, no cuál está activa.
  const [conciertoLanguage, setConciertoLanguage] = useState<FanFormLanguage>(
    () => language,
  );
  const availableLanguages = FAN_FORM_LANGUAGES.filter((l) =>
    idiomasDisponiblesParaConcierto(conciertoLanguage).includes(l.code),
  ).sort(
    (a, b) =>
      idiomasDisponiblesParaConcierto(conciertoLanguage).indexOf(a.code) -
      idiomasDisponiblesParaConcierto(conciertoLanguage).indexOf(b.code),
  );

  // Sincronizar idioma si se proporciona en modo preview
  useEffect(() => {
    if (isPreview && previewLanguage && previewLanguage !== language) {
      setLanguage(previewLanguage);
    }
    if (isPreview && previewLanguage && previewLanguage !== conciertoLanguage) {
      setConciertoLanguage(previewLanguage);
    }
  }, [isPreview, previewLanguage]);

  // Si se solicita previsualizar directamente la pantalla de éxito
  useEffect(() => {
    if (isPreview && previewView === "success") {
      // La previsualización debe reflejar lo que el fan verá de verdad: si la banda no ha
      // rellenado descarga/cupón en el apartado QR, aquí tampoco se inventan (antes se colaban
      // los valores de Bakandeya y la banda creía tener un incentivo configurado).
      const inc = previewConfig?.incentivoFans || {
        mensajeAgradecimiento:
          "¡Gracias por unirte a nuestra comunidad oficial!",
      };
      setSuccessData({
        success: true,
        message: inc.mensajeAgradecimiento || "¡Bienvenido a la comunidad!",
        incentivo: inc,
        isSimulated: true,
      });
    } else if (isPreview && previewView === "form") {
      setSuccessData(null);
    }
  }, [isPreview, previewView, previewConfig]);

  const dict = FAN_FORM_TRANSLATIONS[language];
  const t = (
    key: keyof typeof dict,
    vars?: Record<string, string | undefined>,
  ) => (vars ? interpolate(dict[key], vars) : dict[key]);

  const [resolvedBandId, setResolvedBandId] = useState<string>("band-active");
  const [bandName, setBandName] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLinks | undefined>(
    undefined,
  );
  const [contactoBooking, setContactoBooking] = useState<{
    email?: string;
    telefono?: string;
  } | null>(null);
  const [donacionRevolut, setDonacionRevolut] = useState<{
    habilitado?: boolean;
    revolutTag?: string;
    revolutUrl?: string;
    paypalUser?: string;
    paypalUrl?: string;
    bizumTelefono?: string;
    ibanCuenta?: string;
    metodoPorDefecto?: "revolut" | "paypal" | "bizum" | "iban";
    titulo?: string;
    descripcion?: string;
  } | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "revolut" | "paypal" | "bizum" | "iban"
  >("revolut");
  const [copiedBizum, setCopiedBizum] = useState(false);
  const [miembros, setMiembros] = useState<BandMember[]>([]);
  const [upcomingConcerts, setUpcomingConcerts] = useState<Concert[]>([]);
  const [showAllConcerts, setShowAllConcerts] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [clickCounts, setClickCounts] = useState<Record<string, number>>({});
  const [audioPreviewConfig, setAudioPreviewConfig] = useState<{
    habilitado?: boolean;
    cancionId?: string;
    audioUrl?: string;
    tituloTema?: string;
    subtitulo?: string;
  } | null>(null);
  const [isPlayingAudioPreview, setIsPlayingAudioPreview] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const audioPreviewRef = React.useRef<HTMLAudioElement | null>(null);

  const toggleAudioPreview = () => {
    const targetAudioUrl = audioPreviewConfig?.audioUrl?.trim();
    if (!targetAudioUrl) {
      console.warn("No hay URL de audio configurada para reproducir.");
      return;
    }

    if (
      !audioPreviewRef.current ||
      audioPreviewRef.current.src !== targetAudioUrl
    ) {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      const audio = new Audio(targetAudioUrl);
      audio.onended = () => setIsPlayingAudioPreview(false);
      audioPreviewRef.current = audio;
    }
    if (isPlayingAudioPreview) {
      audioPreviewRef.current.pause();
      setIsPlayingAudioPreview(false);
    } else {
      audioPreviewRef.current
        .play()
        .then(() => {
          setIsPlayingAudioPreview(true);
          trackClick("audio_preview", "", "landing");
        })
        .catch((err) => {
          console.warn("Error playing audio preview:", err);
          setIsPlayingAudioPreview(false);
        });
    }
  };

  const handleShareWithFriend = async () => {
    const currentUrl =
      typeof window !== "undefined" ? window.location.href : "";
    const shareMessage = `¡Únete a la comunidad de ${bandName} para escuchar temas inéditos y conseguir descuentos exclusivos! 🎸 ${currentUrl}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Comunidad Oficial de ${bandName}`,
          text: `¡Únete a la comunidad de ${bandName} para escuchar temas inéditos y conseguir descuentos! 🎸`,
          url: currentUrl,
        });
        trackClick("share_native", currentUrl, "success");
        return;
      } catch (err) {
        // Fallback to clipboard copy if cancelled or unsupported
      }
    }

    try {
      await navigator.clipboard.writeText(shareMessage);
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 2500);
      trackClick("share_copy", currentUrl, "success");
    } catch {}
  };

  const trackClick = (platform: string, url?: string, context?: string) => {
    const key = platform.toLowerCase();
    setClickCounts((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
    try {
      fetch("/api/public/track-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          band_id: resolvedBandId,
          platform: key,
          button_type: key,
          concert_id: concertId || previewConcert?.id || undefined,
          concert_date: previewConcert?.fecha || undefined,
          context: context || (activeTab === "form" ? "form" : "redes"),
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {}
  };

  useEffect(() => {
    if (isPreview && previewConfig) {
      // Sin esto, resolvedBandId se quedaba en el valor inicial'band-bakandeya' durante toda
      // la previsualización (el resto de estado sí se pisa con los datos de la banda real más
      // abajo) — y el enlace al Dossier/EPK, que se construye a partir de resolvedBandId, llevaba
      // a cualquier banda que abriera"Previsualizar Formulario" al EPK público de Bakandeya.
      if (initialBandId) setResolvedBandId(initialBandId);
      if (initialBandName) setBandName(initialBandName);
      if (initialBandLogo || previewConfig.logoUrl) {
        setLogoUrl(initialBandLogo || previewConfig.logoUrl || null);
      }
      if (
        previewConfig.enlacesRedes &&
        Object.keys(previewConfig.enlacesRedes).length > 0
      ) {
        setSocialLinks(previewConfig.enlacesRedes);
      }
      if (previewConfig.contactoBooking) {
        setContactoBooking({
          email: previewConfig.contactoBooking.email,
          telefono: previewConfig.contactoBooking.telefono,
        });
      }
      if (previewConfig.donacionRevolut) {
        setDonacionRevolut(previewConfig.donacionRevolut);
        if (previewConfig.donacionRevolut.metodoPorDefecto) {
          setSelectedPaymentMethod(
            previewConfig.donacionRevolut.metodoPorDefecto,
          );
        }
      }
      if (previewConfig.audioPreview) {
        setAudioPreviewConfig(previewConfig.audioPreview);
      }
      if (previewConfig.miembros && Array.isArray(previewConfig.miembros)) {
        setMiembros(previewConfig.miembros);
      }
      if (previewConcert) {
        setConcertId(previewConcert.id);
        setConcertName(
          sanitizeConcertDisplayName(
            `${previewConcert.sala} (${previewConcert.ciudad})`,
          ),
        );
        setIsConcertLink(true);
      } else if (previewConcertName) {
        setConcertName(sanitizeConcertDisplayName(previewConcertName));
        setIsConcertLink(true);
      }
      return;
    }

    // 1. Determine active band ID from URL, props or localStorage
    const params = new URLSearchParams(window.location.search);
    const rawQuery =
      params.get("b") ||
      params.get("t") ||
      params.get("token") ||
      params.get("band_id") ||
      params.get("band");
    const queryBand = rawQuery ? decodeBandIdClient(rawQuery) : "";

    let storedBandId = "";
    let storedBandName = "";
    let storedBandLogo = "";
    try {
      const storedUser =
        localStorage.getItem("bakandeya_user") ||
        localStorage.getItem("band_manager_user") ||
        localStorage.getItem("band_manager_current_user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        storedBandId = parsed.band_id || parsed.bandId || "";
        storedBandName = parsed.bandName || parsed.name || "";
        storedBandLogo = parsed.logoUrl || parsed.logo_url || "";
      }
      if (!storedBandId) {
        storedBandId =
          localStorage.getItem("band_manager_active_band_id") || "";
      }
    } catch {}

    // Priority: 1. URL query param, 2. Props (if explicitly passed and differs from generic), 3. Logged-in stored user.
    const targetBandId = (
      queryBand ||
      initialBandId ||
      storedBandId ||
      ""
    ).toLowerCase();
    const cleanId = targetBandId.replace(/^(band|reg)-/, "");
    setResolvedBandId(targetBandId);

    // Initial fallback name & logo
    if (cleanId === "bakandeya") {
      setBandName("Bakandeya");
      setLogoUrl("/logo_bakandeya.jpg");
      setSocialLinks(undefined);
      setContactoBooking(null);
      setMiembros([]);
    } else if (queryBand) {
      const formatted = cleanId
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      setBandName(formatted);
      setLogoUrl(null);
      setSocialLinks(undefined);
      setContactoBooking(null);
      setMiembros([]);
    } else if (
      initialBandName &&
      !initialBandName.toLowerCase().includes("bakandeya")
    ) {
      setBandName(initialBandName);
      if (initialBandLogo) setLogoUrl(initialBandLogo);
      setMiembros([]);
    } else if (storedBandName && cleanId !== "bakandeya") {
      setBandName(storedBandName);
      if (storedBandLogo) setLogoUrl(storedBandLogo);
      setMiembros([]);
    } else if (cleanId) {
      const formatted = cleanId
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      setBandName(formatted);
      setLogoUrl(null);
      setMiembros([]);
    } else {
      setBandName("");
      setLogoUrl(null);
      setMiembros([]);
    }

    // 2. Fetch public EPK details for this specific band
    fetch(`/api/public/epk?band_id=${encodeURIComponent(targetBandId)}`)
      .then((res) =>
        res.ok && res.headers.get("content-type")?.includes("application/json")
          ? res.json().catch(() => null)
          : null,
      )
      .then((data) => {
        if (data) {
          if (data.bandName) setBandName(data.bandName);
          if (data.logoUrl || data.epkConfig?.logoUrl) {
            setLogoUrl(data.logoUrl || data.epkConfig.logoUrl);
            setImgError(false);
          } else if (cleanId === "bakandeya") {
            setLogoUrl("/logo_bakandeya.jpg");
            setImgError(false);
          } else {
            setLogoUrl(null);
          }

          if (
            data.epkConfig?.enlacesRedes &&
            Object.keys(data.epkConfig.enlacesRedes).length > 0
          ) {
            setSocialLinks(data.epkConfig.enlacesRedes);
          }

          if (data.epkConfig?.contactoBooking) {
            setContactoBooking({
              email: data.epkConfig.contactoBooking.email,
              telefono: data.epkConfig.contactoBooking.telefono,
            });
          }

          if (
            data.epkConfig?.miembros &&
            Array.isArray(data.epkConfig.miembros) &&
            data.epkConfig.miembros.length > 0
          ) {
            setMiembros(data.epkConfig.miembros);
          } else {
            setMiembros([]);
          }

          if (data.epkConfig?.donacionRevolut) {
            setDonacionRevolut(data.epkConfig.donacionRevolut);
            if (data.epkConfig.donacionRevolut.metodoPorDefecto) {
              setSelectedPaymentMethod(
                data.epkConfig.donacionRevolut.metodoPorDefecto,
              );
            }
          } else if (
            data.epkConfig?.enlacesRedes?.revolut ||
            data.epkConfig?.enlacesRedes?.paypal ||
            data.epkConfig?.enlacesRedes?.bizum
          ) {
            const rawRev = data.epkConfig.enlacesRedes.revolut?.trim();
            const revUrl = rawRev
              ? rawRev.startsWith("http")
                ? rawRev
                : `https://revolut.me/${rawRev.replace(/^@/, "").replace(/^revolut\.me\//, "")}`
              : undefined;
            const rawPay = data.epkConfig.enlacesRedes.paypal?.trim();
            const payUrl = rawPay
              ? rawPay.startsWith("http")
                ? rawPay
                : `https://paypal.me/${rawPay.replace(/^@/, "").replace(/^paypal\.me\//, "")}`
              : undefined;
            const rawBiz = data.epkConfig.enlacesRedes.bizum?.trim();
            setDonacionRevolut({
              habilitado: true,
              revolutUrl: revUrl,
              revolutTag: rawRev
                ? rawRev
                    .replace(/^https?:\/\//, "")
                    .replace(/^revolut\.me\//, "")
                    .replace(/^@/, "")
                : undefined,
              paypalUrl: payUrl,
              paypalUser: rawPay
                ? rawPay
                    .replace(/^https?:\/\//, "")
                    .replace(/^paypal\.me\//, "")
                    .replace(/^@/, "")
                : undefined,
              bizumTelefono: rawBiz,
              metodoPorDefecto: revUrl
                ? "revolut"
                : payUrl
                  ? "paypal"
                  : "bizum",
            });
          } else {
            setDonacionRevolut(null);
          }

          if (data.epkConfig?.audioPreview) {
            setAudioPreviewConfig(data.epkConfig.audioPreview);
          } else if (
            data.highlightedSongs &&
            data.highlightedSongs.length > 0
          ) {
            const songWithAudio = data.highlightedSongs.find(
              (s: any) =>
                s.audioPrincipalUrl ||
                (s.audioIdeas && s.audioIdeas[0]?.audioUrl),
            );
            if (songWithAudio) {
              setAudioPreviewConfig({
                habilitado: true,
                cancionId: songWithAudio.id,
                tituloTema: songWithAudio.titulo,
                subtitulo: "Dale al play para escuchar cómo sonamos",
                audioUrl:
                  songWithAudio.audioPrincipalUrl ||
                  (songWithAudio.audioIdeas &&
                    songWithAudio.audioIdeas[0]?.audioUrl) ||
                  "",
              });
            }
          }

          if (data.upcomingConcerts && Array.isArray(data.upcomingConcerts)) {
            setUpcomingConcerts(data.upcomingConcerts);
          }
        }
      })
      .catch((err) => {
        console.warn("Could not fetch EPK data for fans landing:", err);
      });
  }, [initialBandId, initialBandName, initialBandLogo]);

  useEffect(() => {
    const pathParts = window.location.pathname.split("/").filter(Boolean);
    let slug = "";

    if (pathParts.length > 1) {
      slug = pathParts[1];
    } else if (
      pathParts.length === 1 &&
      !["unete", "fans", "directo", "bakandeya", "app"].includes(pathParts[0])
    ) {
      slug = pathParts[0];
    }

    // Solo asumimos"vengo de un concierto" cuando el enlace realmente identifica uno
    // (slug de concierto o parámetros concertId/concertName en la URL). Un enlace genérico
    // (/unete, /fans, bio de Instagram...) no debe precontestar"¿Cómo nos conociste?" ni
    // mostrar el mensaje de"gracias por venir al concierto".
    if (slug && slug !== "directo") {
      const formattedName = slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      setConcertName(sanitizeConcertDisplayName(formattedName));
      setFormData((prev) => ({ ...prev, comoConocio: "Concierto" }));
      setIsConcertLink(true);
    }

    const params = new URLSearchParams(window.location.search);
    const cid = params.get("concertId");
    const cname = params.get("concertName");

    if (cid) setConcertId(cid);
    if (cname) {
      setConcertName(sanitizeConcertDisplayName(cname));
      setFormData((prev) => ({ ...prev, comoConocio: "Concierto" }));
      setIsConcertLink(true);
    }
  }, []);

  // safeUrl() al final: donacionRevolut.revolutUrl/paypalUrl es texto libre editado por el admin
  // de la banda y se renderiza como href en esta página pública sin sesión — sin filtrar el
  // esquema, un valor tipo"javascript:..." se ejecutaría en el navegador de cualquier fan.
  const rawRevolutTag =
    donacionRevolut?.revolutTag
      ?.replace(/^@/, "")
      .replace(/^revolut\.me\//i, "")
      .trim() || "";
  const rawRevolutUrl = donacionRevolut?.revolutUrl?.trim() || "";
  const rawSocialRevolut = socialLinks?.revolut?.trim() || "";
  const revolutUrl =
    safeUrl(
      rawRevolutUrl ||
        (rawRevolutTag
          ? rawRevolutTag.startsWith("http")
            ? rawRevolutTag
            : `https://revolut.me/${rawRevolutTag}`
          : "") ||
        (rawSocialRevolut
          ? rawSocialRevolut.startsWith("http")
            ? rawSocialRevolut
            : `https://revolut.me/${rawSocialRevolut.replace(/^@/, "").replace(/^revolut\.me\//i, "")}`
          : ""),
    ) || "";

  const rawPaypalUser =
    donacionRevolut?.paypalUser
      ?.replace(/^@/, "")
      .replace(/^paypal\.me\//i, "")
      .trim() || "";
  const rawPaypalUrl = donacionRevolut?.paypalUrl?.trim() || "";
  const rawSocialPaypal = socialLinks?.paypal?.trim() || "";
  const paypalUrl =
    safeUrl(
      rawPaypalUrl ||
        (rawPaypalUser
          ? rawPaypalUser.startsWith("http")
            ? rawPaypalUser
            : `https://paypal.me/${rawPaypalUser}`
          : "") ||
        (rawSocialPaypal
          ? rawSocialPaypal.startsWith("http")
            ? rawSocialPaypal
            : `https://paypal.me/${rawSocialPaypal.replace(/^@/, "").replace(/^paypal\.me\//i, "")}`
          : ""),
    ) || "";

  const bizumPhone = (
    donacionRevolut?.bizumTelefono ||
    socialLinks?.bizum ||
    ""
  ).trim();

  const rawHandle = revolutUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const revolutDisplay =
    rawHandle || (rawRevolutTag ? `revolut.me/${rawRevolutTag}` : "");

  const rawPaypalHandle = paypalUrl
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  const paypalDisplay =
    rawPaypalHandle || (rawPaypalUser ? `paypal.me/${rawPaypalUser}` : "");

  const hasRevolut = Boolean(revolutUrl);
  const hasPaypal = Boolean(paypalUrl);
  const hasBizum = Boolean(bizumPhone);

  const handleCopyBizum = (contextType: string) => {
    if (!bizumPhone) return;
    const cleanPhone = bizumPhone.replace(/[\s-]/g, "");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(cleanPhone).catch(() => {});
    }
    setCopiedBizum(true);
    trackClick("bizum", `bizum:${cleanPhone}`, contextType);
    setTimeout(() => setCopiedBizum(false), 3500);
  };

  // El Dossier/EPK público, mismo patrón de URL que usa EPKManager.tsx: a diferencia de
  // Revolut/PayPal, este enlace no depende de que la banda lo configure, siempre existe.
  // Lleva &lang= con el idioma del concierto: así quien entra al EPK desde un Únete de Italia
  // lo ve en italiano por defecto, no en español. EpkLanguage y FanFormLanguage comparten
  // exactamente los mismos códigos (es/en/it/cs), así que conciertoLanguage vale tal cual.
  const epkUrl = `https://bandmanager.io/epk?band=${encodeURIComponent(resolvedBandId)}&lang=${encodeURIComponent(conciertoLanguage)}`;

  const renderRevolutCard = (
    contextType: "redes" | "form" | "success" = "redes",
  ) => {
    if (
      (!revolutUrl && !paypalUrl && !hasBizum) ||
      donacionRevolut?.habilitado === false
    )
      return null;

    const isSuccessScreen = contextType === "success";
    const isFormScreen = contextType === "form";

    const customTitle = donacionRevolut?.titulo?.trim();
    const isDefaultSpanishTitle =
      !customTitle ||
      customTitle === "Colabora con una aportación económica" ||
      customTitle === "Colabora con la banda" ||
      customTitle === "Apoyo Económico & Donaciones";

    const label =
      language === "es" && !isDefaultSpanishTitle
        ? customTitle
        : isSuccessScreen
          ? t("revolutSuccessPrompt", { bandName })
          : t("economicSupportTitle", { bandName });

    const customDesc = donacionRevolut?.descripcion?.trim();
    const isDefaultSpanishDesc =
      !customDesc ||
      customDesc.includes("Tu aportación directa nos ayuda a financiar") ||
      customDesc.includes("financiar furgoneta de gira");

    const descText =
      language === "es" && !isDefaultSpanishDesc
        ? customDesc
        : isSuccessScreen
          ? t("revolutSuccessPrompt", { bandName })
          : t("economicSupportSubtitle");

    const revolutClicks = clickCounts["revolut"] || 0;
    const paypalClicks = clickCounts["paypal"] || 0;
    const bizumClicks = clickCounts["bizum"] || 0;
    const totalClicks = revolutClicks + paypalClicks + bizumClicks;

    const preferredMethodSetting =
      (donacionRevolut?.metodoPorDefecto as "revolut" | "paypal" | "bizum") ||
      "revolut";

    // Lista de métodos disponibles
    const availableMethods: Array<"revolut" | "paypal" | "bizum"> = [];
    if (hasRevolut) availableMethods.push("revolut");
    if (hasPaypal) availableMethods.push("paypal");
    if (hasBizum) availableMethods.push("bizum");

    const primaryMethod = availableMethods.includes(preferredMethodSetting)
      ? preferredMethodSetting
      : availableMethods[0];

    const secondaryMethods = availableMethods.filter(
      (m) => m !== primaryMethod,
    );

    const renderPaymentButton = (
      method: "revolut" | "paypal" | "bizum",
      variant: "full" | "half",
    ) => {
      const isFull = variant === "full";
      if (method === "revolut") {
        return (
          <a
            key={`revolut-${variant}`}
            href={revolutUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClick("revolut", revolutUrl, contextType)}
            className={`group relative w-full flex items-center justify-center ${isFull ? "gap-3.5 p-4 min-h-[64px]" : "gap-2 px-2.5 py-2 min-h-[42px] sm:min-h-[44px]"} rounded-[var(--r-m)] bg-[var(--surface)] hover:bg-[var(--surface)]  transition-ui duration-200 ease-out text-center active:scale-[0.97] cursor-pointer overflow-hidden`}
          >
            <div
              className={`${isFull ? "w-8 h-8 sm:w-9 sm:h-9 p-1.5" : "w-6 h-6 p-1"} rounded-[var(--r-s)] bg-[var(--sunken)] text-[var(--ink)] flex items-center justify-center shrink-0 shadow transition-transform`}
            >
              <svg
                className="w-full h-full fill-[var(--ink)]"
                viewBox="0 0 24 24"
              >
                <path d="M18.72 9.24c-.06-.5-.2-.98-.44-1.42a4.43 4.43 0 0 0-1.12-1.3A4.78 4.78 0 0 0 15.5 5.6c-.63-.23-1.3-.35-1.98-.35H6.28v2.75h7.24c.72 0 1.39.28 1.9.79.5.5.79 1.18.79 1.9 0 .73-.29 1.4-.79 1.91-.51.5-1.18.78-1.9.78h-3.3v2.8h2.64l4.28 7.82h3.28l-4.14-7.57a4.93 4.93 0 0 0 2.94-4.23zM6.28 10.3v13.7h2.75V10.3H6.28z" />
              </svg>
            </div>
            <div className="text-center min-w-0">
              <span
                className={`${isFull ? "text-sm sm:text-base" : "text-xs"} font-extrabold text-[var(--ink)] group-hover:text-[var(--acc)]/70 transition-colors block truncate leading-tight`}
              >
                Revolut
              </span>
              <span
                className={`${isFull ? "text-xs" : "text-micro"} text-[var(--ink-2)] font-sans block truncate group-hover:text-[var(--ink-2)] leading-tight`}
              >
                {revolutDisplay.replace(/^revolut\.me\//, "@")}
              </span>
            </div>
          </a>
        );
      }

      if (method === "paypal") {
        return (
          <a
            key={`paypal-${variant}`}
            href={paypalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClick("paypal", paypalUrl, contextType)}
            className={`group relative w-full flex items-center justify-center ${isFull ? "gap-3.5 p-4 min-h-[64px]" : "gap-2 px-2.5 py-2 min-h-[42px] sm:min-h-[44px]"} rounded-[var(--r-m)] bg-[var(--surface)] hover:bg-[var(--sunken)] transition-ui duration-200 ease-out text-center active:scale-[0.97] cursor-pointer overflow-hidden`}
          >
            <div
              className={`${isFull ? "w-8 h-8 sm:w-9 sm:h-9 p-1.5" : "w-6 h-6 p-1"} rounded-[var(--r-s)] bg-[var(--sunken)] text-[#003087] flex items-center justify-center shrink-0 shadow transition-transform`}
            >
              <PayPalLogo className="w-full h-full" />
            </div>
            <div className="text-center min-w-0">
              <span
                className={`${isFull ? "text-sm sm:text-base" : "text-xs"} font-extrabold text-[var(--ink)] group-hover:text-[var(--acc)]/70 transition-colors block truncate leading-tight`}
              >
                PayPal
              </span>
              <span
                className={`${isFull ? "text-xs" : "text-micro"} text-[var(--tentative)] font-sans block truncate group-hover:text-[var(--ink)] leading-tight`}
              >
                {paypalDisplay.replace(/^paypal\.me\//, "@")}
              </span>
            </div>
          </a>
        );
      }

      if (method === "bizum") {
        return (
          <button
            key={`bizum-${variant}`}
            type="button"
            onClick={() => handleCopyBizum(contextType)}
            className={`group relative w-full flex items-center justify-center ${isFull ? "gap-3.5 p-4 min-h-[64px]" : "gap-2 px-2.5 py-2 min-h-[42px] sm:min-h-[44px]"} rounded-[var(--r-m)] bg-[var(--ok-soft)] hover:bg-[var(--ok)]/20 transition-ui duration-200 ease-out text-center active:scale-[0.97] cursor-pointer overflow-hidden`}
          >
            <div
              className={`${isFull ? "w-8 h-8 sm:w-9 sm:h-9 p-1.5" : "w-6 h-6 p-1"} rounded-[var(--r-s)] bg-[var(--ok)] text-[var(--on-ok)] flex items-center justify-center shrink-0 shadow font-bold transition-transform`}
            >
              <BizumLogo className="w-full h-full" />
            </div>
            <div className="text-center min-w-0">
              <span
                className={`${isFull ? "text-sm sm:text-base" : "text-xs"} font-extrabold text-[var(--ink)] group-hover:text-[var(--ink)] transition-colors block truncate leading-tight`}
              >
                Bizum
              </span>
              <span
                className={`${isFull ? "text-xs" : "text-micro"} text-[var(--ok)] font-sans block truncate group-hover:text-[var(--ink-2)] leading-tight`}
              >
                {bizumPhone}
              </span>
            </div>
            {isFull && (
              <span className="p-1.5 rounded-[var(--r-s)] bg-[var(--ok)]/20 text-[var(--ink)] shrink-0">
                <Copy className="w-3.5 h-3.5" />
              </span>
            )}
          </button>
        );
      }

      return null;
    };

    return (
      <div
        className={
          isSuccessScreen ? "pt-3 text-left" : isFormScreen ? "pt-2" : "pt-1.5"
        }
      >
        <div className="relative rounded-[var(--r-l)] bg-[var(--surface)]/95   p-3.5 sm:p-4 transition-ui duration-300 text-left overflow-hidden">
          {/* Halo ambiental sutil */}
          <div
            className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-[var(--r-pill)] bg-[var(--acc)]/10 blur-2xl"
            aria-hidden="true"
          />

          {/* Cabecera de la tarjeta: Screenshot / Imagen + Título + Badge */}
          <div className="relative flex items-start gap-3 sm:gap-3.5">
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-[var(--r-m)] overflow-hidden bg-[var(--surface)] flex items-center justify-center shrink-0 transition-transform">
              <img
                src="/Screenshot_20260824_164054_Google.jpg"
                alt={t("revolutBadge") || "Colaboración"}
                className="w-full h-full object-cover scale-110 transition-transform duration-300"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-[var(--ink)] tracking-tight leading-snug">
                  {label}
                </h3>
                <span className="text-micro font-sans px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc)]/15 text-[var(--acc-ink)] font-bold shrink-0">
                  {t("revolutBadge") || "Contribución"}
                </span>
              </div>
              <p className="text-xs text-[var(--ink-2)]/90 leading-relaxed mt-1">
                {descText}
              </p>
            </div>
          </div>

          {/* Notificación de Bizum Copiado */}
          {copiedBizum && (
            <div className="mt-2.5 p-2.5 rounded-[var(--r-m)] bg-[var(--ok)]/20 text-[var(--ink)] text-xs font-sans flex items-center gap-2 animate-fade-in">
              <Check className="w-4 h-4 text-[var(--ok)] shrink-0" />
              <span className="font-bold">
                {t("bizumCopiedNotification", { phone: bizumPhone }) ||
                  `¡Teléfono de Bizum (${bizumPhone}) copiado! Abre tu banco para enviarlo.`}
              </span>
            </div>
          )}

          {/* Botones de Pasarelas / Métodos de Pago */}
          <div className="pt-3">
            {availableMethods.length === 1 &&
              renderPaymentButton(availableMethods[0], "full")}

            {availableMethods.length === 2 && (
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {availableMethods.map((m) => renderPaymentButton(m, "half"))}
              </div>
            )}

            {availableMethods.length === 3 && (
              <div className="space-y-2.5">
                {primaryMethod && renderPaymentButton(primaryMethod, "full")}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  {secondaryMethods.map((m) => renderPaymentButton(m, "half"))}
                </div>
              </div>
            )}
          </div>

          {/* Pie de seguridad y métricas */}
          <div className="pt-2.5 flex items-center justify-between text-micro text-[var(--ink-2)]">
            <span className="flex items-center gap-1">
              <LockIcon className="w-3 h-3 text-[var(--ink-2)] shrink-0" />
              <span>
                {t("revolutSecureDirect") ||
                  "Pago seguro y directo a la banda · Sin intermediarios"}
              </span>
            </span>
            {totalClicks > 0 && (
              <span className="text-micro font-sans text-[var(--ink-2)] bg-[var(--surface)] px-1.5 py-0.5 rounded">
                {totalClicks}{" "}
                {totalClicks === 1 ? t("clickSingular") : t("clickPlural")}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.email || !formData.consentimiento) {
      setError(t("errorRequiredFields"));
      return;
    }

    setLoading(true);
    setError("");

    // En modo simulación / preview dentro de la app, simulamos el registro con éxito sin ensuciar la base de datos real
    if (isPreview) {
      setTimeout(() => {
        setLoading(false);
        const inc = previewConfig?.incentivoFans || {
          mensajeAgradecimiento:
            "¡Gracias por unirte a nuestra comunidad oficial!",
        };
        setSuccessData({
          success: true,
          message: inc.mensajeAgradecimiento || "¡Bienvenido a la comunidad!",
          incentivo: inc,
          isSimulated: true,
        });
      }, 400);
      return;
    }

    try {
      const res = await fetch("/api/public/fans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          band_id: resolvedBandId,
          nombre: formData.nombre,
          email: formData.email,
          ciudad: formData.ciudad,
          comoConocio: formData.comoConocio,
          cancionFavorita: formData.cancionFavorita,
          mensaje: formData.mensaje,
          instagram: formData.instagram,
          conciertoOrigenId: concertId,
          conciertoOrigenNombre: concertName,
          consentimientoRGPD: formData.consentimiento,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("errorGenericSignup"));

      setSuccessData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    const incentivo = successData.incentivo || {};
    // Solo hay bloque de beneficios si la banda ha rellenado de verdad la descarga o el cupón
    // en el apartado QR; una cadena vacía o con espacios no cuenta como incentivo configurado.
    const enlaceDescargaFan = safeUrl(
      typeof incentivo.enlaceDescarga === "string"
        ? incentivo.enlaceDescarga.trim()
        : "",
    );
    const codigoDescuentoFan =
      typeof incentivo.codigoDescuento === "string"
        ? incentivo.codigoDescuento.trim()
        : "";
    const tieneBeneficios = Boolean(enlaceDescargaFan || codigoDescuentoFan);

    return (
      <div
        className={`${isPreview ? "min-h-full p-2 sm:p-4" : "min-h-screen p-4 pt-8 sm:items-center sm:pt-4"} bg-[var(--bg)] flex items-start justify-center`}
      >
        <div
          className={`max-w-md w-full bg-[var(--surface)] rounded-[var(--r-l)] ${isPreview ? "p-4 sm:p-6" : "p-6 sm:p-8"} text-center space-y-5 relative overflow-hidden`}
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-[var(--acc)] " />

          {isPreview && (
            <div className="p-2 rounded-[var(--r-m)] bg-[var(--acc)]/15 text-[var(--acc-ink)] text-xs font-sans flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-[var(--acc)]" />
                {t("interactiveSimulation")}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSuccessData(null);
                  setFormData({
                    nombre: "",
                    email: "",
                    ciudad: "",
                    comoConocio: isConcertLink ? "Concierto" : "",
                    cancionFavorita: "",
                    mensaje: "",
                    instagram: "",
                    consentimiento: false,
                  });
                }}
                className="text-[var(--acc)] hover:text-[var(--ink)] underline font-bold"
              >
                {t("backToForm")}
              </button>
            </div>
          )}

          <div className="w-20 h-20 bg-[var(--acc)]/10 rounded-[var(--r-pill)] flex items-center justify-center mx-auto mb-2">
            <Heart className="w-10 h-10 text-[var(--acc)]" />
          </div>

          <FanFormLanguageSwitcher
            language={language}
            onChange={setLanguage}
            languages={availableLanguages}
          />

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[var(--ink)] font-display flex items-center justify-center gap-2">
              <PartyPopper className="w-6 h-6 text-[var(--acc)]" />
              {t("welcomeTitle", { bandName })}
            </h2>
            <p className="text-[var(--ink-2)] font-sans text-sm leading-relaxed max-w-xs mx-auto">
              {successData.alreadyRegistered
                ? successData.message
                : (incentivo.mensajeAgradecimiento && language === "es") ||
                    !t("registeredDefaultMessage", { bandName })
                  ? incentivo.mensajeAgradecimiento ||
                    t("registeredDefaultMessage", { bandName })
                  : t("registeredDefaultMessage", { bandName })}
            </p>
          </div>

          {tieneBeneficios && (
            <div className="bg-[var(--sunken)] rounded-[var(--r-m)] p-6 mt-6 space-y-4">
              <h3 className="text-[var(--acc)] font-bold text-xs font-sans">
                {t("benefitsTitle")}
              </h3>

              {enlaceDescargaFan && (
                <div className="pt-2">
                  <a
                    href={enlaceDescargaFan}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center gap-2 w-full p-3 bg-[var(--surface)] hover:bg-[var(--surface)]/80 rounded-[var(--r-s)] text-[var(--ink)] font-sans text-xs transition-colors"
                  >
                    <Download className="w-5 h-5 text-[var(--acc)]" />
                    <span className="font-bold">{t("downloadExclusive")}</span>
                  </a>
                </div>
              )}

              {codigoDescuentoFan && (
                <div className="pt-2">
                  <p className="text-micro text-[var(--ink-2)] font-bold mb-1">
                    {t("merchCode")}
                  </p>
                  <div className="flex items-center justify-center gap-2 p-3 bg-[var(--surface)] rounded-[var(--r-s)]">
                    <Tag className="w-4 h-4 text-[var(--ok)]" />
                    <span className="font-sans text-[var(--ok)] font-bold">
                      {codigoDescuentoFan}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* COMPARTIR CON UN AMIGO */}
          <div className="bg-[var(--sunken)] rounded-[var(--r-m)] p-4 text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans font-bold text-[var(--acc)] flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" />{" "}
                {t("shareWithFriend") || "Pásaselo a un colega"}
              </span>
            </div>
            <p className="text-xs text-[var(--ink-2)] font-sans leading-relaxed">
              {t("shareCardPrompt") ||
                "¿Conoces a alguien a quien le mole la buena música? Comparte este enlace directo para que también disfrute de los temas exclusivos."}
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleShareWithFriend}
                className="py-2.5 px-3 rounded-[var(--r-pill)] bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] font-sans font-bold text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-[0.97]"
              >
                {copiedShareLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[var(--ink)]" />{" "}
                    {t("shareCopied") || "¡Copiado!"}
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-[var(--ink)]" />{" "}
                    {t("shareWithFriend") || "Compartir"}
                  </>
                )}
              </button>
              <a
                href={getWhatsAppUrl(
                  undefined,
                  t("whatsappShareMessage", {
                    bandName,
                    url:
                      typeof window !== "undefined" ? window.location.href : "",
                  }) ||
                    `¡Ey! Échale un ojo a ${bandName} y únete a su comunidad para conseguir temas inéditos y descuentos: ${typeof window !== "undefined" ? window.location.href : ""}`,
                )}
                target={WHATSAPP_WINDOW_NAME}
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  trackClick("whatsapp_share", "", "success");
                  const msg =
                    t("whatsappShareMessage", {
                      bandName,
                      url:
                        typeof window !== "undefined"
                          ? window.location.href
                          : "",
                    }) ||
                    `¡Ey! Échale un ojo a ${bandName} y únete a su comunidad para conseguir temas inéditos y descuentos: ${typeof window !== "undefined" ? window.location.href : ""}`;
                  openWhatsAppChat(undefined, msg);
                }}
                className="py-2.5 px-3 rounded-[var(--r-s)] bg-[var(--ok)] hover:brightness-95 text-[var(--on-ok)] font-sans font-bold text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-[0.97] text-center"
              >
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
            </div>
          </div>

          {/* Official Social Links in Success View */}
          {socialLinks && Object.values(socialLinks).some(Boolean) && (
            <div className="pt-2">
              <SocialPlatformsList
                links={socialLinks}
                variant="grid"
                title={t("followUsPlatforms")}
                language={language}
                onPlatformClick={(plat, url) =>
                  trackClick(plat, url, "success")
                }
                clickCounts={clickCounts}
                showClickCounts={true}
              />
            </div>
          )}

          {/* Enlace discreto al EPK/Dossier, ahora que ya se han unido */}
          <div className="pt-1 text-center">
            <a
              href={epkUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick("epk", epkUrl, "success")}
              className="text-xs font-sans text-[var(--acc)]/90 hover:text-[var(--acc)]/70 underline font-bold transition-colors inline-flex items-center gap-1"
            >
              {t("epkSuccessLink", { bandName })}{" "}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Revolut Support in Success View */}
          {renderRevolutCard("success")}

          {/* Booking / Contrataciones in Success View */}
          {contactoBooking &&
            (contactoBooking.email || contactoBooking.telefono) && (
              <div className="pt-4 text-left">
                <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[var(--acc)] text-xs font-sans font-bold">
                      <Briefcase className="w-3.5 h-3.5 text-[var(--acc)]" />{" "}
                      {t("bookingTitle")}
                    </div>
                    <span className="text-micro font-sans px-2 py-0.5 rounded bg-[var(--acc)]/15 text-[var(--acc-ink)]">
                      {t("bookingBadgeLive")}
                    </span>
                  </div>
                  <p className="text-xs font-sans text-[var(--ink-2)] leading-relaxed">
                    {renderBold(t("bookingQuestion", { bandName }))}
                  </p>
                  <div className="space-y-1.5 pt-1">
                    {contactoBooking.email && (
                      <div className="flex items-center justify-between p-2 rounded-[var(--r-s)] bg-[var(--surface)]">
                        <a
                          href={`mailto:${contactoBooking.email}?subject=${encodeURIComponent(t("bookingEmailSubject", { bandName }))}`}
                          className="flex items-center gap-2 text-xs font-sans text-[var(--acc)]/70 hover:text-[var(--ink)] truncate flex-1"
                        >
                          <Mail className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
                          <span className="truncate">
                            {contactoBooking.email}
                          </span>
                        </a>
                      </div>
                    )}
                    {contactoBooking.telefono && (
                      <div className="flex items-center justify-between p-2 rounded-[var(--r-s)] bg-[var(--surface)]">
                        <a
                          href={`tel:${contactoBooking.telefono.replace(/\s+/g, "")}`}
                          className="flex items-center gap-2 text-xs font-sans text-[var(--ink-2)] hover:text-[var(--ink)] truncate flex-1"
                        >
                          <Phone className="w-3.5 h-3.5 text-[var(--ok)] shrink-0" />
                          <span className="truncate">
                            {contactoBooking.telefono}
                          </span>
                        </a>
                        <a
                          href={getWhatsAppUrl(
                            contactoBooking.telefono,
                            t("bookingWhatsappText", { bandName }),
                          )}
                          target={WHATSAPP_WINDOW_NAME}
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            e.preventDefault();
                            openWhatsAppChat(
                              contactoBooking.telefono,
                              t("bookingWhatsappText", { bandName }),
                            );
                          }}
                          className="px-2 py-0.5 text-micro font-sans text-[var(--ok)] bg-[var(--ok-soft)] rounded flex items-center gap-1 shrink-0 ml-2"
                        >
                          <MessageCircle className="w-3 h-3" /> WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          {/* Banner para músicos y bandas */}
          <div className="pt-4 text-left">
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)]  space-y-2.5">
              <div className="flex items-center gap-2 text-[var(--acc)] text-xs font-sans font-bold">
                <span>{t("musicianBannerTitle")}</span>
              </div>
              <p className="text-xs font-sans text-[var(--ink-2)] leading-relaxed">
                {t("musicianBannerSubtitle")}
              </p>
              <div className="pt-1">
                <a
                  href="/musicos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-[var(--r-m)] bg-[var(--acc)]/10 hover:bg-[var(--acc)]/20 text-[var(--acc-ink)] font-sans text-xs font-bold transition-ui "
                >
                  {t("musicianBannerCTA")}
                </a>
              </div>
            </div>
          </div>

          {/* Enlace a Inicio */}
          <div className="pt-2">
            <a
              href="/"
              className="text-xs font-sans text-[var(--ink-2)] hover:text-[var(--acc)] underline transition-colors"
            >
              {t("backHome")}
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${isPreview ? "min-h-full p-2 sm:p-4" : "min-h-screen p-4 pt-8 sm:items-center sm:pt-4"} bg-[var(--bg)] flex items-start justify-center`}
    >
      <div
        className={`max-w-md w-full bg-[var(--surface)] rounded-[var(--r-l)] ${isPreview ? "p-4 sm:p-6" : "p-6 sm:p-8"} space-y-6 relative overflow-hidden`}
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-[var(--acc)]" />

        <div className="text-center space-y-4 pt-2">
          {logoUrl && !imgError ? (
            <div className="relative inline-block mx-auto">
              <img
                src={logoUrl}
                alt={bandName}
                onError={() => setImgError(true)}
                className="w-24 h-24 mx-auto object-contain p-1 rounded-[var(--r-l)]  bg-[var(--sunken)]"
              />
            </div>
          ) : (
            <div className="w-24 h-24 mx-auto rounded-[var(--r-l)]  bg-[var(--sunken)]  flex flex-col items-center justify-center p-2">
              <Flame className="w-10 h-10 text-[var(--acc)] mb-0.5" />
              <span className="text-micro font-bold text-[var(--acc)]/70 font-display line-clamp-1">
                {bandName}
              </span>
            </div>
          )}
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-[var(--ink)] font-display">
              {t("joinTitle", { bandName })}
            </h1>
            <p className="text-[var(--acc)]/80 text-micro font-sans font-bold">
              {t("officialChannel")}
            </p>
          </div>
          <div className="pt-2 space-y-2">
            {isConcertLink ? (
              <div>
                <span className="text-[var(--ok)] font-bold px-3.5 py-1.5 bg-[var(--ok)]/10 rounded-[var(--r-pill)] inline-flex items-center gap-1.5 text-xs">
                  <span>
                    {concertName
                      ? t("thanksConcertWithName", {
                          concertName: sanitizeConcertDisplayName(concertName),
                        })
                      : t("thanksConcertGeneric")}
                  </span>
                </span>
              </div>
            ) : (
              <div>
                <span className="text-[var(--on-acc)] font-bold px-3.5 py-1.5 bg-[var(--acc)] rounded-[var(--r-pill)] inline-flex items-center gap-1.5 text-xs">
                  <span>{t("thanksSupport")}</span>
                </span>
              </div>
            )}
            <p className="text-[var(--ink-2)] text-xs font-sans leading-relaxed max-w-sm mx-auto">
              {renderBold(t("supportIntro"))}
            </p>
            <FanFormLanguageSwitcher
              language={language}
              onChange={setLanguage}
              languages={availableLanguages}
            />
          </div>
        </div>

        {/* REPRODUCTOR AUDIO PREVIEW DIRECTO (Single / Adelanto) */}
        {audioPreviewConfig?.habilitado !== false &&
          Boolean(audioPreviewConfig?.audioUrl?.trim()) && (
            <div className="p-3 rounded-[var(--r-l)] bg-[var(--sunken)]  flex items-center justify-between gap-3 text-left">
              <button
                type="button"
                onClick={toggleAudioPreview}
                aria-label={
                  isPlayingAudioPreview
                    ? t("audioPreviewPause") || "Pausar audio"
                    : t("audioPreviewPlay") || "Reproducir audio"
                }
                className="w-10 h-10 rounded-[var(--r-m)] bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] flex items-center justify-center shrink-0 transition-ui active:scale-[0.97]"
              >
                {isPlayingAudioPreview ? (
                  <Pause className="w-5 h-5 fill-bg-[var(--surface)]" />
                ) : (
                  <Play className="w-5 h-5 fill-bg-[var(--surface)] translate-x-0.5" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--ink)] truncate">
                  <Headphones className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
                  <span className="truncate">
                    {audioPreviewConfig?.tituloTema?.trim() ||
                      `${bandName} · Directo Preview`}
                  </span>
                </div>
                <p className="text-micro text-[var(--ink-2)] font-sans truncate">
                  {isPlayingAudioPreview
                    ? t("audioPreviewPlaying") || "Sonando adelanto en vivo..."
                    : audioPreviewConfig?.subtitulo?.trim() ||
                      t("audioPreviewPrompt") ||
                      "Dale al play para escuchar cómo sonamos"}
                </p>
              </div>

              {/* Animación de ondas de audio */}
              <div className="flex items-center gap-1 h-5 shrink-0 px-2">
                <span
                  className={`w-1 bg-[var(--acc)] rounded-[var(--r-pill)] transition-ui duration-300 ${isPlayingAudioPreview ? "h-5" : "h-1.5"}`}
                />
                <span
                  className={`w-1 bg-[var(--acc)] rounded-[var(--r-pill)] transition-ui duration-300 ${isPlayingAudioPreview ? "h-3 animate-bounce" : "h-2"}`}
                />
                <span
                  className={`w-1 bg-[var(--acc)] rounded-[var(--r-pill)] transition-ui duration-300 ${isPlayingAudioPreview ? "h-4" : "h-1"}`}
                />
                <span
                  className={`w-1 bg-[var(--acc)] rounded-[var(--r-pill)] transition-ui duration-300 ${isPlayingAudioPreview ? "h-2 animate-bounce" : "h-2.5"}`}
                />
              </div>
            </div>
          )}

        {/* Dual Tab Mode Switcher */}
        <div className="flex bg-[var(--sunken)] p-1.5 rounded-[var(--r-l)] text-xs font-sans">
          <button
            type="button"
            onClick={() => setActiveTab("redes")}
            className={`flex-1 py-2.5 px-3 rounded-[var(--r-pill)] font-bold transition-ui text-center flex items-center justify-center gap-2 ${
              activeTab === "redes"
                ? "bg-[var(--acc)]  text-[var(--on-acc)] font-bold"
                : "text-[var(--ink-2)] hover:text-[var(--ink)]"
            }`}
          >
            <span>{t("tabFollow")}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("form")}
            className={`flex-1 py-2.5 px-3 rounded-[var(--r-pill)] font-bold transition-ui text-center flex items-center justify-center gap-2 ${
              activeTab === "form"
                ? "bg-[var(--acc)]  text-[var(--on-acc)] font-bold"
                : "text-[var(--ink-2)] hover:text-[var(--ink)]"
            }`}
          >
            <span>{t("tabJoin")}</span>
          </button>
        </div>

        {/* Tab 1: Redes Sociales */}
        {activeTab === "redes" && (
          <div className="space-y-3.5 animate-fade-in pt-1">
            <div className="p-3.5 bg-[var(--surface)]/80 rounded-[var(--r-m)] text-center space-y-1">
              <p className="text-xs font-bold text-[var(--acc)]">
                {t("followHelpTitle")}
              </p>
              <p className="text-xs text-[var(--ink-2)] font-sans leading-relaxed">
                {renderBold(t("followHelpBody"))}
              </p>
            </div>

            <SocialPlatformsList
              links={socialLinks || {}}
              variant="grid"
              showTitle={false}
              language={language}
              onPlatformClick={(plat, url) => trackClick(plat, url, "redes")}
              clickCounts={clickCounts}
              showClickCounts={true}
            />

            {/* Acceso a"Conócenos" / EPK / Dossier público con las caras de los miembros de la banda */}
            <a
              href={epkUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick("epk", epkUrl, "redes")}
              className="group relative flex items-center gap-3.5 p-4 rounded-[var(--r-l)] bg-[var(--sunken)]  transition-ui duration-300  text-left cursor-pointer overflow-hidden active:scale-[0.97]"
            >
              {logoUrl && !imgError && (
                <img
                  src={logoUrl}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-25 group-hover:opacity-35 scale-110 transition-ui duration-300"
                />
              )}
              <div
                className="pointer-events-none absolute inset-0 bg-[var(--surface)] "
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-[var(--r-pill)] bg-[var(--acc)]/10 blur-2xl group-hover:bg-[var(--acc)]/20 transition-colors duration-300"
                aria-hidden="true"
              />
              <div className="relative w-11 h-11 rounded-[var(--r-m)] bg-[var(--acc)]/25  text-[var(--ink)] flex items-center justify-center shrink-0 transition-transform overflow-hidden">
                {logoUrl && !imgError ? (
                  <img
                    src={logoUrl}
                    alt={bandName}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <BookOpen className="w-5 h-5" />
                )}
              </div>
              <div className="relative min-w-0 flex-1">
                <span className="text-sm font-bold text-[var(--ink)] group-hover:text-[var(--acc)]/70 transition block truncate tracking-tight">
                  {t("epkCardTitle") || `Conócenos · ${bandName || "La Banda"}`}
                </span>
                <span className="text-xs text-[var(--ink-2)] font-sans block truncate mt-0.5">
                  {t("epkCardSubtitle") ||
                    "Historia, miembros, fotos y dossier"}
                </span>
              </div>

              {/* Caras / Avatares de los miembros de la banda */}
              {miembros && miembros.length > 0 && (
                <div className="relative hidden sm:flex items-center -space-x-2 shrink-0 pr-1">
                  {miembros.slice(0, 3).map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className="w-7 h-7 rounded-[var(--r-pill)] bg-[var(--surface)]/80 flex items-center justify-center text-micro font-bold text-[var(--acc-ink)] overflow-hidden"
                      title={`${m.nombre}${m.rol ? ` (${m.rol})` : ""}`}
                    >
                      {m.fotoUrl ? (
                        <img
                          src={m.fotoUrl}
                          alt={m.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>
                          {(m.nombre || "M").slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                  ))}
                  {miembros.length > 3 && (
                    <div className="w-7 h-7 rounded-[var(--r-pill)] bg-[var(--surface)]/80 flex items-center justify-center text-micro font-bold text-[var(--ink-2)]">
                      +{miembros.length - 3}
                    </div>
                  )}
                </div>
              )}

              <ChevronRight className="relative w-5 h-5 text-[var(--ink-2)] group-hover:text-[var(--acc)] group-hover:translate-x-1 transition-ui shrink-0" />
            </a>

            {/* Aportación Económica / Revolut debajo de links de redes */}
            {renderRevolutCard("redes")}

            {/* PRÓXIMOS CONCIERTOS / GIRA - debajo de Colaborar y encima de Booking y Contratación */}
            {upcomingConcerts && upcomingConcerts.length > 0 && (
              <div className="p-3.5 rounded-[var(--r-l)] bg-[var(--sunken)] space-y-2.5 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-sans font-bold text-[var(--acc)] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />{" "}
                    {t("upcomingShowsTitle") || "Próximos Conciertos"}
                  </span>
                  <span className="text-micro font-sans px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc)]/15 text-[var(--acc-ink)] font-bold">
                    {upcomingConcerts.length}{" "}
                    {upcomingConcerts.length === 1 ? "fecha" : "fechas"}
                  </span>
                </div>
                <div
                  className={`space-y-1.5 ${showAllConcerts ? "max-h-64 overflow-y-auto pr-0.5" : ""}`}
                >
                  {(showAllConcerts
                    ? upcomingConcerts
                    : upcomingConcerts.slice(0, 3)
                  ).map((c) => (
                    <div
                      key={c.id}
                      className="p-2.5 rounded-[var(--r-m)] bg-[var(--surface)] text-xs font-sans space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-[var(--ink)] truncate">
                            {c.sala}
                          </p>
                          <p className="text-xs text-[var(--ink-2)] truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[var(--acc)]/80 shrink-0" />{" "}
                            {c.ciudad}
                          </p>
                        </div>
                        <span className="px-2 py-1 rounded-[var(--r-s)] bg-[var(--acc)]/15 text-[var(--acc-ink)] text-micro font-bold shrink-0 font-sans">
                          {c.fecha}
                        </span>
                      </div>
                      {(c.entradasUrl || c.entradasLugarFisico) && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {c.entradasUrl && (
                            <a
                              href={c.entradasUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-[var(--r-s)] bg-[var(--ok)] text-[var(--on-ok)] text-micro font-bold hover:bg-[var(--ok)] transition-colors"
                            >
                              <Ticket className="w-3 h-3" /> Comprar entradas
                            </a>
                          )}
                          {c.entradasLugarFisico && (
                            <span className="text-micro text-[var(--ink-2)] truncate">
                              <ShowIcon inline emoji="📍" />También en: {c.entradasLugarFisico}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {upcomingConcerts.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAllConcerts((v) => !v)}
                    className="w-full flex items-center justify-center gap-1 text-xs font-sans font-bold text-[var(--acc)]/90 hover:text-[var(--acc)]/70 transition-colors pt-0.5"
                  >
                    {showAllConcerts ? (
                      <>
                        Ver menos <ChevronUp className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        Ver todas ({upcomingConcerts.length}){" "}
                        <ChevronDown className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => setActiveTab("form")}
                className="text-xs font-sans text-[var(--acc)]/90 hover:text-[var(--acc)]/70 underline font-bold transition-colors"
              >
                {t("followCTA")}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Formulario de Registro */}
        {activeTab === "form" && (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 pt-1 animate-fade-in text-left"
          >
            {error && (
              <div className="p-3 bg-[var(--alert)]/10 text-[var(--alert)] text-xs font-sans rounded-[var(--r-m)] text-center">
                {error}
              </div>
            )}

            {/* CAMPOS OBLIGATORIOS (Rápidos y sin fricción) */}
            <div>
              <label className="text-micro font-bold text-[var(--ink-2)] font-sans mb-1.5 block">
                {t("labelName")} *
              </label>
              <Input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                className="w-full"
                placeholder={t("placeholderName")}
              />
            </div>
            <div>
              <label className="text-micro font-bold text-[var(--ink-2)] font-sans mb-1.5 block">
                {t("labelEmail")} *
              </label>
              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full"
                placeholder="tu@email.com"
              />
            </div>

            {/* BOTÓN PARA EXPANDIR DETALLES OPCIONALES (Sin obligar al fan) */}
            <div>
              <button
                type="button"
                onClick={() => setShowOptionalFields(!showOptionalFields)}
                className="w-full py-2 px-3 rounded-[var(--r-m)] bg-[var(--sunken)]  text-[var(--ink-2)] hover:text-[var(--acc)]/70 text-xs font-sans flex items-center justify-between transition-colors"
              >
                <span>
                  {showOptionalFields
                    ? "– Ocultar detalles adicionales"
                    : "+ Añadir ciudad, canción o mensaje (opcional)"}
                </span>
                {showOptionalFields ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* CAMPOS OPCIONALES COLAPSABLES */}
            {showOptionalFields && (
              <div className="space-y-3.5 pt-1 pl-1 pr-1 animate-in fade-in duration-200">
                <div>
                  <label className="text-micro font-bold text-[var(--ink-2)] font-sans mb-1.5 block">
                    {t("labelCity")}
                  </label>
                  <Input
                    type="text"
                    value={formData.ciudad}
                    onChange={(e) =>
                      setFormData({ ...formData, ciudad: e.target.value })
                    }
                    className="w-full"
                    placeholder={t("placeholderCity")}
                  />
                </div>
                <div>
                  <label className="text-micro font-bold text-[var(--ink-2)] font-sans mb-1.5 block">
                    {t("labelHowFound")}
                  </label>
                  <select
                    value={formData.comoConocio}
                    onChange={(e) =>
                      setFormData({ ...formData, comoConocio: e.target.value })
                    }
                    className="w-full bg-[var(--sunken)] focus:rounded-[var(--r-m)] p-3 text-[var(--ink)] font-sans text-sm outline-none transition-colors appearance-none"
                  >
                    <option value="">{t("optionSelect")}</option>
                    <option value="Concierto">{t("optionConcert")}</option>
                    <option value="Redes Sociales">{t("optionSocial")}</option>
                    <option value="Amigo">{t("optionFriend")}</option>
                    <option value="Spotify">{t("optionSpotify")}</option>
                    <option value="Otro">{t("optionOther")}</option>
                  </select>
                </div>

                <div>
                  <label className="text-micro font-bold text-[var(--ink-2)] font-sans mb-1.5 block">
                    {t("labelFavSong", { bandName })}
                  </label>
                  <Input
                    type="text"
                    value={formData.cancionFavorita}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cancionFavorita: e.target.value,
                      })
                    }
                    className="w-full"
                    placeholder={t("placeholderFavSong")}
                  />
                </div>

                <div>
                  <label className="text-micro font-bold text-[var(--ink-2)] font-sans mb-1.5 block">
                    {t("labelInstagram")}
                  </label>
                  <Input
                    type="text"
                    value={formData.instagram}
                    onChange={(e) =>
                      setFormData({ ...formData, instagram: e.target.value })
                    }
                    className="w-full"
                    placeholder={t("placeholderInstagram")}
                  />
                </div>

                <div>
                  <label className="text-micro font-bold text-[var(--ink-2)] font-sans mb-1.5 block">
                    {t("labelMessage")}
                  </label>
                  <Textarea
                    rows={2}
                    value={formData.mensaje}
                    onChange={(e) =>
                      setFormData({ ...formData, mensaje: e.target.value })
                    }
                    className="w-full"
                    placeholder={t("placeholderMessage")}
                  />
                </div>
              </div>
            )}

            <div className="pt-2 pb-1">
              <label className="flex items-start gap-3 cursor-pointer group p-3 bg-[var(--surface)]/50 rounded-[var(--r-m)] hover:transition-colors">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input
                    type="checkbox"
                    required
                    checked={formData.consentimiento}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        consentimiento: e.target.checked,
                      })
                    }
                    className="peer appearance-none w-5 h-5 rounded bg-[var(--sunken)] checked:bg-[var(--acc)] checked: transition-colors shrink-0 cursor-pointer"
                  />
                  <Check
                    className="w-3.5 h-3.5 text-[var(--ink)] absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
                    strokeWidth={4}
                  />
                </div>
                <span className="text-micro text-[var(--ink-2)] font-sans leading-relaxed group-hover:text-[var(--ink-2)] transition-colors pt-0.5">
                  {t("consentPrefix")}
                  <button
                    type="button"
                    onClick={() => setShowPrivacyModal(true)}
                    className="text-[var(--acc)] underline hover:text-[var(--acc)]/70 font-bold inline"
                  >
                    {t("consentPrivacyLink")}
                  </button>
                  {t("consentMiddle")}
                  <strong className="text-[var(--ink-2)]">
                    {t("consentExplicit")}
                  </strong>
                  {t("consentSuffix")}
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-1 bg-[var(--acc)]  hover:bg-[var(--acc-soft)] text-[#121111] font-bold text-sm font-sans rounded-[var(--r-m)] transition-ui active:scale-[0.97] flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t("submitting")}
                </>
              ) : (
                t("submitJoin", { bandName })
              )}
            </button>

            {/* Colaborar económicamente: fuera del flujo principal del formulario, después de enviar */}
            <div className="pt-1">{renderRevolutCard("form")}</div>

            {/* Social Links shown below form as well */}
            {socialLinks && Object.values(socialLinks).some(Boolean) && (
              <div className="pt-4 space-y-2">
                <p className="text-xs font-bold text-[var(--ink-2)] font-sans text-center">
                  {t("followUsAlso")}
                </p>
                <SocialPlatformsList
                  links={socialLinks}
                  variant="pills"
                  showTitle={false}
                  language={language}
                  onPlatformClick={(plat, url) => trackClick(plat, url, "form")}
                  clickCounts={clickCounts}
                  showClickCounts={true}
                />
              </div>
            )}
          </form>
        )}

        {/* Sección Destacada de Contrataciones & Booking Directo */}
        {contactoBooking &&
          (contactoBooking.email || contactoBooking.telefono) && (
            <div className="pt-5 space-y-3">
              <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)]  space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[var(--acc)]">
                    <Briefcase className="w-4 h-4 text-[var(--acc)]" />
                    <span className="text-xs font-sans font-bold">
                      {t("bookingTitle")}
                    </span>
                  </div>
                  <span className="text-micro font-sans px-2 py-0.5 rounded bg-[var(--acc)]/15 text-[var(--acc-ink)] font-bold">
                    {t("bookingBadgeLive")}
                  </span>
                </div>

                <p className="text-xs font-sans text-[var(--ink-2)] leading-relaxed">
                  {renderBold(t("bookingQuestion", { bandName }))}
                </p>

                <div className="space-y-2 pt-1">
                  {contactoBooking.email && (
                    <div className="flex items-center justify-between p-2.5 rounded-[var(--r-s)] bg-[var(--surface)]  transition-colors">
                      <a
                        href={`mailto:${contactoBooking.email}?subject=${encodeURIComponent(t("bookingEmailSubject", { bandName }))}`}
                        className="flex items-center gap-2.5 text-xs font-sans text-[var(--acc)]/70 hover:text-[var(--ink)] transition-colors truncate flex-1 font-bold"
                      >
                        <Mail className="w-4 h-4 text-[var(--acc)] shrink-0" />
                        <span className="truncate">
                          {contactoBooking.email}
                        </span>
                      </a>
                    </div>
                  )}

                  {contactoBooking.telefono && (
                    <div className="flex items-center justify-between p-2.5 rounded-[var(--r-s)] bg-[var(--surface)] hover:bg-[var(--ok-soft)] transition-colors">
                      <a
                        href={`tel:${contactoBooking.telefono.replace(/\s+/g, "")}`}
                        className="flex items-center gap-2.5 text-xs font-sans text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors truncate flex-1 font-bold"
                      >
                        <Phone className="w-4 h-4 text-[var(--ok)] shrink-0" />
                        <span className="truncate">
                          {contactoBooking.telefono}
                        </span>
                      </a>
                      <div className="flex items-center shrink-0 ml-2">
                        <a
                          href={getWhatsAppUrl(
                            contactoBooking.telefono,
                            t("bookingWhatsappText", { bandName }),
                          )}
                          target={WHATSAPP_WINDOW_NAME}
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            e.preventDefault();
                            openWhatsAppChat(
                              contactoBooking.telefono,
                              t("bookingWhatsappText", { bandName }),
                            );
                          }}
                          className="px-2.5 py-1 text-micro font-sans text-[var(--ok)] bg-[var(--ok-soft)] hover:bg-[var(--ok-soft)] rounded transition-colors flex items-center gap-1.5 font-bold"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-[var(--ok)]" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        {/* Banner para músicos y bandas al final del formulario */}
        <div className="pt-4 text-left">
          <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)]  space-y-2.5">
            <div className="flex items-center gap-2 text-[var(--acc)] text-xs font-sans font-bold">
              <span>{t("musicianBannerTitle")}</span>
            </div>
            <p className="text-xs font-sans text-[var(--ink-2)] leading-relaxed">
              {t("musicianBannerSubtitle")}
            </p>
            <div className="pt-1">
              <a
                href="/musicos"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-[var(--r-m)] bg-[var(--acc)]/10 hover:bg-[var(--acc)]/20 text-[var(--acc-ink)] font-sans text-xs font-bold transition-ui "
              >
                {t("musicianBannerCTA")}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-[9999] bg-[var(--scrim)]/80 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-[var(--surface)] rounded-[var(--r-l)] p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center gap-2 text-[var(--acc)] font-sans font-bold text-sm">
                <Shield className="w-5 h-5" /> {t("privacyModalTitle")}
              </div>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="text-[var(--ink-2)] hover:text-[var(--ink)] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-[var(--ink-2)] font-sans space-y-3 leading-relaxed">
              <p>{renderBold(t("privacyPara1", { bandName }))}</p>
              <p>{renderBold(t("privacyPara2", { bandName }))}</p>
              <p>{renderBold(t("privacyPara3", { bandName }))}</p>
              <p>{renderBold(t("privacyPara4", { bandName }))}</p>
            </div>

            <div className="pt-4 text-right">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="px-5 py-2.5 bg-[var(--acc)] hover:bg-[var(--accent-alt)] text-[var(--on-acc)] font-bold font-sans text-xs rounded-[var(--r-pill)] transition-colors"
              >
                {t("understood")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default FansLanding;
