import React, { useState } from'react';
import { 
 Settings, Plus, RotateCcw, Save, Trash2, ArrowUp, ArrowDown, Maximize2, Minimize2, 
 Eye, Check, Calendar, Building2, Music, DollarSign, Users, BookOpen, Bot, Truck, LayoutGrid, X,
 GripVertical, Zap, TrendingUp, Info, Smartphone, Monitor
} from'lucide-react';
import { 
 DashboardWidgetConfig, DEFAULT_DASHBOARD_WIDGETS, AVAILABLE_MODULE_WIDGETS, 
 WidgetType 
} from'../../types/dashboardWidgets';
import { CalendarWidget } from'./widgets/CalendarWidget';
import { 
 CrmPipelineWidget, RepertorioWidget, FinancesWidget, SocialFansWidget, 
 EpkStatusWidget, AiAgentWidget, TourStatusWidget 
} from'./widgets/ModuleWidgets';
import { 
 RepertorioEnergyChartWidget, BookingFunnelChartWidget, FinancesChartWidget, SocialFansGrowthWidget 
} from'./widgets/ChartWidgets';
import { Concert, Rehearsal, Lead, Tour, Fan, SocialPost, EPKConfig, ThemeColors } from'../../types';
import { api } from'../../services/api';
import { hasModuleAccess } from'../../utils/planPermissions';
import { AiSupportWidget, AiUsageCard } from'./AiUsageSupportWidget';

export interface DashboardWidgetGridProps {
 currentUser?: any;
 concerts: Concert[];
 rehearsals: Rehearsal[];
 leads: Lead[];
 tours?: Tour[];
 fans?: Fan[];
 posts?: SocialPost[];
 epkConfig?: Partial<EPKConfig>;
 activeBandName?: string;
 colors: ThemeColors;
 isStitchLight?: boolean;
 agendaFilterMode:'active' |'all';
 onSetAgendaFilterMode: (mode:'active' |'all') => void;
 onNavigate?: (view: string, options?: any) => void;
}

export function DashboardWidgetGrid({
 currentUser,
 concerts,
 rehearsals,
 leads,
 tours = [],
 fans = [],
 posts = [],
 epkConfig,
 activeBandName,
 colors,
 isStitchLight = false,
 agendaFilterMode,
 onSetAgendaFilterMode,
 onNavigate
}: DashboardWidgetGridProps) {
 const userPlan = currentUser?.plan;

 // Load saved widgets from user preferences or use default, filtering by module access
 const savedWidgets = currentUser?.ui_preferences?.dashboard_widgets as DashboardWidgetConfig[] | undefined;
 
 const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(() => {
 const initial = (Array.isArray(savedWidgets) && savedWidgets.length > 0) ? savedWidgets : DEFAULT_DASHBOARD_WIDGETS;
 return initial.filter(w => {
 const meta = AVAILABLE_MODULE_WIDGETS.find(m => m.type === w.type);
 if (meta && meta.requiredModule) {
 return hasModuleAccess(userPlan, meta.requiredModule);
 }
 return true;
 });
 });

 const [isEditMode, setIsEditMode] = useState(false);
 const [isAddModalOpen, setIsAddModalOpen] = useState(false);
 const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
 const [isSaving, setIsSaving] = useState(false);
 const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
 
 // Drag and drop state
 const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
 const [dragOverWidgetId, setDragOverWidgetId] = useState<string | null>(null);

 // Sync to database
 const saveLayoutToDb = async (newLayout: DashboardWidgetConfig[]) => {
 setIsSaving(true);
 try {
 await api.saveUiPreferences({ dashboard_widgets: newLayout });
 setSaveSuccessMsg(true);
 setTimeout(() => setSaveSuccessMsg(false), 2000);
 } catch (err) {
 console.error('Error al guardar disposición de widgets:', err);
 } finally {
 setIsSaving(false);
 }
 };

 const updateAndSaveWidgets = (newWidgets: DashboardWidgetConfig[]) => {
 const ordered = newWidgets.map((w, idx) => ({ ...w, order: idx }));
 setWidgets(ordered);
 saveLayoutToDb(ordered);
 };

 // Drag and drop handlers
 const handleDragStart = (e: React.DragEvent, id: string) => {
 setDraggedWidgetId(id);
 e.dataTransfer.effectAllowed ='move';
 e.dataTransfer.setData('text/plain', id);
 };

 const handleDragOver = (e: React.DragEvent, id: string) => {
 e.preventDefault();
 e.dataTransfer.dropEffect ='move';
 if (draggedWidgetId && draggedWidgetId !== id) {
 setDragOverWidgetId(id);
 }
 };

 const handleDragLeave = () => {
 setDragOverWidgetId(null);
 };

 const handleDrop = (e: React.DragEvent, targetId: string) => {
 e.preventDefault();
 if (!draggedWidgetId || draggedWidgetId === targetId) {
 setDraggedWidgetId(null);
 setDragOverWidgetId(null);
 return;
 }

 const copy = [...widgets];
 const fromIdx = copy.findIndex(w => w.id === draggedWidgetId);
 const toIdx = copy.findIndex(w => w.id === targetId);

 if (fromIdx !== -1 && toIdx !== -1) {
 const [movedItem] = copy.splice(fromIdx, 1);
 copy.splice(toIdx, 0, movedItem);
 updateAndSaveWidgets(copy);
 }

 setDraggedWidgetId(null);
 setDragOverWidgetId(null);
 };

 const handleDragEnd = () => {
 setDraggedWidgetId(null);
 setDragOverWidgetId(null);
 };

 // Move widget up/down manually
 const handleMoveWidget = (index: number, direction:'up' |'down') => {
 const targetIdx = direction ==='up' ? index - 1 : index + 1;
 if (targetIdx < 0 || targetIdx >= widgets.length) return;

 const copy = [...widgets];
 const temp = copy[index];
 copy[index] = copy[targetIdx];
 copy[targetIdx] = temp;

 updateAndSaveWidgets(copy);
 };

 // Change width span (wSpan)
 const handleChangeWSpan = (id: string, newSpan: 3 | 4 | 6 | 8 | 12) => {
 const updated = widgets.map(w => w.id === id ? { ...w, wSpan: newSpan } : w);
 updateAndSaveWidgets(updated);
 };

 // Change height mode (hSpan)
 const handleChangeHSpan = (id: string, newHSpan:'compact' |'normal' |'tall') => {
 const updated = widgets.map(w => w.id === id ? { ...w, hSpan: newHSpan } : w);
 updateAndSaveWidgets(updated);
 };

 // Remove widget
 const handleRemoveWidget = (id: string) => {
 const updated = widgets.filter(w => w.id !== id);
 updateAndSaveWidgets(updated);
 };

 // Update specific widget settings (e.g., calendar view mode)
 const handleUpdateWidgetSettings = (id: string, newSettings: Record<string, any>) => {
 const updated = widgets.map(w => {
 if (w.id === id) {
 return {
 ...w,
 settings: {
 ...(w.settings || {}),
 ...newSettings
 }
 };
 }
 return w;
 });
 updateAndSaveWidgets(updated);
 };

 // Reset to default, filtered by user module access
 const handleResetDefault = () => {
 const defaultAllowed = DEFAULT_DASHBOARD_WIDGETS.filter(w => {
 const meta = AVAILABLE_MODULE_WIDGETS.find(m => m.type === w.type);
 if (meta && meta.requiredModule) {
 return hasModuleAccess(userPlan, meta.requiredModule);
 }
 return true;
 });
 updateAndSaveWidgets(defaultAllowed);
 };

 // Add new widget from library
 const handleAddWidget = (type: WidgetType) => {
 const meta = AVAILABLE_MODULE_WIDGETS.find(m => m.type === type);
 if (!meta) return;

 if (meta.requiredModule && !hasModuleAccess(userPlan, meta.requiredModule)) {
 return;
 }

 const newWidget: DashboardWidgetConfig = {
 id: `${type}-${Date.now()}`,
 type,
 title: meta.title,
 wSpan: meta.defaultWSpan,
 hSpan: meta.defaultHSpan ||'normal',
 visible: true,
 order: widgets.length,
 settings: type ==='calendar' ? { calendarViewMode:'list', calendarFilter:'all' } : undefined
 };

 updateAndSaveWidgets([...widgets, newWidget]);
 setIsAddModalOpen(false);
 };

 const categories = ['Todos','Música & Repertorio','Booking & CRM','Calendario & Agenda','Negocio & Finanzas','Público & Redes','Promoción & IA'];

 // Filter available widgets in catalogue by module access according to current plan
 const allowedLibrary = AVAILABLE_MODULE_WIDGETS.filter(item => {
 if (!item.requiredModule) return true;
 return hasModuleAccess(userPlan, item.requiredModule);
 });

 const filteredLibrary = allowedLibrary.filter(item => {
 if (selectedCategory ==='Todos') return true;
 return item.category === selectedCategory;
 });

 // Render individual widget by type
 const renderWidgetContent = (widget: DashboardWidgetConfig) => {
 const heightMode = widget.hSpan ||'normal';

 switch (widget.type) {
 case'calendar':
 return (
 <CalendarWidget
 concerts={concerts}
 rehearsals={rehearsals}
 activeBandName={activeBandName}
 colors={colors}
 isStitchLight={isStitchLight}
 agendaFilterMode={agendaFilterMode}
 onSetAgendaFilterMode={onSetAgendaFilterMode}
 onNavigate={onNavigate}
 viewMode={widget.settings?.calendarViewMode ||'list'}
 onChangeViewMode={(mode) => handleUpdateWidgetSettings(widget.id, { calendarViewMode: mode })}
 filterType={widget.settings?.calendarFilter ||'all'}
 onChangeFilterType={(f) => handleUpdateWidgetSettings(widget.id, { calendarFilter: f })}
 isEditMode={isEditMode}
 />
 );
 case'repertorio_energy':
 return <RepertorioEnergyChartWidget onNavigate={onNavigate} heightMode={heightMode} />;
 case'crm_pipeline':
 return <CrmPipelineWidget leads={leads} onNavigate={onNavigate} isStitchLight={isStitchLight} />;
 case'booking_funnel_chart':
 return <BookingFunnelChartWidget leads={leads} onNavigate={onNavigate} heightMode={heightMode} />;
 case'finances_chart':
 return <FinancesChartWidget concerts={concerts} onNavigate={onNavigate} heightMode={heightMode} />;
 case'social_fans_chart':
 return <SocialFansGrowthWidget fans={fans} onNavigate={onNavigate} heightMode={heightMode} />;
 case'repertorio_summary':
 return <RepertorioWidget onNavigate={onNavigate} isStitchLight={isStitchLight} />;
 case'finances_summary':
 return <FinancesWidget concerts={concerts} onNavigate={onNavigate} isStitchLight={isStitchLight} />;
 case'social_fans':
 return <SocialFansWidget fans={fans} onNavigate={onNavigate} isStitchLight={isStitchLight} />;
 case'epk_status':
 return <EpkStatusWidget epkConfig={epkConfig} onNavigate={onNavigate} isStitchLight={isStitchLight} />;
 case'ai_agent_status':
 return <AiAgentWidget leads={leads} currentUser={currentUser} onNavigate={onNavigate} isStitchLight={isStitchLight} />;
 case'tour_status':
 return <TourStatusWidget tours={tours} onNavigate={onNavigate} isStitchLight={isStitchLight} />;
 default:
 return null;
 }
 };

 // Filter visible widgets sorted by order, enforcing module access
 const visibleWidgets = widgets
 .filter(w => {
 if (!w.visible) return false;
 const meta = AVAILABLE_MODULE_WIDGETS.find(m => m.type === w.type);
 if (meta && meta.requiredModule) {
 return hasModuleAccess(userPlan, meta.requiredModule);
 }
 return true;
 })
 .sort((a, b) => a.order - b.order);

 return (
 <div className="space-y-4 w-full">
 {/* Top Customization Bar */}
 <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-[var(--r-l)] bg-[var(--surface)]">
 <div className="flex items-center gap-3">
 <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--acc-soft)] text-[var(--acc-ink)]">
 <LayoutGrid className="w-5 h-5" />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <span className="text-sm font-semibold text-[var(--ink)]">
 Tu panel
 </span>
 <span className="text-[11px] px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--sunken)] text-[var(--ink-2)] font-medium">
 Arrastra para reordenar
 </span>
 </div>
 <p className="text-xs text-[var(--ink-2)] mt-0.5">
 {visibleWidgets.length} widgets activos · se guardan solos
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2 flex-wrap">
 {saveSuccessMsg && (
 <span className="text-xs text-[var(--ok)] bg-[var(--ok-soft)] px-2.5 py-1 rounded-[var(--r-pill)] flex items-center gap-1 animate-fade-in">
 <Check className="w-3.5 h-3.5" /> Guardado en BBDD
 </span>
 )}

 <button
 type="button"
 onClick={() => setIsEditMode(!isEditMode)}
 className={`px-4 py-2 rounded-[var(--r-pill)] text-xs font-semibold transition-[filter] cursor-pointer flex items-center gap-1.5 ${
 isEditMode
 ?'bg-[var(--acc)] text-[var(--on-acc)]'
 :'bg-[var(--sunken)] text-[var(--ink-2)] hover:brightness-110 hover:text-[var(--ink)]'
 }`}
 >
 <Settings className={`w-4 h-4 ${isEditMode ?'text-[var(--on-acc)]' :'text-[var(--acc-ink)]'}`} />
 <span>{isEditMode ?'Finalizar Edición' :'Personalizar Dashboard'}</span>
 </button>

 {isEditMode && (
 <>
 <button
 type="button"
 onClick={() => setIsAddModalOpen(true)}
 className="px-3.5 py-2 rounded-[var(--r-pill)] bg-[var(--acc-soft)] hover:brightness-95 text-[var(--acc-ink)] text-xs font-semibold transition-[filter] cursor-pointer flex items-center gap-1.5"
 >
 <Plus className="w-4 h-4" />
 <span>Añadir Widget</span>
 </button>

 <button
 type="button"
 onClick={handleResetDefault}
 className="px-3 py-2 rounded-[var(--r-pill)] bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)] text-xs transition-colors cursor-pointer flex items-center gap-1"
 title="Restablecer disposición por defecto"
 >
 <RotateCcw className="w-3.5 h-3.5" />
 <span className="hidden sm:inline">Por Defecto</span>
 </button>
 </>
 )}
 </div>
 </div>

 {/* Edit Mode Instructions Banner */}
 {isEditMode && (
 <div className="p-4 rounded-[var(--r-l)] bg-[var(--acc-soft)] text-[var(--acc-ink)] text-xs space-y-1.5">
 <div className="flex items-center gap-2 font-semibold text-[var(--acc-ink)]">
 <Info className="w-4 h-4 shrink-0" />
 <span>Modo de Edición Activo:</span>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] text-[var(--acc-ink)]/85 pt-1">
 <div className="flex items-center gap-1.5">
 <GripVertical className="w-3.5 h-3.5 text-[var(--acc-ink)] shrink-0" />
 <span><strong>Arrastra:</strong> Usa el asa para mover libremente.</span>
 </div>
 <div className="flex items-center gap-1.5">
 <Maximize2 className="w-3.5 h-3.5 text-[var(--acc-ink)] shrink-0" />
 <span><strong>Ancho & Alto:</strong> Ajusta el tamaño (25%, 50%, 100%).</span>
 </div>
 <div className="flex items-center gap-1.5">
 <Monitor className="w-3.5 h-3.5 text-[var(--acc-ink)] shrink-0" />
 <span><strong>Multi-dispositivo:</strong> En móvil se apila a 1 columna.</span>
 </div>
 </div>
 </div>
 )}

 {/* Main Grid Layout */}
 <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
 {visibleWidgets.map((widget, index) => {
 // Determine grid col span class
 let colSpanClass ='md:col-span-12';
 if (widget.wSpan === 3) colSpanClass ='md:col-span-3';
 else if (widget.wSpan === 4) colSpanClass ='md:col-span-4';
 else if (widget.wSpan === 6) colSpanClass ='md:col-span-6';
 else if (widget.wSpan === 8) colSpanClass ='md:col-span-8';

 const isDragging = draggedWidgetId === widget.id;
 const isDragOver = dragOverWidgetId === widget.id;

 return (
 <div
 key={widget.id}
 draggable={isEditMode}
 onDragStart={(e) => handleDragStart(e, widget.id)}
 onDragOver={(e) => handleDragOver(e, widget.id)}
 onDragLeave={handleDragLeave}
 onDrop={(e) => handleDrop(e, widget.id)}
 onDragEnd={handleDragEnd}
 className={`${colSpanClass} relative transition-all duration-200 ${
 isDragging ?'opacity-40 scale-[0.98]' :''
 } ${
 isDragOver ?'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#121214] rounded-[var(--r-l)] bg-[var(--acc)]/10' :''
 } ${
 isEditMode ?'ring-2 ring-amber-0/40 rounded-[var(--r-l)] p-1 bg-[var(--acc)]/5 hover:ring-amber-400' :''
 }`}
 >
 {/* Edit Controls Bar overlayed on widget when in Edit Mode */}
 {isEditMode && (
 <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-stone-950 p-2 rounded-t-xl mb-1 text-xs font-mono text-[var(--ink-2)] shadow-md gap-2">
 <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing">
 <GripVertical className="w-4 h-4 text-[var(--acc)] shrink-0" />
 <span className="font-bold text-[var(--acc)]/70 text-xs truncate max-w-[150px]">
 {widget.title || widget.type}
 </span>
 </div>

 <div className="flex items-center gap-1.5 flex-wrap justify-between sm:justify-end">
 {/* Width options */}
 <div className="flex items-center gap-0.5 bg-[var(--surface)]/80 border-[var(--hair)] p-0.5 rounded-[var(--r-s)] text-[10px]">
 <span className="text-[var(--ink-2)] px-1 font-bold">Ancho:</span>
 {([3, 4, 6, 8, 12] as const).map(spanVal => (
 <button
 key={spanVal}
 type="button"
 onClick={() => handleChangeWSpan(widget.id, spanVal)}
 className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
 widget.wSpan === spanVal
 ?'bg-[var(--acc)] text-[var(--on-acc)]'
 :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 {spanVal === 3 ?'25%' : spanVal === 4 ?'33%' : spanVal === 6 ?'50%' : spanVal === 8 ?'66%' :'100%'}
 </button>
 ))}
 </div>

 {/* Height options */}
 <div className="flex items-center gap-0.5 bg-[var(--surface)]/80 border-[var(--hair)] p-0.5 rounded-[var(--r-s)] text-[10px]">
 <span className="text-[var(--ink-2)] px-1 font-bold">Alto:</span>
 {(['compact','normal','tall'] as const).map(hVal => (
 <button
 key={hVal}
 type="button"
 onClick={() => handleChangeHSpan(widget.id, hVal)}
 className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
 (widget.hSpan ||'normal') === hVal
 ?'bg-[var(--acc)] text-[var(--ink)]'
 :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 {hVal ==='compact' ?'Bajo' : hVal ==='normal' ?'Med' :'Alto'}
 </button>
 ))}
 </div>

 {/* Order buttons */}
 <div className="flex items-center gap-0.5">
 <button
 type="button"
 onClick={() => handleMoveWidget(index,'up')}
 disabled={index === 0}
 className="p-1 rounded bg-[var(--surface)]/80 border-[var(--hair)] hover:bg-[var(--surface)]/80 text-[var(--ink-2)] disabled:opacity-30 cursor-pointer"
 title="Mover arriba"
 >
 <ArrowUp className="w-3.5 h-3.5" />
 </button>
 <button
 type="button"
 onClick={() => handleMoveWidget(index,'down')}
 disabled={index === visibleWidgets.length - 1}
 className="p-1 rounded bg-[var(--surface)]/80 border-[var(--hair)] hover:bg-[var(--surface)]/80 text-[var(--ink-2)] disabled:opacity-30 cursor-pointer"
 title="Mover abajo"
 >
 <ArrowDown className="w-3.5 h-3.5" />
 </button>
 </div>

 {/* Remove */}
 <button
 type="button"
 onClick={() => handleRemoveWidget(widget.id)}
 className="p-1 rounded bg-[var(--alert)]/15 text-[var(--alert)] hover:bg-[var(--alert)]/30 cursor-pointer"
 title="Quitar Widget"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 )}

 {/* Render actual widget */}
 {renderWidgetContent(widget)}
 </div>
 );
 })}
 </div>

 {/* WIDGET IMPRESCINDIBLE: APOYO A BANDMANAGER (NO SE PUEDE QUITAR) */}
 <div className="pt-2 space-y-3">
 {isEditMode && (
 <div className="px-3 py-1 rounded-[var(--r-s)] bg-[var(--acc)]/15 text-[var(--acc)]/70 text-[11px] font-mono font-bold flex items-center gap-1.5 w-fit">
 <Info className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
 <span>Módulo Fijo: Apoyo a BandManager (Permanente, no se puede quitar)</span>
 </div>
 )}
 <AiSupportWidget variant="card" />
 <AiUsageCard isStitchLight={isStitchLight} />
 </div>

 {/* MODAL / CATALOGO: AÑADIR NUEVO WIDGET */}
 {isAddModalOpen && (
 <div className="fixed inset-0 z-50 bg-[var(--scrim)]/80 backdrop-blur-sm flex items-center justify-center p-4">
 <div className="bg-[var(--surface)] rounded-[var(--r-l)] w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
 {/* Header */}
 <div className="p-5 border-b flex items-center justify-between">
 <div className="flex items-center gap-2.5">
 <div className="p-2 rounded-[var(--r-m)] bg-[var(--acc)]/15 text-[var(--acc)]">
 <Plus className="w-5 h-5" />
 </div>
 <div>
 <h3 className="text-lg font-bold font-display text-[var(--ink-2)]">
 Catálogo de Widgets del Dashboard
 </h3>
 <p className="text-xs font-mono text-[var(--ink-2)]">
 Selecciona módulos y gráficos para añadirlos a tu panel principal
 </p>
 </div>
 </div>

 <button
 type="button"
 onClick={() => setIsAddModalOpen(false)}
 className="p-2 rounded-[var(--r-m)] hover:bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)] transition-all cursor-pointer"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Category Filter Pills */}
 <div className="p-4 border-b /80 bg-[var(--surface)] flex gap-2 overflow-x-auto">
 {categories.map(cat => (
 <button
 key={cat}
 type="button"
 onClick={() => setSelectedCategory(cat)}
 className={`px-3 py-1.5 rounded-[var(--r-m)] text-xs font-mono font-bold whitespace-nowrap cursor-pointer transition-all ${
 selectedCategory === cat
 ?'bg-[var(--acc)] text-[var(--on-acc)] shadow-xs'
 :'bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink-2)]'
 }`}
 >
 {cat}
 </button>
 ))}
 </div>

 {/* List of Available Widgets */}
 <div className="p-5 overflow-y-auto space-y-3 flex-1">
 {filteredLibrary.map(item => {
 const isAlreadyAdded = widgets.some(w => w.type === item.type && w.visible);

 return (
 <div
 key={item.type}
 className="p-4 rounded-[var(--r-m)] bg-[var(--surface)] hover:/40 transition-all flex items-center justify-between gap-4"
 >
 <div className="space-y-1 min-w-0">
 <div className="flex items-center gap-2">
 <span className="text-sm font-bold text-[var(--ink-2)]">{item.title}</span>
 <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface)]/80 text-[var(--acc)]">
 {item.category}
 </span>
 </div>
 <p className="text-xs text-[var(--ink-2)] leading-relaxed">
 {item.description}
 </p>
 </div>

 <button
 type="button"
 onClick={() => handleAddWidget(item.type)}
 className="px-3.5 py-2 rounded-[var(--r-m)] bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--on-acc)] font-mono text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 active:scale-95 shadow-sm"
 >
 <Plus className="w-4 h-4" />
 <span>{isAlreadyAdded ?'Añadir Otro' :'Añadir'}</span>
 </button>
 </div>
 );
 })}
 </div>

 {/* Footer */}
 <div className="p-4 border-t bg-[var(--surface)] text-right">
 <button
 type="button"
 onClick={() => setIsAddModalOpen(false)}
 className="px-4 py-2 rounded-[var(--r-m)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] font-mono text-xs font-bold cursor-pointer"
 >
 Cerrar
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
