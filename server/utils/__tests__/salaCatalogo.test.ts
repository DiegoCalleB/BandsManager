import { describe, it, expect } from 'vitest';
import {
  calcularFiabilidad,
  camposPublicos,
  ciudadPrincipal,
  claveSala,
  consolidarCampos,
  emailDeRol,
  fusionarConExistente,
  idDeSala,
  instagramDeLaSala,
  instagramPublico,
  esRecintoMasivo,
  motivoExclusion,
  senalesDeLeads,
  siguienteVerificadaEn,
  telefonoFijoEs,
  urlPublica,
  type CamposPublicosSala,
  type LeadParaCatalogo,
  type SenalesFiabilidad,
} from '../salaCatalogo.js';

const AHORA = new Date('2026-10-18T12:00:00Z');
const hace = (dias: number) => new Date(AHORA.getTime() - dias * 86_400_000).toISOString();
const lead = (c: Partial<LeadParaCatalogo> = {}): LeadParaCatalogo => ({ id: 'l1', band_id: 'b1', nombre_sala: 'Sala Apolo', ciudad: 'Barcelona', ...c });
const senales = (c: Partial<SenalesFiabilidad> = {}): SenalesFiabilidad => ({
  placeId: false, webDeclarada: false, emailValido: false, bandasConEntrega: 0, bandasConRespuesta: 0, rebotes: 0, ...c,
});

describe('claveSala', () => {
  it('ignora mayúsculas, acentos, signos y espacios', () => {
    const a = claveSala({ nombre: 'Sala  Apolo', ciudad: 'Barcelona' });
    expect(claveSala({ nombre: 'SALA APOLO!', ciudad: 'barcelóna' })).toBe(a);
  });

  it('el place_id manda sobre el nombre', () => {
    expect(claveSala({ placeId: ' ChIJ123 ', nombre: 'Lo que sea', ciudad: 'X' })).toBe('place:ChIJ123');
  });

  it('no fusiona salas distintas aunque se parezcan: no quita palabras como «sala» o «teatro»', () => {
    expect(claveSala({ nombre: 'Sala Apolo', ciudad: 'Barcelona' })).not.toBe(claveSala({ nombre: 'Teatro Apolo', ciudad: 'Barcelona' }));
    expect(claveSala({ nombre: 'Sala Apolo', ciudad: 'Barcelona' })).not.toBe(claveSala({ nombre: 'Sala Apolo', ciudad: 'Valencia' }));
  });

  it('sin ciudad (y sin place_id) o sin nombre no hay clave: un nombre suelto es ambiguo', () => {
    expect(claveSala({ nombre: 'Sala Apolo', ciudad: '' })).toBeNull();
    expect(claveSala({ nombre: '  ', ciudad: 'Madrid' })).toBeNull();
    expect(claveSala({ nombre: undefined, ciudad: 'Madrid' })).toBeNull();
  });

  it('el id es estable y distinto por clave', () => {
    expect(idDeSala('place:A')).toBe(idDeSala('place:A'));
    expect(idDeSala('place:A')).not.toBe(idDeSala('place:B'));
    expect(idDeSala('place:A')).toMatch(/^sala-[0-9a-f]{16}$/);
  });
});

describe('ciudades sucias de las bases reales', () => {
  it.each([
    ['Barcelona, España', 'Barcelona'],
    ['Lanuza (Huesca)', 'Lanuza'],
    ['Madrid / Sierra de Guadarrama', 'Madrid'],
    ['Valencia / Barcelona', 'Valencia'],
    ['  Bilbao ', 'Bilbao'],
  ])('«%s» es la ciudad «%s»', (entrada, esperada) => {
    expect(ciudadPrincipal(entrada)).toBe(esperada);
  });

  it('la misma sala con la ciudad escrita de varias formas tiene la misma clave', () => {
    const base = claveSala({ nombre: 'Apolo', ciudad: 'Barcelona' });
    expect(claveSala({ nombre: 'Apolo', ciudad: 'Barcelona, España' })).toBe(base);
    expect(claveSala({ nombre: 'Apolo', ciudad: 'Barcelona (Cataluña)' })).toBe(base);
  });

  it('ciudades que no son texto no rompen nada', () => {
    expect(ciudadPrincipal(undefined)).toBe('');
    expect(ciudadPrincipal(42)).toBe('');
  });
});

describe('motivoExclusion: solo entran los recintos donde se puede tocar', () => {
  it.each(['sala', 'festival', 'ayuntamiento', 'discoteca', 'SALA', ' Festival '])('«%s» entra', (tipo) => {
    expect(motivoExclusion(lead({ tipo }))).toBeNull();
  });

  it('un tipo vacío o ausente cuenta como sala', () => {
    expect(motivoExclusion(lead({ tipo: null }))).toBeNull();
    expect(motivoExclusion(lead({ tipo: '' }))).toBeNull();
  });

  it.each(['medio', 'grupo', 'agencia', 'productora', 'manager', 'sello', 'productor', 'patrocinador', 'supervisor_sync'])(
    '«%s» no es una sala: no entra',
    (tipo) => {
      expect(motivoExclusion(lead({ tipo }))).toBe('tipo');
      expect(camposPublicos(lead({ tipo }))).toBeNull();
    },
  );

  it.each(['Test', 'Test 1786526138562', 'test1', 'Prueba', 'prueba sala'])('«%s» es un lead de prueba', (nombre_sala) => {
    expect(motivoExclusion(lead({ nombre_sala }))).toBe('prueba');
  });

  it('salas reales cuyo nombre empieza parecido a «test» no se descartan', () => {
    expect(motivoExclusion(lead({ nombre_sala: 'Testigos de Jehová Club' }))).toBeNull();
    expect(motivoExclusion(lead({ nombre_sala: 'Pruebas de Sonido Madrid' }))).toBeNull();
  });

  it('sin ciudad ni place_id, sin clave; con place_id, entra aunque falte la ciudad', () => {
    expect(motivoExclusion(lead({ ciudad: null }))).toBe('sin_clave');
    expect(motivoExclusion(lead({ ciudad: null, place_id: 'P1' }))).toBeNull();
  });
});

describe('datos de contacto: solo los de la sala, nunca los de una persona', () => {
  it('acepta emails de rol y rechaza personales o de correo personal', () => {
    expect(emailDeRol('Booking@SalaApolo.com')).toBe('booking@salaapolo.com');
    expect(emailDeRol('programación@sala.es')).toBe('programación@sala.es');
    expect(emailDeRol('maria.lopez@salaapolo.com')).toBeNull();
    expect(emailDeRol('info@gmail.com')).toBeNull();
    // Relleno que dejan los scrapers y las plantillas: parece de rol pero no es de ninguna sala.
    expect(emailDeRol('contact@example.com')).toBeNull();
    expect(emailDeRol('info@ejemplo.com')).toBeNull();
    expect(emailDeRol('booking@sala.test')).toBeNull();
    expect(emailDeRol('booking@example.salaapolo.com')).toBe('booking@example.salaapolo.com');
    expect(emailDeRol('no es un email')).toBeNull();
    expect(emailDeRol(undefined)).toBeNull();
  });

  it('acepta teléfonos fijos de España y rechaza móviles y basura', () => {
    expect(telefonoFijoEs('93 442 40 00')).toBe('934424000');
    expect(telefonoFijoEs('+34 912 345 678')).toBe('912345678');
    expect(telefonoFijoEs('612 345 678')).toBeNull();
    expect(telefonoFijoEs('123')).toBeNull();
    expect(telefonoFijoEs(null)).toBeNull();
  });
});

describe('enlaces que se enseñarán a otras bandas', () => {
  it('urlPublica solo deja pasar http(s) con dominio y sin credenciales', () => {
    expect(urlPublica('salaapolo.com')).toBe('https://salaapolo.com/');
    expect(urlPublica('http://www.sala.es/agenda')).toBe('http://www.sala.es/agenda');
    expect(urlPublica('https://user:pass@sala.es/')).toBe('https://sala.es/');
    expect(urlPublica('javascript:alert(1)')).toBeNull();
    expect(urlPublica('data:text/html,<script>')).toBeNull();
    expect(urlPublica('ftp://sala.es')).toBeNull();
    expect(urlPublica('localhost')).toBeNull();
    expect(urlPublica('')).toBeNull();
  });

  it('instagramPublico devuelve solo el usuario', () => {
    expect(instagramPublico('@SalaApolo')).toBe('salaapolo');
    expect(instagramPublico('https://www.instagram.com/sala.apolo/?hl=es')).toBe('sala.apolo');
    expect(instagramPublico('hola que tal')).toBeNull();
    expect(instagramPublico('<script>')).toBeNull();
  });
});

describe('camposPublicos', () => {
  it('saca solo los campos públicos y deja fuera lo privado de la banda', () => {
    const c = camposPublicos({
      ...lead({ aforo: 400, website: 'salaapolo.com', email_contacto: 'info@salaapolo.com', telefono: '934424000', estado: 'negociando' }),
      // Aunque el objeto traiga más cosas por error, no pasan a la ficha.
      ...({ pitch_generado: 'secreto', notas: 'precio pactado 900€' } as object),
    } as LeadParaCatalogo);
    expect(c).toMatchObject({ nombre: 'Sala Apolo', ciudad: 'Barcelona', aforo: 400, website: 'https://salaapolo.com/', email_contacto: 'info@salaapolo.com', telefono: '934424000', tipo: 'sala' });
    expect(Object.keys(c!).sort()).toEqual(
      ['aforo', 'ciudad', 'clave', 'direccion', 'email_contacto', 'genero', 'instagram', 'nombre', 'place_id', 'region', 'telefono', 'tipo', 'website'],
    );
    expect(JSON.stringify(c)).not.toMatch(/secreto|900|negociando|b1/);
  });

  it('un aforo 0 o negativo es «sin dato»', () => {
    expect(camposPublicos(lead({ aforo: 0 }))!.aforo).toBeNull();
    expect(camposPublicos(lead({ aforo: -5 }))!.aforo).toBeNull();
  });

  it('limpia el texto: sin etiquetas ni caracteres de control, acotado', () => {
    const c = camposPublicos(lead({ nombre_sala: 'Sala <b>Apolo</b>\n\u0000', genero: 'x'.repeat(500) }))!;
    expect([...c.nombre].some((ch) => ['<', '>', '\n', '\u0000'].includes(ch))).toBe(false);
    expect(c.genero!.length).toBeLessThanOrEqual(80);
  });

  it('devuelve null si no se puede identificar la sala', () => {
    expect(camposPublicos(lead({ ciudad: null }))).toBeNull();
  });
});

describe('consolidarCampos: manda el consenso entre bandas', () => {
  const ficha = (c: Partial<CamposPublicosSala>): CamposPublicosSala => ({ ...camposPublicos(lead())!, ...c });

  it('elige el valor más repetido y no se deja pisar por un valor raro', () => {
    const r = consolidarCampos([ficha({ aforo: 400 }), ficha({ aforo: 400 }), ficha({ aforo: 4000 })]);
    expect(r.aforo).toBe(400);
  });

  it('en empate es estable (siempre el mismo resultado)', () => {
    const a = consolidarCampos([ficha({ genero: 'rock' }), ficha({ genero: 'indie' })]);
    const b = consolidarCampos([ficha({ genero: 'indie' }), ficha({ genero: 'rock' })]);
    expect(a.genero).toBe(b.genero);
  });

  it('ignora los huecos: un dato escrito por una sola banda se conserva', () => {
    expect(consolidarCampos([ficha({ website: null }), ficha({ website: 'https://sala.es/' })]).website).toBe('https://sala.es/');
  });
});

describe('fusionarConExistente', () => {
  const nuevo = camposPublicos(lead({ aforo: 999, website: 'otra.com' }))!;

  it('una sala sin verificar se actualiza con lo nuevo', () => {
    expect(fusionarConExistente({ ...camposPublicos(lead({ aforo: 400 }))!, nivel: 'probable' }, nuevo).aforo).toBe(999);
  });

  it('una sala verificada no cambia lo que ya tiene, solo se le rellenan los huecos', () => {
    const existente = { ...camposPublicos(lead({ aforo: 400, website: null }))!, nivel: 'verificada' as const };
    const r = fusionarConExistente(existente, nuevo);
    expect(r.aforo).toBe(400);
    expect(r.website).toBe('https://otra.com/');
  });
});

describe('senalesDeLeads', () => {
  const consolidada = camposPublicos(lead())!;

  it('cuenta bandas, no leads, y una respuesta implica que el correo llegó', () => {
    const s = senalesDeLeads(
      [lead({ id: '1', band_id: 'a', estado: 'negociando' }), lead({ id: '2', band_id: 'a', estado: 'interesado' }), lead({ id: '3', band_id: 'b', estado: 'enviado', fecha_envio: hace(10) })],
      AHORA,
      consolidada,
    );
    expect(s).toMatchObject({ bandasConRespuesta: 1, bandasConEntrega: 2, rebotes: 0 });
  });

  it('un envío reciente (menos de 3 días) aún no cuenta como entregado: puede rebotar', () => {
    expect(senalesDeLeads([lead({ fecha_envio: hace(1), estado: 'enviado' })], AHORA, consolidada).bandasConEntrega).toBe(0);
  });

  it('un rebote cuenta aparte y anula la entrega de ese lead', () => {
    const s = senalesDeLeads([lead({ fecha_envio: hace(20), rebotado: true, estado: 'enviado' })], AHORA, consolidada);
    expect(s).toMatchObject({ rebotes: 1, bandasConEntrega: 0 });
  });

  it('un lead nuevo sin contactar no aporta nada', () => {
    expect(senalesDeLeads([lead({ estado: 'nuevo' })], AHORA, consolidada)).toMatchObject({ bandasConEntrega: 0, bandasConRespuesta: 0, rebotes: 0 });
  });

  it('fechas inválidas no rompen nada', () => {
    expect(senalesDeLeads([lead({ fecha_envio: 'ayer', estado: 'enviado' })], AHORA, consolidada).bandasConEntrega).toBe(0);
  });
});

describe('calcularFiabilidad', () => {
  it('sin ninguna señal: 0 y sin verificar', () => {
    expect(calcularFiabilidad(senales(), AHORA)).toEqual({ puntuacion: 0, nivel: 'sin_verificar' });
  });

  it('solo web y email declarados no bastan', () => {
    expect(calcularFiabilidad(senales({ webDeclarada: true, emailValido: true }), AHORA)).toEqual({ puntuacion: 15, nivel: 'sin_verificar' });
  });

  it('una sala que respondió a una banda es «probable»', () => {
    expect(calcularFiabilidad(senales({ bandasConRespuesta: 1, bandasConEntrega: 1, emailValido: true, webDeclarada: true }), AHORA)).toEqual({ puntuacion: 60, nivel: 'probable' });
  });

  it('place_id más correo entregado y respuesta la hacen «verificada»', () => {
    expect(calcularFiabilidad(senales({ placeId: true, bandasConRespuesta: 1, bandasConEntrega: 1, emailValido: true, webDeclarada: true }), AHORA)).toEqual({ puntuacion: 90, nivel: 'verificada' });
  });

  it('la puntuación máxima es 100', () => {
    expect(calcularFiabilidad(senales({ placeId: true, webDeclarada: true, webResponde: true, emailValido: true, bandasConEntrega: 5, bandasConRespuesta: 5 }), AHORA).puntuacion).toBe(100);
  });

  it('un rebote resta 40, nunca baja de 0 y impide ser verificada', () => {
    expect(calcularFiabilidad(senales({ emailValido: true, rebotes: 1 }), AHORA).puntuacion).toBe(0);
    const r = calcularFiabilidad(senales({ placeId: true, webDeclarada: true, webResponde: true, emailValido: true, bandasConRespuesta: 1, bandasConEntrega: 1, rebotes: 1 }), AHORA);
    expect(r.nivel).not.toBe('verificada');
  });

  it('sin correo entregado no hay «verificada» aunque la puntuación sea alta', () => {
    expect(calcularFiabilidad(senales({ placeId: true, webDeclarada: true, webResponde: true, emailValido: true }), AHORA)).toMatchObject({ puntuacion: 55, nivel: 'probable' });
  });

  it('pasados 180 días desde la verificación, la puntuación se reduce a la mitad', () => {
    const base = senales({ placeId: true, bandasConRespuesta: 1, bandasConEntrega: 1, emailValido: true, webDeclarada: true });
    expect(calcularFiabilidad({ ...base, verificadaEn: new Date(AHORA.getTime() - 100 * 86_400_000) }, AHORA).puntuacion).toBe(90);
    expect(calcularFiabilidad({ ...base, verificadaEn: new Date(AHORA.getTime() - 200 * 86_400_000) }, AHORA)).toEqual({ puntuacion: 45, nivel: 'probable' });
  });
});

describe('siguienteVerificadaEn', () => {
  const previa = { verificadaEn: new Date('2026-01-01T00:00:00Z'), bandasConEntrega: 1, bandasConRespuesta: 1 };

  it('sin verificar no inventa fecha', () => {
    expect(siguienteVerificadaEn(null, senales(), 'sin_verificar', AHORA)).toBeNull();
    expect(siguienteVerificadaEn(previa, senales(), 'sin_verificar', AHORA)).toEqual(previa.verificadaEn);
  });

  it('se renueva solo cuando hay señales más fuertes', () => {
    expect(siguienteVerificadaEn(null, senales({ bandasConRespuesta: 1 }), 'probable', AHORA)).toEqual(AHORA);
    expect(siguienteVerificadaEn(previa, senales({ bandasConEntrega: 1, bandasConRespuesta: 1 }), 'probable', AHORA)).toEqual(previa.verificadaEn);
    expect(siguienteVerificadaEn(previa, senales({ bandasConEntrega: 2, bandasConRespuesta: 1 }), 'probable', AHORA)).toEqual(AHORA);
  });
});

describe('instagramDeLaSala: solo cuentas que se parecen a la sala', () => {
  it('acepta el usuario que contiene una palabra con contenido del nombre', () => {
    expect(instagramDeLaSala('sirocosala', 'Siroco')).toBe('sirocosala');
    expect(instagramDeLaSala('ferrarabuskersfestival', 'Ferrara Buskers Festival')).toBe('ferrarabuskersfestival');
    expect(instagramDeLaSala('sala.apolo', 'Sala Apolo')).toBe('sala.apolo');
    expect(instagramDeLaSala('cotton_club_bilbao', 'Cotton Club Bilbao')).toBe('cotton_club_bilbao');
  });

  it('descarta una cuenta sin relación con el nombre: podría ser de una persona', () => {
    expect(instagramDeLaSala('alex.leon.music', 'Honky Tonk Bar')).toBeNull();
    expect(instagramDeLaSala('dipuhu', 'Foro Iberoamericano de La Rábida')).toBeNull();
  });

  it('una palabra genérica (sala, club, teatro...) no basta para dar por buena una cuenta', () => {
    expect(instagramDeLaSala('mi.club.personal', 'Club')).toBeNull();
    expect(instagramDeLaSala('teatro_de_juan', 'Sala Teatro')).toBeNull();
  });

  it('sin usuario devuelve null', () => {
    expect(instagramDeLaSala(null, 'Siroco')).toBeNull();
  });

  it('camposPublicos aplica la regla al lead', () => {
    expect(camposPublicos(lead({ nombre_sala: 'Honky Tonk Bar', instagram: '@alex.leon.music' }))?.instagram).toBeNull();
    expect(camposPublicos(lead({ nombre_sala: 'Siroco', instagram: '@sirocosala' }))?.instagram).toBe('sirocosala');
  });
});

describe('motivoExclusion: las agencias no son salas', () => {
  it.each(['Kasba Music (Management & Booking)', 'Propaganda Pel Fet (Booking Agency)', 'Agencia Sonora'])('«%s» no entra', (nombre_sala) => {
    expect(motivoExclusion(lead({ nombre_sala }))).toBe('tipo');
    expect(camposPublicos(lead({ nombre_sala }))).toBeNull();
  });

  it('un nombre que solo se parece no se excluye', () => {
    expect(motivoExclusion(lead({ nombre_sala: 'Sala Mánager' }))).toBeNull();
    expect(motivoExclusion(lead({ nombre_sala: 'Booking Club' }))).toBeNull();
  });
});

describe('recintos masivos: no son para una banda que busca salas', () => {
  it('el WiZink Center y similares quedan fuera aunque el lead traiga un aforo absurdo', () => {
    for (const nombre of ['WiZink Center', 'WiZink Center (La Sala / Pista)', 'Movistar Arena', 'Palau Sant Jordi']) {
      expect(motivoExclusion(lead({ nombre_sala: nombre, ciudad: 'Madrid', aforo: 11 })), nombre).toBe('tipo');
    }
  });
  it('por encima de 5.000 de aforo, una sala o discoteca queda fuera; un festival no se mide por aforo', () => {
    expect(esRecintoMasivo({ nombre: 'Gran Pabellón', aforo: 5001, tipo: 'sala' })).toBe(true);
    expect(esRecintoMasivo({ nombre: 'Gran Pabellón', aforo: 5000, tipo: 'sala' })).toBe(false);
    expect(esRecintoMasivo({ nombre: 'Viña Rock', aforo: 50000, tipo: 'festival' })).toBe(false);
  });
  it('no confunde salas con nombre parecido ni deja fuera las que no declaran aforo', () => {
    expect(esRecintoMasivo({ nombre: 'Sala Movistar Arenal', aforo: 300 })).toBe(false);
    expect(esRecintoMasivo({ nombre: 'Razzmatazz', aforo: null })).toBe(false);
    expect(esRecintoMasivo({ nombre: 'Razzmatazz (Sala 2)', aforo: 2000 })).toBe(false);
  });
});
