import express from "express";
import { GoogleGenAI, Modality } from "@google/genai";
import { requireAuth } from "../state.js";
import { iaRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// requireAuth + iaRateLimiter: llegó desde AI Studio sin ninguno de los dos, así que era una
// pasarela gratis y sin límite a un modelo de pago (Lyria) con la clave de la propia plataforma
// para cualquiera que diera con la URL — la misma clase de fallo que /write-reels-copy ya
// tenía cerrada (ver ese comentario en chat.ts).
router.post(["/generate", "/generate-music"], requireAuth, iaRateLimiter, async (req, res) => {
  try {
    const { prompt, style, lyrics } = req.body;
    const fullPrompt = `Create a professional custom soundtrack, jingle or background music in the musical style of: ${style || 'rock'}. User prompt / description: ${prompt || 'Energetic independent band theme'}. Band style, ideology and lyric context: ${lyrics || 'Independent music passion'}`;

    const response = await ai.models.generateContentStream({
      model: "lyria-3-clip-preview",
      contents: fullPrompt,
    });

    let audioBase64 = "";
    let generatedLyrics = "";
    let mimeType = "audio/wav";

    for await (const chunk of response) {
      const parts = chunk.candidates?.[0]?.content?.parts;
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
      return res.status(500).json({ error: "No se pudo generar el clip de audio musical." });
    }

    return res.json({
      success: true,
      audioBase64,
      mimeType,
      lyrics: generatedLyrics
    });
  } catch (err: any) {
    console.error("AI Music generation error:", err);
    return res.status(500).json({ error: err.message || "Error al generar música con IA Lyria" });
  }
});

export default router;
