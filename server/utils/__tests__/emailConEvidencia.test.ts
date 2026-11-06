import { describe, it, expect, vi } from 'vitest';
import {
  emailsEnTexto,
  emailAparece,
  paginasDondeBuscar,
  verificarEmailConEvidencia,
} from '../emailConEvidencia';

/** Cloudflare «protección de email»: el primer byte es la clave y el resto, el email cifrado con XOR. */
const cifrarCloudflare = (email: string, clave = 0x2a): string =>
  clave.toString(16).padStart(2, '0') + [...email].map((c) => (c.charCodeAt(0) ^ clave).toString(16).padStart(2, '0')).join('');

describe('emailsEnTexto', () => {
  it('lee mailto, texto plano y entidades HTML', () => {
    const html = `<a href="mailto:Booking@Sala-Uno.es?subject=hola">escribe</a> o a contacto&#64;sala-uno.es, o a prensa&#x40;sala-uno.es`;
    expect(emailsEnTexto(html).sort()).toEqual(['booking@sala-uno.es', 'contacto@sala-uno.es', 'prensa@sala-uno.es']);
  });

  it('lee emails ofuscados con [at], (arroba) y %40', () => {
    const texto = 'info [at] sala-dos [dot] com · hola(arroba)sala-dos.com · mailto:a%40sala-dos.com';
    expect(emailsEnTexto(texto)).toEqual(expect.arrayContaining(['info@sala-dos.com', 'hola@sala-dos.com', 'a@sala-dos.com']));
  });

  it('descifra la protección de email de Cloudflare', () => {
    const html = `<a class="__cf_email__" data-cfemail="${cifrarCloudflare('programacion@sala-tres.es')}">[email protected]</a>`;
    expect(emailsEnTexto(html)).toContain('programacion@sala-tres.es');
  });

  it('no confunde nombres de fichero con emails', () => {
    expect(emailsEnTexto('<img src="logo@2x.png"> <img src="hero@3x.webp">')).toEqual([]);
  });
});

describe('emailAparece', () => {
  it('compara sin distinguir mayúsculas', () => {
    expect(emailAparece('INFO@Sala-Uno.es', 'Escríbenos a info@sala-uno.es')).toBe(true);
  });

  it('no acepta una coincidencia parcial dentro de otro email', () => {
    expect(emailAparece('info@sala-uno.es', 'escribe a noinfo@sala-uno.es')).toBe(false);
    expect(emailAparece('info@sala-uno.es', 'escribe a info@sala-uno.es.mx')).toBe(false);
  });
});

describe('paginasDondeBuscar', () => {
  it('parte de la web de la sala y añade las páginas donde la ley obliga a poner un contacto', () => {
    const paginas = paginasDondeBuscar('https://www.sala-uno.es/inicio');
    expect(paginas[0]).toBe('https://www.sala-uno.es/inicio');
    expect(paginas).toEqual(expect.arrayContaining(['https://www.sala-uno.es/contacto', 'https://www.sala-uno.es/aviso-legal']));
    expect(paginas.length).toBeLessThanOrEqual(10);
  });

  it('una URL inválida o que no es http(s) no da páginas', () => {
    expect(paginasDondeBuscar('no-es-una-url')).toEqual([]);
    expect(paginasDondeBuscar('file:///etc/passwd')).toEqual([]);
    expect(paginasDondeBuscar(undefined)).toEqual([]);
  });
});

describe('verificarEmailConEvidencia', () => {
  const web = 'https://www.sala-uno.es/';
  const conCorreo = async () => true;

  it('acepta un email que aparece literalmente en una página de la propia sala', async () => {
    const leerPagina = vi.fn(async (url: string) => (url.endsWith('/contacto') ? 'Programación: <a href="mailto:booking@sala-uno.es">booking</a>' : '<html>inicio</html>'));
    const r = await verificarEmailConEvidencia('booking@sala-uno.es', { website: web, leerPagina, dominioConCorreo: conCorreo });
    expect(r).toEqual({ ok: true, evidencia: 'https://www.sala-uno.es/contacto' });
  });

  it('deja de leer páginas en cuanto lo encuentra', async () => {
    const leerPagina = vi.fn(async () => 'escribe a booking@sala-uno.es');
    await verificarEmailConEvidencia('booking@sala-uno.es', { website: web, leerPagina, dominioConCorreo: conCorreo });
    expect(leerPagina).toHaveBeenCalledTimes(1);
  });

  it('rechaza un email inventado: no aparece en ninguna página', async () => {
    const leerPagina = vi.fn(async () => 'solo hay un formulario de contacto');
    const r = await verificarEmailConEvidencia('info@sala-uno.es', { website: web, leerPagina, dominioConCorreo: conCorreo });
    expect(r).toEqual({ ok: false, motivo: 'no_aparece_en_su_web' });
  });

  it('aguanta páginas que fallan o no existen', async () => {
    const leerPagina = vi.fn(async (url: string) => {
      if (url.endsWith('/contacto')) throw new Error('timeout');
      return null;
    });
    const r = await verificarEmailConEvidencia('info@sala-uno.es', { website: web, leerPagina, dominioConCorreo: conCorreo });
    expect(r).toEqual({ ok: false, motivo: 'no_aparece_en_su_web' });
  });

  it('sin web no se puede comprobar: se rechaza', async () => {
    const leerPagina = vi.fn(async () => 'info@sala-uno.es');
    const r = await verificarEmailConEvidencia('info@sala-uno.es', { website: '', leerPagina, dominioConCorreo: conCorreo });
    expect(r).toEqual({ ok: false, motivo: 'sin_web' });
    expect(leerPagina).not.toHaveBeenCalled();
  });

  it('rechaza los emails de relleno y los mal formados sin tocar la red', async () => {
    const leerPagina = vi.fn(async () => 'info@sala.com booking@sala.com');
    expect(await verificarEmailConEvidencia('info@sala.com', { website: web, leerPagina, dominioConCorreo: conCorreo })).toEqual({ ok: false, motivo: 'relleno' });
    expect(await verificarEmailConEvidencia('sin-arroba', { website: web, leerPagina, dominioConCorreo: conCorreo })).toEqual({ ok: false, motivo: 'formato_invalido' });
    expect(leerPagina).not.toHaveBeenCalled();
  });

  it('aunque aparezca en la web, si su dominio no recibe correo se rechaza', async () => {
    const leerPagina = vi.fn(async () => 'booking@sala-uno.es');
    const r = await verificarEmailConEvidencia('booking@sala-uno.es', { website: web, leerPagina, dominioConCorreo: async () => false });
    expect(r).toEqual({ ok: false, motivo: 'dominio_sin_correo' });
  });
});
