/**
 * Incentivo de bienvenida para fans.
 * Extraído de FansPanel.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React,{ useEffect,useState } from "react";
import { EPKConfig } from "../../../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface FanIncentiveParams {
  epkConfig: Partial<EPKConfig>;
  onUpdateIncentive: (newIncentive: { mensajeAgradecimiento?: string; enlaceDescarga?: string; codigoDescuento?: string; fraseGancho?: string; premioTexto?: string; recompensaTipo?: string; }) => void;
  onUpdateEpkConfig: (newConfig: Partial<EPKConfig>) => void;
}

/**
 * Incentivo de bienvenida para fans.
 * @param params Estado y callbacks del contenedor ({@link FanIncentiveParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useFanIncentive({ epkConfig, onUpdateIncentive, onUpdateEpkConfig }: FanIncentiveParams) {
  // Incentive state. Antes, mientras una banda no configuraba su propio incentivo, este
  // formulario mostraba (y podía llegar a guardar) un enlace de descarga real de otra banda y un
  // código de descuento con su nombre — datos inventados de una banda concreta colándose como
  //"valor por defecto" en el panel de cualquier otra.
  const [incentivo, setIncentivo] = useState(
    epkConfig?.incentivoFans || {
      mensajeAgradecimiento:
        "¡Muchas gracias por unirte a la familia de la banda!",
      enlaceDescarga: "",
      codigoDescuento: "",
    },
  );

  const [savedIncentive, setSavedIncentive] = useState(false);

  const ultimoIncentivoServidorRef = React.useRef<string>(
    JSON.stringify(epkConfig?.incentivoFans ?? null),
  );

  useEffect(() => {
    const entrante = JSON.stringify(epkConfig?.incentivoFans ?? null);
    if (entrante === ultimoIncentivoServidorRef.current) return;
    ultimoIncentivoServidorRef.current = entrante;
    if (epkConfig?.incentivoFans) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza el estado local con la prop o la banda activa
      setIncentivo(epkConfig.incentivoFans);
    }
  }, [epkConfig?.incentivoFans]);

  const handleSaveIncentive = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (onUpdateIncentive) {
      onUpdateIncentive(incentivo);
    }
    if (onUpdateEpkConfig) {
      onUpdateEpkConfig({ incentivoFans: incentivo });
    }
    setSavedIncentive(true);
    setTimeout(() => setSavedIncentive(false), 2500);
  };

  return { savedIncentive, incentivo, setIncentivo, handleSaveIncentive };
}
