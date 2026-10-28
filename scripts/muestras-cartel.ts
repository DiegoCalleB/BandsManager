/**
 * Genera carteles REALES con el mismo prompt, modelo y juez que usa la app, para mirarlos y ajustar con datos
 * en vez de a ciegas. Gasta imágenes de verdad (≈ 0,13 USD cada una con Gemini 3 Pro Image).
 *
 *   GEMINI_API_KEY=… npm run cartel:muestras -- [n=3] [estilo=serigrafia] [--sin-letras]
 *
 * Deja los PNG en `tmp/cartel-muestras/` y escribe por pantalla qué variante eligió el juez y si las letras
 * salieron bien escritas. No toca Supabase ni el libro de gastos.
 */
import fs from 'node:fs';
import path from 'node:path';
import { getAiClient, TIMEOUT_IA_LARGO_MS } from '../server/ai';
import { MODELO_IMAGEN, RELACION_FONDO_SANGRE } from '../server/services/imagenCartel';
import { elegirMejorVariante } from '../server/services/juezCartel';
import { construirPromptFondo, esEstiloCartel, costeImagenEur } from '../server/utils/promptCartel';

const args = process.argv.slice(2);
const sinLetras = args.includes('--sin-letras');
const posicionales = args.filter((a) => !a.startsWith('--'));
const n = Math.min(6, Math.max(1, Number(posicionales[0]) || 3));
const estilo = esEstiloCartel(posicionales[1]) ? posicionales[1] : 'serigrafia';

// Datos de ejemplo genéricos: nada de bandas reales en el código.
const textos = { nombre: 'LOS TOROS', fecha: 'SÁB 12 DIC 2026', lugar: 'SALA EL SOL · MADRID' };

async function main() {
  const client = getAiClient();
  if (!client) throw new Error('Falta GEMINI_API_KEY en el entorno.');
  const prompt = construirPromptFondo({ estilo, encuadre: 'sangre', generoBanda: 'rock', ciudad: 'Madrid', ...(sinLetras ? {} : { textos }) });
  const salida = path.join(process.cwd(), 'tmp', 'cartel-muestras');
  fs.mkdirSync(salida, { recursive: true });
  console.log(`Modelo ${MODELO_IMAGEN} · estilo ${estilo} · ${n} variantes · ${sinLetras ? 'sin letras de IA' : 'con letras de IA'}`);

  const resultados = await Promise.allSettled(
    Array.from({ length: n }, async () => {
      const r = await client.models.generateContent({
        model: MODELO_IMAGEN,
        contents: prompt,
        config: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: RELACION_FONDO_SANGRE }, abortSignal: AbortSignal.timeout(TIMEOUT_IA_LARGO_MS) },
      });
      const parte = r.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
      if (!parte?.inlineData?.data) throw new Error('El modelo no devolvió imagen.');
      return { mimeType: parte.inlineData.mimeType || 'image/png', data: parte.inlineData.data };
    })
  );
  const buenas = resultados.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
  resultados.forEach((r, i) => r.status === 'rejected' && console.warn(`Variante ${i}: ${(r.reason as Error)?.message || r.reason}`));
  if (!buenas.length) throw new Error('Ninguna variante salió.');

  buenas.forEach((v, i) => fs.writeFileSync(path.join(salida, `muestra-${i}.png`), Buffer.from(v.data, 'base64')));
  const veredicto = await elegirMejorVariante('', buenas, sinLetras ? null : textos);
  console.log(`Guardadas ${buenas.length} en ${salida}`);
  console.log(`El juez elige la muestra-${veredicto.indice}${sinLetras ? '' : veredicto.textoOk ? ' (letras bien escritas)' : ' (¡letras con faltas en todas!)'}`);
  console.log(`Coste aproximado: ${(buenas.length * costeImagenEur(true)).toFixed(2)} €`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
