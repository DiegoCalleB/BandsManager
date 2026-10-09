import React, { useEffect, useRef } from 'react';

/**
 * Forma de onda en vivo del micrófono para la grabación estilo Cubase: pinta una barra por
 * fotograma a partir del analizador de la señal y libera todos los nodos de audio al desmontar.
 */
export const LiveMicWaveformCanvas: React.FC<{
  stream: MediaStream | null;
  audioCtx: AudioContext | null;
  isRecording: boolean;
  color?: string;
  height?: number;
}> = ({ stream, audioCtx, isRecording, color = '#ef4444', height = 48 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isRecording || !stream) return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let ctxToUse = audioCtx;
    let createdLocalCtx = false;
    if (!ctxToUse || ctxToUse.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        ctxToUse = new AudioCtxClass();
        createdLocalCtx = true;
      }
    }
    if (!ctxToUse) return;

    let sourceNode: MediaStreamAudioSourceNode | null = null;
    let analyserNode: AnalyserNode | null = null;

    try {
      sourceNode = ctxToUse.createMediaStreamSource(stream);
      analyserNode = ctxToUse.createAnalyser();
      analyserNode.fftSize = 128;
      sourceNode.connect(analyserNode);
    } catch (e) {
      console.warn('LiveMicWaveformCanvas setup error:', e);
      return;
    }

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const historyBars: number[] = [];
    const maxBars = 100;

    const draw = () => {
      if (!canvas || !ctx || !analyserNode) return;
      const width = (canvas.width = canvas.offsetWidth || 300);
      const ch = (canvas.height = canvas.offsetHeight || height);

      analyserNode.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const avg = sum / bufferLength;
      const normVal = Math.min(1, avg / 120);

      historyBars.push(normVal);
      if (historyBars.length > maxBars) {
        historyBars.shift();
      }

      ctx.clearRect(0, 0, width, ch);

      // Grid background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 0, width, ch);

      const barWidth = width / maxBars;
      const centerY = ch / 2;

      for (let i = 0; i < historyBars.length; i++) {
        const val = historyBars[i];
        const barH = Math.max(3, val * (ch - 6));
        const x = i * barWidth;
        const y = centerY - barH / 2;

        const isCurrentPoint = i === historyBars.length - 1;
        ctx.fillStyle = isCurrentPoint ? '#ffffff' : val > 0.6 ? 'var(--acc)' : color;
        ctx.fillRect(x, y, Math.max(1.5, barWidth - 1), barH);
      }

      // Live recording line cursor
      const currentX = (historyBars.length / maxBars) * width;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(currentX, 0);
      ctx.lineTo(currentX, ch);
      ctx.stroke();

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animId) cancelAnimationFrame(animId);
      try {
        sourceNode?.disconnect();
      } catch {}
      try {
        analyserNode?.disconnect();
      } catch {}
      if (createdLocalCtx && ctxToUse) {
        try {
          ctxToUse.close();
        } catch {}
      }
    };
  }, [isRecording, stream, audioCtx, color, height]);

  return <canvas ref={canvasRef} className="w-full h-full block rounded bg-[var(--sunken)]" />;
};
