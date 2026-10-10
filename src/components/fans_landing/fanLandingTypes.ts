/**
 * Tipos de la landing pública de fans: respuesta del alta y forma mínima de los datos públicos que usa.
 */

/** Incentivo que la banda configura en su apartado QR (descarga y/o cupón). */
export interface FanIncentive {
  mensajeAgradecimiento?: string;
  enlaceDescarga?: string;
  codigoDescuento?: string;
}

/** Respuesta de `/api/public/fans` (o su simulación en previsualización). */
export interface FanSignupResult {
  success?: boolean;
  message?: string;
  alreadyRegistered?: boolean;
  isSimulated?: boolean;
  incentivo?: FanIncentive;
}

/** Tema destacado del EPK público con la forma mínima necesaria para el avance de audio. */
export interface PublicHighlightedSong {
  id: string;
  titulo?: string;
  audioPrincipalUrl?: string;
  audioIdeas?: { audioUrl?: string }[];
}
