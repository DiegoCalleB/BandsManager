import React, { useState } from 'react';
import { ThemeColors, Tour, TourRouteStop, TourVehicle, Concert, Lead } from '../types';
import { calculateVehiclesFuelCost } from '../utils/tourUtils';
import { 
  Plus, Edit3, Trash2, MapPin, Truck, Calendar, DollarSign, 
  Activity, TrendingUp, Calculator, Users, CheckSquare, Square, 
  CheckCircle2, AlertCircle, RefreshCw, ArrowRight, Sparkles 
} from 'lucide-react';

interface TourManagerProps {
  colors: ThemeColors;
  tours: Tour[];
  concerts: Concert[];
  leads?: Lead[];
  onAddLead?: (lead: Lead) => void;
  onDeleteLead?: (id: string) => void;
  onSaveTour: (tour: Tour) => void;
  onDeleteTour: (id: string) => void;
  bandUsers?: Array<{ id: string; name: string; username?: string; role?: string; instrument?: string; band_id?: string; bandName?: string }>;
  currentUser?: { id?: string; name?: string; username?: string; role?: string; band_id?: string; instrument?: string };
  currentBandId?: string;
  currentBandName?: string;
  onAddConcert?: (concert: Concert) => void;
  onUpdateConcert?: (id: string, updatedFields: Partial<Concert>) => void;
  onAddPayment?: (payment: any) => void;
  onNavigate?: (view: any, options?: any) => void;
}

export default function TourManager({
  colors,
  tours,
  concerts,
  leads = [],
  onSaveTour,
  onDeleteTour,
  bandUsers = [],
  currentUser,
  currentBandId = 'band-bakandeya',
  currentBandName = 'Bakandeya',
  onAddConcert,
  onUpdateConcert,
  onAddPayment,
  onNavigate
}: TourManagerProps) {
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync Notification Toast
  const [syncFeedback, setSyncFeedback] = useState<{ tourId: string; message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Form state
  const [formNombre, setFormNombre] = useState('');
  const [formVehiculos, setFormVehiculos] = useState<TourVehicle[]>([
    {
      id: 'veh-1',
      nombre: 'Furgoneta Sprinter / Master (Grande)',
      consumoL100km: 9.5,
      precioCarburanteEUR: 1.55,
      tipoCombustible: 'diesel'
    }
  ]);
  const [formEstado, setFormEstado] = useState<'planificacion' | 'confirmada' | 'completada' | 'cancelada'>('planificacion');
  const [formStops, setFormStops] = useState<TourRouteStop[]>([]);

  // Convocatoria / Miembros State
  const [formConvocatoriaTipo, setFormConvocatoriaTipo] = useState<'completa' | 'parcial'>('completa');
  const [formConvocadosIds, setFormConvocadosIds] = useState<string[]>([]);
  const [formSincronizarCalendario, setFormSincronizarCalendario] = useState(true);
  const [formSincronizarFinanzas, setFormSincronizarFinanzas] = useState(false);
  const [dietaPerPersona, setDietaPerPersona] = useState<number>(25);

  // Default members list fallback
  const availableMembers = React.useMemo(() => {
    if (bandUsers && bandUsers.length > 0) {
      return bandUsers.map(u => ({
        id: u.id,
        name: u.name || u.username || 'Músico',
        role: u.role || 'Miembro',
        instrument: u.instrument || (u.role === 'leader' ? 'Líder / Músico' : 'Músico')
      }));
    }
    return [
      { id: 'usr-1', name: 'Diego (Voz / Guitarra)', role: 'Músico', instrument: 'Voz / Guitarra' },
      { id: 'usr-2', name: 'José (Batería)', role: 'Músico', instrument: 'Batería' },
      { id: 'usr-3', name: 'Carlos (Bajo)', role: 'Músico', instrument: 'Bajo' },
      { id: 'usr-4', name: 'Laura (Teclados)', role: 'Músico', instrument: 'Teclados' },
      { id: 'usr-5', name: 'Técnico de Sonido', role: 'Staff', instrument: 'Sonido / P.A.' }
    ];
  }, [bandUsers]);

  // Vehicle Presets
  const VEHICLE_PRESETS = [
    { label: '🚐 Furgoneta Grande (Sprinter, Crafter, Master)', name: 'Furgoneta Grande (Sprinter)', l100km: 9.5, fuel: 'diesel', defaultPrice: 1.55 },
    { label: '🚐 Furgoneta Mediana (Transit Custom, Transporter, Vito)', name: 'Furgoneta Mediana (Transit/Vito)', l100km: 7.8, fuel: 'diesel', defaultPrice: 1.55 },
    { label: '🚐 Furgoneta Pequeña (Berlingo, Kangoo, Partner)', name: 'Furgoneta Pequeña (Berlingo)', l100km: 6.2, fuel: 'diesel', defaultPrice: 1.55 },
    { label: '🚗 Turismo / Coche de Apoyo', name: 'Turismo / Coche de Apoyo', l100km: 6.8, fuel: 'gasolina95', defaultPrice: 1.62 },
    { label: '⚡ Furgoneta Eléctrica', name: 'Furgoneta Eléctrica', l100km: 22.0, fuel: 'electrico', defaultPrice: 0.25 },
    { label: '⚙️ Vehículo Personalizado', name: 'Vehículo Adicional', l100km: 8.5, fuel: 'diesel', defaultPrice: 1.55 },
  ];

  const handleAddVehicle = (presetIndex: number = 0) => {
    const preset = VEHICLE_PRESETS[presetIndex] || VEHICLE_PRESETS[0];
    const newVeh: TourVehicle = {
      id: `veh-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      nombre: preset.name,
      consumoL100km: preset.l100km,
      precioCarburanteEUR: preset.defaultPrice,
      tipoCombustible: preset.fuel as any
    };
    const updated = [...formVehiculos, newVeh];
    setFormVehiculos(updated);
    recalculateAllFuelStops(updated);
  };

  const handleUpdateVehicle = (index: number, field: keyof TourVehicle, value: any) => {
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
    const p = VEHICLE_PRESETS.find(item => item.label === presetLabel);
    if (!p) return;
    const updated = [...formVehiculos];
    updated[index] = {
      ...updated[index],
      nombre: p.name,
      consumoL100km: p.l100km,
      tipoCombustible: p.fuel as any,
      precioCarburanteEUR: p.defaultPrice
    };
    setFormVehiculos(updated);
    recalculateAllFuelStops(updated);
  };

  const recalculateAllFuelStops = (vehicles = formVehiculos) => {
    setFormStops(prev => prev.map(s => {
      const km = s.distanciaAnteriorKm || 0;
      const calcGas = calculateVehiclesFuelCost(km, vehicles);
      return { ...s, gastosGasolina: calcGas };
    }));
  };

  // Auto-calculate dietas based on active members in the expedition
  const handleAutoCalculateDietas = () => {
    const numMembers = formConvocatoriaTipo === 'completa' 
      ? availableMembers.length 
      : (formConvocadosIds.length > 0 ? formConvocadosIds.length : availableMembers.length);

    const calcDietasPerStop = numMembers * (dietaPerPersona || 25);
    setFormStops(prev => prev.map(s => ({
      ...s,
      gastosDietas: calcDietasPerStop
    })));
  };

  const handleToggleMember = (memberId: string) => {
    setFormConvocadosIds(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  const handleSelectAllMembers = () => {
    setFormConvocadosIds(availableMembers.map(m => m.id));
  };

  const handleOpenCreateModal = () => {
    setEditingTour(null);
    setFormNombre('');
    setFormVehiculos([
      {
        id: 'veh-1',
        nombre: 'Furgoneta Sprinter / Master (Grande)',
        consumoL100km: 9.5,
        precioCarburanteEUR: 1.55,
        tipoCombustible: 'diesel'
      }
    ]);
    setFormEstado('planificacion');
    setFormConvocatoriaTipo('completa');
    setFormConvocadosIds(availableMembers.map(m => m.id));
    setFormSincronizarCalendario(true);
    setFormSincronizarFinanzas(false);
    setFormStops([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tour: Tour) => {
    setEditingTour(tour);
    setFormNombre(tour.nombre);

    const vehicles: TourVehicle[] = (tour.vehiculos && tour.vehiculos.length > 0)
      ? tour.vehiculos
      : [{
          id: 'veh-1',
          nombre: tour.vehiculo || 'Furgoneta 9 Plazas',
          consumoL100km: tour.consumoL100km ?? 9.5,
          precioCarburanteEUR: tour.precioCarburanteEUR ?? 1.55,
          tipoCombustible: tour.tipoCombustible ?? 'diesel'
        }];

    setFormVehiculos(vehicles);
    setFormEstado(tour.estado);
    setFormConvocatoriaTipo(tour.convocatoria_tipo || 'completa');
    setFormConvocadosIds(tour.convocados_ids && tour.convocados_ids.length > 0 
      ? tour.convocados_ids 
      : availableMembers.map(m => m.id));
    setFormSincronizarCalendario(tour.sincronizarCalendario ?? true);
    setFormSincronizarFinanzas(tour.sincronizarFinanzas ?? false);
    setFormStops([...tour.stops]);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) {
      alert("Por favor introduce el nombre de la gira.");
      return;
    }

    const startDate = formStops.length > 0 
      ? [...formStops].sort((a,b) => a.fecha.localeCompare(b.fecha))[0].fecha 
      : new Date().toISOString().split('T')[0];
    const endDate = formStops.length > 0 
      ? [...formStops].sort((a,b) => b.fecha.localeCompare(a.fecha))[0].fecha 
      : new Date().toISOString().split('T')[0];

    const totalGastos = formStops.reduce((sum, stop) => 
      sum + (stop.gastosAlojamiento || 0) + (stop.gastosGasolina || 0) + (stop.gastosDietas || 0), 0);

    const primaryVehicle = formVehiculos[0] || {
      nombre: 'Furgoneta',
      consumoL100km: 9.5,
      precioCarburanteEUR: 1.55,
      tipoCombustible: 'diesel'
    };

    const convocadosNombres = formConvocatoriaTipo === 'completa'
      ? availableMembers.map(m => m.name)
      : availableMembers.filter(m => formConvocadosIds.includes(m.id)).map(m => m.name);

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
          ciudad: stop.ciudad || 'Ciudad de Gira',
          sala: stop.sala || 'Sala de Gira',
          cache: Number(stop.ingresoCacheEstimated || 0),
          aforo_vendido: 0,
          aforo_total: 300,
          contrato_firmado: formEstado === 'confirmada' || formEstado === 'completada',
          estado_pago: 'pendiente',
          notas: `Gira: ${formNombre.trim()} (Parada #${idx + 1})${stop.notasLogisticas ? ` - ${stop.notasLogisticas}` : ''}`,
          tipo: 'sala',
          giraId: tourId,
          giraNombre: formNombre.trim(),
          convocatoria_tipo: formConvocatoriaTipo,
          convocados_ids: formConvocatoriaTipo === 'completa' ? availableMembers.map(m => m.id) : formConvocadosIds,
          convocados_nombres: convocadosNombres,
          gastosDetalle: {
            gasolina: stop.gastosGasolina || 0,
            dietas: stop.gastosDietas || 0,
            alojamiento: stop.gastosAlojamiento || 0,
            otros: 0,
            notasGastos: `Logística Gira ${formNombre.trim()}`
          }
        };

        const existingConcert = concerts.find(c => c.id === concertId);
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
        convocados_nombres: convocadosNombres
      };
    });

    const tourData: Tour = {
      id: tourId,
      band_id: currentBandId,
      nombre: formNombre.trim(),
      vehiculo: formVehiculos.map(v => v.nombre).filter(Boolean).join(", ") || primaryVehicle.nombre,
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
      stops: updatedStops
    };

    onSaveTour(tourData);
    setIsModalOpen(false);

    setSyncFeedback({
      tourId,
      message: `Gira "${tourData.nombre}" guardada y sincronizada con ${updatedStops.length} paradas en el Calendario.`,
      type: 'success'
    });
    setTimeout(() => setSyncFeedback(null), 5000);
  };

  // Volcar Gira completa en Finanzas
  const handleVolcarEnFinanzas = (tour: Tour) => {
    if (!onAddPayment) {
      alert("La función de finanzas no está disponible en este momento.");
      return;
    }

    const totalIngresos = tour.stops.reduce((sum, s) => sum + (s.ingresoCacheEstimated || 0), 0);
    const totalGasolina = tour.stops.reduce((sum, s) => sum + (s.gastosGasolina || 0), 0);
    const totalDietas = tour.stops.reduce((sum, s) => sum + (s.gastosDietas || 0), 0);
    const totalAlojamiento = tour.stops.reduce((sum, s) => sum + (s.gastosAlojamiento || 0), 0);

    const now = Date.now();
    let count = 0;

    // Ingresos de cada parada
    tour.stops.forEach((stop, idx) => {
      if (stop.ingresoCacheEstimated && stop.ingresoCacheEstimated > 0) {
        onAddPayment({
          id: `pay-in-${tour.id}-${stop.id || idx}-${now}`,
          band_id: currentBandId,
          tipo: 'ingreso',
          categoria: 'concierto',
          concepto: `Caché Gira: ${tour.nombre} - ${stop.ciudad || 'Parada'} (${stop.sala || 'Sala'})`,
          importe: Number(stop.ingresoCacheEstimated),
          fecha: stop.fecha || tour.fechaInicio || new Date().toISOString().split('T')[0],
          estado: 'pendiente'
        });
        count++;
      }
    });

    // Gasto Gasolina
    if (totalGasolina > 0) {
      onAddPayment({
        id: `pay-gas-${tour.id}-${now}`,
        band_id: currentBandId,
        tipo: 'gasto',
        categoria: 'transporte',
        concepto: `Combustible Flota Gira: ${tour.nombre} (${tour.vehiculos?.length || 1} veh.)`,
        importe: Number(totalGasolina),
        fecha: tour.fechaInicio || new Date().toISOString().split('T')[0],
        estado: 'pendiente'
      });
      count++;
    }

    // Gasto Dietas
    if (totalDietas > 0) {
      const numPers = tour.convocatoria_tipo === 'parcial' && tour.convocados_ids?.length 
        ? tour.convocados_ids.length 
        : availableMembers.length;
      onAddPayment({
        id: `pay-dietas-${tour.id}-${now}`,
        band_id: currentBandId,
        tipo: 'gasto',
        categoria: 'comida',
        concepto: `Dietas Expedición Gira: ${tour.nombre} (${numPers} miembros)`,
        importe: Number(totalDietas),
        fecha: tour.fechaInicio || new Date().toISOString().split('T')[0],
        estado: 'pendiente'
      });
      count++;
    }

    // Gasto Alojamientos
    if (totalAlojamiento > 0) {
      onAddPayment({
        id: `pay-hotel-${tour.id}-${now}`,
        band_id: currentBandId,
        tipo: 'gasto',
        categoria: 'alojamiento',
        concepto: `Hoteles / Alojamientos Gira: ${tour.nombre}`,
        importe: Number(totalAlojamiento),
        fecha: tour.fechaInicio || new Date().toISOString().split('T')[0],
        estado: 'pendiente'
      });
      count++;
    }

    setSyncFeedback({
      tourId: tour.id,
      message: `¡Volcado exitoso! Se han registrado ${count} movimientos contables en Finanzas para la gira "${tour.nombre}".`,
      type: 'success'
    });
    setTimeout(() => setSyncFeedback(null), 6000);
  };

  const addStop = () => {
    setFormStops([...formStops, {
      id: `stop-${Date.now()}`,
      ciudad: '',
      sala: '',
      fecha: new Date().toISOString().split('T')[0],
      distanciaAnteriorKm: 0,
      tiempoConduccionHoras: 0,
      gastosAlojamiento: 0,
      gastosGasolina: 0,
      gastosDietas: (formConvocatoriaTipo === 'completa' ? availableMembers.length : formConvocadosIds.length || availableMembers.length) * (dietaPerPersona || 25),
      ingresoCacheEstimated: 0,
    }]);
  };

  const updateStop = (index: number, field: keyof TourRouteStop, value: any) => {
    const newStops = [...formStops];
    const currentStop = { ...newStops[index], [field]: value };
    
    // Auto-calculate fuel & driving time based on all vehicles parameters
    if (field === 'distanciaAnteriorKm') {
      const km = Number(value) || 0;
      currentStop.gastosGasolina = calculateVehiclesFuelCost(km, formVehiculos);
      currentStop.tiempoConduccionHoras = Math.round((km / 85) * 10) / 10; // Avg 85 km/h
    }

    newStops[index] = currentStop;
    setFormStops(newStops);
  };

  const handleSelectVenueForStop = (index: number, leadId: string) => {
    const selectedLead = leads.find(l => l.id === leadId);
    if (!selectedLead) return;

    const newStops = [...formStops];
    newStops[index] = {
      ...newStops[index],
      sala: selectedLead.nombre_sala,
      ciudad: selectedLead.ciudad || newStops[index].ciudad
    };
    setFormStops(newStops);
  };

  const removeStop = (index: number) => {
    setFormStops(formStops.filter((_, i) => i !== index));
  };

  // Delete Confirmation Modal state
  const [tourToDelete, setTourToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleDelete = (id: string, name: string) => {
    setTourToDelete({ id, name });
  };

  const confirmDelete = () => {
    if (tourToDelete) {
      onDeleteTour(tourToDelete.id);
      setTourToDelete(null);
    }
  };

  // Combined fleet cost per 100 km
  const totalFleetCostPer100Km = formVehiculos.reduce((sum, v) => {
    const c = Number(v.consumoL100km) || 0;
    const p = Number(v.precioCarburanteEUR) > 0 ? Number(v.precioCarburanteEUR) : 1.55;
    return sum + (c * p);
  }, 0);

  return (
    <div className={`space-y-6 ${colors.text}`}>
      {/* Header */}
      <div className={`p-5 sm:p-6 rounded-2xl ${colors.card} shadow-sm border border-white/5`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Logística & Convocatorias Multi-Miembro
              </span>
            </div>
            <h2 className="text-xl font-bold font-display flex items-center gap-2 mt-1">
              <Truck className="w-6 h-6 text-sky-400" />
              Gestor Logístico & Giras de {currentBandName}
            </h2>
            <p className={`text-xs ${colors.textMuted} mt-1`}>
              Planifica rutas, selecciona qué miembros participan (Banda Completa vs Parcial), calcula combustible multi-vehículo, dietas y sincroniza automáticamente con el Calendario y Finanzas.
            </p>
          </div>
          
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[#f2ca50] text-[#3c2f00] hover:bg-[#e0b83e] transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Nueva Gira</span>
          </button>
        </div>
      </div>

      {/* Sync Toast Feedback */}
      {syncFeedback && (
        <div className="p-3.5 px-4 rounded-xl text-xs flex items-center justify-between gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-mono">{syncFeedback.message}</span>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('finanzas')}
              className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <span>Ver en Finanzas</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Tour List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {tours.length === 0 ? (
          <div className="col-span-full p-8 text-center rounded-2xl bg-black/20 border border-white/5">
            <MapPin className={`w-12 h-12 mx-auto mb-4 ${colors.textMuted} opacity-50`} />
            <h3 className={`text-lg font-bold ${colors.text} mb-2`}>No hay giras organizadas</h3>
            <p className={`text-sm ${colors.textMuted} max-w-md mx-auto mb-4`}>
              Agrupa tus conciertos en giras para calcular mejor los gastos logísticos, combustible de todos tus vehículos, dietas de los músicos convocados, alojamientos y el margen de beneficio neto.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Crear primera gira
            </button>
          </div>
        ) : (
          (() => {
            const seen = new Set<string>();
            const uniqueTours = tours.filter((t, index) => {
              const key = t.id || `tour-${index}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
            return uniqueTours.map((tour, index) => {
              const totalGastos = tour.stops.reduce((sum, s) => sum + (s.gastosAlojamiento || 0) + (s.gastosGasolina || 0) + (s.gastosDietas || 0), 0);
              const totalIngresos = tour.stops.reduce((sum, s) => sum + (s.ingresoCacheEstimated || 0), 0);
              const beneficioNeto = totalIngresos - totalGastos;
              const totalKm = tour.stops.reduce((sum, s) => sum + (s.distanciaAnteriorKm || 0), 0);

              const vehiclesCount = tour.vehiculos?.length || (tour.vehiculo ? 1 : 0);

              // Formación info
              const isFormacionParcial = tour.convocatoria_tipo === 'parcial';
              const convocadosCount = isFormacionParcial && tour.convocados_ids 
                ? tour.convocados_ids.length 
                : availableMembers.length;

              const isCurrentUserConvocado = !currentUser?.id || !isFormacionParcial || (tour.convocados_ids && tour.convocados_ids.includes(currentUser.id));

              return (
                <div key={tour.id || `tour-${index}`} className={`p-5 rounded-2xl ${colors.card} border border-white/5 shadow-sm group hover:border-white/10 transition-colors flex flex-col justify-between`}>
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg font-display">{tour.nombre}</h3>
                          {isCurrentUserConvocado ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              ✓ Convocado
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-neutral-800 text-neutral-400 border border-neutral-700">
                              No convocado
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold
                            ${tour.estado === 'confirmada' ? colors.badgeGreen : 
                            tour.estado === 'planificacion' ? colors.badgeYellow :
                            tour.estado === 'cancelada' ? colors.badgeRed : 'bg-neutral-800 text-neutral-300'}`}>
                            {tour.estado}
                          </span>
                          <span className={`text-[10px] ${colors.textMuted} flex items-center gap-1 font-mono`}>
                            <Calendar className="w-3 h-3" />
                            {tour.fechaInicio} — {tour.fechaFin}
                          </span>
                          {/* Convocatoria Badge */}
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono flex items-center gap-1 border ${
                            isFormacionParcial 
                              ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' 
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          }`} title={tour.convocados_nombres?.join(", ") || 'Toda la banda'}>
                            <Users className="w-3 h-3" />
                            {isFormacionParcial ? `Banda Parcial (${convocadosCount} músicos)` : `Banda Completa (${availableMembers.length})`}
                          </span>
                          {totalKm > 0 && (
                            <span className="text-[10px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded font-mono">
                              {totalKm} km
                            </span>
                          )}
                          {vehiclesCount > 1 ? (
                            <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded font-mono flex items-center gap-1 border border-amber-500/20" title={tour.vehiculos?.map(v => v.nombre).join(" + ")}>
                              <Truck className="w-3 h-3 text-amber-400" />
                              {vehiclesCount} vehículos
                            </span>
                          ) : tour.vehiculo ? (
                            <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded font-mono flex items-center gap-1 border border-amber-500/20">
                              <Truck className="w-3 h-3" />
                              {tour.vehiculo}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenEditModal(tour)} className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer" title="Editar">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(tour.id, tour.nombre)} className="p-1.5 rounded-lg hover:bg-rose-500/15 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                        <span className="text-[9px] text-neutral-400 uppercase tracking-wider block font-mono">Logística</span>
                        <div className="text-xs font-bold text-rose-400 mt-0.5">
                          -{totalGastos} €
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                        <span className="text-[9px] text-neutral-400 uppercase tracking-wider block font-mono">Caché Est.</span>
                        <div className="text-xs font-bold text-emerald-400 mt-0.5">
                          +{totalIngresos} €
                        </div>
                      </div>
                      <div className={`p-2.5 rounded-xl border ${beneficioNeto >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                        <span className="text-[9px] opacity-80 uppercase tracking-wider block font-mono">Margen Neto</span>
                        <div className="text-xs font-extrabold mt-0.5 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {beneficioNeto >= 0 ? `+${beneficioNeto}` : beneficioNeto} €
                        </div>
                      </div>
                    </div>

                    {/* Ruta & Paradas */}
                    <div>
                      <h4 className="text-[10px] uppercase font-mono text-neutral-400 mb-2 flex justify-between items-center">
                        <span>Ruta ({tour.stops.length} paradas)</span>
                        <span className="text-neutral-400 truncate max-w-[200px]" title={tour.vehiculos?.map(v => v.nombre).join(", ") || tour.vehiculo}>
                          {tour.vehiculos && tour.vehiculos.length > 1 
                            ? `${tour.vehiculos.length} Vehículos` 
                            : (tour.vehiculo || '1 Vehículo')}
                        </span>
                      </h4>
                      <div className="space-y-1.5">
                        {tour.stops.length === 0 ? (
                          <span className="text-[10px] text-neutral-500 italic">Sin paradas configuradas</span>
                        ) : (
                          tour.stops.slice(0, 4).map((stop, idx) => (
                            <div key={stop.id} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-black/20 border border-white/5">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-sky-400 font-mono text-xs font-bold">{idx + 1}.</span>
                                <span className="font-bold truncate text-slate-100 text-xs sm:text-sm">{stop.ciudad || 'Por determinar'}</span>
                                <span className="text-zinc-300 text-xs font-semibold truncate">({stop.sala || 'Sala tbd'})</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                                {stop.ingresoCacheEstimated ? (
                                  <span className="text-emerald-400 font-bold">+{stop.ingresoCacheEstimated}€</span>
                                ) : null}
                                <span className="text-amber-300 font-mono text-xs font-bold">{stop.fecha}</span>
                              </div>
                            </div>
                          ))
                        )}
                        {tour.stops.length > 4 && (
                          <div className="text-[10px] text-center text-neutral-500 pt-1 font-mono">+ {tour.stops.length - 4} paradas adicionales</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones de Sincronización */}
                  <div className="pt-4 mt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleVolcarEnFinanzas(tour)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        title="Registra los cachés y gastos logísticos calculados en el libro diario de Finanzas"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Volcar en Finanzas</span>
                      </button>

                      {onNavigate && (
                        <button
                          onClick={() => onNavigate('calendario', { selectedDate: tour.fechaInicio })}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Abrir agenda y ver paradas de la gira en el calendario"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Ver en Calendario</span>
                        </button>
                      )}
                    </div>

                    <span className="text-[10px] text-neutral-400 font-mono">
                      {tour.stops.length} fechas
                    </span>
                  </div>
                </div>
              );
            });
          })()
        )}
      </div>

      {/* Modal Formulario de Gira */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className={`w-full max-w-4xl rounded-2xl ${colors.bg} border border-white/10 shadow-2xl flex flex-col max-h-[90vh]`}>
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-white/10 flex justify-between items-center bg-black/40 shrink-0">
              <div>
                <h3 className="text-lg font-bold font-display flex items-center gap-2">
                  <Truck className="w-5 h-5 text-sky-400" />
                  {editingTour ? 'Editar Gira' : 'Nueva Gira'}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Configura la ruta, flota de vehículos, selección de miembros y sincronización automática.
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors text-xl leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
              <form id="tour-form" onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className={`text-[10px] font-mono uppercase tracking-wider ${colors.textMuted}`}>Nombre de la Gira *</label>
                    <input
                      required
                      value={formNombre}
                      onChange={e => setFormNombre(e.target.value)}
                      placeholder="Ej. Tour Peninsular Primavera 2026"
                      className={`w-full p-2.5 sm:p-3 rounded-xl bg-black/40 border border-white/10 ${colors.text} focus:outline-none focus:border-sky-500 transition-colors text-sm`}
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className={`text-[10px] font-mono uppercase tracking-wider ${colors.textMuted}`}>Estado de la Gira</label>
                    <select
                      value={formEstado}
                      onChange={e => setFormEstado(e.target.value as any)}
                      className={`w-full p-2.5 sm:p-3 rounded-xl bg-black/40 border border-white/10 ${colors.text} focus:outline-none focus:border-sky-500 transition-colors text-sm cursor-pointer`}
                    >
                      <option value="planificacion">En Planificación</option>
                      <option value="confirmada">Confirmada</option>
                      <option value="completada">Completada</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </div>

                  {/* SELECCIÓN DE MIEMBROS DE LA BANDA (FORMACIÓN COMPLETA VS PARCIAL) */}
                  <div className="sm:col-span-3 p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-500/20 pb-3">
                      <div>
                        <span className="text-xs font-mono font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-purple-400" /> Miembros & Formación de la Gira
                        </span>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          Selecciona si viaja toda la banda o una formación reducida/acústica. Afecta al cálculo de dietas, hoteles y visibilidad en el calendario de cada músico.
                        </p>
                      </div>

                      {/* Selector Banda Completa vs Parcial */}
                      <div className="flex rounded-lg bg-black/50 p-1 border border-purple-500/30">
                        <button
                          type="button"
                          onClick={() => {
                            setFormConvocatoriaTipo('completa');
                            setFormConvocadosIds(availableMembers.map(m => m.id));
                          }}
                          className={`px-3 py-1 text-xs font-mono font-bold rounded-md transition-all cursor-pointer ${
                            formConvocatoriaTipo === 'completa'
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          👥 Banda Completa ({availableMembers.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormConvocatoriaTipo('parcial')}
                          className={`px-3 py-1 text-xs font-mono font-bold rounded-md transition-all cursor-pointer ${
                            formConvocatoriaTipo === 'parcial'
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          👤 Formación Parcial / Reducida
                        </button>
                      </div>
                    </div>

                    {/* Lista de Miembros para Convocatoria */}
                    {formConvocatoriaTipo === 'parcial' && (
                      <div className="space-y-2.5 animate-in fade-in duration-200">
                        <div className="flex justify-between items-center text-[11px] text-neutral-400 font-mono">
                          <span>Marca los músicos o miembros del equipo que viajarán en esta gira:</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleSelectAllMembers}
                              className="text-purple-300 hover:underline cursor-pointer"
                            >
                              Seleccionar todos
                            </button>
                            <span>|</span>
                            <button
                              type="button"
                              onClick={() => setFormConvocadosIds([])}
                              className="text-neutral-400 hover:underline cursor-pointer"
                            >
                              Limpiar
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {availableMembers.map(m => {
                            const isSelected = formConvocadosIds.includes(m.id);
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => handleToggleMember(m.id)}
                                className={`p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-purple-500/20 border-purple-500/50 text-white shadow-sm'
                                    : 'bg-black/40 border-white/10 text-neutral-400 hover:border-white/20'
                                }`}
                              >
                                <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                                  isSelected ? 'bg-purple-600 text-white' : 'border border-neutral-600'
                                }`}>
                                  {isSelected && <CheckSquare className="w-3.5 h-3.5" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold truncate text-zinc-100">{m.name}</div>
                                  <div className="text-[10px] text-neutral-400 truncate">{m.instrument || m.role}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Barra de Dietas por Músico */}
                    <div className="p-3 rounded-xl bg-black/40 border border-purple-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-purple-300 font-mono font-bold">
                          Expedición: {formConvocatoriaTipo === 'completa' ? availableMembers.length : formConvocadosIds.length} personas convocadas
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-neutral-400 font-mono text-[11px]">Dieta / pers. / día:</span>
                        <input
                          type="number"
                          min="0"
                          value={dietaPerPersona}
                          onChange={(e) => setDietaPerPersona(Number(e.target.value))}
                          className="w-16 p-1 rounded bg-black/60 border border-white/20 text-xs font-mono text-center font-bold text-amber-300"
                        />
                        <span className="text-neutral-400 text-xs font-mono">€</span>
                        <button
                          type="button"
                          onClick={handleAutoCalculateDietas}
                          className="px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 text-xs font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Aplica la dieta total (personas x dieta) a todas las paradas de la ruta"
                        >
                          <Sparkles className="w-3 h-3" /> Aplicar a Paradas
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Vehicle & Fuel Calculation Settings */}
                  <div className="sm:col-span-3 p-4 rounded-xl bg-sky-950/20 border border-sky-500/30 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-500/20 pb-3">
                      <div>
                        <span className="text-xs font-mono font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-sky-400" /> Flota & Vehículos de la Gira ({formVehiculos.length} {formVehiculos.length === 1 ? 'vehículo' : 'vehículos'})
                        </span>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          Añade todos los coches o furgonetas que viajan. El consumo de combustible sumará el gasto combinado de la flota.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddVehicle(0)}
                          className="px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Añadir Vehículo
                        </button>
                        <button
                          type="button"
                          onClick={() => recalculateAllFuelStops()}
                          className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-white/10 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          title="Aplica la suma de consumos a las distancias de todas las paradas"
                        >
                          <Calculator className="w-3.5 h-3.5 text-amber-400" /> Recalcular Paradas
                        </button>
                      </div>
                    </div>

                    {/* Vehicles List */}
                    <div className="space-y-3">
                      {formVehiculos.map((veh, vIdx) => (
                        <div key={veh.id || `veh-${vIdx}`} className="p-3.5 rounded-xl bg-black/50 border border-sky-500/20 relative space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-mono font-bold uppercase">
                                Vehículo #{vIdx + 1}
                              </span>
                              <span className="text-xs font-semibold text-neutral-300">
                                {veh.nombre || 'Vehículo sin nombre'}
                              </span>
                            </div>
                            {formVehiculos.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveVehicle(vIdx)}
                                className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors text-xs flex items-center gap-1 cursor-pointer"
                                title="Eliminar este vehículo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline text-[10px] font-mono">Eliminar</span>
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div>
                              <label className="text-[10px] font-mono text-neutral-400 uppercase block mb-1">Cargar Plantilla</label>
                              <select
                                onChange={(e) => handleApplyPresetToVehicle(vIdx, e.target.value)}
                                defaultValue=""
                                className="w-full p-2 rounded-lg bg-black/60 border border-white/10 text-xs text-white focus:border-sky-500 cursor-pointer"
                              >
                                <option value="" disabled>-- Seleccionar Modelo --</option>
                                {VEHICLE_PRESETS.map((p, idx) => (
                                  <option key={idx} value={p.label}>{p.label}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] font-mono text-neutral-400 uppercase block mb-1">Nombre / Identificador</label>
                              <input
                                value={veh.nombre}
                                onChange={e => handleUpdateVehicle(vIdx, 'nombre', e.target.value)}
                                placeholder="Ej. Furgoneta Principal (Banda)"
                                className="w-full p-2 rounded-lg bg-black/60 border border-white/10 text-xs text-white focus:border-sky-500"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-mono text-amber-300 uppercase block mb-1">
                                Consumo ({veh.tipoCombustible === 'electrico' ? 'kWh/100km' : 'L/100km'})
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                min="0.1"
                                value={veh.consumoL100km}
                                onChange={e => handleUpdateVehicle(vIdx, 'consumoL100km', Number(e.target.value))}
                                className="w-full p-2 rounded-lg bg-black/60 border border-amber-500/40 text-xs font-bold text-amber-300 focus:border-amber-400"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-mono text-emerald-300 uppercase block mb-1">
                                Precio (€/{veh.tipoCombustible === 'electrico' ? 'kWh' : 'Litro'})
                              </label>
                              <div className="flex gap-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  value={veh.precioCarburanteEUR ?? 1.55}
                                  onChange={e => handleUpdateVehicle(vIdx, 'precioCarburanteEUR', Number(e.target.value))}
                                  className="w-full p-2 rounded-lg bg-black/60 border border-emerald-500/40 text-xs font-bold text-emerald-300 focus:border-emerald-400"
                                />
                                <select
                                  value={veh.tipoCombustible || 'diesel'}
                                  onChange={e => handleUpdateVehicle(vIdx, 'tipoCombustible', e.target.value)}
                                  className="p-2 rounded-lg bg-black/60 border border-white/10 text-[10px] text-neutral-300 cursor-pointer"
                                >
                                  <option value="diesel">Diésel</option>
                                  <option value="gasolina95">G95</option>
                                  <option value="gasolina98">G98</option>
                                  <option value="electrico">kWh</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Combined Fleet Summary */}
                    <div className="p-3 rounded-xl bg-black/60 border border-sky-500/30 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                      <div className="space-y-1">
                        <span className="text-neutral-300 flex items-center gap-1.5">
                          📐 <strong className="text-white">Cálculo de Consumo Combinado:</strong>
                        </span>
                        <div className="text-[11px] text-neutral-400">
                          {formVehiculos.map((v, i) => (
                            <span key={i} className="inline-block mr-2">
                              • {v.nombre || `Vehículo ${i+1}`}: {v.consumoL100km} {v.tipoCombustible === 'electrico' ? 'kWh' : 'L'}/100km @ {v.precioCarburanteEUR || 1.55}€ (≈ {(((Number(v.consumoL100km) || 0) * (Number(v.precioCarburanteEUR) || 1.55))).toFixed(2)}€/100km)
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="bg-sky-500/10 border border-sky-500/30 px-3 py-1.5 rounded-lg text-right shrink-0">
                        <span className="text-[10px] uppercase block text-sky-400 font-mono">Coste Flota Total / 100 km</span>
                        <span className="text-sm font-extrabold text-amber-300">
                          {totalFleetCostPer100Km.toFixed(2)} € / 100 km
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stops / Ruta */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 font-display">
                        <MapPin className="w-4 h-4 text-sky-400" />
                        Ruta & Paradas
                      </h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Cada parada con fecha se reflejará en el calendario de la banda con sus gastos logísticos y convocatoria.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addStop}
                      className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Añadir Parada
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formStops.length === 0 ? (
                      <div className="p-6 text-center rounded-xl bg-black/20 border border-white/5 text-neutral-400 text-sm italic">
                        Añade paradas para calcular automáticamente kilometraje, estimación de combustible de todos tus vehículos, dietas y margen financiero.
                      </div>
                    ) : (
                      formStops.map((stop, idx) => (
                        <div key={stop.id} className="p-4 rounded-xl bg-neutral-900/60 border border-white/10 relative group">
                          <button
                            type="button"
                            onClick={() => removeStop(idx)}
                            className="absolute top-3 right-3 p-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/40 transition-colors cursor-pointer"
                            title="Eliminar parada"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <div className="text-xs font-bold text-sky-400 font-mono mb-3 flex items-center gap-2">
                            <span>PARADA #{idx + 1}</span>
                            {leads.length > 0 && (
                              <select 
                                onChange={(e) => handleSelectVenueForStop(idx, e.target.value)}
                                defaultValue=""
                                className="ml-auto text-[10px] bg-black/50 border border-sky-500/30 text-sky-300 p-1 rounded focus:outline-none cursor-pointer"
                              >
                                <option value="" disabled>-- Cargar desde Salas BD --</option>
                                {leads.map(lead => (
                                  <option key={lead.id} value={lead.id}>
                                    {lead.nombre_sala} ({lead.ciudad})
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-mono text-neutral-400 block">Ciudad</label>
                              <input
                                value={stop.ciudad}
                                onChange={e => updateStop(idx, 'ciudad', e.target.value)}
                                placeholder="Ciudad"
                                className="w-full p-2 rounded-lg bg-black/40 border border-white/10 text-sm focus:border-sky-500"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-mono text-neutral-400 block">Sala / Festival</label>
                              <input
                                value={stop.sala}
                                onChange={e => updateStop(idx, 'sala', e.target.value)}
                                placeholder="Nombre de la sala"
                                className="w-full p-2 rounded-lg bg-black/40 border border-white/10 text-sm focus:border-sky-500"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-mono text-neutral-400 block">Fecha</label>
                              <input
                                type="date"
                                value={stop.fecha}
                                onChange={e => updateStop(idx, 'fecha', e.target.value)}
                                className="w-full p-2 rounded-lg bg-black/40 border border-white/10 text-sm focus:border-sky-500"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-mono text-neutral-400 block flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <span>Distancia (Km)</span>
                                  <Calculator className="w-3 h-3 text-sky-400" title="Calcula combustible combinado para toda la flota automáticamente" />
                                </span>
                                {stop.distanciaAnteriorKm && stop.distanciaAnteriorKm > 0 ? (
                                  <span className="text-[9px] text-amber-300 font-normal">
                                    {formVehiculos.length} {formVehiculos.length === 1 ? 'vehículo' : 'vehículos'}
                                  </span>
                                ) : null}
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={stop.distanciaAnteriorKm || ''}
                                onChange={e => updateStop(idx, 'distanciaAnteriorKm', Number(e.target.value))}
                                placeholder="Km desde anterior"
                                className="w-full p-2 rounded-lg bg-black/40 border border-white/10 text-sm focus:border-sky-500"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5">
                            <div>
                              <label className="text-[10px] text-emerald-400 block font-mono">Caché / Taquilla (€)</label>
                              <input
                                type="number"
                                min="0"
                                value={stop.ingresoCacheEstimated || ''}
                                onChange={e => updateStop(idx, 'ingresoCacheEstimated', Number(e.target.value))}
                                placeholder="0 €"
                                className="w-full p-1.5 rounded bg-black/40 border border-emerald-500/30 text-xs text-emerald-300 font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-amber-300 block font-mono flex items-center justify-between">
                                <span>Gasolina Flota (€)</span>
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={stop.gastosGasolina || ''}
                                onChange={e => updateStop(idx, 'gastosGasolina', Number(e.target.value))}
                                placeholder="0 €"
                                className="w-full p-1.5 rounded bg-black/40 border border-amber-500/30 text-xs text-amber-200 font-semibold"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-neutral-400 block font-mono">Alojamiento (€)</label>
                              <input
                                type="number"
                                min="0"
                                value={stop.gastosAlojamiento || ''}
                                onChange={e => updateStop(idx, 'gastosAlojamiento', Number(e.target.value))}
                                placeholder="0 €"
                                className="w-full p-1.5 rounded bg-black/40 border border-white/10 text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-neutral-400 block font-mono">Dietas Expedición (€)</label>
                              <input
                                type="number"
                                min="0"
                                value={stop.gastosDietas || ''}
                                onChange={e => updateStop(idx, 'gastosDietas', Number(e.target.value))}
                                placeholder="0 €"
                                className="w-full p-1.5 rounded bg-black/40 border border-white/10 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Sincronización Automática Checkboxes */}
                <div className="p-4 rounded-xl bg-sky-950/30 border border-sky-500/30 space-y-2.5">
                  <span className="text-xs font-mono font-bold text-sky-300 uppercase tracking-wider block">
                    ⚡ Integración con Calendario & Finanzas
                  </span>
                  
                  <label className="flex items-center gap-2.5 text-xs text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formSincronizarCalendario}
                      onChange={(e) => setFormSincronizarCalendario(e.target.checked)}
                      className="rounded border-white/20 text-sky-500 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <span>
                      <strong className="text-white">📅 Sincronizar paradas en el Calendario oficial de la Banda:</strong> Crea/actualiza automáticamente los conciertos correspondientes con los miembros convocados y badge de gira.
                    </span>
                  </label>
                </div>

                {/* Balance General de Gira */}
                {formStops.length > 0 && (() => {
                  const totalIngresos = formStops.reduce((sum, stop) => sum + (stop.ingresoCacheEstimated || 0), 0);
                  const totalGastos = formStops.reduce((sum, stop) => sum + (stop.gastosAlojamiento || 0) + (stop.gastosGasolina || 0) + (stop.gastosDietas || 0), 0);
                  const neto = totalIngresos - totalGastos;
                  const numPers = formConvocatoriaTipo === 'completa' ? availableMembers.length : (formConvocadosIds.length || availableMembers.length);
                  const netoPorPersona = numPers > 0 ? Math.round(neto / numPers) : 0;

                  return (
                    <div className="p-4 rounded-xl bg-black/40 border border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                      <div>
                        <span className="text-[10px] text-neutral-400 uppercase font-mono block">Caché Total Est.</span>
                        <span className="text-base sm:text-lg font-bold text-emerald-400">+{totalIngresos} €</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400 uppercase font-mono block">Gastos Logística</span>
                        <span className="text-base sm:text-lg font-bold text-rose-400">-{totalGastos} €</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400 uppercase font-mono block">Margen Neto Total</span>
                        <span className={`text-base sm:text-lg font-extrabold ${neto >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {neto >= 0 ? `+${neto}` : neto} €
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-purple-300 uppercase font-mono block">Neto / Músico ({numPers}pax)</span>
                        <span className={`text-base sm:text-lg font-extrabold ${netoPorPersona >= 0 ? 'text-purple-300' : 'text-rose-400'}`}>
                          {netoPorPersona >= 0 ? `+${netoPorPersona}` : netoPorPersona} €
                        </span>
                      </div>
                    </div>
                  );
                })()}

              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-white/10 flex justify-end gap-3 bg-black/40 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="tour-form"
                className="px-5 py-2 rounded-xl text-sm font-bold bg-[#f2ca50] text-[#3c2f00] hover:bg-[#e0b83e] shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Activity className="w-4 h-4" />
                {editingTour ? 'Guardar Cambios' : 'Crear Gira'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirm Deletion */}
      {tourToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl ${colors.card} border border-rose-500/30 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150`}>
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 rounded-full bg-rose-500/10 border border-rose-500/20 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white font-display">¿Eliminar esta gira?</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Esta acción eliminará la gira y no se puede deshacer.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-sm text-neutral-200">
              Gira: <strong className="text-white">{tourToDelete.name}</strong>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTourToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Sí, Eliminar Gira
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
