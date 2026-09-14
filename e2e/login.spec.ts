import { test, expect } from '@playwright/test';

// Smoke test del golden path público: cualquier usuario que entra a BandManager.ai sin
// sesión debe ver la pantalla de acceso y poder moverse entre login y registro sin errores
// de JS. No probamos el login real (requiere Supabase configurado); eso queda para un test
// de integración con backend real cuando el equipo lo priorice.
test.describe('Pantalla de acceso', () => {
  test('muestra el formulario de login por defecto', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByPlaceholder('Correo electrónico o Usuario')
    ).toBeVisible();
    await expect(page.getByPlaceholder('Contraseña')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar a mi cuenta' })).toBeVisible();
  });

  test('exige email/usuario y contraseña antes de enviar el formulario', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Entrar a mi cuenta' }).click();

    // Validación HTML5 nativa (required): el navegador bloquea el submit y no navega.
    await expect(page.getByPlaceholder('Correo electrónico o Usuario')).toBeFocused();
    await expect(page).toHaveURL('/');
  });

  test('permite pasar de login a registro y volver', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Crea tu cuenta gratis' }).click();
    await expect(page.getByPlaceholder('Nombre de tu banda')).toBeVisible();
    await expect(page.getByPlaceholder('Correo electrónico')).toBeVisible();

    await page.getByRole('button', { name: 'Volver al login' }).click();
    await expect(page.getByPlaceholder('Correo electrónico o Usuario')).toBeVisible();
  });
});
