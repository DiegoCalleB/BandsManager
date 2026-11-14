import { describe, expect, it } from 'vitest';
import { dominioDelNombre, elegirWebOficial } from '../webOficial.js';

describe('dominioDelNombre', () => {
  it('acepta el dominio que lleva el nombre propio', () => {
    expect(dominioDelNombre('www.labwagon.com', 'Sala Wagon')).toBe(true);
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
  });
});

describe('elegirWebOficial', () => {
  const r = (link: string, title = '', snippet = '') => ({ link, title, snippet });

  it('salta redes, entradas y agendas y se queda con el dominio propio, como origen', () => {
    const web = elegirWebOficial(
      [r('https://www.instagram.com/labwagon/'), r('https://www.entradas.com/sala-wagon'), r('https://labwagon.com/agenda/2026', 'LabWagon Live · Madrid')],
      'Sala Wagon',
      'Madrid',
    );
    expect(web).toBe('https://labwagon.com/');
  });

  it('exige que el resultado mencione la ciudad cuando la ficha la tiene', () => {
    expect(elegirWebOficial([r('https://salaapolo.com/', 'Sala Apolo', 'Concerts a Barcelona')], 'Sala Apolo', 'Valencia')).toBeNull();
    expect(elegirWebOficial([r('https://salaapolo.com/', 'Sala Apolo', 'Concerts a Barcelona')], 'Sala Apolo', 'Barcelona')).toBe('https://salaapolo.com/');
  });

  it('sin resultado seguro no devuelve nada', () => {
    expect(elegirWebOficial([r('https://www.facebook.com/x'), r('https://elpais.com/cultura/sala-wagon')], 'Sala Wagon', 'Madrid')).toBeNull();
    expect(elegirWebOficial([r('javascript:alert(1)')], 'Sala Wagon', null)).toBeNull();
  });
});
