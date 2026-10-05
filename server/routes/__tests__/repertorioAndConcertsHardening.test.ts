import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Test de límite de confianza y hardening arquitectural para:
 * - server/routes/repertorio.ts
 * - server/routes/concerts.ts
 *
 * Verifica que ninguna creación o sincronización acepte un band_id arbitrario
 * enviado en el cuerpo o consulta, obligando a resolver la banda mediante getTargetBandId(req).
 */
describe('Hardening de Límite de Confianza en Rutas (Repertorio y Conciertos)', () => {
  const routesDir = path.join(__dirname, '..');
  const repertorioPath = path.join(routesDir, 'repertorio.ts');
  const concertsPath = path.join(routesDir, 'concerts.ts');

  it('server/routes/repertorio.ts: no contiene bypasses de if (!(objeto).band_id)', () => {
    const code = fs.readFileSync(repertorioPath, 'utf-8');
    const dangerousIfSong = /if\s*\(\s*!\s*\(\s*newSong\s+as\s+any\s*\)\.band_id\s*\)/;
    const dangerousIfSetlist = /if\s*\(\s*!\s*\(\s*newSetlist\s+as\s+any\s*\)\.band_id\s*\)/;
    
    expect(code.match(dangerousIfSong), 'No debe existir bypass en creación de canción').toBeNull();
    expect(code.match(dangerousIfSetlist), 'No debe existir bypass en creación de setlist').toBeNull();
  });

  it('server/routes/repertorio.ts: fuerza la asignación incondicional de userBandId resuelta por getTargetBandId', () => {
    const code = fs.readFileSync(repertorioPath, 'utf-8');
    expect(code).toContain('(newSong as any).band_id = userBandId;');
    expect(code).toContain('(newSetlist as any).band_id = userBandId;');
  });

  it('server/routes/concerts.ts: no contiene bypasses de if (!(objeto).band_id)', () => {
    const code = fs.readFileSync(concertsPath, 'utf-8');
    const dangerousIfConcert = /if\s*\(\s*!\s*\(\s*newConcert\s+as\s+any\s*\)\.band_id\s*\)/;
    const dangerousIfRehearsal = /if\s*\(\s*!\s*\(\s*newRehearsal\s+as\s+any\s*\)\.band_id\s*\)/;

    expect(code.match(dangerousIfConcert), 'No debe existir bypass en creación de concierto').toBeNull();
    expect(code.match(dangerousIfRehearsal), 'No debe existir bypass en creación de ensayo').toBeNull();
  });

  it('server/routes/concerts.ts: no usa (req as any).user?.band_id directamente en endpoints de sync o payments', () => {
    const code = fs.readFileSync(concertsPath, 'utf-8').replace(/\r\n/g, '\n');
    // Verifica que en las rutas principales de sync y logistics se usa getTargetBandId(req)
    expect(code).toContain('router.post("/concerts/sync", requireAuth, async (req, res) => {\n  const userBandId = getTargetBandId(req);');
    expect(code).toContain('router.get("/logistics", requireAuth, async (req, res) => {\n  const userBandId = getTargetBandId(req);');
    expect(code).toContain('router.get("/payments", requireAuth, requireLeader, async (req, res) => {\n  const userBandId = getTargetBandId(req);');
  });
});
