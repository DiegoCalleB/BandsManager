/**
 * Paso «Salas para empezar»: carga las salas del catálogo compartido que encajan con la ciudad y el género de la banda
 * y añade a su agenda las que elija. Estado propio del paso: nada de esto se guarda con el resto del asistente.
 */
import { useEffect, useState } from "react";
import { anadirVariasSalasDelCatalogo, cargarSugerenciasDeSalas, type InformeAltasSalas, type SugerenciaSala } from "../../../../services/apiCatalogo";

export const MAX_SALAS_A_LA_VEZ = 10;

export function useSalasSugeridasStep(ciudad: string, genero: string) {
  const [sugerencias, setSugerencias] = useState<SugerenciaSala[]>([]);
  const [cargando, setCargando] = useState(true);
  const [fallo, setFallo] = useState(false);
  const [elegidas, setElegidas] = useState<Set<string>>(new Set());
  const [anadiendo, setAnadiendo] = useState(false);
  const [informe, setInforme] = useState<InformeAltasSalas | null>(null);
  const [errorAlta, setErrorAlta] = useState("");

  const [intento, setIntento] = useState(0);

  // Carga al abrir el paso (y al reintentar). El estado inicial ya es «cargando», así que el efecto solo actualiza al llegar la respuesta.
  useEffect(() => {
    let vigente = true;
    cargarSugerenciasDeSalas(ciudad, genero)
      .then((lista) => {
        if (!vigente) return;
        setSugerencias(lista);
        setElegidas(new Set());
        setFallo(false);
      })
      .catch(() => vigente && setFallo(true))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [ciudad, genero, intento]);

  const recargar = () => {
    setCargando(true);
    setIntento((n) => n + 1);
  };

  const alternar = (id: string) =>
    setElegidas((previas) => {
      const siguientes = new Set(previas);
      if (siguientes.has(id)) siguientes.delete(id);
      else if (siguientes.size < MAX_SALAS_A_LA_VEZ) siguientes.add(id);
      return siguientes;
    });

  const anadir = async () => {
    if (elegidas.size === 0 || anadiendo) return;
    setAnadiendo(true);
    setErrorAlta("");
    try {
      setInforme(await anadirVariasSalasDelCatalogo([...elegidas]));
      // Se recarga: las recién añadidas ya no se sugieren y aparecen otras en su lugar.
      recargar();
    } catch (e) {
      setErrorAlta(e instanceof Error ? e.message : "No se pudieron añadir las salas.");
    } finally {
      setAnadiendo(false);
    }
  };

  return { sugerencias, cargando, fallo, elegidas, alternar, anadir, anadiendo, informe, errorAlta, reintentar: recargar };
}
