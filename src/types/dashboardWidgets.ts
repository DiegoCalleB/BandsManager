export type WidgetType =
  | 'calendar'
  | 'executive_summary'
  | 'repertorio_energy'
  | 'crm_pipeline'
  | 'booking_funnel_chart'
  | 'finances_chart'
  | 'social_fans_chart'
  | 'repertorio_summary'
  | 'finances_summary'
  | 'social_fans'
  | 'epk_status'
  | 'ai_agent_status'
  | 'tour_status'
  | 'growth_guidance';

export type CalendarWidgetViewMode = 'list' | 'mini_month' | 'weekly_grid';

export interface DashboardWidgetConfig {
  id: string;
  type: WidgetType;
  title?: string;
  wSpan: 3 | 4 | 6 | 8 | 12; // Grid column span out of 12 (12 = full, 6 = half, 4 = 1/3)
  hSpan?: 'compact' | 'normal' | 'tall'; // Height mode
  visible: boolean;
  order: number;
  settings?: {
    calendarViewMode?: CalendarWidgetViewMode;
    calendarFilter?: 'all' | 'concierto' | 'ensayo';
    [key: string]: any;
  };
}

/**
 * Clean & minimal default selection for new users
 * Only the most essential widgets by default as requested.
 */
export const DEFAULT_DASHBOARD_WIDGETS: DashboardWidgetConfig[] = [
  {
    id: 'calendar-widget-main',
    type: 'calendar',
    title: 'Próximas Fechas y Agenda',
    wSpan: 12,
    hSpan: 'normal',
    visible: true,
    order: 0,
    settings: {
      calendarViewMode: 'list',
      calendarFilter: 'all',
    },
  },
  {
    id: 'executive-summary-widget',
    type: 'executive_summary',
    title: 'Resumen Ejecutivo',
    wSpan: 12,
    hSpan: 'compact',
    visible: true,
    order: 1,
  },
  {
    id: 'repertorio-energy-widget',
    type: 'repertorio_energy',
    title: 'Flujo de Energía del Repertorio',
    wSpan: 6,
    hSpan: 'normal',
    visible: true,
    order: 2,
  },
  {
    id: 'crm-pipeline-widget',
    type: 'crm_pipeline',
    title: 'Borradores & Acciones CRM',
    wSpan: 6,
    hSpan: 'normal',
    visible: true,
    order: 3,
  },
  {
    id: 'booking-funnel-chart-widget',
    type: 'booking_funnel_chart',
    title: 'Embudo de Contrataciones',
    wSpan: 6,
    hSpan: 'normal',
    visible: true,
    order: 4,
  },
  {
    id: 'finances-chart-widget',
    type: 'finances_chart',
    title: 'Evolución Financiera & Cachés',
    wSpan: 6,
    hSpan: 'normal',
    visible: true,
    order: 5,
  },
];

export interface ModuleWidgetMeta {
  type: WidgetType;
  title: string;
  category: 'Calendario & Agenda' | 'Booking & CRM' | 'Música & Repertorio' | 'Negocio & Finanzas' | 'Público & Redes' | 'Promoción & IA';
  description: string;
  defaultWSpan: 3 | 4 | 6 | 8 | 12;
  defaultHSpan?: 'compact' | 'normal' | 'tall';
  iconName: string;
  requiredModule: string;
}

export const AVAILABLE_MODULE_WIDGETS: ModuleWidgetMeta[] = [
  {
    type: 'calendar',
    title: 'Agenda & Calendario',
    category: 'Calendario & Agenda',
    description: 'Próximas fechas, vista mensual en miniatura y agenda semanal de conciertos y ensayos.',
    defaultWSpan: 12,
    defaultHSpan: 'normal',
    iconName: 'Calendar',
    requiredModule: 'calendario',
  },
  {
    type: 'executive_summary',
    title: 'Resumen Ejecutivo',
    category: 'Calendario & Agenda',
    description: 'Los 4 números que se miran antes que nada: próximo show, caché por cobrar, leads esperando respuesta y próximo ensayo.',
    defaultWSpan: 12,
    defaultHSpan: 'compact',
    iconName: 'Sparkles',
    requiredModule: 'resumen',
  },
  {
    type: 'repertorio_energy',
    title: 'Gráfico de Energía de Repertorio',
    category: 'Música & Repertorio',
    description: 'Curva de energía por canción (pacing) de tus setlists para planificar la intensidad del directo.',
    defaultWSpan: 6,
    defaultHSpan: 'normal',
    iconName: 'Zap',
    requiredModule: 'repertorio',
  },
  {
    type: 'crm_pipeline',
    title: 'Borradores & Acciones de Booking',
    category: 'Booking & CRM',
    description: 'Leads urgentes por responder, borradores redactados por la IA y salas interesadas.',
    defaultWSpan: 6,
    defaultHSpan: 'normal',
    iconName: 'Building2',
    requiredModule: 'booking',
  },
  {
    type: 'booking_funnel_chart',
    title: 'Gráfico Embudo de Booking',
    category: 'Booking & CRM',
    description: 'Porcentaje de conversión de contactos a fechas confirmadas y estado de negociaciones.',
    defaultWSpan: 6,
    defaultHSpan: 'normal',
    iconName: 'TrendingUp',
    requiredModule: 'booking',
  },
  {
    type: 'finances_chart',
    title: 'Gráfico Financiero & Caché',
    category: 'Negocio & Finanzas',
    description: 'Evolución de ingresos, gastos y caché promedio negociado por concierto.',
    defaultWSpan: 6,
    defaultHSpan: 'normal',
    iconName: 'DollarSign',
    requiredModule: 'finanzas',
  },
  {
    type: 'social_fans_chart',
    title: 'Gráfico Captación Fans & QR',
    category: 'Público & Redes',
    description: 'Evolución temporal del registro de seguidores y escaneos de código QR en directo.',
    defaultWSpan: 6,
    defaultHSpan: 'normal',
    iconName: 'Users',
    requiredModule: 'fans',
  },
  {
    type: 'repertorio_summary',
    title: 'Resumen Canciones & Setlists',
    category: 'Música & Repertorio',
    description: 'Catálogo de temas, estado de ensayo por músico y accesos a listas.',
    defaultWSpan: 4,
    defaultHSpan: 'normal',
    iconName: 'Music',
    requiredModule: 'repertorio',
  },
  {
    type: 'finances_summary',
    title: 'Balance Contable Compacto',
    category: 'Negocio & Finanzas',
    description: 'Resumen rápido de entradas, gastos y recaudación total de conciertos.',
    defaultWSpan: 4,
    defaultHSpan: 'compact',
    iconName: 'DollarSign',
    requiredModule: 'finanzas',
  },
  {
    type: 'social_fans',
    title: 'Resumen Redes & Fans',
    category: 'Público & Redes',
    description: 'Métricas de crecimiento en redes sociales, QR de fans y registros.',
    defaultWSpan: 6,
    defaultHSpan: 'normal',
    iconName: 'Users',
    requiredModule: 'fans',
  },
  {
    type: 'ai_agent_status',
    title: 'Agente Mánager IA',
    category: 'Promoción & IA',
    description: 'Resumen de propuestas agénticas creadas, créditos y autónomo activo.',
    defaultWSpan: 4,
    defaultHSpan: 'compact',
    iconName: 'Bot',
    requiredModule: 'resumen',
  },
  {
    type: 'epk_status',
    title: 'Estado Dossier EPK',
    category: 'Promoción & IA',
    description: 'Completitud de dossier de prensa, fotos y enlaces públicos.',
    defaultWSpan: 6,
    defaultHSpan: 'compact',
    iconName: 'BookOpen',
    requiredModule: 'epk',
  },
  {
    type: 'tour_status',
    title: 'Giras & Logística',
    category: 'Calendario & Agenda',
    description: 'Próximas paradas de gira y mapa de salas.',
    defaultWSpan: 6,
    defaultHSpan: 'normal',
    iconName: 'Truck',
    requiredModule: 'giras',
  },
  {
    type: 'growth_guidance',
    title: 'Guía de Crecimiento & Promoción',
    category: 'Promoción & IA',
    description: 'Plan proactivo semanal y recomendaciones paso a paso para llenar conciertos y ganar audiencia.',
    defaultWSpan: 6,
    defaultHSpan: 'normal',
    iconName: 'Rocket',
    requiredModule: 'reels',
  },
];
