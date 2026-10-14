import { describe, it, expect } from 'vitest';
import { hashTextoAprobado, aprobacionVigente, accionTrasGuardar, esEstadoDeAprobacion } from '../aprobacionLead';

describe('hashTextoAprobado', () => {
  it('es estable y no depende de espacios en los extremos', () => {
    expect(hashTextoAprobado('hola')).toBe(hashTextoAprobado('  hola\n'));
    expect(hashTextoAprobado('hola')).toMatch(/^[0-9a-f]{64}$/);
  });
  it('cambia con cualquier cambio del texto', () => {
    expect(hashTextoAprobado('hola, os proponemos el 5')).not.toBe(hashTextoAprobado('hola, os proponemos el 6'));
  });
});

describe('aprobacionVigente', () => {
  const texto = 'hola, os proponemos un concierto';
  it('ok si la huella coincide con el texto', () => {
    expect(aprobacionVigente({ pitch_generado: texto, pitch_aprobado_hash: hashTextoAprobado(texto) })).toEqual({ ok: true });
  });
  it('bloquea si el texto cambió después de aprobar', () => {
    const r = aprobacionVigente({ pitch_generado: texto + ' y 3000 euros', pitch_aprobado_hash: hashTextoAprobado(texto) });
    expect(r.ok).toBe(false);
    expect(r.motivo).toMatch(/cambió después de aprobarlo/);
  });
  it('bloquea si no consta aprobación (estado de envío por otro camino)', () => {
    const r = aprobacionVigente({ pitch_generado: texto });
    expect(r.ok).toBe(false);
    expect(r.motivo).toMatch(/No consta quién aprobó/);
  });
});

describe('accionTrasGuardar', () => {
  it('aprobar sella', () => {
    expect(accionTrasGuardar({ estado: 'pendiente_aprobacion', pitch_generado: 'a' }, { estado: 'aprobado_propuesta' })).toBe('sellar');
  });
  it('un lead ya aprobado que se reenvía entero con el texto editado se degrada, no se vuelve a sellar', () => {
    expect(accionTrasGuardar({ estado: 'aprobado_propuesta', pitch_generado: 'a' }, { estado: 'aprobado_propuesta', pitch_generado: 'b' })).toBe('degradar');
  });
  it('un lead ya aprobado que se reenvía entero sin cambiar el texto conserva su sello', () => {
    expect(accionTrasGuardar({ estado: 'aprobado_propuesta', pitch_generado: 'a' }, { estado: 'aprobado_propuesta', pitch_generado: 'a', notas: 'x' } as any)).toBe('nada');
  });
  it('si el texto se edita a la vez que el lead sale de la cola (p. ej. negociando), no se toca', () => {
    expect(accionTrasGuardar({ estado: 'aprobado_propuesta', pitch_generado: 'a' }, { estado: 'negociando', pitch_generado: 'b' })).toBe('nada');
  });
  it('editar el texto de un lead aprobado sin aprobar de nuevo lo degrada', () => {
    expect(accionTrasGuardar({ estado: 'aprobado_respuesta', pitch_generado: 'a' }, { pitch_generado: 'b' })).toBe('degradar');
  });
  it('reenviar el mismo texto (o solo espacios) no degrada', () => {
    expect(accionTrasGuardar({ estado: 'aprobado_propuesta', pitch_generado: 'a' }, { pitch_generado: ' a ' })).toBe('nada');
  });
  it('editar el texto de un lead sin aprobar no hace nada', () => {
    expect(accionTrasGuardar({ estado: 'pendiente_aprobacion', pitch_generado: 'a' }, { pitch_generado: 'b' })).toBe('nada');
  });
  it('cambios que no tocan la aprobación no hacen nada', () => {
    expect(accionTrasGuardar({ estado: 'aprobado_propuesta', pitch_generado: 'a' }, { notas: 'x' } as any)).toBe('nada');
  });
  it('reconoce los tres estados de aprobación', () => {
    for (const e of ['aprobado', 'aprobado_propuesta', 'aprobado_respuesta']) expect(esEstadoDeAprobacion(e)).toBe(true);
    expect(esEstadoDeAprobacion('borrador_creado')).toBe(false);
  });
});
