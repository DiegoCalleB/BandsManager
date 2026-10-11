import React, { useEffect, useRef } from 'react';
import { AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

type Replay = { listo: Promise<number>; ir: (seg: number) => Promise<void> };

// Cada fotograma: la página del deck, tal y como estaba en ese instante del ensayo general (public/replay.js)
export const Pelicula: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const h = delayRender(`fotograma ${frame}`, { timeoutInMilliseconds: 60000 });
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

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <iframe ref={ref} src={staticFile('replay.html')} style={{ width: 1920, height: 1080, border: 0 }} title="Película" />
      <Audio src={staticFile('ensayo/mezcla.wav')} />
    </AbsoluteFill>
  );
};
