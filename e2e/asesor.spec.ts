import fs from 'fs';
import path from 'path';
import { test, expect, type Page } from '@playwright/test';

const FIXTURES = path.join(process.cwd(), 'e2e', 'fixtures', 'cartel');

// Asesor de marketing a ~390 px: opciones de hoy, preparar una pieza con IA, marcarla como hecha y
// saltar una idea. El servidor del asesor se simula (el plan real lo cubren los tests de Vitest):
// aquí se comprueba el contrato del cliente y que la pantalla se entiende.

test.setTimeout(120_000);

const IDEA = (id: string, formato: string, titulo: string, extra: Record<string, unknown> = {}) => ({
  id, formato, titulo, redes: formato === 'reel' ? ['instagram', 'tiktok', 'youtube'] : ['instagram'], tipo: 'humano',
  idea: 'Quince segundos del estribillo, empezando fuerte.', porque: 'Los reels llegan a gente que aún no os sigue.',
  esfuerzoMin: formato === 'reel' ? 45 : 5, atajo: null, hecha: false, ...extra,
});

const PIEZA = {
  formato: 'reel', gancho: 'Tres días para Leganés y aún no sabemos con qué abrir',
  pasos: [{ titulo: 'Primer plano del setlist en el suelo · 2 s', detalle: 'Texto: ¿con cuál abrimos?' }, { titulo: 'El estribillo en el local · 10 s', detalle: 'Sin cortes, que se oiga la sala' }],
  textos: [
    { red: 'instagram', texto: 'El sábado en Oktoberfest. Vota en stories.', hashtags: ['#rockleganes', '#rutA66band'] },
    { red: 'tiktok', texto: 'Rock en Leganés este sábado', hashtags: ['#rockmadrid'] },
    { red: 'youtube', texto: 'Rock en Leganés: el estribillo que cierra el bolo\n\nEl sábado en Oktoberfest, Leganés. Entradas en la bio.', hashtags: ['#rockleganes', '#rockmadrid'] },
  ],
  cta: 'Guárdalo para el sábado', portada: 'Abrimos con…',
};

const CARRUSEL = {
  formato: 'carrusel', gancho: 'Lo que vais a escuchar el sábado en Leganés', portada: '',
  pasos: [{ titulo: 'Abrimos con la que nunca tocamos en directo', detalle: 'foto del local' }, { titulo: 'En medio, la versión que pedisteis', detalle: '' }],
  textos: [{ red: 'instagram', texto: 'Guárdalo y nos vemos el sábado', hashtags: ['#rockleganes'] }],
  cta: 'Entradas en la bio',
};

const STORIES = {
  formato: 'stories', gancho: '¿Cuál abre el sábado?', portada: '',
  pasos: [{ titulo: '¿Cuál abre el sábado?', detalle: 'foto del ensayo' }, { titulo: 'Votad en la encuesta', detalle: 'sticker de encuesta' }, { titulo: 'Sábado, Oktoberfest, Leganés', detalle: 'sticker de cuenta atrás' }],
  textos: [{ red: 'instagram', texto: 'Votad', hashtags: [] }], cta: '',
};

const ITEM = (id: string, formato: string, titulo: string, alcance: number, guardados: number, mensaje: string) => ({
  fecha: `2026-10-2${id === 'a' ? 0 : id === 'b' ? 1 : id === 'c' ? 2 : 3}`, tarjetaId: id, formato, titulo, alcance, guardados, alcanceNoSeguidores: 400,
  tasaGuardar: guardados / alcance, veredicto: guardados / alcance >= 0.03 ? 'funciona' : 'falla_valor', mensaje,
});
const POCO_VALOR = 'Llega lejos pero casi nadie la guarda: el gancho atrae y el contenido no aporta. Dale más chicha o historia.';
const RESUMEN = {
  piezas: 4,
  mejores: [ITEM('d', 'carrusel', 'Lo que vais a escuchar', 1000, 70, 'Funciona: llega a gente nueva y la guardan. Repite esta estructura.'), ITEM('c', 'carrusel', 'La historia del setlist', 1000, 60, 'Funciona')],
  peores: [ITEM('a', 'reel', 'Tema de la semana: La furgo', 1000, 5, POCO_VALOR), ITEM('b', 'reel', 'Un adelanto del directo', 1000, 8, POCO_VALOR)],
  formatoGanador: { formato: 'carrusel', tasa: 0.065, piezas: 2 },
  mensaje: 'Los carruseles son lo que más os guardan: 6,5 % de quienes los ven.',
};

/**
 * `conAdn`: la banda tiene logo, dossier de estilo «stage» (serigrafía, letra de cartel) y dos fotos en
 * su galería. `sinFotos` la deja sin galería: «Poner foto» sube directamente desde el dispositivo.
 * `conPendientes`: una publicación espera sus números y ya hay con qué hacer un resumen.
 */
async function abrirAsesor(page: Page, { conAdn = false, sinFotos = false, conPendientes = false, rescate = false, red = 'instagram', otrasRedes = false }: { conAdn?: boolean; sinFotos?: boolean; conPendientes?: boolean; rescate?: boolean; red?: string; otrasRedes?: boolean } = {}) {
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

test('las opciones de hoy se entienden: recomendadas, otras ideas y la semana', async ({ page }) => {
  await abrirAsesor(page);
  await expect(page.getByRole('heading', { name: /Tocáis en 3 días/ })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Recomendado para hoy' }).getByRole('article')).toHaveCount(2);
  await expect(page.getByRole('heading', { name: /Otras ideas para hoy/ })).toBeVisible();
  await expect(page.getByText('3 esta semana')).toBeVisible();
  for (const tema of ['light', 'dark', 'classic']) {
    await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, tema);
    await page.waitForTimeout(800); // las superficies cambian de color con transición
    await page.screenshot({ path: `test-results/asesor-hoy-${tema}.png`, fullPage: true });
  }
});

test('preparar pieza manda solo el id y enseña gancho, guion y texto por red', async ({ page }) => {
  const { peticiones } = await abrirAsesor(page);
  await page.getByRole('button', { name: 'Preparar pieza' }).nth(1).click();
  const hoja = page.getByRole('dialog', { name: /Un adelanto del directo/ });
  await expect(hoja.getByText(PIEZA.gancho)).toBeVisible();
  await expect(hoja.getByText('Plano 1', { exact: true })).toBeVisible();
  await expect(hoja.getByText(PIEZA.pasos[1].titulo)).toBeVisible();
  await hoja.getByRole('tab', { name: 'TikTok' }).click();
  await expect(hoja.getByText('Rock en Leganés este sábado')).toBeVisible();
  expect(peticiones.find((p) => p.ruta.endsWith('/pieza'))!.cuerpo).toEqual({ tarjetaId: 'bolo-teaser' });
  await page.screenshot({ path: 'test-results/asesor-pieza.png' });

  await hoja.getByRole('button', { name: 'Marcar como publicada' }).click();
  await expect(hoja.getByText('Ya está hecha')).toBeVisible();
  expect(peticiones.find((p) => p.ruta.endsWith('/accion'))!.cuerpo).toEqual({ tarjetaId: 'bolo-teaser', accion: 'hecho' });
});

test('«hoy no, otra idea» salta la idea y sube la siguiente', async ({ page }) => {
  await abrirAsesor(page);
  const recomendadas = page.getByRole('region', { name: 'Recomendado para hoy' });
  await page.getByRole('button', { name: 'Más opciones de «Anuncio del bolo»' }).click();
  await page.getByRole('menuitem', { name: 'Hoy no, otra idea' }).click();
  await expect(recomendadas.getByText('Anuncio del bolo')).toBeHidden();
  await expect(recomendadas.getByText('Stories con cuenta atrás')).toBeVisible();
});

test('un carrusel arranca con el ADN de la banda: su letra, su logo y su foto, y todo se puede cambiar', async ({ page }) => {
  await abrirAsesor(page, { conAdn: true });
  await page.getByRole('button', { name: 'Elegir esta' }).last().click();
  const hoja = page.getByRole('dialog', { name: /Lo que vais a escuchar/ });
  const imagenes = hoja.getByRole('region', { name: 'Imágenes listas para subir' }).getByRole('img');
  await expect(imagenes).toHaveCount(4, { timeout: 15_000 }); // portada + 2 slides + cierre
  await expect(imagenes.first()).toHaveAttribute('alt', /Lo que vais a escuchar el sábado/);

  // Sin tocar nada: la letra sale de su estilo (dossier «stage» → de cartel) y la portada ya lleva una foto suya.
  await expect(hoja.getByRole('radio', { name: 'Cartel' })).toHaveAttribute('aria-checked', 'true');
  await expect(hoja.getByRole('button', { name: 'Cambiar foto' })).toHaveCount(1, { timeout: 15_000 });
  await expect(hoja.getByRole('button', { name: 'Poner foto' })).toHaveCount(3);

  // Las imágenes a tamaño real (1080×1350), para revisarlas a ojo.
  const guardar = async (etiqueta: string) => {
    const srcs = await imagenes.evaluateAll((els) => els.map((e) => (e as HTMLImageElement).src));
    for (const [i, src] of srcs.entries()) {
      const b64 = await page.evaluate(async (u) => {
        const buf = new Uint8Array(await (await fetch(u)).arrayBuffer());
        let s = '';
        buf.forEach((b) => (s += String.fromCharCode(b)));
        return btoa(s);
      }, src);
      fs.mkdirSync('test-results/laminas', { recursive: true });
      fs.writeFileSync(`test-results/laminas/${etiqueta}-${i + 1}.png`, Buffer.from(b64, 'base64'));
    }
  };
  await page.waitForTimeout(1200);
  await guardar('adn');

  // Elegir otra foto de la banda: se abre el selector con las suyas.
  const antes = await imagenes.first().getAttribute('src');
  await hoja.getByRole('button', { name: 'Cambiar foto' }).click();
  const selector = hoja.getByRole('group', { name: 'Foto para la imagen 1' });
  await expect(selector.getByRole('button', { name: /Usar la foto \d de la banda/ })).toHaveCount(2);
  await selector.getByRole('button', { name: 'Usar la foto 2 de la banda' }).click();
  await expect(selector).toBeHidden();
  await expect(imagenes.first()).not.toHaveAttribute('src', antes!, { timeout: 15_000 });

  // Y subir una nueva desde el dispositivo: el peor caso, un escenario oscuro con focos blancos.
  const escenario = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 1200;
    c.height = 1500;
    const x = c.getContext('2d')!;
    const g = x.createLinearGradient(0, 0, 0, 1500);
    g.addColorStop(0, '#0b0b14');
    g.addColorStop(1, '#2a1030');
    x.fillStyle = g;
    x.fillRect(0, 0, 1200, 1500);
    for (const [cx, cy, r] of [[300, 800, 260], [820, 980, 300], [560, 1150, 220], [900, 600, 180]]) {
      const f = x.createRadialGradient(cx, cy, 10, cx, cy, r);
      f.addColorStop(0, 'rgba(255,255,255,1)');
      f.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = f;
      x.fillRect(0, 0, 1200, 1500);
    }
    return c.toDataURL('image/jpeg', 0.9).split(',')[1];
  });
  await hoja.getByRole('button', { name: 'Cambiar foto' }).click();
  await hoja.getByRole('group', { name: 'Foto para la imagen 1' }).getByRole('button', { name: 'Subir otra foto' }).click();
  await hoja.getByLabel('Foto de fondo').setInputFiles({ name: 'escenario.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(escenario, 'base64') });
  await page.waitForTimeout(1500);
  await guardar('escenario');

  // Los colores y la letra se pueden cambiar.
  await hoja.getByRole('radio', { name: 'Amarillo' }).click();
  await hoja.getByRole('radio', { name: 'Clásica' }).click();
  await expect(imagenes).toHaveCount(4, { timeout: 10_000 });
  await page.waitForTimeout(1500);
  await guardar('amarillo-clasica');
  await page.screenshot({ path: 'test-results/asesor-carrusel.png' });

  const descarga = page.waitForEvent('download');
  await hoja.getByRole('button', { name: 'Guardar las 4 imágenes' }).click();
  expect((await descarga).suggestedFilename()).toMatch(/carrusel\.zip$/);
});

test('una banda sin fotos en su galería sube la suya directamente y el resto sale en color', async ({ page }) => {
  await abrirAsesor(page, { conAdn: true, sinFotos: true });
  await page.getByRole('button', { name: 'Elegir esta' }).last().click();
  const hoja = page.getByRole('dialog', { name: /Lo que vais a escuchar/ });
  await expect(hoja.getByRole('region', { name: 'Imágenes listas para subir' }).getByRole('img')).toHaveCount(4, { timeout: 15_000 });
  await expect(hoja.getByRole('button', { name: 'Cambiar foto' })).toHaveCount(0);
  const selector = page.waitForEvent('filechooser');
  await hoja.getByRole('button', { name: 'Poner foto' }).first().click();
  await (await selector).setFiles(path.join(FIXTURES, 'ref.jpg'));
  await expect(hoja.getByRole('button', { name: 'Cambiar foto' })).toHaveCount(1, { timeout: 15_000 });
});

test('unas stories salen en 1080×1920 con la zona segura de Instagram libre', async ({ page }) => {
  await abrirAsesor(page, { conAdn: true });
  await page.getByRole('button', { name: 'Elegir esta' }).first().click();
  const hoja = page.getByRole('dialog', { name: /Stories con cuenta atrás/ });
  const imagenes = hoja.getByRole('region', { name: 'Imágenes listas para subir' }).getByRole('img');
  await expect(imagenes).toHaveCount(3, { timeout: 15_000 });
  await expect(hoja.getByRole('button', { name: 'Cambiar foto' })).toHaveCount(3, { timeout: 15_000 }); // cada pantalla con una foto suya
  await page.waitForTimeout(1500);
  const srcs = await imagenes.evaluateAll((els) => els.map((e) => (e as HTMLImageElement).src));
  fs.mkdirSync('test-results/laminas', { recursive: true });
  for (const [i, src] of srcs.entries()) {
    const { b64, w, h } = await page.evaluate(async (u) => {
      const blob = await (await fetch(u)).blob();
      const bmp = await createImageBitmap(blob);
      const buf = new Uint8Array(await blob.arrayBuffer());
      let s = '';
      buf.forEach((b) => (s += String.fromCharCode(b)));
      return { b64: btoa(s), w: bmp.width, h: bmp.height };
    }, src);
    expect([w, h]).toEqual([1080, 1920]);
    fs.writeFileSync(`test-results/laminas/stories-${i + 1}.png`, Buffer.from(b64, 'base64'));
  }
});

test('anotar los números: el aviso de Hoy lleva a Resultados, se valida, se guarda y se ve lo aprendido', async ({ page }) => {
  const { peticiones } = await abrirAsesor(page, { conPendientes: true });
  await expect(page.getByText('Una publicación espera sus números')).toBeVisible();
  await page.getByRole('button', { name: 'Anotarlos' }).click();
  await expect(page.getByRole('tab', { name: 'Resultados (1)' })).toHaveAttribute('aria-selected', 'true');

  const tarjeta = page.getByRole('form', { name: /Resultados de Tema de la semana/ });
  await expect(tarjeta.getByText(/Publicada el sábado, 24 de octubre/)).toBeVisible();
  await expect(page.getByRole('region', { name: 'Lo que os ha funcionado' }).getByText('Los carruseles son lo que más os guardan: 6,5 % de quienes los ven.')).toBeVisible();

  // Más guardados que alcance no es posible: se avisa sin llamar al servidor.
  await tarjeta.getByLabel('Cuentas alcanzadas').fill('100');
  await tarjeta.getByLabel('Guardados').fill('500');
  await tarjeta.getByRole('button', { name: 'Guardar los números' }).click();
  await expect(tarjeta.getByRole('alert')).toContainText('No pueden haberla guardado más personas');
  expect(peticiones.some((p) => p.ruta.endsWith('/resultado'))).toBe(false);

  await tarjeta.getByLabel('Cuentas alcanzadas').fill('1000');
  await tarjeta.getByLabel('Guardados').fill('5');
  await tarjeta.getByLabel(/no os seguían/).fill('100');
  await tarjeta.getByRole('button', { name: 'Guardar los números' }).click();

  const aviso = page.getByRole('status');
  await expect(aviso).toContainText('Anotado: Tema de la semana: La furgo');
  await expect(aviso).toContainText('casi nadie la guarda');
  await expect(page.getByRole('form', { name: /Resultados de/ })).toBeHidden();
  const enviado = peticiones.find((p) => p.ruta.endsWith('/resultado'))!.cuerpo;
  expect(enviado).toEqual({ fecha: '2026-10-24', tarjetaId: 'fondo-pilar', alcance: 1000, guardados: 5, alcanceNoSeguidores: 100 });
  await expect(page.getByRole('tab', { name: 'Resultados', exact: true })).toBeVisible();
  await page.getByRole('region', { name: 'Lo que os ha funcionado' }).screenshot({ path: 'test-results/asesor-resumen.png' });
  await page.screenshot({ path: 'test-results/asesor-resultados.png' });
});

test('sin nada que medir, Resultados explica qué hacer en vez de quedarse vacío', async ({ page }) => {
  await abrirAsesor(page);
  await page.getByRole('tab', { name: 'Resultados' }).click();
  await expect(page.getByText('Aún no hay números que mirar.')).toBeVisible();
  await expect(page.getByText(/dos días después, apunta aquí/)).toBeVisible();
});

test('el calendario sitúa hoy y enseña lo publicado, el bolo y los hitos', async ({ page }) => {
  await abrirAsesor(page);
  await page.getByRole('tab', { name: 'Calendario' }).click();
  const cal = page.getByRole('region', { name: 'Calendario' });
  await expect(cal.getByText('Concierto en Oktoberfest, Leganés')).toBeVisible();
  await expect(cal.getByText('Día D del bolo en Oktoberfest')).toBeVisible();
  await expect(cal.getByText('Tema de la semana: La furgo')).toBeVisible();
  await expect(cal.getByText('Sin medir')).toBeVisible();
  await expect(cal.locator('[aria-current="date"]')).toContainText('Hoy');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/asesor-calendario.png' });
  await cal.getByRole('button', { name: 'Ver qué toca' }).click();
  await expect(page.getByRole('region', { name: 'Recomendado para hoy' })).toBeVisible();
});

test('en modo rescate la cabecera lo dice sin dramatismo y la idea propone cambiar de formato', async ({ page }) => {
  await abrirAsesor(page, { rescate: true });
  await expect(page.getByText('Cambiar de rumbo')).toBeVisible();
  await expect(page.getByRole('heading', { name: /tres semanas bajando/ })).toBeVisible();
  const recomendado = page.getByRole('region', { name: 'Recomendado para hoy' });
  await expect(recomendado.getByText('Probad un carrusel')).toBeVisible();
  await expect(recomendado.getByText(/cambiar de formato enseña más que insistir/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/asesor-rescate.png' });
});

test('el chat responde a una pregunta de arranque y a una escrita, sin salir de la pantalla', async ({ page }) => {
  const { peticiones } = await abrirAsesor(page);
  await page.getByRole('button', { name: 'Preguntar al asesor' }).click();
  const chat = page.getByRole('dialog', { name: 'Preguntar al asesor' });
  await expect(chat.getByText('Vosotros decidís qué hacer.')).toBeVisible();

  await chat.getByRole('button', { name: '¿Por qué no me crece el alcance?' }).click();
  await expect(chat.getByText('Probad un carrusel esta semana')).toBeVisible();
  const primera = peticiones.find((p) => p.ruta.endsWith('/asesor/chat'))!.cuerpo as { mensajes: Array<{ rol: string; texto: string }> };
  expect(primera.mensajes).toEqual([{ rol: 'banda', texto: '¿Por qué no me crece el alcance?' }]);

  await chat.getByLabel('Tu pregunta').fill('¿Y cuándo publico?');
  await chat.getByLabel('Tu pregunta').press('Enter');
  await expect(chat.getByRole('listitem').filter({ hasText: '¿Y cuándo publico?' })).toBeVisible();
  await expect.poll(() => peticiones.filter((p) => p.ruta.endsWith('/asesor/chat')).length).toBe(2);
  const segunda = peticiones.filter((p) => p.ruta.endsWith('/asesor/chat'))[1].cuerpo as { mensajes: Array<{ rol: string }> };
  expect(segunda.mensajes.map((m) => m.rol)).toEqual(['banda', 'asesor', 'banda']);
  // Al servidor solo viaja el texto: los botones de las respuestas no se reenvían.
  expect(segunda.mensajes.map((m) => Object.keys(m))).toEqual([['rol', 'texto'], ['rol', 'texto'], ['rol', 'texto']]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/asesor-chat.png' });
  await chat.getByRole('button', { name: 'Cerrar' }).click();
  await expect(chat).toBeHidden();
});

test('si el asesor no responde, el chat lo dice y conserva lo escrito para reintentar', async ({ page }) => {
  await abrirAsesor(page);
  await page.route('**/api/asesor/chat', (r) => r.fulfill({ status: 503, json: { error: 'El asesor no ha podido responder. Prueba otra vez en un momento.' } }));
  await page.getByRole('button', { name: 'Preguntar al asesor' }).click();
  const chat = page.getByRole('dialog', { name: 'Preguntar al asesor' });
  await chat.getByLabel('Tu pregunta').fill('¿Qué pongo en la bio?');
  await chat.getByRole('button', { name: 'Enviar' }).click();
  await expect(chat.getByRole('alert')).toContainText('no ha podido responder');
  await expect(chat.getByLabel('Tu pregunta')).toHaveValue('¿Qué pongo en la bio?');
});

test('el botón de una respuesta del chat lleva a la pestaña y cierra el chat', async ({ page }) => {
  await abrirAsesor(page);
  await page.getByRole('button', { name: 'Preguntar al asesor' }).click();
  const chat = page.getByRole('dialog', { name: 'Preguntar al asesor' });
  await chat.getByRole('button', { name: '¿Por qué no me crece el alcance?' }).click();
  await chat.getByRole('button', { name: 'Anotar resultados' }).click();
  await expect(chat).toBeHidden();
  await expect(page.getByRole('tab', { name: 'Resultados', exact: true })).toHaveAttribute('aria-selected', 'true');
});

test('el botón «Preparar» del chat abre la pieza de esa idea, y solo entonces se gasta la IA', async ({ page }) => {
  const { peticiones } = await abrirAsesor(page);
  await page.getByRole('button', { name: 'Preguntar al asesor' }).click();
  const chat = page.getByRole('dialog', { name: 'Preguntar al asesor' });
  await chat.getByRole('button', { name: 'Hoy no tengo tiempo: ¿qué es lo mínimo que publico?' }).click();
  await expect(chat.getByText('15 segundos y listo.')).toBeVisible();
  expect(peticiones.some((p) => p.ruta.endsWith('/asesor/pieza'))).toBe(false);
  await page.screenshot({ path: 'test-results/asesor-chat-accion.png' });

  await chat.getByRole('button', { name: 'Preparar «Un adelanto del directo»' }).click();
  await expect(page.getByRole('dialog', { name: 'Pieza: Un adelanto del directo' })).toBeVisible();
  await expect(page.getByText('Tres días para Leganés y aún no sabemos con qué abrir')).toBeVisible();
  const pieza = peticiones.filter((p) => p.ruta.endsWith('/asesor/pieza'));
  expect(pieza).toHaveLength(1);
  expect(pieza[0].cuerpo).toEqual({ tarjetaId: 'bolo-teaser' });
});

test('YouTube Shorts: la pieza enseña el título (con su límite) y la descripción por separado', async ({ page }) => {
  await abrirAsesor(page);
  await page.getByRole('button', { name: 'Preparar pieza' }).nth(1).click();
  const hoja = page.getByRole('dialog', { name: /Un adelanto del directo/ });
  await hoja.getByRole('tab', { name: 'YouTube Shorts' }).click();
  await expect(hoja.getByText(/Título \(\d+ de 70 caracteres\)/)).toBeVisible();
  await expect(hoja.getByText('Rock en Leganés: el estribillo que cierra el bolo')).toBeVisible();
  await expect(hoja.getByText('Descripción', { exact: true })).toBeVisible();
  await expect(hoja.getByText('Entradas en la bio.')).toBeVisible();
  await expect(hoja.getByText('#rockleganes #rockmadrid')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await hoja.screenshot({ path: 'test-results/asesor-youtube.png' });
});

test('la banda elige sus redes en la estrategia, no puede quedarse sin ninguna y se guardan', async ({ page }) => {
  const { peticiones } = await abrirAsesor(page);
  await page.getByRole('tab', { name: 'Estrategia' }).click();
  const redes = page.getByRole('group', { name: '¿En qué redes estáis?' });
  await expect(redes.getByRole('checkbox', { name: 'Instagram' })).toHaveAttribute('aria-checked', 'true');
  await expect(redes.getByRole('checkbox', { name: 'YouTube Shorts' })).toHaveAttribute('aria-checked', 'false');

  await redes.getByRole('checkbox', { name: 'YouTube Shorts' }).click();
  await expect(redes.getByRole('checkbox', { name: 'YouTube Shorts' })).toHaveAttribute('aria-checked', 'true');
  await redes.getByRole('checkbox', { name: 'Instagram' }).click();
  await redes.getByRole('checkbox', { name: 'TikTok' }).click();
  // La última red no se puede quitar: sin ninguna, el asesor no tendría para qué proponer nada.
  await expect(redes.getByRole('checkbox', { name: 'YouTube Shorts' })).toHaveAttribute('aria-checked', 'true');
  await page.screenshot({ path: 'test-results/asesor-redes.png' });

  await page.getByRole('button', { name: /Guardar/ }).click();
  await expect.poll(() => peticiones.some((p) => p.ruta.endsWith('/asesor/estrategia'))).toBe(true);
  expect((peticiones.find((p) => p.ruta.endsWith('/asesor/estrategia'))!.cuerpo as { redes: string[] }).redes).toEqual(['youtube']);
});

test('TikTok como red principal: el formulario pide lo de TikTok, sin números de Instagram ni atajo de traerlos', async ({ page }) => {
  const { peticiones } = await abrirAsesor(page, { conPendientes: true, red: 'tiktok' });
  await page.getByRole('tab', { name: /Resultados/ }).click();
  const tarjeta = page.getByRole('form', { name: /Resultados de Tema de la semana/ });
  await expect(tarjeta.getByLabel('Visualizaciones')).toBeVisible();
  await expect(tarjeta.getByLabel('Lo vieron entero (%)')).toBeVisible();
  await expect(tarjeta.getByText('Cuentas alcanzadas')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Traer de Instagram' })).toHaveCount(0);

  // Más guardados que visualizaciones no es posible: se avisa sin llamar al servidor.
  await tarjeta.getByLabel('Visualizaciones').fill('100');
  await tarjeta.getByLabel('Guardados').fill('500');
  await tarjeta.getByRole('button', { name: 'Guardar los números' }).click();
  await expect(tarjeta.getByRole('alert')).toContainText('No pueden haberlo guardado más personas');
  expect(peticiones.some((p) => p.ruta.endsWith('/resultado'))).toBe(false);

  await tarjeta.getByLabel('Visualizaciones').fill('12000');
  await tarjeta.getByLabel('Guardados').fill('300');
  await tarjeta.getByLabel('Lo vieron entero (%)').fill('41.5');
  await tarjeta.getByRole('button', { name: 'Guardar los números' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Anotado' })).toContainText('2,0× vuestra mediana en TikTok');
  const enviado = peticiones.find((p) => p.ruta.endsWith('/resultado'))!.cuerpo;
  expect(enviado).toEqual({ fecha: '2026-10-24', tarjetaId: 'fondo-pilar', red: 'tiktok', visualizaciones: 12000, guardados: 300, compartidos: null, pctCompleto: 41.5 });
  await page.screenshot({ path: 'test-results/asesor-metricas-tiktok.png' });
});

test('las otras redes de un vídeo son opcionales, van plegadas y se anotan sin salir de Resultados', async ({ page }) => {
  const { peticiones } = await abrirAsesor(page, { conPendientes: true, otrasRedes: true });
  await page.getByRole('tab', { name: /Resultados/ }).click();
  const resumen = page.getByText('¿Lo publicasteis también en otras redes?');
  await expect(resumen).toBeVisible();
  await expect(page.getByLabel('Visualizaciones')).toBeHidden(); // plegado: no estorba
  await resumen.click();

  await page.getByRole('tab', { name: 'YouTube Shorts' }).click();
  const yt = page.getByRole('form', { name: /en YouTube Shorts/ });
  await expect(yt.getByLabel('Vistas')).toBeVisible();
  await expect(yt.getByLabel('Se quedaron a verlo (%)')).toBeVisible();
  await expect(yt.getByText('Guardados')).toHaveCount(0); // YouTube no tiene «guardados»
  await page.getByRole('tab', { name: 'TikTok' }).click();
  const tt = page.getByRole('form', { name: /en TikTok/ });
  await tt.getByLabel('Visualizaciones').fill('800');
  await page.screenshot({ path: 'test-results/asesor-otras-redes.png' });
  await tt.getByRole('button', { name: 'Guardar los números' }).click();
  await expect.poll(() => peticiones.filter((p) => p.ruta.endsWith('/resultado')).length).toBe(1);
  expect(peticiones.find((p) => p.ruta.endsWith('/resultado'))!.cuerpo).toMatchObject({ fecha: '2026-10-23', tarjetaId: 'bolo-teaser', red: 'tiktok', visualizaciones: 800 });
});
