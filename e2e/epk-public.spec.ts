import { test, expect } from '@playwright/test';

// /epk es la única ruta pública de la app (dossier EPK que se manda a salas/festivales sin
// cuenta - ver AGENTS.md/App.tsx). Si esto se rompe, las salas no pueden ver el dossier y se
// pierden leads sin que nadie con sesión se entere.
test('el EPK público responde sin sesión', async ({ request }) => {
  const res = await request.get('/api/public/epk?band=demo');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.bandName || body.registeredBand?.nombre_banda).toBeTruthy();
});

test('la página /epk no exige login', async ({ page }) => {
  await page.goto('/epk?band=demo');
  await expect(page.getByPlaceholder('Correo electrónico o Usuario')).toHaveCount(0);
});
