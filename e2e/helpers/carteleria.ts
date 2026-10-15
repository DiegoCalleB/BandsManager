import type { Page } from '@playwright/test';

export interface PeticionCartel {
  metodo: string;
  ruta: string;
  tipo?: string;
  cuerpo: Buffer;
}

/**
 * Entra con el usuario semilla, simula los bolos y el servidor de carteles y abre Cartelería a
 * ~390 px (móvil primero, AGENTS.md §6). `servidor.config` es lo que el «servidor» tiene en `cartel_config`.
 */
export async function abrirCarteleria(page: Page, { compartido = false, estadoEstatico = false }: { compartido?: boolean; estadoEstatico?: boolean } = {}) {
  const peticiones: PeticionCartel[] = [];
  const servidor = { config: null as unknown };
  let banda: string | undefined;

  page.on('response', async (res) => {
    if (!res.url().includes('/api/auth/') || !res.ok()) return;
    const j = await res.json().catch(() => null);
    banda = banda || j?.user?.band_id;
  });

  await page.route('**/api/state', async (route) => {
    const r = await route.fetch();
    const j = await r.json().catch(() => ({}));
    delete j.error;
    const base = { cache: 300, aforo_vendido: 0, aforo_total: 200, contrato_firmado: true, estado_pago: 'pendiente', notas: '', tipo: 'sala', band_id: banda };
    j.concerts = [
      {
        ...base, id: 'e2e-c1', fecha: '2099-11-14', sala: 'Sala El Sol', ciudad: 'Madrid',
        logisticaTecnica: { horaAperturaPuertas: '20:30', horaShow: '21:30' },
        ...(compartido ? { bandas_compartidas: ['Otra Banda'] } : {}),
        // Estático: el «servidor» sigue devolviendo el bolo sin cartel, así que solo la copia en memoria de la app puede recordarlo.
        cartel_config: estadoEstatico ? null : servidor.config,
      },
    ];
    await route.fulfill({ status: 200, json: j });
  });
  await page.route('**/api/short-links', (route) =>
    route.request().method() === 'POST'
      ? route.fulfill({ json: { code: 'ab3k9x2', url: 'https://bandmanager.io/r/ab3k9x2', creado: false } })
      : route.fallback());
  await page.route('**/api/cartel/**', async (route) => {
    const req = route.request();
    const ruta = new URL(req.url()).pathname;
    const cuerpo = req.postDataBuffer() ?? Buffer.alloc(0);
    peticiones.push({ metodo: req.method(), ruta, tipo: req.headers()['content-type'], cuerpo });
    if (ruta.endsWith('/config')) {
      servidor.config = JSON.parse(cuerpo.toString());
      return route.fulfill({ json: { config: servidor.config } });
    }
    return route.fulfill({ json: { url: 'https://x.supabase.co/storage/v1/object/public/band-media/carteles/b/e2e-c1.png?v=1' } });
  });

  await page.goto('/');
  if (!(await page.getByPlaceholder('Correo electrónico o Usuario').isVisible().catch(() => false))) {
    await page.getByRole('button', { name: 'Entrar', exact: true }).first().click();
  }
  await page.getByPlaceholder('Correo electrónico o Usuario').fill('diego');
  await page.getByPlaceholder('Contraseña').fill('demo2026');
  await page.getByRole('button', { name: 'Entrar a mi cuenta' }).click();
  // Con los bolos simulados el asistente de configuración puede no salir: es opcional.
  await page.getByText('Configurar más tarde').click({ timeout: 8_000 }).catch(() => {});
  await page.getByText('Explorar por mi cuenta').click({ timeout: 3_000 }).catch(() => {});
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?view=carteleria');
  await page.getByRole('tab', { name: 'Feed' }).waitFor({ timeout: 20_000 });
  return { peticiones, servidor };
}
