import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { uploadToSupabaseIfAvailable } from '../utils/storage.js';
import { esUrlExternaSegura } from '../utils/ssrfGuard.js';

const execFileAsync = promisify(execFile);

async function downloadAudioBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    function fetchUrl(targetUrl: string, redirects = 0) {
      if (redirects > 5) {
        return reject(new Error('Demasiados redireccionamientos al descargar el audio'));
      }
      const client = targetUrl.startsWith('https') ? https : http;
      const req = client.get(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*'
        },
        rejectUnauthorized: false
      }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const redirectUrl = new URL(res.headers.location, targetUrl).toString();
          return fetchUrl(redirectUrl, redirects + 1);
        }
        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`Fallo al descargar audio: HTTP ${res.statusCode}`));
        }
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', (err) => reject(err));
      });
      req.on('error', (err) => reject(err));
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('Tiempo de espera agotado al descargar el audio'));
      });
    }
    fetchUrl(url);
  });
}

interface TransposeRequest {
  songId: string;
  audioUrl?: string;
  audioBase64?: string;
  semitones: number;
  bandId?: string;
}

let cachedPythonExec: string | null = null;

async function getPythonExecutable(): Promise<string | null> {
  if (cachedPythonExec) return cachedPythonExec;

  const candidates = process.platform === 'win32'
    ? ['python', 'py', 'python3']
    : ['python3', 'python', 'python3.11', '/nix/var/nix/profiles/default/bin/python3', '/root/.nix-profile/bin/python3', '/usr/bin/python3', '/usr/local/bin/python3'];

  for (const cmd of candidates) {
    try {
      const { stdout } = await execFileAsync(cmd, ['-c', 'import pedalboard; print("OK")']);
      if (stdout.includes('OK')) {
        cachedPythonExec = cmd;
        console.log(`[AudioTransposeService] Utilizando entorno Python con Pedalboard: "${cmd}"`);
        return cmd;
      }
    } catch {
      // candidate failed or pedalboard not installed in candidate environment
    }
  }

  for (const cmd of candidates) {
    try {
      await execFileAsync(cmd, ['--version']);
      cachedPythonExec = cmd;
      console.log(`[AudioTransposeService] Encontrado ejecutable Python (sin pedalboard): "${cmd}"`);
      return cmd;
    } catch {
      // candidate executable not found
    }
  }

  console.warn('[AudioTransposeService] No se encontró ningún ejecutable de Python en PATH ni en las rutas Nix/Linux.');
  return null;
}

export async function processAudioTransposition({
  songId,
  audioUrl,
  audioBase64,
  semitones,
  bandId = 'default-band'
}: TransposeRequest): Promise<{ success: boolean; transposedUrl?: string; error?: string }> {
  if (semitones === 0) {
    return { success: true, transposedUrl: audioUrl };
  }

  if (!audioUrl && !audioBase64) {
    return { success: false, error: 'No se proporcionó audioUrl ni audioBase64' };
  }

  // Normalizar identificadores seguros
  const safeSongId = String(songId || 'song').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeBandId = String(bandId || 'band').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeSongId}_st${semitones > 0 ? `+${semitones}` : semitones}.mp3`;
  
  // Rutas públicas y temporales
  const publicDir = path.join(process.cwd(), 'public', 'transposed');
  const localOutputPath = path.join(publicDir, filename);
  const publicLocalUrl = `/transposed/${filename}`;
  const supabaseStoragePath = `transposed/${safeBandId}/${filename}`;

  // 1. Si ya existe en disco local, devolver la URL local
  if (fs.existsSync(localOutputPath)) {
    console.log(`[AudioTransposeService] Servido desde caché local: ${publicLocalUrl}`);
    return { success: true, transposedUrl: publicLocalUrl };
  }

  // Asegurar directorio public/transposed
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const tempInputDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tempInputDir)) {
    fs.mkdirSync(tempInputDir, { recursive: true });
  }
  const tempInputPath = path.join(tempInputDir, `input_${Date.now()}_${safeSongId}.mp3`);

  try {
    // 2. Extraer el Buffer del audio original
    let audioBuffer: Buffer;

    if (audioBase64 || audioUrl?.startsWith('data:')) {
      const src = audioBase64 || audioUrl || '';
      const base64Data = src.includes(',') ? src.split(',')[1] : src;
      audioBuffer = Buffer.from(base64Data, 'base64');
    } else if (audioUrl && (audioUrl.startsWith('/uploads/') || audioUrl.startsWith('/transposed/'))) {
      const localSrc = path.join(process.cwd(), 'public', audioUrl.replace(/^\//, ''));
      if (!fs.existsSync(localSrc)) {
        throw new Error(`Archivo fuente local no encontrado: ${localSrc}`);
      }
      audioBuffer = fs.readFileSync(localSrc);
    } else if (audioUrl) {
      if (!esUrlExternaSegura(audioUrl)) {
        throw new Error('URL de audio no válida o insegura');
      }
      audioBuffer = await downloadAudioBuffer(audioUrl);
    } else {
      throw new Error('No hay fuente de audio válida');
    }

    fs.writeFileSync(tempInputPath, audioBuffer);

    // 3. Invocar script de Python con Spotify Pedalboard
    const scriptPath = path.join(process.cwd(), 'server', 'services', 'transpose_audio.py');
    const pythonExec = await getPythonExecutable();

    if (!pythonExec) {
      throw new Error('El entorno de Python 3 no está disponible en el servidor.');
    }

    console.log(`[AudioTransposeService] Ejecutando Pedalboard DSP (${pythonExec}): ${scriptPath} --semitones ${semitones}`);

    const { stdout, stderr } = await execFileAsync(pythonExec, [
      scriptPath,
      '--input', tempInputPath,
      '--output', localOutputPath,
      '--semitones', String(semitones)
    ]);

    if (stderr && !fs.existsSync(localOutputPath)) {
      console.error('[AudioTransposeService Python Stderr]:', stderr);
      throw new Error(`Error en Pedalboard: ${stderr}`);
    }

    console.log('[AudioTransposeService Python Stdout]:', stdout || 'OK');

    // 4. Intentar subir a Supabase Storage para persistencia
    const supabaseUrl = await uploadToSupabaseIfAvailable(localOutputPath, supabaseStoragePath, 'audio/mpeg');
    const finalUrl = supabaseUrl || publicLocalUrl;

    return { success: true, transposedUrl: finalUrl };
  } catch (err: any) {
    console.error('[AudioTransposeService Error]:', err.message || err);
    return { success: false, error: err.message || 'Error al procesar trasposición DSP' };
  } finally {
    // Limpieza de archivos temporales
    if (fs.existsSync(tempInputPath)) {
      try {
        fs.unlinkSync(tempInputPath);
      } catch {
        // ignore
      }
    }
  }
}
