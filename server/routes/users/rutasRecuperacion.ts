/**
 * Recuperación de contraseña (solicitud y confirmación) y correo de prueba.
 */
import express from 'express';
import crypto from 'crypto';
import { hashPassword } from '../../auth.js';
import { loadState, saveState, requireAuth, ensureValidUserEmails } from '../../state.js';
import { INITIAL_USERS } from '../../../src/db_seed.js';
import { dbGetUsers, dbUpsertUser } from '../../db.js';
import { sendTransactionalEmail, sendPasswordResetEmail } from '../../services/transactionalEmail.js';
import { loginRateLimiter } from '../../middleware/rateLimiter.js';

const router = express.Router();

// Request password reset code
router.post(
  '/auth/reset-password/request',
  loginRateLimiter,
  async (req, res) => {
    const { emailOrUsername } = req.body;
    if (!emailOrUsername || !emailOrUsername.trim()) {
      return res
        .status(400)
        .json({ error: 'Indica tu correo electrónico o nombre de usuario' });
    }

    const state = loadState();
    const cleanInput = emailOrUsername.trim().toLowerCase();

    // Sync users from Supabase to support persistent logins across serverless restarts
    try {
      const dbUsers = await dbGetUsers();
      if (dbUsers && dbUsers.length > 0) {
        dbUsers.forEach((su: any) => {
          const idx = state.users.findIndex(
            (u: any) =>
              u.id === su.id ||
              (u.username &&
                u.username.toLowerCase().trim() ===
                  su.username?.toLowerCase().trim()) ||
              (u.email &&
                u.email.toLowerCase().trim() === su.email?.toLowerCase().trim())
          );
          if (idx !== -1) {
            state.users[idx] = { ...state.users[idx], ...su };
          } else {
            state.users.push(su);
          }
        });
        ensureValidUserEmails(state);
        saveState(state);
      }
    } catch {
      // Continue with memory state if database call fails
    }

    ensureValidUserEmails(state);

    // 1. Find user by username or email
    let user = (state.users || []).find(
      (u: any) =>
        (u.username && u.username.toLowerCase().trim() === cleanInput) ||
        (u.email && u.email.toLowerCase().trim() === cleanInput) ||
        (u.secondary_email &&
          u.secondary_email.toLowerCase().trim() === cleanInput)
    );

    // 2. If not found and input is an email, check registeredBands
    if (!user && cleanInput.includes('@')) {
      const regBandWithEmail = (state.registeredBands || []).find(
        (b: any) => b.email && b.email.toLowerCase().trim() === cleanInput
      );
      if (regBandWithEmail?.user_id) {
        user = (state.users || []).find(
          (u: any) => u.id === regBandWithEmail.user_id
        );
      }
    }

    // 3. If still not found, check seed users in INITIAL_USERS
    if (!user) {
      const seedUser = INITIAL_USERS.find(
        (iu: any) =>
          iu.username.toLowerCase().trim() === cleanInput ||
          iu.email?.toLowerCase().trim() === cleanInput
      );
      if (seedUser) {
        user = (state.users || []).find((u: any) => u.id === seedUser.id);
      }
    }

    if (!user) {
      return res.status(404).json({
        error: 'No se encontró ningún usuario con ese correo o usuario.',
      });
    }

    // Determine target email
    let targetEmail: string | null = null;
    if (cleanInput.includes('@')) {
      targetEmail = cleanInput;
    } else if (user.email && user.email.includes('@')) {
      targetEmail = user.email.trim().toLowerCase();
    } else {
      // Check registeredBands for this user
      const userBand = (state.registeredBands || []).find(
        (b: any) => b.user_id === user.id && b.email && b.email.includes('@')
      );
      if (userBand?.email) {
        targetEmail = userBand.email.trim().toLowerCase();
      } else {
        const seedUser = INITIAL_USERS.find(
          (iu: any) =>
            iu.id === user.id ||
            iu.username.toLowerCase() === user.username?.toLowerCase()
        );
        if (seedUser?.email && seedUser.email.includes('@')) {
          targetEmail = seedUser.email.trim().toLowerCase();
        }
      }
    }

    if (!targetEmail || !targetEmail.includes('@')) {
      return res.status(400).json({
        error: `La cuenta de usuario "${cleanInput}" no tiene una dirección de correo válida configurada. Por favor, introduce tu correo electrónico directamente para recuperar tu cuenta.`,
      });
    }

    // Ensure user has valid email set in state
    if (!user.email || !user.email.includes('@')) {
      user.email = targetEmail;
    }

    // Generate cryptographically secure 6 digit code
    const code = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

    // Store reset code on user object(s) with matching email/username
    const matchingUsers = (state.users || []).filter(
      (u: any) =>
        u.id === user.id ||
        (u.username && u.username.toLowerCase().trim() === cleanInput) ||
        (u.email && u.email.toLowerCase().trim() === targetEmail)
    );

    matchingUsers.forEach((u: any) => {
      u.resetCode = code;
      u.resetCodeExpires = expiresAt;
      u.resetIntentos = 0;
      if (!u.email || !u.email.includes('@')) {
        u.email = targetEmail;
      }
    });

    saveState(state);

    // Sync reset code to Supabase asynchronously
    for (const u of matchingUsers) {
      try {
        await dbUpsertUser(u);
      } catch {
        // Non-blocking
      }
    }

    // Mask email for privacy display
    const parts = targetEmail.split('@');
    let maskedEmail = targetEmail;
    if (parts.length === 2) {
      const name = parts[0];
      const domain = parts[1];
      const maskedName =
        name.length > 2
          ? `${name[0]}***${name[name.length - 1]}`
          : `${name[0]}***`;
      maskedEmail = `${maskedName}@${domain}`;
    }

    console.log(`[Password Reset] Enviando código de reseteo a ${targetEmail}...`);
    const emailRes = await sendPasswordResetEmail(targetEmail, code);

    if (!emailRes.success) {
      console.error(
        `[Password Reset] ERROR: No se pudo enviar el email a ${targetEmail}:`,
        emailRes.error
      );
      return res.status(500).json({
        error: `No se pudo entregar el correo con el código (${emailRes.error || 'error del servicio de correo'}). Por favor, revisa que la dirección sea correcta o intenta nuevamente.`,
      });
    }

    console.log(`[Password Reset] Código enviado a ${targetEmail} (ID: ${emailRes.id})`);

    return res.json({
      success: true,
      message: `Código de verificación enviado a ${maskedEmail}`,
      emailMasked: maskedEmail,
    });
  }
);

// Confirm password reset with code and new password
router.post(
  '/auth/reset-password/confirm',
  loginRateLimiter,
  async (req, res) => {
    const { emailOrUsername, code, newPassword } = req.body;

    if (!emailOrUsername || !code || !newPassword) {
      return res
        .status(400)
        .json({ error: 'Todos los campos son obligatorios.' });
    }

    if (newPassword.trim().length < 6) {
      return res.status(400).json({
        error: 'La nueva contraseña debe tener al menos 6 caracteres.',
      });
    }

    const state = loadState();
    const cleanInput = emailOrUsername.trim().toLowerCase();
    const cleanCode = String(code).trim();

    // Sync users from Supabase first
    try {
      const dbUsers = await dbGetUsers();
      if (dbUsers && dbUsers.length > 0) {
        dbUsers.forEach((su: any) => {
          const idx = state.users.findIndex(
            (u: any) =>
              u.id === su.id ||
              (u.username &&
                u.username.toLowerCase().trim() ===
                  su.username?.toLowerCase().trim()) ||
              (u.email &&
                u.email.toLowerCase().trim() === su.email?.toLowerCase().trim())
          );
          if (idx !== -1) {
            state.users[idx] = { ...state.users[idx], ...su };
          } else {
            state.users.push(su);
          }
        });
        ensureValidUserEmails(state);
        saveState(state);
      }
    } catch {
      // Continue
    }

    // Find user by username or email
    let matchingUsers = (state.users || []).filter(
      (u: any) =>
        (u.username && u.username.toLowerCase().trim() === cleanInput) ||
        (u.email && u.email.toLowerCase().trim() === cleanInput)
    );

    // SEGURIDAD: ya NO hay «alternativa» que acepte solo el código sin saber a qué cuenta
    // pertenece: con un código de 6 dígitos eso permitía probar códigos hasta acertar el de
    // cualquier usuario con uno activo. Hay que dar el identificador exacto de la cuenta.
    if (matchingUsers.length === 0) {
      return res.status(400).json({
        error: 'El código de verificación es incorrecto o ha caducado. Solicita un nuevo código.',
      });
    }

    const codigoCoincide = (u: any) => {
      if (!u.resetCode || !(u.resetCodeExpires > Date.now())) return false;
      const a = Buffer.from(String(u.resetCode));
      const b = Buffer.from(cleanCode);
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    };
    const validUser = matchingUsers.find(codigoCoincide);

    if (!validUser) {
      // Máximo 5 intentos fallidos por código: después se invalida y hay que pedir otro. Sin
      // esto, 10^6 combinaciones se podían probar en un rato.
      let invalidado = false;
      for (const u of matchingUsers) {
        if (!u.resetCode) continue;
        u.resetIntentos = (Number(u.resetIntentos) || 0) + 1;
        if (u.resetIntentos >= 5) {
          delete u.resetCode;
          delete u.resetCodeExpires;
          delete u.resetIntentos;
          invalidado = true;
        }
      }
      saveState(state);
      return res.status(invalidado ? 429 : 400).json({
        error: invalidado
          ? 'Demasiados intentos con un código incorrecto. Solicita un código nuevo.'
          : 'El código de verificación es incorrecto o ha caducado. Solicita un nuevo código.',
      });
    }

    // Hash new password
    const { hash, salt } = hashPassword(newPassword.trim());

    // Update password for all user records sharing this email/username and sync to Supabase
    for (const u of matchingUsers) {
      u.passwordHash = hash;
      u.salt = salt;
      delete u.resetCode;
      delete u.resetCodeExpires;
      delete u.resetIntentos;
      try {
        await dbUpsertUser(u);
      } catch (e) {
        console.warn('Could not sync updated password to Supabase:', e);
      }
    }

    saveState(state);

    return res.json({
      success: true,
      message:
        'Contraseña restablecida con éxito. Ya puedes iniciar sesión con tu nueva contraseña.',
    });
  }
);

// Endpoint de diagnóstico para verificar el envío de emails con Resend
router.post('/auth/test-email', requireAuth, async (req, res) => {
  const { to } = req.body;
  const user = (req as any).user;
  // Solo se puede mandar la prueba al propio correo (el admin, a cualquiera): con un destino libre
  // esto era un relé para enviar correo con la marca de la plataforma a quien se quisiera.
  const pedido = to ? String(to).trim().toLowerCase() : '';
  const propio = String(user?.email || '').trim().toLowerCase();
  if (pedido && pedido !== propio && user?.role !== 'admin') {
    return res.status(403).json({ error: 'Solo puedes enviarte la prueba a tu propio correo.' });
  }
  const targetEmail = pedido || user.email;

  if (!targetEmail || !targetEmail.includes('@')) {
    return res
      .status(400)
      .json({ error: 'Indica un email de destino válido.' });
  }

  const result = await sendTransactionalEmail({
    to: targetEmail,
    subject: '🎸 Prueba de Envío de Email - BandManager.io',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background:#09090b; color:#f4f4f5; padding:32px; border-radius:16px; max-width:600px; margin:auto; border:1px solid rgba(242, 202, 80, 0.35);">
        <div style="text-align:center; margin-bottom:20px;">
          <h1 style="color:#ffffff; font-size:24px; margin:0;">BandManager<span style="color:#f2ca50;">.io</span></h1>
        </div>
        <h2 style="color:#f2ca50; margin:0 0 16px 0;">¡El servicio de email está funcionando correctamente! 🚀</h2>
        <p>Este es un email de comprobación enviado desde BandManager.io a través de Resend.</p>
        <p style="font-size:13px; color:#a1a1aa; border-top:1px solid #27272a; padding-top:16px; margin-top:24px;">Destino: ${targetEmail} | Fecha: ${new Date().toLocaleString('es-ES')}</p>
      </div>
    `,
  });

  return res.json({
    success: result.success,
    id: result.id,
    error: result.error,
    resendConfigured: Boolean(process.env.RESEND_API_KEY),
    senderConfigured:
      process.env.SENDER_EMAIL || 'BandManager <no-reply@bandmanager.io>',
  });
});

export default router;
