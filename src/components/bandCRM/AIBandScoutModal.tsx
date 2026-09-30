import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  Sparkles,
  MapPin,
  Music,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { ModalPortal } from "../common/ModalPortal";
import { BandContact, BookingCampaign } from "../../types";
import { apiFetch } from "../../utils/api";
import { Button, Input, Select } from '../ui';

interface AIBandScoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCampaign?: BookingCampaign | null;
  onAddBands: (bands: Partial<BandContact>[]) => void;
}

export function AIBandScoutModal({
  isOpen,
  onClose,
  activeCampaign,
  onAddBands,
}: AIBandScoutModalProps) {
  const [city, setCity] = useState("");
  const [genre, setGenre] = useState("");
  const [count, setCount] = useState<number>(5);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Partial<BandContact>[]>([]);
  const [selectedBands, setSelectedBands] = useState<Set<number>>(new Set());

  // Pre-fill from active campaign or defaults
  useEffect(() => {
    if (isOpen) {
      if (activeCampaign && activeCampaign.targetCities.length > 0) {
        // If the campaign is in Madrid, we probably want bands from OUTSIDE Madrid
        // as the user mentioned"bandas conocidillas fuera de madrid para invitarles a venir"
        const mainCity = activeCampaign.targetCities[0].toLowerCase();
        if (mainCity.includes("madrid")) {
          setCity("Barcelona, Valencia o Bilbao"); // Default suggestion outside
        } else {
          setCity("Madrid"); // Suggest bringing Madrid bands to their city
        }
      } else {
        setCity("Barcelona");
      }
      setGenre("");
      setResults([]);
      setSelectedBands(new Set());
      setError("");
    }
  }, [isOpen, activeCampaign]);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!city && !genre) {
      setError("Debes especificar una ciudad o un estilo musical.");
      return;
    }

    setIsSearching(true);
    setError("");
    setResults([]);
    setSelectedBands(new Set());

    try {
      const response = await apiFetch("/api/bands/ai-scout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, genre, count }),
      });
      if (response && response.bands) {
        setResults(response.bands);
        // Auto-select all by default
        setSelectedBands(new Set(response.bands.map((_: any, i: number) => i)));
      }
    } catch (err: any) {
      setError(err.message || "Error al buscar bandas con IA.");
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSelection = (index: number) => {
    const newSelection = new Set(selectedBands);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedBands(newSelection);
  };

  const handleImport = () => {
    const bandsToImport = results.filter((_, i) => selectedBands.has(i));
    if (bandsToImport.length > 0) {
      onAddBands(bandsToImport);
    }
    onClose();
  };

  const bgColor = "bg-[var(--surface)]";
  const textColor = "text-[var(--ink)]";
  const subtextColor = "text-[var(--ink-2)]";
  const inputBg = "bg-[var(--bg)]";
  const borderColor = "";

  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-[var(--scrim)]/60 z-[9999] flex items-center justify-center p-4">
        <div
          className={`w-full max-w-4xl ${bgColor} rounded-[var(--r-l)] overflow-hidden flex flex-col max-h-[90vh]`}
        >
          {/* Header */}
          <div className="p-4/10 flex justify-between items-center bg-[var(--acc)]/10 ">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--acc)]/20 rounded-[var(--r-s)] text-[var(--acc-ink)]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`font-bold text-lg ${textColor}`}>
                  Scout IA de Bandas Aliadas
                </h3>
                <p className={`text-xs ${subtextColor}`}>
                  Descubre bandas para Co-booking o Date Swap
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--sunken)] rounded-[var(--r-pill)] transition-colors text-[var(--ink-2)] hover:text-[var(--ink-2)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 flex-1 overflow-y-auto">
            {activeCampaign && (
              <div className="mb-6 p-4 bg-[var(--acc)]/10 rounded-[var(--r-m)] flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[var(--acc)] shrink-0 mt-0.5" />
                <div>
                  <p className={`text-sm font-medium ${textColor}`}>
                    Contexto de tu campaña activa
                  </p>
                  <p className={`text-xs ${subtextColor} mt-1`}>
                    Buscando llenar un aforo de {activeCampaign.minCapacity}-
                    {activeCampaign.maxCapacity} en{" "}
                    {activeCampaign.targetCities.join(",")}. Busca bandas de{" "}
                    <strong>otras ciudades</strong> para invitarlas a Madrid y
                    luego devolverles la visita (Date Swap).
                  </p>
                </div>
              </div>
            )}

            {/* Search Form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label
                  className={`block text-xs font-bold mb-1.5 ${subtextColor}`}
                >
                  Ciudad origen de la banda
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-2)]" />
                  <Input
                    size="sm"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ej: Barcelona, Valencia…"
                    className="w-full pl-9 pr-3"
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block text-xs font-bold mb-1.5 ${subtextColor}`}
                >
                  Estilo / género musical
                </label>
                <div className="relative">
                  <Music className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-2)]" />
                  <Input
                    size="sm"
                    type="text"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    placeholder="Ej: Balkan Ska, Punk Rock…"
                    className="w-full pl-9 pr-3"
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block text-xs font-bold mb-1.5 ${subtextColor}`}
                >
                  Cantidad (Max 10)
                </label>
                <Select size="sm" aria-label="Cantidad (Max 10)"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  wrapperClassName="w-full"
                >
                  <option value={3}>3 bandas</option>
                  <option value={5}>5 bandas</option>
                  <option value={10}>10 bandas</option>
                </Select>
              </div>
            </div>

            <div className="flex justify-center mb-8">
              <Button
                variant="primary"
                onClick={handleSearch}
                disabled={isSearching}
                className="items-center gap-2"
              >
                {isSearching ? (
                  <>
                    <Loader2 aria-hidden className="w-5 h-5 animate-spin text-[var(--ink-2)]" />
                    Buscando bandas compatibles…
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Scoutear bandas con IA
                  </>
                )}
              </Button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-[var(--alert)]/10 text-[var(--alert)] rounded-[var(--r-m)] flex items-center gap-2 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Results */}
            {results.length > 0 && (
              <div className="space-y-4">
                <h4
                  className={`font-bold text-sm ${subtextColor} flex items-center justify-between`}
                >
                  Resultados del Scout
                  <span className="text-xs font-normal">
                    {selectedBands.size} seleccionadas
                  </span>
                </h4>

                <div className="grid grid-cols-1 gap-3">
                  {results.map((band, idx) => (
                    <div
                      key={idx}
                      onClick={() => toggleSelection(idx)}
                      className={`p-4 rounded-[var(--r-m)] transition-ui cursor-pointer flex items-center justify-between
 ${selectedBands.has(idx) ? "bg-[var(--acc)]/5" : `${borderColor} ${inputBg} opacity-70 hover:opacity-100`}`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-6 h-6 rounded-[var(--r-pill)] flex items-center justify-center shrink-0
 ${selectedBands.has(idx) ? "bg-[var(--acc)] text-[var(--on-acc)]" : ""}`}
                        >
                          {selectedBands.has(idx) && (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <h5 className={`font-bold ${textColor} text-base`}>
                            {band.nombre_banda}
                          </h5>
                          <div
                            className={`flex items-center gap-3 mt-1 text-xs ${subtextColor}`}
                          >
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {band.localizacion}
                            </span>
                            <span className="flex items-center gap-1">
                              <Music className="w-3 h-3" />{" "}
                              {band.estilo_musical}
                            </span>
                            {band.aforo_promedio && (
                              <span className="flex items-center gap-1">
                                <UserPlus className="w-3 h-3" /> ~
                                {band.aforo_promedio} pax
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className={`p-4 ${borderColor} flex justify-end gap-3 bg-[var(--sunken)]`}
          >
            <button
              onClick={onClose}
              className={`px-4 py-2 font-medium text-sm rounded-[var(--r-m)] ${subtextColor} hover:${textColor} transition-colors`}
            >
              Cancelar
            </button>
            <Button
              variant="neutral"
              onClick={handleImport}
              disabled={selectedBands.size === 0}
              className="items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Importar {selectedBands.size} Bandas al CRM
            </Button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
