/**
 * Análisis de capturas de pantalla de estadísticas con IA para rellenar métricas.
 * Extraído de ReelsMetricsView.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import type { ScreenshotScanResult } from "../metricsTypes";
import React, { useState } from "react";
import { api } from "../../../../services/api";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface ScreenshotScanParams {
  onSyncMetrics: () => Promise<void>;
}

/**
 * Análisis de capturas de pantalla de estadísticas con IA para rellenar métricas.
 * @param params Estado y callbacks del contenedor ({@link ScreenshotScanParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useScreenshotScan({ onSyncMetrics }: ScreenshotScanParams) {
  // Gemini Multimodal Screenshot Scanner State
  const [showScanModal, setShowScanModal] = useState(false);

  const [scanImageBase64, setScanImageBase64] = useState<string | null>(null);

  const [scanImageMime, setScanImageMime] = useState<string>("image/jpeg");

  const [isAnalyzingScreenshot, setIsAnalyzingScreenshot] = useState(false);

  const [scanResult, setScanResult] = useState<ScreenshotScanResult | null>(null);

  const [scanError, setScanError] = useState<string | null>(null);

  const [scanSuccess, setScanSuccess] = useState<string | null>(null);

  // Screenshot scanner handlers
  const handleScreenshotFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setScanError(
        "Por favor selecciona un archivo de imagen válido (PNG, JPG, WebP).",
      );
      return;
    }
    setScanError(null);
    setScanSuccess(null);
    setScanResult(null);
    setScanImageMime(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      setScanImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleScreenshotInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      handleScreenshotFile(file);
    }
  };

  const handleAnalyzeScreenshot = async () => {
    if (!scanImageBase64) {
      setScanError("Primero carga o arrastra una captura de pantalla.");
      return;
    }
    try {
      setIsAnalyzingScreenshot(true);
      setScanError(null);
      setScanSuccess(null);

      const res = await api.scanMetricsScreenshot(
        scanImageBase64,
        scanImageMime,
        true,
      );
      if (res && res.success && res.data) {
        setScanResult(res.data);
        setScanSuccess(
          "¡Captura analizada y métricas sincronizadas en Supabase!",
        );
        if (onSyncMetrics) {
          await onSyncMetrics();
        }
      } else {
        setScanError(
          res?.error || "No se pudieron extraer métricas de la captura.",
        );
      }
    } catch (err) {
      setScanError(
        err?.message || "Error al procesar la captura con Visión IA.",
      );
    } finally {
      setIsAnalyzingScreenshot(false);
    }
  };

  return { setScanError, setScanSuccess, setScanResult, setShowScanModal, showScanModal, scanError, scanSuccess, scanImageBase64, handleScreenshotInputChange, handleAnalyzeScreenshot, isAnalyzingScreenshot, scanResult, setScanImageBase64 };
}
