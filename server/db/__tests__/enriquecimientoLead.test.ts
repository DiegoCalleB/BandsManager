import { describe, it, expect } from 'vitest';
import { columnasDeEnriquecimiento } from '../enriquecimientoLead.js';

const AHORA = '2026-10-18T12:00:00.000Z';
const fuentes = { email_contacto: { fuente: 'ia', confianza: 'baja', en: AHORA } };

describe('columnasDeEnriquecimiento', () => {
  it('lo recibido manda sobre lo que ya había', () => {
    expect(columnasDeEnriquecimiento({ place_id: ' ChIJnuevo ' }, { place_id: 'ChIJviejo' }).place_id).toBe('ChIJnuevo');
  });

  it('si no llega nada se conserva lo que ya había: un cliente que no conoce los campos no los borra', () => {
    expect(columnasDeEnriquecimiento({}, { place_id: 'ChIJviejo', datos_fuentes: fuentes })).toEqual({ place_id: 'ChIJviejo', datos_fuentes: fuentes });
  });

  it('sin place_id en ningún sitio guarda null, no una cadena vacía', () => {
    expect(columnasDeEnriquecimiento({ place_id: '   ' }, null).place_id).toBeNull();
    expect(columnasDeEnriquecimiento({}).place_id).toBeNull();
  });

  it('sanea la procedencia que llega de fuera: campos y fuentes desconocidos fuera, y la confianza la fija la fuente', () => {
    const { datos_fuentes } = columnasDeEnriquecimiento({
      datos_fuentes: { email_contacto: { fuente: 'ia', confianza: 'alta', en: AHORA }, notas: { fuente: 'web', en: AHORA }, aforo: { fuente: 'magia', en: AHORA } },
    });
    expect(Object.keys(datos_fuentes)).toEqual(['email_contacto']);
    expect(datos_fuentes.email_contacto.confianza).toBe('baja');
  });

  it('place_id no textual se ignora', () => {
    expect(columnasDeEnriquecimiento({ place_id: { x: 1 } }, { place_id: 'ChIJviejo' }).place_id).toBe('ChIJviejo');
  });
});
