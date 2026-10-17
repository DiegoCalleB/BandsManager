// Transposición de audio (`/transpose-audio`).

import { Router } from 'express';
import { requireAuth } from '../state.js';
import { getTargetBandId } from '../utils/bandAccess.js';
import { processAudioTransposition } from '../services/audioTransposeService.js';
import { comoErrorCapturado } from '../../src/utils/errorCapturado.js';
import { responderError } from '../utils/errorHttp.js';
import { detalleTecnico } from './ai_music/detalleTecnico.js';

const router = Router();

router.post(['/transpose-audio', '/api/transpose-audio'], requireAuth, async (req, res) => {
  try {
    const { songId, audioUrl, audioBase64, semitones } = req.body;
    if ((!audioUrl && !audioBase64) || typeof semitones !== 'number') {
      res.status(400).json({ success: false, error: 'Faltan parámetros obligatorios: (audioUrl o audioBase64) y semitones.' });
      return;
    }

    const bandId = getTargetBandId(req);
    const result = await processAudioTransposition({
      songId: songId || 'song',
      audioUrl,
      audioBase64,
      semitones,
      bandId
    });

    if (result.success) {
      res.json(result);
    } else {
      console.error('[TransposeRoute] Trasposición fallida:', result.error);
      res.status(500).json({ success: false, error: 'No se pudo transponer el audio.', details: detalleTecnico(req, result.error) });
    }
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.error('[TransposeRoute Error]:', err);
    responderError(res, err, 'Error al procesar trasposición de audio.');
  }
});

export default router;
