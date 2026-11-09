/**
 * «Preparar emails»: rellena la plantilla de la campaña con los datos de cada festival (nombre, ciudad, estilos, fecha de
 * su edición, idioma) y deja el texto en cada ficha. No envía nada: cada envío sigue necesitando aprobación.
 */
import { Mail } from "lucide-react";
import { useState } from "react";
import { apiFetch } from "../../utils/api";
import { getErrorMessage } from "../../utils/errorMessage";

interface RespuestaPreparar {
  preparados: number;
  enCurso: number;
  conPitchPropio: number;
}

export function PrepararEmailsBoton({ campaignId, onListo }: { campaignId: string; onListo?: () => void }) {
  const [estado, setEstado] = useState<"reposo" | "trabajando" | "hecho" | "error">("reposo");
  const [mensaje, setMensaje] = useState("");

  const preparar = async () => {
    setEstado("trabajando");
    try {
      const r = await apiFetch<RespuestaPreparar>(`/api/campaigns/${encodeURIComponent(campaignId)}/preparar-emails`, { method: "POST" });
      const resto = [r.conPitchPropio ? `${r.conPitchPropio} con texto propio sin tocar` : "", r.enCurso ? `${r.enCurso} ya en curso` : ""].filter(Boolean).join(" · ");
      setMensaje(`${r.preparados} emails listos para revisar${resto ? ` (${resto})` : ""}`);
      setEstado("hecho");
      onListo?.();
    } catch (err) {
      setMensaje(getErrorMessage(err, "No se pudieron preparar los emails."));
      setEstado("error");
    }
  };

  return (
    <button
      type="button"
      onClick={preparar}
      disabled={estado === "trabajando"}
      title={mensaje || "Escribe el email de cada festival con sus datos. No envía nada: tú apruebas antes."}
      className="flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-[var(--r-pill)] bg-[var(--acc-soft)] px-2 py-1 text-micro font-bold text-[var(--acc-ink)] hover:bg-[var(--sunken)] disabled:opacity-60 sm:px-2.5"
    >
      <Mail className="h-3 w-3 shrink-0" aria-hidden />
      <span>{estado === "trabajando" ? "Preparando…" : estado === "hecho" ? mensaje : estado === "error" ? "Reintentar" : "Preparar emails"}</span>
    </button>
  );
}
