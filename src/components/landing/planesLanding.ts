/**
 * Planes que enseña la landing TFM.
 *
 * B2C: los cuatro planes REALES de la app. Precios de `server/routes/billing.ts`, créditos de
 * `PLAN_CREDITS` y límites de `server/utils/planLimits.ts`: si cambian allí, cambian aquí.
 * B2B: propuesta comercial bajo contrato. No hay autoservicio ni cobro con tarjeta: se activan a mano
 * (el interruptor `suscripcion_habilitada` y los límites se acuerdan con cada cliente).
 */

export interface Texto {
  es: string;
  en: string;
}

export interface PlanLanding {
  id: string;
  nombre: string;
  precio: Texto;
  /** Línea bajo el precio: el anual, o a quién va dirigido. */
  sub: Texto;
  para: Texto;
  items: Array<Texto>;
  destacado?: boolean;
  /** Regalo de la primera suscripción (solo planes de pago de bandas). */
  regalo?: Texto;
}

const t = (es: string, en: string): Texto => ({ es, en });

export const PLANES_B2C: PlanLanding[] = [
  {
    id: 'ensayo',
    nombre: 'Ensayo',
    precio: t('0 €', '€0'),
    sub: t('para siempre', 'forever'),
    para: t('Para proyectos que empiezan a organizarse.', 'For projects just getting organised.'),
    items: [
      t('100 créditos IA al mes', '100 AI credits a month'),
      t('1 banda · 5 canciones', '1 band · 5 songs'),
      t('10 salas en el CRM · 10 fans', '10 venues in the CRM · 10 fans'),
      t('EPK, calendario y repertorio', 'EPK, calendar and repertoire'),
    ],
  },
  {
    id: 'local',
    nombre: 'Local',
    regalo: t('50 pegatinas de tu banda de regalo', '50 stickers of your band as a gift'),
    precio: t('12 € / mes', '€12 / month'),
    sub: t('o 115 € al año', 'or €115 a year'),
    para: t('Para bandas activas en su circuito local.', 'For active bands on their local circuit.'),
    items: [
      t('300 créditos IA al mes', '300 AI credits a month'),
      t('50 salas · 10 contactos de medios', '50 venues · 10 press contacts'),
      t('20 canciones · 100 fans', '20 songs · 100 fans'),
      t('Reels y Agente Mánager', 'Reels and Manager Agent'),
    ],
  },
  {
    id: 'de_gira',
    nombre: 'De Gira',
    regalo: t('100 pegatinas de tu banda de regalo', '100 stickers of your band as a gift'),
    precio: t('29 € / mes', '€29 / month'),
    sub: t('o 278 € al año', 'or €278 a year'),
    para: t('Para bandas de carretera y booking intensivo.', 'For touring bands and intensive booking.'),
    destacado: true,
    items: [
      t('800 créditos IA al mes', '800 AI credits a month'),
      t('Salas, medios, canciones y fans sin límite', 'Unlimited venues, press, songs and fans'),
      t('Tour Manager, Finanzas y Reels', 'Tour Manager, Finance and Reels'),
      t('Agente Mánager en lote', 'Batch Manager Agent'),
    ],
  },
  {
    id: 'cabeza_de_cartel',
    nombre: 'Cabeza de Cartel',
    regalo: t('200 pegatinas de regalo y envío exprés', '200 stickers as a gift and express shipping'),
    precio: t('79 € / mes', '€79 / month'),
    sub: t('o 758 € al año', 'or €758 a year'),
    para: t('Para artistas consolidados y mánagers.', 'For established artists and managers.'),
    items: [
      t('2.500 créditos IA al mes', '2,500 AI credits a month'),
      t('Hasta 5 bandas en una cuenta', 'Up to 5 bands in one account'),
      t('Todo ilimitado', 'Everything unlimited'),
      t('Agentes en paralelo y tu propia API key', 'Parallel agents and your own API key'),
    ],
  },
];

/**
 * Lógica de precio B2B: cuota base que incluye un cupo de bandas + precio por banda extra, siempre por
 * encima de lo que paga hoy una banda suelta (Cabeza de Cartel: 79 € / 5 bandas ≈ 16 € por banda).
 * Cada banda lleva 500 créditos de IA al mes, como en Cabeza de Cartel. Contrato anual: 10 meses al precio
 * de 12 meses cobrados (dos meses gratis) para asegurar permanencia.
 */
export const PLANES_B2B: PlanLanding[] = [
  {
    id: 'agencia',
    nombre: 'Agencia',
    precio: t('199 € / mes', '€199 / month'),
    sub: t('10 bandas incluidas · +15 € por banda extra', '10 bands included · +€15 per extra band'),
    para: t('Mánagers y productoras con una cartera en crecimiento.', 'Managers and producers with a growing roster.'),
    items: [
      t('Panel y calendario únicos para toda la cartera', 'One dashboard and calendar for the whole roster'),
      t('500 créditos IA al mes por banda, en bolsa común', '500 AI credits a month per band, in a shared pool'),
      t('Hasta 5 personas del equipo', 'Up to 5 team members'),
      t('Informe mensual por banda', 'Monthly report per band'),
      t('Soporte por email en 48 h', 'Email support within 48 h'),
    ],
  },
  {
    id: 'sello',
    nombre: 'Sello y Productora',
    precio: t('449 € / mes', '€449 / month'),
    sub: t('30 bandas incluidas · +12 € por banda extra', '30 bands included · +€12 per extra band'),
    para: t('Productoras, sellos, salas y festivales con muchas bandas.', 'Producers, labels, venues and festivals with many bands.'),
    destacado: true,
    items: [
      t('Todo lo de Agencia, hasta 15 personas con roles', 'Everything in Agency, up to 15 people with roles'),
      t('Agentes de booking en lote para toda la cartera', 'Batch booking agents across the whole roster'),
      t('Facturación única por cartera', 'One invoice for the whole roster'),
      t('Puesta en marcha acompañada', 'Guided onboarding'),
      t('Soporte en 24 h', '24 h support'),
    ],
  },
  {
    id: 'corporativo',
    nombre: 'Corporativo',
    precio: t('A medida', 'Custom'),
    sub: t('desde 50 bandas · contrato anual', 'from 50 bands · annual contract'),
    para: t('Grandes productoras y grupos de comunicación.', 'Large producers and media groups.'),
    items: [
      t('Bandas y equipo sin límite', 'Unlimited bands and team'),
      t('Créditos IA y modelos a acordar', 'AI credits and models to be agreed'),
      t('Tu propia clave de IA y dominio propio', 'Your own AI key and domain'),
      t('Condiciones de servicio acordadas', 'Agreed service levels'),
      t('Facturación por contrato', 'Invoicing by contract'),
    ],
  },
];
