import crypto from "crypto";

// Invitación de miembro: el director da de alta a alguien y la persona termina de activar su
// cuenta desde el enlace del correo. Antes /auth/activate-member solo comprobaba el email: quien
// supiera el correo de un invitado podía fijar su contraseña y entrar como él antes de que lo
// hiciera la persona. Ahora hace falta un token aleatorio que SOLO viaja en el correo.
//
// Se guarda únicamente su hash (SHA-256), junto con la caducidad, en `ui_preferences._invitacion`
// del usuario: esa columna ya se persiste en Supabase, así que sobrevive a un reinicio (el flag
// `activacion_pendiente` suelto solo vivía en memoria y se perdía al reiniciar el servidor).
const VALIDEZ_MS = 14 * 24 * 60 * 60 * 1000;

const hashDe = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

/** Marca al usuario como invitación pendiente y devuelve el token en claro (para el correo). */
export function asignarInvitacion(user: any): string {
  const token = crypto.randomBytes(24).toString("hex");
  user.activacion_pendiente = true;
  user.ui_preferences = {
    ...(user.ui_preferences || {}),
    _invitacion: { hash: hashDe(token), expira: Date.now() + VALIDEZ_MS },
  };
  return token;
}

export function invitacionPendiente(user: any): boolean {
  return !!user && (!!user.activacion_pendiente || !!user.ui_preferences?._invitacion);
}

export function tokenInvitacionValido(user: any, token: unknown): boolean {
  const registro = user?.ui_preferences?._invitacion;
  if (!registro || typeof token !== "string" || !token || token.length > 200) return false;
  if (typeof registro.expira !== "number" || registro.expira < Date.now()) return false;
  const esperado = Buffer.from(String(registro.hash));
  const recibido = Buffer.from(hashDe(token));
  return esperado.length === recibido.length && crypto.timingSafeEqual(esperado, recibido);
}

export function limpiarInvitacion(user: any): void {
  delete user.activacion_pendiente;
  if (user.ui_preferences && "_invitacion" in user.ui_preferences) {
    const { _invitacion, ...resto } = user.ui_preferences;
    user.ui_preferences = resto;
  }
}
