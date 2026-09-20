import React, { useState, useMemo } from'react';
import { ThemeColors, Payment, Concert, ConcertExpenseBreakdown } from'../types';
import {
 TrendingUp, TrendingDown, DollarSign, Plus, Filter, Search, X,
 CheckCircle2, AlertCircle, RefreshCw, Trash2, Calendar, FileText, Check, ArrowRight,
 Calculator, Edit3, AlertTriangle, ShieldCheck
} from'lucide-react';
import { PublicoSilhouette } from'./ui/PublicoSilhouette';
import { FinanceSummaryCards } from'./finanzas/FinanceSummaryCards';
import { AddTransactionModal } from'./finanzas/AddTransactionModal';
import { calculateFinancialSummary } from'../utils/financeUtils';

interface FinanzasProps {
 colors: ThemeColors;
 payments: Payment[];
 concerts?: Concert[];
 onAddPayment: (payment: Payment) => Promise<void>;
 onUpdatePayment: (id: string, updatedFields: Partial<Payment>) => Promise<void>;
 onUpdateConcert?: (id: string, updatedFields: Partial<Concert>) => Promise<void>;
 tours?: any[];
 bandUsers?: any[];
}

export default function Finanzas({ 
 colors, 
 payments = [], 
 concerts = [], 
 onAddPayment, 
 onUpdatePayment,
 onUpdateConcert 
}: FinanzasProps) {
 // Tabs:'analytics','ledger','rentabilidad'
 const [activeTab, setActiveTab] = useState<'analytics' |'ledger' |'rentabilidad'>('rentabilidad');

 // Edit concert expenses state
 const [editingConcertId, setEditingConcertId] = useState<string | null>(null);
 const [editingGasolina, setEditingGasolina] = useState<string>('0');
 const [editingDietas, setEditingDietas] = useState<string>('0');
 const [editingAlquiler, setEditingAlquiler] = useState<string>('0');
 const [editingAlojamiento, setEditingAlojamiento] = useState<string>('0');
 const [editingOtros, setEditingOtros] = useState<string>('0');
 const [editingNotasGastos, setEditingNotasGastos] = useState<string>('');

 // Search & Filter State
 const [searchTerm, setSearchTerm] = useState('');
 const [typeFilter, setTypeFilter] = useState<'todos' |'ingreso' |'gasto'>('todos');
 const [categoryFilter, setCategoryFilter] = useState<string>('todos');
 const [statusFilter, setStatusFilter] = useState<'todos' |'pendiente' |'pagado'>('todos');

 // Form State for Add Transaction
 const [isAddOpen, setIsAddOpen] = useState(false);
 const [tipo, setTipo] = useState<'ingreso' |'gasto'>('ingreso');
 const [categoria, setCategoria] = useState<'concierto' |'merchandising' |'subvencion' |'transporte' |'alojamiento' |'comida' |'promo' |'otros'>('concierto');
 const [concepto, setConcepto] = useState('');
 const [importe, setImporte] = useState('');
 const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
 const [estado, setEstado] = useState<'pendiente' |'pagado'>('pagado');

 // Sync state
 const [isSyncing, setIsSyncing] = useState(false);
 const [syncSuccess, setSyncSuccess] = useState('');
 const [syncError, setSyncError] = useState('');

 const handleSyncFinanzas = async () => {
 setIsSyncing(true);
 setSyncSuccess('');
 setSyncError('');
 try {
 const res = await fetch('/api/payments/sync', {
 method:'POST',
 headers: {'Content-Type':'application/json' }
 });
 const data = await res.json();
 if (res.ok && data.success) {
 setSyncSuccess(data.message ||'Finanzas sincronizadas con éxito.');
 setTimeout(() => setSyncSuccess(''), 6000);
 } else {
 setSyncError(data.error ||'Error al intentar sincronizar las finanzas.');
 }
 } catch (error) {
 console.error('Error synchronizing finances:', error);
 setSyncError('Error de conexión con el servidor.');
 } finally {
 setIsSyncing(false);
 }
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!concepto || !importe) return;

 const newPayment: Payment = {
 id:'pay-' + Date.now(),
 tipo,
 categoria,
 concepto,
 importe: parseFloat(importe) || 0,
 fecha,
 estado
 };

 await onAddPayment(newPayment);
 setIsAddOpen(false);
 
 // Reset form
 setConcepto('');
 setImporte('');
 setFecha(new Date().toISOString().split('T')[0]);
 setEstado('pagado');
 };

 const handleToggleEstado = async (payment: Payment) => {
 const nuevoEstado = payment.estado ==='pendiente' ?'pagado' :'pendiente';
 await onUpdatePayment(payment.id, { estado: nuevoEstado });
 };

 // Calculations
 const financialSummary = useMemo(() => calculateFinancialSummary(payments), [payments]);
 const totalIngresos = financialSummary.totalIngresos;
 const totalGastos = financialSummary.totalGastos;
 const balanceNeto = financialSummary.beneficioNeto;
 const totalPendienteIngresos = financialSummary.pagosPendientesIngreso;
 const totalPendienteGastos = financialSummary.pagosPendientesGasto;

 // Filter Payments
 const filteredPayments = payments.filter(p => {
 const matchesSearch = p.concepto.toLowerCase().includes(searchTerm.toLowerCase()) || 
 p.categoria.toLowerCase().includes(searchTerm.toLowerCase());
 const matchesType = typeFilter ==='todos' || p.tipo === typeFilter;
 const matchesCategory = categoryFilter ==='todos' || p.categoria === categoryFilter;
 const matchesStatus = statusFilter ==='todos' || p.estado === statusFilter;
 return matchesSearch && matchesType && matchesCategory && matchesStatus;
 });

 const categories = Array.from(new Set(payments.map(p => p.categoria)));

 const isLightTheme = (typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light') || colors.name?.toLowerCase().includes('light') || colors.bg.includes('f8fafc') || colors.bg.includes('white') || colors.bg.includes('neutral-50') || false;
 const textTitle = 'text-[var(--ink)]';
 const textSub = 'text-[var(--ink-2)]';
 const textMuted = 'text-[var(--ink-2)]';
 const cardBorder = '-neutral-200';

 return (
 <div className={`space-y-6 ${'text-[var(--ink)]'} font-sans w-full max-w-full overflow-x-hidden`}>
 
 {/* Header con Sincronización en Excel */}
 <div className={`flex justify-between items-start md:items-center pb-4 mb-2 gap-4 ${'-neutral-100'}`}>
 <div>
 <h4 className={`text-xs font-sans tracking-widest ${'text-[var(--acc)]'}`}>Finanzas & Libro Contable</h4>
 <h2 className={`text-xl font-bold font-display tracking-wider mt-1 ${textTitle}`}>CONTABILIDAD DE BANDA</h2>
 </div>
 <div className="flex gap-2.5 items-center flex-wrap">
 <button
 id="sync-finanzas-excel-btn"
 onClick={handleSyncFinanzas}
 disabled={isSyncing}
 className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-s)] text-[10px] font-sans font-bold tracking-wider transition-all cursor-pointer active:scale-95 ${
 isSyncing
 ?'bg-[var(--surface)]/80 text-[var(--ink-2)]'
 :' bg-[var(--acc)]/10 hover:bg-[var(--acc)]/20 text-[var(--acc)] -[var(--acc)]/30'
 }`}
 title="Sincronizar todas las transacciones financieras"
 >
 <RefreshCw className={`w-3 h-3 ${isSyncing ?'animate-spin' :''}`} />
 {isSyncing ?'Sincronizando...' :'Actualizar en Excel'}
 </button>
 
 <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-sans font-bold ${
' bg-[var(--ok)]/10 -[var(--ok)]/20 text-[var(--ok)]'
 }`}>
 <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)] animate-ping shrink-0" /> Auto-sync
 </span>
 </div>
 </div>

 {/* Notificaciones de Sincronización */}
 {syncSuccess && (
 <div className={`p-2 px-3 rounded-[var(--r-s)] text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-250 ${
 'bg-[var(--ok)]/10 text-[var(--ok)]'
 }`}>
 <CheckCircle2 className="w-4 h-4 text-[var(--ok)] shrink-0" />
 <span className="flex-1 font-sans text-[10px]">{syncSuccess}</span>
 <button onClick={() => setSyncSuccess('')} className="text-[10px] hover:opacity-80 font-bold px-1 font-sans">×</button>
 </div>
 )}
 {syncError && (
 <div className={`p-2 px-3 rounded-[var(--r-s)] text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-250 ${
 'bg-[var(--alert)]/10 text-[var(--alert)]'
 }`}>
 <AlertCircle className="w-4 h-4 text-[var(--alert)] shrink-0" />
 <span className="flex-1 font-sans text-[10px]">{syncError}</span>
 <button onClick={() => setSyncError('')} className="text-[10px] hover:opacity-80 font-bold px-1 font-sans">×</button>
 </div>
 )}

 {/* KPI Cards (Financial Overview) */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
 {/* Total revenue */}
 <div className={`${colors.card} p-5 space-y-1.5 relative overflow-hidden`}>
 <div className="flex justify-between items-center text-xs font-sans font-bold text-[var(--ok)] tracking-wider">
 <span>Ingresos Cobrados</span>
 <TrendingUp className="w-4 h-4" />
 </div>
 <h3 className={`text-2xl font-black font-display tracking-tight ${textTitle}`}>
 +{totalIngresos.toLocaleString('es-ES')}€
 </h3>
 <p className={`text-[10px] font-sans ${textSub}`}>
 {totalPendienteIngresos > 0 ? `+${totalPendienteIngresos.toLocaleString('es-ES')}€ pendientes de cobro` :'Al día'}
 </p>
 <div className="absolute right-[-10px] bottom-[-15px] opacity-5 pointer-events-none text-[var(--ok)]">
 <DollarSign className="w-24 h-24" />
 </div>
 </div>

 {/* Total expenses */}
 <div className={`${colors.card} p-5 space-y-1.5 relative overflow-hidden`}>
 <div className="flex justify-between items-center text-xs font-sans font-bold text-[var(--alert)] tracking-wider">
 <span>Gastos Liquidados</span>
 <TrendingDown className="w-4 h-4" />
 </div>
 <h3 className={`text-2xl font-black font-display tracking-tight ${textTitle}`}>
 -{totalGastos.toLocaleString('es-ES')}€
 </h3>
 <p className={`text-[10px] font-sans ${textSub}`}>
 {totalPendienteGastos > 0 ? `-${totalPendienteGastos.toLocaleString('es-ES')}€ pendientes de pago` :'Al día'}
 </p>
 <div className="absolute right-[-10px] bottom-[-15px] pointer-events-none opacity-5 text-[var(--alert)]">
 <DollarSign className="w-24 h-24" />
 </div>
 </div>

 {/* Net balance */}
 <div className={`${colors.card} p-5 space-y-1.5 relative overflow-hidden ${
 balanceNeto >= 0 ?'-emerald-500/20' :'-rose-500/20'
 }`}>
 <div className={`flex justify-between items-center text-xs font-sans font-bold tracking-wider ${
 balanceNeto >= 0 ?'text-[var(--ok)]' :'text-[var(--alert)]'
 }`}>
 <span>Balance de Caja Neto</span>
 <DollarSign className="w-4 h-4" />
 </div>
 <h3 className={`text-2xl font-black font-display tracking-tight ${textTitle}`}>
 {balanceNeto >= 0 ? `+${balanceNeto.toLocaleString('es-ES')}€` : `${balanceNeto.toLocaleString('es-ES')}€`}
 </h3>
 <p className={`text-[10px] font-sans ${textSub}`}>
 Caja total real cobrada menos gastos pagados
 </p>
 </div>
 </div>

 {/* Tabs / Filter Bar */}
 <div className={`flex flex-col md:flex-row md:items-center justify-between pb-4 mb-2 gap-4 ${'-neutral-100'}`}>
 <div className="flex gap-2 flex-wrap">
 <button
 onClick={() => setActiveTab('rentabilidad')}
 className={`px-3 py-1.5 font-sans text-[10px] font-bold tracking-wider rounded-[var(--r-s)] transition-all cursor-pointer flex items-center gap-1.5 ${
 activeTab ==='rentabilidad'
 ? colors.primary
 : 'bg-[var(--sunken)] text-[var(--ink-2)] hover:bg-[var(--sunken)]'
 }`}
 >
 <Calculator className="w-3.5 h-3.5" /> Rentabilidad por Bolo
 </button>
 <button
 onClick={() => setActiveTab('ledger')}
 className={`px-3 py-1.5 font-sans text-[10px] font-bold tracking-wider rounded-[var(--r-s)] transition-all cursor-pointer ${
 activeTab ==='ledger'
 ? colors.primary
 : 'bg-[var(--sunken)] text-[var(--ink-2)] hover:bg-[var(--sunken)]'
 }`}
 >
 Libro Diario (Historial)
 </button>
 <button
 onClick={() => setActiveTab('analytics')}
 className={`px-3 py-1.5 font-sans text-[10px] font-bold tracking-wider rounded-[var(--r-s)] transition-all cursor-pointer ${
 activeTab ==='analytics'
 ? colors.primary
 : 'bg-[var(--sunken)] text-[var(--ink-2)] hover:bg-[var(--sunken)]'
 }`}
 >
 Análisis de Costes (Categorías)
 </button>
 </div>

 <button
 onClick={() => setIsAddOpen(true)}
 className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-s)] text-[10px] font-sans font-bold tracking-wider transition-all cursor-pointer active:scale-95 ${
 'bg-[var(--tentative)]/80 hover:bg-[var(--tentative)] text-[var(--ink)]'
 }`}
 >
 <Plus className="w-3.5 h-3.5" /> Registrar Operación
 </button>
 </div>

 {/* Active Tab View */}
 {activeTab ==='rentabilidad' && (
 <div className="space-y-6">
 {/* Summary KPI cards for Concert Profitability */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {(() => {
 const totalConcertCache = concerts.reduce((acc, c) => acc + (c.cache || 0), 0);
 const totalConcertGastos = concerts.reduce((acc, c) => {
 const g = c.gastosDetalle;
 const sum = g ? ((g.gasolina || 0) + (g.dietas || 0) + (g.alquilerVehiculo || 0) + (g.alojamiento || 0) + (g.otros || 0)) : 0;
 return acc + (sum || c.gastosEstimadosTipicos || 150);
 }, 0);
 const totalBeneficioNeto = totalConcertCache - totalConcertGastos;
 const mediaBeneficio = concerts.length > 0 ? totalBeneficioNeto / concerts.length : 0;

 return (
 <>
 <div className={`${colors.card} p-4 rounded-[var(--r-m)] space-y-1`}>
 <span className="text-[10px] font-sans text-[var(--ink-2)] font-bold">Total Caché Contratado</span>
 <h4 className="text-xl font-black text-[var(--acc)]">{totalConcertCache.toLocaleString('es-ES')}€</h4>
 <p className="text-[10px] text-[var(--ink-2)]">{concerts.length} conciertos en catálogo</p>
 </div>

 <div className={`${colors.card} p-4 rounded-[var(--r-m)] space-y-1`}>
 <span className="text-[10px] font-sans text-[var(--ink-2)] font-bold">Total Gastos Gira</span>
 <h4 className="text-xl font-black text-[var(--alert)]">-{totalConcertGastos.toLocaleString('es-ES')}€</h4>
 <p className="text-[10px] text-[var(--ink-2)]">Gasolina, dietas, furgoneta, hoteles</p>
 </div>

 <div className={`${colors.card} p-4 rounded-[var(--r-m)] space-y-1`}>
 <span className="text-[10px] font-sans text-[var(--ink-2)] font-bold">Beneficio Neto Acumulado</span>
 <h4 className={`text-xl font-black ${totalBeneficioNeto >= 0 ?'text-[var(--ok)]' :'text-[var(--alert)]'}`}>
 {totalBeneficioNeto >= 0 ? `+${totalBeneficioNeto.toLocaleString('es-ES')}€` : `${totalBeneficioNeto.toLocaleString('es-ES')}€`}
 </h4>
 <p className="text-[10px] text-[var(--ink-2)]">Beneficio tras cubrir gastos de gira</p>
 </div>

 <div className={`${colors.card} p-4 rounded-[var(--r-m)] space-y-1`}>
 <span className="text-[10px] font-sans text-[var(--ink-2)] font-bold">Beneficio Medio / Bolo</span>
 <h4 className="text-xl font-black text-[var(--acc)]/70">
 {mediaBeneficio >= 0 ? `+${Math.round(mediaBeneficio)}€` : `${Math.round(mediaBeneficio)}€`}
 </h4>
 <p className="text-[10px] text-[var(--ink-2)]">Rentabilidad media por actuación</p>
 </div>
 </>
 );
 })()}
 </div>

 {/* Concert Profitability Table */}
 <div className={`${colors.card} p-5 rounded-[var(--r-m)] space-y-4`}>
 <div className="flex items-center justify-between /80 pb-3">
 <h3 className="text-sm font-bold tracking-wider text-[var(--acc)] flex items-center gap-2">
 <Calculator className="w-4 h-4" /> Desglose de Gastos & Rentabilidad por Bolo
 </h3>
 <span className="text-xs text-[var(--ink-2)]">Haz clic en"Gastos" para desglosar peajes, gasolina, hotel y dietas.</span>
 </div>

 {concerts.length === 0 ? (
 <div className="text-center py-12 space-y-3">
 <PublicoSilhouette opacity={0.12} size="medium" className="mx-auto" />
 <div className="space-y-1">
 <p className="text-xs font-semibold text-[var(--ink)]">Sin conciertos registrados</p>
 <p className="text-[10px] text-[var(--ink-2)]">Agenda tus primeros bolos para empezar a calcular rentabilidad y gastos.</p>
 </div>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead className="bg-[var(--surface)]/80 text-[var(--acc)] font-bold font-sans text-[10px]">
 <tr>
 <th className="p-3">Fecha & Bolo</th>
 <th className="p-3">Ciudad / Sala</th>
 <th className="p-3">Caché (€)</th>
 <th className="p-3">Desglose de Gastos (€)</th>
 <th className="p-3">Gastos Totales</th>
 <th className="p-3">Beneficio Neto</th>
 <th className="p-3 text-center">Estado Rentabilidad</th>
 <th className="p-3 text-right">Acción</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-neutral-800/60">
 {concerts.map(c => {
 const g = c.gastosDetalle || {};
 const gasolina = g.gasolina || 0;
 const dietas = g.dietas || 0;
 const alquiler = g.alquilerVehiculo || 0;
 const alojamiento = g.alojamiento || 0;
 const otros = g.otros || 0;
 
 const hasCustomGastos = !!c.gastosDetalle;
 const totalGastosBolo = hasCustomGastos 
 ? (gasolina + dietas + alquiler + alojamiento + otros)
 : (c.gastosEstimadosTipicos || 150);

 const beneficioNeto = (c.cache || 0) - totalGastosBolo;
 const margenPct = c.cache > 0 ? Math.round((beneficioNeto / c.cache) * 100) : 0;
 const numConvocados = c.convocatoria_tipo ==="parcial" && c.convocados_ids && c.convocados_ids.length > 0
 ? c.convocados_ids.length 
 : (c.convocados_nombres && c.convocados_nombres.length > 0 ? c.convocados_nombres.length : 5);
 const netoPorMusico = Math.round(beneficioNeto / (numConvocados || 1));

 let alertBadge = {
 label:'🟢 Rentable',
 bgColor:'bg-[var(--ok-soft)]/40 text-[var(--ok)]'
 };

 if (beneficioNeto < 0) {
 alertBadge = {
 label:'🔴 En Pérdidas',
 bgColor:'bg-[var(--alert-soft)]/50 text-[var(--alert)]'
 };
 } else if (beneficioNeto < 150) {
 alertBadge = {
 label:'🟡 Ajustado',
 bgColor:'bg-[var(--acc-soft)] /40 text-[var(--acc)]/70'
 };
 }

 return (
 <tr key={c.id} className="hover:bg-[var(--surface)]/30 transition">
 <td className="p-3 font-sans text-[var(--ink-2)]">
 <span className="font-bold text-[var(--ink)] block">{c.fecha}</span>
 <span className="text-[10px] text-[var(--ink-2)] capitalize">{c.tipo}</span>
 {c.giraNombre && (
 <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--acc)]/20 text-[var(--ink-3)] font-sans">
 🚐 {c.giraNombre}
 </span>
 )}
 </td>
 <td className="p-3">
 <span className="font-bold text-[var(--ink)] block">{c.sala}</span>
 <span className="text-[10px] text-[var(--ink-2)]">{c.ciudad}</span>
 {c.convocatoria_tipo ==="parcial" ? (
 <span className="inline-block mt-0.5 text-[9px] text-[var(--tentative)]/80 bg-[var(--tentative)]/10 px-1.5 py-0.2 rounded font-sans" title={c.convocados_nombres?.join(",")}>
 👤 Parcial ({numConvocados} miembros)
 </span>
 ) : (
 <span className="inline-block mt-0.5 text-[9px] text-[var(--ok)]/80 font-sans">
 👥 Banda completa
 </span>
 )}
 </td>
 <td className="p-3 font-sans font-bold text-[var(--acc)] text-sm">
 {c.cache ? `${c.cache}€` :'0€'}
 </td>
 <td className="p-3 text-[11px] text-[var(--ink-2)]">
 {hasCustomGastos ? (
 <div className="space-y-0.5">
 <div>Gasolina: <span className="font-sans text-[var(--ink-2)]">{gasolina}€</span> | Dietas: <span className="font-sans text-[var(--ink-2)]">{dietas}€</span></div>
 <div>Furgoneta: <span className="font-sans text-[var(--ink-2)]">{alquiler}€</span> | Hotel: <span className="font-sans text-[var(--ink-2)]">{alojamiento}€</span></div>
 </div>
 ) : (
 <span className="text-[var(--ink-2)] italic">Estimación típica (~150€)</span>
 )}
 </td>
 <td className="p-3 font-sans text-[var(--alert)] font-semibold">
 -{totalGastosBolo}€
 </td>
 <td className="p-3 font-sans font-black text-sm">
 <span className={beneficioNeto >= 0 ?'text-[var(--ok)]' :'text-[var(--alert)]'}>
 {beneficioNeto >= 0 ? `+${beneficioNeto}€` : `${beneficioNeto}€`}
 </span>
 <span className="block text-[10px] text-[var(--ink-2)] font-normal">
 Margen: {margenPct}%
 </span>
 <span className="block text-[9px] text-[var(--tentative)]/80 font-normal">
 Reparto: {netoPorMusico >= 0 ?"+" + netoPorMusico : netoPorMusico}€/músico
 </span>
 </td>
 <td className="p-3 text-center">
 <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${alertBadge.bgColor}`}>
 {alertBadge.label}
 </span>
 </td>
 <td className="p-3 text-right">
 <button
 onClick={() => {
 setEditingConcertId(c.id);
 setEditingGasolina(String(c.gastosDetalle?.gasolina || 0));
 setEditingDietas(String(c.gastosDetalle?.dietas || 0));
 setEditingAlquiler(String(c.gastosDetalle?.alquilerVehiculo || 0));
 setEditingAlojamiento(String(c.gastosDetalle?.alojamiento || 0));
 setEditingOtros(String(c.gastosDetalle?.otros || 0));
 setEditingNotasGastos(c.gastosDetalle?.notasGastos ||'');
 }}
 className="px-2.5 py-1 bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--acc)]/70 font-semibold rounded-[var(--r-s)] text-[11px] flex items-center gap-1 ml-auto transition cursor-pointer"
 >
 <Edit3 className="w-3.5 h-3.5" /> Gastos
 </button>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}
 </div>

 {/* EDIT CONCERT EXPENSES MODAL */}
 {editingConcertId && (
 <div className="fixed inset-0 bg-[var(--surface)]/80 z-50 flex items-center justify-center p-4">
 <div className="bg-[var(--surface)] rounded-[var(--r-l)] max-w-lg w-full p-6 space-y-4">
 <div className="flex items-center justify-between pb-3">
 <h3 className="text-lg font-bold text-[var(--ink)] flex items-center gap-2">
 <Calculator className="w-5 h-5 text-[var(--acc)]" /> Desglose Real de Gastos de Bolo
 </h3>
 <button
 onClick={() => setEditingConcertId(null)}
 className="text-[var(--ink-2)] hover:text-[var(--ink)] font-bold"
 >
 ✕
 </button>
 </div>

 <div className="space-y-3 text-xs">
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="text-[var(--ink-2)] font-semibold">Gasolina & Peajes (€)</label>
 <input
 type="number"
 value={editingGasolina}
 onChange={e => setEditingGasolina(e.target.value)}
 className="w-full bg-[var(--surface)] rounded-[var(--r-m)] p-2.5 text-[var(--ink)] font-sans"
 />
 </div>
 <div>
 <label className="text-[var(--ink-2)] font-semibold">Dietas / Comidas (€)</label>
 <input
 type="number"
 value={editingDietas}
 onChange={e => setEditingDietas(e.target.value)}
 className="w-full bg-[var(--surface)] rounded-[var(--r-m)] p-2.5 text-[var(--ink)] font-sans"
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="text-[var(--ink-2)] font-semibold">Alquiler Furgoneta / Backline (€)</label>
 <input
 type="number"
 value={editingAlquiler}
 onChange={e => setEditingAlquiler(e.target.value)}
 className="w-full bg-[var(--surface)] rounded-[var(--r-m)] p-2.5 text-[var(--ink)] font-sans"
 />
 </div>
 <div>
 <label className="text-[var(--ink-2)] font-semibold">Alojamiento / Hoteles (€)</label>
 <input
 type="number"
 value={editingAlojamiento}
 onChange={e => setEditingAlojamiento(e.target.value)}
 className="w-full bg-[var(--surface)] rounded-[var(--r-m)] p-2.5 text-[var(--ink)] font-sans"
 />
 </div>
 </div>

 <div>
 <label className="text-[var(--ink-2)] font-semibold">Otros Gastos Extra (€)</label>
 <input
 type="number"
 value={editingOtros}
 onChange={e => setEditingOtros(e.target.value)}
 className="w-full bg-[var(--surface)] rounded-[var(--r-m)] p-2.5 text-[var(--ink)] font-sans"
 />
 </div>

 <div>
 <label className="text-[var(--ink-2)] font-semibold">Notas sobre Gastos</label>
 <textarea
 rows={2}
 value={editingNotasGastos}
 onChange={e => setEditingNotasGastos(e.target.value)}
 placeholder="Detalles de facturas, tickets guardados..."
 className="w-full bg-[var(--surface)] rounded-[var(--r-m)] p-2.5 text-[var(--ink)]"
 />
 </div>

 {/* Total calculation preview */}
 <div className="p-3 bg-[var(--surface)] rounded-[var(--r-m)] flex items-center justify-between font-sans">
 <span className="text-[var(--ink-2)] font-bold">TOTAL GASTOS CALCULADOS:</span>
 <span className="text-[var(--alert)] font-black text-sm">
 -{(Number(editingGasolina) || 0) + (Number(editingDietas) || 0) + (Number(editingAlquiler) || 0) + (Number(editingAlojamiento) || 0) + (Number(editingOtros) || 0)}€
 </span>
 </div>
 </div>

 <div className="pt-2 flex justify-end gap-2">
 <button
 onClick={() => setEditingConcertId(null)}
 className="px-4 py-2 bg-[var(--surface)] text-[var(--ink-2)] text-xs font-bold rounded-[var(--r-m)]"
 >
 Cancelar
 </button>
 <button
 onClick={async () => {
 if (editingConcertId && onUpdateConcert) {
 const breakdown: ConcertExpenseBreakdown = {
 gasolina: Number(editingGasolina) || 0,
 dietas: Number(editingDietas) || 0,
 alquilerVehiculo: Number(editingAlquiler) || 0,
 alojamiento: Number(editingAlojamiento) || 0,
 otros: Number(editingOtros) || 0,
 notasGastos: editingNotasGastos
 };
 await onUpdateConcert(editingConcertId, { gastosDetalle: breakdown });
 }
 setEditingConcertId(null);
 }}
 className="px-4 py-2 bg-[var(--acc)] text-[var(--ink)] text-xs font-bold rounded-[var(--r-m)]"
 >
 Guardar Gastos
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 )}

 {/* Active Tab View */}
 {activeTab ==='ledger' ? (
 <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
 {/* Main Ledger List */}
 <div className="lg:col-span-3 space-y-4">
 {/* Ledger Filters */}
 <div className={`p-4 rounded-[var(--r-m)] flex flex-col md:flex-row gap-3 ${colors.card} ${cardBorder}`}>
 <div className="relative flex-1">
 <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--ink-2)] pointer-events-none" />
 <input
 id="finanzas-search"
 type="text"
 placeholder="Buscar transacciones por concepto..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className={`w-full rounded-[var(--r-s)] pl-9 ${searchTerm ?'pr-8' :'pr-3'} py-1.5 text-xs focus:outline-none font-sans transition-all ${
' bg-[var(--surface)] -[#99907c]/25 text-[var(--ink)] focus:-[var(--acc)]/50 placeholder:text-[var(--ink-2)]'
 }`}
 />
 {searchTerm && (
 <button
 id="finanzas-search-clear"
 type="button"
 onClick={() => setSearchTerm('')}
 className={`absolute right-2.5 top-2 p-0.5 rounded-full transition-colors cursor-pointer ${
 'text-[var(--ink-2)] hover:text-[var(--ink-2)] hover:bg-[var(--sunken)]'
 }`}
 title="Borrar búsqueda"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 )}
 </div>

 <div className="flex gap-2 flex-wrap md:flex-nowrap">
 {/* Type filter */}
 <select
 value={typeFilter}
 onChange={(e) => setTypeFilter(e.target.value as any)}
 className={` rounded-[var(--r-s)] text-xs py-1.5 px-3 font-sans focus:outline-none ${
 'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 >
 <option value="todos">Tipo: Todos</option>
 <option value="ingreso">Ingreso (+)</option>
 <option value="gasto">Gasto (-)</option>
 </select>

 {/* Category filter */}
 <select
 value={categoryFilter}
 onChange={(e) => setCategoryFilter(e.target.value)}
 className={` rounded-[var(--r-s)] text-xs py-1.5 px-3 font-sans focus:outline-none ${
 'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 >
 <option value="todos">Categoría: Todas</option>
 {categories.map(cat => <option key={cat} value={cat}>{cat.toUpperCase()}</option>)}
 </select>

 {/* Status filter */}
 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value as any)}
 className={` rounded-[var(--r-s)] text-xs py-1.5 px-3 font-sans focus:outline-none ${
 'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 >
 <option value="todos">Estado: Todos</option>
 <option value="pendiente">Pendiente</option>
 <option value="pagado">Pagado</option>
 </select>
 </div>
 </div>

 {/* Ledger Transactions Grid */}
 <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
 {filteredPayments.length === 0 ? (
 <div className="text-center py-12 rounded-[var(--r-m)] space-y-3">
 <PublicoSilhouette opacity={0.12} size="medium" className="mx-auto" />
 <div className="space-y-1">
 <p className="text-xs font-semibold text-[var(--ink)]">Ninguna transacción coincide</p>
 <p className="text-[10px] text-[var(--ink-2)]">Ajusta los filtros o añade nuevos pagos para ver el registro aquí.</p>
 </div>
 </div>
 ) : (
 filteredPayments.map(p => (
 <div
 key={p.id}
 className={`p-3 rounded-[var(--r-m)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
 'bg-[var(--surface)] hover:-neutral-300'
 }`}
 >
 <div className="flex gap-3 items-center min-w-0">
 <div className={`p-2 rounded-[var(--r-s)] shrink-0 ${
 p.tipo ==='ingreso'
 ?'bg-[var(--surface)]/15 text-[var(--ok)] -emerald-500/20'
 :'bg-[var(--alert)]/15 text-[var(--alert)] -rose-500/20'
 }`}>
 <DollarSign className="w-4 h-4" />
 </div>
 <div className="min-w-0">
 <div className="flex items-center gap-2">
 <h4 className={`text-xs font-bold font-display truncate ${textTitle}`}>{p.concepto}</h4>
 <span className={`text-[8px] px-1.5 py-0.5 rounded font-sans tracking-wider ${
 'bg-[var(--sunken)] text-[var(--ink-2)]'
 }`}>
 {p.categoria}
 </span>
 </div>
 <div className={`flex gap-3 text-[10px] font-sans mt-1 ${textSub}`}>
 <span className="flex items-center gap-1"><Calendar className="w-3 h-3 shrink-0" /> {p.fecha}</span>
 </div>
 </div>
 </div>

 <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 sm: pt-2 sm:pt-0">
 {/* Amount */}
 <span className={`text-sm font-black font-sans tracking-tight ${
 p.tipo ==='ingreso' ?'text-[var(--ok)]' :'text-[var(--alert)]'
 }`}>
 {p.tipo ==='ingreso' ?'+' :'-'}{p.importe.toLocaleString('es-ES')}€
 </span>

 {/* Status checkbox toggle */}
 <button
 onClick={() => handleToggleEstado(p)}
 className={`px-2.5 py-1 text-[9px] font-sans rounded font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
 p.estado ==='pagado'
 ? 'bg-[var(--ok)]/10 text-[var(--ok)]'
 :' bg-[var(--acc)]/10 -amber-0/20 text-[var(--acc)] hover:bg-[var(--acc)]/15'
 }`}
 title="Hacer clic para cambiar el estado de pago"
 >
 {p.estado ==='pagado' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
 {p.estado.toUpperCase()}
 </button>
 </div>
 </div>
 ))
 )}
 </div>
 </div>

 {/* Quick Stats sidebar panel */}
 <div className="space-y-4">
 <div className={`p-4 rounded-[var(--r-m)] ${colors.card} ${cardBorder} space-y-4`}>
 <h3 className={`text-xs font-sans font-bold tracking-wider ${textTitle}`}>Resumen Contable</h3>
 <div className="space-y-3 font-sans text-[11px]">
 <div className="flex justify-between pb-2 -dashed">
 <span className={textSub}>Operaciones Registradas</span>
 <span className={`${textTitle} font-bold`}>{payments.length}</span>
 </div>
 <div className="flex justify-between pb-2 -dashed">
 <span className={textSub}>Pendiente de Cobro</span>
 <span className="text-[var(--ok)] font-bold">+{totalPendienteIngresos.toLocaleString('es-ES')}€</span>
 </div>
 <div className="flex justify-between pb-2 -dashed">
 <span className={textSub}>Pendiente de Pago</span>
 <span className="text-[var(--alert)] font-bold">-{totalPendienteGastos.toLocaleString('es-ES')}€</span>
 </div>
 <div className="flex justify-between font-bold text-xs pt-1">
 <span className={textTitle}>Faltas Pendientes Neto</span>
 <span className={totalPendienteIngresos - totalPendienteGastos >= 0 ?'text-[var(--ok)]' :'text-[var(--alert)]'}>
 {(totalPendienteIngresos - totalPendienteGastos).toLocaleString('es-ES')}€
 </span>
 </div>
 </div>
 </div>

 <div className={`p-4 rounded-[var(--r-m)] ${colors.card} ${cardBorder} text-xs leading-relaxed space-y-2`}>
 <div className={`flex items-center gap-1.5 ${'text-[var(--acc)]'}`}>
 <FileText className="w-4 h-4" />
 <strong className="font-sans tracking-wider">Libro en Excel</strong>
 </div>
 <p className={textSub}>
 Cualquier cambio que realices desde este panel de control se guardará automáticamente en Supabase.
 </p>
 <p className={textSub}>
 Los agentes inteligentes de BandManager leen este libro diario para optimizar ofertas de caché en salas o calcular presupuestos de giras de forma automatizada.
 </p>
 </div>
 </div>
 </div>
 ) : (
 /* Analytics of Expenses by Categories */
 <div className={`p-5 rounded-[var(--r-m)] ${colors.card} ${cardBorder} space-y-6`}>
 <div>
 <h3 className={`text-sm font-bold font-display tracking-widest ${'text-[var(--acc)]'}`}>Análisis de Gastos por Categoría</h3>
 <p className={`text-[10px] font-sans mt-0.5 ${textSub}`}>Proporciones totales liquidadas para cada categoría de costes operativos del proyecto</p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
 {/* Custom SVG/HTML Bar Proportions Chart */}
 <div className="space-y-3.5">
 {[
 { cat:'concierto', color:'bg-[var(--tentative)]' },
 { cat:'transporte', color:'bg-[var(--acc)]' },
 { cat:'alojamiento', color:'bg-[var(--acc)]' },
 { cat:'comida', color:'bg-[var(--ok)]' },
 { cat:'promo', color:'bg-[var(--alert)]' },
 { cat:'merchandising', color:'bg-[var(--acc)]' },
 { cat:'otros', color:'bg-[var(--bg)]0' }
 ].map(item => {
 const totalInCat = payments
 .filter(p => p.categoria === item.cat && p.estado ==='pagado')
 .reduce((sum, p) => sum + p.importe, 0);
 
 const percent = totalGastos > 0 ? (totalInCat / totalGastos) * 100 : 0;

 return (
 <div key={item.cat} className="space-y-1">
 <div className="flex justify-between text-[11px] font-sans">
 <span className={`uppercase font-bold ${textTitle}`}>{item.cat}</span>
 <span className={`${textSub}`}>{totalInCat.toLocaleString('es-ES')}€ ({percent.toFixed(1)}%)</span>
 </div>
 <div className={`w-full h-2 rounded-full ${'bg-[var(--surface)]'}`}>
 <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${Math.max(percent, totalInCat > 0 ? 3 : 0)}%` }} />
 </div>
 </div>
 );
 })}
 </div>

 <div className="space-y-4">
 <div className={`p-4 rounded-[var(--r-m)] ${'bg-[var(--bg)]'} space-y-3 text-xs leading-relaxed`}>
 <h4 className={`font-sans font-bold tracking-wider ${textTitle}`}>Auditoría Operativa</h4>
 <div className="space-y-2 text-[11px] font-sans text-[var(--ink-2)]">
 <div className="flex justify-between">
 <span>Gasto en Viajes (Transporte/Hotel):</span>
 <span className={`${textTitle}`}>
 {(payments
 .filter(p => (p.categoria ==='transporte' || p.categoria ==='alojamiento') && p.estado ==='pagado')
 .reduce((sum, p) => sum + p.importe, 0)).toLocaleString('es-ES')}€
 </span>
 </div>
 <div className="flex justify-between">
 <span>Inversión en Promo:</span>
 <span className={`${textTitle}`}>
 {(payments.filter(p => p.categoria ==='promo' && p.estado ==='pagado').reduce((sum, p) => sum + p.importe, 0)).toLocaleString('es-ES')}€
 </span>
 </div>
 <div className="flex justify-between">
 <span>Ingresos de Conciertos:</span>
 <span className="text-[var(--ok)] font-bold">
 {(payments.filter(p => p.categoria ==='concierto' && p.tipo ==='ingreso' && p.estado ==='pagado').reduce((sum, p) => sum + p.importe, 0)).toLocaleString('es-ES')}€
 </span>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Modal: Registrar Nueva Operación */}
 <AddTransactionModal
 isOpen={isAddOpen}
 colors={colors}
 onClose={() => setIsAddOpen(false)}
 onAddPayment={onAddPayment}
 />
 </div>
 );
}
