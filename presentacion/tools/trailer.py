#!/usr/bin/env python3
"""Monta el tráiler (horizontal, 1920x1080) y el teaser vertical (1080x1920) a partir de un MP4 de la película.

Uso:  python3 presentacion/tools/trailer.py <pelicula.mp4> <cortes.json> <salida.mp4> [--vertical rotulos.png]
cortes.json: [{"ini": 12.3, "fin": 17.0, "voz": true, "paso": "fundido"}, …]
  · ini/fin en segundos del MP4 de origen; se ajustan solos a la pausa más cercana entre frases (±0,6 s) para no cortar palabras
    (con "exacto": true, no se tocan)
  · voz: false → el plano va sin su sonido (solo música); útil para los montajes rápidos
  · rotulo: PNG que se ve encima mientras dura ese plano: en vertical, transparente de 1080x1920 (p. ej. el subtítulo en grande);
    en horizontal, de 1920x1080 (p. ej. para cambiar un rótulo de la película sin volver a grabarla)
  · paso: cómo se entra en el plano: "corte" (seco), "fundido" (0,25 s), "negro" (fundido a negro, 0,5 s), "rampa" (barrido rápido)
La música («Cabalga o Lóstrego») va debajo de todo y baja sola cuando hablan (compresión con cadena lateral).
Con --vertical, el resultado es 1080x1920: el plano en el centro, el mismo plano desenfocado de fondo y los rótulos
de la imagen PNG (transparente, 1080x1920) encima. Necesita ffmpeg y numpy.

Los de la entrega (sobre el corte de 5 min exportado con GATE=gateCorto RES=1080):
  python3 presentacion/tools/trailer.py corte_1080.mp4 presentacion/tools/trailer/cortes_60s.json trailer_60s.mp4
  python3 presentacion/tools/trailer.py corte_1080.mp4 presentacion/tools/trailer/cortes_vertical.json teaser.mp4 --vertical presentacion/tools/trailer/rotulos.png
Los tiempos de cortes_*.json son los de ese MP4: si cambia la película, hay que revisarlos (los rótulos PNG salen de rotulos.html y subs.html).
"""
import json
import os
import subprocess
import sys
import tempfile

import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
MUSICA = os.path.join(AQUI, '..', 'audio', 'musica', 'lostrego.mp3')
SR = 16000


def voz_envolvente(src):
    """Energía en la banda de la voz (300-3400 Hz), 100 valores por segundo."""
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-af', 'highpass=f=300,lowpass=f=3400', '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'],
                         capture_output=True).stdout
    x = np.frombuffer(raw, np.float32)
    n = len(x) // (SR // 100)
    return np.sqrt((x[:n * (SR // 100)].reshape(n, -1) ** 2).mean(axis=1))


def ajustar(env, t, margen=0.6):
    """El instante más silencioso cerca de t (para no cortar a media palabra)."""
    a, b = max(0, int((t - margen) * 100)), min(len(env) - 1, int((t + margen) * 100))
    if b <= a:
        return t
    suave = np.convolve(env, np.ones(9) / 9, mode='same')
    k = a + int(np.argmin(suave[a:b]))
    return k / 100


def main():
    src, edl_f, salida = sys.argv[1:4]
    vertical = sys.argv[sys.argv.index('--vertical') + 1] if '--vertical' in sys.argv else None
    edl = json.load(open(edl_f, encoding='utf-8'))
    for c in edl:  # los rótulos se buscan junto a la lista de cortes
        if c.get('rotulo') and not os.path.isabs(c['rotulo']):
            c['rotulo'] = os.path.join(os.path.dirname(os.path.abspath(edl_f)), c['rotulo'])
    env = voz_envolvente(src)
    with tempfile.TemporaryDirectory() as tmp:
        trozos = []
        for k, c in enumerate(edl):
            ini, fin = (c['ini'], c['fin']) if c.get('exacto') else (ajustar(env, c['ini']), ajustar(env, c['fin']))
            f = os.path.join(tmp, f't{k:02d}.mp4')
            af = 'anull' if c.get('voz', True) else 'volume=0'
            subprocess.check_call(['ffmpeg', '-v', 'error', '-y', '-ss', f'{ini:.2f}', '-to', f'{fin:.2f}', '-i', src,
                                   '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p',
                                   '-af', f'{af},aresample=48000', '-ac', '2', '-c:v', 'libx264', '-crf', '16', '-preset', 'fast', '-c:a', 'pcm_s16le', f.replace('.mp4', '.mov')])
            trozos.append((f.replace('.mp4', '.mov'), fin - ini, c.get('paso', 'fundido')))
            print(f'  plano {k + 1}: {ini:7.2f} → {fin:7.2f}  ({fin - ini:4.1f} s)  {c.get("paso", "fundido")}{"" if c.get("voz", True) else " · sin voz"}')
        # encadenar: xfade para la imagen y acrossfade para el sonido, con la duración de cada paso
        DUR = {'corte': 0.04, 'fundido': 0.25, 'negro': 0.5, 'rampa': 0.3}
        TIPO = {'corte': 'fade', 'fundido': 'fade', 'negro': 'fadeblack', 'rampa': 'smoothleft'}
        ins, fv, fa = [], [], []
        for f, _, _ in trozos:
            ins += ['-i', f]
        v_prev, a_prev, t_acum = '0:v', '0:a', trozos[0][1]
        inicios = [0.0]
        for k in range(1, len(trozos)):
            paso = trozos[k][2]
            d = DUR.get(paso, 0.25)
            off = t_acum - d
            fv.append(f'[{v_prev}][{k}:v]xfade=transition={TIPO.get(paso, "fade")}:duration={d}:offset={off:.3f}[v{k}]')
            fa.append(f'[{a_prev}][{k}:a]acrossfade=d={d}[a{k}]')
            inicios.append(off)
            v_prev, a_prev, t_acum = f'v{k}', f'a{k}', t_acum + trozos[k][1] - d
        total = t_acum
        fin_f = max(0.0, total - 1.4)
        # música debajo, que baja cuando hablan; todo se funde a negro al final
        fv.append(f'[{v_prev}]fade=t=out:st={fin_f:.2f}:d=1.4[vf]')
        fa.append(f'[{len(trozos)}:a]atrim=0:{total:.2f},afade=t=in:d=0.6,afade=t=out:st={fin_f:.2f}:d=1.4,volume=0.55[mus]')
        fa.append(f'[{a_prev}]asplit=2[dlg][sc]')
        fa.append('[mus][sc]sidechaincompress=threshold=0.02:ratio=9:attack=15:release=450:makeup=1[musd]')
        fa.append(f'[dlg][musd]amix=inputs=2:normalize=0,acompressor=threshold=0.2:ratio=4:attack=4:release=250:makeup=1.4,alimiter=limit=0.7,afade=t=out:st={fin_f:.2f}:d=1.4,loudnorm=I=-14:TP=-1.5:LRA=9[af]')
        cmd = ['ffmpeg', '-v', 'error', '-y', *ins, '-stream_loop', '-1', '-i', MUSICA]
        if vertical:
            cmd += ['-i', vertical]
            n = len(trozos) + 1
            fv.append('[vf]split=2[fondo][frente]')
            fv.append('[fondo]scale=-2:1920,crop=1080:1920,gblur=sigma=40,eq=brightness=-0.18[bg]')
            fv.append('[frente]scale=1080:-2[fg]')
            fv.append(f'[bg][fg]overlay=0:(H-h)/2[vv]')
            ult, m = '[vv]', n
            for k, c in enumerate(edl):  # rótulos grandes de cada plano (los subtítulos de la película se quedan pequeños en el móvil)
                if c.get('rotulo'):
                    m += 1
                    cmd += ['-i', c['rotulo']]
                    a, b = inicios[k] + 0.1, (inicios[k + 1] + 0.1 if k + 1 < len(inicios) else total)
                    fv.append(f"{ult}[{m}:v]overlay=0:0:enable='between(t,{a:.2f},{b:.2f})'[r{k}]")
                    ult = f'[r{k}]'
            fv.append(f'{ult}[{n}:v]overlay=0:0,format=yuv420p[vout]')
        else:
            ult, m = '[vf]', len(trozos)
            for k, c in enumerate(edl):  # rótulo a pantalla completa sobre un plano (con su sonido original)
                if c.get('rotulo'):
                    m += 1
                    cmd += ['-i', c['rotulo']]
                    a, b = inicios[k] + 0.05, (inicios[k + 1] + 0.3 if k + 1 < len(inicios) else total)
                    fv.append(f"[{m}:v]scale=1920:1080[rh{k}];{ult}[rh{k}]overlay=0:0:enable='between(t,{a:.2f},{b:.2f})'[r{k}]")
                    ult = f'[r{k}]'
            fv.append(f'{ult}format=yuv420p[vout]')
        cmd += ['-filter_complex', ';'.join(fv + fa), '-map', '[vout]', '-map', '[af]', '-c:v', 'libx264', '-crf', '19', '-preset', 'slow',
                '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-t', f'{total:.2f}', salida]
        subprocess.check_call(cmd)
    print(f'{salida}: {total:.1f} s · {os.path.getsize(salida) / 1048576:.1f} MB')


if __name__ == '__main__':
    main()
