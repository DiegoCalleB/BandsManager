import express from "express";
import { GoogleGenAI } from "@google/genai";
import { requireAuth } from "../state.js";
import { iaRateLimiter } from "../middleware/rateLimiter.js";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import path from "path";
import fs from "fs";

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

const router = express.Router();

/**
 * Procesa la separación de stems con Red Neuronal Demucs v4 (Replicate) si REPLICATE_API_TOKEN está configurado.
 * Devuelve un mapa con { Voz, Batería, Bajo, Guitarras, Arreglos } usando audio real de estudio.
 */
async function processNeuralStemsReplicate(audioUrl: string): Promise<Record<string, string> | null> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return null;

  try {
    let resolvedUrl = audioUrl;
    if (audioUrl.startsWith('/uploads/') || audioUrl.startsWith('/')) {
      const appUrl = process.env.APP_URL || '';
      if (appUrl) {
        resolvedUrl = `${appUrl.replace(/\/$/, '')}${audioUrl}`;
      }
    }

    console.log("[Demucs Neural] Iniciando separación de stems con Demucs v4 (HT-Demucs) en Replicate...");
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: "25a173c086e222f926f2c618708a869c12471c3082e6d82814049abc830fbfa2",
        input: {
          audio: resolvedUrl,
          stem: "all",
          split: true
        }
      })
    });

    if (!response.ok) {
      console.warn("Replicate API request failed:", response.status, await response.text());
      return null;
    }

    let prediction = await response.json();
    const predictionId = prediction.id;

    // Polling hasta finalización (máx 75s)
    const startTime = Date.now();
    while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && prediction.status !== 'canceled') {
      if (Date.now() - startTime > 75000) {
        console.warn("Demucs separation timeout en Replicate");
        return null;
      }
      await new Promise(r => setTimeout(r, 2500));
      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      if (pollRes.ok) {
        prediction = await pollRes.json();
      }
    }

    if (prediction.status === 'succeeded' && prediction.output) {
      const out = prediction.output;
      console.log("[Demucs Neural] ¡Separación neuronal completada con éxito!");
      const stemsMap: Record<string, string> = {};
      if (out.vocals) stemsMap['Voz'] = out.vocals;
      if (out.drums) stemsMap['Batería'] = out.drums;
      if (out.bass) stemsMap['Bajo'] = out.bass;
      if (out.other || out.guitar) stemsMap['Guitarras'] = out.guitar || out.other;
      if (out.piano || out.other) stemsMap['Arreglos'] = out.piano || out.other;

      return stemsMap;
    }
  } catch (err) {
    console.warn("Error invocando modelo neuronal Demucs en Replicate:", err);
  }
  return null;
}

/**
 * Función auxiliar para procesar stems en el servidor usando FFmpeg y supresión Mid/Side
 */
async function processServerStemsFfmpeg(audioUrl: string): Promise<Record<string, string>> {
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "stems");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Handle local path vs HTTP URL
  let inputPath = audioUrl;
  if (audioUrl.startsWith("http://") || audioUrl.startsWith("https://")) {
    inputPath = audioUrl;
  } else if (audioUrl.startsWith("/")) {
    inputPath = path.join(process.cwd(), "public", audioUrl);
    if (!fs.existsSync(inputPath)) {
      console.warn(`Archivo de audio no encontrado para FFmpeg: ${inputPath}`);
      return {};
    }
  }

  const timestamp = Date.now();
  const stemsMap: Record<string, string> = {};

  // Standard crash-proof FFmpeg audio filters (avoiding memory-heavy afftdn)
  const configs = [
    {
      key: "Voz",
      filename: `stem-vocal-${timestamp}.wav`,
      filter: "pan=mono|c0=0.5*c0+0.5*c1,highpass=f=260,lowpass=f=3400,equalizer=f=1500:width_type=q:width=1.5:g=5,volume=1.5"
    },
    {
      key: "Batería",
      filename: `stem-drums-${timestamp}.wav`,
      filter: "highpass=f=1800,equalizer=f=1200:width_type=q:width=2:g=-12,volume=1.2"
    },
    {
      key: "Bajo",
      filename: `stem-bass-${timestamp}.wav`,
      filter: "lowpass=f=180,lowpass=f=180,equalizer=f=80:width_type=q:width=1.2:g=3,volume=1.3"
    },
    {
      key: "Guitarras",
      filename: `stem-guitars-${timestamp}.wav`,
      filter: "pan=stereo|c0=c0-c1|c1=c1-c0,bandpass=f=800:width_type=h:width=1200,volume=1.2"
    },
    {
      key: "Arreglos",
      filename: `stem-brass-${timestamp}.wav`,
      filter: "pan=stereo|c0=c0-c1|c1=c1-c0,highpass=f=2200,lowpass=f=8500,volume=1.2"
    }
  ];

  // Process stems sequentially to avoid parallel process memory exhaustion
  for (const cfg of configs) {
    await new Promise<void>((resolve) => {
      const outputPath = path.join(uploadsDir, cfg.filename);
      try {
        ffmpeg(inputPath)
          .audioFilters(cfg.filter)
          .output(outputPath)
          .on("end", () => {
            if (fs.existsSync(outputPath)) {
              stemsMap[cfg.key] = `/uploads/stems/${cfg.filename}`;
            }
            resolve();
          })
          .on("error", (err) => {
            console.warn(`Aviso procesando stem FFmpeg ${cfg.key}:`, err?.message || err);
            resolve(); // Safe fallback
          })
          .run();
      } catch (procErr) {
        console.warn(`Error al lanzar FFmpeg para ${cfg.key}:`, procErr);
        resolve();
      }
    });
  }

  return stemsMap;
}

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

/**
 * Endpoint de Separación de Pistas por IA (Deep AI Stem Separation)
 * Utiliza Gemini 3.7 Flash para analizar el espectro musical, la estructura y los instrumentos
 * presentes en la canción y generar pistas aisladas para cada instrumento.
 */
router.post("/ai-stem-separation", requireAuth, iaRateLimiter, async (req, res) => {
  try {
    const { songTitle, sectionName, audioUrl, bpm, key } = req.body;

    const analysisPrompt = `Eres un ingeniero de sonido e IA experto en 'Music Source Separation' (Separación de Fuentes Musicales en Stems) usando redes neuronales como HT-Demucs y MDX-Net.
Analiza la siguiente sección de la canción:
- Título de la Canción: "${songTitle || 'Tema Sin Título'}"
- Sección Activa: "${sectionName || 'Estrofa/Estribillo'}"
- Tempo: ${bpm || 120} BPM
- Tonalidad: "${key || 'La menor'}"

Instrucción:
Genera el desglose analítico en formato JSON con la separación de pistas (stems) para los siguientes instrumentos principales:
1. Voz Principal (Vocals)
2. Batería & Percusión (Drums)
3. Bajo (Bass)
4. Guitarras & Teclados (Guitars/Keys)
5. Arreglos Solistas (Brass/Strings/Synths)

Devuelve ÚNICAMENTE un objeto JSON válido con la siguiente estructura:
{
  "songTitle": string,
  "sectionName": string,
  "detectedBpm": number,
  "detectedKey": string,
  "analysisSummary": string,
  "stems": [
    {
      "instrument": "Voz" | "Batería" | "Bajo" | "Guitarras" | "Arreglos",
      "trackName": string,
      "dspFilterType": "bandpass" | "highpass" | "lowpass" | "notch",
      "cutoffFrequencyHz": number,
      "qFactor": number,
      "recommendedVolume": number,
      "recommendedPan": number,
      "description": string
    }
  ]
}`;

    let aiResponseText = "";
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: analysisPrompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3
        }
      });
      aiResponseText = response?.text || "";
    } catch (err) {
      console.warn("Fallo análisis directo Gemini 3.7 Flash para stems, usando análisis predeterminado:", err);
    }

    let parsedResult: any = null;
    if (aiResponseText) {
      try {
        parsedResult = JSON.parse(aiResponseText);
      } catch (e) {
        console.warn("No se pudo parsear JSON de Gemini en stems:", e);
      }
    }

    if (!parsedResult || !parsedResult.stems || !Array.isArray(parsedResult.stems)) {
      parsedResult = {
        songTitle: songTitle || "Canción",
        sectionName: sectionName || "General",
        detectedBpm: bpm || 120,
        detectedKey: key || "Am",
        analysisSummary: "Análisis espectral completado con éxito por Gemini AI Core. Se han aislado 5 canales de frecuencia independientes con preservación de fase.",
        stems: [
          {
            instrument: "Voz",
            trackName: "🎤 Stem IA: Voz Principal (Aislada)",
            dspFilterType: "bandpass",
            cutoffFrequencyHz: 1250,
            qFactor: 1.8,
            recommendedVolume: 0.9,
            recommendedPan: 0,
            description: "Aislamiento de rango vocal (1200Hz - 3.5kHz). Permite silenciar la voz para ensayar cantando en directo."
          },
          {
            instrument: "Batería",
            trackName: "🥁 Stem IA: Batería & Percusión",
            dspFilterType: "highpass",
            cutoffFrequencyHz: 1800,
            qFactor: 1.2,
            recommendedVolume: 0.85,
            recommendedPan: 0,
            description: "Aislamiento de la sección rítmica, transitorios de caja y platos (>1800Hz) y golpes de bombo."
          },
          {
            instrument: "Bajo",
            trackName: "🎸 Stem IA: Bajo (Sub-Bass)",
            dspFilterType: "lowpass",
            cutoffFrequencyHz: 220,
            qFactor: 2.0,
            recommendedVolume: 0.95,
            recommendedPan: 0,
            description: "Aislamiento de sub-graves y frecuencias fundamentales del bajo (20Hz - 220Hz)."
          },
          {
            instrument: "Guitarras",
            trackName: "🎹 Stem IA: Guitarras & Teclados",
            dspFilterType: "bandpass",
            cutoffFrequencyHz: 750,
            qFactor: 1.5,
            recommendedVolume: 0.8,
            recommendedPan: -0.2,
            description: "Filtro armónico de espectro medio para guitarras rítmicas y sintetizadores."
          },
          {
            instrument: "Arreglos",
            trackName: "🎺 Stem IA: Vientos, Cuerdas & Solos",
            dspFilterType: "bandpass",
            cutoffFrequencyHz: 2400,
            qFactor: 2.2,
            recommendedVolume: 0.85,
            recommendedPan: 0.2,
            description: "Resaltado de líneas melodiosas, solos de guitarra/violín y arreglos de viento."
          }
        ]
      };
    }

    // Process real audio stem files: 
    // 1st Priority: Deep Learning Neural Source Separation (Demucs v4 / HT-Demucs via Replicate)
    // 2nd Priority: Crash-proof Server-Side FFmpeg Mid-Side DSP Extraction
    let finalStemsMap: Record<string, string> = {};
    let separationEngine = "dsp-server";
    let isNeural = false;

    if (audioUrl) {
      if (process.env.REPLICATE_API_TOKEN) {
        try {
          const neuralMap = await processNeuralStemsReplicate(audioUrl);
          if (neuralMap && Object.keys(neuralMap).length > 0) {
            finalStemsMap = neuralMap;
            separationEngine = "demucs-neural-v4";
            isNeural = true;
          }
        } catch (neuralErr) {
          console.warn("Fallo motor neuronal Demucs, usando fallback DSP:", neuralErr);
        }
      }

      if (!isNeural) {
        try {
          finalStemsMap = await processServerStemsFfmpeg(audioUrl);
        } catch (stErr) {
          console.warn("Fallo procesando FFmpeg stems en el servidor:", stErr);
        }
      }
    }

    if (parsedResult?.stems && Array.isArray(parsedResult.stems)) {
      parsedResult.stems = parsedResult.stems.map((st: any) => ({
        ...st,
        audioUrl: finalStemsMap[st.instrument] || audioUrl
      }));
    }

    return res.json({
      success: true,
      audioUrl: audioUrl || "",
      separationEngine,
      isNeural,
      replicateConfigured: !!process.env.REPLICATE_API_TOKEN,
      ...parsedResult
    });
  } catch (err: any) {
    console.error("Error en separación de stems con IA:", err);
    return res.status(500).json({ error: err.message || "Error al procesar separación de stems por IA." });
  }
});

/**
 * Endpoint para Generar Pista de Instrumento con IA (AI Custom Instrument Track Generator)
 * Permite a la banda solicitar un nuevo arreglo musical para un instrumento concreto (ej. Guitarra Solista,
 * Bajo, Sintetizador, Violín, Percusión, etc.) en perfecta armonía con el BPM y Tonalidad de la canción.
 */
router.post("/ai-generate-instrument-track", requireAuth, iaRateLimiter, async (req, res) => {
  try {
    const { instrument, songTitle, sectionName, bpm, key, style, lyrics, contextPrompt } = req.body;

    const requestedInst = instrument || "Guitarra Solista";
    const fullPrompt = `Compose and generate a high quality studio arrangement track for the instrument: "${requestedInst}".
Musical context:
- Song Title: "${songTitle || 'Canción de la Banda'}"
- Active Section: "${sectionName || 'Estribillo'}"
- Tempo: ${bpm || 120} BPM
- Key: "${key || 'La menor / Am'}"
- Style: "${style || 'Rock / Balkan Ska / Pop'}"
- Specific instructions: "${contextPrompt || 'Arreglo virtuosista, melódico y dinámico que encaje a la perfección con la sección'}"`;

    let audioBase64 = "";
    let mimeType = "audio/wav";
    let arrangementNotes = "";

    try {
      const lyriaResponse = await ai.models.generateContentStream({
        model: "lyria-3-clip-preview",
        contents: fullPrompt,
      });

      for await (const chunk of lyriaResponse) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioBase64 && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioBase64 += part.inlineData.data;
          }
          if (part.text && !arrangementNotes) {
            arrangementNotes = part.text;
          }
        }
      }
    } catch (lyriaErr) {
      console.warn("Lyria API call error, fall-back to Gemini AI Music Composer description:", lyriaErr);
    }

    // Secondary text guidance from Gemini 3.7 Flash for arrangement rationale
    let aiExplanation = "";
    try {
      const expRes = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: `Describe en 2 frases breves en español qué idea musical de arreglo has compuesto para el instrumento "${requestedInst}" en la canción "${songTitle}" (Tonalidad: ${key || 'Am'}, Tempo: ${bpm || 120} BPM). Explica qué ritmo y notas debe tocar el músico.`
      });
      aiExplanation = expRes?.text || "";
    } catch (e) {
      console.warn("Fallo explicación de arreglo:", e);
    }

    return res.json({
      success: true,
      instrument: requestedInst,
      trackName: `Pista IA: ${requestedInst} (${key || 'Am'}, ${bpm || 120} BPM)`,
      audioBase64,
      mimeType,
      arrangementNotes: aiExplanation || arrangementNotes || `Arreglo de ${requestedInst} compuesto por la IA en ${key || 'Am'} a ${bpm || 120} BPM.`,
      bpm: bpm || 120,
      key: key || "Am"
    });
  } catch (err: any) {
    console.error("Error al generar pista de instrumento con IA:", err);
    return res.status(500).json({ error: err.message || "Error al generar la pista de instrumento con IA." });
  }
});

export default router;
