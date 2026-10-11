/**
 * Envío del formulario de alta de fan (simulado en previsualización).
 * Extraído de FansLanding.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React,{ Dispatch,SetStateAction } from "react";
import { EPKConfig } from "../../../types";
import { getErrorMessage } from "../../../utils/errorMessage";
import type { FanSignupResult } from "../fanLandingTypes";
import type { FanFormTranslate } from "./useFanLanguage";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface FanSignupSubmitParams {
  formData: { nombre: string; email: string; ciudad: string; comoConocio: string; cancionFavorita: string; mensaje: string; instagram: string; consentimiento: boolean; };
  setError: Dispatch<SetStateAction<string>>;
  t: FanFormTranslate;
  setLoading: Dispatch<SetStateAction<boolean>>;
  isPreview: boolean;
  previewConfig: Partial<EPKConfig>;
  setSuccessData: Dispatch<SetStateAction<FanSignupResult | null>>;
  resolvedBandId: string;
  concertId: string;
  concertName: string;
}

/**
 * Envío del formulario de alta de fan (simulado en previsualización).
 * @param params Estado y callbacks del contenedor ({@link FanSignupSubmitParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useFanSignupSubmit({ formData, setError, t, setLoading, isPreview, previewConfig, setSuccessData, resolvedBandId, concertId, concertName }: FanSignupSubmitParams) {
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
    } catch (err) {
      setError(getErrorMessage(err, t("errorGenericSignup")));
    } finally {
      setLoading(false);
    }
  };

  return { handleSubmit };
}
