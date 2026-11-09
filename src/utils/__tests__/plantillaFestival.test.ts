import { describe, expect, it } from 'vitest';
import { datosDePlantilla, familiaDeFestival, redactarPitchFestival, rellenarPlantilla } from '../plantillaFestival';

const ahora = new Date('2026-11-09T10:00:00Z');
const BANDA = 'Los Ejemplos';

describe('datosDePlantilla', () => {
  it('limpia el nombre: sin año, sin paréntesis ni cola tras guion', () => {
    expect(datosDePlantilla({ nombre_sala: 'Viña Rock 2027' }, ahora).festival).toBe('Viña Rock');
    expect(datosDePlantilla({ nombre_sala: 'Igualada Rock City (IRC Festival)' }, ahora).festival).toBe('Igualada Rock City');
    expect(datosDePlantilla({ nombre_sala: 'Farrakes Punk Festival - Malgrat de Mar' }, ahora).festival).toBe('Farrakes Punk Festival');
  });

  it('quita el país de la ciudad y lo usa para elegir el idioma', () => {
    const d = datosDePlantilla({ nombre_sala: 'Nature One', ciudad: 'Kastellaun (Alemania)' }, ahora);
    expect(d.ciudad).toBe('Kastellaun');
    expect(d.idioma).toBe('en');
    expect(datosDePlantilla({ nombre_sala: 'Fumega Fest', ciudad: 'Betanzos' }, ahora).idioma).toBe('es');
    expect(datosDePlantilla({ nombre_sala: 'Reggae Geel', ciudad: 'Geel', website: 'https://www.reggaegeel.be/' }, ahora).idioma).toBe('en');
    expect(datosDePlantilla({ nombre_sala: 'X', ciudad: 'Madrid (España)' }, ahora).idioma).toBe('es');
    expect(datosDePlantilla({ nombre_sala: 'X', ciudad: 'Villena (Alicante)' }, ahora).idioma).toBe('es');
  });

  it('usa también el país de la región, el nombre de país como ciudad y el prefijo de los europeos', () => {
    expect(datosDePlantilla({ nombre_sala: 'Truck', ciudad: 'Oxfordshire', region: 'UK', website: 'https://truckfestival.com' }, ahora).idioma).toBe('en');
    expect(datosDePlantilla({ nombre_sala: 'Ferrara', ciudad: 'Ferrara', region: 'Emilia-Romaña (Italia)' }, ahora).idioma).toBe('en');
    expect(datosDePlantilla({ nombre_sala: 'Plage Noire', ciudad: 'Alemania' }, ahora).idioma).toBe('en');
    expect(datosDePlantilla({ id: 'lead-fest-eu-bukta', nombre_sala: 'Bukta', ciudad: 'Tromsø' }, ahora).idioma).toBe('en');
    expect(datosDePlantilla({ id: 'lead-fest-eu-fira', nombre_sala: 'Fira', ciudad: 'Tàrrega (España)' }, ahora).idioma).toBe('es');
    expect(datosDePlantilla({ nombre_sala: 'Rototom', ciudad: 'Benicàssim', region: 'Comunidad Valenciana', website: 'https://rototomsunsplash.com' }, ahora).idioma).toBe('es');
  });

  it('traduce los géneros a estilos y descarta los genéricos', () => {
    expect(datosDePlantilla({ nombre_sala: 'X', genero: 'Rock, Punk, Ska' }, ahora).estilos).toEqual(['el rock', 'el punk', 'el ska']);
    expect(datosDePlantilla({ nombre_sala: 'X', genero: 'Multigénero' }, ahora).estilos).toEqual([]);
    expect(datosDePlantilla({ nombre_sala: 'X', genero: 'Hip-hop, Electrónica' }, ahora).estilos).toEqual(['el rap', 'la electrónica']);
  });
});

describe('frase de la edición', () => {
  const base = { nombre_sala: 'Fumega Fest', ciudad: 'Betanzos' };
  it('fecha de 2027 publicada: la cita con su rango', () => {
    const d = datosDePlantilla({ ...base, festival_start_date: '2027-07-15', festival_end_date: '2027-07-19' }, ahora);
    expect(d.fraseEdicion).toContain('del 15 al 19 de julio de 2027');
  });
  it('edición pasada: dice cuándo fue la última, con mes y tercio del mes', () => {
    const d = datosDePlantilla({ ...base, festival_start_date: '2026-06-26', festival_end_date: '2026-06-27' }, ahora);
    expect(d.fraseEdicion).toContain('la última edición fue a finales de junio');
    expect(d.fraseEdicion).toContain('Betanzos');
  });
  it('sin fecha: solo la ciudad, sin inventar nada', () => {
    const d = datosDePlantilla(base, ahora);
    expect(d.fraseEdicion).toBe(' Nos apetece mucho pasar por Betanzos.');
    expect(datosDePlantilla({ nombre_sala: 'X' }, ahora).fraseEdicion).toBe('');
  });
});

describe('redactarPitchFestival', () => {
  it('Pirata-style: nombra los estilos del festival y lleva el asunto de Black Friday', () => {
    const t = redactarPitchFestival({ nombre_sala: 'Pirata Madrid', ciudad: 'Madrid', genero: 'Rock, Ska, Mestizaje, Rap' }, { banda: BANDA, estiloBanda: 'electrónica y ska', ahora });
    expect(t.startsWith('Asunto: Black Friday: Los Ejemplos al caché de 2026 para Pirata Madrid\n\nBuenas gente de Pirata Madrid,')).toBe(true);
    expect(t).toContain('entre el rock, el ska, el mestizaje y el rap');
    expect(t).toContain('electrónica y ska');
    expect(t).toContain('¡Un abrazo!');
  });

  it('sin estilos no afirma conocer al público', () => {
    const t = redactarPitchFestival({ nombre_sala: 'Latitude Festival', ciudad: 'Suffolk (Reino Unido)', genero: 'Multigénero' }, { banda: BANDA, ahora });
    expect(t).not.toContain('Conocemos');
  });

  it('un festival de fuera se escribe en inglés', () => {
    const t = redactarPitchFestival({ nombre_sala: 'Deichbrand', ciudad: 'Cuxhaven (Alemania)', genero: 'Rock, Electrónica', festival_start_date: '2027-07-15', festival_end_date: '2027-07-19' }, { banda: BANDA, ahora });
    expect(t.startsWith('Asunto: Black Friday: Los Ejemplos at our 2026 fee for Deichbrand')).toBe(true);
    expect(t).toContain('Hi Deichbrand team,');
    expect(t).toContain('15–19 July 2027');
  });

  it('en inglés traduce el estilo de la banda y no deja español en la frase', () => {
    const t = redactarPitchFestival({ nombre_sala: 'Deichbrand', ciudad: 'Cuxhaven (Alemania)' }, { banda: BANDA, estiloBanda: 'electrónica-fusión y balkan-ska festiva y bailable', ahora });
    expect(t).toContain('Los Ejemplos brings electronic music, fusion, balkan music and ska');
    expect(t).not.toContain('electrónica');
  });

  it('no deja ningún hueco sin rellenar ni lleva firma ni enlace', () => {
    const t = redactarPitchFestival({ nombre_sala: 'Fumega Fest', ciudad: 'Betanzos', genero: 'Rock' }, { banda: BANDA, ahora });
    expect(t).not.toMatch(/\{[a-z_]+\}/);
    expect(t).not.toMatch(/https?:/);
  });

  it('rellenarPlantilla sustituye todos los huecos', () => {
    expect(rellenarPlantilla('Hola {festival} y {festival}', { festival: 'X' } as never)).toBe('Hola X y X');
  });
});

describe('énfasis según el tipo de festival', () => {
  const estilosBanda = {
    electro: { es: 'electro con alma', en: 'electro soul', remate_es: 'a bailar', remate_en: 'to dance' },
    reggae: { es: 'reggae con pulso', en: 'reggae pulse', remate_es: 'a moverse', remate_en: 'to move' },
    defecto: { es: 'mezcla', en: 'mix', remate_es: 'a saltar', remate_en: 'to jump' },
  };
  it('clasifica por el primer género que decide; indie y pop no deciden', () => {
    expect(familiaDeFestival('Indie, Electrónica')).toBe('electro');
    expect(familiaDeFestival('Rock, Reggae')).toBe('cana');
    expect(familiaDeFestival('Dub')).toBe('reggae');
    expect(familiaDeFestival('Folk, Música del mundo')).toBe('raices');
    expect(familiaDeFestival('Pop')).toBe('defecto');
    expect(familiaDeFestival(null)).toBe('defecto');
  });
  it('cada familia presenta a la banda a su manera y cae en defecto si falta', () => {
    const base = { nombre_sala: 'X Fest', ciudad: 'Madrid', region: 'ES' };
    const plantillas = { es: '{banda} es {estilo_banda} {remate}.' };
    const e = redactarPitchFestival({ ...base, genero: 'Electrónica' }, { banda: 'Los Ejemplos', estilosBanda, plantillas });
    const r = redactarPitchFestival({ ...base, genero: 'Reggae' }, { banda: 'Los Ejemplos', estilosBanda, plantillas });
    const c = redactarPitchFestival({ ...base, genero: 'Rock' }, { banda: 'Los Ejemplos', estilosBanda, plantillas });
    expect(e).toBe('Los Ejemplos es electro con alma a bailar.');
    expect(r).toBe('Los Ejemplos es reggae con pulso a moverse.');
    expect(c).toBe('Los Ejemplos es mezcla a saltar.');
  });
});
