/**
 * Formulario de gira: vehículos, dietas, miembros convocados y paradas.
 * Extraído de TourManager.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React,{ useState } from "react";
import { Lead,TourRouteStop,TourVehicle } from "../../../types";
import { calculateVehiclesFuelCost } from "../../../utils/tourUtils";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface TourFormParams {
  bandUsers: { id: string; name: string; username?: string; role?: string; instrument?: string; band_id?: string; bandName?: string; }[];
  leads: Lead[];
}

/**
 * Formulario de gira: vehículos, dietas, miembros convocados y paradas.
 * @param params Estado y callbacks del contenedor ({@link TourFormParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useTourForm({ bandUsers, leads }: TourFormParams) {
  // Form state
  const [formNombre, setFormNombre] = useState("");

  const [formVehiculos, setFormVehiculos] = useState<TourVehicle[]>([
    {
      id: "veh-1",
      nombre: "Furgoneta Sprinter / Master (Grande)",
      consumoL100km: 9.5,
      precioCarburanteEUR: 1.55,
      tipoCombustible: "diesel",
    },
  ]);

  const [formEstado, setFormEstado] = useState<
    "planificacion" | "confirmada" | "completada" | "cancelada"
  >("planificacion");

  const [formStops, setFormStops] = useState<TourRouteStop[]>([]);

  // Convocatoria / Miembros State
  const [formConvocatoriaTipo, setFormConvocatoriaTipo] = useState<
    "completa" | "parcial"
  >("completa");

  const [formConvocadosIds, setFormConvocadosIds] = useState<string[]>([]);

  const [formSincronizarCalendario, setFormSincronizarCalendario] =
    useState(true);

  const [formSincronizarFinanzas, setFormSincronizarFinanzas] = useState(false);

  const [dietaPerPersona, setDietaPerPersona] = useState<number>(25);

  // Default members list fallback
  const availableMembers = React.useMemo(() => {
    if (bandUsers && bandUsers.length > 0) {
      return bandUsers.map((u, idx) => ({
        id: u.id || `member-${idx}-${u.name || u.username}`,
        name: u.name || u.username || "Músico",
        role: u.role || "Miembro",
        instrument:
          u.instrument || (u.role === "leader" ? "Líder / Músico" : "Músico"),
      }));
    }
    return [
      {
        id: "usr-1",
        name: "Voz Principal / Guitarra",
        role: "Músico",
        instrument: "Voz / Guitarra",
      },
      {
        id: "usr-2",
        name: "Batería / Percusión",
        role: "Músico",
        instrument: "Batería",
      },
      { id: "usr-3", name: "Bajo", role: "Músico", instrument: "Bajo" },
      {
        id: "usr-4",
        name: "Teclados / Sintes",
        role: "Músico",
        instrument: "Teclados",
      },
      {
        id: "usr-5",
        name: "Técnico de Sonido",
        role: "Staff",
        instrument: "Sonido / P.A.",
      },
    ];
  }, [bandUsers]);

  // Vehicle Presets
  const VEHICLE_PRESETS: ReadonlyArray<{
    label: string;
    name: string;
    l100km: number;
    fuel: NonNullable<TourVehicle["tipoCombustible"]>;
    defaultPrice: number;
  }> = [
    {
      label: "Furgoneta Grande (Sprinter, Crafter, Master)",
      name: "Furgoneta Grande (Sprinter)",
      l100km: 9.5,
      fuel: "diesel",
      defaultPrice: 1.55,
    },
    {
      label: "Furgoneta Mediana (Transit Custom, Transporter, Vito)",
      name: "Furgoneta Mediana (Transit/Vito)",
      l100km: 7.8,
      fuel: "diesel",
      defaultPrice: 1.55,
    },
    {
      label: "Furgoneta Pequeña (Berlingo, Kangoo, Partner)",
      name: "Furgoneta Pequeña (Berlingo)",
      l100km: 6.2,
      fuel: "diesel",
      defaultPrice: 1.55,
    },
    {
      label: "Turismo / Coche de Apoyo",
      name: "Turismo / Coche de Apoyo",
      l100km: 6.8,
      fuel: "gasolina95",
      defaultPrice: 1.62,
    },
    {
      label: "Furgoneta Eléctrica",
      name: "Furgoneta Eléctrica",
      l100km: 22.0,
      fuel: "electrico",
      defaultPrice: 0.25,
    },
    {
      label: "Vehículo Personalizado",
      name: "Vehículo Adicional",
      l100km: 8.5,
      fuel: "diesel",
      defaultPrice: 1.55,
    },
  ];

  const handleAddVehicle = (presetIndex: number = 0) => {
    const preset = VEHICLE_PRESETS[presetIndex] || VEHICLE_PRESETS[0];
    const newVeh: TourVehicle = {
      // Se ejecuta dentro de un manejador de evento, no durante el render.
      // eslint-disable-next-line react-hooks/purity
      id: `veh-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      nombre: preset.name,
      consumoL100km: preset.l100km,
      precioCarburanteEUR: preset.defaultPrice,
      tipoCombustible: preset.fuel,
    };
    const updated = [...formVehiculos, newVeh];
    setFormVehiculos(updated);
    recalculateAllFuelStops(updated);
  };

  const handleUpdateVehicle = (
    index: number,
    field: keyof TourVehicle,
    value: TourVehicle[keyof TourVehicle],
  ) => {
    const updated = [...formVehiculos];
    updated[index] = { ...updated[index], [field]: value };
    setFormVehiculos(updated);
    recalculateAllFuelStops(updated);
  };

  const handleRemoveVehicle = (index: number) => {
    if (formVehiculos.length <= 1) {
      alert("Debe haber al menos un vehículo en la gira.");
      return;
    }
    const updated = formVehiculos.filter((_, i) => i !== index);
    setFormVehiculos(updated);
    recalculateAllFuelStops(updated);
  };

  const handleApplyPresetToVehicle = (index: number, presetLabel: string) => {
    const p = VEHICLE_PRESETS.find((item) => item.label === presetLabel);
    if (!p) return;
    const updated = [...formVehiculos];
    updated[index] = {
      ...updated[index],
      nombre: p.name,
      consumoL100km: p.l100km,
      tipoCombustible: p.fuel,
      precioCarburanteEUR: p.defaultPrice,
    };
    setFormVehiculos(updated);
    recalculateAllFuelStops(updated);
  };

  const recalculateAllFuelStops = (vehicles = formVehiculos) => {
    setFormStops((prev) =>
      prev.map((s) => {
        const km = s.distanciaAnteriorKm || 0;
        const calcGas = calculateVehiclesFuelCost(km, vehicles);
        return { ...s, gastosGasolina: calcGas };
      }),
    );
  };

  // Auto-calculate dietas based on active members in the expedition
  const handleAutoCalculateDietas = () => {
    const numMembers =
      formConvocatoriaTipo === "completa"
        ? availableMembers.length
        : formConvocadosIds.length > 0
          ? formConvocadosIds.length
          : availableMembers.length;

    const calcDietasPerStop = numMembers * (dietaPerPersona || 25);
    setFormStops((prev) =>
      prev.map((s) => ({
        ...s,
        gastosDietas: calcDietasPerStop,
      })),
    );
  };

  const handleToggleMember = (memberId: string) => {
    setFormConvocadosIds((prev) => {
      if (prev.includes(memberId)) {
        return prev.filter((id) => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  const handleSelectAllMembers = () => {
    setFormConvocadosIds(availableMembers.map((m) => m.id));
  };

  const addStop = () => {
    setFormStops([
      ...formStops,
      {
        id: `stop-${Date.now()}`,
        ciudad: "",
        sala: "",
        fecha: new Date().toISOString().split("T")[0],
        distanciaAnteriorKm: 0,
        tiempoConduccionHoras: 0,
        gastosAlojamiento: 0,
        gastosGasolina: 0,
        gastosDietas:
          (formConvocatoriaTipo === "completa"
            ? availableMembers.length
            : formConvocadosIds.length || availableMembers.length) *
          (dietaPerPersona || 25),
        ingresoCacheEstimated: 0,
      },
    ]);
  };

  const updateStop = (
    index: number,
    field: keyof TourRouteStop,
    value: TourRouteStop[keyof TourRouteStop],
  ) => {
    const newStops = [...formStops];
    const currentStop = { ...newStops[index], [field]: value };

    // Auto-calculate fuel & driving time based on all vehicles parameters
    if (field === "distanciaAnteriorKm") {
      const km = Number(value) || 0;
      currentStop.gastosGasolina = calculateVehiclesFuelCost(km, formVehiculos);
      currentStop.tiempoConduccionHoras = Math.round((km / 85) * 10) / 10; // Avg 85 km/h
    }

    newStops[index] = currentStop;
    setFormStops(newStops);
  };

  const handleSelectVenueForStop = (index: number, leadId: string) => {
    const selectedLead = leads.find((l) => l.id === leadId);
    if (!selectedLead) return;

    const newStops = [...formStops];
    newStops[index] = {
      ...newStops[index],
      sala: selectedLead.nombre_sala,
      ciudad: selectedLead.ciudad || newStops[index].ciudad,
    };
    setFormStops(newStops);
  };

  const removeStop = (index: number) => {
    setFormStops(formStops.filter((_, i) => i !== index));
  };

  // Combined fleet cost per 100 km
  const totalFleetCostPer100Km = formVehiculos.reduce((sum, v) => {
    const c = Number(v.consumoL100km) || 0;
    const p =
      Number(v.precioCarburanteEUR) > 0 ? Number(v.precioCarburanteEUR) : 1.55;
    return sum + c * p;
  }, 0);

  return { setFormNombre, setFormVehiculos, setFormEstado, setFormConvocatoriaTipo, setFormConvocadosIds, availableMembers, setFormSincronizarCalendario, setFormSincronizarFinanzas, setFormStops, formNombre, formStops, formVehiculos, formConvocatoriaTipo, formConvocadosIds, formSincronizarCalendario, formEstado, formSincronizarFinanzas, handleSelectAllMembers, handleToggleMember, dietaPerPersona, setDietaPerPersona, handleAutoCalculateDietas, handleAddVehicle, recalculateAllFuelStops, handleRemoveVehicle, handleApplyPresetToVehicle, VEHICLE_PRESETS, handleUpdateVehicle, totalFleetCostPer100Km, addStop, removeStop, handleSelectVenueForStop, updateStop };
}
