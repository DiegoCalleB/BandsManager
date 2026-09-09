import { Router } from 'express';
import { requireAuth } from '../state.js';
import { getTargetBandId } from '../utils/bandAccess.js';
import { processAudioTransposition } from '../services/audioTransposeService.js';

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
      res.status(500).json(result);
    }
  } catch (err: any) {
    console.error('[TransposeRoute Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Error al procesar trasposición de audio.' });
  }
});

export default router;
