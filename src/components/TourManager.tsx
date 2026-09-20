import React, { useState } from'react';
import { ThemeColors, Tour, TourRouteStop, TourVehicle, Concert, Lead, BookingCampaign } from'../types';
import { calculateVehiclesFuelCost } from'../utils/tourUtils';
import { ModalPortal } from'./common/ModalPortal';
import { HolidayDateWarning } from'./common/HolidayDateWarning';
import { PublicoSilhouette } from'./ui/PublicoSilhouette';
import {
 Plus, Edit3, Trash2, MapPin, Truck, Calendar, DollarSign,
 Activity, TrendingUp, Calculator, Users, CheckSquare, Square,
 CheckCircle2, AlertCircle, RefreshCw, ArrowRight, Sparkles, Target
} from'lucide-react';

interface TourManagerProps {
 colors: ThemeColors;
 tours: Tour[];
 concerts: Concert[];
 leads?: Lead[];
 activeCampaign?: BookingCampaign | null;
 setActiveCampaign?: (campaign: BookingCampaign | null) => void;
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
 activeCampaign,
 setActiveCampaign,
 onSaveTour,
 onDeleteTour,
 bandUsers = [],
 currentUser,
 currentBandId ='band-bakandeya',
 currentBandName ='Bakandeya',
 onAddConcert,
 onUpdateConcert,
 onAddPayment,
 onNavigate
}: TourManagerProps) {
 const [editingTour, setEditingTour] = useState<Tour | null>(null);
 const [isModalOpen, setIsModalOpen] = useState(false);

 // Sync Notification Toast
 const [syncFeedback, setSyncFeedback] = useState<{ tourId: string; message: string; type:'success' |'info' |'error' } | null>(null);

 // Form state
 const [formNombre, setFormNombre] = useState('');
 const [formVehiculos, setFormVehiculos] = useState<TourVehicle[]>([
 {
 id:'veh-1',
 nombre:'Furgoneta Sprinter / Master (Grande)',
 consumoL100km: 9.5,
 precioCarburanteEUR: 1.55,
 tipoCombustible:'diesel'
 }
 ]);
 const [formEstado, setFormEstado] = useState<'planificacion' |'confirmada' |'completada' |'cancelada'>('planificacion');
 const [formStops, setFormStops] = useState<TourRouteStop[]>([]);

 // Convocatoria / Miembros State
 const [formConvocatoriaTipo, setFormConvocatoriaTipo] = useState<'completa' |'parcial'>('completa');
 const [formConvocadosIds, setFormConvocadosIds] = useState<string[]>([]);
 const [formSincronizarCalendario, setFormSincronizarCalendario] = useState(true);
 const [formSincronizarFinanzas, setFormSincronizarFinanzas] = useState(false);
 const [dietaPerPersona, setDietaPerPersona] = useState<number>(25);

 // Default members list fallback
 const availableMembers = React.useMemo(() => {
 if (bandUsers && bandUsers.length > 0) {
 return bandUsers.map((u, idx) => ({
 id: u.id || `member-${idx}-${u.name || u.username}`,
 name: u.name || u.username ||'Músico',
 role: u.role ||'Miembro',
 instrument: u.instrument || (u.role ==='leader' ?'Líder / Músico' :'Músico')
 }));
 }
 return [
 { id:'usr-1', name:'Voz Principal / Guitarra', role:'Músico', instrument:'Voz / Guitarra' },
 { id:'usr-2', name:'Batería / Percusión', role:'Músico', instrument:'Batería' },
 { id:'usr-3', name:'Bajo', role:'Músico', instrument:'Bajo' },
 { id:'usr-4', name:'Teclados / Sintes', role:'Músico', instrument:'Teclados' },
 { id:'usr-5', name:'Técnico de Sonido', role:'Staff', instrument:'Sonido / P.A.' }
 ];
 }, [bandUsers]);

 // Vehicle Presets
 const VEHICLE_PRESETS = [
 { label:'🚐 Furgoneta Grande (Sprinter, Crafter, Master)', name:'Furgoneta Grande (Sprinter)', l100km: 9.5, fuel:'diesel', defaultPrice: 1.55 },
 { label:'🚐 Furgoneta Mediana (Transit Custom, Transporter, Vito)', name:'Furgoneta Mediana (Transit/Vito)', l100km: 7.8, fuel:'diesel', defaultPrice: 1.55 },
 { label:'🚐 Furgoneta Pequeña (Berlingo, Kangoo, Partner)', name:'Furgoneta Pequeña (Berlingo)', l100km: 6.2, fuel:'diesel', defaultPrice: 1.55 },
 { label:'🚗 Turismo / Coche de Apoyo', name:'Turismo / Coche de Apoyo', l100km: 6.8, fuel:'gasolina95', defaultPrice: 1.62 },
 { label:'⚡ Furgoneta Eléctrica', name:'Furgoneta Eléctrica', l100km: 22.0, fuel:'electrico', defaultPrice: 0.25 },
 { label:'⚙️ Vehículo Personalizado', name:'Vehículo Adicional', l100km: 8.5, fuel:'diesel', defaultPrice: 1.55 },
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
 const numMembers = formConvocatoriaTipo ==='completa' 
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
 id:'veh-1',
 nombre:'Furgoneta Sprinter / Master (Grande)',
 consumoL100km: 9.5,
 precioCarburanteEUR: 1.55,
 tipoCombustible:'diesel'
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
 id:'veh-1',
 nombre: tour.vehiculo ||'Furgoneta 9 Plazas',
 consumoL100km: tour.consumoL100km ?? 9.5,
 precioCarburanteEUR: tour.precioCarburanteEUR ?? 1.55,
 tipoCombustible: tour.tipoCombustible ??'diesel'
 }];

 setFormVehiculos(vehicles);
 setFormEstado(tour.estado);
 setFormConvocatoriaTipo(tour.convocatoria_tipo ||'completa');
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
 nombre:'Furgoneta',
 consumoL100km: 9.5,
 precioCarburanteEUR: 1.55,
 tipoCombustible:'diesel'
 };

 const convocadosNombres = formConvocatoriaTipo ==='completa'
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
 ciudad: stop.ciudad ||'Ciudad de Gira',
 sala: stop.sala ||'Sala de Gira',
 cache: Number(stop.ingresoCacheEstimated || 0),
 aforo_vendido: 0,
 aforo_total: 300,
 contrato_firmado: formEstado ==='confirmada' || formEstado ==='completada',
 estado_pago:'pendiente',
 notas: `Gira: ${formNombre.trim()} (Parada #${idx + 1})${stop.notasLogisticas ? ` - ${stop.notasLogisticas}` :''}`,
 tipo:'sala',
 giraId: tourId,
 giraNombre: formNombre.trim(),
 convocatoria_tipo: formConvocatoriaTipo,
 convocados_ids: formConvocatoriaTipo ==='completa' ? availableMembers.map(m => m.id) : formConvocadosIds,
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
 vehiculo: formVehiculos.map(v => v.nombre).filter(Boolean).join(",") || primaryVehicle.nombre,
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
 message: `Gira"${tourData.nombre}" guardada y sincronizada con ${updatedStops.length} paradas en el Calendario.`,
 type:'success'
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
 tipo:'ingreso',
 categoria:'concierto',
 concepto: `Caché Gira: ${tour.nombre} - ${stop.ciudad ||'Parada'} (${stop.sala ||'Sala'})`,
 importe: Number(stop.ingresoCacheEstimated),
 fecha: stop.fecha || tour.fechaInicio || new Date().toISOString().split('T')[0],
 estado:'pendiente'
 });
 count++;
 }
 });

 // Gasto Gasolina
 if (totalGasolina > 0) {
 onAddPayment({
 id: `pay-gas-${tour.id}-${now}`,
 band_id: currentBandId,
 tipo:'gasto',
 categoria:'transporte',
 concepto: `Combustible Flota Gira: ${tour.nombre} (${tour.vehiculos?.length || 1} veh.)`,
 importe: Number(totalGasolina),
 fecha: tour.fechaInicio || new Date().toISOString().split('T')[0],
 estado:'pendiente'
 });
 count++;
 }

 // Gasto Dietas
 if (totalDietas > 0) {
 const numPers = tour.convocatoria_tipo ==='parcial' && tour.convocados_ids?.length 
 ? tour.convocados_ids.length 
 : availableMembers.length;
 onAddPayment({
 id: `pay-dietas-${tour.id}-${now}`,
 band_id: currentBandId,
 tipo:'gasto',
 categoria:'comida',
 concepto: `Dietas Expedición Gira: ${tour.nombre} (${numPers} miembros)`,
 importe: Number(totalDietas),
 fecha: tour.fechaInicio || new Date().toISOString().split('T')[0],
 estado:'pendiente'
 });
 count++;
 }

 // Gasto Alojamientos
 if (totalAlojamiento > 0) {
 onAddPayment({
 id: `pay-hotel-${tour.id}-${now}`,
 band_id: currentBandId,
 tipo:'gasto',
 categoria:'alojamiento',
 concepto: `Hoteles / Alojamientos Gira: ${tour.nombre}`,
 importe: Number(totalAlojamiento),
 fecha: tour.fechaInicio || new Date().toISOString().split('T')[0],
 estado:'pendiente'
 });
 count++;
 }

 setSyncFeedback({
 tourId: tour.id,
 message: `¡Volcado exitoso! Se han registrado ${count} movimientos contables en Finanzas para la gira"${tour.nombre}".`,
 type:'success'
 });
 setTimeout(() => setSyncFeedback(null), 6000);
 };

 const addStop = () => {
 setFormStops([...formStops, {
 id: `stop-${Date.now()}`,
 ciudad:'',
 sala:'',
 fecha: new Date().toISOString().split('T')[0],
 distanciaAnteriorKm: 0,
 tiempoConduccionHoras: 0,
 gastosAlojamiento: 0,
 gastosGasolina: 0,
 gastosDietas: (formConvocatoriaTipo ==='completa' ? availableMembers.length : formConvocadosIds.length || availableMembers.length) * (dietaPerPersona || 25),
 ingresoCacheEstimated: 0,
 }]);
 };

 const updateStop = (index: number, field: keyof TourRouteStop, value: any) => {
 const newStops = [...formStops];
 const currentStop = { ...newStops[index], [field]: value };
 
 // Auto-calculate fuel & driving time based on all vehicles parameters
 if (field ==='distanciaAnteriorKm') {
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
 <div data-modulo="sala" className={`space-y-6 ${colors.text}`}>

 {/* Header */}
 <div className={`p-5 sm:p-6 rounded-[var(--r-l)] ${colors.card}`}>
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <div className="flex items-center gap-2">
 <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-[var(--acc)]/20 text-[var(--ink-3)]">
 Logística & Convocatorias Multi-Miembro
 </span>
 </div>
 <h2 className="text-xl font-bold font-display flex items-center gap-2 mt-1">
 <Truck className="w-6 h-6 text-[var(--ink-2)]" />
 Gestor Logístico & Giras de {currentBandName}
 </h2>
 <p className={`text-xs ${colors.textMuted} mt-1`}>
 Planifica rutas, selecciona qué miembros participan (Banda Completa vs Parcial), calcula combustible multi-vehículo, dietas y sincroniza automáticamente con el Calendario y Finanzas.
 </p>
 </div>
 
 <button
 onClick={handleOpenCreateModal}
 className="px-4 py-2.5 rounded-[var(--r-m)] text-xs font-sans font-bold tracking-wider bg-[var(--acc)] text-[var(--on-acc)] hover:bg-[var(--acc-soft)] transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
 >
 <Plus className="w-4 h-4 shrink-0" />
 <span>Nueva Gira</span>
 </button>
 </div>
 </div>

 {/* Sync Toast Feedback */}
 {syncFeedback && (
 <div className="p-3.5 px-4 rounded-[var(--r-m)] text-xs flex items-center justify-between gap-3 bg-[var(--ok)]/10 text-[var(--ink-2)] animate-in fade-in slide-in-from-top-2 duration-200">
 <div className="flex items-center gap-2.5">
 <CheckCircle2 className="w-4 h-4 text-[var(--ok)] shrink-0" />
 <span className="font-sans">{syncFeedback.message}</span>
 </div>
 {onNavigate && (
 <button
 onClick={() => onNavigate('finanzas')}
 className="px-2.5 py-1 rounded bg-[var(--ok)]/20 hover:bg-[var(--ok)]/30 text-[var(--ink)] font-sans text-[10px] font-bold tracking-wider flex items-center gap-1 cursor-pointer"
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
 <div className="col-span-full p-8 text-center rounded-[var(--r-l)] bg-[var(--surface)]">
 <PublicoSilhouette opacity={0.12} size="large" className="mx-auto mb-4" />
 <h3 className="text-lg font-bold text-[var(--ink)] mb-2">La gira está vacía</h3>
 <p className="text-sm text-[var(--ink-2)] max-w-md mx-auto mb-4">
 Agrupa tus conciertos en giras para calcular mejor los gastos logísticos, combustible de todos tus vehículos, dietas de los músicos convocados, alojamientos y el margen de beneficio neto.
 </p>
 <button
 onClick={handleOpenCreateModal}
 className="px-4 py-2 rounded-[var(--r-m)] text-xs font-bold bg-[var(--acc)] text-[var(--on-acc)] hover:opacity-90 transition-all inline-flex items-center gap-2 cursor-pointer"
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
 const isFormacionParcial = tour.convocatoria_tipo ==='parcial';
 const convocadosCount = isFormacionParcial && tour.convocados_ids 
 ? tour.convocados_ids.length 
 : availableMembers.length;

 const isCurrentUserConvocado = !currentUser?.id || !isFormacionParcial || (tour.convocados_ids && tour.convocados_ids.includes(currentUser.id));

 return (
 <div key={tour.id || `tour-${index}`} className={`p-5 rounded-[var(--r-l)] ${colors.card} group hover:border-[var(--hair)] transition-colors flex flex-col justify-between`}>
 <div>
 <div className="flex justify-between items-start mb-4">
 <div>
 <div className="flex items-center gap-2">
 <h3 className="font-bold text-lg font-display">{tour.nombre}</h3>
 {isCurrentUserConvocado ? (
 <span className="px-2 py-0.5 rounded text-[9px] font-sans font-bold bg-[var(--ok)]/20 text-[var(--ink-2)]">
 ✓ Convocado
 </span>
 ) : (
 <span className="px-2 py-0.5 rounded text-[9px] font-sans font-bold bg-[var(--surface)]/80 text-[var(--ink-2)]">
 No convocado
 </span>
 )}
 </div>
 <div className="flex flex-wrap items-center gap-2 mt-1.5">
 <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold
 ${tour.estado ==='confirmada' ? colors.badgeGreen : 
 tour.estado ==='planificacion' ? colors.badgeYellow :
 tour.estado ==='cancelada' ? colors.badgeRed :'bg-[var(--surface)]/80 text-[var(--ink)]'}`}>
 {tour.estado}
 </span>
 <span className={`text-[10px] ${colors.textMuted} flex items-center gap-1 font-sans`}>
 <Calendar className="w-3 h-3" />
 {tour.fechaInicio} — {tour.fechaFin}
 </span>
 {/* Convocatoria Badge */}
 <span className={`text-[10px] px-2 py-0.5 rounded font-sans flex items-center gap-1 ${
 isFormacionParcial 
 ?'bg-[var(--tentative)]/10 text-[var(--tentative)]/80/30' 
 :'bg-[var(--ok)]/10 text-[var(--ink-2)]/20'
 }`} title={tour.convocados_nombres?.join(",") ||'Toda la banda'}>
 <Users className="w-3 h-3" />
 {isFormacionParcial ? `Banda Parcial (${convocadosCount} músicos)` : `Banda Completa (${availableMembers.length})`}
 </span>
 {totalKm > 0 && (
 <span className="text-[10px] text-[var(--ink-2)] bg-[var(--acc)]/10 px-2 py-0.5 rounded font-sans">
 {totalKm} km
 </span>
 )}
 {vehiclesCount > 1 ? (
 <span className="text-[10px] text-[var(--acc)]/70 bg-[var(--acc)]/10 px-2 py-0.5 rounded font-sans flex items-center gap-1" title={tour.vehiculos?.map(v => v.nombre).join(" +")}>
 <Truck className="w-3 h-3 text-[var(--acc)]" />
 {vehiclesCount} vehículos
 </span>
 ) : tour.vehiculo ? (
 <span className="text-[10px] text-[var(--acc)]/70 bg-[var(--acc)]/10 px-2 py-0.5 rounded font-sans flex items-center gap-1">
 <Truck className="w-3 h-3" />
 {tour.vehiculo}
 </span>
 ) : null}
 </div>
 </div>
 <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
 <button onClick={() => handleOpenEditModal(tour)} className="p-1.5 rounded-[var(--r-s)] hover:bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors cursor-pointer" title="Editar">
 <Edit3 className="w-4 h-4" />
 </button>
 <button onClick={() => handleDelete(tour.id, tour.nombre)} className="p-1.5 rounded-[var(--r-s)] hover:bg-[var(--alert)]/15 text-[var(--ink-2)] hover:text-[var(--alert)] transition-colors cursor-pointer" title="Eliminar">
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 
 {/* Metrics */}
 <div className="grid grid-cols-3 gap-2 mb-4">
 <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--sunken)]">
 <span className="text-[9px] text-[var(--ink-2)] tracking-wider block font-sans">Logística</span>
 <div className="text-xs font-bold text-[var(--alert)] mt-0.5">
 -{totalGastos} €
 </div>
 </div>
 <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--sunken)]">
 <span className="text-[9px] text-[var(--ink-2)] tracking-wider block font-sans">Caché Est.</span>
 <div className="text-xs font-bold text-[var(--ok)] mt-0.5">
 +{totalIngresos} €
 </div>
 </div>
 <div className={`p-2.5 rounded-[var(--r-m)] ${beneficioNeto >= 0 ?'bg-[var(--ok)]/10/20 text-[var(--ok)]' :'bg-[var(--alert)]/10/20 text-[var(--alert)]'}`}>
 <span className="text-[9px] opacity-80 tracking-wider block font-sans">Margen Neto</span>
 <div className="text-xs font-extrabold mt-0.5 flex items-center gap-1">
 <TrendingUp className="w-3 h-3" />
 {beneficioNeto >= 0 ? `+${beneficioNeto}` : beneficioNeto} €
 </div>
 </div>
 </div>

 {/* Ruta & Paradas */}
 <div>
 <h4 className="text-[10px] font-sans text-[var(--ink-2)] mb-2 flex justify-between items-center">
 <span>Ruta ({tour.stops.length} paradas)</span>
 <span className="text-[var(--ink-2)] truncate max-w-[200px]" title={tour.vehiculos?.map(v => v.nombre).join(",") || tour.vehiculo}>
 {tour.vehiculos && tour.vehiculos.length > 1 
 ? `${tour.vehiculos.length} Vehículos` 
 : (tour.vehiculo ||'1 Vehículo')}
 </span>
 </h4>
 <div className="space-y-1.5">
 {tour.stops.length === 0 ? (
 <span className="text-[10px] text-[var(--ink-2)] italic">Sin paradas configuradas</span>
 ) : (
 tour.stops.slice(0, 4).map((stop, idx) => (
 <div key={`tour-${tour.id || index}-stop-${stop.id || idx}-${idx}`} className="py-1 px-2 rounded-[var(--r-s)] bg-[var(--sunken)] space-y-1">
 <div className="flex items-center justify-between text-xs">
 <div className="flex items-center gap-2 min-w-0">
 <span className="text-[var(--ink-2)] font-sans text-xs font-bold">{idx + 1}.</span>
 <span className="font-bold truncate text-[var(--ink)] text-xs sm:text-sm">{stop.ciudad ||'Por determinar'}</span>
 <span className="text-[var(--ink-2)] text-xs font-semibold truncate">({stop.sala ||'Sala tbd'})</span>
 </div>
 <div className="flex items-center gap-2 shrink-0 font-sans text-xs">
 {stop.ingresoCacheEstimated ? (
 <span className="text-[var(--ok)] font-bold">+{stop.ingresoCacheEstimated}€</span>
 ) : null}
 <span className="text-[var(--acc)]/70 font-sans text-xs font-bold">{stop.fecha}</span>
 </div>
 </div>
 <HolidayDateWarning date={stop.fecha} city={stop.ciudad} compact />
 </div>
 ))
 )}
 {tour.stops.length > 4 && (
 <div className="text-[10px] text-center text-[var(--ink-2)] pt-1 font-sans">+ {tour.stops.length - 4} paradas adicionales</div>
 )}
 </div>
 </div>
 </div>

 {/* Acciones de Sincronización */}
 <div className="pt-4 mt-4 flex flex-wrap items-center justify-between gap-2">
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => handleVolcarEnFinanzas(tour)}
 className="px-3 py-1.5 rounded-[var(--r-s)] text-[11px] font-sans font-bold tracking-wider bg-[var(--ok)]/15 hover:bg-[var(--ok)]/25 text-[var(--ink-2)] transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
 title="Registra los cachés y gastos logísticos calculados en el libro diario de Finanzas"
 >
 <DollarSign className="w-3.5 h-3.5" />
 <span>Volcar en Finanzas</span>
 </button>

 {onNavigate && (
 <button
 type="button"
 onClick={() => onNavigate('calendario', { selectedDate: tour.fechaInicio })}
 className="px-2.5 py-1.5 rounded-[var(--r-s)] text-[11px] font-sans font-bold tracking-wider bg-[var(--acc)]/15 hover:bg-[var(--acc)]/25 text-[var(--ink-3)] transition-all flex items-center gap-1.5 cursor-pointer"
 title="Abrir agenda y ver paradas de la gira en el calendario"
 >
 <Calendar className="w-3.5 h-3.5" />
 <span>Ver en Calendario</span>
 </button>
 )}
 </div>

 <span className="text-[10px] text-[var(--ink-2)] font-sans">
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
 <ModalPortal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-[var(--scrim)]/80 overflow-y-auto overscroll-contain">
 <div className={`w-full max-w-4xl rounded-[var(--r-l)] ${colors.bg} flex flex-col my-auto max-h-[90vh]`}>
 {/* Modal Header */}
 <div className="p-4 sm:p-6 flex justify-between items-center bg-[var(--sunken)] shrink-0">
 <div>
 <h3 className="text-lg font-bold font-display flex items-center gap-2">
 <Truck className="w-5 h-5 text-[var(--ink-2)]" />
 {editingTour ?'Editar Gira' :'Nueva Gira'}
 </h3>
 <p className="text-xs text-[var(--ink-2)] mt-0.5">
 Configura la ruta, flota de vehículos, selección de miembros y sincronización automática.
 </p>
 </div>
 <button 
 onClick={() => setIsModalOpen(false)}
 className="p-2 rounded-[var(--r-m)] hover:bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors text-xl leading-none cursor-pointer"
 >
 &times;
 </button>
 </div>

 {/* Modal Body */}
 <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
 <form id="tour-form" onSubmit={handleSave} className="space-y-6">
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div className="sm:col-span-2 space-y-1.5">
 <label className={`text-[10px] font-sans tracking-wider ${colors.textMuted}`}>Nombre de la Gira *</label>
 <input
 required
 value={formNombre}
 onChange={e => setFormNombre(e.target.value)}
 placeholder="Ej. Tour Peninsular Primavera 2026"
 className={`w-full p-2.5 sm:p-3 rounded-[var(--r-m)] bg-[var(--sunken)] ${colors.text} focus:outline-none focus:border-[var(--acc)] transition-colors text-sm`}
 />
 </div>
 
 <div className="space-y-1.5">
 <label className={`text-[10px] font-sans tracking-wider ${colors.textMuted}`}>Estado de la Gira</label>
 <select
 value={formEstado}
 onChange={e => setFormEstado(e.target.value as any)}
 className={`w-full p-2.5 sm:p-3 rounded-[var(--r-m)] bg-[var(--sunken)] ${colors.text} focus:outline-none focus:border-[var(--acc)] transition-colors text-sm cursor-pointer`}
 >
 <option value="planificacion">En Planificación</option>
 <option value="confirmada">Confirmada</option>
 <option value="completada">Completada</option>
 <option value="cancelada">Cancelada</option>
 </select>
 </div>

 {/* SELECCIÓN DE MIEMBROS DE LA BANDA (FORMACIÓN COMPLETA VS PARCIAL) */}
 <div className="sm:col-span-3 p-4 rounded-[var(--r-m)] bg-[var(--acc)]/90/20 space-y-4">
 <div className="flex flex-wrap items-center justify-between gap-2/20 pb-3">
 <div>
 <span className="text-xs font-sans font-bold text-[var(--tentative)]/80 tracking-wider flex items-center gap-1.5">
 <Users className="w-4 h-4 text-[var(--acc)]" /> Miembros & Formación de la Gira
 </span>
 <p className="text-[11px] text-[var(--ink-2)] mt-0.5">
 Selecciona si viaja toda la banda o una formación reducida/acústica. Afecta al cálculo de dietas, hoteles y visibilidad en el calendario de cada músico.
 </p>
 </div>

 {/* Selector Banda Completa vs Parcial */}
 <div className="flex rounded-[var(--r-s)] bg-[var(--sunken)] p-1">
 <button
 type="button"
 onClick={() => {
 setFormConvocatoriaTipo('completa');
 setFormConvocadosIds(availableMembers.map(m => m.id));
 }}
 className={`px-3 py-1 text-xs font-sans font-bold rounded-md transition-all cursor-pointer ${
 formConvocatoriaTipo ==='completa'
 ?'bg-[var(--acc)] text-[var(--ink)]'
 :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 👥 Banda Completa ({availableMembers.length})
 </button>
 <button
 type="button"
 onClick={() => setFormConvocatoriaTipo('parcial')}
 className={`px-3 py-1 text-xs font-sans font-bold rounded-md transition-all cursor-pointer ${
 formConvocatoriaTipo ==='parcial'
 ?'bg-[var(--acc)] text-[var(--ink)]'
 :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 👤 Formación Parcial / Reducida
 </button>
 </div>
 </div>

 {/* Lista de Miembros para Convocatoria */}
 {formConvocatoriaTipo ==='parcial' && (
 <div className="space-y-2.5 animate-in fade-in duration-200">
 <div className="flex justify-between items-center text-[11px] text-[var(--ink-2)] font-sans">
 <span>Marca los músicos o miembros del equipo que viajarán en esta gira:</span>
 <div className="flex gap-2">
 <button
 type="button"
 onClick={handleSelectAllMembers}
 className="text-[var(--tentative)]/80 hover:underline cursor-pointer"
 >
 Seleccionar todos
 </button>
 <span>|</span>
 <button
 type="button"
 onClick={() => setFormConvocadosIds([])}
 className="text-[var(--ink-2)] hover:underline cursor-pointer"
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
 className={`p-2.5 rounded-[var(--r-m)] text-left flex items-center gap-3 transition-all cursor-pointer ${
 isSelected
 ?'bg-[var(--tentative)]/20/50 text-[var(--ink)]'
 :'bg-[var(--sunken)] text-[var(--ink-2)] hover:border-[var(--hair)]'
 }`}
 >
 <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
 isSelected ?'bg-[var(--acc)] text-[var(--ink)]' :'border'
 }`}>
 {isSelected && <CheckSquare className="w-3.5 h-3.5" />}
 </div>
 <div className="min-w-0 flex-1">
 <div className="text-xs font-bold truncate text-[var(--ink)]">{m.name}</div>
 <div className="text-[10px] text-[var(--ink-2)] truncate">{m.instrument || m.role}</div>
 </div>
 </button>
 );
 })}
 </div>
 </div>
 )}

 {/* Barra de Dietas por Músico */}
 <div className="p-3 rounded-[var(--r-m)] bg-[var(--sunken)] flex flex-wrap items-center justify-between gap-3 text-xs">
 <div className="flex items-center gap-2">
 <span className="text-[var(--tentative)]/80 font-sans font-bold">
 Expedición: {formConvocatoriaTipo ==='completa' ? availableMembers.length : formConvocadosIds.length} personas convocadas
 </span>
 </div>

 <div className="flex items-center gap-2">
 <span className="text-[var(--ink-2)] font-sans text-[11px]">Dieta / pers. / día:</span>
 <input
 type="number"
 min="0"
 value={dietaPerPersona}
 onChange={(e) => setDietaPerPersona(Number(e.target.value))}
 className="w-16 p-1 rounded bg-[var(--sunken)] text-xs font-sans text-center font-bold text-[var(--acc)]/70"
 />
 <span className="text-[var(--ink-2)] text-xs font-sans">€</span>
 <button
 type="button"
 onClick={handleAutoCalculateDietas}
 className="px-2.5 py-1 rounded bg-[var(--tentative)]/20 text-[var(--tentative)]/80 hover:bg-[var(--tentative)]/30 text-xs font-sans font-bold flex items-center gap-1 transition-colors cursor-pointer"
 title="Aplica la dieta total (personas x dieta) a todas las paradas de la ruta"
 >
 <Sparkles className="w-3 h-3" /> Aplicar a Paradas
 </button>
 </div>
 </div>
 </div>

 {/* Multi-Vehicle & Fuel Calculation Settings */}
 <div className="sm:col-span-3 p-4 rounded-[var(--r-m)] bg-[var(--bg)]/20 space-y-4">
 <div className="flex flex-wrap items-center justify-between gap-2/20 pb-3">
 <div>
 <span className="text-xs font-sans font-bold text-[var(--ink-3)] tracking-wider flex items-center gap-1.5">
 <Truck className="w-4 h-4 text-[var(--ink-2)]" /> Flota & Vehículos de la Gira ({formVehiculos.length} {formVehiculos.length === 1 ?'vehículo' :'vehículos'})
 </span>
 <p className="text-[11px] text-[var(--ink-2)] mt-0.5">
 Añade todos los coches o furgonetas que viajan. El consumo de combustible sumará el gasto combinado de la flota.
 </p>
 </div>
 <div className="flex flex-wrap items-center gap-2">
 <button
 type="button"
 onClick={() => handleAddVehicle(0)}
 className="px-3 py-1.5 rounded-[var(--r-s)] bg-[var(--acc)]/20 text-[var(--ink-3)] hover:bg-[var(--acc)]/30 text-xs font-sans font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
 >
 <Plus className="w-3.5 h-3.5" /> Añadir Vehículo
 </button>
 <button
 type="button"
 onClick={() => recalculateAllFuelStops()}
 className="px-3 py-1.5 rounded-[var(--r-s)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] text-xs font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer"
 title="Aplica la suma de consumos a las distancias de todas las paradas"
 >
 <Calculator className="w-3.5 h-3.5 text-[var(--acc)]" /> Recalcular Paradas
 </button>
 </div>
 </div>

 {/* Vehicles List */}
 <div className="space-y-3">
 {formVehiculos.map((veh, vIdx) => (
 <div key={veh.id || `veh-${vIdx}`} className="p-3.5 rounded-[var(--r-m)] bg-[var(--sunken)] relative space-y-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <span className="px-2 py-0.5 rounded bg-[var(--acc)]/20 text-[var(--ink-3)] text-[10px] font-sans font-bold">
 Vehículo #{vIdx + 1}
 </span>
 <span className="text-xs font-semibold text-[var(--ink)]">
 {veh.nombre ||'Vehículo sin nombre'}
 </span>
 </div>
 {formVehiculos.length > 1 && (
 <button
 type="button"
 onClick={() => handleRemoveVehicle(vIdx)}
 className="p-1 rounded-[var(--r-s)] text-[var(--alert)] hover:bg-[var(--alert)]/20 transition-colors text-xs flex items-center gap-1 cursor-pointer"
 title="Eliminar este vehículo"
 >
 <Trash2 className="w-3.5 h-3.5" />
 <span className="hidden sm:inline text-[10px] font-sans">Eliminar</span>
 </button>
 )}
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
 <div>
 <label className="text-[10px] font-sans text-[var(--ink-2)] block mb-1">Cargar Plantilla</label>
 <select
 onChange={(e) => handleApplyPresetToVehicle(vIdx, e.target.value)}
 defaultValue=""
 className="w-full p-2 rounded-[var(--r-s)] bg-[var(--sunken)] text-xs text-[var(--ink)] focus:border-[var(--acc)] cursor-pointer"
 >
 <option value="" disabled>-- Seleccionar Modelo --</option>
 {VEHICLE_PRESETS.map((p, idx) => (
 <option key={`veh-preset-${p.name}-${idx}`} value={p.label}>{p.label}</option>
 ))}
 </select>
 </div>

 <div>
 <label className="text-[10px] font-sans text-[var(--ink-2)] block mb-1">Nombre / Identificador</label>
 <input
 value={veh.nombre}
 onChange={e => handleUpdateVehicle(vIdx,'nombre', e.target.value)}
 placeholder="Ej. Furgoneta Principal (Banda)"
 className="w-full p-2 rounded-[var(--r-s)] bg-[var(--sunken)] text-xs text-[var(--ink)] focus:border-[var(--acc)]"
 />
 </div>

 <div>
 <label className="text-[10px] font-sans text-[var(--acc)]/70 block mb-1">
 Consumo ({veh.tipoCombustible ==='electrico' ?'kWh/100km' :'L/100km'})
 </label>
 <input
 type="number"
 step="0.1"
 min="0.1"
 value={veh.consumoL100km}
 onChange={e => handleUpdateVehicle(vIdx,'consumoL100km', Number(e.target.value))}
 className="w-full p-2 rounded-[var(--r-s)] bg-[var(--sunken)] text-xs font-bold text-[var(--acc)]/70 focus:"
 />
 </div>

 <div>
 <label className="text-[10px] font-sans text-[var(--ink-2)] block mb-1">
 Precio (€/{veh.tipoCombustible ==='electrico' ?'kWh' :'Litro'})
 </label>
 <div className="flex gap-1">
 <input
 type="number"
 step="0.01"
 min="0.01"
 value={veh.precioCarburanteEUR ?? 1.55}
 onChange={e => handleUpdateVehicle(vIdx,'precioCarburanteEUR', Number(e.target.value))}
 className="w-full p-2 rounded-[var(--r-s)] bg-[var(--sunken)] text-xs font-bold text-[var(--ink-2)] focus:border-[var(--ok)]"
 />
 <select
 value={veh.tipoCombustible ||'diesel'}
 onChange={e => handleUpdateVehicle(vIdx,'tipoCombustible', e.target.value)}
 className="p-2 rounded-[var(--r-s)] bg-[var(--sunken)] text-[10px] text-[var(--ink)] cursor-pointer"
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
 <div className="p-3 rounded-[var(--r-m)] bg-[var(--sunken)] flex flex-wrap items-center justify-between gap-3 text-xs font-sans">
 <div className="space-y-1">
 <span className="text-[var(--ink)] flex items-center gap-1.5">
 📐 <strong className="text-[var(--ink)]">Cálculo de Consumo Combinado:</strong>
 </span>
 <div className="text-[11px] text-[var(--ink-2)]">
 {formVehiculos.map((v, i) => (
 <span key={`veh-fleet-summary-${v.id || i}-${i}`} className="inline-block mr-2">
 • {v.nombre || `Vehículo ${i+1}`}: {v.consumoL100km} {v.tipoCombustible ==='electrico' ?'kWh' :'L'}/100km @ {v.precioCarburanteEUR || 1.55}€ (≈ {(((Number(v.consumoL100km) || 0) * (Number(v.precioCarburanteEUR) || 1.55))).toFixed(2)}€/100km)
 </span>
 ))}
 </div>
 </div>
 <div className="bg-[var(--acc)]/10 px-3 py-1.5 rounded-[var(--r-s)] text-right shrink-0">
 <span className="text-[10px] block text-[var(--ink-2)] font-sans">Coste Flota Total / 100 km</span>
 <span className="text-sm font-extrabold text-[var(--acc)]/70">
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
 <h4 className="text-sm font-bold tracking-wider flex items-center gap-2 font-display">
 <MapPin className="w-4 h-4 text-[var(--ink-2)]" />
 Ruta & Paradas
 </h4>
 <p className="text-[11px] text-[var(--ink-2)] mt-0.5">
 Cada parada con fecha se reflejará en el calendario de la banda con sus gastos logísticos y convocatoria.
 </p>
 </div>
 <button
 type="button"
 onClick={addStop}
 className="px-3 py-1.5 rounded-[var(--r-s)] text-xs font-sans font-bold tracking-wider bg-[var(--acc)]/20 text-[var(--ink-3)] hover:bg-[var(--acc)]/30 transition-colors flex items-center gap-1.5 cursor-pointer"
 >
 <Plus className="w-3.5 h-3.5" /> Añadir Parada
 </button>
 </div>

 <div className="space-y-4">
 {formStops.length === 0 ? (
 <div className="p-6 text-center rounded-[var(--r-m)] bg-[var(--sunken)] text-[var(--ink-2)] text-sm italic">
 Añade paradas para calcular automáticamente kilometraje, estimación de combustible de todos tus vehículos, dietas y margen financiero.
 </div>
 ) : (
 formStops.map((stop, idx) => (
 <div key={stop.id || `form-stop-${idx}`} className="p-4 rounded-[var(--r-m)] bg-[var(--surface)]/60 relative group">
 <button
 type="button"
 onClick={() => removeStop(idx)}
 className="absolute top-3 right-3 p-1.5 rounded-[var(--r-s)] bg-[var(--alert)]/20 text-[var(--ink-2)] hover:bg-[var(--alert)]/40 transition-colors cursor-pointer"
 title="Eliminar parada"
 >
 <Trash2 className="w-4 h-4" />
 </button>

 <div className="text-xs font-bold text-[var(--ink-2)] font-sans mb-3 flex items-center gap-2">
 <span>PARADA #{idx + 1}</span>
 {leads.length > 0 && (
 <select 
 onChange={(e) => handleSelectVenueForStop(idx, e.target.value)}
 defaultValue=""
 className="ml-auto text-[10px] bg-[var(--sunken)] text-[var(--ink-3)] p-1 rounded focus:outline-none cursor-pointer"
 >
 <option value="" disabled>-- Cargar desde Salas BD --</option>
 {leads.map((lead, lIdx) => (
 <option key={`lead-opt-${lead.id || lIdx}-${lIdx}`} value={lead.id || lead.nombre_sala}>
 {lead.nombre_sala} ({lead.ciudad})
 </option>
 ))}
 </select>
 )}
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
 <div className="space-y-1">
 <label className="text-[10px] font-sans text-[var(--ink-2)] block">Ciudad</label>
 <input
 value={stop.ciudad}
 onChange={e => updateStop(idx,'ciudad', e.target.value)}
 placeholder="Ciudad"
 className="w-full p-2 rounded-[var(--r-s)] bg-[var(--sunken)] text-sm focus:border-[var(--acc)]"
 />
 </div>
 <div className="space-y-1">
 <label className="text-[10px] font-sans text-[var(--ink-2)] block">Sala / Festival</label>
 <input
 value={stop.sala}
 onChange={e => updateStop(idx,'sala', e.target.value)}
 placeholder="Nombre de la sala"
 className="w-full p-2 rounded-[var(--r-s)] bg-[var(--sunken)] text-sm focus:border-[var(--acc)]"
 />
 </div>
 <div className="space-y-1">
 <label className="text-[10px] font-sans text-[var(--ink-2)] block">Fecha</label>
 <input
 type="date"
 value={stop.fecha}
 onChange={e => updateStop(idx,'fecha', e.target.value)}
 className="w-full p-2 rounded-[var(--r-s)] bg-[var(--sunken)] text-sm focus:border-[var(--acc)]"
 />
 </div>
 <div className="space-y-1">
 <label className="text-[10px] font-sans text-[var(--ink-2)] block flex items-center justify-between">
 <span className="flex items-center gap-1">
 <span>Distancia (Km)</span>
 <span title="Calcula combustible combinado para toda la flota automáticamente">
 <Calculator className="w-3 h-3 text-[var(--ink-2)]" />
 </span>
 </span>
 {stop.distanciaAnteriorKm && stop.distanciaAnteriorKm > 0 ? (
 <span className="text-[9px] text-[var(--acc)]/70 font-normal">
 {formVehiculos.length} {formVehiculos.length === 1 ?'vehículo' :'vehículos'}
 </span>
 ) : null}
 </label>
 <input
 type="number"
 min="0"
 value={stop.distanciaAnteriorKm ||''}
 onChange={e => updateStop(idx,'distanciaAnteriorKm', Number(e.target.value))}
 placeholder="Km desde anterior"
 className="w-full p-2 rounded-[var(--r-s)] bg-[var(--sunken)] text-sm focus:border-[var(--acc)]"
 />
 </div>
 </div>

 {/* Auditor de Festivos y Puentes para la Parada de Gira */}
 <HolidayDateWarning date={stop.fecha} city={stop.ciudad} className="mb-3" />

 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
 <div>
 <label className="text-[10px] text-[var(--ok)] block font-sans">Caché / Taquilla (€)</label>
 <input
 type="number"
 min="0"
 value={stop.ingresoCacheEstimated ||''}
 onChange={e => updateStop(idx,'ingresoCacheEstimated', Number(e.target.value))}
 placeholder="0 €"
 className="w-full p-1.5 rounded bg-[var(--sunken)] text-xs text-[var(--ink-2)] font-bold"
 />
 </div>
 <div>
 <label className="text-[10px] text-[var(--acc)]/70 block font-sans flex items-center justify-between">
 <span>Gasolina Flota (€)</span>
 </label>
 <input
 type="number"
 min="0"
 value={stop.gastosGasolina ||''}
 onChange={e => updateStop(idx,'gastosGasolina', Number(e.target.value))}
 placeholder="0 €"
 className="w-full p-1.5 rounded bg-[var(--sunken)] text-xs text-[var(--ink)] font-semibold"
 />
 </div>
 <div>
 <label className="text-[10px] text-[var(--ink-2)] block font-sans">Alojamiento (€)</label>
 <input
 type="number"
 min="0"
 value={stop.gastosAlojamiento ||''}
 onChange={e => updateStop(idx,'gastosAlojamiento', Number(e.target.value))}
 placeholder="0 €"
 className="w-full p-1.5 rounded bg-[var(--sunken)] text-xs"
 />
 </div>
 <div>
 <label className="text-[10px] text-[var(--ink-2)] block font-sans">Dietas Expedición (€)</label>
 <input
 type="number"
 min="0"
 value={stop.gastosDietas ||''}
 onChange={e => updateStop(idx,'gastosDietas', Number(e.target.value))}
 placeholder="0 €"
 className="w-full p-1.5 rounded bg-[var(--sunken)] text-xs"
 />
 </div>
 </div>
 </div>
 ))
 )}
 </div>
 </div>

 {/* Sincronización Automática Checkboxes */}
 <div className="p-4 rounded-[var(--r-m)] bg-[var(--bg)]/30 space-y-2.5">
 <span className="text-xs font-sans font-bold text-[var(--ink-3)] tracking-wider block">
 ⚡ Integración con Calendario & Finanzas
 </span>
 
 <label className="flex items-center gap-2.5 text-xs text-[var(--ink)] cursor-pointer">
 <input
 type="checkbox"
 checked={formSincronizarCalendario}
 onChange={(e) => setFormSincronizarCalendario(e.target.checked)}
 className="rounded text-[var(--tentative)] focus:ring-0 w-4 h-4 cursor-pointer"
 />
 <span>
 <strong className="text-[var(--ink)]">📅 Sincronizar paradas en el Calendario oficial de la Banda:</strong> Crea/actualiza automáticamente los conciertos correspondientes con los miembros convocados y badge de gira.
 </span>
 </label>
 </div>

 {/* Balance General de Gira */}
 {formStops.length > 0 && (() => {
 const totalIngresos = formStops.reduce((sum, stop) => sum + (stop.ingresoCacheEstimated || 0), 0);
 const totalGastos = formStops.reduce((sum, stop) => sum + (stop.gastosAlojamiento || 0) + (stop.gastosGasolina || 0) + (stop.gastosDietas || 0), 0);
 const neto = totalIngresos - totalGastos;
 const numPers = formConvocatoriaTipo ==='completa' ? availableMembers.length : (formConvocadosIds.length || availableMembers.length);
 const netoPorPersona = numPers > 0 ? Math.round(neto / numPers) : 0;

 return (
 <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
 <div>
 <span className="text-[10px] text-[var(--ink-2)] font-sans block">Caché Total Est.</span>
 <span className="text-base sm:text-lg font-bold text-[var(--ok)]">+{totalIngresos} €</span>
 </div>
 <div>
 <span className="text-[10px] text-[var(--ink-2)] font-sans block">Gastos Logística</span>
 <span className="text-base sm:text-lg font-bold text-[var(--alert)]">-{totalGastos} €</span>
 </div>
 <div>
 <span className="text-[10px] text-[var(--ink-2)] font-sans block">Margen Neto Total</span>
 <span className={`text-base sm:text-lg font-extrabold ${neto >= 0 ?'text-[var(--ok)]' :'text-[var(--alert)]'}`}>
 {neto >= 0 ? `+${neto}` : neto} €
 </span>
 </div>
 <div>
 <span className="text-[10px] text-[var(--tentative)]/80 font-sans block">Neto / Músico ({numPers}pax)</span>
 <span className={`text-base sm:text-lg font-extrabold ${netoPorPersona >= 0 ?'text-[var(--tentative)]/80' :'text-[var(--alert)]'}`}>
 {netoPorPersona >= 0 ? `+${netoPorPersona}` : netoPorPersona} €
 </span>
 </div>
 </div>
 );
 })()}

 </form>
 </div>

 {/* Modal Footer */}
 <div className="p-4 sm:p-6 flex justify-end gap-3 bg-[var(--sunken)] shrink-0">
 <button
 type="button"
 onClick={() => setIsModalOpen(false)}
 className="px-4 py-2 rounded-[var(--r-m)] text-sm font-medium hover:bg-[var(--surface)]/80 transition-colors cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="submit"
 form="tour-form"
 className="px-5 py-2 rounded-[var(--r-m)] text-sm font-bold bg-[var(--acc)] text-[var(--on-acc)] hover:bg-[var(--acc-soft)] active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
 >
 <Activity className="w-4 h-4" />
 {editingTour ?'Guardar Cambios' :'Crear Gira'}
 </button>
 </div>
 </div>
 </div>
 </ModalPortal>
 )}

 {/* Modal Confirm Deletion */}
 {tourToDelete && (
 <ModalPortal isOpen={!!tourToDelete} onClose={() => setTourToDelete(null)}>
 <div className="fixed inset-0 bg-[var(--scrim)]/80 z-[9999] flex items-center justify-center p-4 overflow-y-auto overscroll-contain">
 <div className={`w-full max-w-md rounded-[var(--r-l)] ${colors.card} p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 my-auto`}>
 <div className="flex items-center gap-3 text-[var(--alert)]">
 <div className="p-3 rounded-full bg-[var(--alert)]/10 shrink-0">
 <Trash2 className="w-6 h-6" />
 </div>
 <div>
 <h3 className="font-bold text-lg text-[var(--ink)] font-display">¿Eliminar esta gira?</h3>
 <p className="text-xs text-[var(--ink-2)] mt-0.5">Esta acción eliminará la gira y no se puede deshacer.</p>
 </div>
 </div>

 <div className="p-3 rounded-[var(--r-m)] bg-[var(--sunken)] text-sm text-[var(--ink-2)]">
 Gira: <strong className="text-[var(--ink)]">{tourToDelete.name}</strong>
 </div>

 <div className="flex justify-end gap-3 pt-2">
 <button
 type="button"
 onClick={() => setTourToDelete(null)}
 className="px-4 py-2 rounded-[var(--r-m)] text-xs font-sans font-bold tracking-wider bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink)] transition-colors cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="button"
 onClick={confirmDelete}
 className="px-4 py-2 rounded-[var(--r-m)] text-xs font-sans font-bold tracking-wider bg-[var(--alert)] hover:bg-[var(--alert)] text-[var(--ink)] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
 >
 <Trash2 className="w-4 h-4" />
 Sí, Eliminar Gira
 </button>
 </div>
 </div>
 </div>
 </ModalPortal>
 )}

 </div>
 );
}
