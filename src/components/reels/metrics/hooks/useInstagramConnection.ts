/**
 * Estado y conexión de la cuenta de Instagram con token.
 * Extraído de ReelsMetricsView.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import type { InstagramStatus } from "../metricsTypes";
import { useEffect, useState, useEffectEvent } from "react";
import { api } from "../../../../services/api";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface InstagramConnectionParams {
  loadContentItems: () => Promise<void>;
  onScanRealMetrics: () => Promise<void>;
}

const MOTIVOS_OAUTH: Record<string, string> = {
  acceso_denegado: "Cancelaste el permiso en Instagram. Pulsa «Conectar con Instagram» para intentarlo de nuevo.",
  estado_invalido_o_caducado: "El enlace de conexión caducó (dura 10 minutos). Vuelve a pulsar «Conectar con Instagram».",
  empieza_y_termina_en_el_mismo_dominio: "Empieza y termina la conexión en el mismo dominio de la app (con tu sesión iniciada ahí).",
  sin_cuenta_de_instagram_business: "Meta no devolvió ninguna cuenta de Instagram Business. La cuenta debe ser Business o Creator y estar enlazada a una página de Facebook.",
  meta_rechazo_el_codigo: "Meta rechazó el código de autorización. Inténtalo de nuevo.",
  meta_no_amplio_el_token: "Meta no emitió el token de larga duración. Inténtalo de nuevo.",
  oauth_no_configurado_en_servidor: "El servidor no tiene configurado el OAuth de Instagram.",
};

/** El callback del servidor (server/routes/instagramOAuth.ts) vuelve con ?instagram_oauth=conectado|error&motivo=… */
function retornoOAuthInicial(): { type: "success" | "error"; text: string } | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const resultado = params.get("instagram_oauth");
  if (!resultado) return null;
  if (resultado === "conectado") {
    return { type: "success", text: "¡Instagram conectado! Ya puedes leer tus métricas oficiales." };
  }
  const motivo = params.get("motivo") || "";
  return { type: "error", text: MOTIVOS_OAUTH[motivo] || "No se pudo completar la conexión con Instagram." };
}

/**
 * Estado y conexión de la cuenta de Instagram con token.
 * @param params Estado y callbacks del contenedor ({@link InstagramConnectionParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useInstagramConnection({ loadContentItems, onScanRealMetrics }: InstagramConnectionParams) {
  // Instagram Meta Graph API & OAuth State
  // Si venimos del callback de Meta, el modal se abre solo con el resultado.
  const [retornoOAuth] = useState(retornoOAuthInicial);
  const [showIgModal, setShowIgModal] = useState(retornoOAuth !== null);

  const [igStatus, setIgStatus] = useState<InstagramStatus | null>(null);

  const [igTokenInput, setIgTokenInput] = useState("");

  const [, setIsCheckingIg] = useState(false);

  const [isConnectingIg, setIsConnectingIg] = useState(false);

  const [igModalMsg, setIgModalMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(retornoOAuth);

  // Load Instagram Meta Graph API Connection Status
  const loadIgStatus = async () => {
    try {
      setIsCheckingIg(true);
      const res = await api.getInstagramStatus();
      if (res && res.success) {
        setIgStatus(res);
      }
    } catch (err) {
      console.warn("Could not check Instagram status:", err);
    } finally {
      setIsCheckingIg(false);
    }
  };

  // El efecto se dispara solo por []; el cuerpo lee siempre lo más reciente (useEffectEvent).
  const alCambiarMontar = useEffectEvent(() => {
    loadContentItems();
    loadIgStatus();
  });
  useEffect(() => {
    // Limpia la query del retorno para que un F5 no vuelva a abrir el modal.
    if (retornoOAuth) {
      const params = new URLSearchParams(window.location.search);
      ["instagram_oauth", "motivo", "view"].forEach((k) => params.delete(k));
      const query = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (query ? `?${query}` : ""));
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- consulta el estado de Instagram al montar la vista
    return alCambiarMontar();
  }, [retornoOAuth]);

  const handleConnectIgOAuth = async () => {
    try {
      setIsConnectingIg(true);
      setIgModalMsg(null);
      const { url } = await api.getInstagramOAuthAuthorizeUrl();
      window.location.href = url;
    } catch (err) {
      setIgModalMsg({
        type: "error",
        text: err?.message || "No se pudo iniciar la conexión con Instagram.",
      });
      setIsConnectingIg(false);
    }
  };

  const handleConnectIgToken = async () => {
    if (!igTokenInput.trim()) {
      setIgModalMsg({
        type: "error",
        text: "Por favor, introduce o pega un Token de Acceso válido de Meta / Instagram.",
      });
      return;
    }
    try {
      setIsConnectingIg(true);
      setIgModalMsg(null);
      const res = await api.connectInstagramToken(igTokenInput.trim());
      if (res && res.success) {
        setIgModalMsg({
          type: "success",
          text: res.message || "Cuenta de Instagram vinculada con éxito.",
        });
        setIgTokenInput("");
        await loadIgStatus();
        if (onScanRealMetrics) {
          await onScanRealMetrics();
        }
      } else {
        setIgModalMsg({
          type: "error",
          text:
            res?.message || "No se pudo verificar el token con Meta Graph API.",
        });
      }
    } catch (err) {
      setIgModalMsg({
        type: "error",
        text: err?.message || "Error al validar token con Meta Graph API.",
      });
    } finally {
      setIsConnectingIg(false);
    }
  };

  const handleDisconnectIg = async () => {
    try {
      setIsConnectingIg(true);
      setIgModalMsg(null);
      const res = await api.disconnectInstagram();
      if (res && res.success) {
        setIgModalMsg({
          type: "success",
          text: "Cuenta de Instagram desconectada. Modo scraping autónomo activado.",
        });
        await loadIgStatus();
      }
    } catch (err) {
      setIgModalMsg({
        type: "error",
        text: err?.message || "Error al desconectar cuenta.",
      });
    } finally {
      setIsConnectingIg(false);
    }
  };

  return { handleConnectIgOAuth, setIgModalMsg, setShowIgModal, igStatus, showIgModal, handleDisconnectIg, isConnectingIg, igModalMsg, igTokenInput, setIgTokenInput, handleConnectIgToken };
}
