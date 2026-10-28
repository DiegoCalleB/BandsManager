import { test, expect, type Page } from '@playwright/test';

// Asesor de marketing a ~390 px: opciones de hoy, preparar una pieza con IA, marcarla como hecha y
// saltar una idea. El servidor del asesor se simula (el plan real lo cubren los tests de Vitest):
// aquí se comprueba el contrato del cliente y que la pantalla se entiende.

test.setTimeout(120_000);

const IDEA = (id: string, formato: string, titulo: string, extra: Record<string, unknown> = {}) => ({
  id, formato, titulo, redes: formato === 'reel' ? ['instagram', 'tiktok'] : ['instagram'], tipo: 'humano',
  idea: 'Quince segundos del estribillo, empezando fuerte.', porque: 'Los reels llegan a gente que aún no os sigue.',
  esfuerzoMin: formato === 'reel' ? 45 : 5, atajo: null, hecha: false, ...extra,
});

const PIEZA = {
  formato: 'reel', gancho: 'Tres días para Leganés y aún no sabemos con qué abrir',
  pasos: [{ titulo: 'Primer plano del setlist en el suelo · 2 s', detalle: 'Texto: ¿con cuál abrimos?' }, { titulo: 'El estribillo en el local · 10 s', detalle: 'Sin cortes, que se oiga la sala' }],
  textos: [
    { red: 'instagram', texto: 'El sábado en Oktoberfest. Vota en stories.', hashtags: ['#rockleganes', '#rutA66band'] },
    { red: 'tiktok', texto: 'Rock en Leganés este sábado', hashtags: ['#rockmadrid'] },
  ],
  cta: 'Guárdalo para el sábado', portada: 'Abrimos con…',
};

async function abrirAsesor(page: Page) {
  const peticiones: Array<{ ruta: string; cuerpo: any }> = [];
  const servidor = { hechas: new Set<string>(), saltadas: new Set<string>() };
  const ideas = [
    IDEA('hito-anuncio', 'post', 'Anuncio del bolo', { atajo: { vista: 'carteleria', concertId: 'c1' }, tipo: 'promocional' }),
    IDEA('bolo-teaser', 'reel', 'Un adelanto del directo'),
    IDEA('bolo-encuesta', 'stories', 'Stories con cuenta atrás'),
    IDEA('bolo-setlist', 'carrusel', 'Lo que vais a escuchar'),
  ];
  await page.route('**/api/asesor/**', async (route) => {
    const req = route.request();
    const ruta = new URL(req.url()).pathname;
    const cuerpo = req.postData() ? JSON.parse(req.postData()!) : null;
    peticiones.push({ ruta, cuerpo });
    if (ruta.endsWith('/asesor/hoy')) {
      const vivas = ideas.filter((i) => !servidor.saltadas.has(i.id)).map((i) => ({ ...i, hecha: servidor.hechas.has(i.id) }));
      return route.fulfill({ json: {
        hoy: '2026-10-28',
        diagnostico: { modo: 'concierto', porque: 'Tocáis en 3 días en Oktoberfest, Leganés: toca llenar la sala.', concierto: null, dias: 3 },
        opciones: { recomendadas: vivas.slice(0, 2), alternativas: vivas.slice(2) },
        semana: ['22', '23', '24', '25', '26', '27', '28'].map((d, k) => ({ fecha: `2026-10-${d}`, hechas: [0, 1, 0, 2, 0, 0, servidor.hechas.size][k] })),
        estrategia: { v: 1, objetivo: 'llenar_salas', etapa: 'local', publico: '', horasSemana: 3, camara: 'algunos', pilares: [], lineasRojas: [], referentes: [], lanzamiento: null, revisada: true },
        tieneEstrategia: true,
      } });
    }
    if (ruta.endsWith('/asesor/pieza')) return route.fulfill({ json: { pieza: PIEZA } });
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
  await page.getByText('Modo concierto').waitFor({ timeout: 20_000 });
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
