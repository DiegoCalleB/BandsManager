// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { Resend } from "resend";

/**
 * Servicio de envíos de correos transaccionales del sistema (no-reply).
 * Utiliza la API de Resend para notificaciones de bienvenida, alertas de cuenta, etc.
 */

let resendInstance: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!resendInstance) {
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

const DEFAULT_SENDER = process.env.SENDER_EMAIL || "BandManager <no-reply@bandmanager.io>";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Envío genérico de email transaccional con fallback seguro si no hay API Key configurada.
 */
export async function sendTransactionalEmail(options: SendEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  const resend = getResendClient();
  const from = options.from || DEFAULT_SENDER;

  if (!resend) {
    console.log(`[Email Transaccional - Modo Dev/Sin Key] Para: ${options.to} | Asunto: "${options.subject}"`);
    return { success: true, id: "simulated-dev-id" };
  }

  try {
    const response = await resend.emails.send({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (response.error) {
      console.error(`[Resend Error] Fallo al enviar email a ${options.to}:`, response.error);
      return { success: false, error: response.error.message };
    }

    console.log(`[Resend Success] Email enviado correctamente a ${options.to} (ID: ${response.data?.id})`);
    return { success: true, id: response.data?.id };
  } catch (err: any) {
    console.error(`[Resend Exception] Error inesperado al enviar a ${options.to}:`, err);
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Genera y envía un email de bienvenida con diseño corporativo premium.
 */
export async function sendWelcomeEmail(toEmail: string, userName: string, bandName?: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const displayName = userName || "Músico";
  const displayBand = bandName ? ` para la banda <strong>${bandName}</strong>` : "";
  const appUrl = process.env.APP_URL || "https://bandmanager.io";

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>¡Bienvenido a BandManager.io!</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 30px auto; background: #18181b; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #18181b 0%, #09090b 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid #27272a; }
        .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
        .header span { color: #3b82f6; }
        .content { padding: 32px 24px; line-height: 1.6; color: #d4d4d8; font-size: 15px; }
        .content p { margin-bottom: 20px; }
        .highlight-box { background: #27272a; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin: 24px 0; color: #f4f4f5; }
        .button-container { text-align: center; margin: 32px 0 16px 0; }
        .btn { display: inline-block; background-color: #3b82f6; color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; }
        .footer { background-color: #09090b; padding: 20px 24px; text-align: center; font-size: 12px; color: #71717a; border-top: 1px solid #27272a; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>BandManager<span>.ai</span></h1>
        </div>
        <div class="content">
          <h2>¡Hola, ${displayName}! 👋</h2>
          <p>Tu cuenta ha sido creada con éxito${displayBand}. Estás a un paso de automatizar y potenciar la gestión de tu música con inteligencia agéntica.</p>

          <div class="highlight-box">
            <strong>¿Qué puedes hacer ahora?</strong>
            <ul style="margin: 8px 0 0 0; padding-left: 20px;">
              <li>Diseñar tu <strong>EPK y Dossier de Prensa</strong> listo para enviar a salas.</li>
              <li>Gestionar tu <strong>Repertorio, Letras y Acordes</strong> en vivo.</li>
              <li>Explorar tus <strong>Scouts y Agentes IA de Booking</strong>.</li>
            </ul>
          </div>

          <div class="button-container">
            <a href="${appUrl}" class="btn">Entrar a la Aplicación</a>
          </div>

          <p style="font-size: 13px; color: #a1a1aa; margin-top: 32px;">
            Si tienes cualquier duda o sugerencia, simplemente responde a este correo. Estamos aquí para ayudarte a impulsar tu música.
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} BandManager.io. Todos los derechos reservados.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendTransactionalEmail({
    to: toEmail,
    subject: "🎸 ¡Bienvenido a BandManager.io!",
    html,
  });
}
