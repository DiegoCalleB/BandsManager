/**
 * Ciudades personalizadas del formulario de fans.
 * Extraído de FansPanel.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React,{ Dispatch,SetStateAction,useEffect,useState } from "react";
import { EPKConfig } from "../../../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface CityChipsParams {
  epkConfig: Partial<EPKConfig>;
  onUpdateEpkConfig: (newConfig: Partial<EPKConfig>) => void;
  setSelectedCityFilter: Dispatch<SetStateAction<string>>;
  selectedCityFilter: string;
}

/**
 * Ciudades personalizadas del formulario de fans.
 * @param params Estado y callbacks del contenedor ({@link CityChipsParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useCityChips({ epkConfig, onUpdateEpkConfig, setSelectedCityFilter, selectedCityFilter }: CityChipsParams) {
  // Configurable City Tabs state (synced with DB epkConfig.ciudadesConfig)
  const [customCityChips, setCustomCityChips] = useState<string[]>(() => {
    if (
      epkConfig?.ciudadesConfig &&
      Array.isArray(epkConfig.ciudadesConfig) &&
      epkConfig.ciudadesConfig.length > 0
    ) {
      return epkConfig.ciudadesConfig;
    }
    try {
      const saved = localStorage.getItem("bandmanager_custom_cities");
      return saved
        ? JSON.parse(saved)
        : [
            "Madrid",
            "Sevilla",
            "Barcelona",
            "Málaga",
            "Valencia",
            "Granada",
            "Cádiz",
          ];
    } catch {
      return [
        "Madrid",
        "Sevilla",
        "Barcelona",
        "Málaga",
        "Valencia",
        "Granada",
        "Cádiz",
      ];
    }
  });

  const [isAddingCity, setIsAddingCity] = useState(false);

  const [newCityInput, setNewCityInput] = useState("");

  // fetchState() devuelve objetos NUEVOS en cada refresco aunque el contenido no cambie; si el
  // efecto dependiera de la identidad del objeto, cada refresco pisaba con la copia del servidor
  // lo que la persona estaba editando (una ciudad recién añadida, el texto del incentivo...).
  // Solo se vuelca al estado local cuando el CONTENIDO del servidor cambia de verdad.
  const ultimasCiudadesServidorRef = React.useRef<string>(
    JSON.stringify(epkConfig?.ciudadesConfig ?? null),
  );

  useEffect(() => {
    const entrante = JSON.stringify(epkConfig?.ciudadesConfig ?? null);
    if (entrante === ultimasCiudadesServidorRef.current) return;
    ultimasCiudadesServidorRef.current = entrante;
    if (
      epkConfig?.ciudadesConfig &&
      Array.isArray(epkConfig.ciudadesConfig) &&
      epkConfig.ciudadesConfig.length > 0
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza el estado local con la prop o la banda activa
      setCustomCityChips(epkConfig.ciudadesConfig);
    }
  }, [epkConfig?.ciudadesConfig]);

  const handleAddCityTab = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCityInput.trim()) return;
    const formatted = newCityInput.trim();
    if (!customCityChips.includes(formatted)) {
      const updated = [...customCityChips, formatted];
      setCustomCityChips(updated);
      try {
        localStorage.setItem(
          "bandmanager_custom_cities",
          JSON.stringify(updated),
        );
      } catch {
        // localStorage no disponible: las ciudades se guardan igualmente en el EPK.
      }
      if (onUpdateEpkConfig) {
        onUpdateEpkConfig({ ciudadesConfig: updated });
      }
    }
    setSelectedCityFilter(formatted);
    setNewCityInput("");
    setIsAddingCity(false);
  };

  const handleRemoveCityTab = (cityToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customCityChips.filter((c) => c !== cityToRemove);
    setCustomCityChips(updated);
    try {
      localStorage.setItem("bandmanager_custom_cities", JSON.stringify(updated));
    } catch {
      // localStorage no disponible: las ciudades se guardan igualmente en el EPK.
    }
    if (selectedCityFilter === cityToRemove) {
      setSelectedCityFilter("");
    }
    if (onUpdateEpkConfig) {
      onUpdateEpkConfig({ ciudadesConfig: updated });
    }
  };

  return { customCityChips, handleRemoveCityTab, isAddingCity, handleAddCityTab, newCityInput, setNewCityInput, setIsAddingCity };
}
