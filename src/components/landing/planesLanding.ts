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

export const PLANES_B2B: PlanLanding[] = [
  {
    id: 'agencia',
    nombre: 'Agencia',
    precio: t('Desde 149 € / mes', 'From €149 / month'),
    sub: t('≈ 10 € por banda', '≈ €10 per band'),
    para: t('Mánagers y agencias con una cartera pequeña.', 'Managers and small agencies.'),
    items: [
      t('Hasta 15 bandas en una sola cuenta', 'Up to 15 bands in a single account'),
      t('5.000 créditos IA al mes, compartidos', '5,000 AI credits a month, shared'),
      t('Hasta 5 personas del equipo', 'Up to 5 team members'),
      t('Panel y calendario conjuntos', 'Shared dashboard and calendar'),
      t('Soporte por email en 48 h', 'Email support within 48 h'),
    ],
  },
  {
    id: 'sello',
    nombre: 'Sello y Sala',
    precio: t('Desde 349 € / mes', 'From €349 / month'),
    sub: t('≈ 9 € por banda', '≈ €9 per band'),
    para: t('Sellos, salas, festivales y escuelas.', 'Labels, venues, festivals and schools.'),
    destacado: true,
    items: [
      t('Hasta 40 bandas o proyectos', 'Up to 40 bands or projects'),
      t('15.000 créditos IA al mes, compartidos', '15,000 AI credits a month, shared'),
      t('Hasta 15 personas del equipo con roles', 'Up to 15 team members with roles'),
      t('Agentes de booking en lote', 'Batch booking agents'),
      t('Puesta en marcha acompañada y soporte en 24 h', 'Guided onboarding and 24 h support'),
    ],
  },
  {
    id: 'corporativo',
    nombre: 'Corporativo',
    precio: t('A medida', 'Custom'),
    sub: t('contrato anual', 'annual contract'),
    para: t('Grandes agencias y grupos de comunicación.', 'Large agencies and media groups.'),
    items: [
      t('Bandas y equipo sin límite', 'Unlimited bands and team'),
      t('Créditos IA y modelos a acordar', 'AI credits and models to be agreed'),
      t('Tu propia clave de IA y dominio propio', 'Your own AI key and domain'),
      t('Condiciones de servicio acordadas', 'Agreed service levels'),
      t('Facturación por contrato', 'Invoicing by contract'),
    ],
  },
];
