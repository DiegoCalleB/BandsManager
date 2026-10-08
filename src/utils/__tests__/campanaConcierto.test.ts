import { describe, expect, it } from 'vitest';
import { CANALES_PUBLICACION, describirCuando, diasEntre, fechaCorta, hashtagsCampana, planificarCampana, plataformaDeCanal, sanearVarianteIA, sumarDias, textoPieza, variantesPieza, type DatosPieza } from '../campanaConcierto';

const ids = (fechaConcierto: string, hoy: string) => planificarCampana(fechaConcierto, hoy).map((h) => `${h.id}@${h.fecha}`);

describe('fechas', () => {
  it('suma y resta días sin romperse en cambios de mes ni de hora', () => {
    expect(sumarDias('2026-10-16', -21)).toBe('2026-09-25');
    expect(sumarDias('2026-03-29', 1)).toBe('2026-03-30'); // cambio de hora en España
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(diasEntre('2026-10-08', '2026-10-16')).toBe(8);
    expect(diasEntre('2026-10-16', '2026-10-08')).toBe(-8);
  });
});

describe('planificarCampana', () => {
  it('con tiempo de sobra (más de 21 días) salen los cuatro hitos en sus fechas ideales', () => {
    expect(ids('2026-11-20', '2026-10-08')).toEqual([
      'anuncio@2026-10-30',
      'recordatorio@2026-11-13',
      'ultima_llamada@2026-11-19',
      'dia_d@2026-11-20',
    ]);
  });

  it('a 21 días exactos el anuncio es hoy', () => {
    const h = planificarCampana('2026-10-29', '2026-10-08');
    expect(h[0]).toMatchObject({ id: 'anuncio', fecha: '2026-10-08', estado: 'hoy' });
    expect(h).toHaveLength(4);
  });

  it('a 8 días: el anuncio ya no cabe en su fecha, se hace HOY y se mantiene el resto', () => {
    expect(ids('2026-10-16', '2026-10-08')).toEqual([
      'anuncio@2026-10-08',
      'recordatorio@2026-10-09',
      'ultima_llamada@2026-10-15',
      'dia_d@2026-10-16',
    ]);
  });

  it('a 7 días el recordatorio cae hoy y NO se añade un anuncio el mismo día', () => {
    expect(ids('2026-10-15', '2026-10-08')).toEqual(['recordatorio@2026-10-08', 'ultima_llamada@2026-10-14', 'dia_d@2026-10-15']);
  });

  it('a 3 días: anuncio hoy + última llamada + día D (el recordatorio ya pasó)', () => {
    expect(ids('2026-10-11', '2026-10-08')).toEqual(['anuncio@2026-10-08', 'ultima_llamada@2026-10-10', 'dia_d@2026-10-11']);
  });

  it('a 2 días: anuncio hoy (aún da tiempo), mañana última llamada, pasado el día D', () => {
    expect(ids('2026-10-10', '2026-10-08')).toEqual(['anuncio@2026-10-08', 'ultima_llamada@2026-10-09', 'dia_d@2026-10-10']);
  });

  it('a 1 día: solo la última llamada (hoy) y el día D; anunciar con un día de margen no tiene sentido', () => {
    expect(ids('2026-10-09', '2026-10-08')).toEqual(['ultima_llamada@2026-10-08', 'dia_d@2026-10-09']);
  });

  it('el mismo día: solo el día D', () => {
    expect(ids('2026-10-08', '2026-10-08')).toEqual(['dia_d@2026-10-08']);
  });

  it('un concierto que ya pasó no tiene campaña', () => {
    expect(planificarCampana('2026-10-07', '2026-10-08')).toEqual([]);
    expect(planificarCampana('no-es-fecha', '2026-10-08')).toEqual([]);
  });

  it('marca qué hito es de hoy y los ordena por fecha', () => {
    for (const dias of [0, 1, 2, 3, 7, 8, 14, 21, 22, 60]) {
      const concierto = sumarDias('2026-10-08', dias);
      const h = planificarCampana(concierto, '2026-10-08');
      expect(h.length, `${dias} días`).toBeGreaterThan(0);
      expect(h.map((x) => x.fecha)).toEqual([...h.map((x) => x.fecha)].sort());
      expect(h.every((x) => x.fecha >= '2026-10-08' && x.fecha <= concierto)).toBe(true);
      expect(h.filter((x) => x.estado === 'hoy').length).toBeLessThanOrEqual(1);
      expect(new Set(h.map((x) => x.id)).size).toBe(h.length);
      expect(h[h.length - 1].id).toBe('dia_d');
    }
  });
});

describe('textos', () => {
  const datos: DatosPieza = { banda: 'Os Herdeiros', sala: 'Sala Capitol', ciudad: 'Santiago', fecha: '2026-10-16', enlace: 'https://bandmanager.io/r/abcdefg' };

  it('cada hito tiene dos variantes distintas con el enlace dentro', () => {
    for (const id of ['anuncio', 'recordatorio', 'ultima_llamada', 'dia_d'] as const) {
      const [a, b] = variantesPieza(id, datos);
      expect(a).not.toBe(b);
      expect(a).toContain('https://bandmanager.io/r/abcdefg');
      expect(b).toContain('https://bandmanager.io/r/abcdefg');
      expect(a).toContain('Sala Capitol');
    }
  });

  it('sin enlace el texto sale limpio, sin «Aquí:» huérfano ni «undefined»', () => {
    for (const id of ['anuncio', 'recordatorio', 'ultima_llamada', 'dia_d'] as const) {
      for (const v of [0, 1] as const) {
        const t = textoPieza(id, v, { ...datos, enlace: null });
        expect(t).not.toMatch(/undefined|null|Aquí:\s*$|Entradas:\s*$/);
        expect(t).not.toContain('http');
        expect(t).toBe(t.trim());
      }
    }
  });

  it('respeta las reglas de redacción del repo: sin guiones largos ni emojis ni saltos raros', () => {
    for (const id of ['anuncio', 'recordatorio', 'ultima_llamada', 'dia_d'] as const) {
      for (const v of [0, 1] as const) {
        const t = textoPieza(id, v, datos);
        expect(t).not.toMatch(/—|--/);
        expect(t).not.toMatch(/\p{Extended_Pictographic}/u);
        expect(t).not.toMatch(/\s{2,}|\n/);
        expect(t.length).toBeLessThan(220);
      }
    }
  });

  it('la fecha sale en español', () => {
    expect(fechaCorta('2026-10-16')).toBe('viernes, 16 de octubre');
    expect(textoPieza('anuncio', 0, datos)).toContain('viernes, 16 de octubre');
  });
});

describe('hashtagsCampana', () => {
  it('genera hasta tres etiquetas seguras', () => {
    expect(hashtagsCampana('A Coruña', 'Os Herdeiros do Código')).toEqual(['#musicaendirecto', '#acoruna', '#osherdeirosdocodigo']);
  });
  it('no mete caracteres peligrosos ni etiquetas vacías', () => {
    expect(hashtagsCampana('', '<script>alert(1)</script>')).toEqual(['#musicaendirecto', '#scriptalert1script']);
    expect(hashtagsCampana('Ñ!!!', '   ')).toEqual(['#musicaendirecto', '#n']);
  });
});

describe('sanearVarianteIA', () => {
  const enlace = 'https://bandmanager.io/r/abcdefg';

  it('deja pasar un texto limpio con nuestro enlace', () => {
    const t = `Mañana en Sala Capitol. Últimas entradas ${enlace}`;
    expect(sanearVarianteIA(t, enlace)).toBe(t);
  });

  it('quita un enlace ajeno (phishing) y deja el nuestro', () => {
    const r = sanearVarianteIA(`Entradas en https://evil.example/pago y también ${enlace}`, enlace);
    expect(r).not.toContain('evil.example');
    expect(r).toContain(enlace);
  });

  it('si el modelo no puso el enlace, se añade; si lo repitió, queda uno', () => {
    expect(sanearVarianteIA('Nos vemos esta noche en el Capitol', enlace)).toBe(`Nos vemos esta noche en el Capitol ${enlace}`);
    const repetido = sanearVarianteIA(`Entradas ${enlace} aquí ${enlace} ya`, enlace)!;
    expect(repetido.split(enlace)).toHaveLength(2);
  });

  it('sin enlace permitido, ninguna URL sobrevive', () => {
    const r = sanearVarianteIA(`Entradas en ${enlace} y https://otra.example`, null);
    expect(r).not.toMatch(/https?:/);
  });

  it('quita guiones largos, emojis, hashtags y comillas envolventes, y deja una sola línea', () => {
    const r = sanearVarianteIA('"Hoy tocamos — en el Capitol 🔥\n\nNos vemos esta noche #musica #Galicia"', enlace)!;
    expect(r).not.toMatch(/—|–|--|#|\n/);
    expect(r).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(r.startsWith('"')).toBe(false);
    expect(r).toContain('Hoy tocamos, en el Capitol');
  });

  it('rechaza lo inservible: vacío, solo enlace, demasiado largo o no-texto', () => {
    expect(sanearVarianteIA('', enlace)).toBeNull();
    expect(sanearVarianteIA('   ', enlace)).toBeNull();
    expect(sanearVarianteIA(enlace, enlace)).toBeNull();
    expect(sanearVarianteIA('x'.repeat(400), enlace)).toBeNull();
    for (const raro of [undefined, null, 42, {}, ['a']]) expect(sanearVarianteIA(raro, enlace)).toBeNull();
  });

  it('no deja pasar HTML activo (se queda como texto inocuo, la UI lo pinta escapado)', () => {
    const r = sanearVarianteIA('<script>alert(1)</script> Hoy tocamos en el Capitol', enlace)!;
    // No se ejecuta nada: React pinta texto, pero además el texto no debe llevar etiquetas de enlace con URL ajena.
    expect(r).not.toMatch(/https?:\/\/(?!bandmanager\.io)/);
  });
});

describe('presentación', () => {
  it('describe cuándo toca publicar', () => {
    expect(describirCuando('2026-10-08', '2026-10-08')).toBe('hoy');
    expect(describirCuando('2026-10-09', '2026-10-08')).toBe('mañana');
    expect(describirCuando('2026-10-14', '2026-10-08')).toBe('en 6 días');
    expect(describirCuando('2026-10-07', '2026-10-08')).toBe('ya pasó');
  });

  it('WhatsApp no tiene plataforma de redes; el resto sí', () => {
    expect(plataformaDeCanal('whatsapp')).toBeNull();
    expect(plataformaDeCanal('instagram')).toBe('Instagram');
    expect(plataformaDeCanal('tiktok')).toBe('TikTok');
    expect(plataformaDeCanal('facebook')).toBe('Facebook');
  });

  it('todos los canales de publicación tienen etiqueta y el servidor los acepta', () => {
    expect(CANALES_PUBLICACION.map((c) => c.id)).toEqual(['instagram', 'tiktok', 'whatsapp', 'facebook']);
    expect(CANALES_PUBLICACION.every((c) => c.etiqueta.length > 0)).toBe(true);
  });
});
