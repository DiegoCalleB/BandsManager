import fs from 'fs';
import path from 'path';
import { type Page } from '@playwright/test';

/**
 * Arnés común de los e2e del Asesor de Marketing: datos simulados y `abrirAsesor`, que entra en la app
 * con el servidor del asesor simulado (el plan real lo cubren los tests de Vitest). Lo comparten
 * `asesor.spec.ts` y `asesor-presencia.spec.ts`.
 */
export const FIXTURES = path.join(process.cwd(), 'e2e', 'fixtures', 'cartel');

export const IDEA = (id: string, formato: string, titulo: string, extra: Record<string, unknown> = {}) => ({
  id, formato, titulo, redes: formato === 'reel' ? ['instagram', 'tiktok', 'youtube'] : ['instagram'], tipo: 'humano',
  idea: 'Quince segundos del estribillo, empezando fuerte.', porque: 'Los reels llegan a gente que aún no os sigue.',
  esfuerzoMin: formato === 'reel' ? 45 : 5, atajo: null, hecha: false, ...extra,
});

export const PIEZA = {
  formato: 'reel', gancho: 'Tres días para Leganés y aún no sabemos con qué abrir',
  pasos: [{ titulo: 'Primer plano del setlist en el suelo · 2 s', detalle: 'Texto: ¿con cuál abrimos?' }, { titulo: 'El estribillo en el local · 10 s', detalle: 'Sin cortes, que se oiga la sala' }],
  textos: [
    { red: 'instagram', texto: 'El sábado en Oktoberfest. Vota en stories.', hashtags: ['#rockleganes', '#rutA66band'] },
    { red: 'tiktok', texto: 'Rock en Leganés este sábado', hashtags: ['#rockmadrid'] },
    { red: 'youtube', texto: 'Rock en Leganés: el estribillo que cierra el bolo\n\nEl sábado en Oktoberfest, Leganés. Entradas en la bio.', hashtags: ['#rockleganes', '#rockmadrid'] },
  ],
  cta: 'Guárdalo para el sábado', portada: 'Abrimos con…',
};

export const CARRUSEL = {
  formato: 'carrusel', gancho: 'Lo que vais a escuchar el sábado en Leganés', portada: '',
  pasos: [{ titulo: 'Abrimos con la que nunca tocamos en directo', detalle: 'foto del local' }, { titulo: 'En medio, la versión que pedisteis', detalle: '' }],
  textos: [{ red: 'instagram', texto: 'Guárdalo y nos vemos el sábado', hashtags: ['#rockleganes'] }],
  cta: 'Entradas en la bio',
};

export const STORIES = {
  formato: 'stories', gancho: '¿Cuál abre el sábado?', portada: '',
  pasos: [{ titulo: '¿Cuál abre el sábado?', detalle: 'foto del ensayo' }, { titulo: 'Votad en la encuesta', detalle: 'sticker de encuesta' }, { titulo: 'Sábado, Oktoberfest, Leganés', detalle: 'sticker de cuenta atrás' }],
  textos: [{ red: 'instagram', texto: 'Votad', hashtags: [] }], cta: '',
};

export const ITEM = (id: string, formato: string, titulo: string, alcance: number, guardados: number, mensaje: string) => ({
  fecha: `2026-10-2${id === 'a' ? 0 : id === 'b' ? 1 : id === 'c' ? 2 : 3}`, tarjetaId: id, formato, titulo, alcance, guardados, alcanceNoSeguidores: 400,
  tasaGuardar: guardados / alcance, veredicto: guardados / alcance >= 0.03 ? 'funciona' : 'falla_valor', mensaje,
});
export const POCO_VALOR = 'Llega lejos pero casi nadie la guarda: el gancho atrae y el contenido no aporta. Dale más chicha o historia.';
export const RESUMEN = {
  piezas: 4,
  mejores: [ITEM('d', 'carrusel', 'Lo que vais a escuchar', 1000, 70, 'Funciona: llega a gente nueva y la guardan. Repite esta estructura.'), ITEM('c', 'carrusel', 'La historia del setlist', 1000, 60, 'Funciona')],
  peores: [ITEM('a', 'reel', 'Tema de la semana: La furgo', 1000, 5, POCO_VALOR), ITEM('b', 'reel', 'Un adelanto del directo', 1000, 8, POCO_VALOR)],
  formatoGanador: { formato: 'carrusel', tasa: 0.065, piezas: 2 },
  mensaje: 'Los carruseles son lo que más os guardan: 6,5 % de quienes los ven.',
};


export const hallazgo = (id: string, especialista: string, estado: string, impacto: number, esfuerzoMin: number, titulo: string, detalle: string, arreglo: string, fuente = 'criterio-musica') =>
  ({ id, especialista, estado, impacto, esfuerzoMin, titulo, detalle, arreglo, fuente });
export const H_BOLO = hallazgo('bolo-entradas', 'ctr', 'mejorar', 3, 3, 'El próximo bolo tiene enlace de entradas', 'El bolo de Oktoberfest (4 nov) no tiene enlace de entradas.', 'Añadidlo en el calendario: sin él, cada clic de interés se pierde.');
export const H_SEGUIMIENTO = hallazgo('enlace-seguimiento', 'ctr', 'mejorar', 3, 5, 'Un enlace con seguimiento por red', 'Sin enlace con seguimiento en tiktok.', 'Crearlo en «Enlaces y clics» y ponerlo en la bio.', 'ig-metricas');
export const H_SPOTIFY = hallazgo('escucha-fuera', 'seo', 'mejorar', 2, 5, 'Dónde escucharos fuera de las redes', 'No hay un sitio de escucha enlazado.', 'Añadid vuestro Spotify (u otro) en el dossier.');
export const PRESENCIA = {
  auditoria: {
    especialistas: [
      { id: 'seo', nombre: 'SEO y descubrimiento', ok: 1, mejorar: 1, sinDatos: 0, hallazgos: [hallazgo('genero-ciudad', 'seo', 'ok', 3, 2, 'Género y ciudad en vuestro perfil', 'Os buscan por «rock madrid»: lo tenéis definido.', ''), H_SPOTIFY] },
      { id: 'instagram', nombre: 'Instagram', ok: 0, mejorar: 0, sinDatos: 1, hallazgos: [hallazgo('instagram-bio-palabras', 'instagram', 'sin_datos', 3, 5, 'Género y ciudad en la bio de Instagram', 'No conocemos vuestra bio de Instagram.', 'Pegad vuestra bio de Instagram en «Pega tus bios» y la revisamos.')] },
      { id: 'ctr', nombre: 'CTR y conversión', ok: 0, mejorar: 2, sinDatos: 0, hallazgos: [H_SEGUIMIENTO, H_BOLO] },
    ],
    prioridades: [H_BOLO, H_SEGUIMIENTO, H_SPOTIFY],
    resumen: { ok: 1, mejorar: 3, sinDatos: 1 },
  },
  kit: {
    palabrasClave: [{ frase: 'rock Madrid', intencion: 'descubrir' }, { frase: 'conciertos de rock en Madrid', intencion: 'concierto' }],
    dondeUsar: 'En el nombre del perfil, en la bio y en la primera línea de los textos de vuestras piezas.',
    nombreInstagram: 'Ruta 66 | Rock Madrid',
    bios: [
      { red: 'instagram', opciones: [{ etiqueta: 'Directa', texto: 'Rock desde Madrid\nPróximos bolos y entradas en el enlace', caracteres: 57, limite: 150 }, { etiqueta: 'Con el próximo bolo', texto: 'Rock desde Madrid\nPróximo bolo: Oktoberfest, 4 nov\nEntradas en el enlace', caracteres: 71, limite: 150 }] },
      { red: 'tiktok', opciones: [{ etiqueta: 'Directa', texto: 'Rock desde Madrid\nBolos y entradas en el enlace', caracteres: 47, limite: 80 }] },
    ],
  },
  enlaces: {
    recomendado: { destino: 'entradas', concertId: 'c1', motivo: 'Faltan 7 días para el bolo: que el clic llegue directo a las entradas.' },
    porRed: [{ red: 'instagram', url: 'https://bandmanager.io/r/abc2345', destino: 'epk', concertId: null, clics7: 12 }, { red: 'tiktok', url: null, destino: null, concertId: null, clics7: 0 }],
    clicsTrasPublicar: [{ fecha: '2026-10-24', tarjetaId: 'fondo-pilar', titulo: 'Tema de la semana: La furgo', formato: 'reel', total: 9, porCanal: { instagram: 9 }, completa: true }],
  },
  anuncios: [
    {
      fecha: '2026-10-25', tarjetaId: 'fondo-pilar', titulo: 'Tema de la semana: La furgo', formato: 'reel', red: 'instagram', decision: 'impulsar',
      motivo: 'A los vuestros les encanta (la guardan) pero no sale de vuestra gente: lo que le falta es alcance, y eso se puede pagar.',
      plan: {
        objetivo: 'entradas', objetivoTexto: 'Visitas al enlace (que lleven a las entradas)', zona: 'Leganés y unos 30 km alrededor', presupuestoDia: 5, dias: 5, total: 25,
        publico: 'Gente de la zona: quienes escuchan rock y fans de Los Suaves, Leño.',
        pasos: ['Abrid la publicación en vuestro perfil y pulsad «Promocionar».', 'Objetivo: Visitas al enlace (que lleven a las entradas).', 'Presupuesto: 5 € al día durante 5 días (25 € en total).', 'A las 48 h mirad los números y parad si no se mueven: no hace falta gastar el total.'],
      },
    },
    {
      fecha: '2026-10-24', tarjetaId: 'bolo-teaser', titulo: 'Un adelanto del directo', formato: 'reel', red: 'instagram', decision: 'no_gastar',
      motivo: 'Llega lejos pero casi nadie la guarda: pagar solo traería más gente que pasa de largo. Mejorad el contenido primero.', plan: null,
    },
  ],
  instagram: { leido: false, seguidores: null, clicsSemanalesEstado: 'sin_datos' },
};

/**
 * `conAdn`: la banda tiene logo, dossier de estilo «stage» (serigrafía, letra de cartel) y dos fotos en
 * su galería. `sinFotos` la deja sin galería: «Poner foto» sube directamente desde el dispositivo.
 * `conPendientes`: una publicación espera sus números y ya hay con qué hacer un resumen.
 */
export async function abrirAsesor(page: Page, { conAdn = false, sinFotos = false, conPendientes = false, rescate = false, red = 'instagram', otrasRedes = false }: { conAdn?: boolean; sinFotos?: boolean; conPendientes?: boolean; rescate?: boolean; red?: string; otrasRedes?: boolean } = {}) {
  const peticiones: Array<{ ruta: string; cuerpo: Record<string, unknown> | null }> = [];
  const servidor = { hechas: new Set<string>(), saltadas: new Set<string>(), medido: false };
  const ideas = [
    IDEA('hito-anuncio', 'post', 'Anuncio del bolo', { atajo: { vista: 'carteleria', concertId: 'c1' }, tipo: 'promocional' }),
    IDEA('bolo-teaser', 'reel', 'Un adelanto del directo'),
    IDEA('bolo-encuesta', 'stories', 'Stories con cuenta atrás'),
    IDEA('bolo-setlist', 'carrusel', 'Lo que vais a escuchar'),
  ];
  if (conAdn) {
    // El ADN de la banda: logo, estilo y fotos del dossier, servidos con CORS como el bucket real.
    await page.route('**/api/state', async (route) => {
      const j = await (await route.fetch()).json().catch(() => ({}));
      delete j.error;
      j.epkConfig = {
        ...(j.epkConfig || {}), logoUrl: 'https://logo.test/logo.png', plantilla: 'stage', genero: 'Rock',
        bandPhotos: sinFotos ? [] : ['https://fotos.test/1.jpg', { url: 'https://fotos.test/2.jpg' }],
      };
      await route.fulfill({ status: 200, json: j });
    });
    const cors = { 'access-control-allow-origin': '*' };
    await page.route('https://logo.test/**', (r) => r.fulfill({ body: fs.readFileSync(path.join(FIXTURES, 'logo.png')), contentType: 'image/png', headers: cors }));
    await page.route('https://fotos.test/**', (r) => r.fulfill({ body: fs.readFileSync(path.join(FIXTURES, 'ref.jpg')), contentType: 'image/jpeg', headers: cors }));
    await page.route('**/api/cartel/adn', (r) => r.fulfill({ json: { adn: { v: 1, referencias: [], favoritos: [], aprender: true } } }));
  }
  await page.route('**/api/asesor/**', async (route) => {
    const req = route.request();
    const ruta = new URL(req.url()).pathname;
    const cuerpo = req.postData() ? JSON.parse(req.postData()!) : null;
    peticiones.push({ ruta, cuerpo });
    if (ruta.endsWith('/asesor/hoy')) {
      const vivas = ideas.filter((i) => !servidor.saltadas.has(i.id)).map((i) => ({ ...i, hecha: servidor.hechas.has(i.id) }));
      return route.fulfill({ json: {
        hoy: '2026-10-28',
        diagnostico: rescate
          ? { modo: 'rescate', porque: 'Vuestro alcance lleva tres semanas bajando: toca probar algo distinto, no insistir.', concierto: null, dias: null }
          : { modo: 'concierto', porque: 'Tocáis en 3 días en Oktoberfest, Leganés: toca llenar la sala.', concierto: null, dias: 3 },
        opciones: rescate
          ? { recomendadas: [IDEA('rescate-opuesto', 'carrusel', 'Probad un carrusel', { porque: 'Con los reels no está arrancando: cambiar de formato enseña más que insistir.' })], alternativas: [IDEA('rescate-pregunta', 'stories', 'Preguntad qué quieren ver')] }
          : { recomendadas: vivas.slice(0, 2), alternativas: vivas.slice(2) },
        porMedir: conPendientes && !servidor.medido ? [{ fecha: '2026-10-24', tarjetaId: 'fondo-pilar', formato: 'reel', titulo: 'Tema de la semana: La furgo', red }] : [],
        otrasRedes: otrasRedes ? [{ fecha: '2026-10-23', tarjetaId: 'bolo-teaser', formato: 'reel', titulo: 'Un adelanto del directo', redes: ['tiktok', 'youtube'] }] : [],
        resumen: conPendientes ? RESUMEN : null,
        agenda: [
          { fecha: '2026-10-24', esHoy: false, eventos: [{ tipo: 'hecha', texto: 'Tema de la semana: La furgo', formato: 'reel', lectura: 'sin_medir' }] },
          { fecha: '2026-10-28', esHoy: true, eventos: [] },
          { fecha: '2026-10-31', esHoy: false, eventos: [{ tipo: 'bolo', texto: 'Concierto en Oktoberfest, Leganés' }, { tipo: 'hito', texto: 'Día D del bolo en Oktoberfest', objetivo: 'Que nadie se olvide de que es hoy.' }] },
        ],
        semana: ['22', '23', '24', '25', '26', '27', '28'].map((d, k) => ({ fecha: `2026-10-${d}`, hechas: [0, 1, 0, 2, 0, 0, servidor.hechas.size][k] })),
        estrategia: { v: 1, objetivo: 'llenar_salas', etapa: 'local', publico: '', horasSemana: 3, camara: 'algunos', pilares: [], lineasRojas: [], referentes: [], redes: ['instagram', 'tiktok'], lanzamiento: null, revisada: true },
        tieneEstrategia: true,
      } });
    }
    if (ruta.endsWith('/asesor/presencia')) return route.fulfill({ json: PRESENCIA });
    if (ruta.endsWith('/asesor/chat')) {
      const pregunta = String(cuerpo.mensajes[cuerpo.mensajes.length - 1].texto);
      if (/tiempo/.test(pregunta)) return route.fulfill({ json: { respuesta: 'Con poco tiempo, el adelanto del directo: 15 segundos y listo.', accion: { tipo: 'preparar', tarjetaId: 'bolo-teaser', etiqueta: 'Preparar «Un adelanto del directo»' } } });
      return route.fulfill({ json: { respuesta: 'Vuestros reels llegan pero casi nadie los guarda. Probad un carrusel esta semana y anotad los números a las 48 h.', accion: { tipo: 'ir', destino: 'resultados', etiqueta: 'Anotar resultados' } } });
    }
    if (ruta.endsWith('/asesor/estrategia') && req.method() === 'PUT') return route.fulfill({ json: { estrategia: cuerpo } });
    if (ruta.endsWith('/asesor/pieza')) return route.fulfill({ json: { pieza: cuerpo.tarjetaId === 'bolo-setlist' ? CARRUSEL : cuerpo.tarjetaId === 'bolo-encuesta' ? STORIES : PIEZA } });
    if (ruta.endsWith('/asesor/resultado') && cuerpo.red && cuerpo.red !== 'instagram') {
      servidor.medido = true;
      return route.fulfill({ json: { ok: true, titulo: 'Tema de la semana: La furgo', veredicto: 'por_encima', mensaje: 'Llegó más lejos de lo habitual: 2,0× vuestra mediana en TikTok. Repetid lo que hicisteis.' } });
    }
    if (ruta.endsWith('/asesor/resultado')) {
      servidor.medido = true;
      return route.fulfill({ json: { ok: true, titulo: 'Tema de la semana: La furgo', veredicto: 'falla_valor', mensaje: POCO_VALOR } });
    }
    if (ruta.endsWith('/asesor/accion')) {
      if (cuerpo.accion === 'hecho') servidor.hechas.add(cuerpo.tarjetaId);
      if (cuerpo.accion === 'saltado') servidor.saltadas.add(cuerpo.tarjetaId);
      return route.fulfill({ json: { ok: true } });
    }
    return route.fulfill({ status: 404, json: {} });
  });

  await page.goto('/');
  if (!(await page.getByPlaceholder('Correo electrónico o Usuario').isVisible().catch(() => false))) {
    await page.getByRole('button', { name: 'Entrar', exact: true }).first().click();
  }
  await page.getByPlaceholder('Correo electrónico o Usuario').fill('diego');
  await page.getByPlaceholder('Contraseña').fill('demo2026');
  await page.getByRole('button', { name: 'Entrar a mi cuenta' }).click();
  await page.getByText('Configurar más tarde').click({ timeout: 8_000 }).catch(() => {});
  await page.getByText('Explorar por mi cuenta').click({ timeout: 3_000 }).catch(() => {});
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?view=asesor');
  await page.getByText(rescate ? 'Cambiar de rumbo' : 'Modo concierto').waitFor({ timeout: 20_000 });
  return { peticiones };
}
