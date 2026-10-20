/** Nodos del grafo del subsistema de choques del calendario (aparte para no inflar el generador). */
import type { GraphNode } from './generate_obsidian_graph';

export const NODOS_CALENDARIO: GraphNode[] = [
  {
    id: 'util_calendar_conflicts',
    title: 'Detector de choques del calendario',
    layer: 'service',
    domain: 'booking',
    file: 'src/utils/calendarConflicts.ts',
    description: 'Detector puro y determinista (cliente + servidor): solapes, margen corto, viaje inviable y mismo día. Un choque exige una persona en ambos sitios. Redacta datos de otras bandas.',
    linksTo: ['util_viaje_estimado', 'sec_trust_boundary'],
    tags: ['calendar', 'conflicts', 'pure']
  },
  {
    id: 'util_viaje_estimado',
    title: 'Estimador de viaje offline',
    layer: 'service',
    domain: 'booking',
    file: 'src/utils/viajeEstimado.ts',
    description: 'Tabla de ~60 ciudades + haversine x1,25 a 85 km/h; vuelo/ferry fijo para islas. Sin red ni IA, para que sea determinista.',
    linksTo: [],
    tags: ['calendar', 'travel']
  },
  {
    id: 'service_calendar_conflicts',
    title: 'Avisos de choques por email',
    layer: 'service',
    domain: 'booking',
    file: 'server/services/calendarConflictService.ts',
    description: 'Revisión con debounce de 20 s tras guardar eventos y barrido diario. Un email por (usuario, huella); los líderes reciben texto redactado.',
    linksTo: ['util_calendar_conflicts', 'db_calendar_conflicts', 'route_calendar_conflicts', 'sec_trust_boundary'],
    tags: ['calendar', 'email', 'scheduler']
  },
  {
    id: 'db_calendar_conflicts',
    title: 'Persistencia de avisos de choque',
    layer: 'db',
    domain: 'booking',
    file: 'server/db/calendarConflicts.ts',
    description: 'Miembros por banda, bandas de un usuario y tabla calendar_conflict_notifications para no repetir avisos.',
    linksTo: ['schema_supabase'],
    tags: ['calendar', 'db']
  },
  {
    id: 'route_calendar_conflicts',
    title: 'GET /api/calendar/conflicts',
    layer: 'route',
    domain: 'booking',
    file: 'server/routes/concerts.ts',
    description: 'Devuelve los choques visibles para el usuario (ya redactados) y programa la revisión tras crear o editar conciertos y ensayos.',
    linksTo: ['util_calendar_conflicts', 'service_calendar_conflicts', 'sec_trust_boundary'],
    tags: ['calendar', 'route']
  },
  {
    id: 'ui_calendar_conflicts',
    title: 'Avisos de choque en el calendario',
    layer: 'frontend',
    domain: 'booking',
    file: 'src/components/calendar/useCalendarConflicts.ts',
    description: 'Hook (detección local + cruce de bandas del servidor), banner, triángulo por día y sección en la ficha del evento (CalendarEventConflicts).',
    linksTo: ['util_calendar_conflicts', 'route_calendar_conflicts'],
    tags: ['ui', 'calendar']
  }
];

/** Sección del índice del grafo para este subsistema. */
export const INDICE_CALENDARIO = `### 📅 Calendario & Choques
- [[ui_calendar_conflicts|Avisos en el calendario]]
- [[util_calendar_conflicts|Detector de choques]]
- [[util_viaje_estimado|Estimador de viaje]]
- [[service_calendar_conflicts|Avisos por email]]
- [[db_calendar_conflicts|Persistencia de avisos]]
- [[route_calendar_conflicts|GET /api/calendar/conflicts]]

`;
