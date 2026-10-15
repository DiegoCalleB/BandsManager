/**
 * Copiar, compartir, descargar e imprimir el QR de la landing.
 * Extraído de FansPanel.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";
import { Concert } from "../../../types";
import { downloadQrAsHighResPng,downloadQrAsSvg,printHighQualityFlyer } from "../../../utils/qrExport";
import { openWhatsAppChat } from "../../../utils/whatsapp";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface QrSharingParams {
  qrConcertUrl: string;
  selectedConcert: Concert;
  effectiveBandName: string;
  effectiveBandLogo: string;
}

/**
 * Copiar, compartir, descargar e imprimir el QR de la landing.
 * @param params Estado y callbacks del contenedor ({@link QrSharingParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useQrSharing({ qrConcertUrl, selectedConcert, effectiveBandName, effectiveBandLogo }: QrSharingParams) {
  const copyLink = () => {
    navigator.clipboard.writeText(qrConcertUrl);
    alert("Enlace copiado al portapapeles.");
  };

  const [copiedQrUrl, setCopiedQrUrl] = useState(false);

  const handleCopyQrUrl = () => {
    navigator.clipboard.writeText(qrConcertUrl);
    setCopiedQrUrl(true);
    setTimeout(() => setCopiedQrUrl(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const concertTitle = selectedConcert
      ? `${selectedConcert.sala} (${selectedConcert.ciudad})`
      : effectiveBandName;
    const text = `¡Únete a ${effectiveBandName} en ${concertTitle}! 🎶 Escanea o entra en el enlace para recibir sorpresas exclusivas y estar al día:\n\n${qrConcertUrl}`;
    openWhatsAppChat(undefined, text);
  };

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Únete a ${effectiveBandName}`,
          text: "Escanea o entra para unirte a nuestra comunidad.",
          url: qrConcertUrl,
        });
      } catch (err) {
        console.log("Share canceled or not supported", err);
      }
    } else {
      handleCopyQrUrl();
    }
  };

  const [showQrExportModal, setShowQrExportModal] = useState(false);

  const [isExportingDirect, setIsExportingDirect] = useState(false);

  const [showQrMoreMenu, setShowQrMoreMenu] = useState(false);

  const [showAdvancedQrConfig, setShowAdvancedQrConfig] = useState(false);

  const handleDownloadSvg = async () => {
    setIsExportingDirect(true);
    try {
      const concertTitle = selectedConcert
        ? `${selectedConcert.sala}`
        : effectiveBandName;
      await downloadQrAsSvg({
        svgElementId: "qr-code-svg-container",
        filename: `qr-${effectiveBandName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${concertTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-vectorial`,
        logoUrl: effectiveBandLogo,
      });
    } catch (err) {
      console.error("Error al descargar SVG:", err);
    } finally {
      setIsExportingDirect(false);
    }
  };

  const handleDownloadPng4k = async () => {
    setIsExportingDirect(true);
    try {
      const concertTitle = selectedConcert
        ? `${selectedConcert.sala}`
        : effectiveBandName;
      await downloadQrAsHighResPng({
        svgElementId: "qr-code-svg-container",
        filename: `qr-${effectiveBandName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${concertTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-4k`,
        template: "qr-only",
        logoUrl: effectiveBandLogo,
      });
    } catch (err) {
      console.error("Error al descargar PNG 4K:", err);
    } finally {
      setIsExportingDirect(false);
    }
  };

  const handlePrintQr = () => {
    const concertTitle = selectedConcert ? selectedConcert.sala : undefined;
    const dateCity = selectedConcert
      ? `${selectedConcert.ciudad} • ${selectedConcert.fecha}`
      : undefined;

    printHighQualityFlyer({
      svgElementId: "qr-code-svg-container",
      bandName: effectiveBandName,
      concertTitle,
      dateCity,
      url: qrConcertUrl,
      logoUrl: effectiveBandLogo,
      ctaText: "¡ESCANEA CON LA CÁMARA DE TU MÓVIL!",
      subtitle: `Únete a la comunidad oficial de ${effectiveBandName} para acceder a canciones inéditas, sorpresas exclusivas y descuentos en merchandising.`,
    });
  };

  return { copyLink, handleCopyQrUrl, copiedQrUrl, handlePrintQr, setShowQrMoreMenu, showQrMoreMenu, handleDownloadSvg, isExportingDirect, handleDownloadPng4k, setShowQrExportModal, handleShareWhatsApp, handleShareNative, setShowAdvancedQrConfig, showAdvancedQrConfig, showQrExportModal };
}
