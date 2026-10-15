/**
 * Filtros, vista, modales y propuesta de pitch del CRM de bandas.
 * Extraído de BandCRM.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";
import { BandContact, BandRelationshipStatus } from "../../../types";
import { ToneAnalysisData } from "../BandToneModal";

/**
 * Filtros, vista, modales y propuesta de pitch del CRM de bandas.
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useBandCrmUiState() {
  const [searchTerm, setSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] = useState<
    BandRelationshipStatus | "todos"
  >("todos");

  const [styleFilter] = useState<string>("todos");

  const [locationFilter, setLocationFilter] = useState<string>("todos");

  const [isSpotifySweepOpen, setIsSpotifySweepOpen] = useState(false);

  const [viewMode, setViewMode] = useState<"grid" | "table" | "map">(() =>
    typeof window !== "undefined" && window.innerWidth < 640 ? "grid" : "table",
  );

  // Modal State
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);

  const [editingBand, setEditingBand] = useState<BandContact | null>(null);

  // Date Swap Generator Modal State
  const [isPitchModalOpen, setIsPitchModalOpen] = useState(false);

  const [selectedPitchBand, setSelectedPitchBand] =
    useState<BandContact | null>(null);

  const [proposedCity, setProposedCity] = useState<string>("");

  const [proposedMonth, setProposedMonth] = useState(
    "Octubre / Noviembre 2026",
  );

  const [proposedVenue, setProposedVenue] = useState<string>("");

  const [customPitchText, setCustomPitchText] = useState<string>("");

  // Tone & Communication Scraper Modal State
  const [isToneModalOpen, setIsToneModalOpen] = useState(false);

  const [selectedToneBand, setSelectedToneBand] = useState<BandContact | null>(
    null,
  );

  const [toneData, setToneData] = useState<ToneAnalysisData | null>(null);

  const [isAnalyzingTone, setIsAnalyzingTone] = useState(false);

  return { searchTerm, statusFilter, styleFilter, locationFilter, proposedMonth, proposedCity, proposedVenue, setSelectedToneBand, setIsToneModalOpen, setIsAnalyzingTone, setToneData, setEditingBand, setIsAddEditModalOpen, editingBand, setSelectedPitchBand, setIsPitchModalOpen, setIsSpotifySweepOpen, setSearchTerm, setStatusFilter, setLocationFilter, setViewMode, viewMode, setCustomPitchText, isAddEditModalOpen, isPitchModalOpen, selectedPitchBand, setProposedCity, setProposedVenue, setProposedMonth, customPitchText, isToneModalOpen, selectedToneBand, toneData, isAnalyzingTone, isSpotifySweepOpen };
}
