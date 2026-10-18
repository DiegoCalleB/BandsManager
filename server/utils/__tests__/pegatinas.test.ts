import { describe, expect, it } from 'vitest';
import { packDeLaBanda, PEGATINAS_POR_PLAN, validarEnvioPegatinas } from '../pegatinas';

const bandas = [
  { band_id: 'band-a', plan: 'local', estado_suscripcion: 'activo' },
  { band_id: 'band-b', plan: 'de_gira', estado_suscripcion: 'activo' },
  { band_id: 'band-c', plan: 'cabeza_de_cartel', estado_suscripcion: 'activo' },
  { band_id: 'band-d', plan: 'local' },
  { band_id: 'band-e', plan: 'local', estado_suscripcion: 'cancelado' },
  { band_id: 'band-f', plan: 'ensayo', estado_suscripcion: 'activo' },
  { band_id: 'band-g', plan: 'promo', estado_suscripcion: 'activo' },
];

describe('packDeLaBanda', () => {
  it('solo los planes altos con suscripción activa tienen su pack', () => {
    expect(packDeLaBanda(bandas, 'band-b')).toEqual({ cantidad: 150, expres: false });
    expect(packDeLaBanda(bandas, 'band-c')).toEqual({ cantidad: 300, expres: true });
  });
  it.each(['band-a', 'band-d', 'band-e', 'band-f', 'band-g'])('%s no tiene derecho (plan Local, sin cobro activo o plan gratuito)', (id) => {
    expect(packDeLaBanda(bandas, id)).toBeNull();
  });
  it('ignora el prefijo band-/reg-, pero exige la misma banda', () => {
    expect(packDeLaBanda(bandas, 'REG-b')).toEqual({ cantidad: 150, expres: false });
    expect(packDeLaBanda(bandas, 'band-')).toBeNull();
    expect(packDeLaBanda(bandas, 'b-clon')).toBeNull();
  });
  it.each([undefined, '', 'default'])('sin banda válida (%s) no hay pack', (id) => {
    expect(packDeLaBanda(bandas, id as string | undefined)).toBeNull();
  });
  it('sin lista de bandas no hay pack', () => {
    expect(packDeLaBanda(undefined, 'band-a')).toBeNull();
  });
  it('solo hay packs para De Gira y Cabeza de Cartel', () => {
    expect(Object.keys(PEGATINAS_POR_PLAN).sort()).toEqual(['cabeza_de_cartel', 'de_gira']);
  });
});

describe('validarEnvioPegatinas', () => {
  const base = { nombre: ' Ana  Pérez ', direccion: 'C/ Mayor 1', cp: '28001', ciudad: 'Madrid', consentimiento: true };
  it('acepta un envío completo y lo normaliza', () => {
    expect(validarEnvioPegatinas(base)).toEqual({
      ok: true,
      envio: { nombre: 'Ana Pérez', direccion: 'C/ Mayor 1', cp: '28001', ciudad: 'Madrid', pais: 'España', telefono: '' },
    });
  });
  it.each(['nombre', 'direccion', 'cp', 'ciudad'])('exige %s', (campo) => {
    expect(validarEnvioPegatinas({ ...base, [campo]: '  ' })).toMatchObject({ ok: false });
  });
  it('exige el consentimiento como booleano true', () => {
    expect(validarEnvioPegatinas({ ...base, consentimiento: 'true' })).toMatchObject({ ok: false });
    expect(validarEnvioPegatinas({ ...base, consentimiento: undefined })).toMatchObject({ ok: false });
  });
  it('recorta textos largos y colapsa saltos de línea', () => {
    const r = validarEnvioPegatinas({ ...base, direccion: 'x\ny'.repeat(500) });
    if (!r.ok) throw new Error('debería ser válido');
    expect(r.envio.direccion.length).toBeLessThanOrEqual(200);
    expect(r.envio.direccion).not.toMatch(/\n/);
  });
  it.each([null, undefined, 'texto', 42, []])('un cuerpo %j no es válido', (b) => {
    expect(validarEnvioPegatinas(b)).toMatchObject({ ok: false });
  });
});
