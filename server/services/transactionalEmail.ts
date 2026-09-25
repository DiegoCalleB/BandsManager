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

export function resolveResendApiKey(): { key: string; name: string } | null {
  const explicitKeys = [
    'RESEND_API_KEY',
    'RESEND_APIKEY',
    'VITE_RESEND_API_KEY',
    'VITE_RESEND_APIKEY',
    'RESEND_API_TOKEN',
    'RESEND_APITOKEN',
    'RESEND_KEY',
    'RESEND_TOKEN',
    'RESEND_SECRET'
  ];

  for (const k of explicitKeys) {
    const val = cleanEnvString(process.env[k]);
    if (val) return { key: val, name: k };
  }

  for (const [key, rawVal] of Object.entries(process.env)) {
    const cleanKey = key.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const isExcluded = key.toUpperCase().includes('WEBHOOK') || key.toUpperCase().includes('FROM') || key.toUpperCase().includes('SENDER');
    if (!isExcluded && (cleanKey === 'RESENDAPIKEY' || cleanKey === 'RESENDKEY' || cleanKey === 'RESENDTOKEN' || cleanKey === 'RESENDAPITOKEN' || cleanKey === 'VITERESENDAPIKEY')) {
      const val = cleanEnvString(rawVal);
      if (val) return { key: val, name: key };
    }
  }

  return null;
}

let resendInstance: Resend | null = null;
let lastApiKey: string | null = null;

function getResendClient(): Resend | null {
  const resolved = resolveResendApiKey();
  const apiKey = resolved ? resolved.key : "";
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
  const custom = cleanEnvString(
    process.env.SENDER_EMAIL ||
    process.env.VITE_SENDER_EMAIL ||
    process.env.MAIL_FROM ||
    process.env.RESEND_FROM
  );
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
    console.warn(`[Email Transaccional - AVISO] No hay RESEND_API_KEY configurada en las variables de entorno de Railway/servidor. El email a "${to}" ("${options.subject}") no se puede enviar.`);
    if (process.env.VITEST) {
      return { success: true, id: "simulated-dev-id" };
    }
    return {
      success: false,
      error: "Servicio de correo inactivo: falta configurar la variable RESEND_API_KEY en las variables de entorno de Railway."
    };
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
          } else if (fallbackRes.error) {
            console.error(`[Resend Fallback Error]:`, fallbackRes.error);
            const fbMsg = fallbackRes.error.message || "";
            if (fbMsg.includes("testing emails") || fbMsg.includes("own email")) {
              return {
                success: false,
                error: "Resend requiere verificar el dominio bandmanager.io en https://resend.com/domains para enviar a cualquier destinatario. Durante las pruebas, envía los correos a tu email registrado en Resend (" + to + ")."
              };
            }
            return { success: false, error: fallbackRes.error.message };
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
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #08080a; color: #f4f4f5; margin: 0; padding: 0; }
        .container { max-width: 620px; margin: 30px auto; background: #121217; border: 1px solid rgba(242, 202, 80, 0.35); border-radius: 18px; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,0.65), 0 0 40px rgba(242, 202, 80, 0.08); }
        .header { background: linear-gradient(180deg, #1d1c16 0%, #121217 100%); padding: 36px 28px 24px 28px; text-align: center; border-bottom: 1px solid rgba(242, 202, 80, 0.25); }
        .logo { font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; text-decoration: none; }
        .logo span { color: #f2ca50; }
        .tagline { font-size: 12px; color: #f5d778; margin-top: 6px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; }
        .content { padding: 32px 28px; line-height: 1.6; color: #d4d4d8; font-size: 15px; }
        .greeting { font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 12px 0; }
        .feature-box { background: linear-gradient(135deg, rgba(242, 202, 80, 0.12) 0%, rgba(20, 20, 24, 0.95) 100%); border: 1px solid rgba(242, 202, 80, 0.45); border-left: 5px solid #f2ca50; border-radius: 14px; padding: 22px; margin: 26px 0; box-shadow: 0 8px 30px rgba(242, 202, 80, 0.08); }
        .feature-title { font-size: 17px; font-weight: 800; color: #f2ca50; margin-bottom: 10px; }
        .section-title { font-size: 18px; font-weight: 800; color: #ffffff; margin: 34px 0 18px 0; display: flex; align-items: center; gap: 8px; }
        .step-card { background: #16161d; border: 1px solid rgba(242, 202, 80, 0.2); border-radius: 14px; padding: 18px 20px; margin-bottom: 16px; transition: border-color 0.2s; }
        .step-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
        .step-badge { background: #f2ca50; color: #09090b; font-weight: 900; font-size: 11px; padding: 3px 10px; border-radius: 20px; display: inline-block; text-transform: uppercase; letter-spacing: 0.5px; }
        .step-title { font-weight: 700; color: #ffffff; font-size: 15px; }
        .step-desc { font-size: 13.5px; color: #a1a1aa; margin: 0; line-height: 1.55; }
        .btn-container { text-align: center; margin: 36px 0 20px 0; }
        .btn { display: inline-block; background: linear-gradient(135deg, #f2ca50 0%, #eab308 100%); color: #09090b !important; font-weight: 900; text-decoration: none; padding: 15px 38px; border-radius: 12px; font-size: 15px; letter-spacing: 0.3px; box-shadow: 0 10px 30px rgba(242, 202, 80, 0.35); }
        .tools-pill { display: inline-block; background: rgba(242, 202, 80, 0.12); color: #f5d778; border: 1px solid rgba(242, 202, 80, 0.35); font-size: 12px; font-weight: 600; padding: 5px 12px; border-radius: 8px; margin: 4px 4px 4px 0; }
        .tools-box { background: rgba(242, 202, 80, 0.05); border-radius: 12px; padding: 18px; margin-top: 28px; border: 1px dashed rgba(242, 202, 80, 0.35); text-align: center; }
        .footer { background-color: #0b0b0e; padding: 24px; text-align: center; font-size: 12px; color: #71717a; border-top: 1px solid #1f1f26; }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- HEADER -->
        <div class="header">
          <div class="logo">BandManager<span>.io</span></div>
          <div class="tagline">Plataforma de Gestión Musical y Directos</div>
        </div>

        <!-- CONTENT -->
        <div class="content">
          <h1 class="greeting">¡Hola, ${displayName}! 🎸</h1>
          <p style="margin-top:0;">Tu cuenta ya está activa${displayBand}. Has entrado en tu nuevo centro de control para organizar todo el repertorio, ensayos, canciones y directos de tu banda.</p>

          <!-- SEPARACIÓN DE PISTAS (STEMS CON IA) -->
          <div class="feature-box">
            <div class="feature-title">
              🎛️ Novedad: Separación de Pistas (Stems con IA)
            </div>
            <p style="margin: 0; font-size: 14px; color: #f4f4f5; line-height: 1.6;">
              ¿Quieres ensayar solo tu instrumento o necesitas una base sin la voz original? Ahora puedes subir cualquier canción (MP3 o WAV) en el <strong>Repertorio</strong> y la IA separará automáticamente 4 pistas independientes:
            </p>
            <div style="margin-top: 14px;">
              <span class="tools-pill">🎙️ Voz Aislada</span>
              <span class="tools-pill">🥁 Batería</span>
              <span class="tools-pill">🎸 Bajo</span>
              <span class="tools-pill">🎹 Sintes / Otros</span>
            </div>
            <p style="margin: 12px 0 0 0; font-size: 13px; color: #f5d778; line-height: 1.5;">
              💡 <strong>Consejo pro:</strong> Silencia tu propia pista para practicar como si estuvieras en el local de ensayo o crea <em>backing tracks</em> para tus conciertos en pocos segundos.
            </p>
          </div>

          <!-- MINI GUÍA RÁPIDA -->
          <h2 class="section-title">⚡ Guía Rápida: Cómo sacarle todo el partido a tu música</h2>

          <!-- PASO 1 -->
          <div class="step-card">
            <div class="step-header">
              <span class="step-badge">Paso 1</span>
              <span class="step-title">Carga tu Repertorio de Canciones</span>
            </div>
            <p class="step-desc">
              Introduce tus temas con sus letras, acordes sincronizados y audios de referencia. Utiliza el <strong style="color:#f2ca50;">Transpositor Tonal</strong> con un solo clic si el cantante necesita cambiar de tono (ej: de Sol a Mi) sin tener que reescribir nada a mano.
            </p>
          </div>

          <!-- PASO 2 -->
          <div class="step-card">
            <div class="step-header">
              <span class="step-badge">Paso 2</span>
              <span class="step-title">Confecciona Setlists Dinámicos para el Directo</span>
            </div>
            <p class="step-desc">
              Ordena las canciones de tu concierto. El sistema calcula la <strong style="color:#f2ca50;">duración total exacta</strong>, evalúa la <strong style="color:#f2ca50;">compatibilidad armónica (Camelot/Key)</strong> entre temas consecutivos y te avisa de saltos bruscos de energía o BPM para que el directo fluya sin parones.
            </p>
          </div>

          <!-- PASO 3 -->
          <div class="step-card">
            <div class="step-header">
              <span class="step-badge">Paso 3</span>
              <span class="step-title">Activa el Modo Escenario en Vivo</span>
            </div>
            <p class="step-desc">
              Pon tu tablet, móvil o portátil en el atril y activa el <strong style="color:#f2ca50;">Modo Escenario</strong>: pantalla oscura de máximo contraste, tipografías gigantes legibles a metros de distancia, visor de acordes y reproductor con <strong style="color:#f2ca50;">caché 100% offline</strong> (perfecto para sótanos y salas sin cobertura).
            </p>
          </div>

          <!-- PASO 4 -->
          <div class="step-card">
            <div class="step-header">
              <span class="step-badge">Paso 4</span>
              <span class="step-title">Planifica Ensayos y Fechas en el Calendario</span>
            </div>
            <p class="step-desc">
              Convoca ensayos fijando el <strong style="color:#f2ca50;">orden del día</strong> y usando el <strong style="color:#f2ca50;">cronómetro de bloques</strong> para optimizar cada minuto. Añade checklist de equipamiento para que nadie olvide cables o instrumentos y consulta la previsión meteorológica de tus bolos al aire libre.
            </p>
          </div>

          <!-- BOTÓN CTA -->
          <div class="btn-container">
            <a href="${appUrl}" class="btn">Entrar a mi Repertorio y Calendario →</a>
          </div>

          <!-- HERRAMIENTAS ADICIONALES -->
          <div class="tools-box">
            <span style="font-size: 13px; color: #d4d4d8;">
              🛠️ <strong style="color:#f2ca50;">Herramientas para músicos en la barra superior:</strong> Afinador cromático digital, metrónomo interactivo, cancionero en PDF exportable y notas privadas para cada miembro de la banda.
            </span>
          </div>

          <p style="font-size: 13px; color: #888894; margin-top: 32px; text-align: center;">
            ¿Tienes cualquier duda o quieres contarnos cómo suena tu proyecto? Responde directamente a este correo, ¡estamos encantados de ayudarte!
          </p>
        </div>

        <!-- FOOTER -->
        <div class="footer">
          &copy; ${new Date().getFullYear()} <strong>BandManager<span style="color:#f2ca50;">.io</span></strong> · Música, Repertorio y Calendario. Todos los derechos reservados.
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
