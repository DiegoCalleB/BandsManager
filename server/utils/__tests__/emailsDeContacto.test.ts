import { describe, it, expect } from 'vitest';
import { rolDelEmail, elegirEmailDeContacto } from '../emailsDeContacto';

describe('rolDelEmail', () => {
  it('reconoce los buzones de booking y programación', () => {
    for (const e of ['booking@festival.es', 'bookings@festival.es', 'programacion@festival.es', 'programación@festival.es', 'artistas@festival.es', 'bandas@festival.es', 'talent@festival.es', 'musica@festival.es', 'eventos@festival.es', 'conciertos@festival.es']) {
      expect(rolDelEmail(e), e).toBe('booking');
    }
  });

  it('reconoce los generales', () => {
    for (const e of ['info@festival.es', 'contacto@festival.es', 'contact@festival.es', 'hola@festival.es', 'organizacion@festival.es', 'produccion@festival.es', 'direccion@festival.es']) {
      expect(rolDelEmail(e), e).toBe('contacto');
    }
  });

  it('separa prensa, entradas, empleo y legal: no son para proponer un concierto', () => {
    expect(rolDelEmail('prensa@festival.es')).toBe('prensa');
    expect(rolDelEmail('press@festival.es')).toBe('prensa');
    expect(rolDelEmail('comunicacion@festival.es')).toBe('prensa');
    expect(rolDelEmail('entradas@festival.es')).toBe('entradas');
    expect(rolDelEmail('tickets@festival.es')).toBe('entradas');
    expect(rolDelEmail('soporte@festival.es')).toBe('entradas');
    expect(rolDelEmail('rrhh@festival.es')).toBe('rrhh');
    expect(rolDelEmail('voluntarios@festival.es')).toBe('rrhh');
    expect(rolDelEmail('privacidad@festival.es')).toBe('legal');
    expect(rolDelEmail('dpo@festival.es')).toBe('legal');
  });

  it('un nombre de persona es personal: no se toma para escribir a la organización', () => {
    expect(rolDelEmail('juan.perez@festival.es')).toBe('personal');
    expect(rolDelEmail('carles@festival.es')).toBe('personal');
  });
});

describe('elegirEmailDeContacto', () => {
  const web = 'https://www.festival.es/';

  it('prefiere booking a un general, y toma solo emails del dominio del festival', () => {
    const r = elegirEmailDeContacto(
      [
        { email: 'info@festival.es', pagina: 'https://www.festival.es/contacto' },
        { email: 'Booking@Festival.es', pagina: 'https://www.festival.es/aviso-legal' },
        { email: 'booking@otra-agencia.com', pagina: 'https://www.festival.es/' },
      ],
      web,
    );
    expect(r).toEqual({ email: 'booking@festival.es', rol: 'booking', evidencia: 'https://www.festival.es/aviso-legal' });
  });

  it('sin booking ni general no elige nada: prensa, entradas y personas no valen', () => {
    const r = elegirEmailDeContacto(
      [
        { email: 'prensa@festival.es', pagina: web },
        { email: 'entradas@festival.es', pagina: web },
        { email: 'ana.lopez@festival.es', pagina: web },
      ],
      web,
    );
    expect(r).toBeNull();
  });

  it('un general de un dominio ajeno (la ticketera, un medio, una agencia) no se toma', () => {
    expect(elegirEmailDeContacto([{ email: 'hola@feverup.com', pagina: web }, { email: 'info@lasttour.org', pagina: web }], web)).toBeNull();
  });

  it('entiende los dominios como .com.es y los subdominios de la web', () => {
    expect(elegirEmailDeContacto([{ email: 'info@festival.com.es', pagina: 'https://www.festival.com.es/' }], 'https://tickets.festival.com.es/')).toMatchObject({ email: 'info@festival.com.es' });
  });

  it('acepta el dominio de la misma marca (madcoolfestival.es publica booking@madcool.es), pero no el de un tercero', () => {
    const r = elegirEmailDeContacto(
      [
        { email: 'press@madcool.es', pagina: 'https://www.madcoolfestival.es/' },
        { email: 'booking@madcool.es', pagina: 'https://www.madcoolfestival.es/contacto' },
        { email: 'hola@feverup.com', pagina: 'https://www.madcoolfestival.es/' },
      ],
      'https://www.madcoolfestival.es/',
    );
    expect(r).toMatchObject({ email: 'booking@madcool.es', rol: 'booking' });
    expect(elegirEmailDeContacto([{ email: 'info@ebfm.es', pagina: web }, { email: 'info@fest.es', pagina: web }], 'https://www.festival.es/')).toBeNull();
  });

  it('sin candidatos o sin web, nada', () => {
    expect(elegirEmailDeContacto([], web)).toBeNull();
    expect(elegirEmailDeContacto([{ email: 'info@festival.es', pagina: web }], '')).toBeNull();
  });

  it('reconoce booking escrito junto o en otros idiomas', () => {
    for (const e of ['bandbooking@fest.de', 'comeandplay@fest.de', 'bewerbung@fest.de', 'programmation@fest.fr', 'programmazione@fest.it', 'candidatures@fest.fr', 'artistes@fest.fr'])
      expect(rolDelEmail(e), e).toBe('booking');
  });

  it('reconoce los generales en otros idiomas y el buzón con el nombre del festival', () => {
    for (const e of ['kontakt@fest.de', 'informace@fest.cz', 'biuro@fest.pl', 'accueil@fest.fr', 'bonjour@fest.fr', 'mail@fest.de', 'festival@fest.fr', 'office@fest.at', 'contatti@fest.it'])
      expect(rolDelEmail(e), e).toBe('contacto');
    expect(rolDelEmail('marsatac@marsatac.com')).toBe('contacto');
    expect(rolDelEmail('marion.pace@ephelide.net')).toBe('personal');
  });

  it('un booking dentro de otra palabra no vence a las exclusiones', () => {
    expect(rolDelEmail('booking.tickets@fest.de')).toBe('entradas');
    expect(rolDelEmail('aurelie@artrock.org')).toBe('personal');
  });
});

