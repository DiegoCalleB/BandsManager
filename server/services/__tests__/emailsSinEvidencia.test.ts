import { describe, it, expect, vi } from 'vitest';
import { descartarEmailsSinEvidencia, depurarContactosExtraidos, depurarEmailDeIA, depurarEmailEnFichaIA } from '../emailsSinEvidencia';
import type { ResultadoEvidencia } from '../../utils/emailConEvidencia';

const ahora = '2026-11-06T10:00:00.000Z';
const fuente = (f: string) => ({ fuente: f, confianza: 'baja', en: ahora });

const siempreOk = vi.fn(async (): Promise<ResultadoEvidencia> => ({ ok: true, evidencia: 'https://sala-uno.es/contacto' }));
const nunca = (motivo: 'no_aparece_en_su_web' | 'sin_web' = 'no_aparece_en_su_web') => vi.fn(async (): Promise<ResultadoEvidencia> => ({ ok: false, motivo }));

describe('descartarEmailsSinEvidencia', () => {
  it('un email de la IA que no se puede comprobar se vacía, y no se guarda con un aviso', async () => {
    const lead: any = { nombre_sala: 'Sala Uno', website: 'https://sala-uno.es', email_contacto: 'info@sala-uno.es', datos_fuentes: { email_contacto: fuente('ia') }, notas: '' };
    const descartes = await descartarEmailsSinEvidencia(lead, { verificar: nunca() });
    expect(lead.email_contacto).toBe('');
    expect(lead.datos_fuentes.email_contacto).toBeUndefined();
    expect(descartes).toEqual([{ campo: 'email_contacto', motivo: 'no_aparece_en_su_web' }]);
  });

  it('deja una nota que explica qué pasó, sin repetir la dirección inventada', async () => {
    const lead: any = { website: 'https://sala-uno.es', email_contacto: 'info@sala-uno.es', datos_fuentes: { email_contacto: fuente('ia') }, notas: 'nota previa' };
    await descartarEmailsSinEvidencia(lead, { verificar: nunca(), ahora: new Date(ahora) });
    expect(lead.notas).toContain('nota previa');
    expect(lead.notas).toMatch(/2026-11-06.*descartado.*no se pudo comprobar/i);
    expect(lead.notas).not.toContain('info@sala-uno.es');
  });

  it('un email de la IA que sí aparece en su web se conserva y pasa a ser un dato de la web', async () => {
    const lead: any = { website: 'https://sala-uno.es', email_contacto: 'booking@sala-uno.es', datos_fuentes: { email_contacto: { ...fuente('ia'), aviso: { tipo: 'dominio_inexistente', para: 'booking@sala-uno.es' } } } };
    const descartes = await descartarEmailsSinEvidencia(lead, { verificar: siempreOk, ahora: new Date(ahora) });
    expect(descartes).toEqual([]);
    expect(lead.email_contacto).toBe('booking@sala-uno.es');
    expect(lead.datos_fuentes.email_contacto).toMatchObject({ fuente: 'web', confianza: 'alta' });
    expect(lead.datos_fuentes.email_contacto.aviso).toBeUndefined();
  });

  it('un email del buscador se comprueba igual que el de la IA', async () => {
    const lead: any = { website: 'https://sala-uno.es', email_contacto: 'x@sala-uno.es', datos_fuentes: { email_contacto: fuente('buscador') } };
    await descartarEmailsSinEvidencia(lead, { verificar: nunca() });
    expect(lead.email_contacto).toBe('');
  });

  it('los emails de la web oficial y de Google Maps no se vuelven a comprobar', async () => {
    const verificar = nunca();
    const lead: any = { website: 'https://sala-uno.es', email_contacto: 'a@sala-uno.es', email_secundario: 'b@sala-uno.es', datos_fuentes: { email_contacto: fuente('web'), email_secundario: fuente('places') } };
    expect(await descartarEmailsSinEvidencia(lead, { verificar })).toEqual([]);
    expect(verificar).not.toHaveBeenCalled();
    expect(lead.email_contacto).toBe('a@sala-uno.es');
  });

  it('un email escrito a mano (sin procedencia) se respeta, salvo que se pida tratarlo como de la IA', async () => {
    const manual: any = { website: 'https://sala-uno.es', email_contacto: 'mio@sala-uno.es' };
    const verificar = nunca();
    expect(await descartarEmailsSinEvidencia(manual, { verificar })).toEqual([]);
    expect(manual.email_contacto).toBe('mio@sala-uno.es');

    const sinOrigen: any = { website: 'https://sala-uno.es', email_contacto: 'dudoso@sala-uno.es' };
    expect(await descartarEmailsSinEvidencia(sinOrigen, { verificar, sinProcedencia: 'ia' })).toHaveLength(1);
    expect(sinOrigen.email_contacto).toBe('');
  });

  it('comprueba también el email secundario', async () => {
    const lead: any = { website: 'https://sala-uno.es', email_contacto: 'ok@sala-uno.es', email_secundario: 'raro@sala-uno.es', datos_fuentes: { email_contacto: fuente('web'), email_secundario: fuente('ia') } };
    const descartes = await descartarEmailsSinEvidencia(lead, { verificar: nunca() });
    expect(descartes).toEqual([{ campo: 'email_secundario', motivo: 'no_aparece_en_su_web' }]);
    expect(lead.email_contacto).toBe('ok@sala-uno.es');
    expect(lead.email_secundario).toBe('');
  });

  it('sin emails no hace nada ni toca la red', async () => {
    const verificar = nunca();
    const lead: any = { website: 'https://sala-uno.es', email_contacto: '' };
    expect(await descartarEmailsSinEvidencia(lead, { verificar })).toEqual([]);
    expect(verificar).not.toHaveBeenCalled();
  });
});

describe('depurarContactosExtraidos (lo que devuelve la IA al extraer emails)', () => {
  const webs = [{ place_id: 'p1', website: 'https://sala-uno.es' }, { id: 'p2', website: 'https://sala-dos.es' }];

  it('vacía los emails que no se comprueban en su web y lo explica en la fuente', async () => {
    const verificar = vi.fn(async (email: string): Promise<ResultadoEvidencia> => (email === 'ok@sala-uno.es' ? { ok: true, evidencia: 'https://sala-uno.es/contacto' } : { ok: false, motivo: 'no_aparece_en_su_web' }));
    const extraidos = [
      { id: 'p1', email_contacto: 'ok@sala-uno.es', fuente: 'su web', confianza: 'alta' },
      { id: 'p2', email_contacto: 'inventado@sala-dos.es', fuente: 'su web', confianza: 'alta' },
    ];
    const r = await depurarContactosExtraidos(extraidos, webs, { verificar });
    expect(r.descartados).toBe(1);
    expect(r.extraidos[0].email_contacto).toBe('ok@sala-uno.es');
    expect(r.extraidos[1]).toMatchObject({ email_contacto: '', confianza: 'baja' });
    expect(r.extraidos[1].fuente).toMatch(/descartado.*no se pudo comprobar/i);
    expect(verificar).toHaveBeenCalledWith('inventado@sala-dos.es', 'https://sala-dos.es');
  });

  it('un contacto sin web conocida no se puede comprobar: se descarta', async () => {
    const verificar = nunca('sin_web');
    const r = await depurarContactosExtraidos([{ id: 'p9', email_contacto: 'x@y.es' }], webs, { verificar });
    expect(r.extraidos[0].email_contacto).toBe('');
    expect(r.descartados).toBe(1);
  });

  it('los contactos sin email no se tocan ni consultan la red', async () => {
    const verificar = siempreOk;
    siempreOk.mockClear();
    const r = await depurarContactosExtraidos([{ id: 'p1', email_contacto: '', instagram: '@sala' }], webs, { verificar });
    expect(r).toEqual({ extraidos: [{ id: 'p1', email_contacto: '', instagram: '@sala' }], descartados: 0 });
    expect(siempreOk).not.toHaveBeenCalled();
  });
});

describe('depurarEmailDeIA (un solo email que devuelve la IA)', () => {
  it('lo deja si hay evidencia y lo vacía si no', async () => {
    expect(await depurarEmailDeIA('a@sala-uno.es', 'https://sala-uno.es', { verificar: siempreOk })).toEqual({ valor: 'a@sala-uno.es', descartado: false });
    expect(await depurarEmailDeIA('a@sala-uno.es', 'https://sala-uno.es', { verificar: nunca() })).toEqual({ valor: '', descartado: true });
  });

  it('un valor vacío se queda vacío sin consultar nada', async () => {
    siempreOk.mockClear();
    expect(await depurarEmailDeIA('', 'https://sala-uno.es', { verificar: siempreOk })).toEqual({ valor: '', descartado: false });
    expect(siempreOk).not.toHaveBeenCalled();
  });
});

describe('depurarEmailEnFichaIA (ficha con { valor, confianza, fuente })', () => {
  it('sustituye el email sin evidencia por uno vacío que lo explica, y deja el resto de la ficha', async () => {
    const ficha: any = { email_contacto: { valor: 'info@sala-uno.es', confianza: 'alta', fuente: 'su web' }, telefono: { valor: '600' } };
    expect(await depurarEmailEnFichaIA(ficha, 'https://sala-uno.es', { verificar: nunca() })).toBe(true);
    expect(ficha.email_contacto).toMatchObject({ valor: '', confianza: 'baja' });
    expect(ficha.email_contacto.fuente).toMatch(/descartado/i);
    expect(ficha.telefono).toEqual({ valor: '600' });
  });

  it('con evidencia no toca nada, y también entiende un email suelto como texto', async () => {
    const ficha: any = { email_contacto: 'booking@sala-uno.es' };
    expect(await depurarEmailEnFichaIA(ficha, 'https://sala-uno.es', { verificar: siempreOk })).toBe(false);
    expect(ficha.email_contacto).toBe('booking@sala-uno.es');
    expect(await depurarEmailEnFichaIA({}, 'https://sala-uno.es', { verificar: siempreOk })).toBe(false);
  });
});
