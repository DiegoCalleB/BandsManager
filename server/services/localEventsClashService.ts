/**
 * Servicio de Detección de Eventos Locales & Alerta de Solapamiento (Local Events & Clash Radar)
 * Detecta festividades locales, macroconciertos y eventos que puedan competir por la misma audiencia.
 */

export interface LocalEventsClashResult {
  eventos_detectados: Array<{
    nombre: string;
    tipo: 'festival' | 'fiesta_patronal' | 'macroconcierto' | 'festivo';
    fecha_aproximada: string;
    nivel_riesgo_solapamiento: 'alto' | 'medio' | 'bajo';
    descripcion: string;
  }>;
  alerta_resumen: string;
  fechas_favorables_sugeridas: string[];
}

// Catálogo de eventos estacionales de referencia por provincia / ciudad
const EVENTOS_CIUDADES: Record<string, Array<{ nombre: string; tipo: 'festival' | 'fiesta_patronal' | 'macroconcierto' | 'festivo'; mes: string; riesgo: 'alto' | 'medio' | 'bajo'; desc: string }>> = {
  madrid: [
    { nombre: 'Fiestas de San Isidro', tipo: 'fiesta_patronal', mes: 'Mayo (11-15)', riesgo: 'alto', desc: 'Conciertos gratuitos al aire libre en Pradera de San Isidro y Matadero.' },
    { nombre: 'Mad Cool Festival', tipo: 'festival', mes: 'Julio (1ª quincena)', riesgo: 'alto', desc: 'Gran festival de masas en Villaverde. Desaconsejado programar en salas el mismo fin de semana.' },
    { nombre: 'Fiestas de La Paloma', tipo: 'fiesta_patronal', mes: 'Agosto (12-15)', riesgo: 'medio', desc: 'Fiestas populares de barrio con alta afluencia nocturna en La Latina.' },
    { nombre: 'Puente de la Almudena', tipo: 'festivo', mes: 'Noviembre (9)', riesgo: 'bajo', desc: 'Excelente puente festivo local; gran afluencia a salas de concierto.' }
  ],
  barcelona: [
    { nombre: 'Festes de La Mercè', tipo: 'fiesta_patronal', mes: 'Septiembre (20-24)', riesgo: 'alto', desc: 'Conciertos masivos gratuitos BAM por toda la ciudad.' },
    { nombre: 'Primavera Sound', tipo: 'festival', mes: 'Finales de Mayo / Junio', riesgo: 'alto', desc: 'Concentración total de público indie/rock internacional en Parc del Fòrum.' },
    { nombre: 'Sónar Festival', tipo: 'festival', mes: 'Junio (mediados)', riesgo: 'medio', desc: 'Foco en electrónica y vanguardia; salas de rock tienen público alternativo.' }
  ],
  valencia: [
    { nombre: 'Las Fallas de Valencia', tipo: 'fiesta_patronal', mes: 'Marzo (15-19)', riesgo: 'alto', desc: 'La ciudad se vuelca en la calle las 24h. Salas cerradas o con público desviado a verbenas.' },
    { nombre: 'Festival de Les Arts', tipo: 'festival', mes: 'Junio (1ª semana)', riesgo: 'alto', desc: 'Gran concentración de bandas indie nacionales en la Ciudad de las Artes.' },
    { nombre: 'Gran Fira de Juliol', tipo: 'festival', mes: 'Julio', riesgo: 'medio', desc: 'Ciclo de conciertos en Viveros.' }
  ],
  sevilla: [
    { nombre: 'Feria de Abril', tipo: 'fiesta_patronal', mes: 'Abril / Mayo', riesgo: 'alto', desc: 'Toda la ciudad se desplaza al Real de la Feria. Muy difícil convocar en salas.' },
    { nombre: 'Semana Santa', tipo: 'fiesta_patronal', mes: 'Marzo / Abril', riesgo: 'alto', desc: 'Cortes de tráfico masivos y actividad cultural centrada en procesiones.' },
    { nombre: 'Interestelar Sevilla', tipo: 'festival', mes: 'Mayo (mediados)', riesgo: 'alto', desc: 'Festival indie en CAAC Monasterio de la Cartuja.' }
  ],
  bilbao: [
    { nombre: 'Aste Nagusia (Semana Grande)', tipo: 'fiesta_patronal', mes: 'Agosto (penúltima semana)', riesgo: 'alto', desc: 'Txosnas y conciertos masivos diarios.' },
    { nombre: 'Bilbao BBK Live', tipo: 'festival', mes: 'Julio (2ª semana)', riesgo: 'alto', desc: 'Festival en Kobetamendi; salas vacías durante el fin de semana.' }
  ],
  zaragoza: [
    { nombre: 'Fiestas del Pilar', tipo: 'fiesta_patronal', mes: 'Octubre (primera quincena)', riesgo: 'alto', desc: 'Espacio Zity e Interpeñas absorben el ocio nocturno.' }
  ],
  granada: [
    { nombre: 'Granada Sound', tipo: 'festival', mes: 'Septiembre (mediados)', riesgo: 'alto', desc: 'Macrofestival indie en Cortijo del Conde.' }
  ]
};

export async function detectLocalEventsAndClashes(
  ciudad: string = 'Madrid',
  generoBanda: string = 'Indie Rock'
): Promise<LocalEventsClashResult> {
  const normalizedCity = ciudad.toLowerCase().trim();
  
  let eventos = EVENTOS_CIUDADES[normalizedCity];
  
  if (!eventos || eventos.length === 0) {
    // Generación genérica para otras ciudades
    eventos = [
      {
        nombre: `Fiestas Patronales de ${ciudad}`,
        tipo: 'fiesta_patronal',
        mes: 'Primavera / Verano',
        riesgo: 'alto',
        desc: `Semana festiva principal del municipio con conciertos al aire libre.`
      },
      {
        nombre: `Temporada de Otoño / Fines de Semana Clave en ${ciudad}`,
        tipo: 'festivo',
        mes: 'Octubre - Noviembre',
        riesgo: 'bajo',
        desc: `Período con máxima respuesta de público en salas de circuito club.`
      }
    ];
  }

  const eventosFormateados = eventos.map(ev => ({
    nombre: ev.nombre,
    tipo: ev.tipo,
    fecha_aproximada: ev.mes,
    nivel_riesgo_solapamiento: ev.riesgo,
    descripcion: ev.desc
  }));

  const numAltos = eventosFormateados.filter(e => e.nivel_riesgo_solapamiento === 'alto').length;
  
  const alerta = numAltos > 0
    ? `⚠️ Se han detectado ${numAltos} eventos masivos en ${ciudad} que podrían canibalizar la taquilla si coinciden en el mismo fin de semana. Revisa las fechas antes de cerrar el contrato.`
    : `✓ Calendario despejado en ${ciudad}. No se registran macrofestivales que amenacen la venta de entradas en temporada regular.`;

  const fechasSugeridas = [
    'Octubre - Diciembre (Temporada de Otoño, alta concurrencia de club)',
    'Febrero - Mayo (Temporada de Primavera, antes de macrofestivales de verano)',
    'Viernes posterior a días de cobro (1 al 10 de mes)'
  ];

  return {
    eventos_detectados: eventosFormateados,
    alerta_resumen: alerta,
    fechas_favorables_sugeridas: fechasSugeridas
  };
}
