import { describe, it, expect } from 'vitest';
import { destinatariosDeAvisos, renderAvisoGmailConectado, renderAvisoEmailDeAccesoCambiado } from '../avisosCuentaEmail';

describe('destinatariosDeAvisos', () => {
  it('conecta su propia cuenta (el email de la banda ya era ese Gmail): un solo aviso, sin cambio de acceso', () => {
    expect(destinatariosDeAvisos({ emailAnterior: 'banda@gmail.com', gmailEmail: 'Banda@Gmail.com', seCambioElEmailDeAcceso: false }))
      .toEqual({ conexion: ['banda@gmail.com'], cambioDeAcceso: null });
  });

  it('el email de acceso cambia: aviso de conexión al Gmail nuevo y aviso de cambio SOLO al email anterior', () => {
    expect(destinatariosDeAvisos({ emailAnterior: 'viejo@correo.es', gmailEmail: 'nuevo@gmail.com', seCambioElEmailDeAcceso: true }))
      .toEqual({ conexion: ['nuevo@gmail.com'], cambioDeAcceso: 'viejo@correo.es' });
  });

  it('conecta otro Gmail pero el email de acceso no cambia (era de otra banda): el aviso de conexión llega a los dos', () => {
    expect(destinatariosDeAvisos({ emailAnterior: 'viejo@correo.es', gmailEmail: 'nuevo@gmail.com', seCambioElEmailDeAcceso: false }))
      .toEqual({ conexion: ['nuevo@gmail.com', 'viejo@correo.es'], cambioDeAcceso: null });
  });

  it('no se envía a direcciones inválidas ni vacías, ni con la inyección de comas o paréntesis', () => {
    expect(destinatariosDeAvisos({ emailAnterior: '', gmailEmail: '', seCambioElEmailDeAcceso: false }))
      .toEqual({ conexion: [], cambioDeAcceso: null });
    expect(destinatariosDeAvisos({ emailAnterior: 'a,b@evil.com', gmailEmail: 'ok@gmail.com', seCambioElEmailDeAcceso: true }))
      .toEqual({ conexion: ['ok@gmail.com'], cambioDeAcceso: null });
  });

  it('sin Gmail conocido (Google no devolvió el email) avisa igualmente al email de la banda', () => {
    expect(destinatariosDeAvisos({ emailAnterior: 'banda@correo.es', gmailEmail: '', seCambioElEmailDeAcceso: false }))
      .toEqual({ conexion: ['banda@correo.es'], cambioDeAcceso: null });
  });
});

describe('renderAvisoGmailConectado', () => {
  const base = { nombreBanda: 'Los Ejemplo', gmailEmail: 'banda@gmail.com', appUrl: 'https://app.ejemplo.io' };

  it('dice qué cuenta, a qué banda y qué hace y qué NO hace BandManager con el permiso', () => {
    const { subject, html } = renderAvisoGmailConectado(base);
    expect(subject).toContain('Los Ejemplo');
    expect(html).toContain('banda@gmail.com');
    expect(html).toMatch(/leer las respuestas/i);
    expect(html).toMatch(/nunca env[ií]a/i);
    expect(html).toContain('myaccount.google.com/permissions');
    expect(html).toContain('https://app.ejemplo.io');
  });

  it('escapa los textos que vienen del usuario (nombre de banda con HTML)', () => {
    const { html, subject } = renderAvisoGmailConectado({ ...base, nombreBanda: '<script>alert(1)</script>' });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
    expect(subject).not.toMatch(/[<>]/);
  });

  it('sin email de Gmail conocido no inventa uno', () => {
    expect(renderAvisoGmailConectado({ ...base, gmailEmail: '' }).html).toMatch(/una cuenta de Gmail/);
  });
});

describe('renderAvisoEmailDeAccesoCambiado', () => {
  it('dice de qué email a cuál, por qué, y qué hacer si no ha sido el titular', () => {
    const { subject, html } = renderAvisoEmailDeAccesoCambiado({ nombreBanda: 'Los Ejemplo', emailAnterior: 'viejo@correo.es', emailNuevo: 'nuevo@gmail.com', appUrl: 'https://app.ejemplo.io' });
    expect(subject).toMatch(/email de acceso/i);
    expect(html).toContain('viejo@correo.es');
    expect(html).toContain('nuevo@gmail.com');
    expect(html).toMatch(/si no has sido t[uú]/i);
  });

  it('escapa también los emails', () => {
    const { html } = renderAvisoEmailDeAccesoCambiado({ nombreBanda: 'X', emailAnterior: 'a"onmouseover="x@b.com', emailNuevo: 'n@g.com', appUrl: 'https://app.ejemplo.io' });
    expect(html).not.toContain('"onmouseover="');
  });
});
