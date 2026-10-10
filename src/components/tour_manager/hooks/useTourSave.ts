/**
 * Guardado de la gira, sincronización con calendario y volcado a finanzas.
 * Extraído de TourManager.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React,{ Dispatch,SetStateAction,useState } from "react";
import { Concert,Payment,Tour,TourRouteStop,TourVehicle } from "../../../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface TourSaveParams {
  formNombre: string;
  formStops: TourRouteStop[];
  formVehiculos: TourVehicle[];
  formConvocatoriaTipo: "completa" | "parcial";
  availableMembers: { id: string; name: string; role: string; instrument: string; }[];
  formConvocadosIds: string[];
  editingTour: Tour;
  formSincronizarCalendario: boolean;
  currentBandId: string;
  currentBandName: string;
  formEstado: "planificacion" | "confirmada" | "completada" | "cancelada";
  concerts: Concert[];
  onUpdateConcert: (id: string, updatedFields: Partial<Concert>) => void;
  onAddConcert: (concert: Concert) => void;
  formSincronizarFinanzas: boolean;
  onSaveTour: (tour: Tour) => void;
  setIsModalOpen: Dispatch<SetStateAction<boolean>>;
  onAddPayment: (payment: Payment) => void;
}

/**
 * Guardado de la gira, sincronización con calendario y volcado a finanzas.
 * @param params Estado y callbacks del contenedor ({@link TourSaveParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useTourSave({ formNombre, formStops, formVehiculos, formConvocatoriaTipo, availableMembers, formConvocadosIds, editingTour, formSincronizarCalendario, currentBandId, currentBandName, formEstado, concerts, onUpdateConcert, onAddConcert, formSincronizarFinanzas, onSaveTour, setIsModalOpen, onAddPayment }: TourSaveParams) {
  // Sync Notification Toast
  const [syncFeedback, setSyncFeedback] = useState<{
    tourId: string;
    message: string;
    type: "success" | "info" | "error";
  } | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) {
      alert("Por favor introduce el nombre de la gira.");
      return;
    }

    const startDate =
      formStops.length > 0
        ? [...formStops].sort((a, b) => a.fecha.localeCompare(b.fecha))[0].fecha
        : new Date().toISOString().split("T")[0];
    const endDate =
      formStops.length > 0
        ? [...formStops].sort((a, b) => b.fecha.localeCompare(a.fecha))[0].fecha
        : new Date().toISOString().split("T")[0];

    const totalGastos = formStops.reduce(
      (sum, stop) =>
        sum +
        (stop.gastosAlojamiento || 0) +
        (stop.gastosGasolina || 0) +
        (stop.gastosDietas || 0),
      0,
    );

    const primaryVehicle = formVehiculos[0] || {
      nombre: "Furgoneta",
      consumoL100km: 9.5,
      precioCarburanteEUR: 1.55,
      tipoCombustible: "diesel",
    };

    const convocadosNombres =
      formConvocatoriaTipo === "completa"
        ? availableMembers.map((m) => m.name)
        : availableMembers
            .filter((m) => formConvocadosIds.includes(m.id))
            .map((m) => m.name);

    const tourId = editingTour ? editingTour.id : `tour-${Date.now()}`;

    // Sincronización con el Calendario / Conciertos
    const updatedStops = formStops.map((stop, idx) => {
      let concertId = stop.concertId;

      if (formSincronizarCalendario && stop.ciudad && stop.fecha) {
        if (!concertId) {
          concertId = `cnc-tour-${tourId}-${idx + 1}`;
        }

        const concertData: Concert = {
          id: concertId,
          band_id: currentBandId,
          bandName: currentBandName,
          fecha: stop.fecha,
          ciudad: stop.ciudad || "Ciudad de Gira",
          sala: stop.sala || "Sala de Gira",
          cache: Number(stop.ingresoCacheEstimated || 0),
          aforo_vendido: 0,
          aforo_total: 300,
          contrato_firmado:
            formEstado === "confirmada" || formEstado === "completada",
          estado_pago: "pendiente",
          notas: `Gira: ${formNombre.trim()} (Parada #${idx + 1})${stop.notasLogisticas ? ` - ${stop.notasLogisticas}` : ""}`,
          tipo: "sala",
          giraId: tourId,
          giraNombre: formNombre.trim(),
          convocatoria_tipo: formConvocatoriaTipo,
          convocados_ids:
            formConvocatoriaTipo === "completa"
              ? availableMembers.map((m) => m.id)
              : formConvocadosIds,
          convocados_nombres: convocadosNombres,
          gastosDetalle: {
            gasolina: stop.gastosGasolina || 0,
            dietas: stop.gastosDietas || 0,
            alojamiento: stop.gastosAlojamiento || 0,
            otros: 0,
            notasGastos: `Logística Gira ${formNombre.trim()}`,
          },
        };

        const existingConcert = concerts.find((c) => c.id === concertId);
        if (existingConcert && onUpdateConcert) {
          onUpdateConcert(concertId, concertData);
        } else if (onAddConcert) {
          onAddConcert(concertData);
        }
      }

      return {
        ...stop,
        concertId,
        convocatoria_tipo: formConvocatoriaTipo,
        convocados_ids: formConvocadosIds,
        convocados_nombres: convocadosNombres,
      };
    });

    const tourData: Tour = {
      id: tourId,
      band_id: currentBandId,
      nombre: formNombre.trim(),
      vehiculo:
        formVehiculos
          .map((v) => v.nombre)
          .filter(Boolean)
          .join(", ") || primaryVehicle.nombre,
      consumoL100km: primaryVehicle.consumoL100km,
      precioCarburanteEUR: primaryVehicle.precioCarburanteEUR,
      tipoCombustible: primaryVehicle.tipoCombustible,
      vehiculos: formVehiculos,
      estado: formEstado,
      fechaInicio: startDate,
      fechaFin: endDate,
      presupuestoLogistica: totalGastos,
      convocatoria_tipo: formConvocatoriaTipo,
      convocados_ids: formConvocadosIds,
      convocados_nombres: convocadosNombres,
      sincronizarCalendario: formSincronizarCalendario,
      sincronizarFinanzas: formSincronizarFinanzas,
      stops: updatedStops,
    };

    onSaveTour(tourData);
    setIsModalOpen(false);

    setSyncFeedback({
      tourId,
      message: `Gira "${tourData.nombre}" guardada y sincronizada con ${updatedStops.length} paradas en el Calendario.`,
      type: "success",
    });
    setTimeout(() => setSyncFeedback(null), 5000);
  };

  // Volcar Gira completa en Finanzas
  const handleVolcarEnFinanzas = (tour: Tour) => {
    if (!onAddPayment) {
      alert("La función de finanzas no está disponible en este momento.");
      return;
    }

    const totalGasolina = tour.stops.reduce(
      (sum, s) => sum + (s.gastosGasolina || 0),
      0,
    );
    const totalDietas = tour.stops.reduce(
      (sum, s) => sum + (s.gastosDietas || 0),
      0,
    );
    const totalAlojamiento = tour.stops.reduce(
      (sum, s) => sum + (s.gastosAlojamiento || 0),
      0,
    );

    const now = Date.now();
    let count = 0;

    // Ingresos de cada parada
    tour.stops.forEach((stop, idx) => {
      if (stop.ingresoCacheEstimated && stop.ingresoCacheEstimated > 0) {
        onAddPayment({
          id: `pay-in-${tour.id}-${stop.id || idx}-${now}`,
          band_id: currentBandId,
          tipo: "ingreso",
          categoria: "concierto",
          concepto: `Caché Gira: ${tour.nombre} - ${stop.ciudad || "Parada"} (${stop.sala || "Sala"})`,
          importe: Number(stop.ingresoCacheEstimated),
          fecha:
            stop.fecha ||
            tour.fechaInicio ||
            new Date().toISOString().split("T")[0],
          estado: "pendiente",
        });
        count++;
      }
    });

    // Gasto Gasolina
    if (totalGasolina > 0) {
      onAddPayment({
        id: `pay-gas-${tour.id}-${now}`,
        band_id: currentBandId,
        tipo: "gasto",
        categoria: "transporte",
        concepto: `Combustible Flota Gira: ${tour.nombre} (${tour.vehiculos?.length || 1} veh.)`,
        importe: Number(totalGasolina),
        fecha: tour.fechaInicio || new Date().toISOString().split("T")[0],
        estado: "pendiente",
      });
      count++;
    }

    // Gasto Dietas
    if (totalDietas > 0) {
      const numPers =
        tour.convocatoria_tipo === "parcial" && tour.convocados_ids?.length
          ? tour.convocados_ids.length
          : availableMembers.length;
      onAddPayment({
        id: `pay-dietas-${tour.id}-${now}`,
        band_id: currentBandId,
        tipo: "gasto",
        categoria: "comida",
        concepto: `Dietas Expedición Gira: ${tour.nombre} (${numPers} miembros)`,
        importe: Number(totalDietas),
        fecha: tour.fechaInicio || new Date().toISOString().split("T")[0],
        estado: "pendiente",
      });
      count++;
    }

    // Gasto Alojamientos
    if (totalAlojamiento > 0) {
      onAddPayment({
        id: `pay-hotel-${tour.id}-${now}`,
        band_id: currentBandId,
        tipo: "gasto",
        categoria: "alojamiento",
        concepto: `Hoteles / Alojamientos Gira: ${tour.nombre}`,
        importe: Number(totalAlojamiento),
        fecha: tour.fechaInicio || new Date().toISOString().split("T")[0],
        estado: "pendiente",
      });
      count++;
    }

    setSyncFeedback({
      tourId: tour.id,
      message: `¡Volcado exitoso! Se han registrado ${count} movimientos contables en Finanzas para la gira "${tour.nombre}".`,
      type: "success",
    });
    setTimeout(() => setSyncFeedback(null), 6000);
  };

  return { syncFeedback, handleVolcarEnFinanzas, handleSave };
}
