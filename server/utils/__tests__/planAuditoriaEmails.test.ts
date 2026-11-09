import { describe, it, expect } from 'vitest';
import { planificarEmail } from '../planAuditoriaEmails';

const ok = { ok: true as const, evidencia: 'https://sala-uno.es/contacto' };
const falla = (motivo: 'no_aparece_en_su_web' | 'sin_web' | 'dominio_sin_correo') => ({ ok: false as const, motivo });

describe('planificarEmail', () => {
  it('un email que aparece en la web de la sala está verificado, venga de donde venga', () => {
    for (const fuente of ['ia', 'buscador', 'web', 'places', undefined] as const) {
      expect(planificarEmail({ fuente, resultado: ok })).toEqual({ accion: 'verificado', evidencia: 'https://sala-uno.es/contacto' });
    }
  });

  it('un email de la IA o del buscador que no se puede comprobar se vacía', () => {
    expect(planificarEmail({ fuente: 'ia', resultado: falla('no_aparece_en_su_web') })).toEqual({ accion: 'vaciar', motivo: 'no_aparece_en_su_web' });
    expect(planificarEmail({ fuente: 'buscador', resultado: falla('sin_web') })).toEqual({ accion: 'vaciar', motivo: 'sin_web' });
  });

  it('un email sin origen conocido (escrito a mano o de antes de la procedencia) solo se revisa, salvo que se pida vaciarlo', () => {
    expect(planificarEmail({ fuente: undefined, resultado: falla('no_aparece_en_su_web') })).toEqual({ accion: 'revisar', motivo: 'no_aparece_en_su_web' });
    expect(planificarEmail({ fuente: undefined, resultado: falla('no_aparece_en_su_web'), tambienSinOrigen: true })).toEqual({ accion: 'vaciar', motivo: 'no_aparece_en_su_web' });
  });

  it('un email de la web o de Google Maps que ahora no se encuentra se revisa, no se borra', () => {
    expect(planificarEmail({ fuente: 'web', resultado: falla('no_aparece_en_su_web') })).toEqual({ accion: 'revisar', motivo: 'no_aparece_en_su_web' });
    expect(planificarEmail({ fuente: 'places', resultado: falla('dominio_sin_correo'), tambienSinOrigen: true })).toEqual({ accion: 'revisar', motivo: 'dominio_sin_correo' });
  });

  it('el catálogo (datos estructurados) tampoco se borra: se revisa', () => {
    expect(planificarEmail({ fuente: 'catalogo', resultado: falla('sin_web') })).toEqual({ accion: 'revisar', motivo: 'sin_web' });
  });
});
