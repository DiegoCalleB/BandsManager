import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from "multer";
import ffmpeg from "fluent-ffmpeg";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "../state.js";
import { getTargetBandId, puedeEscribirEnBanda, bandaSolicitada } from "../utils/bandAccess.js";

export function detectMimeType(ext: string, fallback?: string): string {
  const cleanExt = (ext || '').toLowerCase().replace('.', '');
  const mimeMap: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    m4a: 'audio/x-m4a',
    ogg: 'audio/ogg',
    aac: 'audio/aac',
    flac: 'audio/flac',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    webm: 'video/webm'
  };
  return mimeMap[cleanExt] || (fallback && fallback !== 'application/octet-stream' ? fallback : 'application/octet-stream');
}

/**
 * Optimizador transparente de archivos de audio.
 * Si el usuario sube un archivo de audio (.wav, .flac, .aiff, .m4a, .wma, etc. o mp3 pesado > 2MB),
 * lo recodifica en segundo plano a MP3 de alta fidelidad (256kbps), reduciendo el peso de almacenamiento
 * en Supabase/disco hasta un 93% sin pérdida de calidad auditiva apreciable.
 */
async function compressAudioFileIfNeeded(inputPath: string, fallbackMime?: string): Promise<{ finalPath: string; wasCompressed: boolean; newMime: string; newExt: string }> {
  const ext = path.extname(inputPath).toLowerCase().replace('.', '');
  const isAudioExt = ['wav', 'flac', 'aiff', 'aif', 'alac', 'm4a', 'wma', 'ogg', 'opus'].includes(ext);
  
  if (!fs.existsSync(inputPath)) {
    return { finalPath: inputPath, wasCompressed: false, newMime: detectMimeType(ext, fallbackMime), newExt: ext };
  }

  const stats = fs.statSync(inputPath);
  
  // Si no es un formato de audio pesado o es un mp3 pequeño (< 2MB), no hace falta comprimir
  if (!isAudioExt && (ext !== 'mp3' || stats.size < 2 * 1024 * 1024)) {
    return { finalPath: inputPath, wasCompressed: false, newMime: detectMimeType(ext, fallbackMime), newExt: ext };
  }

  const outputPath = inputPath.replace(new RegExp(`\\.${ext}$`, 'i'), '-opt.mp3');

  try {
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .audioBitrate("256k")
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .run();
    });

    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
      const origMB = (stats.size / 1024 / 1024).toFixed(2);
      const newMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);
      console.log(`[Audio Upload Optimizer] Audio optimizado con éxito: ${inputPath} (${origMB}MB) -> (${newMB}MB)`);

      const finalCompressedPath = inputPath.replace(new RegExp(`\\.${ext}$`, 'i'), '.mp3');
      fs.unlinkSync(inputPath);
      fs.renameSync(outputPath, finalCompressedPath);

      return { finalPath: finalCompressedPath, wasCompressed: true, newMime: 'audio/mpeg', newExt: 'mp3' };
    }
  } catch (err: any) {
    console.warn(`[Audio Upload Optimizer] Aviso al comprimir audio con FFmpeg, usando original:`, err?.message || err);
    if (fs.existsSync(outputPath)) {
      try { fs.unlinkSync(outputPath); } catch (_) {}
    }
  }

  return { finalPath: inputPath, wasCompressed: false, newMime: 'audio/mpeg', newExt: ext };
}

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

/**
 * Validación de Magic Bytes (Firmas Binarias).
 * Comprueba los primeros bytes del búfer para verificar que el contenido binario coincide
 * realmente con el formato declarado por la extensión, impidiendo la subida de scripts ejecutables
 * (.sh, .php, .exe, .html maliciosos) disfrazados con extensiones permitidas.
 */
export function validarMagicBytes(buffer: Buffer, ext: string): boolean {
  if (!buffer || buffer.length === 0) return false;
  const cleanExt = (ext || '').toLowerCase().replace('.', '');
  
  if (buffer.length < 4) return false;

  // JPEG: FF D8 FF
  if (cleanExt === 'jpg' || cleanExt === 'jpeg') {
    return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  }

  // PNG: 89 50 4E 47 (0x89 'PNG')
  if (cleanExt === 'png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  }

  // GIF: 47 49 46 38 ('GIF8')
  if (cleanExt === 'gif') {
    return buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38;
  }

  // WEBP: RIFF....WEBP (bytes 0-3: 'RIFF', bytes 8-11: 'WEBP')
  if (cleanExt === 'webp') {
    if (buffer.length < 12) return false;
    const isRiff = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
    const isWebp = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    return isRiff && isWebp;
  }

  // PDF: 25 50 44 46 ('%PDF')
  if (cleanExt === 'pdf') {
    return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
  }

  // WAV / AIFF: RIFF....WAVE o FORM....AIFF
  if (cleanExt === 'wav' || cleanExt === 'aiff' || cleanExt === 'aif') {
    if (buffer.length < 12) return false;
    const isRiffOrForm = (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) ||
                         (buffer[0] === 0x46 && buffer[1] === 0x4F && buffer[2] === 0x52 && buffer[3] === 0x4D);
    return isRiffOrForm;
  }

  // MP3: 'ID3' (49 44 33) o frame sync MPEG (0xFF seguido de bits de cabecera)
  if (cleanExt === 'mp3') {
    const isId3 = buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33;
    const isMpegSync = buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0;
    return isId3 || isMpegSync;
  }

  // FLAC: 66 4C 61 43 ('fLaC')
  if (cleanExt === 'flac') {
    return buffer[0] === 0x66 && buffer[1] === 0x4C && buffer[2] === 0x61 && buffer[3] === 0x43;
  }

  // OGG / Opus: 4F 67 67 53 ('OggS')
  if (cleanExt === 'ogg' || cleanExt === 'opus') {
    return buffer[0] === 0x4F && buffer[1] === 0x47 && buffer[2] === 0x67 && buffer[3] === 0x53;
  }

  // MP4 / MOV / M4A / AAC: ftyp / moov / ADTS
  if (cleanExt === 'mp4' || cleanExt === 'mov' || cleanExt === 'm4a' || cleanExt === 'aac') {
    if (buffer.length >= 8) {
      const isFtyp = buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70;
      const isMoov = buffer[4] === 0x6D && buffer[5] === 0x6F && buffer[6] === 0x6F && buffer[7] === 0x76;
      const isAdts = buffer[0] === 0xFF && (buffer[1] & 0xF6) === 0xF0;
      if (isFtyp || isMoov || isAdts) return true;
    }
  }

  // WebM / MKV: 1A 45 DF A3 (EBML)
  if (cleanExt === 'webm' || cleanExt === 'mkv' || cleanExt === 'avi') {
    const isEbml = buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3;
    const isRiffAvi = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
    return isEbml || isRiffAvi;
  }

  // DOCX / ZIP: 50 4B 03 04 ('PK\x03\x04')
  if (cleanExt === 'docx') {
    return buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04;
  }

  // DOC: D0 CF 11 E0 (OLE2 Compound Document)
  if (cleanExt === 'doc') {
    return buffer[0] === 0xD0 && buffer[1] === 0xCF && buffer[2] === 0x11 && buffer[3] === 0xE0;
  }

  // Resto de extensiones permitidas
  return EXTENSIONES_PERMITIDAS.has(cleanExt);
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
  // Antes probaba con un .txt (text/plain): si el bucket tiene restringidos los tipos MIME
  // permitidos a solo imágenes (lo normal para "band-media"), esa prueba SIEMPRE falla con
  // "mime type text/plain is not supported" aunque la subida real de logos/fotos funcione
  // perfectamente - un falso positivo que no dice nada del caso real. Se prueba con un PNG
  // mínimo válido (1x1 transparente) para que el diagnóstico responda a lo que de verdad importa.
  const testBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64"
  );
  const testPath = `diagnostics/test-${Date.now()}.png`;

  try {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testPath, testBuffer, { contentType: "image/png", upsert: true });

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

async function listRecursiveStorageFiles(supabase: any, bucketName: string, folder = ""): Promise<Array<{ path: string; size: number }>> {
  const { data: items, error } = await supabase.storage.from(bucketName).list(folder, { limit: 1000 });
  if (error) return [];
  let all: Array<{ path: string; size: number }> = [];
  for (const item of items || []) {
    const itemPath = folder ? `${folder}/${item.name}` : item.name;
    if (!item.id && !item.metadata) {
      const sub = await listRecursiveStorageFiles(supabase, bucketName, itemPath);
      all.push(...sub);
    } else {
      all.push({ path: itemPath, size: item.metadata?.size || 0 });
    }
  }
  return all;
}

const PERMITTED_CLEANUP_KEYWORDS = [
  "ruta", "ruta-66", "ruta_66", "ruta66",
  "bakandeya", "arritmia", "vertice", "vértice",
  "fer_y_dani", "nuevo__lbum"
];

// Endpoint de diagnóstico de almacenamiento en Supabase Storage
router.get("/storage-stats", requireAuth, async (req, res) => {
  // El estado de TODO el bucket es de la plataforma, no de una banda: solo admin.
  if ((req as any).user?.role !== "admin") {
    return res.status(403).json({ error: "Acceso denegado." });
  }
  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(500).json({ error: "No Supabase client available" });
  }

  const bucketName = getBucketName();
  try {
    const files = await listRecursiveStorageFiles(supabase!, bucketName);
    const totalBytes = files.reduce((sum, f) => sum + f.size, 0);

    return res.json({
      success: true,
      bucket: bucketName,
      totalFiles: files.length,
      totalSizeMB: Number((totalBytes / (1024 * 1024)).toFixed(2)),
      allowedBands: ["Ruta 66", "Bakandeya", "Arritmia", "Vértice"]
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// Endpoint para ejecutar la limpieza de multimedia no perteneciente a las 4 bandas permitidas
router.post("/cleanup-unused-media", requireAuth, async (req, res) => {
  // Borra del bucket de TODAS las bandas lo que no case con una lista fija de palabras: antes
  // bastaba estar registrado para vaciar el Storage de los demás clientes. Ahora solo el admin
  // de la plataforma, y sin `confirmar: true` únicamente enseña qué borraría (simulacro).
  if ((req as any).user?.role !== "admin") {
    return res.status(403).json({ error: "Acceso denegado." });
  }
  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(500).json({ error: "No Supabase client available" });
  }

  const bucketName = getBucketName();
  try {
    const allFiles = await listRecursiveStorageFiles(supabase!, bucketName);
    const toDelete: string[] = [];
    let deleteBytes = 0;

    allFiles.forEach(f => {
      const pLower = f.path.toLowerCase();
      const isAllowed = PERMITTED_CLEANUP_KEYWORDS.some(kw => pLower.includes(kw));
      if (!isAllowed) {
        toDelete.push(f.path);
        deleteBytes += f.size;
      }
    });

    if (toDelete.length === 0) {
      return res.json({
        success: true,
        message: "No hay multimedia no utilizada para eliminar.",
        freedMB: 0
      });
    }

    if (req.body?.confirmar !== true) {
      return res.json({
        success: true,
        simulacro: true,
        message: "Simulacro: no se ha borrado nada. Repite con { \"confirmar\": true } para eliminar.",
        archivosAEliminar: toDelete.length,
        liberariaMB: Number((deleteBytes / (1024 * 1024)).toFixed(2)),
        ejemplo: toDelete.slice(0, 20)
      });
    }

    // Delete in batches of 100
    const BATCH_SIZE = 100;
    let deletedCount = 0;
    for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
      const batch = toDelete.slice(i, i + BATCH_SIZE);
      const { data, error } = await supabase.storage.from(bucketName).remove(batch);
      if (!error) {
        deletedCount += (data?.length || batch.length);
      }
    }

    const freedMB = Number((deleteBytes / (1024 * 1024)).toFixed(2));

    return res.json({
      success: true,
      message: `Limpieza completada. Se eliminaron ${deletedCount} archivos multimedia.`,
      freedMB,
      deletedFiles: deletedCount
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
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

    // Validación de Magic Bytes (Firmas Binarias) antes del procesamiento o compresión
    const rawExt = path.extname(originalFilename).replace('.', '');
    let headerBytes: Buffer | null = null;
    if (buffer && buffer.length >= 4) {
      headerBytes = buffer.subarray(0, 64);
    } else if (fs.existsSync(filePath)) {
      const fd = fs.openSync(filePath, 'r');
      headerBytes = Buffer.alloc(64);
      const bytesRead = fs.readSync(fd, headerBytes, 0, 64, 0);
      fs.closeSync(fd);
      if (bytesRead < 4) headerBytes = null;
    }

    if (headerBytes && !validarMagicBytes(headerBytes, rawExt)) {
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (_) {}
      }
      return res.status(400).json({ error: "Firma binaria del archivo no válida para el formato declarado (Magic Bytes mismatch)." });
    }

    // Optimizador transparente: si es un audio pesado (.wav, .flac, .m4a, etc.), se comprime a MP3 256k
    const compResult = await compressAudioFileIfNeeded(filePath, mimeType);
    filePath = compResult.finalPath;
    uniqueName = path.basename(filePath);
    mimeType = compResult.newMime || detectMimeType(path.extname(filePath), mimeType);
    buffer = null; // Forzar lectura del archivo optimizado desde disco

    let finalUrl = `/uploads/${uniqueName}`;
    let storageEngine = "local";

    // Attempt Supabase Storage upload if credentials are environment-configured
    const supabase = getSupabaseClient();
    if (supabase) {
      const bucketName = getBucketName();
      const targetBand = getTargetBandId(req);
      const cleanBandId = String(targetBand).toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      const cleanCategory = category ? String(category).toLowerCase().replace(/[^a-z0-9_-]/g, '-') : 'general';
      const rama = subcarpetaSegura(folder) || cleanCategory;
      const subPath = `bandas/${cleanBandId}/${rama}`;
      const storagePath = `${subPath}/${uniqueName}`;
      const fileContent = buffer || fs.readFileSync(filePath);

      let uploadError: any = null;
      for (let attempt = 0; attempt < 2 && storageEngine !== "supabase"; attempt++) {
        try {
          const { error } = await supabase.storage
            .from(bucketName)
            .upload(storagePath, fileContent, { contentType: mimeType, upsert: true });

          if (!error) {
            const { data: publicUrlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(storagePath);

            if (publicUrlData?.publicUrl) {
              finalUrl = publicUrlData.publicUrl;
              storageEngine = "supabase";
            }
          } else {
            uploadError = error;
            if (error.message && (error.message.includes("not found") || error.message.includes("Bucket") || (error as any).statusCode === "404" || (error as any).status === 404)) {
              try {
                await supabase.storage.createBucket(bucketName, { public: true });
              } catch (createErr) {
                console.warn("[Upload] Could not create bucket:", createErr);
              }
            }
          }
        } catch (sbErr) {
          uploadError = sbErr;
        }
      }

      if (storageEngine !== "supabase") {
        console.warn("[Upload] Supabase Storage upload failed, falling back to local file upload:", uploadError?.message || uploadError);
        // Fallback to locally served path so upload never fails for user
        finalUrl = `/uploads/${uniqueName}`;
        storageEngine = "local";
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

    // Validar Magic Bytes sobre el archivo reensamblado
    const rawChunkExt = path.extname(filename).replace('.', '');
    const headerChunkBytes = Buffer.alloc(64);
    const fdChunk = fs.openSync(finalFilePath, 'r');
    const bytesReadChunk = fs.readSync(fdChunk, headerChunkBytes, 0, 64, 0);
    fs.closeSync(fdChunk);

    if (bytesReadChunk >= 4 && !validarMagicBytes(headerChunkBytes, rawChunkExt)) {
      try { fs.unlinkSync(finalFilePath); } catch (_) {}
      return res.status(400).json({ error: "Firma binaria del archivo reensamblado no coincide con la extensión declarada." });
    }

    // Clean up temporary chunk folder
    try {
      fs.rmSync(tempChunkDir, { recursive: true, force: true });
    } catch (e) {
      console.warn("Chunk cleanup notice:", e);
    }

    // Optimizador transparente para archivos de audio reensamblados
    const compResult = await compressAudioFileIfNeeded(finalFilePath);
    const effectiveFilePath = compResult.finalPath;
    const effectiveUniqueName = path.basename(effectiveFilePath);

    const finalUrl = `/uploads/${effectiveUniqueName}`;

    return res.json({
      success: true,
      completed: true,
      url: finalUrl,
      filePath: effectiveFilePath,
      filename: effectiveUniqueName,
      originalName: filename,
      storage: "local"
    });
  } catch (err: any) {
    console.error("Error processing file chunk:", err);
    res.status(500).json({ error: err.message || "Failed to process chunk" });
  }
});

export default router;
