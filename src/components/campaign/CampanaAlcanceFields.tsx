import { useState } from "react";
import { MapPin, X } from "lucide-react";
import type { BookingCampaign } from "../../types";
import { Button, IconButton, Input } from "../ui";

interface Props {
  formData: Partial<BookingCampaign>;
  setFormData: (datos: Partial<BookingCampaign>) => void;
}

/**
 * A quién va la campaña: salas de unas ciudades (con aforo) o todos los festivales de España y Europa.
 * En «festivales» no se pide ciudad ni aforo.
 */
export function CampanaAlcanceFields({ formData, setFormData }: Props) {
  const [nuevaCiudad, setNuevaCiudad] = useState("");
  const esFestivales = formData.alcance === "festivales";

  const anadirCiudad = () => {
    const ciudad = nuevaCiudad.trim();
    if (!ciudad) return;
    const actuales = formData.targetCities || [];
    if (!actuales.includes(ciudad)) setFormData({ ...formData, targetCities: [...actuales, ciudad] });
    setNuevaCiudad("");
  };

  const quitarCiudad = (ciudad: string) =>
    setFormData({ ...formData, targetCities: (formData.targetCities || []).filter((c) => c !== ciudad) });

  return (
    <>
      <div>
        <p className="block text-xs font-sans font-bold text-[var(--ink-2)] mb-1">A quién va</p>
        <div className="grid grid-cols-2 gap-1 p-1 bg-[var(--sunken)] rounded-[var(--r-m)]">
          <Button
            type="button"
            size="xs"
            variant={!esFestivales ? "selected" : "ghost"}
            onClick={() => setFormData({ ...formData, alcance: "salas" })}
          >
            Salas de una ciudad
          </Button>
          <Button
            type="button"
            size="xs"
            variant={esFestivales ? "selected" : "ghost"}
            onClick={() => setFormData({ ...formData, alcance: "festivales" })}
          >
            Festivales · España y Europa
          </Button>
        </div>
      </div>

      {!esFestivales && (
        <>
              {/* Target Cities */}
              <div>
                <label className="block text-xs font-sans font-bold text-[var(--ink-2)] mb-1">
                  Ciudades objetivo *
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {formData.targetCities?.map((city) => (
                    <span
                      key={city}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-[var(--r-s)] bg-[var(--acc)]/20 text-[var(--ink)]"
                    >
                      <MapPin className="w-3 h-3 text-[var(--ink-2)]" />
                      {city}
                      <IconButton
                        label="Cerrar"
                        variant="danger"
                        type="button"
                        onClick={() => quitarCiudad(city)}
                        className="ml-1"
                      >
                        <X className="w-3 h-3" />
                      </IconButton>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    size="sm"
                    type="text"
                    value={nuevaCiudad}
                    onChange={(e) => setNuevaCiudad(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        anadirCiudad();
                      }
                    }}
                    placeholder="Añadir ciudad (ej. Barcelona) y pulsar Enter"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={anadirCiudad}
                    className="px-3 py-1.5 bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink)] text-xs font-sans font-bold rounded-[var(--r-pill)]"
                  >
                    + Añadir
                  </button>
                </div>
              </div>

              {/* Capacity Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-sans font-bold text-[var(--ink-2)] mb-1">
                    Aforo mínimo (pax)
                  </label>
                  <Input size="sm" aria-label="Aforo mínimo (pax)"
                    type="number"
                    value={formData.minCapacity || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minCapacity: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-sans font-bold text-[var(--ink-2)] mb-1">
                    Aforo Máximo (pax)
                  </label>
                  <Input size="sm" aria-label="Aforo Máximo (pax)"
                    type="number"
                    value={formData.maxCapacity || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxCapacity: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full"
                  />
                </div>
              </div>

        </>
      )}
    </>
  );
}
