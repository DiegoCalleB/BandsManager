/**
 * Regresión: `POST /api/leads/public-cultural-radar` devuelve `leads_publicos` (con `entidad_publica`,
 * `evento_o_ciclo`...), pero el cliente leía `oportunidades` y siempre mostraba "sin convocatorias".
 */
import { describe, expect, it } from 'vitest';
import { type OportunidadCultural,oportunidadCulturalAPlace } from '../placesModel';

const base: OportunidadCultural = {
  entidad_publica: 'Ayuntamiento de Guadalajara - Cultura',
  ciudad: 'Guadalajara',
  provincia: 'Guadalajara',
  comunidad_autonoma: 'Castilla-La Mancha',
  evento_o_ciclo: 'Verano Cultural',
  email_contacto: 'cultura@guadalajara.es',
  telefono_oficial: '949000000',
  tecnico_cultura_contacto: 'Ana',
  ventana_presentacion_dossier: 'Enero - Marzo',
  requisitos_contratacion: 'Alta en IAE',
  fuente: 'Boletín Oficial',
  fiabilidad: 'alta',
};

describe('oportunidadCulturalAPlace', () => {
  it('mapea la convocatoria del servidor a un resultado del explorador', () => {
    const r = oportunidadCulturalAPlace(base, 0, 'Madrid', 'Reggae');
    expect(r).toMatchObject({
      nombre_sala: 'Ayuntamiento de Guadalajara - Cultura',
      ciudad: 'Guadalajara',
      region: 'Guadalajara',
      telefono: '949000000',
      email_contacto: 'cultura@guadalajara.es',
      contacto_nombre: 'Ana',
      tipo: 'ayuntamiento',
      genero: 'Reggae',
      fuente: 'Radar Cultural Público (Boletín Oficial)',
    });
    expect(r.descripcion).toContain('Verano Cultural');
    expect(r.descripcion).toContain('Enero - Marzo');
  });

  it('usa la región consultada si faltan ciudad y provincia, y "sala" si no es un ayuntamiento', () => {
    const r = oportunidadCulturalAPlace({ ...base, entidad_publica: 'Fundación Teatro', ciudad: '', provincia: '' }, 1, 'Madrid', '');
    expect(r).toMatchObject({ ciudad: 'Madrid', region: 'Madrid', tipo: 'sala', genero: 'Cultural' });
  });
});
