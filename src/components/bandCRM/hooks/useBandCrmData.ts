/**
 * Carga de bandas, métricas, reproductor y bandas registradas.
 * Extraído de BandCRM.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import type { RegisteredBand } from "../bandCrmTypes";
import { useEffect, useState } from "react";
import { BandContact, BandRelationshipStatus, Lead } from "../../../types";
import { apiFetch } from "../../../utils/api";
import { ColaBanda } from "../../booking/BandPreviewPlayer";
import { BulkProgressItem } from "../../booking/BulkProgressModal";
import type { MetricasBanda } from "../bandMetrics";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface BandCrmDataParams {
  bandName: string;
  currentBandId: string;
  leads: Lead[];
}

/**
 * Carga de bandas, métricas, reproductor y bandas registradas.
 * @param params Estado y callbacks del contenedor ({@link BandCrmDataParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useBandCrmData({ bandName, currentBandId, leads }: BandCrmDataParams) {
  // En móvil las tarjetas se leen sin scroll horizontal; la tabla queda para pantallas anchas.
  // `id` cambia en cada pulsación: el reproductor se remonta y una cola nueva siempre arranca.
  const [reproductor, setReproductor] = useState<{ id: number; cola: ColaBanda[]; inicio: number } | null>(null);

  // Bandas con preview disponible (vacío mientras se consulta: no se muestra ningún ▶ sin comprobar).
  const [disponibles, setDisponibles] = useState<Record<string, boolean>>({});

  // Último periodo de métricas por banda (seguidores y suscriptores).
  const [metricas, setMetricas] = useState<Record<string, MetricasBanda>>({});

  const [actualizandoMetricas, setActualizandoMetricas] = useState(false);

  const myBandName = bandName?.trim() || "nuestra banda";

  // Local state for band contacts with persistence
  const [bands, setBands] = useState<BandContact[]>([]);

  const [selectedBandIds, setSelectedBandIds] = useState<string[]>([]);

  const [bulkProgressState, setBulkProgressState] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    items: BulkProgressItem[];
    currentIndex: number;
    totalCount: number;
    isCompleted: boolean;
  }>({
    isOpen: false,
    title: "",
    items: [],
    currentIndex: 0,
    totalCount: 0,
    isCompleted: false,
  });

  const [, setIsLoading] = useState(true);

  const fetchBands = () => {
    apiFetch<{ bands: BandContact[] }>("/api/bands")
      .then((data) => {
        if (data && data.bands) {
          setBands(data.bands);
        }
      })
      .catch((err) => {
        if (err?.status !== 401) console.warn("Could not load bands:", err);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    const token =
      localStorage.getItem("bakandeya_token") || localStorage.getItem("token");
    if (token) {
      fetchBands();
    }
  }, [currentBandId]);

  const cargarMetricas = () => {
    apiFetch<{ success: boolean; metricas: Record<string, MetricasBanda> }>("/api/bands/metricas")
      .then((data) => setMetricas(data.metricas || {}))
      .catch(() => setMetricas({}));
  };

  const actualizarMetricas = async () => {
    setActualizandoMetricas(true);
    try {
      const r = await apiFetch<{ filas: number; bandas: number; motivos: Record<string, number> }>(
        "/api/bands/metricas/actualizar",
        { method: "POST" },
      );
      cargarMetricas();
      const motivos = Object.entries(r.motivos || {}).map(([m, n]) => `· ${m} (${n} bandas)`);
      alert(
        `Métricas guardadas: ${r.filas} filas de ${r.bandas} bandas.` +
          (motivos.length ? `\n\nFuentes sin dato:\n${motivos.join("\n")}` : ""),
      );
    } catch {
      alert("No se pudieron actualizar las métricas. Inténtalo más tarde.");
    } finally {
      setActualizandoMetricas(false);
    }
  };

  useEffect(() => {
    if (bands.length > 0) cargarMetricas();
  }, [currentBandId, bands.length]);

  // Qué bandas tienen algo que escuchar: solo ellas muestran el ▶.
  useEffect(() => {
    if (bands.length === 0) return;
    let cancelado = false;
    apiFetch<{ success: boolean; disponibles: Record<string, boolean> }>("/api/bands/previews-availability")
      .then((data) => {
        if (!cancelado) setDisponibles(data.disponibles || {});
      })
      .catch(() => {
        if (!cancelado) setDisponibles({});
      });
    return () => {
      cancelado = true;
    };
  }, [currentBandId, bands.length]);

  // Save changes to localStorage whenever bands state updates

  // Sync leads of type'grupo', management and productoras from the main leads list if new ones appear
  useEffect(() => {
    if (leads && leads.length > 0) {
      const groupLeads = leads.filter((l) => {
        if (!l.tipo) return false;
        const norm = String(l.tipo).trim().toLowerCase();
        return (
          norm === "grupo" ||
          norm.includes("grup") ||
          norm.includes("banda") ||
          norm.includes("artist") ||
          norm === "productora" ||
          norm.includes("product") ||
          norm === "manager" ||
          norm.includes("manag") ||
          norm === "agencia" ||
          norm.includes("agenc") ||
          norm === "sello" ||
          norm.includes("sello")
        );
      });

      if (groupLeads.length > 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- importa a la lista de bandas los leads de tipo grupo/sello
        setBands((prevBands) => {
          const existingIds = new Set(prevBands.map((b) => b.id));
          const existingNames = new Set(
            prevBands.map((b) => b.nombre_banda.toLowerCase().trim()),
          );

          const newFromLeads: BandContact[] = groupLeads
            .filter(
              (l) =>
                !existingIds.has(l.id) &&
                !existingNames.has(l.nombre_sala.toLowerCase().trim()),
            )
            .map((l) => ({
              id:
                l.id ||
                `lead-band-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              nombre_banda: l.nombre_sala,
              estilo_musical: l.genero || "Ska / Fusion / Mestizaje",
              localizacion: l.ciudad || "España",
              // eslint-disable-next-line react-hooks/immutability -- id temporal para leads sin id; solo se usa como clave
              estado_relacion: mapLeadStatusToBandStatus(l.estado),
              ultimo_contacto:
                l.fecha_ultima_respuesta ||
                l.fecha_envio ||
                new Date().toISOString().split("T")[0],
              contacto_nombre: l.contacto_nombre || "Contacto Principal",
              email: l.email_contacto || "",
              telefono: l.telefono || "",
              instagram: l.instagram || "",
              spotify_youtube: l.website || "",
              aforo_promedio: l.aforo || 0,
              notas_colaboracion:
                l.notas ||
                l.pitch_generado ||
                "Importado desde Leads de Booking.",
              ciudad_origen_swap: l.ciudad || "España",
            }));

          if (newFromLeads.length === 0) return prevBands;
          return [...prevBands, ...newFromLeads];
        });
      }
    }
  }, [leads]);

  // Helper mapping from LeadStatus to BandRelationshipStatus
  function mapLeadStatusToBandStatus(status?: string): BandRelationshipStatus {
    switch (status) {
      case "aprobado":
        return "intercambio_propuesto";
      case "interesado":
      case "negociando":
        return "intercambio_propuesto";
      case "esperando_respuesta":
        return "pendiente_respuesta";
      default:
        return "sin_contactar";
    }
  }

  // UI Filter & Search state
  const [subTab, setSubTab] = useState<"co_booking" | "registered_bands">(
    "co_booking",
  );

  const [registeredBands, setRegisteredBands] = useState<RegisteredBand[]>([]);

  const [isLoadingRegBands, setIsLoadingRegBands] = useState(false);

  const fetchRegisteredBands = () => {
    setIsLoadingRegBands(true);
    apiFetch<{ registeredBands: RegisteredBand[] }>("/api/registered-bands")
      .then((data) => {
        if (data && data.registeredBands) {
          setRegisteredBands(data.registeredBands);
        }
      })
      .catch((err) => {
        if (err?.status !== 401)
          console.warn("Could not load registered bands:", err);
      })
      .finally(() => setIsLoadingRegBands(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga las bandas registradas al abrir la pestaña
    fetchRegisteredBands();
  }, [currentBandId]);

  return { setReproductor, bands, myBandName, setBands, setSelectedBandIds, selectedBandIds, fetchBands, setBulkProgressState, registeredBands, subTab, setSubTab, fetchRegisteredBands, actualizarMetricas, actualizandoMetricas, isLoadingRegBands, metricas, disponibles, reproductor, bulkProgressState };
}
