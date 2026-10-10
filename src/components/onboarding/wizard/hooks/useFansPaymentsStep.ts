/**
 * Paso de fans y cobros: mensaje al fan, recompensa, lead magnet, descuentos y datos de pago.
 * Extraído de OnboardingWizardModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React,{ useState } from "react";
import { EPKConfig } from "../../../../types";
import { uploadFileToServer } from "../../../../utils/audioStorage";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface FansPaymentsStepParams {
  epkConfig: EPKConfig;
  activeBandId: string;
}

/**
 * Paso de fans y cobros: mensaje al fan, recompensa, lead magnet, descuentos y datos de pago.
 * @param params Estado y callbacks del contenedor ({@link FansPaymentsStepParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useFansPaymentsStep({ epkConfig, activeBandId }: FansPaymentsStepParams) {
  // --- Step 13: Fans & Pagos ---
  const [fanCallToAction, setFanCallToAction] = useState(
    epkConfig?.incentivoFans?.fraseGancho ||
      "¡Únete al club y descarga nuestra maqueta inédita en MP3!",
  );

  const [fanWelcomeMessage, setFanWelcomeMessage] = useState(
    epkConfig?.incentivoFans?.mensajeAgradecimiento ||
      "¡Gracias por apoyarnos en el concierto!",
  );

  const [fanRewardDescription, setFanRewardDescription] = useState(
    epkConfig?.incentivoFans?.premioTexto || "Tema inédito en acústico (MP3)",
  );

  const [fanRewardLink, setFanRewardLink] = useState(
    epkConfig?.incentivoFans?.enlaceDescarga || "",
  );

  const [leadMagnetFileName, setLeadMagnetFileName] = useState("");

  const [isUploadingLeadMagnet, setIsUploadingLeadMagnet] = useState(false);

  const [discountCode, setDiscountCode] = useState(
    epkConfig?.incentivoFans?.codigoDescuento || "",
  );

  const [bizumNumber, setBizumNumber] = useState(
    epkConfig?.donacionRevolut?.bizumTelefono ||
      epkConfig?.enlacesRedes?.bizum ||
      "",
  );

  const [revolutTag, setRevolutTag] = useState(
    epkConfig?.donacionRevolut?.revolutTag ||
      epkConfig?.enlacesRedes?.revolut ||
      "",
  );

  const [paypalEmail, setPaypalEmail] = useState(
    epkConfig?.donacionRevolut?.paypalUser ||
      epkConfig?.enlacesRedes?.paypal ||
      "",
  );

  const [ibanNumber, setIbanNumber] = useState(
    epkConfig?.donacionRevolut?.ibanCuenta ||
      epkConfig?.enlacesRedes?.iban ||
      "",
  );

  // Lead Magnet Upload
  const handleLeadMagnetUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLeadMagnet(true);
    try {
      const url = await uploadFileToServer(file, {
        bandId: activeBandId,
        category: "lead_magnet",
      });
      if (url) {
        setFanRewardLink(url);
        setLeadMagnetFileName(file.name);
      }
    } catch (err) {
      console.error("Error uploading lead magnet:", err);
    } finally {
      setIsUploadingLeadMagnet(false);
    }
  };

  return { bizumNumber, revolutTag, paypalEmail, ibanNumber, fanCallToAction, fanWelcomeMessage, fanRewardDescription, fanRewardLink, discountCode, setFanCallToAction, setFanWelcomeMessage, setFanRewardDescription, setFanRewardLink, leadMagnetFileName, setLeadMagnetFileName, isUploadingLeadMagnet, handleLeadMagnetUpload, setDiscountCode, setBizumNumber, setRevolutTag, setPaypalEmail, setIbanNumber };
}
