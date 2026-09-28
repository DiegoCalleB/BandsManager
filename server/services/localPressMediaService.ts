/**
 * Servicio de Inteligencia de Medios Locales, Radios y Prensa Cultural (Local Press & Media Radar)
 * Identifica emisoras, fanzines y agendas culturales de la provincia de la sala para coordinar la promoción.
 */

export interface LocalPressMediaResult {
  medios: Array<{
    nombre: string;
    tipo: 'radio' | 'prensa_escrita' | 'blog_cultural' | 'agenda_local';
    alcance: 'provincial' | 'autonomico' | 'local';
    contacto_sugerido?: string;
    canal: string;
  }>;
  resumen_cobertura: string;
  plantilla_nota_prensa_hook: string;
}

const MEDIOS_PROVINCIA: Record<string, Array<{ nombre: string; tipo: 'radio' | 'prensa_escrita' | 'blog_cultural' | 'agenda_local'; alcance: 'provincial' | 'autonomico' | 'local'; canal: string; contacto?: string }>> = {
  madrid: [
    { nombre: 'Radio 3 (RNE Madrid)', tipo: 'radio', alcance: 'autonomico', canal: 'FM 93.2 / Web', contacto: 'programas_musica@rtve.es' },
    { nombre: 'MondoSonoro Madrid', tipo: 'prensa_escrita', alcance: 'autonomico', canal: 'Revista & Web', contacto: 'redaccion.madrid@mondosonoro.com' },
    { nombre: 'Mata Sano / Shook Down', tipo: 'blog_cultural', alcance: 'local', canal: 'Web Indie & Podcasts' },
    { nombre: 'Time Out Madrid (Música)', tipo: 'agenda_local', alcance: 'local', canal: 'Web & Redes' }
  ],
  barcelona: [
    { nombre: 'iCat FM / Catalunya Ràdio', tipo: 'radio', alcance: 'autonomico', canal: 'FM 102.8', contacto: 'musica@icat.cat' },
    { nombre: 'MondoSonoro Catalunya', tipo: 'prensa_escrita', alcance: 'autonomico', canal: 'Edición mensual papel & web' },
    { nombre: 'Indie Lovers Radio', tipo: 'radio', alcance: 'local', canal: 'FM / Podcast' },
    { nombre: 'Time Out Barcelona', tipo: 'agenda_local', alcance: 'local', canal: 'Guía de ocio y salas' }
  ],
  valencia: [
    { nombre: 'À Punt Ràdio (Territori Sonor)', tipo: 'radio', alcance: 'autonomico', canal: 'FM 102.2', contacto: 'musica@apuntmedia.es' },
    { nombre: 'Redacción Atómica', tipo: 'blog_cultural', alcance: 'provincial', canal: 'Web musical & conciertos' },
    { nombre: 'MondoSonoro C. Valenciana', tipo: 'prensa_escrita', alcance: 'autonomico', canal: 'Papel & Web' },
    { nombre: 'Urban Valencia (Levante-EMV)', tipo: 'agenda_local', alcance: 'provincial', canal: 'Suplemento cultural' }
  ],
  sevilla: [
    { nombre: 'Canal Fiesta Radio / Radio Andalucía', tipo: 'radio', alcance: 'autonomico', canal: 'FM 103.9' },
    { nombre: 'Música en Sevilla (El Giraldillo)', tipo: 'agenda_local', alcance: 'provincial', canal: 'Guía cultural' },
    { nombre: 'MondoSonoro Sur', tipo: 'prensa_escrita', alcance: 'autonomico', canal: 'Edición Sur' }
  ],
  bilbao: [
    { nombre: 'Gaztea Irratia (EITB)', tipo: 'radio', alcance: 'autonomico', canal: 'FM 94.7', contacto: 'gaztea@eitb.eus' },
    { nombre: 'Zarata MondoSonoro', tipo: 'prensa_escrita', alcance: 'autonomico', canal: 'Edición Euskadi/Navarra' },
    { nombre: 'Kulturklik Euskadi', tipo: 'agenda_local', alcance: 'autonomico', canal: 'Portal de eventos' }
  ]
};

export async function findLocalPressAndMedia(
  ciudad: string = 'Madrid',
  nombreSala: string = 'Sala',
  nombreBanda: string = 'La Banda'
): Promise<LocalPressMediaResult> {
  const normalizedCity = ciudad.toLowerCase().trim();
  let medios = MEDIOS_PROVINCIA[normalizedCity];

  if (!medios || medios.length === 0) {
    medios = [
      {
        nombre: `Cadena SER ${ciudad} (Hoy por Hoy Cultura)`,
        tipo: 'radio',
        alcance: 'provincial',
        canal: 'FM Local',
        contacto: `cultura.${normalizedCity}@cadenaser.com`
      },
      {
        nombre: `MondoSonoro Edición Regional (${ciudad})`,
        tipo: 'prensa_escrita',
        alcance: 'autonomico',
        canal: 'Web & Revista'
      },
      {
        nombre: `Agenda de Ocio y Conciertos de ${ciudad}`,
        tipo: 'agenda_local',
        alcance: 'local',
        canal: 'Guía digital'
      }
    ];
  }

  const hook = `Nota de prensa: "${nombreBanda} aterriza en ${ciudad} para presentar su directo en ${nombreSala}". Enviar con 15 días de margen a agendas culturales y programas de radio locales.`;

  return {
    medios: medios.map(m => ({
      nombre: m.nombre,
      tipo: m.tipo,
      alcance: m.alcance,
      contacto_sugerido: m.contacto || `prensa@${m.nombre.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      canal: m.canal
    })),
    resumen_cobertura: `Se han identificado ${medios.length} canales clave en ${ciudad} entre radios, fanzines y agendas culturales para maximizar la convocatoria local.`,
    plantilla_nota_prensa_hook: hook
  };
}
