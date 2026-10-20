import { describe, it, expect } from 'vitest';
import { datosDeWebSala, generoDeLaWeb } from '../datosDeWebSala.js';

const portada = `<html><body><h1>Sala Moby Dick</h1>
<a href="https://www.instagram.com/p/XYZ/">post</a><a href="https://instagram.com/cervezas_sol">patrocinador</a>
<a href="https://instagram.com/salamoby">Síguenos</a>
<a href="mailto:info@salamoby.es">Escríbenos</a>
<a href="tel:+34 910 123 456">Llamar</a></body></html>`;

describe('datosDeWebSala', () => {
  it('saca Instagram, email y teléfono de la propia sala', () => {
    expect(datosDeWebSala([portada], 'Sala Moby Dick')).toMatchObject({ instagram: 'salamoby', email_contacto: 'info@salamoby.es', telefono: '910123456' });
  });

  it('no coge el Instagram de un patrocinador ni un email personal ni un móvil', () => {
    const html = `<a href="https://instagram.com/cervezas_sol">x</a><a href="mailto:juan.perez@gmail.com">x</a><a href="tel:600111222">x</a><p>Escribe a maria@salamoby.es</p>`;
    expect(datosDeWebSala([html], 'Sala Moby Dick')).toMatchObject({ instagram: null, email_contacto: null, telefono: null });
  });

  it('busca en todas las páginas y coge el primer dato válido', () => {
    const r = datosDeWebSala(['<p>Sin datos</p>', '<a href="mailto:booking@salamoby.es">x</a>'], 'Sala Moby Dick');
    expect(r.email_contacto).toBe('booking@salamoby.es');
  });

  it('un teléfono fijo con la etiqueta «Teléfono» en el texto también vale', () => {
    expect(datosDeWebSala(['<p>Teléfono: 981 574 399</p>'], 'Capitol').telefono).toBe('981574399');
  });

  it('no confunde un fichero con un email', () => {
    expect(datosDeWebSala(['<img src="logo@2x.png">'], 'Sala X').email_contacto).toBeNull();
  });

  it('una web vacía no da nada', () => {
    expect(datosDeWebSala([], 'Sala X')).toEqual({ instagram: null, email_contacto: null, telefono: null, genero: null });
  });
});

describe('generoDeLaWeb', () => {
  const pagina = (texto: string) => `<html><script>var rock = 1; rock rock rock</script><body><p>${texto}</p></body></html>`;

  it('anota el género que aparece de forma clara', () => {
    expect(generoDeLaWeb([pagina('Conciertos de rock y punk. Rock todos los viernes, rock alternativo. Punk, punk y más punk.')])).toBe('Punk / Rock');
  });

  it('una mención suelta no define el género', () => {
    expect(generoDeLaWeb([pagina('Alguna noche suena jazz. Jazz de vez en cuando.')])).toBeNull();
  });

  it('un género menor frente al dominante se descarta', () => {
    expect(generoDeLaWeb([pagina('Jazz jazz jazz jazz jazz jazz jazz jazz jazz jazz. Blues blues blues.')])).toBe('Jazz');
  });

  it('no cuenta el texto de los scripts', () => {
    expect(generoDeLaWeb(['<script>rock rock rock rock rock</script><p>Hola</p>'])).toBeNull();
  });

  it('no cuenta palabras que contienen el género', () => {
    expect(generoDeLaWeb([pagina('Rocky rockero rocks karaoke. Popular popurrí. Metalúrgica metálico.')])).toBeNull();
  });
});
