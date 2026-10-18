/**
 * FFmpeg con el binario de `ffmpeg-static` ya configurado. Todos los módulos de IA musical lo
 * importan de aquí para que la ruta del binario se fije una sola vez, antes de su primer uso.
 */
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

export default ffmpeg;
