/**
 * Estado y conexión de la cuenta de Instagram con token.
 * Extraído de ReelsMetricsView.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import type { InstagramStatus } from "../metricsTypes";
import { useEffect, useState } from "react";
import { api } from "../../../../services/api";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface InstagramConnectionParams {
  loadContentItems: () => Promise<void>;
  onScanRealMetrics: () => Promise<void>;
}

/**
 * Estado y conexión de la cuenta de Instagram con token.
 * @param params Estado y callbacks del contenedor ({@link InstagramConnectionParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useInstagramConnection({ loadContentItems, onScanRealMetrics }: InstagramConnectionParams) {
  // Instagram Meta Graph API & OAuth State
  const [showIgModal, setShowIgModal] = useState(false);

  const [igStatus, setIgStatus] = useState<InstagramStatus | null>(null);

  const [igTokenInput, setIgTokenInput] = useState("");

  const [, setIsCheckingIg] = useState(false);

  const [isConnectingIg, setIsConnectingIg] = useState(false);

  const [igModalMsg, setIgModalMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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

  useEffect(() => {
    loadContentItems();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- consulta el estado de Instagram al montar la vista
    loadIgStatus();
  }, []);

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

  return { setIgModalMsg, setShowIgModal, igStatus, showIgModal, handleDisconnectIg, isConnectingIg, igModalMsg, igTokenInput, setIgTokenInput, handleConnectIgToken };
}
