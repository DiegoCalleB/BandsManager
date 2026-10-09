import type { Analysis } from "../SetlistAIAnalysisModal";
/**
 * Estado de interfaz del módulo Repertorio: visibilidad de gráfico, menús, modales de IA, plan de Setlist Perfecto, deshacer y sugerencias.
 * Extraído de RepertorioSetlists.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars
*/
import { useState } from "react";
import { Setlist } from "../../../types";
import { SugerenciaChapa } from "../../../utils/setlistCompatibility";
import { PerfectSetlistPlan } from "../PerfectSetlistModal";

/**
 * Estado de interfaz del módulo Repertorio: visibilidad de gráfico, menús, modales de IA, plan de Setlist Perfecto, deshacer y sugerencias.
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useRepertorioViewState() {
  // Mostrar/ocultar el Mapa de Energía del Show (visible por defecto: es la pieza más"wow")
  const [showEnergyMap, setShowEnergyMap] = useState<boolean>(true);
  // Curva"ideal" de referencia superpuesta al Mapa de Energía — visible por defecto, con su
  // propio toggle porque puede distraer una vez que ya conoces bien tu propio repertorio.
  const [showIdealCurve, setShowIdealCurve] = useState<boolean>(true);
  // Apagada por defecto: superpuesta a la curva de energía (ya de por sí con varios colores +
  // curva ideal + avisos de choque), la línea de BPM saturaba demasiado el gráfico en pantallas
  // estrechas de móvil — se deja como opt-in para quien quiera mirarla en un momento concreto.
  const [showBpmLine, setShowBpmLine] = useState<boolean>(false);
  // A diferencia del BPM, la tonalidad se ve por defecto — es la que más pedía Diego. Con muchos
  // temas seguidos las etiquetas se pisan si no hay hueco: para eso está el botón 🎼 de un toque
  // (o el zoom 🔍) para ocultarla o separarla rápido.
  const [showTonalidad, setShowTonalidad] = useState<boolean>(true);
  //"Modo zoom": ensancha el gráfico (más separación horizontal entre puntos) dentro de un
  // contenedor con scroll propio, para poder leer BPM/tonalidad por tramos sin que se amontonen.
  const [chartZoom, setChartZoom] = useState<boolean>(false);
  // Mostrar u ocultar los indicadores de unión (ticks ✓ o aspas ✕) en el mapa de energía
  // Apagado por defecto: con el fix del yAxisId (ver EnergyChart) estas insignias ✓/✕ pasaron
  // de estar rotas en silencio a pintarse SIEMPRE, una por cada transición entre canciones
  // consecutivas — en un setlist normal eso es ruido constante encima de la curva. El toggle
  // de abajo ("✓ / ✕ Calidad de uniones") sigue ahí para quien las quiera activar.
  const [showTransitionBadges, setShowTransitionBadges] =
    useState<boolean>(false);
  // Ajustes secundarios del gráfico (curva ideal, leyenda de colores) agrupados en un solo menú
  //"⚙️" en vez de ir cada uno como botón/fila propia — demasiadas opciones sueltas a la vista era
  // justo la queja:"estamos empezando a crear un monstruo con demasiadas opciones en pantalla".
  const [showChartSettingsMenu, setShowChartSettingsMenu] = useState(false);
  // Punto de entrada único al asistente IA del repertorio — antes había dos botones lado a lado
  // (Análisis IA / Setlist Perfecto) sin que quedara claro cuál usar; ahora un solo botón abre un
  // selector con las dos opciones explicadas, cada una sigue siendo el flujo ya existente.
  const [showAssistantChooser, setShowAssistantChooser] = useState(false);
  // Avisos heurísticos plegados por defecto — antes ocupaban una fila siempre visible en pantalla
  // aunque no hubiera nada urgente que mirar.
  const [showHeuristicWarnings, setShowHeuristicWarnings] = useState(false);
  // Métricas secundarias del setlist (interludios, bloques, perfil de dinámica) plegadas: la fila
  // siempre visible se queda en las 3 que de verdad se miran (temas · duración · BPM). Antes las 5
  // pills + el badge de perfil iban en un flex-wrap que en móvil se convertía en 5-6 líneas
  // apiladas ANTES del gráfico — ver AGENTS.md §6 (simplicidad en pantalla).
  const [showSetlistStats, setShowSetlistStats] = useState(false);
  // Acciones secundarias del setlist (compartir, asignar a bolo, imprimir, editar detalles) en un
  // único menú"⋯" en vez de tres botones de texto permanentes: no se usan en la mayoría de visitas.
  const [showSetlistActionsMenu, setShowSetlistActionsMenu] = useState(false);
  // Acciones secundarias del catálogo (agrupar por álbum, nombres propios) en menú "⋯"
  const [showCatalogActionsMenu, setShowCatalogActionsMenu] = useState(false);
  // Reproducir el concierto dentro de la pestaña Repertorio con la consola del reproductor
  // (antes vivía en la pestaña Directo, ahora está embebida en Repertorio con toggle)
  const [showConcertPlayer, setShowConcertPlayer] = useState(false);
  // Modal de análisis avanzado con IA
  const [showAIAnalysisModal, setShowAIAnalysisModal] = useState(false);
  // Modal del plan de"Setlist Perfecto" (reordenar + añadir/quitar canciones del catálogo + bloques)
  const [showPerfectSetlistModal, setShowPerfectSetlistModal] = useState(false);
  // Modal para importar un repertorio ya impreso desde una foto o PDF, analizado con IA
  const [showImportSetlistModal, setShowImportSetlistModal] = useState(false);
  // El plan se genera y aplica sobre una COPIA del setlist activo (ver handleGeneratePerfectSetlist),
  // nunca sobre el original — este estado vive en el padre, no en el modal, precisamente porque
  // generar el plan cambia qué setlist está activo (duplicado) y el modal no debe reiniciarse
  // (perder el plan a medio aplicar) solo porque activeSetlistId cambió por su propia acción.
  const [perfectSetlistPlan, setPerfectSetlistPlan] =
    useState<PerfectSetlistPlan | null>(null);
  const [perfectSetlistLoading, setPerfectSetlistLoading] = useState(false);
  const [perfectSetlistError, setPerfectSetlistError] = useState<string | null>(
    null,
  );
  // Qué copia de trabajo ya existe para esta ronda de"Setlist Perfecto" — se especificó que
  //"Regenerar" no crease una copia nueva cada vez, así que se recuerda cuál ya se creó (por
  // ambos ids: el original del que salió y el propio id de la copia) y se reutiliza mientras no se
  // pida explícitamente una copia nueva. Solo se recuerda LA MÁS RECIENTE, no un historial por setlist.
  const [perfectSetlistDraft, setPerfectSetlistDraft] = useState<{
    originalSetlistId: string;
    draftSetlistId: string;
  } | null>(null);
  // Resultados del análisis IA guardados (para mostrar en la vista sin abrir modal)
  const [aiAnalysisResult, setAiAnalysisResult] = useState<Analysis | null>(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  // IDs de canciones a resaltar en el gráfico cuando se interactúa con sugerencias
  const [highlightedSongIds, setHighlightedSongIds] = useState<string[]>([]);
  // Snapshot del orden de items justo antes del ÚLTIMO reordenamiento (manual arrastrando, o por
  //"Aplicar" de un aviso/sugerencia) — permite un único"Deshacer" sobre ese cambio concreto.
  // Se sobrescribe con cada nuevo reordenamiento, así que solo cubre el más reciente, no un historial.
  // `sourceKey` identifica QUÉ acción generó este snapshot (p.ej."ai-suggestion-2") — así el botón
  //"Aplicar" de esa sugerencia concreta puede convertirse en"Deshacer" solo mientras siga siendo
  // la acción más reciente (la única que este snapshot de un solo nivel puede revertir de verdad).
  const [undoReorderSnapshot, setUndoReorderSnapshot] = useState<{
    setlistId: string;
    items: Setlist["items"];
    sourceKey: string;
  } | null>(null);
  // Mensaje breve tras"Optimizar orden" (mejora %, o"ya estaba bien") — se autodesvanece solo,
  // sin necesidad de un sistema de toasts global para un mensaje puntual como este.
  const [optimizeSummary, setOptimizeSummary] = useState<string | null>(null);
  // Sugerencia activa de"¿dónde meto una chapa?" — se queda fija (no se autodesvanece como el
  // resumen de arriba) hasta que el usuario la inserta o pide otra, porque trae una acción propia.
  const [chapaSuggestion, setChapaSuggestion] =
    useState<SugerenciaChapa | null>(null);

  return { setAiAnalysisResult, setHighlightedSongIds, perfectSetlistDraft, setPerfectSetlistDraft, setUndoReorderSnapshot, setChapaSuggestion, setOptimizeSummary, chapaSuggestion, setPerfectSetlistLoading, setPerfectSetlistError, setPerfectSetlistPlan, undoReorderSnapshot, setShowImportSetlistModal, setShowAIAnalysisModal, setShowPerfectSetlistModal, aiAnalysisResult, showSetlistStats, setShowSetlistStats, showEnergyMap, setShowEnergyMap, showChartSettingsMenu, setShowChartSettingsMenu, showIdealCurve, setShowIdealCurve, showBpmLine, setShowBpmLine, showTonalidad, setShowTonalidad, chartZoom, setChartZoom, showTransitionBadges, setShowTransitionBadges, showConcertPlayer, setShowConcertPlayer, optimizeSummary, highlightedSongIds, showHeuristicWarnings, setShowHeuristicWarnings, showCatalogActionsMenu, setShowCatalogActionsMenu, showAIAnalysisModal, setAiAnalysisLoading, showPerfectSetlistModal, perfectSetlistLoading, perfectSetlistPlan, perfectSetlistError, showImportSetlistModal };
}
