import { useState, useEffect, useCallback } from "react";
import { Setlist, Song } from "../types";
import { EnergyChartPoint } from "../components/repertorio/EnergyChart";

export interface UseRepertorioItemPopoversProps {
  activeSetlist: Setlist | null;
  songs: Song[];
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
  setSetlists: React.Dispatch<React.SetStateAction<Setlist[]>>;
  getHeaders: () => Record<string, string>;
  syncSetlistToBackend: (setlist: Setlist) => void;
}

export function useRepertorioItemPopovers({
  activeSetlist,
  songs,
  setSongs,
  setSetlists,
  getHeaders,
  syncSetlistToBackend,
}: UseRepertorioItemPopoversProps) {
  // Popover de energía manual (1-10 en UI, se guarda ×2 como energia 1-20)
  const [editingEnergyItemId, setEditingEnergyItemId] = useState<string | null>(null);
  const [savingEnergyItemId, setSavingEnergyItemId] = useState<string | null>(null);
  const [energyPopoverPos, setEnergyPopoverPos] = useState<{
    top: number;
    left: number;
    openUpward: boolean;
  } | null>(null);

  useEffect(() => {
    if (!editingEnergyItemId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement)?.closest?.("[data-energy-popover]")) {
        setEditingEnergyItemId(null);
      }
    };
    const handleScroll = () => setEditingEnergyItemId(null);
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [editingEnergyItemId]);

  // Popover de "tono deseado" (transposición)
  const [editingKeyItemId, setEditingKeyItemId] = useState<string | null>(null);
  const [keyPopoverPos, setKeyPopoverPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    if (!editingKeyItemId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement)?.closest?.("[data-key-popover]")) {
        setEditingKeyItemId(null);
      }
    };
    const handleScroll = () => setEditingKeyItemId(null);
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [editingKeyItemId]);

  const handleSetTonalidadDeseada = (itemId: string, tonalidad: string | null) => {
    if (!activeSetlist) return;
    const updatedSetlist: Setlist = {
      ...activeSetlist,
      items: activeSetlist.items.map((it) =>
        it.id === itemId ? { ...it, tonalidadDeseada: tonalidad || undefined } : it,
      ),
    };
    setSetlists((prev) => prev.map((st) => (st.id === activeSetlist.id ? updatedSetlist : st)));
    syncSetlistToBackend(updatedSetlist);
    setEditingKeyItemId(null);
  };

  const handleSetEnergiaManualValue = async (song: Song, itemId: string, nuevaEnergia: number) => {
    setSavingEnergyItemId(itemId);
    setSongs((prev) =>
      prev.map((s) => (s.id === song.id ? { ...s, energia: nuevaEnergia, energiaManual: true } : s)),
    );
    try {
      await fetch(`/api/songs/${song.id}/energia`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ energia: nuevaEnergia }),
      });
    } catch (err) {
      console.error("Error guardando energía manual:", err);
    } finally {
      setSavingEnergyItemId(null);
      setEditingEnergyItemId(null);
    }
  };

  const handleSetEnergiaManual = (song: Song, itemId: string, valor1a10: number) =>
    handleSetEnergiaManualValue(song, itemId, valor1a10 * 2);

  const handleEnergyChartDrag = useCallback(
    (point: EnergyChartPoint, newScore: number) => {
      if (!point.songId) return;
      const song = songs.find((s) => s.id === point.songId);
      if (song) handleSetEnergiaManualValue(song, point.id, newScore);
    },
    [songs],
  );

  return {
    editingEnergyItemId,
    setEditingEnergyItemId,
    savingEnergyItemId,
    energyPopoverPos,
    setEnergyPopoverPos,
    editingKeyItemId,
    setEditingKeyItemId,
    keyPopoverPos,
    setKeyPopoverPos,
    handleSetTonalidadDeseada,
    handleSetEnergiaManual,
    handleEnergyChartDrag,
  };
}
