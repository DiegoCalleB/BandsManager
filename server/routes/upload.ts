import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "../state.js";
import { getTargetBandId, puedeEscribirEnBanda, bandaSolicitada } from "../utils/bandAccess.js";

/**
 * Sub-carpeta pedida por el cliente, saneada. Cuelga siempre de la carpeta de la banda: se
 * limpia tramo a tramo para que no haya forma de subir de nivel ni de saltar a otra rama.
 */
export function subcarpetaSegura(folder: unknown): string {
  if (typeof folder !== "string") return "";
  return folder
    .split("/")
    .map((tramo) => tramo.trim())
    // Los tramos de subir de nivel se descartan ANTES de limpiar caracteres: si no, ".." se
    // convierte en "--" y pasa el filtro como si fuera un nombre de carpeta cualquiera.
    .filter((tramo) => tramo && tramo !== "." && tramo !== "..")
    .map((tramo) => tramo.toLowerCase().replace(/[^a-z0-9_-]/g, "-"))
    .filter((tramo) => tramo.replace(/-/g, ""))
    .slice(0, 4)
    .join("/");
}

const router = express.Router();
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Antes no había ninguna lista de extensiones/tipos permitidos: se aceptaba cualquier archivo,
// con el Content-Type que el propio cliente declarara en el multipart/form-data. Un .svg o .html
// subido así se sirve luego (por extensión) como image/svg+xml o text/html tanto por
// express.static como por Supabase Storage, ejecutando cualquier <script> que contenga en el
// navegador de quien abra la URL — XSS almacenado. Solo se permiten los tipos que la app
// realmente usa (audio, imagen, PDF, documentos), nunca HTML/SVG/JS.
export const EXTENSIONES_PERMITIDAS = new Set([
  // Audio
  'mp3', 'wav', 'm4a', 'flac', 'ogg', 'aac', 'wma', 'aiff', 'aif', 'alac', 'opus',
  // Imagen (sin svg: es HTML/JS ejecutable disfrazado de imagen)
  'jpg', 'jpeg', 'png', 'webp', 'gif',
  // Vídeo
  'mp4', 'mov', 'webm', 'mkv', 'avi',
  // Documentos
  'pdf', 'doc', 'docx'
]);

export function extensionPermitida(originalname: string): boolean {
  if (!originalname || typeof originalname !== 'string') return false;
  const ext = path.extname(originalname).slice(1).toLowerCase();
  return EXTENSIONES_PERMITIDAS.has(ext);
}

const multerFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (!extensionPermitida(file.originalname)) {
    return cb(new Error('Tipo de archivo no permitido.'));
  }
  cb(null, true);
};

const multerChunkFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const original = file.originalname || '';
  // Strips chunk extensions like .part0, .part1, .part
  const strippedPart = original.replace(/\.part\d*$/i, '');
  const bodyFilename = req.body?.filename || '';

  if (
    extensionPermitida(original) ||
    extensionPermitida(strippedPart) ||
    (bodyFilename && extensionPermitida(bodyFilename)) ||
    original.endsWith('.bin') ||
    original.endsWith('.part')
  ) {
    return cb(null, true);
  }
  return cb(new Error('Tipo de archivo no permitido.'));
};

// Multer storage engine for direct binary disk streaming (handles files > 1GB)
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const baseNameSanitized = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
    const uniqueName = `${crypto.randomUUID()}${baseNameSanitized ? '-' + baseNameSanitized : ''}${ext}`;
    cb(null, uniqueName);
  }
});

const uploadMiddleware = multer({
  storage: multerStorage,
  limits: { fileSize: 4 * 1024 * 1024 * 1024 }, // 4GB max
  fileFilter: multerFileFilter
});

const multerChunkStorage = multer.memoryStorage();
const uploadChunkMiddleware = multer({
  storage: multerChunkStorage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB per chunk limit
  fileFilter: multerChunkFileFilter
});

// Sin este envoltorio, un fileFilter rechazado llega a next(err) y responde con la página de
// error genérica de Express en vez de un JSON limpio.
function conManejoDeErrorMulter(mw: express.RequestHandler): express.RequestHandler {
  return (req, res, next) => {
    mw(req, res, (err: any) => {
      if (err) {
        return res.status(400).json({ error: err.message || "No se pudo procesar el archivo." });
      }
      next();
    });
  };
}

export function getSupabaseClient() {
  // Antes, sin SUPABASE_URL en el entorno, caía en silencio en el proyecto de Supabase personal
  // del fundador del proyecto (ver la misma nota en server/db/core.ts).
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  // Favor JWT formatted keys (starts with eyJ) if available
  const keys = [
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_ANON_KEY,
    process.env.SUPABASE_KEY,
    process.env.VITE_SUPABASE_ANON_KEY
  ].filter(Boolean) as string[];

  const jwtKey = keys.find(k => k.startsWith("eyJ")) || keys[0];

  if (url && jwtKey) {
    try {
      return createClient(url, jwtKey);
    } catch (e) {
      console.error("Error initializing Supabase client:", e);
    }
  }
  return null;
}

export function getBucketName() {
  const envBucket = process.env.SUPABASE_STORAGE_BUCKET;
  if (!envBucket || envBucket.length > 25) {
    return "band-media";
  }
  return envBucket;
}

// requireAuth: este diagnóstico sube un fichero al bucket y devuelve el nombre del bucket y el
// detalle del error de Supabase si falla. No es algo que deba contestar a cualquiera.
router.get("/test-supabase", requireAuth, async (req, res) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.json({ success: false, message: "No se pudo inicializar el cliente de Supabase (faltan claves)." });
  }

  const bucketName = getBucketName();
  const testBuffer = Buffer.from("test connection " + Date.now());
  const testPath = `diagnostics/test-${Date.now()}.txt`;

  try {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testPath, testBuffer, { contentType: "text/plain", upsert: true });

    if (uploadError) {
      return res.json({
        success: false,
        bucket: bucketName,
        error: uploadError.message,
        details: uploadError.message.includes("row-level security")
          ? "Es necesario añadir la política RLS en Supabase Storage (INSERT / SELECT para la tabla/bucket 'band-media')."
          : uploadError.message
      });
    }

    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(testPath);
    await supabase.storage.from(bucketName).remove([testPath]);

    return res.json({
      success: true,
      bucket: bucketName,
      message: "¡Conexión y subida a Supabase exitosas!",
      publicUrl: publicUrlData?.publicUrl
    });
  } catch (err: any) {
    return res.json({ success: false, error: err.message || String(err) });
  }
});

router.post("/", requireAuth, conManejoDeErrorMulter(uploadMiddleware.single("file")), async (req: any, res: any) => {
  try {
    let filePath = "";
    let originalFilename = "";
    let uniqueName = "";
    let mimeType = "application/octet-stream";
    let buffer: Buffer | null = null;

    const { category, folder, filename: bodyFilename, base64 } = req.body || {};

    const bandaPedida = bandaSolicitada(req);
    if (bandaPedida && !puedeEscribirEnBanda(req, bandaPedida)) {
      return res.status(403).json({ error: "No tienes acceso a esta banda." });
    }

    if (req.file) {
      // Direct binary disk streaming via Multer (handles large 1GB+ files cleanly without memory overload)
      filePath = req.file.path;
      uniqueName = req.file.filename;
      originalFilename = req.file.originalname;
      mimeType = req.file.mimetype || 'application/octet-stream';
    } else if (base64) {
      originalFilename = bodyFilename || "file.bin";
      // Esta rama (subida por base64) no pasa por el fileFilter de Multer: necesita su propia
      // comprobación de extensión permitida.
      if (!extensionPermitida(originalFilename)) {
        return res.status(400).json({ error: "Tipo de archivo no permitido." });
      }
      const ext = path.extname(originalFilename) || '';
      const baseNameSanitized = path.basename(originalFilename, ext).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
      uniqueName = `${crypto.randomUUID()}${baseNameSanitized ? '-' + baseNameSanitized : ''}${ext}`;
      filePath = path.join(UPLOAD_DIR, uniqueName);

      const match = base64.match(/^data:([A-Za-z-+\/]+);base64,/);
      mimeType = match ? match[1] : 'application/octet-stream';
      const base64Data = base64.replace(/^data:([A-Za-z-+\/]+);base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filePath, buffer);
    } else {
      return res.status(400).json({ error: "Missing file or base64 payload" });
    }

    let finalUrl = `/uploads/${uniqueName}`;
    let storageEngine = "local";

    // Attempt Supabase Storage upload if credentials are environment-configured
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const bucketName = getBucketName();
        // La banda salía del body o de la cabecera sin validar, así que se podían dejar ficheros
        // en la carpeta de otra banda. Y el `folder` del cliente se usaba TAL CUAL como ruta
        // dentro del bucket, con upsert activado: valía para escribir en cualquier rama, encima
        // de los ficheros de quien fuera. Ahora todo cuelga de la carpeta de la banda propia.
        const targetBand = getTargetBandId(req);
        const cleanBandId = String(targetBand).toLowerCase().replace(/[^a-z0-9_-]/g, '-');
        const cleanCategory = category ? String(category).toLowerCase().replace(/[^a-z0-9_-]/g, '-') : 'general';
        const rama = subcarpetaSegura(folder) || cleanCategory;
        const subPath = `bandas/${cleanBandId}/${rama}`;
        
        const storagePath = `${subPath}/${uniqueName}`;
        const fileContent = buffer || fs.readFileSync(filePath);
        
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(storagePath, fileContent, {
            contentType: mimeType,
            upsert: true
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(storagePath);

          if (publicUrlData?.publicUrl) {
            finalUrl = publicUrlData.publicUrl;
            storageEngine = "supabase";
          }
        } else {
          console.warn("Supabase upload notice (using local storage fallback):", uploadError.message);
        }
      } catch (sbErr) {
        console.warn("Supabase Storage error (fallback to local):", sbErr);
      }
    }

    res.json({
      url: finalUrl,
      filePath: filePath,
      filename: uniqueName,
      originalName: originalFilename,
      storage: storageEngine
    });
  } catch (error: any) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: error.message || "Failed to upload file" });
  }
});

// Route for Chunked File Upload (bypasses 32MB single request limit for 1GB+ files)
router.post("/chunk", requireAuth, conManejoDeErrorMulter(uploadChunkMiddleware.single("chunk")), async (req: any, res: any) => {
  try {
    const { uploadId, chunkIndex, totalChunks, filename, folder } = req.body || {};
    if (!uploadId || chunkIndex === undefined || !totalChunks || !filename) {
      return res.status(400).json({ error: "Missing required chunk metadata (uploadId, chunkIndex, totalChunks, filename)" });
    }

    const bandaPedida = bandaSolicitada(req);
    if (bandaPedida && !puedeEscribirEnBanda(req, bandaPedida)) {
      return res.status(403).json({ error: "No tienes acceso a esta banda." });
    }

    if (!extensionPermitida(filename)) {
      return res.status(400).json({ error: "Tipo de archivo no permitido." });
    }

    const cIdx = parseInt(chunkIndex, 10);
    const tChunks = parseInt(totalChunks, 10);

    const tempChunkDir = path.join(UPLOAD_DIR, "chunks", String(uploadId).replace(/[^a-zA-Z0-9_-]/g, ''));
    if (!fs.existsSync(tempChunkDir)) {
      fs.mkdirSync(tempChunkDir, { recursive: true });
    }

    const chunkFilePath = path.join(tempChunkDir, `chunk_${cIdx}`);
    if (req.file) {
      fs.writeFileSync(chunkFilePath, req.file.buffer);
    } else {
      return res.status(400).json({ error: "No chunk file received" });
    }

    // Check how many chunks have arrived
    const uploadedChunks = fs.readdirSync(tempChunkDir).filter(f => f.startsWith("chunk_"));
    if (uploadedChunks.length < tChunks) {
      return res.json({
        success: true,
        completed: false,
        receivedChunk: cIdx,
        totalChunks: tChunks,
        progress: Math.round((uploadedChunks.length / tChunks) * 100)
      });
    }

    // Reassemble all chunks in numerical order
    const ext = path.extname(filename) || '';
    const baseNameSanitized = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
    const uniqueName = `${crypto.randomUUID()}${baseNameSanitized ? '-' + baseNameSanitized : ''}${ext}`;
    const finalFilePath = path.join(UPLOAD_DIR, uniqueName);

    const writeStream = fs.createWriteStream(finalFilePath);
    for (let i = 0; i < tChunks; i++) {
      const cFile = path.join(tempChunkDir, `chunk_${i}`);
      if (!fs.existsSync(cFile)) {
        writeStream.close();
        return res.status(400).json({ error: `Falta el fragmento ${i} durante el reensamblado.` });
      }
      const buffer = fs.readFileSync(cFile);
      writeStream.write(buffer);
    }
    
    await new Promise<void>((resolve, reject) => {
      writeStream.end(() => resolve());
      writeStream.on("error", (err) => reject(err));
    });

    // Clean up temporary chunk folder
    try {
      fs.rmSync(tempChunkDir, { recursive: true, force: true });
    } catch (e) {
      console.warn("Chunk cleanup notice:", e);
    }

    const finalUrl = `/uploads/${uniqueName}`;

    return res.json({
      success: true,
      completed: true,
      url: finalUrl,
      filePath: finalFilePath,
      filename: uniqueName,
      originalName: filename,
      storage: "local"
    });
  } catch (err: any) {
    console.error("Error processing file chunk:", err);
    res.status(500).json({ error: err.message || "Failed to process chunk" });
  }
});

export default router;
