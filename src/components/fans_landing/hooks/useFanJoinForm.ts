/**
 * Estado del formulario Únete: pestañas, datos, éxito y origen del concierto por URL.
 * Extraído de FansLanding.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useEffect,useState } from "react";
import { Concert,EPKConfig } from "../../../types";
import { sanitizeConcertDisplayName } from "../../../utils/fanUtils";
import type { FanSignupResult } from "../fanLandingTypes";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface FanJoinFormParams {
  previewConcert: Concert;
  previewConcertName: string;
  isPreview: boolean;
  previewView: "form" | "success";
  previewConfig: Partial<EPKConfig>;
}

/**
 * Estado del formulario Únete: pestañas, datos, éxito y origen del concierto por URL.
 * @param params Estado y callbacks del contenedor ({@link FanJoinFormParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useFanJoinForm({ previewConcert, previewConcertName, isPreview, previewView, previewConfig }: FanJoinFormParams) {
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

  const [successData, setSuccessData] = useState<FanSignupResult | null>(null);

  const [concertId, setConcertId] = useState("");

  const [concertName, setConcertName] = useState("");

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const [isConcertLink, setIsConcertLink] = useState(
    Boolean(previewConcert || previewConcertName),
  );

  // Si se solicita previsualizar directamente la pantalla de éxito
  useEffect(() => {
    if (isPreview && previewView === "success") {
      // La previsualización debe reflejar lo que el fan verá de verdad: si la banda no ha
      // rellenado descarga/cupón en el apartado QR, aquí tampoco se inventan (antes se colaban
      // los valores de otra banda y la banda creía tener un incentivo configurado).
      const inc = previewConfig?.incentivoFans || {
        mensajeAgradecimiento:
          "¡Gracias por unirte a nuestra comunidad oficial!",
      };
      // eslint-disable-next-line react-hooks/set-state-in-effect -- el modo previsualización sincroniza el estado con las props de la app anfitriona
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

  useEffect(() => {
    const pathParts = window.location.pathname.split("/").filter(Boolean);
    let slug = "";

    if (pathParts.length > 1) {
      slug = pathParts[1];
    } else if (
      pathParts.length === 1 &&
      !["unete", "fans", "directo", "app"].includes(pathParts[0])
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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- el modo previsualización sincroniza el estado con las props de la app anfitriona
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

  return { setConcertName, setFormData, setIsConcertLink, setConcertId, concertId, activeTab, formData, setError, setLoading, setSuccessData, concertName, successData, isConcertLink, setActiveTab, error, setShowPrivacyModal, loading, showPrivacyModal };
}
