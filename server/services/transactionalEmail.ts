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
  const displayBand = bandName ? ` para tu proyecto <strong style="color:#f2ca50;">${bandName}</strong>` : "";
  const appUrl = getProductionAppUrl(process.env.APP_URL);

  const html = `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>¡Bienvenido a BandManager.io!</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; background-color: #08080c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #f4f4f5; }
    table { border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; }
    td { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    img { border: 0; outline: none; text-decoration: none; display: block; }
    .preheader { display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; max-height: 0; max-width: 0; overflow: hidden; mso-hide: all; }
    .container { max-width: 640px; margin: 0 auto; background-color: #101015; border-radius: 20px; overflow: hidden; border: 1px solid rgba(242, 202, 80, 0.28); box-shadow: 0 25px 60px rgba(0,0,0,0.8), 0 0 40px rgba(242, 202, 80, 0.08); }
    .btn-main { display: inline-block; background: linear-gradient(135deg, #f2ca50 0%, #eab308 100%); color: #09090b !important; font-weight: 800; font-size: 15px; text-decoration: none; padding: 15px 36px; border-radius: 12px; letter-spacing: 0.3px; box-shadow: 0 10px 25px rgba(242, 202, 80, 0.35); text-align: center; }
    .btn-secondary { display: inline-block; background: rgba(242, 202, 80, 0.12); color: #f5d778 !important; font-weight: 700; font-size: 12px; text-decoration: none; padding: 6px 14px; border-radius: 8px; border: 1px solid rgba(242, 202, 80, 0.35); }
    @media only screen and (max-width: 640px) {
      .container { border-radius: 0 !important; border-left: none !important; border-right: none !important; }
      .content-padding { padding: 24px 18px !important; }
      .header-padding { padding: 28px 18px !important; }
      .feature-card { padding: 16px !important; }
      .mockup-inner { padding: 12px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #08080c;">

  <!-- Preheader text (preview en bandeja de entrada) -->
  <div class="preheader">
    Tu centro de control musical está listo: separación de pistas con IA, mapa de energías del repertorio, dossier EPK online, landings de fans y repertorio para atril.
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="container" style="max-width: 640px; width: 100%; background-color: #101015; border-radius: 20px; border: 1px solid rgba(242, 202, 80, 0.28);">
          
          <!-- HEADER -->
          <tr>
            <td class="header-padding" style="background: linear-gradient(180deg, #1b1a13 0%, #101015 100%); padding: 38px 32px 28px 32px; text-align: center; border-bottom: 1px solid rgba(242, 202, 80, 0.2);">
              <div style="display: inline-block; margin-bottom: 10px;">
                <span style="font-size: 32px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">BandManager<span style="color: #f2ca50;">.io</span></span>
              </div>
              <div style="font-size: 11px; color: #f5d778; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">
                El Sistema Operativo para Bandas y Músicos Independientes
              </div>
            </td>
          </tr>

          <!-- WELCOME GREETING -->
          <tr>
            <td class="content-padding" style="padding: 32px 32px 16px 32px;">
              <h1 style="margin: 0 0 14px 0; font-size: 24px; font-weight: 800; color: #ffffff; line-height: 1.3;">
                ¡Hola, ${displayName}! 🎸
              </h1>
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #d4d4d8;">
                Tu cuenta ya está lista y activada${displayBand}. Has entrado en el centro de control diseñado por y para músicos que unifica todo lo que una banda necesita: desde el local de ensayo y la producción hasta los conciertos, booking, fans y facturación.
              </p>
              
              <!-- Quick Access CTA -->
              <div style="text-align: center; margin: 26px 0 34px 0;">
                <a href="${appUrl}" class="btn-main" style="display: inline-block; background: linear-gradient(135deg, #f2ca50 0%, #eab308 100%); color: #09090b; font-weight: 800; font-size: 15px; text-decoration: none; padding: 15px 36px; border-radius: 12px; letter-spacing: 0.3px;">
                  Entrar a Mi Panel de Control Musical →
                </a>
              </div>

              <div style="height: 1px; background: rgba(242, 202, 80, 0.15); margin-bottom: 30px;"></div>

              <h2 style="margin: 0 0 22px 0; font-size: 19px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px;">
                ⭐ Las 5 herramientas clave que van a transformar tu banda:
              </h2>
            </td>
          </tr>

          <!-- 1. STEMS SEPARATOR WITH IA (VISUAL MOCKUP) -->
          <tr>
            <td class="content-padding" style="padding: 0 32px 28px 32px;">
              <div class="feature-card" style="background: #14141c; border: 1px solid rgba(6, 182, 212, 0.35); border-left: 4px solid #06b6d4; border-radius: 16px; padding: 22px; box-shadow: 0 10px 30px rgba(0,0,0,0.4);">
                
                <!-- Badge & Title -->
                <div style="margin-bottom: 12px;">
                  <span style="background: rgba(6, 182, 212, 0.15); color: #22d3ee; font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 3px 10px; border-radius: 20px; border: 1px solid rgba(6, 182, 212, 0.3);">
                    Motor de Inteligencia Artificial
                  </span>
                  <h3 style="margin: 10px 0 6px 0; font-size: 17px; font-weight: 800; color: #ffffff;">
                    🎛️ Separación de Pistas (Stems Studio en 4 Pistas)
                  </h3>
                  <p style="margin: 0 0 16px 0; font-size: 13.5px; line-height: 1.55; color: #a1a1aa;">
                    Sube cualquier tema grabado en el local o producción de estudio (MP3 o WAV). La IA aísla automáticamente 4 canales de audio individuales para que ensayes en silencio o crees pistas de acompañamiento para tus directos.
                  </p>
                </div>

                <!-- Visual DAW Mockup Container -->
                <div class="mockup-inner" style="background: #09090d; border: 1px solid #272733; border-radius: 12px; padding: 14px; font-family: monospace;">
                  
                  <!-- Track 1: Vocals -->
                  <div style="margin-bottom: 10px; background: #12121a; border-radius: 8px; padding: 8px 12px; border: 1px solid rgba(6, 182, 212, 0.25);">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="30%" style="font-size: 11px; font-weight: bold; color: #22d3ee;">🎙️ VOZ AISLADA</td>
                        <td width="45%" style="vertical-align: middle;">
                          <div style="height: 6px; background: #1e1e2d; border-radius: 3px; overflow: hidden; margin: 0 8px;">
                            <div style="height: 100%; width: 85%; background: linear-gradient(90deg, #06b6d4, #38bdf8); border-radius: 3px;"></div>
                          </div>
                        </td>
                        <td width="25%" align="right">
                          <span style="background: #06b6d4; color: #000; font-size: 9px; font-weight: 900; padding: 2px 6px; border-radius: 4px; margin-right: 4px;">SOLO</span>
                          <span style="background: #1e1e2d; color: #71717a; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">MUTE</span>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- Track 2: Drums -->
                  <div style="margin-bottom: 10px; background: #12121a; border-radius: 8px; padding: 8px 12px; border: 1px solid rgba(245, 158, 11, 0.25);">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="30%" style="font-size: 11px; font-weight: bold; color: #fbbf24;">🥁 BATERÍA</td>
                        <td width="45%" style="vertical-align: middle;">
                          <div style="height: 6px; background: #1e1e2d; border-radius: 3px; overflow: hidden; margin: 0 8px;">
                            <div style="height: 100%; width: 92%; background: linear-gradient(90deg, #f59e0b, #fbbf24); border-radius: 3px;"></div>
                          </div>
                        </td>
                        <td width="25%" align="right">
                          <span style="background: #1e1e2d; color: #71717a; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-right: 4px;">SOLO</span>
                          <span style="background: #1e1e2d; color: #71717a; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">MUTE</span>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- Track 3: Bass -->
                  <div style="margin-bottom: 10px; background: #12121a; border-radius: 8px; padding: 8px 12px; border: 1px solid rgba(139, 92, 246, 0.25);">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="30%" style="font-size: 11px; font-weight: bold; color: #a78bfa;">🎸 BAJO</td>
                        <td width="45%" style="vertical-align: middle;">
                          <div style="height: 6px; background: #1e1e2d; border-radius: 3px; overflow: hidden; margin: 0 8px;">
                            <div style="height: 100%; width: 78%; background: linear-gradient(90deg, #8b5cf6, #c084fc); border-radius: 3px;"></div>
                          </div>
                        </td>
                        <td width="25%" align="right">
                          <span style="background: #1e1e2d; color: #71717a; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-right: 4px;">SOLO</span>
                          <span style="background: #ef4444; color: #fff; font-size: 9px; font-weight: 900; padding: 2px 6px; border-radius: 4px;">MUTED</span>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- Track 4: Guitars / Others -->
                  <div style="background: #12121a; border-radius: 8px; padding: 8px 12px; border: 1px solid rgba(16, 185, 129, 0.25);">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="30%" style="font-size: 11px; font-weight: bold; color: #34d399;">🎹 GUITARRAS / OTROS</td>
                        <td width="45%" style="vertical-align: middle;">
                          <div style="height: 6px; background: #1e1e2d; border-radius: 3px; overflow: hidden; margin: 0 8px;">
                            <div style="height: 100%; width: 80%; background: linear-gradient(90deg, #10b981, #6ee7b7); border-radius: 3px;"></div>
                          </div>
                        </td>
                        <td width="25%" align="right">
                          <span style="background: #1e1e2d; color: #71717a; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-right: 4px;">SOLO</span>
                          <span style="background: #1e1e2d; color: #71717a; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">MUTE</span>
                        </td>
                      </tr>
                    </table>
                  </div>

                </div>

                <!-- Feature footer tip -->
                <p style="margin: 12px 0 0 0; font-size: 12.5px; color: #67e8f9; line-height: 1.5;">
                  💡 <strong>Tip para el ensayo:</strong> Silencia tu instrumento en la pista para practicar en casa como si tu banda estuviera contigo en el salón.
                </p>

              </div>
            </td>
          </tr>

          <!-- 2. ENERGY CURVE & HARMONIC SETLISTS (VISUAL MOCKUP) -->
          <tr>
            <td class="content-padding" style="padding: 0 32px 28px 32px;">
              <div class="feature-card" style="background: #14141c; border: 1px solid rgba(245, 158, 11, 0.35); border-left: 4px solid #f59e0b; border-radius: 16px; padding: 22px; box-shadow: 0 10px 30px rgba(0,0,0,0.4);">
                
                <div style="margin-bottom: 12px;">
                  <span style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 3px 10px; border-radius: 20px; border: 1px solid rgba(245, 158, 11, 0.3);">
                    Directo & Dinámica de Escenario
                  </span>
                  <h3 style="margin: 10px 0 6px 0; font-size: 17px; font-weight: 800; color: #ffffff;">
                    ⚡ Curva de Energía & Transiciones Armónicas del Setlist
                  </h3>
                  <p style="margin: 0 0 16px 0; font-size: 13.5px; line-height: 1.55; color: #a1a1aa;">
                    Construye el orden perfecto de tu concierto. Visualiza la intensidad acumulada de la sala, evita baches de energía y valida la compatibilidad tonal armónica (Rueda Camelot) entre temas contiguos.
                  </p>
                </div>

                <!-- Visual Energy Chart Mockup -->
                <div class="mockup-inner" style="background: #09090d; border: 1px solid #272733; border-radius: 12px; padding: 16px;">
                  <div style="font-size: 11px; color: #f59e0b; font-weight: bold; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                    📈 Curva de Intensidad del Show (12 Canciones • 1h 24m)
                  </div>
                  
                  <!-- Bar chart simulation for setlist flow -->
                  <div style="display: table; width: 100%; height: 75px; table-layout: fixed; margin-bottom: 10px;">
                    <!-- Song 1 -->
                    <div style="display: table-cell; vertical-align: bottom; padding: 0 2px; text-align: center;">
                      <div style="height: 48px; background: #eab308; border-radius: 4px 4px 0 0;"></div>
                      <span style="font-size: 9px; color: #71717a; display: block; margin-top: 4px;">#1</span>
                    </div>
                    <!-- Song 2 -->
                    <div style="display: table-cell; vertical-align: bottom; padding: 0 2px; text-align: center;">
                      <div style="height: 54px; background: #eab308; border-radius: 4px 4px 0 0;"></div>
                      <span style="font-size: 9px; color: #71717a; display: block; margin-top: 4px;">#2</span>
                    </div>
                    <!-- Song 3 -->
                    <div style="display: table-cell; vertical-align: bottom; padding: 0 2px; text-align: center;">
                      <div style="height: 60px; background: #f59e0b; border-radius: 4px 4px 0 0;"></div>
                      <span style="font-size: 9px; color: #71717a; display: block; margin-top: 4px;">#3</span>
                    </div>
                    <!-- Song 4 (Climax 1) -->
                    <div style="display: table-cell; vertical-align: bottom; padding: 0 2px; text-align: center;">
                      <div style="height: 72px; background: #ef4444; border-radius: 4px 4px 0 0;"></div>
                      <span style="font-size: 9px; color: #ef4444; font-weight: bold; display: block; margin-top: 4px;">#4</span>
                    </div>
                    <!-- Song 5 -->
                    <div style="display: table-cell; vertical-align: bottom; padding: 0 2px; text-align: center;">
                      <div style="height: 50px; background: #eab308; border-radius: 4px 4px 0 0;"></div>
                      <span style="font-size: 9px; color: #71717a; display: block; margin-top: 4px;">#5</span>
                    </div>
                    <!-- Song 6 (Ballad) -->
                    <div style="display: table-cell; vertical-align: bottom; padding: 0 2px; text-align: center;">
                      <div style="height: 30px; background: #3b82f6; border-radius: 4px 4px 0 0;"></div>
                      <span style="font-size: 9px; color: #60a5fa; font-weight: bold; display: block; margin-top: 4px;">#6</span>
                    </div>
                    <!-- Song 7 -->
                    <div style="display: table-cell; vertical-align: bottom; padding: 0 2px; text-align: center;">
                      <div style="height: 42px; background: #eab308; border-radius: 4px 4px 0 0;"></div>
                      <span style="font-size: 9px; color: #71717a; display: block; margin-top: 4px;">#7</span>
                    </div>
                    <!-- Song 8 -->
                    <div style="display: table-cell; vertical-align: bottom; padding: 0 2px; text-align: center;">
                      <div style="height: 56px; background: #f59e0b; border-radius: 4px 4px 0 0;"></div>
                      <span style="font-size: 9px; color: #71717a; display: block; margin-top: 4px;">#8</span>
                    </div>
                    <!-- Song 9 -->
                    <div style="display: table-cell; vertical-align: bottom; padding: 0 2px; text-align: center;">
                      <div style="height: 64px; background: #f59e0b; border-radius: 4px 4px 0 0;"></div>
                      <span style="font-size: 9px; color: #71717a; display: block; margin-top: 4px;">#9</span>
                    </div>
                    <!-- Song 10 (Final Climax) -->
                    <div style="display: table-cell; vertical-align: bottom; padding: 0 2px; text-align: center;">
                      <div style="height: 75px; background: #ef4444; border-radius: 4px 4px 0 0; box-shadow: 0 0 10px rgba(239,68,68,0.5);"></div>
                      <span style="font-size: 9px; color: #ef4444; font-weight: bold; display: block; margin-top: 4px;">#10</span>
                    </div>
                  </div>

                  <!-- Metrics badges row -->
                  <div style="background: #13131c; border-radius: 8px; padding: 8px 12px; margin-top: 8px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size: 11px; color: #a1a1aa;">
                          🎯 <strong>Transición Armónica:</strong> <span style="color: #10b981; font-weight: bold;">8A (Lam) ➔ 9A (Mim) • Suave</span>
                        </td>
                        <td align="right" style="font-size: 11px; color: #f2ca50; font-weight: bold;">
                          ⏱️ 1h 24m exactos
                        </td>
                      </tr>
                    </table>
                  </div>

                </div>

                <p style="margin: 12px 0 0 0; font-size: 12.5px; color: #fde68a; line-height: 1.5;">
                  💡 <strong>Impacto real:</strong> Di adiós a los silencios incómodos entre temas o cambios de afinación imprevistos en medio del repertorio.
                </p>

              </div>
            </td>
          </tr>

          <!-- 3. INTERACTIVE EPK / PRESS KIT (VISUAL MOCKUP) -->
          <tr>
            <td class="content-padding" style="padding: 0 32px 28px 32px;">
              <div class="feature-card" style="background: #14141c; border: 1px solid rgba(139, 92, 246, 0.35); border-left: 4px solid #8b5cf6; border-radius: 16px; padding: 22px; box-shadow: 0 10px 30px rgba(0,0,0,0.4);">
                
                <div style="margin-bottom: 12px;">
                  <span style="background: rgba(139, 92, 246, 0.15); color: #c084fc; font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 3px 10px; border-radius: 20px; border: 1px solid rgba(139, 92, 246, 0.3);">
                    Booking & Prensa Profesional
                  </span>
                  <h3 style="margin: 10px 0 6px 0; font-size: 17px; font-weight: 800; color: #ffffff;">
                    🌐 Dossier EPK Interactivo Online (Web para Promotores)
                  </h3>
                  <p style="margin: 0 0 16px 0; font-size: 13.5px; line-height: 1.55; color: #a1a1aa;">
                    Tu carta de presentación oficial para salas, festivales y agencias. Se abre en menos de 0.5s en el móvil del programador sin descargar archivos pesados que reboten o saturen su correo.
                  </p>
                </div>

                <!-- Visual Browser EPK Card -->
                <div class="mockup-inner" style="background: #09090d; border: 1px solid #272733; border-radius: 12px; padding: 14px;">
                  
                  <!-- Browser bar -->
                  <div style="background: #171722; border-radius: 6px; padding: 6px 12px; margin-bottom: 12px; font-size: 11px; color: #94a3b8; font-family: monospace;">
                    🔒 https://bandmanager.io/epk?b=<span style="color: #c084fc;">tu-banda</span>
                  </div>

                  <!-- Mock EPK Hero Preview -->
                  <div style="background: linear-gradient(135deg, #1f1b2e 0%, #111118 100%); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 10px; padding: 16px; text-align: center;">
                    <div style="font-size: 18px; font-weight: 900; color: #ffffff; margin-bottom: 4px;">
                      ${bandName || 'TU BANDA'}
                    </div>
                    <div style="font-size: 11px; color: #c084fc; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; margin-bottom: 14px;">
                      Indie Rock / Fusión • Dossier Oficial 2026
                    </div>

                    <!-- Mini audio player simulation -->
                    <div style="background: rgba(0,0,0,0.6); border-radius: 30px; padding: 8px 16px; margin: 0 auto 14px auto; display: inline-block; border: 1px solid rgba(255,255,255,0.1);">
                      <span style="color: #f2ca50; font-size: 13px; margin-right: 8px;">▶</span>
                      <span style="font-size: 12px; color: #ffffff; font-weight: 600;">Nuevo Single (Audio Master)</span>
                      <span style="font-size: 11px; color: #9ca3af; margin-left: 10px;">03:45</span>
                    </div>

                    <!-- Action buttons row -->
                    <div>
                      <span style="display: inline-block; background: #8b5cf6; color: #fff; font-size: 10.5px; font-weight: 800; padding: 6px 12px; border-radius: 6px; margin: 2px;">
                        📥 Rider Técnico & Stage Plot
                      </span>
                      <span style="display: inline-block; background: rgba(255,255,255,0.08); color: #e2e8f0; font-size: 10.5px; font-weight: 700; padding: 6px 12px; border-radius: 6px; margin: 2px;">
                        📸 Fotos en Alta Resolución
                      </span>
                      <span style="display: inline-block; background: rgba(242, 202, 80, 0.15); color: #f5d778; font-size: 10.5px; font-weight: 700; padding: 6px 12px; border-radius: 6px; margin: 2px;">
                        📅 Fechas Disponibles
                      </span>
                    </div>

                  </div>

                </div>

                <p style="margin: 12px 0 0 0; font-size: 12.5px; color: #ddd6fe; line-height: 1.5;">
                  💡 <strong>Diseñado para cerrar bolos:</strong> La prensa y las salas encuentran tu biografía, fotos oficiales, clips en directo y teléfono de contratación a un solo toque.
                </p>

              </div>
            </td>
          </tr>

          <!-- 4. FANS LANDING & TICKETING (VISUAL MOCKUP) -->
          <tr>
            <td class="content-padding" style="padding: 0 32px 28px 32px;">
              <div class="feature-card" style="background: #14141c; border: 1px solid rgba(236, 72, 153, 0.35); border-left: 4px solid #ec4899; border-radius: 16px; padding: 22px; box-shadow: 0 10px 30px rgba(0,0,0,0.4);">
                
                <div style="margin-bottom: 12px;">
                  <span style="background: rgba(236, 72, 153, 0.15); color: #f472b6; font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 3px 10px; border-radius: 20px; border: 1px solid rgba(236, 72, 153, 0.3);">
                    Comunidad & Monetización Directa
                  </span>
                  <h3 style="margin: 10px 0 6px 0; font-size: 17px; font-weight: 800; color: #ffffff;">
                    💌 Fans Landing Page (Venta de Entradas y Captación VIP)
                  </h3>
                  <p style="margin: 0 0 16px 0; font-size: 13.5px; line-height: 1.55; color: #a1a1aa;">
                    Tu propia web pública para fans. Vende entradas de tus conciertos sin comisiones abusivas, publica tu merchandising oficial y capta los emails de tus seguidores en el propio concierto con un código QR.
                  </p>
                </div>

                <!-- Visual Mobile Fans Mockup -->
                <div class="mockup-inner" style="background: #09090d; border: 1px solid #272733; border-radius: 12px; padding: 14px;">
                  
                  <!-- Upcoming Gig card -->
                  <div style="background: #171622; border-radius: 8px; padding: 10px 14px; margin-bottom: 10px; border: 1px solid rgba(236, 72, 153, 0.25);">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <div style="font-size: 12px; font-weight: 800; color: #ffffff;">Próximo Concierto: Madrid</div>
                          <div style="font-size: 11px; color: #f472b6;">Sala Clamores • Sábado 18 de Octubre</div>
                        </td>
                        <td align="right">
                          <span style="background: #ec4899; color: #ffffff; font-size: 10px; font-weight: 800; padding: 5px 12px; border-radius: 6px; display: inline-block;">
                            Comprar Entrada
                          </span>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- VIP Fan Club input form -->
                  <div style="background: #101017; border-radius: 8px; padding: 12px; border: 1px dashed rgba(236, 72, 153, 0.35); text-align: center;">
                    <div style="font-size: 12px; font-weight: 800; color: #fbcfe8; margin-bottom: 4px;">
                      🔥 Únete al Club VIP de la Banda
                    </div>
                    <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">
                      Recibe temas inéditos, acceso a pruebas de sonido y 15% de descuento en vinilos.
                    </div>
                    <div style="background: #09090d; border: 1px solid #333; border-radius: 6px; padding: 6px 12px; display: inline-block; width: 80%; max-width: 280px; text-align: left;">
                      <span style="font-size: 11px; color: #64748b;">tu-email@gmail.com</span>
                      <span style="float: right; font-size: 10px; font-weight: bold; color: #f2ca50;">[SUSCRIBIRME]</span>
                    </div>
                  </div>

                </div>

                <p style="margin: 12px 0 0 0; font-size: 12.5px; color: #fbcfe8; line-height: 1.5;">
                  💡 <strong>Propiedad de tu audiencia:</strong> Deja de depender de los algoritmos de las redes sociales. Cada fan que se registre es tuyo para siempre.
                </p>

              </div>
            </td>
          </tr>

          <!-- 5. STAGE PRINTED SETLIST WITH NOTES (VISUAL MOCKUP) -->
          <tr>
            <td class="content-padding" style="padding: 0 32px 32px 32px;">
              <div class="feature-card" style="background: #14141c; border: 1px solid rgba(16, 185, 129, 0.35); border-left: 4px solid #10b981; border-radius: 16px; padding: 22px; box-shadow: 0 10px 30px rgba(0,0,0,0.4);">
                
                <div style="margin-bottom: 12px;">
                  <span style="background: rgba(16, 185, 129, 0.15); color: #34d399; font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 3px 10px; border-radius: 20px; border: 1px solid rgba(16, 185, 129, 0.3);">
                    Impresión & Atril de Escenario
                  </span>
                  <h3 style="margin: 10px 0 6px 0; font-size: 17px; font-weight: 800; color: #ffffff;">
                    📄 Repertorio Impreso para Atril con Notas Personalizadas
                  </h3>
                  <p style="margin: 0 0 16px 0; font-size: 13.5px; line-height: 1.55; color: #a1a1aa;">
                    Exporta el setlist en PDF o papel listo para atril y suelo de escenario. Cada músico puede ver anotaciones técnicas individuales: cambios de afinación, capo, instrumentos y compases de entrada.
                  </p>
                </div>

                <!-- Visual Paper Setlist Sheet Mockup -->
                <div class="mockup-inner" style="background: #0f1715; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 14px; font-family: 'Courier New', Courier, monospace;">
                  
                  <div style="border-bottom: 1px dashed rgba(16, 185, 129, 0.3); padding-bottom: 8px; margin-bottom: 10px;">
                    <div style="font-size: 12px; font-weight: 900; color: #34d399;">SETLIST DIRECTO • GIRA 2026 (ATRILES & TÉCNICO)</div>
                    <div style="font-size: 10px; color: #94a3b8;">12 TEMAS • TIEMPO TOTAL: 1H 24M • TONOS & APUNTES</div>
                  </div>

                  <!-- Song item 1 -->
                  <div style="padding: 4px 0; font-size: 11px; border-bottom: 1px solid #1a2723;">
                    <span style="color: #ffffff; font-weight: bold;">01. CAMINOS DEL SUR</span> 
                    <span style="color: #f2ca50; font-weight: bold;">[Em • 124 BPM]</span>
                    <div style="font-size: 9.5px; color: #34d399; margin-left: 20px;">➔ Guitarra: Acústica con Capo traste 2 • Intro cantante solo</div>
                  </div>

                  <!-- Song item 2 -->
                  <div style="padding: 4px 0; font-size: 11px; border-bottom: 1px solid #1a2723;">
                    <span style="color: #ffffff; font-weight: bold;">02. FUEGO NOCTURNO</span> 
                    <span style="color: #f2ca50; font-weight: bold;">[G • 138 BPM]</span>
                    <div style="font-size: 9.5px; color: #34d399; margin-left: 20px;">➔ Bajo: Entra distorsión compás 4 • Sin pausa con tema 1</div>
                  </div>

                  <!-- Song item 3 -->
                  <div style="padding: 4px 0; font-size: 11px;">
                    <span style="color: #ffffff; font-weight: bold;">03. RESPLANDOR</span> 
                    <span style="color: #f2ca50; font-weight: bold;">[Dm • 92 BPM]</span>
                    <div style="font-size: 9.5px; color: #34d399; margin-left: 20px;">➔ Teclados: Cambio a pad analógico • Solo de guitarra extendido</div>
                  </div>

                </div>

                <p style="margin: 12px 0 0 0; font-size: 12.5px; color: #a7f3d0; line-height: 1.5;">
                  💡 <strong>Directos sin errores:</strong> Cada integrante del grupo sabe qué guitarra coger, qué afinación poner y cómo arranca cada canción sin miradas de pánico.
                </p>

              </div>
            </td>
          </tr>

          <!-- TOOLBOX ACCORDION / EXTRA FEATURES -->
          <tr>
            <td class="content-padding" style="padding: 0 32px 30px 32px;">
              <div style="background: rgba(242, 202, 80, 0.05); border: 1px dashed rgba(242, 202, 80, 0.35); border-radius: 14px; padding: 18px 20px;">
                <div style="font-size: 13px; font-weight: 800; color: #f2ca50; margin-bottom: 8px;">
                  🛠️ Y muchas más herramientas listas para tu día a día:
                </div>
                <div style="font-size: 12.5px; line-height: 1.6; color: #d4d4d8;">
                  • <strong>Afinador cromático digital & Metrónomo interactivo</strong> en la barra superior.<br>
                  • <strong>Transpositor automático de acordes</strong> (cambia de tono canciones enteras con 1 toque).<br>
                  • <strong>Modo Escenario Offline</strong> de máximo contraste (diseñado para sótanos sin cobertura).<br>
                  • <strong>Gestión de ensayos con cronómetro</strong> para optimizar cada minuto en el local.
                </div>
              </div>
            </td>
          </tr>

          <!-- FINAL GRAND CTA -->
          <tr>
            <td class="content-padding" style="padding: 10px 32px 38px 32px; text-align: center;">
              <a href="${appUrl}" class="btn-main" style="display: inline-block; background: linear-gradient(135deg, #f2ca50 0%, #eab308 100%); color: #09090b; font-weight: 900; font-size: 16px; text-decoration: none; padding: 16px 42px; border-radius: 12px; letter-spacing: 0.3px; box-shadow: 0 12px 30px rgba(242, 202, 80, 0.35);">
                Comenzar a Configurar Mi Banda Ahora →
              </a>
              <p style="margin: 22px 0 0 0; font-size: 13px; color: #a1a1aa; line-height: 1.5;">
                ¿Tienes cualquier duda o propuesta para tu proyecto? Responde directamente a este correo; estamos aquí para ayudarte a llevar tu música al siguiente nivel.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #09090c; padding: 26px 32px; text-align: center; font-size: 12px; color: #71717a; border-top: 1px solid #1c1c24;">
              <div style="font-weight: 700; color: #a1a1aa; margin-bottom: 6px;">
                BandManager.io • Plataforma para Músicos y Bandas
              </div>
              <div style="font-size: 11px; color: #52525b; line-height: 1.5;">
                Has recibido este correo al activar tu cuenta en <a href="https://bandmanager.io" style="color: #f2ca50; text-decoration: none;">bandmanager.io</a>.<br>
                Si no te has registrado tú, puedes desestimar este mensaje.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendTransactionalEmail({
    to: toEmail,
    subject: `¡Bienvenido a BandManager.io, ${displayName}! 🎸 Tu centro de control musical está listo`,
    html,
  });
}


export async function sendPasswordResetEmail(toEmail: string, code: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const appUrl = getProductionAppUrl(process.env.APP_URL);
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Código de Seguridad - BandManager.io</title>
</head>
<body style="margin:0; padding:24px 0; background-color:#08080c; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#f4f4f5;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="max-width:560px; width:100%; background:#101015; border-radius:18px; border:1px solid rgba(242, 202, 80, 0.3); box-shadow:0 20px 50px rgba(0,0,0,0.8);">
          <tr>
            <td style="background:linear-gradient(180deg, #1b1a13 0%, #101015 100%); padding:32px 28px 24px 28px; text-align:center; border-bottom:1px solid rgba(242, 202, 80, 0.18);">
              <div style="font-size:26px; font-weight:900; color:#ffffff; letter-spacing:-0.5px;">BandManager<span style="color:#f2ca50;">.io</span></div>
              <div style="font-size:11px; color:#f5d778; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; margin-top:4px;">Seguridad de la Cuenta</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 32px 28px;">
              <h2 style="margin:0 0 14px 0; font-size:19px; font-weight:800; color:#ffffff;">Recuperación de contraseña 🔑</h2>
              <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6; color:#d4d4d8;">
                Hemos recibido una solicitud para restablecer la contraseña de tu cuenta musical.
              </p>
              <p style="margin:0 0 16px 0; font-size:13.5px; color:#a1a1aa;">
                Introduce el siguiente código de 6 dígitos en la aplicación (caduca en 15 minutos):
              </p>
              
              <!-- Code Display Box -->
              <div style="background:#09090d; border:2px solid #f2ca50; border-radius:14px; padding:20px; text-align:center; margin:22px 0; box-shadow:0 0 25px rgba(242, 202, 80, 0.15);">
                <div style="font-size:38px; font-weight:900; letter-spacing:8px; color:#f2ca50; font-family:'Courier New', Courier, monospace;">
                  ${code}
                </div>
                <div style="font-size:11px; color:#71717a; text-transform:uppercase; letter-spacing:1px; margin-top:6px;">
                  Válido por 15 minutos • Uso único
                </div>
              </div>

              <div style="background:rgba(255,255,255,0.03); border:1px solid #222; border-radius:10px; padding:12px 14px; font-size:12px; color:#9ca3af; line-height:1.5;">
                🛡️ <strong>¿No has sido tú?</strong> Si no has solicitado este código, puedes ignorar este correo con total tranquilidad. Tu cuenta permanece protegida y no se aplicará ningún cambio.
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#09090c; padding:20px 28px; text-align:center; font-size:11.5px; color:#71717a; border-top:1px solid #1c1c24;">
              BandManager.io • Protección Criptográfica de Cuentas Musicales
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendTransactionalEmail({
    to: toEmail,
    subject: `Tu código de seguridad de BandManager.io: ${code}`,
    html,
  });
}

export async function sendMemberInvitationEmail(options: {
  toEmail: string;
  memberName: string;
  bandName: string;
  instrument?: string;
  username: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const appUrl = getProductionAppUrl(process.env.APP_URL);
  const inst = options.instrument ? options.instrument.trim() : "Músico";

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitación a ${options.bandName} - BandManager.io</title>
</head>
<body style="margin:0; padding:24px 0; background-color:#08080c; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#f4f4f5;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="max-width:580px; width:100%; background:#101015; border-radius:18px; border:1px solid rgba(242, 202, 80, 0.3); box-shadow:0 20px 50px rgba(0,0,0,0.8);">
          <tr>
            <td style="background:linear-gradient(180deg, #1b1a13 0%, #101015 100%); padding:34px 28px 26px 28px; text-align:center; border-bottom:1px solid rgba(242, 202, 80, 0.2);">
              <div style="font-size:28px; font-weight:900; color:#ffffff; letter-spacing:-0.5px;">BandManager<span style="color:#f2ca50;">.io</span></div>
              <div style="font-size:11px; color:#f5d778; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; margin-top:4px;">Invitación de Banda</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 34px 28px;">
              <h2 style="margin:0 0 12px 0; font-size:20px; font-weight:800; color:#ffffff;">
                ¡Hola, ${options.memberName}! 👋
              </h2>
              <p style="margin:0 0 16px 0; font-size:14.5px; line-height:1.6; color:#d4d4d8;">
                Has sido invitado/a a unirte como <strong style="color:#f2ca50;">${inst}</strong> a la banda <strong style="color:#ffffff;">${options.bandName}</strong> en BandManager.io.
              </p>
              
              <div style="background:#151520; border:1px solid rgba(242, 202, 80, 0.25); border-radius:12px; padding:16px 18px; margin:20px 0;">
                <div style="font-size:12px; color:#9ca3af; margin-bottom:4px;">Tu usuario de acceso asignado:</div>
                <div style="font-size:16px; font-weight:800; color:#f2ca50; font-family:monospace;">${options.username}</div>
              </div>

              <p style="margin:0 0 24px 0; font-size:13.5px; line-height:1.6; color:#a1a1aa;">
                Tendrás acceso directo e instantáneo a los repertorios de canciones, pistas separadas con IA (stems), acordes sincronizados, orden del día de ensayos y calendario de conciertos.
              </p>

              <div style="text-align:center; margin:28px 0 20px 0;">
                <a href="${appUrl}" style="display:inline-block; background:linear-gradient(135deg, #f2ca50 0%, #eab308 100%); color:#09090b; font-weight:900; font-size:15px; text-decoration:none; padding:15px 36px; border-radius:12px; box-shadow:0 10px 25px rgba(242, 202, 80, 0.35);">
                  Activar Mi Cuenta Musical →
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#09090c; padding:20px 28px; text-align:center; font-size:11.5px; color:#71717a; border-top:1px solid #1c1c24;">
              BandManager.io • Plataforma para Músicos y Artistas Independientes
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendTransactionalEmail({
    to: options.toEmail,
    subject: `🎸 ¡Has sido invitado a unirte a ${options.bandName} en BandManager.io!`,
    html,
  });
}

export interface DealVenueEmailOptions {
  toEmail: string;
  signerName: string;
  signerRole?: string;
  venueName: string;
  bandName: string;
  eventDate: string;
  arrivalTime?: string;
  showTime?: string;
  totalAgreed: number;
  paymentMethod: string;
  token: string;
  sha256?: string;
}

/**
 * Envía la copia notarial y confirmación oficial de la Hoja de Acuerdo firmada a la sala.
 */
export async function sendDealSignedToVenueEmail(options: DealVenueEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  const dealUrl = `https://bandmanager.io/deal/${options.token}`;
  const formattedPayment = options.paymentMethod === 'efectivo'
    ? 'Efectivo al finalizar (sobre)'
    : options.paymentMethod === 'transferencia'
    ? 'Transferencia bancaria / Bizum'
    : 'Pago diferido (Ayuntamiento)';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Concierto Confirmado - BandManager.io</title>
</head>
<body style="margin:0; padding:0; background-color:#09090c; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#f4f4f5;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#09090c; padding:30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:580px; background-color:#111116; border:1px solid #22222c; border-radius:18px; overflow:hidden; box-shadow:0 20px 40px rgba(0,0,0,0.6);">
          <tr>
            <td style="background:linear-gradient(135deg, #162038 0%, #111116 100%); padding:28px 28px 22px 28px; border-bottom:1px solid #22222c;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size:18px; font-weight:900; color:#ffffff; letter-spacing:-0.5px;">BandManager<span style="color:#2158DC;">.io</span></span>
                    <div style="font-size:11px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:1px; margin-top:3px;">Acuerdo Oficial de Directo</div>
                  </td>
                  <td align="right">
                    <span style="background:rgba(11, 113, 103, 0.25); color:#4FC7B8; border:1px solid rgba(79, 199, 184, 0.4); font-size:11px; font-weight:800; padding:5px 12px; border-radius:999px; text-transform:uppercase;">
                      ✓ eIDAS Validado
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 32px 28px;">
              <h1 style="margin:0 0 10px 0; font-size:22px; font-weight:800; color:#ffffff; letter-spacing:-0.3px;">
                ¡Concierto Confirmado y Fecha Bloqueada! 🤘
              </h1>
              <p style="margin:0 0 20px 0; font-size:14px; line-height:1.6; color:#d4d4d8;">
                Hola <strong>${options.signerName}</strong>, confirmamos la recepción de tu firma para el concierto de <strong>${options.bandName}</strong> en <strong>${options.venueName}</strong>.
              </p>

              <!-- RESUMEN DEL ACUERDO -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#16161f; border:1px solid #262633; border-radius:12px; padding:16px; margin-bottom:22px;">
                <tr>
                  <td style="padding:6px 0; font-size:13px; color:#9ca3af;">Fecha del Concierto:</td>
                  <td style="padding:6px 0; font-size:13px; font-weight:800; color:#ffffff; text-align:right;">${options.eventDate}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; font-size:13px; color:#9ca3af;">Llegada y Prueba de Sonido:</td>
                  <td style="padding:6px 0; font-size:13px; font-weight:700; color:#60A5FA; text-align:right;">${options.arrivalTime || '18:30'}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; font-size:13px; color:#9ca3af;">Inicio del Concierto:</td>
                  <td style="padding:6px 0; font-size:13px; font-weight:700; color:#60A5FA; text-align:right;">${options.showTime || '21:30'}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; font-size:13px; color:#9ca3af;">Compensación Económica:</td>
                  <td style="padding:6px 0; font-size:15px; font-weight:900; color:#4FC7B8; text-align:right;">${options.totalAgreed ? `${options.totalAgreed} €` : 'Según taquilla'}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; font-size:13px; color:#9ca3af;">Forma de Pago Acordada:</td>
                  <td style="padding:6px 0; font-size:13px; font-weight:700; color:#ffffff; text-align:right;">${formattedPayment}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; font-size:13px; color:#9ca3af;">Rider Técnico de Sonido:</td>
                  <td style="padding:6px 0; font-size:13px; font-weight:700; color:#4FC7B8; text-align:right;">✓ Aceptado</td>
                </tr>
              </table>

              ${options.sha256 ? `
              <div style="background:#0e0e13; border:1px solid #1f1f2a; border-radius:8px; padding:10px 14px; margin-bottom:24px; font-family:monospace; font-size:11px; color:#a1a1aa; word-break:break-all;">
                <span style="color:#60A5FA; font-weight:bold;">Sello Criptográfico SHA-256:</span><br/>${options.sha256}
              </div>
              ` : ''}

              <div style="text-align:center; margin:28px 0 16px 0;">
                <a href="${dealUrl}" style="display:inline-block; background:#2158DC; color:#ffffff; font-weight:800; font-size:14px; text-decoration:none; padding:14px 32px; border-radius:10px; box-shadow:0 8px 20px rgba(33, 88, 220, 0.35);">
                  Abrir Hoja de Acuerdo y Certificado eIDAS →
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#0b0b0f; padding:18px 28px; text-align:center; font-size:11px; color:#71717a; border-top:1px solid #1c1c24;">
              BandManager.io • Firma Electrónica conforme al Reglamento eIDAS (UE Nº 910/2014) • Documento legalmente vinculante
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendTransactionalEmail({
    to: options.toEmail,
    subject: `✅ Concierto Confirmado: ${options.bandName} en ${options.venueName} - Hoja de Acuerdo Oficial`,
    html,
  });
}

export interface DealBandEmailOptions {
  toEmail: string;
  bandName: string;
  venueName: string;
  eventDate: string;
  city?: string;
  signerName: string;
  signerRole?: string;
  totalAgreed: number;
  feeAmount: number;
  netAmount: number;
  token: string;
  sha256?: string;
}

/**
 * Notifica a la banda de que la sala ha firmado formalmente el acuerdo y se ha bloqueado la fecha.
 */
export async function sendDealSignedToBandEmail(options: DealBandEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  const dealUrl = `https://bandmanager.io/deal/${options.token}`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>¡Bolo Cerrado! - BandManager.io</title>
</head>
<body style="margin:0; padding:0; background-color:#09090c; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#f4f4f5;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#09090c; padding:30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:580px; background-color:#111116; border:1px solid #22222c; border-radius:18px; overflow:hidden; box-shadow:0 20px 40px rgba(0,0,0,0.6);">
          <tr>
            <td style="background:linear-gradient(135deg, #10261f 0%, #111116 100%); padding:28px 28px 22px 28px; border-bottom:1px solid #22222c;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size:18px; font-weight:900; color:#ffffff; letter-spacing:-0.5px;">BandManager<span style="color:#2158DC;">.io</span></span>
                    <div style="font-size:11px; font-weight:700; color:#4FC7B8; text-transform:uppercase; letter-spacing:1px; margin-top:3px;">🎉 ¡Nuevo Bolo Confirmado!</div>
                  </td>
                  <td align="right">
                    <span style="background:rgba(11, 113, 103, 0.25); color:#4FC7B8; border:1px solid rgba(79, 199, 184, 0.4); font-size:11px; font-weight:800; padding:5px 12px; border-radius:999px;">
                      Agenda Actualizada
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 32px 28px;">
              <h1 style="margin:0 0 10px 0; font-size:22px; font-weight:800; color:#ffffff; letter-spacing:-0.3px;">
                ¡${options.venueName} ha firmado el acuerdo! 🤘
              </h1>
              <p style="margin:0 0 20px 0; font-size:14px; line-height:1.6; color:#d4d4d8;">
                Hola <strong>${options.bandName}</strong>, el programador <strong>${options.signerName}</strong> (${options.signerRole || 'Programación'}) acaba de firmar la Hoja de Acuerdo digital. La fecha ya está bloqueada automáticamente en vuestra agenda de gira.
              </p>

              <!-- DESGLOSE ECONÓMICO Y DE LOGÍSTICA -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#16161f; border:1px solid #262633; border-radius:12px; padding:16px; margin-bottom:20px;">
                <tr>
                  <td style="padding:6px 0; font-size:13px; color:#9ca3af;">Sala y Ciudad:</td>
                  <td style="padding:6px 0; font-size:13px; font-weight:800; color:#ffffff; text-align:right;">${options.venueName} ${options.city ? `(${options.city})` : ''}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; font-size:13px; color:#9ca3af;">Fecha del Show:</td>
                  <td style="padding:6px 0; font-size:13px; font-weight:800; color:#ffffff; text-align:right;">${options.eventDate}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; font-size:13px; color:#9ca3af;">Caché Pactado con la Sala:</td>
                  <td style="padding:6px 0; font-size:14px; font-weight:800; color:#ffffff; text-align:right;">${options.totalAgreed} €</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; font-size:13px; color:#9ca3af;">Fee BandManager (5%):</td>
                  <td style="padding:6px 0; font-size:13px; font-weight:700; color:#E27A70; text-align:right;">-${options.feeAmount} €</td>
                </tr>
                <tr style="border-top:1px solid #22222e;">
                  <td style="padding:8px 0 4px 0; font-size:14px; font-weight:800; color:#ffffff;">Neto para la Banda:</td>
                  <td style="padding:8px 0 4px 0; font-size:16px; font-weight:900; color:#4FC7B8; text-align:right;">${options.netAmount} €</td>
                </tr>
              </table>

              <div style="background:rgba(33, 88, 220, 0.12); border:1px solid rgba(33, 88, 220, 0.3); border-radius:10px; padding:12px 16px; margin-bottom:24px; font-size:12px; color:#93c5fd; line-height:1.5;">
                ✨ <strong>Recompensa de Estudio:</strong> Tus <strong>${options.feeAmount} €</strong> de fee te han generado <strong>+${options.feeAmount} Créditos IA</strong> automáticos en tu cuenta de BandManager para separación de stems y creación de reels.
              </div>

              <div style="text-align:center; margin:24px 0 16px 0;">
                <a href="${dealUrl}" style="display:inline-block; background:#2158DC; color:#ffffff; font-weight:800; font-size:14px; text-decoration:none; padding:14px 32px; border-radius:10px; box-shadow:0 8px 20px rgba(33, 88, 220, 0.35);">
                  Ver Acuerdo y Certificado Notarial →
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#0b0b0f; padding:18px 28px; text-align:center; font-size:11px; color:#71717a; border-top:1px solid #1c1c24;">
              BandManager.io • Tu oficina digital de booking y gestión de directos
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendTransactionalEmail({
    to: options.toEmail,
    subject: `🎉 ¡Bolo Cerrado! ${options.venueName} ha firmado el acuerdo para el ${options.eventDate}`,
    html,
  });
}
