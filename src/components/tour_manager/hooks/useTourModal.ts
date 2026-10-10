/**
 * Apertura del modal para crear o editar una gira.
 * Extraído de TourManager.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Dispatch,SetStateAction,useState } from "react";
import { Tour,TourRouteStop,TourVehicle } from "../../../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface TourModalParams {
  setFormNombre: Dispatch<SetStateAction<string>>;
  setFormVehiculos: Dispatch<SetStateAction<TourVehicle[]>>;
  setFormEstado: Dispatch<SetStateAction<"planificacion" | "confirmada" | "completada" | "cancelada">>;
  setFormConvocatoriaTipo: Dispatch<SetStateAction<"completa" | "parcial">>;
  setFormConvocadosIds: Dispatch<SetStateAction<string[]>>;
  availableMembers: { id: string; name: string; role: string; instrument: string; }[];
  setFormSincronizarCalendario: Dispatch<SetStateAction<boolean>>;
  setFormSincronizarFinanzas: Dispatch<SetStateAction<boolean>>;
  setFormStops: Dispatch<SetStateAction<TourRouteStop[]>>;
}

/**
 * Apertura del modal para crear o editar una gira.
 * @param params Estado y callbacks del contenedor ({@link TourModalParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useTourModal({ setFormNombre, setFormVehiculos, setFormEstado, setFormConvocatoriaTipo, setFormConvocadosIds, availableMembers, setFormSincronizarCalendario, setFormSincronizarFinanzas, setFormStops }: TourModalParams) {
  const [editingTour, setEditingTour] = useState<Tour | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenCreateModal = () => {
    setEditingTour(null);
    setFormNombre("");
    setFormVehiculos([
      {
        id: "veh-1",
        nombre: "Furgoneta Sprinter / Master (Grande)",
        consumoL100km: 9.5,
        precioCarburanteEUR: 1.55,
        tipoCombustible: "diesel",
      },
    ]);
    setFormEstado("planificacion");
    setFormConvocatoriaTipo("completa");
    setFormConvocadosIds(availableMembers.map((m) => m.id));
    setFormSincronizarCalendario(true);
    setFormSincronizarFinanzas(false);
    setFormStops([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tour: Tour) => {
    setEditingTour(tour);
    setFormNombre(tour.nombre);

    const vehicles: TourVehicle[] =
      tour.vehiculos && tour.vehiculos.length > 0
        ? tour.vehiculos
        : [
            {
              id: "veh-1",
              nombre: tour.vehiculo || "Furgoneta 9 Plazas",
              consumoL100km: tour.consumoL100km ?? 9.5,
              precioCarburanteEUR: tour.precioCarburanteEUR ?? 1.55,
              tipoCombustible: tour.tipoCombustible ?? "diesel",
            },
          ];

    setFormVehiculos(vehicles);
    setFormEstado(tour.estado);
    setFormConvocatoriaTipo(tour.convocatoria_tipo || "completa");
    setFormConvocadosIds(
      tour.convocados_ids && tour.convocados_ids.length > 0
        ? tour.convocados_ids
        : availableMembers.map((m) => m.id),
    );
    setFormSincronizarCalendario(tour.sincronizarCalendario ?? true);
    setFormSincronizarFinanzas(tour.sincronizarFinanzas ?? false);
    setFormStops([...tour.stops]);
    setIsModalOpen(true);
  };

  return { editingTour, setIsModalOpen, handleOpenCreateModal, handleOpenEditModal, isModalOpen };
}
