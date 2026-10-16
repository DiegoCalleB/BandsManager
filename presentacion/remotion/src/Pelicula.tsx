import React, { useEffect, useRef } from 'react';
import { AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { CameraMotionBlur } from '@remotion/motion-blur';
import { Destello } from './Destello';

export type Props = { ensayo: string; ventanas: [number, number][]; destellos: number[]; borrosa: boolean };
type Replay = { listo: Promise<number>; ir: (seg: number) => Promise<void> };

// Un fotograma: la página del deck tal y como estaba en ese instante del ensayo general (public/replay.js).
// Dentro de CameraMotionBlur el fotograma puede ser fraccionario (varios instantes mezclados, como el obturador de una cámara).
const Escena: React.FC<{ ensayo: string }> = ({ ensayo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const h = delayRender(`fotograma ${frame}`, { timeoutInMilliseconds: 120000 });
    let vivo = true;
    const listo = (): Promise<Replay> =>
      new Promise((res) => {
        const mirar = () => {
          const w = ref.current?.contentWindow as (Window & { Replay?: Replay }) | null | undefined;
          if (w && w.Replay) res(w.Replay);
          else setTimeout(mirar, 30);
        };
        mirar();
      });
    listo()
      .then(async (r) => { await r.listo; if (vivo) await r.ir(frame / fps); })
      .then(() => continueRender(h))
      .catch((e) => { console.error(e); continueRender(h); });
    return () => { vivo = false; };
  }, [frame, fps]);

  return <iframe ref={ref} src={`${staticFile('replay.html')}?e=${ensayo}`} style={{ width: 1920, height: 1080, border: 0, display: 'block' }} title="Película" />;
};

export const Pelicula: React.FC<Props> = ({ ensayo, ventanas, destellos, borrosa }) => {
  const t = useCurrentFrame() / useVideoConfig().fps;
  const enMovimiento = borrosa && ventanas.some(([a, b]) => t >= a && t <= b);
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* una sola muestra fuera de las ventanas (el mismo iframe sigue vivo) y ocho dentro: obturador de 270° */}
      <CameraMotionBlur samples={enMovimiento ? 8 : 1} shutterAngle={270}>
        <Escena ensayo={ensayo} />
      </CameraMotionBlur>
      {destellos.filter((d) => Math.abs(t - d) < 2).map((d, k) => <Destello key={d} centro={d} semilla={k} />)}
      <Audio src={staticFile(`${ensayo}/mezcla.wav`)} />
    </AbsoluteFill>
  );
};
