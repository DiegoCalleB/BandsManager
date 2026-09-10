import { Resend } from "resend";

const toEmail = process.argv[2];
const apiKey = process.argv[3] || process.env.RESEND_API_KEY;

if (!toEmail) {
  console.log("❌ Debes indicar el correo de destino.");
  console.log("Uso: npx tsx scripts/test-email.ts tu-correo@gmail.com [re_tu_api_key]");
  process.exit(1);
}

if (!apiKey) {
  console.log("❌ Falta la API Key de Resend.");
  console.log("Pásala como segundo argumento o añádela a tu archivo .env como RESEND_API_KEY=re_...");
  process.exit(1);
}

const resend = new Resend(apiKey);

async function test() {
  console.log(`🚀 Enviando email de prueba a: ${toEmail}...`);
  try {
    const result = await resend.emails.send({
      from: "BandManager <no-reply@bandmanager.io>",
      to: toEmail,
      subject: "🎸 Probando correos de BandManager.ai",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #09090b; color: #f4f4f5; padding: 32px; border-radius: 12px; max-width: 500px; margin: 20px auto; border: 1px solid #27272a;">
          <h1 style="color: #3b82f6; margin-top: 0; font-size: 24px;">BandManager<span style="color:#ffffff">.ai</span></h1>
          <h2 style="color: #ffffff; font-size: 18px;">¡El sistema de correo funciona a la perfección! 🎉</h2>
          <p style="color: #d4d4d8; font-size: 14px; line-height: 1.5;">
            Este es un correo transaccional de prueba enviado desde tu propio dominio <strong>@bandmanager.io</strong> usando Resend.
          </p>
          <div style="background: #18181b; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 20px 0; border-radius: 4px; font-size: 13px; color: #a1a1aa;">
            ✅ Estado: Dominio verificado y SMTP listo para usuarios reales.
          </div>
          <hr style="border: 0; border-top: 1px solid #27272a; margin: 20px 0;" />
          <p style="font-size: 12px; color: #71717a; margin: 0; text-align: center;">
            Fecha del test: ${new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" })}
          </p>
        </div>
      `,
  });

    if (result.error) {
      console.error("❌ Fallo al enviar:", result.error);
    } else {
      console.log("✅ ¡EMAIL ENVIADO CON ÉXITO! ID de Resend:", result.data?.id);
      console.log("📩 Revisa la bandeja de entrada (y la de Spam por si acaso) de", toEmail);
    }
  } catch (err: any) {
    console.error("❌ Error inesperado:", err?.message || err);
  }
}

test();
