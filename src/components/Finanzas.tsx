import React, { useState, useMemo } from "react";
import {
  ThemeColors,
  Payment,
  Concert,
  ConcertExpenseBreakdown,
} from "../types";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Filter,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Calendar,
  FileText,
  Check,
  ArrowRight,
  Calculator,
  Edit3,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { PublicoSilhouette } from "./ui/PublicoSilhouette";
import { FinanceSummaryCards } from "./finanzas/FinanceSummaryCards";
import { AddTransactionModal } from "./finanzas/AddTransactionModal";
import { calculateFinancialSummary } from "../utils/financeUtils";
import { ShowIcon } from './ui/ShowIcon';
import { Button, Input, Select, Textarea } from './ui';

import { formatEur } from '../utils/formatMoney';
import { Tabs } from "./ui/Tabs";
interface FinanzasProps {
  colors: ThemeColors;
  payments: Payment[];
  concerts?: Concert[];
  onAddPayment: (payment: Payment) => Promise<void>;
  onUpdatePayment: (
    id: string,
    updatedFields: Partial<Payment>,
  ) => Promise<void>;
  onUpdateConcert?: (
    id: string,
    updatedFields: Partial<Concert>,
  ) => Promise<void>;
  tours?: any[];
  bandUsers?: any[];
}

export default function Finanzas({
  colors,
  payments = [],
  concerts = [],
  onAddPayment,
  onUpdatePayment,
  onUpdateConcert,
}: FinanzasProps) {
  // Tabs:'analytics','ledger','rentabilidad'
  const [activeTab, setActiveTab] = useState<
    "analytics" | "ledger" | "rentabilidad"
  >("rentabilidad");

  // Edit concert expenses state
  const [editingConcertId, setEditingConcertId] = useState<string | null>(null);
  const [editingGasolina, setEditingGasolina] = useState<string>("0");
  const [editingDietas, setEditingDietas] = useState<string>("0");
  const [editingAlquiler, setEditingAlquiler] = useState<string>("0");
  const [editingAlojamiento, setEditingAlojamiento] = useState<string>("0");
  const [editingOtros, setEditingOtros] = useState<string>("0");
  const [editingNotasGastos, setEditingNotasGastos] = useState<string>("");

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"todos" | "ingreso" | "gasto">(
    "todos",
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("todos");
  const [statusFilter, setStatusFilter] = useState<
    "todos" | "pendiente" | "pagado"
  >("todos");

  // Form State for Add Transaction
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [tipo, setTipo] = useState<"ingreso" | "gasto">("ingreso");
  const [categoria, setCategoria] = useState<
    | "concierto"
    | "merchandising"
    | "subvencion"
    | "transporte"
    | "alojamiento"
    | "comida"
    | "promo"
    | "otros"
  >("concierto");
  const [concepto, setConcepto] = useState("");
  const [importe, setImporte] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [estado, setEstado] = useState<"pendiente" | "pagado">("pagado");

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState("");
  const [syncError, setSyncError] = useState("");

  const handleSyncFinanzas = async () => {
    setIsSyncing(true);
    setSyncSuccess("");
    setSyncError("");
    try {
      const res = await fetch("/api/payments/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncSuccess(data.message || "Finanzas sincronizadas con éxito.");
        setTimeout(() => setSyncSuccess(""), 6000);
      } else {
        setSyncError(
          data.error || "Error al intentar sincronizar las finanzas.",
        );
      }
    } catch (error) {
      console.error("Error synchronizing finances:", error);
      setSyncError("Error de conexión con el servidor.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concepto || !importe) return;

    const newPayment: Payment = {
      id: "pay-" + Date.now(),
      tipo,
      categoria,
      concepto,
      importe: parseFloat(importe) || 0,
      fecha,
      estado,
    };

    await onAddPayment(newPayment);
    setIsAddOpen(false);

    // Reset form
    setConcepto("");
    setImporte("");
    setFecha(new Date().toISOString().split("T")[0]);
    setEstado("pagado");
  };

  const handleToggleEstado = async (payment: Payment) => {
    const nuevoEstado = payment.estado === "pendiente" ? "pagado" : "pendiente";
    await onUpdatePayment(payment.id, { estado: nuevoEstado });
  };

  // Calculations
  const financialSummary = useMemo(
    () => calculateFinancialSummary(payments),
    [payments],
  );
  const totalIngresos = financialSummary.totalIngresos;
  const totalGastos = financialSummary.totalGastos;
  const balanceNeto = financialSummary.beneficioNeto;
  const totalPendienteIngresos = financialSummary.pagosPendientesIngreso;
  const totalPendienteGastos = financialSummary.pagosPendientesGasto;

  // Filter Payments
  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "todos" || p.tipo === typeFilter;
    const matchesCategory =
      categoryFilter === "todos" || p.categoria === categoryFilter;
    const matchesStatus = statusFilter === "todos" || p.estado === statusFilter;
    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });

  const categories = Array.from(new Set(payments.map((p) => p.categoria)));

  const isLightTheme =
    (typeof document !== "undefined" &&
      document.documentElement.dataset.theme === "light") ||
    colors.name?.toLowerCase().includes("light") ||
    colors.bg.includes("f8fafc") ||
    colors.bg.includes("white") ||
    colors.bg.includes("neutral-50") ||
    false;
  const textTitle = "text-[var(--ink)]";
  const textSub = "text-[var(--ink-2)]";
  const textMuted = "text-[var(--ink-2)]";
  const cardBorder = "";

  return (
    <div
      data-modulo="finanzas"
      className={`space-y-6 ${"text-[var(--ink)]"} font-sans w-full max-w-full overflow-x-hidden`}
    >
      {/* Header con Sincronización en Excel */}
      <div
        className={`flex justify-between items-start md:items-center pb-4 mb-2 gap-4 ${""}`}
      >
        <div>
          <h4
            className={`text-xs font-sans ${"text-[var(--acc)]"}`}
          >
            Finanzas y libro contable
          </h4>
          <h2 className="page-title mt-1">Contabilidad de la banda</h2>
        </div>
        <div className="flex gap-2.5 items-center flex-wrap">
          <Button
            id="sync-finanzas-excel-btn"
            variant="neutral"
            size="xs"
            onClick={handleSyncFinanzas}
            disabled={isSyncing}
            className="items-center gap-1.5"
            title="Sincronizar todas las transacciones financieras"
          >
            <RefreshCw
              className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`}
            />
            <span>{isSyncing ? "Sincronizando..." : "Actualizar en Excel"}</span>
          </Button>

          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-micro font-sans font-bold ${"bg-[var(--ok)]/10  text-[var(--ok)]"}`}
          >
            <span className="w-1.5 h-1.5 rounded-[var(--r-pill)] bg-[var(--ok)] shrink-0" />{" "}
            Auto-sync
          </span>
        </div>
      </div>

      {/* Notificaciones de Sincronización */}
      {syncSuccess && (
        <div
          className={`p-2 px-3 rounded-[var(--r-s)] text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-250 ${"bg-[var(--ok)]/10 text-[var(--ok)]"}`}
        >
          <CheckCircle2 className="w-4 h-4 text-[var(--ok)] shrink-0" />
          <span className="flex-1 font-sans text-micro">{syncSuccess}</span>
          <button
            onClick={() => setSyncSuccess("")}
            className="text-micro hover:opacity-80 font-bold px-1 font-sans"
          >
            ×
          </button>
        </div>
      )}
      {syncError && (
        <div
          className={`p-2 px-3 rounded-[var(--r-s)] text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-250 ${"bg-[var(--alert)]/10 text-[var(--alert)]"}`}
        >
          <AlertCircle className="w-4 h-4 text-[var(--alert)] shrink-0" />
          <span className="flex-1 font-sans text-micro">{syncError}</span>
          <button
            onClick={() => setSyncError("")}
            className="text-micro hover:opacity-80 font-bold px-1 font-sans"
          >
            ×
          </button>
        </div>
      )}

      {/* KPI Cards (Financial Overview) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total revenue */}
        <div
          className={`${colors.card} p-5 space-y-1.5 relative overflow-hidden`}
        >
          <div className="flex justify-between items-center text-xs font-sans font-semibold text-[var(--ink-2)]">
            <span>Ingresos cobrados</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <h3
            className={`text-2xl font-bold font-display tabular-nums tracking-tight ${textTitle}`}
          >
            {formatEur(totalIngresos, { signed: true })}
          </h3>
          <p className={`text-micro font-sans ${textSub}`}>
            {totalPendienteIngresos > 0
              ? `${formatEur(totalPendienteIngresos)} pendientes de cobro`
              : "Al día"}
          </p>
        </div>

        {/* Total expenses */}
        <div
          className={`${colors.card} p-5 space-y-1.5 relative overflow-hidden`}
        >
          <div className="flex justify-between items-center text-xs font-sans font-semibold text-[var(--ink-2)]">
            <span>Gastos liquidados</span>
            <TrendingDown className="w-4 h-4" />
          </div>
          <h3
            className={`text-2xl font-bold font-display tabular-nums tracking-tight ${textTitle}`}
          >
            {formatEur(-totalGastos)}
          </h3>
          <p className={`text-micro font-sans ${textSub}`}>
            {totalPendienteGastos > 0
              ? `${formatEur(totalPendienteGastos)} pendientes de pago`
              : "Al día"}
          </p>
        </div>

        {/* Net balance */}
        <div
          className={`${colors.card} p-5 space-y-1.5 relative overflow-hidden ${
            balanceNeto >= 0 ? "" : ""
          }`}
        >
          <div
            className="flex justify-between items-center text-xs font-sans font-semibold text-[var(--ink-2)]"
          >
            <span>Balance de caja neto</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <h3
            className={`text-2xl font-bold font-display tabular-nums tracking-tight ${textTitle}`}
          >
            {formatEur(balanceNeto, { signed: true })}
          </h3>
          <p className={`text-micro font-sans ${textSub}`}>
            Caja total real cobrada menos gastos pagados
          </p>
        </div>
      </div>

      {/* Tabs / Filter Bar */}
      <div
        className={`flex flex-col md:flex-row md:items-center justify-between pb-4 mb-2 gap-4 ${""}`}
      >
        <Tabs<typeof activeTab>
          aria-label="Vistas de finanzas"
          value={activeTab}
          onChange={setActiveTab}
          items={[
            { id: "rentabilidad", icon: Calculator, label: "Rentabilidad por bolo" },
            { id: "ledger", label: "Libro diario" },
            { id: "analytics", label: "Costes por categoría" },
          ]}
        />

        <Button
          variant="primary"
          size="xs"
          onClick={() => setIsAddOpen(true)}
          className="items-center gap-1.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Registrar operación</span>
        </Button>
      </div>

      {/* Active Tab View */}
      {activeTab === "rentabilidad" && (
        <div className="space-y-6">
          {/* Summary KPI cards for Concert Profitability */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(() => {
              const totalConcertCache = concerts.reduce(
                (acc, c) => acc + (c.cache || 0),
                0,
              );
              const totalConcertGastos = concerts.reduce((acc, c) => {
                const g = c.gastosDetalle;
                const sum = g
                  ? (g.gasolina || 0) +
                    (g.dietas || 0) +
                    (g.alquilerVehiculo || 0) +
                    (g.alojamiento || 0) +
                    (g.otros || 0)
                  : 0;
                return acc + (sum || c.gastosEstimadosTipicos || 150);
              }, 0);
              const totalBeneficioNeto = totalConcertCache - totalConcertGastos;
              const mediaBeneficio =
                concerts.length > 0 ? totalBeneficioNeto / concerts.length : 0;

              return (
                <>
                  <div
                    className={`${colors.card} p-4 rounded-[var(--r-m)] space-y-1`}
                  >
                    <span className="text-micro font-sans text-[var(--ink-2)] font-bold">
                      Total caché contratado
                    </span>
                    <h4 className="text-xl font-bold text-[var(--ink)] tabular-nums">
                      {formatEur(totalConcertCache)}
                    </h4>
                    <p className="text-micro text-[var(--ink-2)]">
                      {concerts.length} conciertos en catálogo
                    </p>
                  </div>

                  <div
                    className={`${colors.card} p-4 rounded-[var(--r-m)] space-y-1`}
                  >
                    <span className="text-micro font-sans text-[var(--ink-2)] font-bold">
                      Total gastos Gira
                    </span>
                    <h4 className="text-xl font-bold text-[var(--ink)] tabular-nums">
                      {formatEur(-totalConcertGastos)}
                    </h4>
                    <p className="text-micro text-[var(--ink-2)]">
                      Gasolina, dietas, furgoneta, hoteles
                    </p>
                  </div>

                  <div
                    className={`${colors.card} p-4 rounded-[var(--r-m)] space-y-1`}
                  >
                    <span className="text-micro font-sans text-[var(--ink-2)] font-bold">
                      Beneficio neto acumulado
                    </span>
                    <h4
                      className={`text-xl font-bold text-[var(--ink)] tabular-nums`}
                    >
                      {totalBeneficioNeto >= 0
                        ? formatEur(totalBeneficioNeto, { signed: true })
                        : formatEur(totalBeneficioNeto)}
                    </h4>
                    <p className="text-micro text-[var(--ink-2)]">
                      Beneficio tras cubrir gastos de gira
                    </p>
                  </div>

                  <div
                    className={`${colors.card} p-4 rounded-[var(--r-m)] space-y-1`}
                  >
                    <span className="text-micro font-sans text-[var(--ink-2)] font-bold">
                      Beneficio medio / bolo
                    </span>
                    <h4 className="text-xl font-bold text-[var(--ink)] tabular-nums">
                      {mediaBeneficio >= 0
                        ? formatEur(Math.round(mediaBeneficio), { signed: true })
                        : formatEur(Math.round(mediaBeneficio))}
                    </h4>
                    <p className="text-micro text-[var(--ink-2)]">
                      Rentabilidad media por actuación
                    </p>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Concert Profitability Table */}
          <div className={`${colors.card} p-5 rounded-[var(--r-m)] space-y-4`}>
            <div className="flex items-center justify-between  pb-3">
              <h3 className="text-sm font-bold text-[var(--acc)] flex items-center gap-2">
                <Calculator className="w-4 h-4" /> Desglose de gastos y
                rentabilidad por bolo
              </h3>
              <span className="text-xs text-[var(--ink-2)]">
                Haz clic en “Gastos” para desglosar peajes, gasolina, hotel y
                dietas.
              </span>
            </div>

            {concerts.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <PublicoSilhouette
                  opacity={0.12}
                  size="medium"
                  className="mx-auto"
                />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[var(--ink)]">
                    Sin conciertos registrados
                  </p>
                  <p className="text-micro text-[var(--ink-2)]">
                    Agenda tus primeros bolos para empezar a calcular
                    rentabilidad y gastos.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto shrink-0">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--surface)]/80 text-[var(--acc)] font-bold font-sans text-micro">
                    <tr>
                      <th className="p-3">Fecha y bolo</th>
                      <th className="p-3">Ciudad / sala</th>
                      <th className="p-3">Caché (€)</th>
                      <th className="p-3">Desglose de gastos (€)</th>
                      <th className="p-3">Gastos totales</th>
                      <th className="p-3">Beneficio neto</th>
                      <th className="p-3 text-center">Estado rentabilidad</th>
                      <th className="p-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--hair)]">
                    {concerts.map((c) => {
                      const g = c.gastosDetalle || {};
                      const gasolina = g.gasolina || 0;
                      const dietas = g.dietas || 0;
                      const alquiler = g.alquilerVehiculo || 0;
                      const alojamiento = g.alojamiento || 0;
                      const otros = g.otros || 0;

                      const hasCustomGastos = !!c.gastosDetalle;
                      const totalGastosBolo = hasCustomGastos
                        ? gasolina + dietas + alquiler + alojamiento + otros
                        : c.gastosEstimadosTipicos || 150;

                      const beneficioNeto = (c.cache || 0) - totalGastosBolo;
                      const margenPct =
                        c.cache > 0
                          ? Math.round((beneficioNeto / c.cache) * 100)
                          : 0;
                      const numConvocados =
                        c.convocatoria_tipo === "parcial" &&
                        c.convocados_ids &&
                        c.convocados_ids.length > 0
                          ? c.convocados_ids.length
                          : c.convocados_nombres &&
                              c.convocados_nombres.length > 0
                            ? c.convocados_nombres.length
                            : 5;
                      const netoPorMusico = Math.round(
                        beneficioNeto / (numConvocados || 1),
                      );

                      let alertBadge = {
                        label: "Rentable",
                        bgColor: "bg-[var(--ok-soft)]/40 text-[var(--ok)]",
                      };

                      if (beneficioNeto < 0) {
                        alertBadge = {
                          label: "En pérdidas",
                          bgColor:
                            "bg-[var(--alert-soft)]/50 text-[var(--alert)]",
                        };
                      } else if (beneficioNeto < 150) {
                        alertBadge = {
                          label: "Ajustado",
                          bgColor: "bg-[var(--acc-soft)]  text-[var(--acc-ink)]",
                        };
                      }

                      return (
                        <tr
                          key={c.id}
                          className="hover:bg-[var(--surface)]/30 transition"
                        >
                          <td className="p-3 font-sans text-[var(--ink-2)]">
                            <span className="font-bold text-[var(--ink)] block">
                              {c.fecha}
                            </span>
                            <span className="text-micro text-[var(--ink-2)] capitalize">
                              {c.tipo}
                            </span>
                            {c.giraNombre && (
                              <span className="text-micro px-1.5 py-0.2 rounded bg-[var(--acc)]/20 text-[var(--ink)] font-sans">
                                <ShowIcon inline emoji="🚐" />{c.giraNombre}
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-[var(--ink)] block">
                              {c.sala}
                            </span>
                            <span className="text-micro text-[var(--ink-2)]">
                              {c.ciudad}
                            </span>
                            {c.convocatoria_tipo === "parcial" ? (
                              <span
                                className="inline-block mt-0.5 text-micro text-[var(--tentative)] bg-[var(--tentative)]/10 px-1.5 py-0.2 rounded font-sans"
                                title={c.convocados_nombres?.join(",")}
                              >
                                <ShowIcon inline emoji="👤" />Parcial ({numConvocados} miembros)
                              </span>
                            ) : (
                              <span className="inline-block mt-0.5 text-micro text-[var(--ok)]/80 font-sans">
                                <ShowIcon inline emoji="👥" />Banda completa
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-sans font-bold text-[var(--ink)] tabular-nums text-sm">
                            {formatEur(c.cache || 0)}
                          </td>
                          <td className="p-3 text-xs text-[var(--ink-2)]">
                            {hasCustomGastos ? (
                              <div className="space-y-0.5">
                                <div>
                                  Gasolina:{" "}
                                  <span className="font-sans text-[var(--ink-2)]">
                                    {formatEur(gasolina)}
                                  </span>{" "}
                                  | Dietas:{" "}
                                  <span className="font-sans text-[var(--ink-2)]">
                                    {formatEur(dietas)}
                                  </span>
                                </div>
                                <div>
                                  Furgoneta:{" "}
                                  <span className="font-sans text-[var(--ink-2)]">
                                    {formatEur(alquiler)}
                                  </span>{" "}
                                  | Hotel:{" "}
                                  <span className="font-sans text-[var(--ink-2)]">
                                    {formatEur(alojamiento)}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-[var(--ink-2)] italic">
                                Estimación típica (~150€)
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-sans text-[var(--ink)] tabular-nums font-semibold">
                            {formatEur(-totalGastosBolo)}
                          </td>
                          <td className="p-3 font-sans font-bold text-sm">
                            <span
                              className={
                                beneficioNeto >= 0
                                  ? "text-[var(--ink)]"
                                  : "text-[var(--ink)]"
                              }
                            >
                              {beneficioNeto >= 0
                                ? formatEur(beneficioNeto, { signed: true })
                                : formatEur(beneficioNeto)}
                            </span>
                            <span className="block text-micro text-[var(--ink-2)] font-normal">
                              Margen: {margenPct}%
                            </span>
                            <span className="block text-micro text-[var(--tentative)]/80 font-normal">
                              Reparto:{" "}
                              {netoPorMusico >= 0
                                ? "+" + netoPorMusico
                                : netoPorMusico}
                              €/músico
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-[var(--r-pill)] text-micro font-bold ${alertBadge.bgColor}`}
                            >
                              {alertBadge.label}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                setEditingConcertId(c.id);
                                setEditingGasolina(
                                  String(c.gastosDetalle?.gasolina || 0),
                                );
                                setEditingDietas(
                                  String(c.gastosDetalle?.dietas || 0),
                                );
                                setEditingAlquiler(
                                  String(
                                    c.gastosDetalle?.alquilerVehiculo || 0,
                                  ),
                                );
                                setEditingAlojamiento(
                                  String(c.gastosDetalle?.alojamiento || 0),
                                );
                                setEditingOtros(
                                  String(c.gastosDetalle?.otros || 0),
                                );
                                setEditingNotasGastos(
                                  c.gastosDetalle?.notasGastos || "",
                                );
                              }}
                              className="px-2.5 py-1 bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--acc)]/70 font-semibold rounded-[var(--r-pill)] text-xs flex items-center gap-1 ml-auto transition cursor-pointer"
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
                    <Calculator className="w-5 h-5 text-[var(--acc)]" />{" "}
                    Desglose real de gastos de bolo
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
                      <label className="text-[var(--ink-2)] font-semibold">
                        Gasolina y peajes (€)
                      </label>
                      <Input aria-label="Gasolina y peajes (€)"
                        type="number"
                        value={editingGasolina}
                        onChange={(e) => setEditingGasolina(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-[var(--ink-2)] font-semibold">
                        Dietas / Comidas (€)
                      </label>
                      <Input aria-label="Dietas / Comidas (€)"
                        type="number"
                        value={editingDietas}
                        onChange={(e) => setEditingDietas(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[var(--ink-2)] font-semibold">
                        Alquiler furgoneta / backline (€)
                      </label>
                      <Input aria-label="Alquiler furgoneta / backline (€)"
                        type="number"
                        value={editingAlquiler}
                        onChange={(e) => setEditingAlquiler(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-[var(--ink-2)] font-semibold">
                        Alojamiento / hoteles (€)
                      </label>
                      <Input aria-label="Alojamiento / hoteles (€)"
                        type="number"
                        value={editingAlojamiento}
                        onChange={(e) => setEditingAlojamiento(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[var(--ink-2)] font-semibold">
                      Otros gastos extra (€)
                    </label>
                    <Input aria-label="Otros gastos extra (€)"
                      type="number"
                      value={editingOtros}
                      onChange={(e) => setEditingOtros(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-[var(--ink-2)] font-semibold">
                      Notas sobre gastos
                    </label>
                    <Textarea
                      rows={2}
                      value={editingNotasGastos}
                      onChange={(e) => setEditingNotasGastos(e.target.value)}
                      placeholder="Detalles de facturas, tickets guardados…"
                      className="w-full"
                    />
                  </div>

                  {/* Total calculation preview */}
                  <div className="p-3 bg-[var(--sunken)] rounded-[var(--r-m)] flex items-center justify-between font-sans">
                    <span className="text-[var(--ink-2)] font-bold">
                      TOTAL GASTOS CALCULADOS:
                    </span>
                    <span className="text-[var(--alert)] font-bold text-sm">
                      -
                      {(Number(editingGasolina) || 0) +
                        (Number(editingDietas) || 0) +
                        (Number(editingAlquiler) || 0) +
                        (Number(editingAlojamiento) || 0) +
                        (Number(editingOtros) || 0)}
                      €
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button
                    variant="neutral"
                    size="sm"
                    onClick={() => setEditingConcertId(null)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={async () => {
                      if (editingConcertId && onUpdateConcert) {
                        const breakdown: ConcertExpenseBreakdown = {
                          gasolina: Number(editingGasolina) || 0,
                          dietas: Number(editingDietas) || 0,
                          alquilerVehiculo: Number(editingAlquiler) || 0,
                          alojamiento: Number(editingAlojamiento) || 0,
                          otros: Number(editingOtros) || 0,
                          notasGastos: editingNotasGastos,
                        };
                        await onUpdateConcert(editingConcertId, {
                          gastosDetalle: breakdown,
                        });
                      }
                      setEditingConcertId(null);
                    }}
                  >
                    Guardar gastos
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Tab View */}
      {activeTab === "ledger" ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Main Ledger List */}
          <div className="lg:col-span-3 space-y-4">
            {/* Ledger Filters */}
            <div
              className={`p-4 rounded-[var(--r-m)] flex flex-col md:flex-row gap-3 ${colors.card} ${cardBorder}`}
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--ink-2)] pointer-events-none" />
                <Input
                  size="sm"
                  id="finanzas-search"
                  type="text"
                  placeholder="Buscar transacciones por concepto…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-9 ${searchTerm ? "pr-8" : "pr-3"}`}
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="xs"
                    id="finanzas-search-clear"
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-2"
                    title="Borrar búsqueda"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>

              <div className="flex gap-2 flex-wrap md:flex-nowrap">
                {/* Type filter */}
                <Select
                  size="sm"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                >
                  <option value="todos">Tipo: Todos</option>
                  <option value="ingreso">Ingreso (+)</option>
                  <option value="gasto">Gasto (-)</option>
                </Select>

                {/* Category filter */}
                <Select
                  size="sm"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="todos">Categoría: Todas</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.toUpperCase()}
                    </option>
                  ))}
                </Select>

                {/* Status filter */}
                <Select
                  size="sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <option value="todos">Estado: Todos</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="pagado">Pagado</option>
                </Select>
              </div>
            </div>

            {/* Ledger Transactions Grid */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredPayments.length === 0 ? (
                <div className="text-center py-12 rounded-[var(--r-m)] space-y-3">
                  <PublicoSilhouette
                    opacity={0.12}
                    size="medium"
                    className="mx-auto"
                  />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[var(--ink)]">
                      Ninguna transacción coincide
                    </p>
                    <p className="text-micro text-[var(--ink-2)]">
                      Ajusta los filtros o añade nuevos pagos para ver el
                      registro aquí.
                    </p>
                  </div>
                </div>
              ) : (
                filteredPayments.map((p) => (
                  <div
                    key={p.id}
                    className={`p-3 rounded-[var(--r-m)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-ui ${"bg-[var(--surface)] hover:bg-[var(--sunken)]"}`}
                  >
                    <div className="flex gap-3 items-center min-w-0">
                      <div
                        className={`p-2 rounded-[var(--r-s)] shrink-0 ${
                          p.tipo === "ingreso"
                            ? "bg-[var(--surface)]/15 text-[var(--ok)] "
                            : "bg-[var(--alert)]/15 text-[var(--ink)] "
                        }`}
                      >
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-xs font-bold font-display truncate ${textTitle}`}
                          >
                            {p.concepto}
                          </h4>
                          <span
                            className={`text-micro px-1.5 py-0.5 rounded font-sans ${"bg-[var(--sunken)] text-[var(--ink-2)]"}`}
                          >
                            {p.categoria}
                          </span>
                        </div>
                        <div
                          className={`flex gap-3 text-micro font-sans mt-1 ${textSub}`}
                        >
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 shrink-0" /> {p.fecha}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 sm: pt-2 sm:pt-0">
                      {/* Amount */}
                      <span
                        className={`text-sm font-bold font-sans tracking-tight ${
                          p.tipo === "ingreso"
                            ? "text-[var(--ink)]"
                            : "text-[var(--ink)]"
                        }`}
                      >
                        {p.tipo === "ingreso" ? "+" : "-"}
                        {formatEur(p.importe)}
                      </span>

                      {/* Status checkbox toggle */}
                      <button
                        onClick={() => handleToggleEstado(p)}
                        className={`px-2.5 py-1 text-micro font-sans rounded font-bold transition-ui flex items-center gap-1 cursor-pointer active:scale-[0.97] ${
                          p.estado === "pagado"
                            ? "bg-[var(--ok)]/10 text-[var(--ok)]"
                            : "bg-[var(--acc)]/10 text-[var(--acc-ink)] hover:bg-[var(--acc)]/15"
                        }`}
                        title="Hacer clic para cambiar el estado de pago"
                      >
                        {p.estado === "pagado" ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
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
            <div
              className={`p-4 rounded-[var(--r-m)] ${colors.card} ${cardBorder} space-y-4`}
            >
              <h3
                className={`text-xs font-sans font-bold ${textTitle}`}
              >
                Resumen Contable
              </h3>
              <div className="space-y-3 font-sans text-xs">
                <div className="flex justify-between pb-2 -dashed">
                  <span className={textSub}>Operaciones registradas</span>
                  <span className={`${textTitle} font-bold`}>
                    {payments.length}
                  </span>
                </div>
                <div className="flex justify-between pb-2 -dashed">
                  <span className={textSub}>Pendiente de cobro</span>
                  <span className="text-[var(--ink)] font-bold tabular-nums">
                    {formatEur(totalPendienteIngresos, { signed: true })}
                  </span>
                </div>
                <div className="flex justify-between pb-2 -dashed">
                  <span className={textSub}>Pendiente de pago</span>
                  <span className="text-[var(--ink)] font-bold tabular-nums">
                    {formatEur(-totalPendienteGastos)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-xs pt-1">
                  <span className={textTitle}>Faltas pendientes neto</span>
                  <span
                    className={
                      totalPendienteIngresos - totalPendienteGastos >= 0
                        ? "text-[var(--ink)]"
                        : "text-[var(--ink)]"
                    }
                  >
                    {(
                      totalPendienteIngresos - totalPendienteGastos
                    ).toLocaleString("es-ES")}
                    €
                  </span>
                </div>
              </div>
            </div>

            <div
              className={`p-4 rounded-[var(--r-m)] ${colors.card} ${cardBorder} text-xs leading-relaxed space-y-2`}
            >
              <div
                className={`flex items-center gap-1.5 ${"text-[var(--acc)]"}`}
              >
                <FileText className="w-4 h-4" />
                <strong className="font-sans">
                  Libro en Excel
                </strong>
              </div>
              <p className={textSub}>
                Cualquier cambio que realices desde este panel de control se
                guardará automáticamente en Supabase.
              </p>
              <p className={textSub}>
                Los agentes inteligentes de BandManager leen este libro diario
                para optimizar ofertas de caché en salas o calcular presupuestos
                de giras de forma automatizada.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Analytics of Expenses by Categories */
        <div
          className={`p-5 rounded-[var(--r-m)] ${colors.card} ${cardBorder} space-y-6`}
        >
          <div>
            <h3
              className={`text-sm font-bold font-display ${"text-[var(--acc)]"}`}
            >
              Análisis de gastos por categoría
            </h3>
            <p className={`text-micro font-sans mt-0.5 ${textSub}`}>
              Proporciones totales liquidadas para cada categoría de costes
              operativos del proyecto
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Custom SVG/HTML Bar Proportions Chart */}
            <div className="space-y-3.5">
              {[
                { cat: "concierto", color: "bg-[var(--tentative)]" },
                { cat: "transporte", color: "bg-[var(--acc)]" },
                { cat: "alojamiento", color: "bg-[var(--acc)]" },
                { cat: "comida", color: "bg-[var(--ok)]" },
                { cat: "promo", color: "bg-[var(--acc)]" },
                { cat: "merchandising", color: "bg-[var(--acc)]" },
                { cat: "otros", color: "bg-[var(--ink-2)]" },
              ].map((item) => {
                const totalInCat = payments
                  .filter(
                    (p) => p.categoria === item.cat && p.estado === "pagado",
                  )
                  .reduce((sum, p) => sum + p.importe, 0);

                const percent =
                  totalGastos > 0 ? (totalInCat / totalGastos) * 100 : 0;

                return (
                  <div key={item.cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-sans">
                      <span className={` font-bold ${textTitle}`}>
                        {item.cat}
                      </span>
                      <span className={`${textSub}`}>
                        {formatEur(totalInCat)} (
                        {percent.toFixed(1)}%)
                      </span>
                    </div>
                    <div
                      className={`w-full h-2 rounded-[var(--r-pill)] ${"bg-[var(--surface)]"}`}
                    >
                      <div
                        className={`h-2 rounded-[var(--r-pill)] ${item.color}`}
                        style={{
                          width: `${Math.max(percent, totalInCat > 0 ? 3 : 0)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-4">
              <div
                className={`p-4 rounded-[var(--r-m)] ${"bg-[var(--surface)]"} space-y-3 text-xs leading-relaxed`}
              >
                <h4
                  className={`font-sans font-bold ${textTitle}`}
                >
                  Auditoría Operativa
                </h4>
                <div className="space-y-2 text-xs font-sans text-[var(--ink-2)]">
                  <div className="flex justify-between">
                    <span>Gasto en Viajes (Transporte/Hotel):</span>
                    <span className={`${textTitle}`}>
                      {payments
                        .filter(
                          (p) =>
                            (p.categoria === "transporte" ||
                              p.categoria === "alojamiento") &&
                            p.estado === "pagado",
                        )
                        .reduce((sum, p) => sum + p.importe, 0)
                        .toLocaleString("es-ES")}
                      €
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Inversión en Promo:</span>
                    <span className={`${textTitle}`}>
                      {payments
                        .filter(
                          (p) =>
                            p.categoria === "promo" && p.estado === "pagado",
                        )
                        .reduce((sum, p) => sum + p.importe, 0)
                        .toLocaleString("es-ES")}
                      €
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ingresos de Conciertos:</span>
                    <span className="text-[var(--ink)] font-bold tabular-nums">
                      {payments
                        .filter(
                          (p) =>
                            p.categoria === "concierto" &&
                            p.tipo === "ingreso" &&
                            p.estado === "pagado",
                        )
                        .reduce((sum, p) => sum + p.importe, 0)
                        .toLocaleString("es-ES")}
                      €
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
