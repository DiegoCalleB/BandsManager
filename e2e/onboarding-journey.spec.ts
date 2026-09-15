import { test, expect } from '@playwright/test';

// Journey test: la primera experiencia real de una banda nueva, de principio a fin -
// registro -> asistente de configuración inicial (12 pasos, se dispara solo en el primer
// login - OnboardingWizardModal) -> panel funcionando. A diferencia de auth.spec.ts (que entra
// con un usuario semilla ya existente), esto crea una banda nueva de verdad en cada corrida,
// así que ejercita el camino completo que ve alguien que se apunta a BandManager.ai por
// primera vez - justo lo que enseñarías en una demo del TFM.
//
// Selector de panel autenticado solo existe en la cabecera móvil (md:hidden) - viewport forzado
// a móvil, igual que en auth.spec.ts (y coherente con AGENTS.md §6: diseñar de verdad a ~390px).
test.use({ viewport: { width: 390, height: 844 } });

test('una banda nueva se registra, ve el asistente de bienvenida y llega al panel', async ({ page }) => {
  const sufijo = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  await page.goto('/');
  await page.getByRole('button', { name: 'Crea tu cuenta gratis' }).click();

  await page.getByPlaceholder('Nombre de tu banda').fill(`E2E Test Band ${sufijo}`);
  await page.getByPlaceholder('Tu nombre').fill('E2E Tester');
  await page.getByPlaceholder('Correo electrónico').fill(`e2e-${sufijo}@example.com`);
  await page.getByPlaceholder('Contraseña').fill('e2eTestPass123');
  await page.getByRole('button', { name: 'Crear mi Dossier y QR' }).click();

  const asistente = page.getByText('Configuración Inicial ·');
  await expect(asistente).toBeVisible({ timeout: 15_000 });

  await page.getByTitle('Cerrar asistente').click();
  await expect(asistente).toHaveCount(0);

  await expect(page.locator('[title*="cambiar de banda"]').first()).toBeVisible();
});
