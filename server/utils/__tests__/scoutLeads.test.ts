import { describe, it, expect } from 'vitest';
import {
  esLeadDescubiertoValido,
  limpiarCampoContacto,
  normalizarLeadDescubierto,
  prepararLeadsDescubiertos,
} from '../scoutLeads';

describe('esLeadDescubiertoValido', () => {
  it('acepta un recinto con nombre propio', () => {
    expect(esLeadDescubiertoValido({ nombre_sala: 'Sala Caracol' })).toBe(true);
  });

  it('rechaza lo que no tiene nombre', () => {
    expect(esLeadDescubiertoValido({ nombre_sala: '' })).toBe(false);
    expect(esLeadDescubiertoValido({ nombre_sala: '   ' })).toBe(false);
    expect(esLeadDescubiertoValido({})).toBe(false);
    expect(esLeadDescubiertoValido(null)).toBe(false);
    expect(esLeadDescubiertoValido('Sala Caracol')).toBe(false);
    expect(esLeadDescubiertoValido({ nombre_sala: 123 })).toBe(false);
  });

  it('rechaza el nombre de relleno de la propia plantilla del prompt', () => {
    // Si el modelo devuelve literalmente el ejemplo del prompt, no es un recinto.
    expect(esLeadDescubiertoValido({ nombre_sala: 'Nombre de la sala' })).toBe(false);
  });
});

describe('limpiarCampoContacto', () => {
  it('deja pasar un dato real', () => {
    expect(limpiarCampoContacto('booking@salacaracol.es')).toBe('booking@salacaracol.es');
    expect(limpiarCampoContacto( '  +34 915 27 35 94  ')).toBe('+34 915 27 35 94');
  });

  it('vacía los rellenos que suelta el modelo cuando no sabe el dato', () => {
    // Son literalmente los ejemplos del prompt: si vuelven, es que no lo sabía.
    expect(limpiarCampoContacto('booking@sala.com')).toBe('');
    expect(limpiarCampoContacto('+34 900 000 000')).toBe('');
    expect(limpiarCampoContacto('https://sala.com')).toBe('');
    expect(limpiarCampoContacto('@sala_oficial')).toBe('');
    expect(limpiarCampoContacto('N/A')).toBe('');
    expect(limpiarCampoContacto('desconocido')).toBe('');
  });

  it('vacía los ejemplos de la plantilla actual del prompt del Scout (routes/agent.ts)', () => {
    expect(limpiarCampoContacto('+34 000 000 000')).toBe('');
    expect(limpiarCampoContacto('@usuario_oficial')).toBe('');
    expect(limpiarCampoContacto('https://sitio-oficial.com')).toBe('');
    expect(esLeadDescubiertoValido({ nombre_sala: 'Nombre oficial exacto' })).toBe(false);
  });

  it('vacía cualquier teléfono hecho solo de ceros, con o sin prefijo', () => {
    expect(limpiarCampoContacto('000 00 00 00')).toBe('');
    expect(limpiarCampoContacto('+351 000 000 000')).toBe('');
    expect(limpiarCampoContacto('+34 959 21 01 00')).toBe('+34 959 21 01 00');
  });

  it('vacía lo que no es texto', () => {
    expect(limpiarCampoContacto(undefined)).toBe('');
    expect(limpiarCampoContacto(null)).toBe('');
    expect(limpiarCampoContacto(42)).toBe('');
  });
});

describe('normalizarLeadDescubierto', () => {
  it('nunca inventa: los huecos se quedan vacíos', () => {
    const r = normalizarLeadDescubierto({ nombre_sala: 'Sala Caracol' }, 'Madrid', 'sala');
    expect(r.email_contacto).toBe('');
    expect(r.telefono).toBe('');
    expect(r.instagram).toBe('');
    expect(r.website).toBe('');
    expect(r.aforo).toBe(0);
  });

  it('el aforo desconocido queda a 0, no a un número a dedo', () => {
    expect(normalizarLeadDescubierto({ nombre_sala: 'X', aforo: 'no sé' }, 'Madrid', 'sala').aforo).toBe(0);
    expect(normalizarLeadDescubierto({ nombre_sala: 'X', aforo: -5 }, 'Madrid', 'sala').aforo).toBe(0);
    expect(normalizarLeadDescubierto({ nombre_sala: 'X', aforo: 450 }, 'Madrid', 'sala').aforo).toBe(450);
  });

  it('conserva los datos reales y cae a la ciudad pedida si falta', () => {
    const r = normalizarLeadDescubierto(
      { nombre_sala: '  Sala Caracol  ', ciudad: 'Madrid', email_contacto: 'hola@caracol.es' },
      'Ávila', 'sala'
    );
    expect(r.nombre_sala).toBe('Sala Caracol');
    expect(r.ciudad).toBe('Madrid');
    expect(r.email_contacto).toBe('hola@caracol.es');
    expect(normalizarLeadDescubierto({ nombre_sala: 'X' }, 'Ávila', 'festival').ciudad).toBe('Ávila');
    expect(normalizarLeadDescubierto({ nombre_sala: 'X' }, 'Ávila', 'festival').tipo).toBe('festival');
  });
});

describe('prepararLeadsDescubiertos', () => {
  it('devolver un array vacío es una respuesta válida', () => {
    // Este es el punto de todo el módulo: antes, "nada" se convertía en una sala inventada.
    expect(prepararLeadsDescubiertos([], 'Ávila', 'sala')).toEqual([]);
    expect(prepararLeadsDescubiertos(null, 'Ávila', 'sala')).toEqual([]);
    expect(prepararLeadsDescubiertos(undefined, 'Ávila', 'sala')).toEqual([]);
    expect(prepararLeadsDescubiertos('no es un array', 'Ávila', 'sala')).toEqual([]);
    expect(prepararLeadsDescubiertos({ nombre_sala: 'X' }, 'Ávila', 'sala')).toEqual([]);
  });

  it('se queda solo con los recintos con nombre y limpia su contacto', () => {
    const r = prepararLeadsDescubiertos([
      { nombre_sala: 'Sala Caracol', email_contacto: 'hola@caracol.es' },
      { nombre_sala: '', email_contacto: 'basura@x.com' },
      { nombre_sala: 'Nombre de la sala', email_contacto: 'booking@sala.com' },
      { nombre_sala: 'Teatro Real', email_contacto: 'booking@sala.com', telefono: '+34 900 000 000' },
    ], 'Madrid', 'sala');

    expect(r.map(x => x.nombre_sala)).toEqual(['Sala Caracol', 'Teatro Real']);
    expect(r[0].email_contacto).toBe('hola@caracol.es');
    // El Teatro Real es real, pero su contacto era relleno: se guarda sin contacto, no con uno falso.
    expect(r[1].email_contacto).toBe('');
    expect(r[1].telefono).toBe('');
  });

  it('nunca fabrica un recinto que no venía en la entrada', () => {
    const entradas: unknown[] = [[], null, [{}], [{ nombre_sala: '  ' }], 'x', 0];
    for (const e of entradas) {
      expect(prepararLeadsDescubiertos(e, 'Ávila', 'sala')).toHaveLength(0);
    }
  });
});

describe('datos de Google Places que sobreviven a la normalización', () => {
  it('conserva place_id y dirección para deduplicar y localizar la sala', () => {
    const r = normalizarLeadDescubierto(
      { nombre_sala: 'Sala Caracol', place_id: 'ChIJ123', direccion: 'Calle Bernardino Obregón 18, Madrid' },
      'Madrid', 'sala'
    );
    expect(r.place_id).toBe('ChIJ123');
    expect(r.direccion).toBe('Calle Bernardino Obregón 18, Madrid');
  });

  it('solo acepta fotos servidas por nuestro proxy o favicons de Google, nunca una URL cualquiera del modelo', () => {
    const foto = (imagen_url: unknown) => normalizarLeadDescubierto({ nombre_sala: 'X', imagen_url }, 'M', 'sala').imagen_url;
    expect(foto('/api/places/photo?name=places%2Fa%2Fphotos%2Fb')).toBe('/api/places/photo?name=places%2Fa%2Fphotos%2Fb');
    expect(foto('https://www.google.com/s2/favicons?domain=caracol.es&sz=128')).toBe('https://www.google.com/s2/favicons?domain=caracol.es&sz=128');
    expect(foto('https://places.googleapis.com/v1/places/a/photos/b/media?key=SECRETA')).toBe('');
    expect(foto('javascript:alert(1)')).toBe('');
    expect(foto('https://www.google.com.evil.com/s2/favicons?domain=x')).toBe('');
    expect(foto('https://evil.com/?https://www.google.com/s2/favicons?domain=x')).toBe('');
    expect(foto('https://www.google.com/other')).toBe('');
    expect(foto(undefined)).toBe('');
  });
});
