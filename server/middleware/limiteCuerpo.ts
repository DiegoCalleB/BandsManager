import express from "express";

const guardarCuerpoCrudo = (req: any, _res: any, buf: Buffer) => {
  req.rawBody = buf;
};

/**
 * Tamaño máximo del cuerpo JSON según quién llama. El límite de 50 MB era global: cualquiera, sin
 * iniciar sesión, podía obligar al servidor a bufferizar 50 MB por petición (y a conservar además
 * `rawBody`). Solo quien tiene sesión válida (subidas en base64, estado con imágenes) puede enviar
 * cuerpos grandes; el resto (login, tracking público, webhooks, fans) queda en 1 MB.
 */
export function jsonSegunSesion(tieneSesion: (req: express.Request) => boolean): express.RequestHandler {
  const conSesion = express.json({ limit: "50mb", verify: guardarCuerpoCrudo });
  const anonimo = express.json({ limit: "1mb", verify: guardarCuerpoCrudo });
  return (req, res, next) => (tieneSesion(req) ? conSesion : anonimo)(req, res, next);
}
