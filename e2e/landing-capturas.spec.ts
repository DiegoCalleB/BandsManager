import { test } from '@playwright/test';
import { abrirApp, irAEscritorio, irAMovil, cerrarModales, MOVIL } from './helpers-visual';

/**
 * Genera las capturas de la landing pública (public/landing/*.jpg) con DATOS DE DEMO ficticios
 * (nada de bandas ni salas reales). No corre en la suite normal: LANDING_SHOTS=1 npx playwright test --project=visual landing-capturas
 */
test.skip(!process.env.LANDING_SHOTS, 'solo bajo demanda');
test.describe.configure({ timeout: 280_000 });

const OUT = 'public/landing';
const salas: [string, string, string, number, string][] = [
  ['Sala Mercurio', 'Madrid', 'Madrid', 450, 'confirmado'],
  ['La Fábrica del Sur', 'Sevilla', 'Andalucía', 600, 'negociando'],
  ['Teatro Bóveda', 'Zaragoza', 'Aragón', 800, 'respondido'],
  ['Café Pleamar', 'Vigo', 'Galicia', 220, 'esperando_respuesta'],
  ['Sala Faro', 'Valencia', 'Comunitat Valenciana', 350, 'esperando_respuesta'],
  ['Garaje Ocho', 'Bilbao', 'País Vasco', 280, 'nuevo'],
  ['El Almacén', 'Granada', 'Andalucía', 400, 'nuevo'],
  ['Festival Ribera Viva', 'Valladolid', 'Castilla y León', 3000, 'aplazado'],
];
const leads = salas.map(([nombre, ciudad, region, aforo, estado], i) => ({
  id: 'l' + i, nombre_sala: nombre, ciudad, region, aforo, genero: 'Rock / Fusión', tipo: i === 7 ? 'festival' : 'sala',
  email_contacto: `programacion@${nombre.toLowerCase().replace(/[^a-z]/g, '')}.example`, telefono: '', instagram: '', fuente: 'scout',
  estado, pitch_generado: i < 5 ? 'Hola, somos…' : '', notas: '', band_id: 'bakandeya', es_verificado: i % 2 === 0,
}));
const concerts = [
  ['2026-06-20', 'Sala Mercurio', 'Madrid', 450, 'pendiente'], ['2026-06-27', 'La Fábrica del Sur', 'Sevilla', 600, 'pendiente'],
  ['2026-07-11', 'Teatro Bóveda', 'Zaragoza', 800, 'pendiente'], ['2026-07-25', 'Festival Ribera Viva', 'Valladolid', 1500, 'anticipo'],
  ['2026-06-05', 'Café Pleamar', 'Vigo', 300, 'pagado'],
].map(([fecha, sala, ciudad, cache, estado_pago], i) => ({ id: 'c' + i, fecha, sala, ciudad, cache, aforo_vendido: 0, aforo_total: 400, contrato_firmado: true, estado_pago, notas: '', tipo: 'sala', band_id: 'bakandeya' }));
const rehearsals = [{ id: 'r1', fecha: '2026-06-17', hora: '19:30', lugar: 'Local de ensayo', asistentes: [], notas: '', estado: 'programado', tipo_evento: 'ensayo', band_id: 'bakandeya' }];
const fans = Array.from({ length: 46 }, (_, i) => ({ id: 'f' + i, nombre: 'Fan ' + i, email: `fan${i}@example.com`, ciudad: ['Madrid', 'Sevilla', 'Vigo'][i % 3], comoConocio: i % 4 ? 'Únete' : 'Directo', fechaCaptura: new Date(Date.UTC(2026, Math.floor(i / 8), 3 + (i % 20))).toISOString().slice(0, 10), consentimientoRgpd: true, band_id: 'bakandeya' }));
const metrics = Array.from({ length: 30 }, (_, i) => ({ id: 'm' + i, fecha: new Date(Date.UTC(2026, 4, 17 + i)).toISOString().slice(0, 10), instagram: 1200 + i * 38 + Math.round(Math.sin(i / 3) * 90), tiktok: 800 + i * 71 + (i % 6) * 40, youtube: 300 + i * 12, spotify: 2100 + i * 55 + (i % 7) * 60, notas: '' }));
const state = { leads, rehearsals, concerts, posts: [], payments: [], metrics, songs: [], setlists: [], bands: [], tours: [], fans, campaigns: [], messages: [], runOfShow: {}, gearChecklists: {}, epkConfig: {}, autonomyConfig: {}, registeredBands: [], users: [], categoryTemplates: {} };

for (const tema of ['light', 'dark'] as const) {
  test(`escritorio ${tema}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/state*', (r) => r.fulfill({ json: state }));
    await abrirApp(page, false);
    await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, tema);
    const foto = async (nombre: string) => { await page.waitForTimeout(700); await page.screenshot({ path: `${OUT}/${nombre}-${tema}.jpg`, type: 'jpeg', quality: 82, clip: { x: 240, y: 0, width: 1040, height: 800 } }); };
    await page.waitForTimeout(1200);
    await foto('panel');
    await irAEscritorio(page, 'booking'); await page.getByRole('button', { name: 'Detalles' }).first().click().catch(() => {}); await foto('booking');
    await irAEscritorio(page, 'calendario'); await foto('calendario');
    await irAEscritorio(page, 'repertorio'); await foto('repertorio');
    await irAEscritorio(page, 'fans'); await foto('redes');
    await page.getByRole('tab', { name: /3\. Dashboard/ }).first().click(); await foto('fans');
  });
}

for (const tema of ['light', 'dark'] as const) {
  test(`movil ${tema}`, async ({ page }) => {
    await page.setViewportSize(MOVIL);
    await page.route('**/api/state*', (r) => r.fulfill({ json: state }));
    await abrirApp(page, true);
    await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, tema);
    const foto = async (nombre: string) => { await page.waitForTimeout(800); await page.screenshot({ path: `${OUT}/m-${nombre}-${tema}.jpg`, type: 'jpeg', quality: 82 }); };
    const barra = () => page.locator('nav[class*="bottom-0"]').last().locator('> button');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${OUT}/movil-panel-${tema}.jpg`, type: 'jpeg', quality: 82 });
    await irAMovil(page, 'repertorio'); await foto('repertorio');
    await irAMovil(page, 'calendario'); await foto('calendario');
    // Booking: menú → Directorio → Escenarios
    await barra().nth(4).click(); await page.waitForTimeout(500);
    await page.getByRole('button', { name: /^Directorio/ }).first().click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(500);
    const esc = page.getByRole('button', { name: /^Escenarios/ }).first();
    if (await esc.isVisible().catch(() => false)) await esc.click();
    await cerrarModales(page); await foto('booking');
    // Fans: menú → Promoción → Captura QR y fans → pestaña 3
    await barra().nth(4).click(); await page.waitForTimeout(500);
    await page.getByRole('button', { name: /^Promoción/ }).first().click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(600);
    await cerrarModales(page);
    await barra().nth(4).click(); await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Captura QR/ }).first().click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(1000); await cerrarModales(page);
    await page.getByRole('tab', { name: /3\. Dashboard/ }).first().click().catch(() => {});
    await foto('fans');
  });
}
