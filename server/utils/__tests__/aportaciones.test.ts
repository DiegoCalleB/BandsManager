import { describe, expect, it } from 'vitest';
import { validarAportacion } from '../aportaciones';

const base = { tipo: 'festival', ficha_id: 'low-festival', campo: 'ciudad', valor: 'Torrevieja', idioma: 'es' };

describe('validarAportacion', () => {
  it('acepta una aportación correcta y la limpia', () => {
    const r = validarAportacion({ ...base, valor: '  Torre<script>vieja ', fuente: 'https://lowfestival.es/', contacto: 'Ana@Ejemplo.ES' });
    expect(r).toMatchObject({ ok: true, aportacion: { tipo: 'festival', ficha_id: 'low-festival', campo: 'ciudad', valor: 'Torre script vieja', fuente: 'https://lowfestival.es/', contacto: 'ana@ejemplo.es' } });
  });
  it('un bot que rellena el campo trampa no se guarda', () => {
    expect(validarAportacion({ ...base, web: 'http://spam' })).toBeNull();
  });
  it('rechaza campos fuera de la lista, fichas raras, fuentes que no son enlace y emails inválidos', () => {
    expect(validarAportacion({ ...base, campo: 'precio' })).toMatchObject({ ok: false });
    expect(validarAportacion({ ...base, ficha_id: '../admin' })).toMatchObject({ ok: false });
    expect(validarAportacion({ ...base, fuente: 'javascript:alert(1)' })).toMatchObject({ ok: false });
    expect(validarAportacion({ ...base, contacto: 'no-es-email' })).toMatchObject({ ok: false });
    expect(validarAportacion({ ...base, valor: '' })).toMatchObject({ ok: false });
  });
  it('«ya no se celebra» no necesita valor y el error sale en el idioma de la página', () => {
    expect(validarAportacion({ ...base, campo: 'cerrado', valor: '' })).toMatchObject({ ok: true, aportacion: { valor: 'Ya no se celebra' } });
    expect(validarAportacion({ ...base, idioma: 'en', campo: 'x' })).toEqual({ ok: false, error: 'Choose what you want to add.' });
  });
});
