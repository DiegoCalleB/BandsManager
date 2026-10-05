/**
 * Servicio de Inteligencia de Ventana de Programación & Calendario (Booking Window & Lead Time)
 * Analiza la antelación recomendada para cerrar fechas, días ideales de la semana y estado del calendario.
 */

export interface BookingWindowResult {
  antelacion_meses_recomendada: number;
  meses_cierre_temporada: string[];
  dias_semana_ideales: string[];
  estado_calendario_estimado: 'abierto' | 'llenandose' | 'casi_cerrado' | 'fuera_de_temporada';
  consejo_antelacion: string;
  ventana_optima_pitch: string;
}

export async function calculateBookingWindow(
  nombreSala: string,
  tipo: string = 'sala',
  aforo: number = 200,
  ciudad: string = 'Madrid'
): Promise<BookingWindowResult> {
  const isFestival = tipo.toLowerCase().includes('festival');
  const isTeatro = tipo.toLowerCase().includes('teatro') || tipo.toLowerCase().includes('auditorio');
  const isSalaGrande = aforo > 500;

  let antelacion = 3;
  let diasIdeales = ['Viernes', 'Sábado'];
  let mesesCierre = ['Julio', 'Agosto'];
  let estado: 'abierto' | 'llenandose' | 'casi_cerrado' | 'fuera_de_temporada' = 'llenandose';

  if (isFestival) {
    antelacion = 6;
    diasIdeales = ['Jueves', 'Viernes', 'Sábado', 'Domingo'];
    mesesCierre = ['Enero', 'Febrero'];
    estado = 'llenandose';
  } else if (isTeatro) {
    antelacion = 4;
    diasIdeales = ['Sábado', 'Domingo'];
    mesesCierre = ['Agosto'];
    estado = 'abierto';
  } else if (isSalaGrande) {
    antelacion = 4;
    diasIdeales = ['Viernes', 'Sábado'];
    mesesCierre = ['Julio', 'Agosto'];
    estado = 'casi_cerrado';
  } else {
    // Sala media/pequeña
    antelacion = 2;
    diasIdeales = ['Jueves', 'Viernes', 'Sábado'];
    mesesCierre = ['Agosto'];
    estado = 'abierto';
  }

  const currentDate = new Date();
  const targetDateStart = new Date(currentDate);
  targetDateStart.setMonth(currentDate.getMonth() + antelacion);
  const targetDateEnd = new Date(targetDateStart);
  targetDateEnd.setMonth(targetDateStart.getMonth() + 2);

  const monthsEs = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const ventanaStr = `${monthsEs[targetDateStart.getMonth()]} - ${monthsEs[targetDateEnd.getMonth()]} ${targetDateStart.getFullYear()}`;

  let consejo = '';
  if (isFestival) {
    consejo = `Los festivales cierran cartel con 6 a 9 meses de margen. Si contactas ahora, solicita slots de tarde/noche para la edición de ${ventanaStr}.`;
  } else if (isSalaGrande) {
    consejo = `Salas con aforo +${aforo} pax suelen tener los fines de semana cerrados a 4 meses vista. Es aconsejable proponer 2-3 opciones de fechas en ${ventanaStr}.`;
  } else {
    consejo = `Para ${nombreSala} (${ciudad}), la ventana ideal para enviar propuesta y bloquear fecha con garantías es de ${antelacion} meses vista (${ventanaStr}). Los ${diasIdeales.join(' y ')} concentran el 85% de la taquilla.`;
  }

  return {
    antelacion_meses_recomendada: antelacion,
    meses_cierre_temporada: mesesCierre,
    dias_semana_ideales: diasIdeales,
    estado_calendario_estimado: estado,
    consejo_antelacion: consejo,
    ventana_optima_pitch: ventanaStr
  };
}
