import { describe, expect, it } from 'vitest';
import { dominioDelNombre, elegirWebOficial } from '../webOficial.js';

describe('dominioDelNombre', () => {
  it('acepta el dominio que lleva el nombre propio', () => {
    expect(dominioDelNombre('salajagger.com', 'Sala Jagger', 'Lugo')).toBe(true);
    expect(dominioDelNombre('istar-club.com', 'Ištar', 'Madrid')).toBe(true);
    expect(dominioDelNombre('lafabricaredondela.es', 'La Fábrica', 'Redondela')).toBe(true);
    expect(dominioDelNombre('groovemadrid.com', 'Groove', 'Pinto', 'Comunidad de Madrid')).toBe(true);
    expect(dominioDelNombre('teatreravalgandia.org', 'Teatre del Raval Gandía', 'Gandía')).toBe(true);
    expect(dominioDelNombre('azkenarockfestival.com', 'Azkena Rock Festival')).toBe(true);
    expect(dominioDelNombre('sala-clamores.es', 'Sala Clamores')).toBe(true);
    expect(dominioDelNombre('teatrocircomurcia.es', 'Teatro Circo Murcia')).toBe(true);
    expect(dominioDelNombre('mejillonrock.es', 'Festival Mejillón Rock de San Martín del Castañar', 'San Martín del Castañar')).toBe(true);
    expect(dominioDelNombre('sunblastfestival.com', 'Sunblast Festival Tenerife', 'Santa Cruz de Tenerife')).toBe(true);
  });

  it('la ciudad sola no es nombre propio', () => {
    expect(dominioDelNombre('turismobarcelona.com', 'Sala Barcelona', 'Barcelona')).toBe(false);
  });

  it('rechaza nombres solo genéricos y dominios ajenos', () => {
    expect(dominioDelNombre('salarock.com', 'Sala Rock')).toBe(false);
    expect(dominioDelNombre('teatroprincipal.es', 'Teatro Principal')).toBe(false);
    expect(dominioDelNombre('conciertosmadrid.com', 'Sala Wagon')).toBe(false);
    // Casos reales de la primera pasada: una empresa de fotomatones y otra marca con el nombre dentro.
    expect(dominioDelNombre('honeyfotomaton.com', 'Fotomatón', 'Madrid')).toBe(false);
    expect(dominioDelNombre('labwagon.com', 'Sala Wagon', 'Madrid')).toBe(false);
  });
});

describe('elegirWebOficial', () => {
  const r = (link: string, title = '', snippet = '') => ({ link, title, snippet });

  it('salta redes, entradas y agendas y se queda con el dominio propio, como origen', () => {
    const web = elegirWebOficial(
      [r('https://www.instagram.com/salawagon/'), r('https://www.entradas.com/sala-wagon'), r('https://salawagon.com/agenda', 'Sala Wagon · Madrid')],
      'Sala Wagon',
      'Madrid',
    );
    expect(web).toBe('https://salawagon.com/');
  });

  it('exige que el resultado mencione la ciudad cuando la ficha la tiene', () => {
    expect(elegirWebOficial([r('https://salaapolo.com/', 'Sala Apolo', 'Concerts a Barcelona')], 'Sala Apolo', 'Valencia')).toBeNull();
    expect(elegirWebOficial([r('https://salaapolo.com/', 'Sala Apolo', 'Concerts a Barcelona')], 'Sala Apolo', 'Barcelona')).toBe('https://salaapolo.com/');
  });

  it('un artículo de prensa no es la web aunque el dominio coincida con el nombre', () => {
    // Caso real: «El Comercio» de Getxo y el diario elcomercio.es.
    expect(elegirWebOficial([r('https://www.elcomercio.es/gijon/bares/el-comercio-getxo-123.html', 'El Comercio', 'Getxo')], 'El Comercio', 'Getxo')).toBeNull();
  });

  it('sin resultado seguro no devuelve nada', () => {
    expect(elegirWebOficial([r('https://www.facebook.com/x'), r('https://elpais.com/cultura/sala-wagon')], 'Sala Wagon', 'Madrid')).toBeNull();
    expect(elegirWebOficial([r('javascript:alert(1)')], 'Sala Wagon', null)).toBeNull();
  });
});
