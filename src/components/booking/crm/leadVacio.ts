import type { LeadType } from '../../../types';

/** Ficha vacía con la que se abre «Añadir contacto», según la pestaña (escenarios, medios o grupos). */
export function leadVacio(sectionTab: string) {
  const medios = sectionTab === 'medios';
  const grupos = sectionTab === 'grupos';
  return {
    nombre_sala: '',
    ciudad: '',
    region: 'Nacional',
    direccion: '',
    aforo: 0,
    tipo: (medios ? 'medio' : grupos ? 'productora' : 'sala') as LeadType,
    email_contacto: '',
    email_secundario: '',
    telefono: '',
    telefono_movil: '',
    telefono_fijo: '',
    website: '',
    instagram: '',
    fuente: '',
    genero: medios ? 'Radio' : grupos ? 'Management / Booking' : 'Variado',
    notas: '',
    pitch_generado: '',
    icono: medios ? '📻' : grupos ? '💼' : '🏛️',
    imagen_url: '',
  };
}
