import { PopoverAncla } from './ui/PopoverAncla';
import React, { useState } from "react";
import {
  Lead,
  LeadType,
  LeadStatus,
  ThemeColors,
  SocialMetric,
  Concert,
  Rehearsal,
  EPKConfig,
  Tour,
  Fan,
  Payment,
  SocialPost,
  Setlist,
  Song,
  User,
} from "../types";
import type { MainView } from "../app/appViews";
import type { SwitcherBand } from "./band_switcher/bandSwitcherTypes";
import { usePlayer } from "../context/playerContextValue";
import { isSameBandId } from "../utils/bandUtils";
import { api } from "../services/api";
import "../utils/api";
import { AddLeadModal } from "./dashboard/AddLeadModal";
import { ProfileCompletenessCard } from "./dashboard/ProfileCompletenessCard";
import { EmailTemplatesModal } from "./dashboard/EmailTemplatesModal";
import { AgentAutonomySettingsModal } from "./dashboard/AgentAutonomySettingsModal";
import { DashboardWidgetGrid } from "./dashboard/DashboardWidgetGrid";
import { NeedsAttentionBanner } from "./dashboard/NeedsAttentionBanner";
import { ConvocarEnsayoModal } from "./ensayos/ConvocarEnsayoModal";
import { ManagerAlertsWidget } from "./dashboard/ManagerAlertsWidget";
import { NextGigStrip } from "./dashboard/NextGigStrip";
import { AlertSettingsModal } from "./dashboard/AlertSettingsModal";
import {
  generateManagerAlerts,
  ManagerAlert,
  AlertAction,
} from "../utils/managerAlerts";
import { MobileBottomSheet } from "./booking/MobileBottomSheet";
import {
  autoDetectVenueAddress,
  normalizeStatus,
  normalizeType,
} from "../utils/bookingUtils";
import {
  leadStatusDotColor,
  leadStatusBadgeClass,
  leadStatusLabel,
} from "../utils/leadStatusPresentation";
import { normalizePlan } from "../utils/planPermissions";
import { Plus, X, Building2, Disc3, Sliders, Settings, Eye } from "lucide-react";
import { Button, IconButton, MenuItem } from './ui';

export type NavigationOptions = {
  sectionTab?: "salas" | "medios" | "grupos";
  statusFilter?: LeadStatus | "todos" | string;
  selectedLeadId?: string;
  selectedEventId?: string;
  selectedDate?: string;
  concertId?: string;
};

interface DashboardProps {
  leads: Lead[];
  colors: ThemeColors;
  onUpdateLead: (leadId: string, updatedFields: Partial<Lead>) => void;
  onAddLead: (lead: Lead) => void;
  metrics?: SocialMetric[];
  concerts?: Concert[];
  currentUser?: User;
  bandName?: string;
  currentBandId?: string;
  availableBands?: SwitcherBand[];
  rehearsals?: Rehearsal[];
  onAddRehearsal?: (rehearsal: Rehearsal) => void;
  bandUsers?: Array<{ id: string; name: string; instrument?: string }>;
  epkConfig?: Partial<EPKConfig>;
  tours?: Tour[];
  fans?: Fan[];
  posts?: SocialPost[];
  payments?: Payment[];
  setlists?: Setlist[];
  songs?: Song[];
  onNavigate?: (view: MainView, options?: NavigationOptions) => void;
  onOpenProfileModal?: () => void;
  isPromoPlan?: boolean;
}

export default function Dashboard({
  leads,
  colors,
  onUpdateLead,
  onAddLead,
  metrics = [],
  concerts = [],
  rehearsals = [],
  onAddRehearsal,
  bandUsers = [],
  currentUser,
  bandName,
  currentBandId,
  availableBands = [],
  epkConfig,
  tours = [],
  fans = [],
  posts = [],
  payments = [],
  onNavigate,
  onOpenProfileModal,
  isPromoPlan: isPromoPlanProp,
}: DashboardProps) {
  const { setSongs: setPlayerSongs } = usePlayer();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isQuickRehearsalOpen, setIsQuickRehearsalOpen] = useState(false);
  const [showQuickAddMenu, setShowQuickAddMenu] = useState(false);
  const [isEmailTemplatesOpen, setIsEmailTemplatesOpen] = useState(false);
  const [isAutonomyModalOpen, setIsAutonomyModalOpen] = useState(false);
  const [isAlertSettingsOpen, setIsAlertSettingsOpen] = useState(false);
  const [isDashboardSettingsOpen, setIsDashboardSettingsOpen] = useState(false);
  const [isEditDashboardMode, setIsEditDashboardMode] = useState(false);
  const [viewDensityMode, setViewDensityMode] = useState<"clean" | "full">(
    "clean",
  );

  // Band view filter state:'all' (Todas las bandas asignadas por defecto) vs'active' (Solo la banda activa)
  const [agendaFilterMode, setAgendaFilterMode] = useState<"active" | "all">(
    "all",
  );

  const isPromo =
    isPromoPlanProp ??
    (normalizePlan(currentUser?.plan) === "promo" ||
      normalizePlan(currentUser?.plan) === "promo_plus" ||
      Boolean(
        availableBands &&
        availableBands.find(
          (b) =>
            (b.band_id === currentBandId || b.id === currentBandId) &&
            (normalizePlan(b.plan) === "promo" ||
              normalizePlan(b.plan) === "promo_plus"),
        ),
      ));

  // Add new lead form states
  const [newSala, setNewSala] = useState("");
  const [newCiudad, setNewCiudad] = useState("");
  const [newRegion, setNewRegion] = useState("");
  const [newAforo, setNewAforo] = useState(300);
  const [newGenero, setNewGenero] = useState("Ska / Reggae / Mestizaje");
  const [newTipo, setNewTipo] = useState<LeadType>("sala");
  const [newEmail, setNewEmail] = useState("");
  const [newInstagram, setNewInstagram] = useState("");
  const [newNotas, setNewNotas] = useState("");

  const [setlists, setSetlists] = React.useState<Setlist[]>([]);
  const [songs, setSongs] = React.useState<Song[]>([]);

  React.useEffect(() => {
    let isMounted = true;
    const loadRepertorioData = async () => {
      try {
        const [songsRes, setlistsRes] = await Promise.all([
          api.getSongs(),
          api.getSetlists(),
        ]);

        if (isMounted) {
          if (songsRes?.songs && Array.isArray(songsRes.songs)) {
            setSongs(songsRes.songs);
            setPlayerSongs(songsRes.songs);
          }
          if (setlistsRes?.setlists && Array.isArray(setlistsRes.setlists)) {
            setSetlists(setlistsRes.setlists);
          }
        }
      } catch (err) {
        console.error("Failed to load repertorio data:", err);
        if (isMounted) {
          setSongs([]);
          setSetlists([]);
          setPlayerSongs([]);
        }
      }
    };
    loadRepertorioData();
    return () => {
      isMounted = false;
    };
  }, [currentBandId, setPlayerSongs]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSala || !newCiudad) return;

    const newLeadItem: Lead = {
      id: `lead-${Date.now()}`,
      nombre_sala: newSala,
      ciudad: newCiudad,
      region: newRegion,
      aforo: Number(newAforo),
      genero: newGenero,
      tipo: newTipo,
      email_contacto: newEmail,
      telefono: "",
      instagram: newInstagram,
      fuente: "Ingreso Manual (Jon)",
      estado: "nuevo",
      pitch_generado: "",
      notas: newNotas || "Añadido manualmente desde el dashboard.",
    };

    onAddLead(newLeadItem);
    setIsAddModalOpen(false);

    // Reset Form
    setNewSala("");
    setNewCiudad("");
    setNewRegion("");
    setNewAforo(300);
    setNewGenero("Ska / Reggae / Mestizaje");
    setNewEmail("");
    setNewInstagram("");
    setNewNotas("");
  };

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const activeBandId = currentBandId || currentUser?.band_id || "";
  const activeBandName = bandName || currentUser?.bandName || "Tu Banda";

  // Filter concerts & rehearsals based on agendaFilterMode
  const filteredConcerts = concerts.filter((c) => {
    if (agendaFilterMode === "all") return true;
    if (!c.band_id) return false;
    return isSameBandId(c.band_id, activeBandId);
  });

  const filteredRehearsals = rehearsals.filter((r) => {
    if (agendaFilterMode === "all") return true;
    if (!r.band_id) return false;
    return isSameBandId(r.band_id, activeBandId);
  });

  // Helper to resolve the correct band name for each event
  const getEventBandName = (bandId?: string, explicitBandName?: string) => {
    if (explicitBandName) return explicitBandName;
    if (!bandId || isSameBandId(bandId, activeBandId)) return activeBandName;
    const match = (availableBands || []).find(
      (b) =>
        isSameBandId(b.band_id, bandId) || isSameBandId(b.id, bandId),
    );
    return (
      match?.bandName ||
      match?.name ||
      "Banda"
    );
  };

  // Build upcoming agenda dates
  const upcomingEvents: Array<{
    id: string;
    type: "concierto" | "ensayo";
    title: string;
    dateStr: string;
    day: string;
    month: string;
    location: string;
    locationQuery?: string;
    address?: string;
    badge: string;
    bandName: string;
    details: string;
  }> = [];

  // Add concerts (ignoring past ones)
  filteredConcerts.forEach((c) => {
    if (c.fecha && c.fecha < todayStr) return;
    const parts = c.fecha ? c.fecha.split("-") : [];
    const day = parts[2] || "15";
    const monthNames = [
      "ENE",
      "FEB",
      "MAR",
      "ABR",
      "MAY",
      "JUN",
      "JUL",
      "AGO",
      "SEP",
      "OCT",
      "NOV",
      "DIC",
    ];
    const month = parts[1]
      ? monthNames[parseInt(parts[1], 10) - 1] || "AGO"
      : "AGO";

    upcomingEvents.push({
      id: c.id,
      type: "concierto",
      title: `Concierto: ${c.sala}`,
      dateStr: c.fecha,
      day,
      month,
      location: c.sala ? `${c.sala} (${c.ciudad})` : c.ciudad,
      locationQuery: c.direccion || `${c.sala}, ${c.ciudad}`,
      address: c.direccion,
      badge: c.contrato_firmado ? "Contrato Firmado" : "Confirmado",
      bandName: getEventBandName(c.band_id, c.bandName),
      details: isPromo
        ? c.aforo_total
          ? `Aforo: ${c.aforo_total} pax`
          : "Concierto confirmado"
        : `Caché: ${c.cache ? `${c.cache}€` : "A convenir"} • Aforo: ${c.aforo_total || 500} pax`,
    });
  });

  // Add rehearsals (ignoring past ones)
  filteredRehearsals.forEach((r) => {
    if (r.fecha && r.fecha < todayStr) return;
    const parts = r.fecha ? r.fecha.split("-") : [];
    const day = parts[2] || "10";
    const monthNames = [
      "ENE",
      "FEB",
      "MAR",
      "ABR",
      "MAY",
      "JUN",
      "JUL",
      "AGO",
      "SEP",
      "OCT",
      "NOV",
      "DIC",
    ];
    const month = parts[1]
      ? monthNames[parseInt(parts[1], 10) - 1] || "AGO"
      : "AGO";

    upcomingEvents.push({
      id: r.id,
      type: "ensayo",
      title: r.lugar ? `Ensayo en ${r.lugar}` : `Ensayo General`,
      dateStr: r.fecha,
      day,
      month,
      location: r.lugar || "Local de Ensayo",
      locationQuery: `${r.lugar || "Local de Ensayo"}, Madrid`,
      address: undefined,
      badge: r.estado === "completado" ? "Completado" : "Programado",
      bandName: getEventBandName(r.band_id, r.bandName),
      details: `Horario: ${r.hora || "18:00"} • Asistentes: ${r.asistentes ? (Array.isArray(r.asistentes) ? r.asistentes.join(", ") : r.asistentes) : "Todos"}`,
    });
  });

  // Antes, sin conciertos/ensayos reales todavía, se rellenaba la agenda con tres eventos
  // inventados (un concierto en Sala Apolo con caché de 1.800€, un ensayo y un festival con
  // caché de 3.500€) copiados de la banda insignia. Una agenda vacía es simplemente una agenda
  // vacía: no se inventan conciertos que no existen.
  upcomingEvents.sort((a, b) => a.dateStr.localeCompare(b.dateStr));


  // Generate intelligent industry alerts and booking milestones, strictly bound to user plan permissions
  const managerAlerts = generateManagerAlerts(
    leads,
    concerts,
    rehearsals,
    epkConfig,
    currentUser?.plan,
  );

  const handleExecuteAlertAction = (
    alert: ManagerAlert,
    actionOverride?: AlertAction,
  ) => {
    const targetType = actionOverride?.actionType || alert.actionType;

    switch (targetType) {
      case "open_campaign":
        if (onNavigate) onNavigate("booking");
        break;
      case "scout_festivals":
        setIsAddModalOpen(true);
        setNewTipo("festival");
        break;
      case "open_autonomy":
        setIsAutonomyModalOpen(true);
        break;
      case "view_leads_stale":
        if (onNavigate)
          onNavigate("booking", {
            statusFilter:
              actionOverride?.targetStatusFilter ||
              alert.targetStatusFilter ||
              "esperando_respuesta",
          });
        break;
      case "view_drafts":
        if (onNavigate)
          onNavigate("booking", { statusFilter: "pendiente_aprobacion" });
        break;
      case "view_concerts":
        if (onNavigate) onNavigate("calendario");
        break;
      case "open_epk":
        if (onNavigate) onNavigate("epk");
        break;
      case "view_finanzas":
        if (onNavigate) onNavigate("finanzas");
        break;
      case "view_ensayos":
        if (onNavigate) onNavigate("ensayos");
        break;
      case "view_reels":
        if (onNavigate) onNavigate("reels");
        break;
      default:
        if (onNavigate) onNavigate("booking");
    }
  };

  return (
    <div
      data-modulo="panel"
      className="space-y-6 text-[var(--ink)] bg-[var(--bg)] -m-3 p-3 sm:-m-5 sm:p-5 md:-m-8 md:p-8 min-h-screen font-sans overflow-x-hidden"
    >
      {/* HEADER / TITULO PRINCIPAL */}
      <div className="flex items-center justify-between gap-3 pb-1">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="page-title">
              Panel
            </h1>
            <span className="text-xs text-[var(--ink-2)] tabular-nums hidden sm:inline">
              · {activeBandName} ({leads.length} en CRM ·{" "}
              {upcomingEvents.length} fechas)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              variant="neutral"
              size="sm"
              type="button"
              onClick={() => setShowQuickAddMenu((v) => !v)}
              title="Añadir rápido"
            >
              <Plus className="w-4 h-4" />
            </Button>
            {showQuickAddMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowQuickAddMenu(false)}
                />
                <PopoverAncla className="absolute right-0 top-full mt-1.5 z-40 w-56 rounded-[var(--r-m)] bg-[var(--surface)] p-1.5 space-y-0.5 text-xs font-sans">
                  <MenuItem
                    type="button"
                    onClick={() => {
                      setShowQuickAddMenu(false);
                      setIsAddModalOpen(true);
                    }}
                  >
                    <Building2 className="w-3.5 h-3.5 shrink-0 text-[var(--ink-2)]" />{" "}
                    Lead rápido
                  </MenuItem>
                  <MenuItem
                    type="button"
                    onClick={() => {
                      setShowQuickAddMenu(false);
                      setIsQuickRehearsalOpen(true);
                    }}
                  >
                    <Disc3 className="w-3.5 h-3.5 shrink-0 text-[var(--ink-2)]" />{" "}
                    Ensayo rápido
                  </MenuItem>
                </PopoverAncla>
              </>
            )}
          </div>
          <Button
            variant="neutral"
            size="xs"
            type="button"
            id="quick-toggle-density-btn"
            onClick={() =>
              setViewDensityMode((prev) =>
                prev === "clean" ? "full" : "clean",
              )
            }
            className="items-center gap-1.5 max-sm:hidden"
            title="Alternar entre vista esencial y vista completa"
          >
            <Eye className="w-3.5 h-3.5 text-[var(--ink-2)]" />
            <span>
              {viewDensityMode === "clean"
                ? "Vista Esencial"
                : "Vista Completa"}
            </span>
          </Button>

          {/* Engranaje Único de Ajustes del Dashboard */}
          <div className="relative">
            <Button
              variant={isDashboardSettingsOpen || isEditDashboardMode ? "primary" : "neutral"}
              size="sm"
              type="button"
              id="dashboard-settings-gear-btn"
              onClick={() =>
                setIsDashboardSettingsOpen(!isDashboardSettingsOpen)
              }
              title="Ajustes del Dashboard"
            >
              <Settings className="w-4 h-4" />
            </Button>

            {isDashboardSettingsOpen && (
              <PopoverAncla className="absolute right-0 mt-2 w-64 p-1.5 rounded-[var(--r-m)] bg-[var(--surface)] text-[var(--ink)] z-50 animate-fade-in space-y-0.5">
                <div className="px-2.5 py-1.5 mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--ink-2)] block">
                    Ajustes del Dashboard
                  </span>
                  <IconButton
                    label="Cerrar"
                    size="icon-xs"
                    onClick={() => setIsDashboardSettingsOpen(false)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </IconButton>
                </div>

                <button
                  type="button"
                  id="gear-menu-toggle-density-btn"
                  onClick={() => {
                    setViewDensityMode((prev) =>
                      prev === "clean" ? "full" : "clean",
                    );
                    setIsDashboardSettingsOpen(false);
                  }}
                  className={`w-full px-2.5 py-2 rounded-[var(--r-s)] hover:bg-[var(--sunken)] text-[var(--ink)] text-left text-xs flex items-center justify-between font-medium transition-colors cursor-pointer`}
                >
                  <div className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-[var(--ink-2)]" />
                    <span>Modo vista</span>
                  </div>
                  <span className="text-micro font-medium px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--sunken)] text-[var(--ink-2)]">
                    {viewDensityMode === "clean" ? "Esencial" : "Completa"}
                  </span>
                </button>

                <button
                  type="button"
                  id="gear-menu-edit-layout-btn"
                  onClick={() => {
                    setIsEditDashboardMode(!isEditDashboardMode);
                    setIsDashboardSettingsOpen(false);
                  }}
                  className={`w-full px-2.5 py-2 rounded-[var(--r-s)] hover:bg-[var(--sunken)] text-[var(--ink)] text-left text-xs flex items-center justify-between font-medium transition-colors cursor-pointer`}
                >
                  <div className="flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-[var(--ink-2)]" />
                    <span>Personalizar / reordenar</span>
                  </div>
                  {isEditDashboardMode && (
                    <span className="w-2 h-2 rounded-[var(--r-pill)] bg-[var(--acc)]" />
                  )}
                </button>

                <button
                  type="button"
                  id="gear-menu-alerts-settings-btn"
                  onClick={() => {
                    setIsAlertSettingsOpen(true);
                    setIsDashboardSettingsOpen(false);
                  }}
                  className={`w-full px-2.5 py-2 rounded-[var(--r-s)] hover:bg-[var(--sunken)] text-[var(--ink)] text-left text-xs flex items-center gap-2 font-medium transition-colors cursor-pointer`}
                >
                  <Sliders className="w-3.5 h-3.5 text-[var(--ink-2)]" />
                  <span>Alertas del mánager</span>
                </button>
              </PopoverAncla>
            )}
          </div>
        </div>
      </div>

      {/* Móvil: próximo bolo y lo que te deben, siempre a la vista */}
      <NextGigStrip concerts={concerts} onNavigate={onNavigate} />

      {/* Solo se pinta si hay algo realmente esperando demasiado — no es un widget del catálogo
 a propósito, es una alerta, no contenido que se pueda ordenar o quitar. */}
      <NeedsAttentionBanner
        concerts={concerts}
        leads={leads}
        onNavigate={onNavigate}
      />

      {/* RADAR DEL MÁNAGER: HITOS ESTACIONALES Y ALERTAS DE BOOKING */}
      <ManagerAlertsWidget
        alerts={managerAlerts}
        onExecuteAction={handleExecuteAlertAction}
        onOpenSettings={() => setIsAlertSettingsOpen(true)}
        bandId={currentBandId || currentUser?.band_id || "active-band"}
      />

      {/* WIDGET GRID PERSONALIZABLE Y PERSISTENTE EN BBDD (incluye Resumen Ejecutivo como widget más) */}
      <DashboardWidgetGrid
        currentUser={currentUser}
        concerts={concerts}
        rehearsals={rehearsals}
        leads={leads}
        tours={tours}
        fans={fans}
        posts={posts}
        payments={payments}
        setlists={setlists}
        songs={songs}
        epkConfig={epkConfig}
        activeBandName={activeBandName}
        colors={colors}
        agendaFilterMode={agendaFilterMode}
        onSetAgendaFilterMode={setAgendaFilterMode}
        onNavigate={onNavigate}
        isEditMode={isEditDashboardMode}
        setIsEditMode={setIsEditDashboardMode}
        viewDensityMode={viewDensityMode}
        setViewDensityMode={setViewDensityMode}
      />

      {/* 3. SECCIÓN: ESTADO DE ENTRENAMIENTO & PREPARACIÓN DE AGENTES IA (Solo en Vista Completa) */}
      {viewDensityMode === "full" && (
        <ProfileCompletenessCard
          epkConfig={epkConfig}
          leads={leads}
          concerts={concerts}
          rehearsals={rehearsals}
          metrics={metrics}
          fans={fans}
          tours={tours}
          bandName={activeBandName}
          currentUser={currentUser}
          onNavigate={onNavigate}
          onOpenAutonomyModal={() => setIsAutonomyModalOpen(true)}
          onOpenProfileModal={onOpenProfileModal}
        />
      )}

      {/* MODAL: PLANTILLAS Y EJEMPLOS REALES DE EMAIL */}
      <EmailTemplatesModal
        isOpen={isEmailTemplatesOpen}
        onClose={() => setIsEmailTemplatesOpen(false)}
        bandName={activeBandName}
      />

      {/* MODAL: AGREGAR NUEVA SALA */}
      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSubmit={handleAddSubmit}
        newSala={newSala}
        setNewSala={setNewSala}
        newCiudad={newCiudad}
        setNewCiudad={setNewCiudad}
        newRegion={newRegion}
        setNewRegion={setNewRegion}
        newAforo={newAforo}
        setNewAforo={setNewAforo}
        newGenero={newGenero}
        setNewGenero={setNewGenero}
        newTipo={newTipo}
        setNewTipo={setNewTipo}
        newEmail={newEmail}
        setNewEmail={setNewEmail}
        newInstagram={newInstagram}
        setNewInstagram={setNewInstagram}
        newNotas={newNotas}
        setNewNotas={setNewNotas}
      />

      {/* MODAL: CONVOCAR ENSAYO RÁPIDO — mismo componente que usa el módulo de Ensayos, solo
 con la entrada más a mano desde el panel. */}
      {isQuickRehearsalOpen && (
        <ConvocarEnsayoModal
          isOpen={isQuickRehearsalOpen}
          onClose={() => setIsQuickRehearsalOpen(false)}
          onSave={(rehearsal) => {
            onAddRehearsal?.(rehearsal as Rehearsal);
            setIsQuickRehearsalOpen(false);
          }}
          colors={colors}
          setlists={setlists}
          bandUsers={bandUsers}
          currentBandId={currentBandId}
          initialRehearsal={null}
        />
      )}

      {/* MODAL / BOTTOM SHEET MOBILE FOR SELECTED LEAD IN DASHBOARD */}
      {selectedLead && (
        <MobileBottomSheet
          selectedLead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdateLead={onUpdateLead}
          getStatusBadgeClass={(status) =>
            leadStatusBadgeClass(normalizeStatus(status))
          }
          getStatusLabel={(status) =>
            leadStatusLabel(
              normalizeStatus(status),
              String(status).toUpperCase(),
            )
          }
          getStatusDotColor={(status) =>
            leadStatusDotColor(normalizeStatus(status))
          }
          normalizeStatus={normalizeStatus}
          normalizeType={normalizeType}
          autoDetectVenueAddress={autoDetectVenueAddress}
          sectionTab="salas"
        />
      )}

      <AgentAutonomySettingsModal
        isOpen={isAutonomyModalOpen}
        onClose={() => setIsAutonomyModalOpen(false)}
        bandName={activeBandName}
        bandId={currentBandId || currentUser?.band_id || ""}
        currentUser={currentUser}
        onOpenTemplatesSection={() => {
          if (onNavigate) onNavigate("booking");
        }}
        onOpenBandProfile={() => {
          if (onNavigate) onNavigate("bandas");
        }}
      />

      <AlertSettingsModal
        isOpen={isAlertSettingsOpen}
        onClose={() => setIsAlertSettingsOpen(false)}
        userPlan={currentUser?.plan || "de_gira"}
        // Antes `currentUser?.rol === "leader" || … || true`: `rol` no existe en User y la
        // expresión siempre valía true. Se deja explícito, mismo comportamiento.
        isLeaderOrManager
        userEmail={currentUser?.email || ""}
        bandId={currentBandId || currentUser?.band_id || "active-band"}
      />
    </div>
  );
}
