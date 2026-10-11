/**
 * Rutas de generación musical: pistas/jingles completos y pista de un instrumento.
 */
import express from 'express';
import { requireAuth } from '../../state.js';
import { iaRateLimiter } from '../../middleware/rateLimiter.js';
import { costEurFromTokens, generateContentWithFallback } from '../../ai.js';
import { dbRecordAiUsage } from '../../db/aiLedger.js';
import { getTargetBandId } from '../../utils/bandAccess.js';
import { ai, generateMusicGenTrack, callLyriaWithRetries } from './generacionMusical.js';
import { parseGeminiError } from './diagnosticosInfra.js';
import { comoErrorCapturado } from '../../../src/utils/errorCapturado.js';

const router = express.Router();

// requireAuth + iaRateLimiter: llegó desde AI Studio sin ninguno de los dos, así que era una
// pasarela gratis y sin límite a un modelo de pago (Lyria) con la clave de la propia plataforma
// para cualquiera que diera con la URL — la misma clase de fallo que /write-reels-copy ya
// tenía cerrada (ver ese comentario en chat.ts).
router.post(
  ['/generate', '/generate-music'],
  requireAuth,
  iaRateLimiter,
  async (req, res) => {
    try {
      const { prompt, style, lyrics } = req.body;
      const fullPrompt = `Create a professional custom soundtrack, jingle or background music in the musical style of: ${style || 'rock'}. User prompt / description: ${prompt || 'Energetic independent band theme'}. Band style, ideology and lyric context: ${lyrics || 'Independent music passion'}`;

      const response = await ai.models.generateContentStream({
        model: 'lyria-3-clip-preview',
        contents: fullPrompt,
      });

      let audioBase64 = '';
      let generatedLyrics = '';
      let mimeType = 'audio/wav';
      let usageMetadata:
        | { promptTokenCount?: number; candidatesTokenCount?: number }
        | undefined;

      for await (const chunk of response) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (chunk.usageMetadata) usageMetadata = chunk.usageMetadata;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioBase64 && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioBase64 += part.inlineData.data;
          }
          if (part.text && !generatedLyrics) {
            generatedLyrics = part.text;
          }
        }
      }

      if (!audioBase64) {
        return res
          .status(500)
          .json({ error: 'No se pudo generar el clip de audio musical.' });
      }

      // Lyria no tiene tarifa propia en AI_PRICING_TABLE (es audio, no texto): se usa la tarifa de
      // Gemini como aproximación de visibilidad, no como coste exacto de facturación de audio.
      let bandId: string | undefined;
      try {
        bandId = getTargetBandId(req);
      } catch (eCapturado) {
        const e = comoErrorCapturado(eCapturado);
        console.warn(
          '[AI Ledger] Sin banda activa para registrar consumo de Lyria:',
          e?.message || e
        );
      }
      if (bandId && usageMetadata) {
        const promptTokens = usageMetadata.promptTokenCount || 0;
        const completionTokens = usageMetadata.candidatesTokenCount || 0;
        dbRecordAiUsage({
          bandId,
          promptTokens,
          completionTokens,
          modelName: 'lyria-3-clip-preview',
          estimatedCostEur: costEurFromTokens(
            'gemini',
            promptTokens,
            completionTokens
          ),
        }).catch((err) =>
          console.warn(
            '[AI Ledger] No se pudo registrar consumo de Lyria:',
            err?.message || err
          )
        );
      }

      return res.json({
        success: true,
        audioBase64,
        mimeType,
        lyrics: generatedLyrics,
      });
    } catch (errCapturado) {
      const err = comoErrorCapturado(errCapturado);
      console.error('AI Music generation error:', err);
      const gemDiag = parseGeminiError(err);
      return res.status(gemDiag.httpStatus).json({
        provider: gemDiag.provider,
        error: gemDiag.errorTitle,
        message: gemDiag.message,
        errorType: gemDiag.errorType,
        errorTitle: gemDiag.errorTitle,
        actionAdvice: gemDiag.actionAdvice,
        details: gemDiag.errorDetail,
      });
    }
  }
);

router.post(
  '/ai-generate-instrument-track',
  requireAuth,
  iaRateLimiter,
  async (req, res) => {
    try {
      const {
        instrument,
        songTitle,
        sectionName,
        bpm,
        key,
        style,
        genero,
        contextPrompt,
        targetDurationSec,
        sourceAudioUrl,
        songHash
      } = req.body;

      const requestedInst = instrument || 'Guitarra Solista';
      // Diego reportó que un tema de rock salía sonando a salsa/merengue — Lyria puede desviarse de
      // género si solo se lo mencionas una vez en mitad de una lista de bullets. Anclamos el género
      // real de la canción (no solo el preset de estilo) al PRINCIPIO y al FINAL del prompt, que es
      // donde los modelos generativos prestan más atención (primacía/recencia), y lo repetimos varias
      // veces con lenguaje explícito de restricción en vez de dejarlo como un dato más entre otros.
      const genreLabel = genero || style || 'el estilo de la banda';

      let bandId = 'sin-banda';
      try {
        bandId = getTargetBandId(req);
      } catch {
        bandId = req.user?.band_id || 'sin-banda';
      }

      // Intento principal: MusicGen (Meta, vía Replicate) condicionado al audio REAL de la idea —
      // escucha melodía/acordes/ritmo en vez de adivinar desde texto, así que encaja de verdad con
      // ESTA canción concreta (lo que Lyria nunca pudo hacer, solo recibe una descripción). Solo si
      // no hay audio de referencia disponible, o MusicGen falla, se cae a Lyria como red de seguridad.
      if (sourceAudioUrl) {
        const musicGenResult = await generateMusicGenTrack(
          sourceAudioUrl,
          requestedInst,
          genreLabel,
          bpm,
          key,
          bandId,
          songHash,
          req.get('host'),
          req.body.replicateToken
        );
        if (musicGenResult.audioUrl) {
          return res.json({
            success: true,
            instrument: requestedInst,
            trackName: `Pista IA: ${requestedInst} (${key || 'Am'}, ${bpm || 120} BPM)`,
            audioUrl: musicGenResult.audioUrl,
            modelUsed: 'musicgen-melody',
            arrangementNotes: `Generado escuchando el audio real de la canción con MusicGen (Meta) — condicionado a la melodía, acordes y ritmo originales, no adivinado desde una descripción de texto. [MusicGen · condicionado al audio]`,
            bpm: bpm || 120,
            key: key || 'Am',
          });
        }
        console.warn(
          '[AI Track Gen] MusicGen falló, cayendo a Lyria (solo texto):',
          musicGenResult.error
        );
      }

      const basePrompt = `STRICT GENRE CONSTRAINT: this track MUST sound like ${genreLabel}. Do NOT generate any other genre, rhythm feel, or instrumentation style.

Compose and generate a high quality studio arrangement track for the instrument: "${requestedInst}", strictly in the ${genreLabel} genre.
Musical context:
- Song Title: "${songTitle || 'Canción de la Banda'}"
- Genre (mandatory, do not deviate from this): "${genreLabel}"
- Active Section: "${sectionName || 'Estribillo'}"
- Tempo: ${bpm || 120} BPM
- Key: "${key || 'La menor / Am'}"
- Style: "${style || genreLabel}"
- Specific instructions: "${contextPrompt || 'Arreglo virtuosista, melódico y dinámico que encaje a la perfección con la sección'}"

REMINDER: the final audio must clearly and unmistakably be ${genreLabel}, matching the tempo and key above. Do not switch to a different genre than ${genreLabel} under any circumstance.`;

      let audioBase64 = '';
      let mimeType = 'audio/wav';
      let arrangementNotes = '';
      // lyria-3-clip-preview es el motor principal: en pruebas reales encaja mucho mejor con la
      // tonalidad/tempo/estilo pedidos que lyria-3-pro-preview, aunque este último soporte pistas
      // más largas — de nada sirve una pista de 3 minutos si suena a otra canción. Se queda en 30s
      // fijos (limitación del propio modelo), y solo si falla del todo probamos Pro con una
      // instrucción de duración explícita, priorizando "algo largo" sobre "nada" en ese caso extremo.
      let modelUsed = 'lyria-3-clip-preview';

      try {
        const result = await callLyriaWithRetries(modelUsed, basePrompt, 2);
        audioBase64 = result.audioBase64;
        mimeType = result.mimeType;
        arrangementNotes = result.arrangementNotes;
      } catch (lyriaClipErr) {
        console.warn(
          `Lyria ${modelUsed} falló tras reintentos, probando fallback a lyria-3-pro-preview (más duración, pero menos fiel al contexto en pruebas):`,
          lyriaClipErr
        );
        modelUsed = 'lyria-3-pro-preview';
        const clampedDurationSec =
          Math.max(30, Math.min(175, Number(targetDurationSec) || 0)) ||
          undefined;
        const proPrompt = `${basePrompt}\n- Target duration: ${clampedDurationSec ? `generate a FULL ${clampedDurationSec}-second track that covers the entire song, not just a short intro clip` : 'generate as long a complete track as the model allows, not just a short intro clip'}`;
        try {
          const result = await callLyriaWithRetries(modelUsed, proPrompt, 2);
          audioBase64 = result.audioBase64;
          mimeType = result.mimeType;
          arrangementNotes = result.arrangementNotes;
        } catch (lyriaProErr) {
          console.warn(
            'Lyria API call error (ambos modelos, con reintentos), fall-back a explicación de texto de Gemini:',
            lyriaProErr
          );
        }
      }

      // Secondary text guidance from Gemini 3.7 Flash for arrangement rationale
      let aiExplanation = '';
      try {
        const expRes = await generateContentWithFallback(ai, {
          contents: `Describe en 2 frases breves en español qué idea musical de arreglo has compuesto para el instrumento "${requestedInst}" en la canción "${songTitle}" (Tonalidad: ${key || 'Am'}, Tempo: ${bpm || 120} BPM). Explica qué ritmo y notas debe tocar el músico.`,
        });
        aiExplanation = expRes?.text || '';
      } catch (e) {
        console.warn('Fallo explicación de arreglo:', e);
      }

      const modelLabel =
        modelUsed === 'lyria-3-pro-preview'
          ? 'Lyria 3 Pro · larga duración'
          : 'Lyria 3 Clip · 30s fijos';
      return res.json({
        success: true,
        instrument: requestedInst,
        trackName: `Pista IA: ${requestedInst} (${key || 'Am'}, ${bpm || 120} BPM)`,
        audioBase64,
        mimeType,
        modelUsed,
        arrangementNotes: `${aiExplanation || arrangementNotes || `Arreglo de ${requestedInst} compuesto por la IA en ${key || 'Am'} a ${bpm || 120} BPM.`} [${modelLabel}]`,
        bpm: bpm || 120,
        key: key || 'Am',
      });
    } catch (errCapturado) {
      const err = comoErrorCapturado(errCapturado);
      console.error('Error al generar pista de instrumento con IA:', err);
      const gemDiag = parseGeminiError(err);
      return res.status(gemDiag.httpStatus).json({
        provider: gemDiag.provider,
        error: gemDiag.errorTitle,
        message: gemDiag.message,
        errorType: gemDiag.errorType,
        errorTitle: gemDiag.errorTitle,
        actionAdvice: gemDiag.actionAdvice,
        details: gemDiag.errorDetail,
      });
    }
  }
);

export default router;
