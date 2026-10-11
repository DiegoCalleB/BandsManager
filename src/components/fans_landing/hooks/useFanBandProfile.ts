/**
 * Carga del perfil público de la banda (identidad, redes, pagos, miembros, próximos conciertos).
 * Extraído de FansLanding.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Dispatch,SetStateAction,useEffect,useState } from "react";
import { BandMember,Concert,EPKConfig } from "../../../types";
import { decodeBandIdClient } from "../../../utils/bandHash";
import { sanitizeConcertDisplayName } from "../../../utils/fanUtils";
import { SocialLinks } from "../../SocialPlatformsList";
import type { PublicHighlightedSong } from "../fanLandingTypes";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface FanBandProfileParams {
  isPreview: boolean;
  previewConfig?: Partial<EPKConfig>;
  previewConcert?: Concert | null;
  previewConcertName?: string;
  initialBandId?: string;
  initialBandName?: string;
  initialBandLogo?: string;
  setConcertId: Dispatch<SetStateAction<string>>;
  setConcertName: Dispatch<SetStateAction<string>>;
  setIsConcertLink: Dispatch<SetStateAction<boolean>>;
}

/**
 * Carga del perfil público de la banda (identidad, redes, pagos, miembros, próximos conciertos).
 * @param params Estado y callbacks del contenedor ({@link FanBandProfileParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useFanBandProfile({ isPreview, previewConfig, previewConcert, previewConcertName, initialBandId, initialBandName, initialBandLogo, setConcertId, setConcertName, setIsConcertLink }: FanBandProfileParams) {
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

  const [miembros, setMiembros] = useState<BandMember[]>([]);

  const [upcomingConcerts, setUpcomingConcerts] = useState<Concert[]>([]);

  const [imgError, setImgError] = useState(false);

  const [audioPreviewConfig, setAudioPreviewConfig] = useState<{
    habilitado?: boolean;
    cancionId?: string;
    audioUrl?: string;
    tituloTema?: string;
    subtitulo?: string;
  } | null>(null);

  useEffect(() => {
    if (isPreview && previewConfig) {
      // Sin esto, resolvedBandId se quedaba en el valor inicial por defecto durante toda
      // la previsualización (el resto de estado sí se pisa con los datos de la banda real más
      // abajo) — y el enlace al Dossier/EPK, que se construye a partir de resolvedBandId, llevaba
      // a cualquier banda que abriera"Previsualizar Formulario" al EPK público de otra banda.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- el modo previsualización sincroniza el estado con las props de la app anfitriona
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
        localStorage.getItem("bandmanager_user") ||
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
    } catch {
      // localStorage no disponible (modo privado): se sigue sin banda almacenada.
    }

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
    if (queryBand) {
      const formatted = cleanId
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      setBandName(formatted);
      setLogoUrl(null);
      setSocialLinks(undefined);
      setContactoBooking(null);
      setMiembros([]);
    } else if (initialBandName) {
      setBandName(initialBandName);
      if (initialBandLogo) setLogoUrl(initialBandLogo);
      setMiembros([]);
    } else if (storedBandName) {
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
            setMiembros(
              data.epkConfig.miembros.map((m: BandMember & { foto_url?: string }) => ({
                ...m,
                fotoUrl: m.fotoUrl || m.foto_url || '',
              }))
            );
          } else {
            setMiembros([]);
          }

          if (data.epkConfig?.donacionRevolut) {
            setDonacionRevolut(data.epkConfig.donacionRevolut);
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
              (s: PublicHighlightedSong) =>
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

  return { setImgError, bandName, resolvedBandId, audioPreviewConfig, donacionRevolut, socialLinks, contactoBooking, logoUrl, imgError, miembros, upcomingConcerts };
}
