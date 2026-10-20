import { describe, it, expect } from 'vitest';
import { aforoDeLaWeb, datosDeWebSala, generoDeLaWeb } from '../datosDeWebSala.js';

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
    expect(datosDeWebSala([], 'Sala X')).toEqual({ instagram: null, email_contacto: null, telefono: null, genero: null, aforo: null });
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

describe('aforoDeLaWeb', () => {
  const web = (texto: string) => [`<html><body><p>${texto}</p></body></html>`];

  it('lee las formas habituales de decir el aforo', () => {
    expect(aforoDeLaWeb(web('Aforo: 300 personas'))).toBe(300);
    expect(aforoDeLaWeb(web('Capacidad para 250 personas'))).toBe(250);
    expect(aforoDeLaWeb(web('Aforo máximo de 450'))).toBe(450);
    expect(aforoDeLaWeb(web('Una sala con 180 personas de aforo'))).toBe(180);
    expect(aforoDeLaWeb(web('CAPACIDAD HASTA 1.200 PERSONAS'))).toBe(1200);
  });

  it('acepta el mismo número repetido (portada y ficha)', () => {
    expect(aforoDeLaWeb([...web('Aforo 300 personas'), ...web('Capacidad: 300 personas')])).toBe(300);
  });

  it('con dos salas distintas no apuesta', () => {
    expect(aforoDeLaWeb(web('Sala A aforo 300 personas. Sala B aforo 800 personas.'))).toBeNull();
  });

  it('descarta números absurdos, años sueltos y textos sin aforo', () => {
    expect(aforoDeLaWeb(web('Aforo 5'))).toBeNull();
    expect(aforoDeLaWeb(web('Aforo completo en 2024'))).toBeNull();
    expect(aforoDeLaWeb(web('Aforo 999999 personas'))).toBeNull();
    expect(aforoDeLaWeb(web('Programación de otoño. Teléfono 981 574 399'))).toBeNull();
    expect(aforoDeLaWeb([])).toBeNull();
  });

  it('un año con la unidad sí es un aforo, y los scripts no cuentan', () => {
    expect(aforoDeLaWeb(web('Capacidad 2000 personas'))).toBe(2000);
    expect(aforoDeLaWeb(['<script>var aforo = 300 personas</script><p>hola</p>'])).toBeNull();
  });
});
