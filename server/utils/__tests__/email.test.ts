import { describe, it, expect } from 'vitest';
import { esEmailValido, esEstadoDeEnvio, isValidEmail, ESTADOS_DE_ENVIO, puedeEntrarEnColaDeEnvio } from '../email';

describe('esEmailValido', () => {
  it('acepta direcciones reales', () => {
    expect(esEmailValido('booking@salacaracol.es')).toBe(true);
    expect(esEmailValido( '  programacion@teatro-real.com  ')).toBe(true);
  });

  it('rechaza lo que llegaría a nodemailer y reventaría', () => {
    // El Enviador solo comprobaba que no fuera vacío, así que todo esto pasaba.
    for (const malo of ['', '   ', 'n/a', 'N/A', '-', 'sin email', 'desconocido', 'hola@', '@sala.com', 'hola sala.com', 'hola@sala']) {
      expect(esEmailValido(malo), `debería rechazar ${JSON.stringify(malo)}`).toBe(false);
    }
  });

  it('rechaza lo que no es texto', () => {
    expect(esEmailValido(undefined)).toBe(false);
    expect(esEmailValido(null)).toBe(false);
    expect(esEmailValido(42)).toBe(false);
    expect(esEmailValido({})).toBe(false);
  });

  it('isValidEmail es el mismo criterio (billing lo reexporta)', () => {
    expect(isValidEmail).toBe(esEmailValido);
  });
});

describe('esEstadoDeEnvio', () => {
  it('reconoce los tres estados que ponen un lead en cola de envío', () => {
    for (const e of ESTADOS_DE_ENVIO) expect(esEstadoDeEnvio(e)).toBe(true);
    expect(ESTADOS_DE_ENVIO).toContain('aprobado');
  });

  it('no confunde otros estados del ciclo del lead', () => {
    for (const e of ['nuevo', 'pendiente_aprobacion', 'contactado', 'negociando', 'descartado', 'borrador_creado']) {
      expect(esEstadoDeEnvio(e), e).toBe(false);
    }
    expect(esEstadoDeEnvio(undefined)).toBe(false);
    expect(esEstadoDeEnvio(null)).toBe(false);
    expect(esEstadoDeEnvio(123)).toBe(false);
  });
});

describe('puedeEntrarEnColaDeEnvio', () => {
  const sala = { id: 'l1', nombre_sala: 'Sala Caracol', estado: 'pendiente_aprobacion' };

  it('BLOQUEA aprobar un lead sin email', () => {
    const r = puedeEntrarEnColaDeEnvio({ ...sala, email_contacto: '' }, { estado: 'aprobado' });
    expect(r.ok).toBe(false);
    expect(r.motivo).toContain('Sala Caracol');
    expect(r.motivo).toContain('sin email');
  });

  it('BLOQUEA aprobar con un email inválido y lo cita en el mensaje', () => {
    const r = puedeEntrarEnColaDeEnvio({ ...sala, email_contacto: 'n/a' }, { estado: 'aprobado' });
    expect(r.ok).toBe(false);
    expect(r.motivo).toContain('n/a');
  });

  it('bloquea los tres estados de envío, no solo "aprobado"', () => {
    for (const estado of ESTADOS_DE_ENVIO) {
      expect(puedeEntrarEnColaDeEnvio({ ...sala, email_contacto: '' }, { estado }).ok, estado).toBe(false);
    }
  });

  it('DEJA PASAR si el email es válido', () => {
    expect(puedeEntrarEnColaDeEnvio({ ...sala, email_contacto: 'booking@caracol.es' }, { estado: 'aprobado' }).ok).toBe(true);
  });

  it('acepta el email que llega en la propia actualización', () => {
    // Aprobar y rellenar el email en el mismo PUT tiene que funcionar.
    const r = puedeEntrarEnColaDeEnvio({ ...sala, email_contacto: '' }, { estado: 'aprobado', email_contacto: 'hola@caracol.es' });
    expect(r.ok).toBe(true);
  });

  it('NO bloquea otros cambios de estado sin email', () => {
    for (const estado of ['descartado', 'nuevo', 'pendiente_aprobacion', 'negociando']) {
      expect(puedeEntrarEnColaDeEnvio({ ...sala, email_contacto: '' }, { estado }).ok, estado).toBe(true);
    }
  });

  it('NO bloquea editar un lead que YA estaba aprobado', () => {
    // Solo se vigila la transición: si ya estaba en cola, no es este el sitio de rescatarlo.
    const yaAprobado = { ...sala, estado: 'aprobado', email_contacto: '' };
    expect(puedeEntrarEnColaDeEnvio(yaAprobado, { notas: 'una nota' }).ok).toBe(true);
    expect(puedeEntrarEnColaDeEnvio(yaAprobado, { estado: 'aprobado' }).ok).toBe(true);
  });

  it('aguanta entradas vacías o nulas', () => {
    expect(puedeEntrarEnColaDeEnvio(null, null).ok).toBe(true);
    expect(puedeEntrarEnColaDeEnvio(undefined, { estado: 'aprobado' }).ok).toBe(false);
    expect(puedeEntrarEnColaDeEnvio({}, {}).ok).toBe(true);
  });
});
