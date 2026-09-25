import { Resend } from "resend";

/**
 * Servicio de envíos de correos transaccionales del sistema (no-reply).
 * Utiliza la API de Resend para notificaciones de bienvenida, alertas de cuenta, etc.
 */

function cleanEnvString(val?: string): string {
  if (!val) return "";
  return val.trim().replace(/^["']|["']$/g, "").trim();
}

export function getProductionAppUrl(customUrl?: string): string {
  const isDevOrPreview = (u: string) =>
    !u ||
    u.includes('run.app') ||
    u.includes('localhost') ||
    u.includes('127.0.0.1') ||
    u.includes('googleusercontent.com') ||
    u.includes('webcontainer') ||
    u.includes('ais-dev') ||
    u.includes('ais-pre');

  if (customUrl && !isDevOrPreview(customUrl)) {
    return customUrl.replace(/\/+$/, '');
  }
  const envUrl = process.env.APP_URL || '';
  if (envUrl && !isDevOrPreview(envUrl)) {
    return envUrl.replace(/\/+$/, '');
  }
  return 'https://bandmanager.io';
}

let resendInstance: Resend | null = null;
let lastApiKey: string | null = null;

function getResendClient(): Resend | null {
  const apiKey = cleanEnvString(process.env.RESEND_API_KEY);
  if (!apiKey) {
    return null;
  }
  if (!resendInstance || lastApiKey !== apiKey) {
    resendInstance = new Resend(apiKey);
    lastApiKey = apiKey;
  }
  return resendInstance;
}

function getDefaultSender(): string {
  const custom = cleanEnvString(process.env.SENDER_EMAIL);
  if (custom) return custom;
  return "BandManager <no-reply@bandmanager.io>";
}

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
  const from = cleanEnvString(options.from) || getDefaultSender();
  const to = (options.to || "").trim().toLowerCase();

  if (!to || !to.includes("@")) {
    console.error(`[Email Transaccional Error] Dirección de destino inválida: "${options.to}"`);
    return { success: false, error: `Dirección de destino inválida: "${options.to}"` };
  }

  if (!resend) {
    console.warn(`[Email Transaccional - AVISO] No hay RESEND_API_KEY configurada en las variables de entorno de Railway/servidor. El email a "${to}" ("${options.subject}") se ejecuta en modo simulación (consola). Para envíos reales añade RESEND_API_KEY a Railway.`);
    return { success: true, id: "simulated-dev-id" };
  }

  try {
    let response = await resend.emails.send({
      from,
      to,
      subject: options.subject,
      html: options.html,
    });

    if (response.error) {
      console.error(`[Resend Error] Fallo al enviar email a ${to} desde ${from}:`, response.error);
      const errMsg = response.error.message || "";
      const isDomainError = errMsg.includes("domain") || 
                            errMsg.includes("verify") || 
                            errMsg.includes("not verified") ||
                            response.error.name === "validation_error";

      if (isDomainError && from !== "BandManager <onboarding@resend.dev>") {
        console.warn(`[Resend Fallback] Reintentando envío a ${to} utilizando el remitente de prueba "BandManager <onboarding@resend.dev>"...`);
        try {
          const fallbackRes = await resend.emails.send({
            from: "BandManager <onboarding@resend.dev>",
            to,
            subject: options.subject,
            html: options.html,
          });
          if (!fallbackRes.error && fallbackRes.data?.id) {
            console.log(`[Resend Success] Email enviado correctamente con remitente de respaldo a ${to} (ID: ${fallbackRes.data.id})`);
            return { success: true, id: fallbackRes.data.id };
          }
        } catch (fbErr: any) {
          console.error(`[Resend Fallback Error]:`, fbErr?.message || fbErr);
        }
      }
      return { success: false, error: response.error.message };
    }

    console.log(`[Resend Success] Email enviado correctamente a ${to} desde ${from} (ID: ${response.data?.id})`);
    return { success: true, id: response.data?.id };
  } catch (err: any) {
    console.error(`[Resend Exception] Error inesperado al enviar a ${to}:`, err);
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Genera y envía un email de bienvenida enfocado en el ecosistema musical,
 * separación de pistas con IA y guía rápida del repertorio y calendario.
 */
export async function sendWelcomeEmail(toEmail: string, userName: string, bandName?: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const displayName = userName || "Músico";
  const displayBand = bandName ? ` para la banda <strong style="color:#f2ca50;">${bandName}</strong>` : "";
  const appUrl = getProductionAppUrl(process.env.APP_URL);

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>¡Bienvenido a BandManager.io!</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 0; }
        .container { max-width: 620px; margin: 30px auto; background: #121217; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
        .header { background: linear-gradient(180deg, #1c1c24 0%, #121217 100%); padding: 36px 28px 24px 28px; text-align: center; border-bottom: 1px solid #27272a; }
        .logo { font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; text-decoration: none; }
        .logo span { color: #f2ca50; }
        .content { padding: 32px 28px; line-height: 1.6; color: #d4d4d8; font-size: 15px; }
        .greeting { font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 12px 0; }
        .feature-box { background: linear-gradient(135deg, rgba(242, 202, 80, 0.08) 0%, rgba(24, 24, 27, 0.95) 100%); border: 1px solid rgba(242, 202, 80, 0.3); border-radius: 12px; padding: 22px; margin: 26px 0; }
        .feature-title { font-size: 17px; font-weight: 700; color: #f2ca50; margin-bottom: 10px; display: flex; align-items: center; }
        .step-card { background: #181820; border: 1px solid #272730; border-radius: 12px; padding: 18px 20px; margin-bottom: 16px; }
        .step-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
        .step-badge { background: #f2ca50; color: #09090b; font-weight: 800; font-size: 12px; padding: 3px 10px; border-radius: 20px; display: inline-block; }
        .step-title { font-weight: 700; color: #ffffff; font-size: 15px; }
        .step-desc { font-size: 13.5px; color: #a1a1aa; margin: 0; line-height: 1.5; }
        .btn-container { text-align: center; margin: 36px 0 20px 0; }
        .btn { display: inline-block; background: #f2ca50; color: #09090b !important; font-weight: 700; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-size: 15px; letter-spacing: 0.2px; box-shadow: 0 8px 25px rgba(242, 202, 80, 0.25); }
        .tools-pill { display: inline-block; background: #27272a; color: #e4e4e7; font-size: 12px; padding: 4px 10px; border-radius: 6px; margin: 4px 4px 4px 0; }
        .footer { background-color: #0b0b0e; padding: 24px; text-align: center; font-size: 12px; color: #71717a; border-top: 1px solid #222228; }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- HEADER -->
        <div class="header">
          <div class="logo">BandManager<span>.io</span></div>
          <div style="font-size: 12px; color: #a1a1aa; margin-top: 6px; text-transform: uppercase; letter-spacing: 1px;">Plataforma de Gestión Musical y Directos</div>
        </div>

        <!-- CONTENT -->
        <div class="content">
          <h1 class="greeting">¡Hola, ${displayName}! 🎸</h1>
          <p style="margin-top:0;">Tu cuenta ya está lista${displayBand}. Has entrado en el centro neurálgico para organizar todo el repertorio, ensayos, canciones y directos de tu banda.</p>

          <!-- SEPARACIÓN DE PISTAS (STEMS CON IA) -->
          <div class="feature-box">
            <div class="feature-title">
              🎛️ Novedad Estrella: Separación de Pistas (Stems con IA)
            </div>
            <p style="margin: 0; font-size: 14px; color: #e4e4e7; line-height: 1.55;">
              ¿Quieres ensayar solo tu instrumento o necesitas una base sin la voz original? Ahora puedes subir cualquier canción (MP3 o WAV) en el <strong>Repertorio</strong> y la IA aislará automáticamente 4 pistas independientes:
            </p>
            <div style="margin-top: 12px;">
              <span class="tools-pill">🎙️ Voz Aislada</span>
              <span class="tools-pill">🥁 Batería</span>
              <span class="tools-pill">🎸 Bajo</span>
              <span class="tools-pill">🎹 Sintes / Otros</span>
            </div>
            <p style="margin: 10px 0 0 0; font-size: 13px; color: #f5d778;">
              💡 <em>Consejo pro:</em> Silencia tu propia pista para practicar como si estuvieras en el local de ensayo o crea backing tracks para directos en cuestión de segundos.
            </p>
          </div>

          <!-- MINI GUÍA RÁPIDA -->
          <h2 style="font-size: 18px; color: #ffffff; margin: 30px 0 16px 0;">⚡ Guía Rápida: Cómo sacarle todo el jugo a tu música</h2>

          <!-- PASO 1 -->
          <div class="step-card">
            <div class="step-header">
              <span class="step-badge">Paso 1</span>
              <span class="step-title">Carga tu Repertorio de Canciones</span>
            </div>
            <p class="step-desc">
              Introduce tus temas con sus letras, acordes sincronizados y audios de referencia. Utiliza el <strong>Transpositor Tonal</strong> con un solo clic si el cantante necesita cambiar de tono (ej: de Sol a Mi) sin reescribir nada a mano.
            </p>
          </div>

          <!-- PASO 2 -->
          <div class="step-card">
            <div class="step-header">
              <span class="step-badge">Paso 2</span>
              <span class="step-title">Confecciona Setlists Dinámicos para el Directo</span>
            </div>
            <p class="step-desc">
              Ordena las canciones de tu concierto. El sistema calcula la <strong>duración total exacta</strong>, evalúa la <strong>compatibilidad armónica (Camelot/Key)</strong> entre temas consecutivos y te avisa de saltos bruscos de energía o BPM para que el público no se desconecte.
            </p>
          </div>

          <!-- PASO 3 -->
          <div class="step-card">
            <div class="step-header">
              <span class="step-badge">Paso 3</span>
              <span class="step-title">Activa el Modo Escenario en Vivo</span>
            </div>
            <p class="step-desc">
              Pon tu tablet, portátil o móvil en el atril y activa el <strong>Modo Escenario</strong>: pantalla negra de máximo contraste, tipografías gigantes legibles a metros de distancia, visor de acordes y reproductor con <strong>caché 100% offline</strong> (no te quedarás colgado en sótanos sin cobertura).
            </p>
          </div>

          <!-- PASO 4 -->
          <div class="step-card">
            <div class="step-header">
              <span class="step-badge">Paso 4</span>
              <span class="step-title">Planifica Ensayos y Fechas en el Calendario</span>
            </div>
            <p class="step-desc">
              Convoca ensayos fijando el <strong>orden del día</strong> y usando el <strong>cronómetro de bloques</strong> para aprovechar cada minuto. Añade checklist de equipamiento para que a nadie se le olvide un cable y consulta la previsión meteorológica de tus bolos al aire libre.
            </p>
          </div>

          <!-- BOTÓN CTA -->
          <div class="btn-container">
            <a href="${appUrl}" class="btn">Entrar a mi Repertorio y Calendario →</a>
          </div>

          <!-- HERRAMIENTAS ADICIONALES -->
          <div style="background: #15151c; border-radius: 10px; padding: 16px; margin-top: 26px; border: 1px dashed #2a2a34; text-align: center;">
            <span style="font-size: 13px; color: #a1a1aa;">
              🛠️ <strong>Herramientas de músico incluidas en la barra superior:</strong> Afinador digital cromático, metrónomo interactivo, cancionero en PDF exportable y notas privadas para cada miembro de la banda.
            </span>
          </div>

          <p style="font-size: 13px; color: #71717a; margin-top: 32px; text-align: center;">
            ¿Tienes alguna sugerencia o quieres contarnos cómo suena tu grupo? Responde directamente a este correo, ¡nos encantará escucharte!
          </p>
        </div>

        <!-- FOOTER -->
        <div class="footer">
          &copy; ${new Date().getFullYear()} BandManager.io · Música, Repertorio y Directos. Todos los derechos reservados.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendTransactionalEmail({
    to: toEmail,
    subject: "🎸 ¡Bienvenido a BandManager.io! Tu Repertorio, Stems y Calendario musical",
    html,
  });
}
