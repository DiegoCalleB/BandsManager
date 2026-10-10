/**
 * Filtros, métricas derivadas y exportación CSV de fans.
 * Extraído de FansPanel.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useMemo,useState } from "react";
import * as XLSX from "xlsx";
import { Concert,Fan } from "../../../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface FansFiltersParams {
  fans: Fan[];
  concerts: Concert[];
  effectiveBandName: string;
}

/**
 * Filtros, métricas derivadas y exportación CSV de fans.
 * @param params Estado y callbacks del contenedor ({@link FansFiltersParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useFansFilters({ fans, concerts, effectiveBandName }: FansFiltersParams) {
  const [searchQuery, setSearchQuery] = useState("");

  const [filterOrigen, setFilterOrigen] = useState<string>("");

  const [selectedCityFilter, setSelectedCityFilter] = useState<string>("");

  const [selectedNivelFilter, setSelectedNivelFilter] = useState<string>("");

  const filteredFans = useMemo(() => {
    return fans.filter((f) => {
      const matchQuery =
        f.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.ciudad &&
          f.ciudad.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (f.conciertoOrigenNombre &&
          f.conciertoOrigenNombre
            .toLowerCase()
            .includes(searchQuery.toLowerCase()));

      const matchFilter = filterOrigen
        ? f.conciertoOrigenId === filterOrigen ||
          (filterOrigen === "Otros" && !f.conciertoOrigenId)
        : true;

      const matchCity = selectedCityFilter
        ? f.ciudad &&
          f.ciudad.toLowerCase().includes(selectedCityFilter.toLowerCase())
        : true;

      const matchNivel = selectedNivelFilter
        ? f.nivelFan === selectedNivelFilter
        : true;

      return matchQuery && matchFilter && matchCity && matchNivel;
    });
  }, [
    fans,
    searchQuery,
    filterOrigen,
    selectedCityFilter,
    selectedNivelFilter,
  ]);

  // Analytics Data - Channel of Origin (robust categorization)
  const originData = useMemo(() => {
    if (!fans || fans.length === 0) return [];
    const counts: Record<string, number> = {};

    fans.forEach((f) => {
      let raw = (f.comoConocio || f.conciertoOrigenNombre || "").trim();
      if (!raw) {
        if (f.conciertoOrigenId) raw = "Concierto en Directo";
        else raw = "Registro Directo / QR";
      }

      let category = raw;
      const lower = raw.toLowerCase();
      if (
        lower.includes("sala") ||
        lower.includes("concierto") ||
        lower.includes("festival") ||
        lower.includes("directo") ||
        lower.includes("bolo") ||
        lower.includes("caracol") ||
        lower.includes("viña")
      ) {
        category = "Conciertos / Directo";
      } else if (lower.includes("insta") || lower.includes("ig")) {
        category = "Instagram";
      } else if (lower.includes("tik")) {
        category = "TikTok";
      } else if (lower.includes("qr") || lower.includes("escenario")) {
        category = "Escaneo QR";
      } else if (lower.includes("amigo") || lower.includes("boca")) {
        category = "Boca a Boca / Amigos";
      } else if (
        lower.includes("spot") ||
        lower.includes("you") ||
        lower.includes("web")
      ) {
        category = "Web / Streaming";
      } else if (lower.includes("manual")) {
        category = "Registro Manual";
      }

      counts[category] = (counts[category] || 0) + 1;
    });

    const total = fans.length;
    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        percentage: Math.round((value / total) * 100),
      }))
      .sort((a, b) => b.value - a.value);
  }, [fans]);

  // Analytics Data - Evolutionary Cumulative Growth Chart
  const evolutionaryGrowthData = useMemo(() => {
    if (!fans || fans.length === 0) return [];

    const monthMap: Record<string, number> = {};
    fans.forEach((f) => {
      const month = f.fechaCaptura ? f.fechaCaptura.substring(0, 7) : "2026-05";
      monthMap[month] = (monthMap[month] || 0) + 1;
    });

    const sortedMonths = Object.keys(monthMap).sort();
    let runningTotal = 0;
    const monthNames = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];

    return sortedMonths.map((month) => {
      const newCount = monthMap[month];
      runningTotal += newCount;
      const [y, m] = month.split("-");
      const mIdx = m ? parseInt(m, 10) - 1 : 0;
      const label = `${monthNames[mIdx] || m} '${y ? y.slice(2) : "26"}`;
      return {
        month,
        date: label,
        nuevos: newCount,
        total: runningTotal,
      };
    });
  }, [fans]);

  const uniqueConcertIds = useMemo(() => {
    const ids = new Set<string>();
    fans.forEach((f) => {
      if (f.conciertoOrigenId) ids.add(f.conciertoOrigenId);
    });
    return Array.from(ids).map((id) => {
      const concert = concerts.find((c) => c.id === id);
      return { id, name: concert ? `${concert.sala} (${concert.fecha})` : id };
    });
  }, [fans, concerts]);

  const handleExportCSV = () => {
    const dataToExport = filteredFans.map((f) => ({
      ID: f.id,
      Nombre: f.nombre,
      Email: f.email,
      Ciudad: f.ciudad || "",
      Origen: f.comoConocio || f.conciertoOrigenNombre || "",
      "Concierto ID": f.conciertoOrigenId || "",
      "Fecha Registro": f.fechaCaptura,
      "Consentimiento RGPD": f.consentimientoRGPD ? "SÍ" : "NO",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      `Fans ${effectiveBandName}`,
    );
    XLSX.writeFile(
      workbook,
      `Fans_${effectiveBandName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  return { setSelectedCityFilter, selectedCityFilter, handleExportCSV, evolutionaryGrowthData, originData, searchQuery, setSearchQuery, filterOrigen, setFilterOrigen, uniqueConcertIds, selectedNivelFilter, setSelectedNivelFilter, filteredFans };
}
