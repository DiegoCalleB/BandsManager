import { describe, it, expect, vi } from 'vitest';
import { avisarEmailsDudosos } from '../avisarEmailsDudosos.js';
import { anotarProcedencia } from '../../utils/procedenciaDatos.js';

const AHORA = new Date('2026-10-18T12:00:00Z');

describe('avisarEmailsDudosos', () => {
  it('conserva el email de una IA cuyo dominio no existe, pero con un aviso ligado a ese email', async () => {
    const lead = { email_contacto: 'info@dominio-inventado.xyz', datos_fuentes: anotarProcedencia({}, ['email_contacto'], 'ia', AHORA) };
    expect(await avisarEmailsDudosos(lead, async () => false)).toEqual(['email_contacto']);
    expect(lead.email_contacto).toBe('info@dominio-inventado.xyz');
    expect(lead.datos_fuentes.email_contacto.aviso).toEqual({ tipo: 'dominio_inexistente', para: 'info@dominio-inventado.xyz' });
    expect(lead.datos_fuentes.email_contacto.fuente).toBe('ia');
  });

  it('no avisa si el dominio existe', async () => {
    const lead = { email_contacto: 'info@sala.es', datos_fuentes: anotarProcedencia({}, ['email_contacto'], 'buscador', AHORA) };
    expect(await avisarEmailsDudosos(lead, async () => true)).toEqual([]);
    expect(lead.datos_fuentes.email_contacto.aviso).toBeUndefined();
  });

  it('no cuestiona los emails de fuentes fiables ni los escritos a mano (ni siquiera consulta el DNS)', async () => {
    const validar = vi.fn(async () => false);
    const web = { email_contacto: 'a@b.es', datos_fuentes: anotarProcedencia({}, ['email_contacto'], 'web', AHORA) };
    const catalogo = { email_contacto: 'a@b.es', datos_fuentes: anotarProcedencia({}, ['email_contacto'], 'catalogo', AHORA) };
    const manual = { email_contacto: 'a@b.es', datos_fuentes: {} };
    for (const lead of [web, catalogo, manual]) expect(await avisarEmailsDudosos(lead, validar)).toEqual([]);
    expect(validar).not.toHaveBeenCalled();
  });

  it('si la comprobación lanza un error (DNS caído) no avisa: no se alarma por un fallo de red', async () => {
    const lead = { email_contacto: 'info@sala.es', datos_fuentes: anotarProcedencia({}, ['email_contacto'], 'ia', AHORA) };
    expect(await avisarEmailsDudosos(lead, async () => { throw new Error('ESERVFAIL'); })).toEqual([]);
  });

  it('revisa también el email secundario y avisa solo del dudoso', async () => {
    const lead = {
      email_contacto: 'ok@sala.es',
      email_secundario: 'x@inventado.xyz',
      datos_fuentes: anotarProcedencia({}, ['email_contacto', 'email_secundario'], 'ia', AHORA),
    };
    expect(await avisarEmailsDudosos(lead, async (e) => e.endsWith('@sala.es'))).toEqual(['email_secundario']);
    expect(lead.datos_fuentes.email_contacto.aviso).toBeUndefined();
    expect(lead.datos_fuentes.email_secundario.aviso?.para).toBe('x@inventado.xyz');
  });
});
