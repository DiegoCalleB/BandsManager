/**
 * Personalización artística del QR y estadísticas de clics.
 * Extraído de FansPanel.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useEffect,useState } from "react";
import { apiFetch } from "../../../utils/api";
import { QrCustomConfig,getStoredQrConfig,saveStoredQrConfig } from "../../fans/qr/qrCustomizationConfig";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface QrCustomizationParams {
  currentBandId: string;
}

/**
 * Personalización artística del QR y estadísticas de clics.
 * @param params Estado y callbacks del contenedor ({@link QrCustomizationParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useQrCustomization({ currentBandId }: QrCustomizationParams) {
  const [clickStats, setClickStats] = useState<Record<string, number>>({});

  // Configuración de Personalización Artística del QR (Dino, Pac-Man, Rock Skull, Colores...)
  const [qrCustomConfig, setQrCustomConfig] = useState<QrCustomConfig>(() =>
    getStoredQrConfig(currentBandId)
  );

  useEffect(() => {
    if (currentBandId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza el estado local con la prop o la banda activa
      setQrCustomConfig(getStoredQrConfig(currentBandId));
    }
  }, [currentBandId]);

  const handleQrConfigChange = (newConfig: QrCustomConfig) => {
    setQrCustomConfig(newConfig);
    if (currentBandId) {
      saveStoredQrConfig(currentBandId, newConfig);
    }
  };

  useEffect(() => {
    let isSubscribed = true;
    apiFetch<{ clicks?: Record<string, number> }>("/api/epk/clicks")
      .then((data) => {
        if (isSubscribed && data && data.clicks) {
          setClickStats(data.clicks);
        }
      })
      .catch(() => {});
    return () => {
      isSubscribed = false;
    };
  }, [currentBandId]);

  return { clickStats, qrCustomConfig, handleQrConfigChange };
}
