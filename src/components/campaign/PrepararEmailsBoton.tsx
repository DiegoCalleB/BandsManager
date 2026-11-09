/**
 * «Preparar emails»: rellena la plantilla de la campaña con los datos de cada festival (nombre, ciudad, estilos, fecha de
 * su edición, idioma) y deja el texto en cada ficha. No envía nada: cada envío sigue necesitando aprobación.
 * Si algún festival ya tenía un texto anterior (de la IA o de una persona) no lo pisa: ofrece «Reemplazar» aparte.
 */
import { Mail } from "lucide-react";
import { useState } from "react";
import { apiFetch } from "../../utils/api";
import { getErrorMessage } from "../../utils/errorMessage";

interface RespuestaPreparar {
  preparados: number;
  enCurso: number;
  conPitchPropio: number;
  reemplazados: number;
}

const CLASES = "flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-[var(--r-pill)] px-2 py-1 text-micro font-bold disabled:opacity-60 sm:px-2.5";

export function PrepararEmailsBoton({ campaignId, onListo }: { campaignId: string; onListo?: () => void }) {
  const [estado, setEstado] = useState<"reposo" | "trabajando" | "hecho" | "error">("reposo");
  const [mensaje, setMensaje] = useState("");
  const [anteriores, setAnteriores] = useState(0);

  const lanzar = async (sobrescribir: boolean) => {
    setEstado("trabajando");
    try {
      const r = await apiFetch<RespuestaPreparar>(`/api/campaigns/${encodeURIComponent(campaignId)}/preparar-emails`, {
        method: "POST",
        body: JSON.stringify({ sobrescribir }),
      });
      const resto = [r.reemplazados ? `${r.reemplazados} reemplazados` : "", r.enCurso ? `${r.enCurso} ya en curso` : ""].filter(Boolean).join(" · ");
      setMensaje(`${r.preparados} emails listos para revisar${resto ? ` (${resto})` : ""}`);
      setAnteriores(r.conPitchPropio);
      setEstado("hecho");
      onListo?.();
    } catch (err) {
      setMensaje(getErrorMessage(err, "No se pudieron preparar los emails."));
      setEstado("error");
    }
  };

  const reemplazar = () => {
    if (window.confirm(`${anteriores} festivales ya tienen un texto anterior (de la IA o escrito a mano). ¿Sustituirlos por el de la plantilla? Los que están en curso no se tocan.`)) void lanzar(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void lanzar(false)}
        disabled={estado === "trabajando"}
        title={mensaje || "Escribe el email de cada festival con sus datos. No envía nada: tú apruebas antes."}
        className={`${CLASES} bg-[var(--acc-soft)] text-[var(--acc-ink)] hover:bg-[var(--sunken)]`}
      >
        <Mail className="h-3 w-3 shrink-0" aria-hidden />
        <span>{estado === "trabajando" ? "Preparando…" : estado === "hecho" ? mensaje : estado === "error" ? "Reintentar" : "Preparar emails"}</span>
      </button>
      {estado === "hecho" && anteriores > 0 && (
        <button type="button" onClick={reemplazar} title="Sustituye los textos anteriores por el de la plantilla" className={`${CLASES} bg-[var(--sunken)] text-[var(--ink)] hover:text-[var(--acc-ink)]`}>
          Reemplazar {anteriores} textos anteriores
        </button>
      )}
    </>
  );
}
