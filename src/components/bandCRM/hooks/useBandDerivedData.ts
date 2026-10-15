/**
 * Bandas filtradas, filtros disponibles, contadores y texto del pitch.
 * Extraído de BandCRM.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import type { BookingCampaign } from "../../../types";
import { Dispatch, SetStateAction } from "react";
import { BandContact, BandRelationshipStatus } from "../../../types";
import { spotifyArtistUrl } from "../../../utils/spotifyEmbed";
import { ColaBanda } from "../../booking/BandPreviewPlayer";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface BandDerivedDataParams {
  setReproductor: Dispatch<SetStateAction<{ id: number; cola: ColaBanda[]; inicio: number; }>>;
  bands: BandContact[];
  searchTerm: string;
  statusFilter: BandRelationshipStatus | "todos";
  styleFilter: string;
  locationFilter: string;
  activeCampaign: BookingCampaign | null;
  myBandName: string;
  proposedMonth: string;
  proposedCity: string;
  proposedVenue: string;
}

/**
 * Bandas filtradas, filtros disponibles, contadores y texto del pitch.
 * @param params Estado y callbacks del contenedor ({@link BandDerivedDataParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useBandDerivedData({ setReproductor, bands, searchTerm, statusFilter, styleFilter, locationFilter, activeCampaign, myBandName, proposedMonth, proposedCity, proposedVenue }: BandDerivedDataParams) {
  // Filter logic
  // Escucha: la cola es la lista visible, empezando por la banda pulsada.
  const escuchar = (bandId: string) => {
    const cola = filteredBands.map((b) => ({
      id: b.id,
      nombre: b.nombre_banda,
      spotifyUrl: spotifyArtistUrl(b.spotify_youtube),
    }));
    const inicio = cola.findIndex((b) => b.id === bandId);
    if (inicio !== -1) setReproductor({ id: Date.now(), cola, inicio });
  };

  const filteredBands = bands.filter((band) => {
    // Search
    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !searchLower ||
      band.nombre_banda.toLowerCase().includes(searchLower) ||
      band.estilo_musical.toLowerCase().includes(searchLower) ||
      band.localizacion.toLowerCase().includes(searchLower) ||
      (band.contacto_nombre &&
        band.contacto_nombre.toLowerCase().includes(searchLower)) ||
      (band.email && band.email.toLowerCase().includes(searchLower));

    // Status filter
    const matchesStatus =
      statusFilter === "todos" || band.estado_relacion === statusFilter;

    // Style filter
    const matchesStyle =
      styleFilter === "todos" ||
      band.estilo_musical.toLowerCase().includes(styleFilter.toLowerCase());

    // Location filter
    const matchesLocation =
      locationFilter === "todos" ||
      band.localizacion.toLowerCase().includes(locationFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesStyle && matchesLocation;
  });

  // Extract unique locations and styles for filter dropdowns
  const availableLocations = Array.from(
    new Set(bands.map((b) => b.localizacion).filter(Boolean)),
  ).sort();

  // Metrics counts
  const totalBands = bands.length;

  // Generate Date Swap Pitch Text
  const generatePitchText = (band: BandContact) => {
    if (activeCampaign && activeCampaign.isActive) {
      return `¡Buenas chavales de ${band.nombre_banda}! 🎸🔥

Os escribimos directamente desde ${myBandName}.

Nos mola mucho vuestra propuesta en ${band.estilo_musical} y vemos que tenéis fuerte tirón en ${band.localizacion}. Os escribimos porque estamos armando una campaña de conciertos muy especial y creemos que podríamos montar un cartelazo juntos.

Nuestro objetivo es un aforo de ${activeCampaign.minCapacity}-${activeCampaign.maxCapacity} personas en ${activeCampaign.targetCities.join(", ")} para las fechas: ${activeCampaign.targetDatesText || "la próxima temporada"}. 

Nuestra idea es montar un CO-BOOKING donde nosotros aportamos la producción y nuestro público en la ciudad, y vosotros sumáis vuestra fuerza para asegurar un *sold out* brutal. Además, dejamos la puerta abierta para devolveros la visita en ${band.localizacion} en el futuro compartiendo escenario y backline.

¿Os cuadran las fechas? ¿Qué os parece la idea? Si os mola, hablamos por WhatsApp esta semana para cerrar los detalles de sala.

¡Un fuerte abrazo!
${myBandName}`;
    }

    return `¡Buenas chavales de ${band.nombre_banda}! 🎸🔥

Os escribimos directamente desde ${myBandName}.

Nos mola mucho vuestra propuesta en ${band.estilo_musical} y vemos que tenéis fuerte tirón en ${band.localizacion}. Queremos proponer un INTERCAMBIO DE FECHAS / CO-BOOKING (Date Swap) para la temporada de ${proposedMonth}:

1. Os invitamos a tocar con nosotros${proposedCity ? ` en ${proposedCity}` : ""}${proposedVenue ? ` (${proposedVenue})` : ""}, compartiendo escenario, cartel y taquilla al 50%.
2. Montamos la fecha de vuelta en ${band.localizacion} en vuestro local habitual para sumar ambos públicos locales y abaratar gastos de furgoneta y backline.

¿Cómo lo veis? ¿Hablamos por WhatsApp o hacemos una breve llamada esta semana para cuadrar fechas?

¡Un fuerte abrazo!
${myBandName}`;
  };

  return { filteredBands, totalBands, availableLocations, escuchar, generatePitchText };
}
