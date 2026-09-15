import { test, expect } from '@playwright/test';

// El healthcheck es literalmente lo que usa Railway para decidir si el deploy está vivo
// (railway.json). Si esto rompe, el servidor no arranca - punto.
test('el healthcheck responde ok', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.status).toBe('ok');
});
