import { Config } from '@remotion/cli/config';

// El Chromium de la máquina (no se descarga otro) y una copia de entrega: H.264 de buena calidad
Config.setBrowserExecutable(process.env.REMOTION_CHROME || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell');
Config.setCodec('h264');
Config.setCrf(18);
Config.setPixelFormat('yuv420p');
// El primer fotograma de cada pestaña carga y reproduce todas las notas hasta ese instante: puede tardar
Config.setDelayRenderTimeoutInMilliseconds(240000);
