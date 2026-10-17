import { moduloDeBookingOculto } from "../../utils/bookingVisible";
import React, { useState } from "react";
import { Trash2, ArrowUp, ArrowDown, GripVertical, Info } from "lucide-react";
import {
  DashboardWidgetConfig,
  DEFAULT_DASHBOARD_WIDGETS,
  AVAILABLE_MODULE_WIDGETS,
  WidgetType,
} from "../../types/dashboardWidgets";
import { CalendarWidget } from "./widgets/CalendarWidget";
import { RoiBandaWidget } from "./widgets/RoiBandaWidget";
import { MarketingWidget } from "./widgets/MarketingWidget";
import { ExecutiveSummaryHero } from "./ExecutiveSummaryHero";
import { CrmPipelineWidget, RepertorioWidget, SocialFansWidget, EpkStatusWidget, AiAgentWidget, TourStatusWidget } from "./widgets/ModuleWidgets";
import {
  RepertorioEnergyChartWidget,
  BookingFunnelChartWidget,
  FinancesChartWidget,
} from "./widgets/ChartWidgets";
import {
  Concert,
  Payment,
  Rehearsal,
  Lead,
  Tour,
  Fan,
  SocialPost,
  EPKConfig,
  ThemeColors,
  Setlist,
  Song,
  User,
} from "../../types";
import type { NavigationOptions } from "../Dashboard";
import { hasModuleAccess } from "../../utils/planPermissions";
import { AiSupportWidget, AiUsageCard } from "./AiUsageSupportWidget";
import { IconButton } from '../ui';
import { BotonMovil } from "./BotonMovil";
import { BarraEdicionPanel } from "./BarraEdicionPanel";
import { AddWidgetModal } from "./AddWidgetModal";
import { claseColumnas, columnasRellenando } from "../../utils/rellenarFila";
import { TiradorWidget } from "./TiradorWidget";
import { useRedimensionar } from "./hooks/useRedimensionar";
import { useReordenTactil } from "./hooks/useReordenTactil";
import { pasoAncho, pasoAlto } from "../../utils/redimensionarWidget";
import { useGuardadoPanel } from "./hooks/useGuardadoPanel";
import { moverEntreVisibles, leerPanel, panelDeBanda, conPanel, visibleEnMovil, widgetNuevo, type PanelGuardado } from "../../utils/panelWidgets";

// Espectro resuelve claro/oscuro en tokens: las ramas `isStitchLight` que llegan de main no deben
// activarse nunca (traerían de vuelta slate/indigo). Se eliminan en el restyle de este fichero.
const isStitchLight = false;

export interface DashboardWidgetGridProps {
  currentUser?: User;
  /** El booking es reservado: sin acceso, sus widgets no existen en el panel. */
  bookingVisible?: boolean;
  concerts: Concert[];
  rehearsals: Rehearsal[];
  leads: Lead[];
  tours?: Tour[];
  fans?: Fan[];
  posts?: SocialPost[];
  payments?: Payment[];
  setlists?: Setlist[];
  songs?: Song[];
  epkConfig?: Partial<EPKConfig>;
  activeBandName?: string;
  colors: ThemeColors;
  agendaFilterMode: "active" | "all";
  onSetAgendaFilterMode: (mode: "active" | "all") => void;
  onNavigate?: (view: string, options?: NavigationOptions) => void;
  isEditMode?: boolean;
  setIsEditMode?: React.Dispatch<React.SetStateAction<boolean>>;
  viewDensityMode?: "clean" | "full";
  setViewDensityMode?: React.Dispatch<React.SetStateAction<"clean" | "full">>;
}

/** Id único de un widget recién añadido (a nivel de módulo: se llama solo desde handlers). */
export function DashboardWidgetGrid({
  currentUser,
  bookingVisible = true,
  concerts,
  rehearsals,
  leads,
  tours = [],
  fans = [],
  payments = [],
  setlists = [],
  songs = [],
  epkConfig,
  activeBandName,
  colors,
  agendaFilterMode,
  onSetAgendaFilterMode,
  onNavigate,
  isEditMode: externalEditMode,
  setIsEditMode: externalSetIsEditMode,
  viewDensityMode: externalDensityMode,
}: DashboardWidgetGridProps) {
  const userPlan = currentUser?.plan;
  const tieneModulo = (modulo: string) => hasModuleAccess(userPlan, modulo) && !moduloDeBookingOculto(modulo, bookingVisible);

  // Internal fallback state if props not passed
  const [internalDensityMode] = useState<
    "clean" | "full"
  >("clean");
  const [internalEditMode, setInternalEditMode] = useState(false);

  const viewDensityMode = externalDensityMode ?? internalDensityMode;

  const isEditMode = externalEditMode ?? internalEditMode;
  const setIsEditMode = externalSetIsEditMode ?? setInternalEditMode;

  // Load saved widgets from user preferences or use default, filtering by module access
  // Lo guardado puede ser el formato antiguo (una lista) o el v2: se lee siempre como v2.
  const guardadoCrudo = currentUser?.ui_preferences?.dashboard_widgets;
  const leido = React.useMemo(() => leerPanel(guardadoCrudo), [guardadoCrudo]);
  const savedWidgets = leido ? panelDeBanda(leido.panel) : undefined;
  // Último panel completo conocido (con los paneles por banda, que hoy no se tocan desde aquí).
  const panelRef = React.useRef<PanelGuardado | null>(leido?.panel ?? null);

  // Quita lo que el plan no permite y los tipos duplicados. Un tipo de widget solo puede estar
  // una vez en el panel — de guardados anteriores pueden quedar duplicados ("Añadir Otro" lo
  // permitía a propósito): se mantiene la primera aparición de cada tipo, en el orden guardado.
  const sanitizeLayout = (list: DashboardWidgetConfig[]) => {
    const withModuleAccess = list.filter((w) => {
      const meta = AVAILABLE_MODULE_WIDGETS.find((m) => m.type === w.type);
      if (meta && meta.requiredModule) {
        return tieneModulo(meta.requiredModule);
      }
      return true;
    });
    const seenTypes = new Set<string>();
    const deduped = withModuleAccess.filter((w) => {
      if (seenTypes.has(w.type)) return false;
      seenTypes.add(w.type);
      return true;
    });
    return { deduped, hadDuplicates: deduped.length !== withModuleAccess.length };
  };

  // `hadDuplicates` es true si la carga inicial tuvo que quitar algún widget duplicado — dispara
  // un guardado silencioso una vez montado, para que la limpieza no se pierda en la próxima carga.
  const [initialLayout] = useState(() =>
    sanitizeLayout(
      Array.isArray(savedWidgets) && savedWidgets.length > 0
        ? savedWidgets
        : DEFAULT_DASHBOARD_WIDGETS,
    ),
  );
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(initialLayout.deduped);

  // true en cuanto el panel es del usuario (ya guardado antes, o tocado en esta sesión): la vista
  // «Esencial» solo recorta el panel por defecto. Antes recortaba también lo que el usuario había
  // montado a mano, y al pulsar «Finalizar edición» los widgets añadidos desaparecían — parecía
  // que los cambios no se guardaban.
  const [layoutCustomized, setLayoutCustomized] = useState(
    Array.isArray(savedWidgets) && savedWidgets.length > 0,
  );

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Drag and drop state
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [dragOverWidgetId, setDragOverWidgetId] = useState<string | null>(null);

  const { guardar: saveLayoutToDb, error: saveError, guardado: saveSuccessMsg, haGuardado, hayCambiosEnCurso } = useGuardadoPanel();
  const widgetsRef = React.useRef(widgets);
  React.useEffect(() => {
    widgetsRef.current = widgets;
  }, [widgets]);

  const updateAndSaveWidgets = (newWidgets: DashboardWidgetConfig[]) => {
    const ordered = newWidgets.map((w, idx) => ({ ...w, order: idx }));
    setWidgets(ordered);
    setLayoutCustomized(true);
    saveLayoutToDb((panelRef.current = conPanel(panelRef.current, ordered)));
  };

  // Si el usuario llega con un panel más reciente que el que se pintó al montar (sesión refrescada
  // en segundo plano, otro dispositivo), se adopta — salvo en plena edición o con un guardado en
  // vuelo, que ya son lo último que el usuario ha hecho.
  React.useEffect(() => {
    if (!Array.isArray(savedWidgets) || savedWidgets.length === 0) return;
    if (isEditMode || haGuardado() || hayCambiosEnCurso()) return;
    const { deduped } = sanitizeLayout(savedWidgets);
    if (JSON.stringify(deduped) !== JSON.stringify(widgetsRef.current)) {
      setWidgets(deduped);
      setLayoutCustomized(true);
      panelRef.current = leido?.panel ?? panelRef.current;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedWidgets]);

  // Si la carga inicial tuvo que quitar duplicados o migrar del formato antiguo, persiste
  // la limpieza una sola vez — si no, el duplicado seguiría reapareciendo en cada recarga hasta
  // que el usuario tocara algo manualmente.
  React.useEffect(() => {
    if (initialLayout.hadDuplicates || leido?.migrado) saveLayoutToDb((panelRef.current = conPanel(panelRef.current, widgets)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedWidgetId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedWidgetId && draggedWidgetId !== id) {
      setDragOverWidgetId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverWidgetId(null);
  };

  const moverA = (origen: string, destino: string) => {
    const copy = [...widgets];
    const fromIdx = copy.findIndex((w) => w.id === origen);
    const toIdx = copy.findIndex((w) => w.id === destino);
    if (fromIdx === -1 || toIdx === -1) return;
    copy.splice(toIdx, 0, copy.splice(fromIdx, 1)[0]);
    updateAndSaveWidgets(copy);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedWidgetId && draggedWidgetId !== targetId) moverA(draggedWidgetId, targetId);
    setDraggedWidgetId(null);
    setDragOverWidgetId(null);
  };

  const handleDragEnd = () => {
    setDraggedWidgetId(null);
    setDragOverWidgetId(null);
  };

  const { iniciar: arrastrarConDedo } = useReordenTactil({ setArrastrado: setDraggedWidgetId, setSobre: setDragOverWidgetId, alSoltar: moverA });
  const gridRef = React.useRef<HTMLDivElement>(null);
  const { previa, iniciar: iniciarTirador } = useRedimensionar((id, c) => updateAndSaveWidgets(widgets.map((w) => (w.id === id ? { ...w, ...c } : w))));

  // Move widget up/down manually
  const handleMoveWidget = (index: number, direction: "up" | "down") => {
    updateAndSaveWidgets(moverEntreVisibles(widgets, visibleWidgets, index, direction));
  };

  // Change width span (wSpan)
  const handleChangeWSpan = (id: string, newSpan: 3 | 4 | 6 | 8 | 12) => {
    const updated = widgets.map((w) =>
      w.id === id ? { ...w, wSpan: newSpan } : w,
    );
    updateAndSaveWidgets(updated);
  };

  // Change height mode (hSpan)
  const handleChangeHSpan = (
    id: string,
    newHSpan: "compact" | "normal" | "tall",
  ) => {
    const updated = widgets.map((w) =>
      w.id === id ? { ...w, hSpan: newHSpan } : w,
    );
    updateAndSaveWidgets(updated);
  };

  // Remove widget
  const handleRemoveWidget = (id: string) => {
    const updated = widgets.filter((w) => w.id !== id);
    updateAndSaveWidgets(updated);
  };

  // Update specific widget settings (e.g., calendar view mode)
  const handleUpdateWidgetSettings = (
    id: string,
    newSettings: NonNullable<DashboardWidgetConfig["settings"]>,
  ) => {
    const updated = widgets.map((w) => {
      if (w.id === id) {
        return {
          ...w,
          settings: {
            ...(w.settings || {}),
            ...newSettings,
          },
        };
      }
      return w;
    });
    updateAndSaveWidgets(updated);
  };

  // Reset to default, filtered by user module access
  const handleResetDefault = () => {
    const defaultAllowed = DEFAULT_DASHBOARD_WIDGETS.filter((w) => {
      const meta = AVAILABLE_MODULE_WIDGETS.find((m) => m.type === w.type);
      if (meta && meta.requiredModule) {
        return tieneModulo(meta.requiredModule);
      }
      return true;
    });
    updateAndSaveWidgets(defaultAllowed);
  };

  // Add new widget from library
  const handleAddWidget = (type: WidgetType) => {
    const meta = AVAILABLE_MODULE_WIDGETS.find((m) => m.type === type);
    if (!meta) return;

    if (
      meta.requiredModule &&
      !tieneModulo(meta.requiredModule)
    ) {
      return;
    }

    // Cada tipo de widget solo puede estar una vez en el panel — antes se permitía "Añadir Otro"
    // a propósito, pero dos copias del mismo widget (mismos datos, mismo gráfico) no aportan nada
    // y solo confunden el panel. Defensa aparte del botón deshabilitado más abajo, por si algo
    // más llega a llamar a esta función directamente.
    if (widgets.some((w) => w.type === type && w.visible)) return;

    updateAndSaveWidgets([...widgets, widgetNuevo(type, meta, widgets.length)]);
    // El modal se queda abierto a propósito: así se pueden añadir varios widgets seguidos sin
    // tener que reabrir el catálogo cada vez. Se cierra solo con la X o "Cerrar".
  };

  // Render individual widget by type
  const renderWidgetContent = (widget: DashboardWidgetConfig) => {
    const heightMode = widget.hSpan || "normal";

    switch (widget.type) {
      case "calendar":
        return (
          <CalendarWidget
            concerts={concerts}
            rehearsals={rehearsals}
            activeBandName={activeBandName}
            colors={colors}
            agendaFilterMode={agendaFilterMode}
            onSetAgendaFilterMode={onSetAgendaFilterMode}
            onNavigate={onNavigate}
            viewMode={widget.settings?.calendarViewMode || "list"}
            onChangeViewMode={(mode) =>
              handleUpdateWidgetSettings(widget.id, { calendarViewMode: mode })
            }
            filterType={widget.settings?.calendarFilter || "all"}
            onChangeFilterType={(f) =>
              handleUpdateWidgetSettings(widget.id, { calendarFilter: f })
            }
            isEditMode={isEditMode}
          />
        );
      case "executive_summary":
        return (
          <ExecutiveSummaryHero
            concerts={concerts}
            leads={leads}
            rehearsals={rehearsals}
            onNavigate={onNavigate}
          />
        );
      case "repertorio_energy":
        return (
          <RepertorioEnergyChartWidget
            onNavigate={onNavigate}
            heightMode={heightMode}
            setlists={setlists}
            songs={songs}
          />
        );
      case "crm_pipeline":
        return <CrmPipelineWidget leads={leads} onNavigate={onNavigate} />;
      case "booking_funnel_chart":
        return (
          <BookingFunnelChartWidget
            leads={leads}
            onNavigate={onNavigate}
            heightMode={heightMode}
            isStitchLight={isStitchLight}
          />
        );
      case "finances_chart":
        return (
          <FinancesChartWidget
            concerts={concerts}
            onNavigate={onNavigate}
            heightMode={heightMode}
            isStitchLight={isStitchLight}
          />
        );
      case "repertorio_summary":
        return <RepertorioWidget onNavigate={onNavigate} />;
      case "social_fans":
        return <SocialFansWidget fans={fans} onNavigate={onNavigate} />;
      case "epk_status":
        return (
          <EpkStatusWidget epkConfig={epkConfig} onNavigate={onNavigate} />
        );
      case "ai_agent_status":
        return (
          <AiAgentWidget
            leads={leads}
            currentUser={currentUser}
            onNavigate={onNavigate}
          />
        );
      case "tour_status":
        return <TourStatusWidget tours={tours} onNavigate={onNavigate} />;
      case "roi_banda":
        return (
          <RoiBandaWidget
            concerts={concerts}
            payments={payments}
            plan={userPlan}
            puedeVerDinero={currentUser?.role === "leader" || currentUser?.role === "admin"}
            onNavigate={onNavigate}
          />
        );
      case "marketing":
        return <MarketingWidget fans={fans} leads={leads} onNavigate={onNavigate} />;
      default:
        return null;
    }
  };

  // Filter visible widgets sorted by order, enforcing module access
  const allVisibleWidgets = widgets
    .filter((w) => {
      if (!w.visible) return false;
      const meta = AVAILABLE_MODULE_WIDGETS.find((m) => m.type === w.type);
      if (meta && meta.requiredModule) {
        return tieneModulo(meta.requiredModule);
      }
      return true;
    })
    .sort((a, b) => a.order - b.order);

  // In clean view, limit to essential operational widgets (max 4 core widgets) to prevent information overload
  const visibleWidgets =
    viewDensityMode === "clean" && !isEditMode && !layoutCustomized
      ? allVisibleWidgets
          .filter((w) =>
            [
              "calendar",
              "crm_pipeline",
              "ai_agent_status",
              "epk_status",
              "repertorio_summary",
              "roi_banda",
            ].includes(w.type),
          )
          .slice(0, 4)
      : allVisibleWidgets;

  // Cada fila se rellena hasta el borde: el último widget se estira (con el tirador a medias, ya con el ancho nuevo)
  const columnasEnFila = columnasRellenando(visibleWidgets.map((w) => (previa?.id === w.id ? previa.wSpan : w.wSpan)));

  return (
    <div className="space-y-4 w-full">
      {isEditMode && (
        <BarraEdicionPanel
          visibles={visibleWidgets.length}
          total={allVisibleWidgets.length}
          hayError={Boolean(saveError)}
          guardado={Boolean(saveSuccessMsg)}
          onReintentar={() => saveLayoutToDb(conPanel(panelRef.current, widgets), { inmediato: true })}
          onAnadir={() => setIsAddModalOpen(true)}
          onRestablecer={handleResetDefault}
          onFinalizar={() => setIsEditMode(false)}
        />
      )}

      {/* Main Grid Layout */}
      <div ref={gridRef} data-panel-grid className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
        {visibleWidgets.map((original, index) => {
          // Mientras se arrastra el tirador el widget se pinta ya con el tamaño nuevo
          const widget = previa?.id === original.id ? { ...original, wSpan: previa.wSpan, hSpan: previa.hSpan } : original;
          const colSpanClass = claseColumnas(columnasEnFila[index]);

          const isDragging = draggedWidgetId === widget.id;
          const isDragOver = dragOverWidgetId === widget.id;

          return (
            <div
              key={widget.id}
              data-widget-id={widget.id}
              draggable={isEditMode}
              onDragStart={(e) => handleDragStart(e, widget.id)}
              onDragOver={(e) => handleDragOver(e, widget.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, widget.id)}
              onDragEnd={handleDragEnd}
              className={`${colSpanClass} ${!isEditMode && !visibleEnMovil(widget) ? "max-md:hidden" : ""} relative transition-ui duration-200 ${isDragging ? "opacity-40 scale-[0.98]" : ""} ${
                isDragOver
                  ? "ring-2 ring-[var(--acc)] ring-offset-2 ring-offset-[var(--bg)] rounded-[var(--r-l)] bg-[var(--acc)]/10"
                  : ""
              } ${isEditMode ? "ring-2 ring-[var(--acc)]/40 rounded-[var(--r-l)] p-1 bg-[var(--acc)]/5 hover:ring-[var(--acc)]" : ""}`}
            >
              {/* Edit Controls Bar overlayed on widget when in Edit Mode */}
              {isEditMode && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-[var(--sunken)] p-2 rounded-t-[var(--r-m)] mb-1 text-xs font-sans text-[var(--ink-2)] gap-2">
                  <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing touch-none" onPointerDown={(e) => arrastrarConDedo(e, widget.id)}>
                    <GripVertical className="w-4 h-4 text-[var(--acc)] shrink-0" />
                    <span className="font-bold text-[var(--acc)]/70 text-xs truncate max-w-[150px]">
                      {widget.title || widget.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-between sm:justify-end">
                    {/* Móvil — en el móvil caben pocos bloques: aquí se decide cuáles salen */}
                    <BotonMovil
                      activo={visibleEnMovil(widget)}
                      onClick={() => updateAndSaveWidgets(widgets.map((w) => (w.id === widget.id ? { ...w, movil: !visibleEnMovil(w) } : w)))}
                    />

                    {/* Order buttons */}
                    <div className="flex items-center gap-0.5">
                      <IconButton
                        label="Mover arriba"
                        size="icon-xs"
                        type="button"
                        onClick={() => handleMoveWidget(index, "up")}
                        disabled={index === 0}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </IconButton>
                      <IconButton
                        label="Mover abajo"
                        size="icon-xs"
                        type="button"
                        onClick={() => handleMoveWidget(index, "down")}
                        disabled={index === visibleWidgets.length - 1}
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </IconButton>
                    </div>

                    {/* Remove */}
                    <IconButton
                      label="Quitar widget"
                      variant="danger"
                      size="icon-xs"
                      type="button"
                      onClick={() => handleRemoveWidget(widget.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </IconButton>
                  </div>
                </div>
              )}

              {/* Render actual widget */}
              {renderWidgetContent(widget)}
              {isEditMode && (
                <TiradorWidget
                  titulo={widget.title || widget.type}
                  onPointerDown={(e) => iniciarTirador(e, widget, gridRef.current, e.currentTarget.parentElement)}
                  onPaso={(eje, dir) => (eje === "ancho" ? handleChangeWSpan(widget.id, pasoAncho(widget.wSpan, dir)) : handleChangeHSpan(widget.id, pasoAlto(widget.hSpan, dir)))}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* WIDGET IMPRESCINDIBLE: APOYO A BANDMANAGER (NO SE PUEDE QUITAR) */}
      <div className="pt-2 space-y-3">
        {isEditMode && (
          <div className="px-3 py-1 rounded-[var(--r-s)] bg-[var(--acc)]/15 text-[var(--ink)] text-xs font-sans font-bold flex items-center gap-1.5 w-fit">
            <Info className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
            <span>
              Módulo Fijo: Apoyo a BandManager (Permanente, no se puede quitar)
            </span>
          </div>
        )}
        <AiSupportWidget variant="card" />
        <AiUsageCard />
      </div>

      <AddWidgetModal
        abierto={isAddModalOpen}
        onCerrar={() => setIsAddModalOpen(false)}
        userPlan={userPlan}
        bookingVisible={bookingVisible}
        tiposEnPanel={new Set(widgets.filter((w) => w.visible).map((w) => w.type))}
        onAnadir={handleAddWidget}
      />
    </div>
  );
}
