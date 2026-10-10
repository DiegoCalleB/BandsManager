/**
 * Paso de eventos: alta de conciertos y ensayos con sus asistencias.
 * Extraído de OnboardingWizardModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";
import { Concert,Rehearsal } from "../../../../types";
import { QuickEventItem,WizardMemberItem } from "../../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface EventsStepParams {
  city: string;
  onAddRehearsal: (reh: Rehearsal) => void | Promise<unknown>;
  members: WizardMemberItem[];
  onAddConcert: (concert: Concert) => void | Promise<unknown>;
  cacheSala: number;
}

/**
 * Paso de eventos: alta de conciertos y ensayos con sus asistencias.
 * @param params Estado y callbacks del contenedor ({@link EventsStepParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useEventsStep({ city, onAddRehearsal, members, onAddConcert, cacheSala }: EventsStepParams) {
  // --- Step 11: Eventos & Agenda ---
  const [events, setEvents] = useState<QuickEventItem[]>([]);

  const [newEventTitle, setNewEventTitle] = useState("");

  const [newEventType, setNewEventType] = useState<
    "concierto" | "festival" | "ensayo" | "privado"
  >("concierto");

  const [newEventDate, setNewEventDate] = useState("");

  const [newEventTime, setNewEventTime] = useState("21:00");

  const [newEventCity, setNewEventCity] = useState(city || "Madrid");

  const [newEventVenue, setNewEventVenue] = useState("");

  const [newEventTicketUrl, setNewEventTicketUrl] = useState("");

  const [newEventAttendancePropia, setNewEventAttendancePropia] =
    useState<number>(0);

  const [newEventAttendanceOtras, setNewEventAttendanceOtras] =
    useState<number>(0);

  const [newEventSharedBands, setNewEventSharedBands] = useState<string>("");

  const [newEventPostShowReview, setNewEventPostShowReview] =
    useState<string>("");

  const [newEventIsMilestone, setNewEventIsMilestone] =
    useState<boolean>(false);

  // Events Add/Remove
  const handleAddEvent = async () => {
    if (!newEventTitle.trim() || !newEventDate) return;
    const newEv: QuickEventItem = {
      id: `ev_${Date.now()}`,
      tipo: newEventType,
      titulo: newEventTitle.trim(),
      fecha: newEventDate,
      hora: newEventTime,
      ciudad: newEventCity,
      lugar: newEventVenue,
      enlaceEntradas: newEventTicketUrl.trim(),
      asistencia_propia: newEventAttendancePropia,
      asistencia_otras_bandas: newEventAttendanceOtras,
      bandas_compartidas: newEventSharedBands
        ? newEventSharedBands
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      post_show_review: newEventPostShowReview.trim(),
      es_hito_destacado: newEventIsMilestone,
    };
    setEvents((prev) => [...prev, newEv]);

    if (newEventType === "ensayo" && onAddRehearsal) {
      onAddRehearsal({
        id: newEv.id,
        fecha: newEv.fecha,
        hora: newEv.hora,
        lugar: newEv.lugar || "Local de ensayo",
        notas: newEv.titulo,
        asistentes: members.map((m) => m.id),
        estado: "programado",
      } as Rehearsal);
    } else if (onAddConcert) {
      onAddConcert({
        id: newEv.id,
        sala: newEv.lugar || newEv.titulo,
        fecha: newEv.fecha,
        ciudad: newEv.ciudad || city,
        cache: cacheSala || 0,
        aforo_vendido: newEv.asistencia_propia || 0,
        aforo_total: 200,
        contrato_firmado: false,
        estado_pago: "pendiente",
        notas: newEv.titulo,
        tipo: newEventType === "festival" ? "festival" : "sala",
        asistencia_propia: newEv.asistencia_propia || 0,
        asistencia_otras_bandas: newEv.asistencia_otras_bandas || 0,
        bandas_compartidas: newEv.bandas_compartidas || [],
        post_show_review: newEv.post_show_review || "",
        es_hito_destacado: newEv.es_hito_destacado || false,
      } as Concert);
    }

    setNewEventTitle("");
    setNewEventVenue("");
    setNewEventTicketUrl("");
    setNewEventAttendancePropia(0);
    setNewEventAttendanceOtras(0);
    setNewEventSharedBands("");
    setNewEventPostShowReview("");
    setNewEventIsMilestone(false);
  };

  const handleRemoveEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return { events, newEventTitle, setNewEventTitle, newEventType, setNewEventType, newEventDate, setNewEventDate, newEventTime, setNewEventTime, newEventCity, setNewEventCity, newEventVenue, setNewEventVenue, newEventTicketUrl, setNewEventTicketUrl, newEventAttendancePropia, setNewEventAttendancePropia, newEventAttendanceOtras, setNewEventAttendanceOtras, newEventSharedBands, setNewEventSharedBands, newEventPostShowReview, setNewEventPostShowReview, newEventIsMilestone, setNewEventIsMilestone, handleAddEvent, handleRemoveEvent };
}
