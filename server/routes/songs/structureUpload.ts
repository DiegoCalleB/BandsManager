import express from 'express';
import multer from 'multer';
import path from 'path';
import { requireAuth } from '../../state.js';
import { getTargetBandId, puedeEscribirEnBanda } from '../../utils/bandAccess.js';
import { getSupabaseClient, getBucketName } from '../upload.js';
import { getAiClient, TIMEOUT_IA_LARGO_MS, generateContentWithFallback, GEMINI_MODEL } from '../../ai.js';
import { getSupabase } from '../../db/core.js';
import { Song } from '../../../src/types.js';

const router = express.Router();

// Multer setup for structure uploads
const multerMemoryStorage = multer.memoryStorage();
const uploadStructureMiddleware = multer({
  storage: multerMemoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  }
});

interface ExtractedStructure {
  acordes?: string;
  estructura?: string;
  progresionClave?: string;
  cortesYClaves?: string;
  capoTraste?: string;
  instrumentosClave?: string;
  notas?: string;
}

async function extractStructureWithAI(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<ExtractedStructure> {
  const aiClient = getAiClient();
  if (!aiClient) {
    throw new Error('No se pudo inicializar el cliente de IA');
  }

  const base64Data = fileBuffer.toString('base64');

  let imagePart: any;

  if (mimeType === 'application/pdf') {
    imagePart = {
      inlineData: {
        mimeType: 'application/pdf',
        data: base64Data,
      },
    };
  } else if (mimeType.startsWith('image/')) {
    imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Data,
      },
    };
  } else if (mimeType.includes('word')) {
    imagePart = {
      inlineData: {
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        data: base64Data,
      },
    };
  } else {
    throw new Error('Tipo de archivo no soportado para procesamiento');
  }

  const prompt = `You are an expert music analyst. Please analyze this song structure/chord sheet document and extract the following information in JSON format:

1. **acordes**: Complete lyrics with chords in the format "Am - Do - Mi" or similar, preserving the original structure
2. **estructura**: Main song structure (e.g., "Intro - Verso - Estribillo - Verso - Estribillo - Puente - Verso - Estribillo - Outro")
3. **progresionClave**: The chord progression pattern (e.g., "Am - F - C - G")
4. **cortesYClaves**: Key cuts/transitions and their timing if visible
5. **capoTraste**: Capo position if specified (e.g., "Capo 2" or "Capo 0 (sin capo)")
6. **instrumentosClave**: Key instruments or sections mentioned (e.g., "Guitarra, Batería, Bajo")
7. **notas**: Any additional notes or special instructions

Respond ONLY with valid JSON, no markdown backticks or explanations. If a field is not visible or applicable, use null.

Example response format:
{"acordes":"Am F\\nUna noche de verano...","estructura":"Intro - Verso - Estribillo","progresionClave":"Am - F - C - G","cortesYClaves":"Puente a los 2:15","capoTraste":"Capo 2","instrumentosClave":"Guitarra, Batería, Bajo","notas":"Solo de guitarra de 8 compases"}`;

  try {
    const response = await generateContentWithFallback(aiClient, {
      contents: [
        {
          role: 'user',
          parts: [imagePart, { text: prompt }],
        },
      ],
      timeoutMs: TIMEOUT_IA_LARGO_MS,
      preferredModel: GEMINI_MODEL,
    });

    const text = response.text();
    const extracted = JSON.parse(text) as ExtractedStructure;
    return extracted;
  } catch (error) {
    console.error('AI extraction error:', error);
    throw new Error('No se pudo extraer la información de la estructura');
  }
}

async function uploadFileToSupabase(
  fileBuffer: Buffer,
  fileName: string,
  bandId: string,
  songId: string
): Promise<string> {
  const supabaseClient = getSupabaseClient();
  if (!supabaseClient) {
    throw new Error('Supabase no está disponible');
  }

  const bucketName = getBucketName();
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-z0-9._-]/gi, '-').substring(0, 50);
  const storagePath = `bands/${bandId}/songs/${songId}/structures/${timestamp}-${sanitizedName}`;

  const { error: uploadError } = await supabaseClient.storage
    .from(bucketName)
    .upload(storagePath, fileBuffer, {
      contentType: 'application/octet-stream',
      upsert: false,
    });

  if (uploadError) {
    console.error('Supabase upload error:', uploadError);
    throw new Error('Error al guardar el archivo');
  }

  const { data: publicUrlData } = supabaseClient.storage
    .from(bucketName)
    .getPublicUrl(storagePath);

  return publicUrlData.publicUrl;
}

// POST /api/songs/:songId/upload-structure
router.post(
  '/:songId/upload-structure',
  requireAuth,
  uploadStructureMiddleware.single('file'),
  async (req, res) => {
    try {
      const { songId } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No se proporcionó archivo' });
      }

      // Get current user's band
      const bandId = getTargetBandId(req);
      if (!bandId) {
        return res.status(403).json({ error: 'No tiene acceso a una banda' });
      }

      // Verify song exists and user can edit it
      const supabase = getSupabase();
      const { data: song, error: songError } = await supabase
        .from('songs')
        .select('*')
        .eq('id', songId)
        .eq('band_id', bandId)
        .single();

      if (songError || !song) {
        return res.status(404).json({ error: 'Canción no encontrada' });
      }

      if (!puedeEscribirEnBanda(req, song.band_id)) {
        return res.status(403).json({ error: 'No tiene permisos para editar esta canción' });
      }

      // Upload file to Supabase
      const fileUrl = await uploadFileToSupabase(file.buffer, file.originalname, bandId, songId);

      // Extract structure with AI
      const extracted = await extractStructureWithAI(file.buffer, file.originalname, file.mimetype);

      // Update song with extracted data
      const updatedSong: Partial<Song> = {
        estructuraDocumentoUrl: fileUrl,
        estructuraDocumentoNombre: file.originalname,
        estructuraDocumentoProcesadoEn: new Date().toISOString(),
      };

      // Update cifradoTexto if we extracted acordes
      if (extracted.acordes) {
        updatedSong.cifradoTexto = extracted.acordes;
      }

      // Update guiaSustituto with extracted structure info
      if (extracted.estructura || extracted.progresionClave || extracted.cortesYClaves || extracted.capoTraste || extracted.instrumentosClave) {
        updatedSong.guiaSustituto = {
          estructura: extracted.estructura,
          progresionClave: extracted.progresionClave,
          cortesYClaves: extracted.cortesYClaves,
          capoTraste: extracted.capoTraste,
          instrumentosClave: extracted.instrumentosClave,
        };
      }

      const { data: updatedData, error: updateError } = await supabase
        .from('songs')
        .update(updatedSong)
        .eq('id', songId)
        .select()
        .single();

      if (updateError) {
        console.error('Update error:', updateError);
        return res.status(500).json({ error: 'Error al guardar los cambios' });
      }

      return res.json({
        success: true,
        song: updatedData,
        extracted: extracted,
      });
    } catch (error) {
      console.error('Structure upload error:', error);
      const message = error instanceof Error ? error.message : 'Error desconocido';
      return res.status(500).json({ error: message });
    }
  }
);

export default router;
