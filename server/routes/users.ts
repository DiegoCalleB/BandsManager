// Usuarios y autenticación: registro, login Google verificado, invitaciones de miembros,
// recuperación de contraseña y gestión de cuentas. Reglas de cuentas: AGENTS.md §1 «Autenticación y
// cuentas».

import express from 'express';
import { asignarInvitacion, invitacionPendiente, limpiarInvitacion, tokenInvitacionValido } from '../utils/invitacion.js';
import crypto from 'crypto';
import {
  ACTIVE_SESSIONS,
  verifyPassword,
  hashPassword,
  getSafeUsers,
} from '../auth.js';
import {
  loadState,
  saveState,
  requireAuth,
  requireLeader,
  getEpkConfigForBand,
  getUserFromRequestLocal,
  ensureValidUserEmails,
} from '../state.js';
import { INITIAL_USERS } from '../../src/db_seed.js';
import {
  dbGetUsers,
  dbUpsertUser,
  dbDeleteUser,
  dbGetUserBands,
  dbUpsertUserBand,
  dbDeleteUserBand,
  dbDeleteUserFromBand,
  dbGetRegisteredBands,
  dbUpsertRegisteredBand,
  dbDeleteRegisteredBand,
  dbUpsertEpkConfig,
  dbGetEpkLogosMap,
  normalizePlan,
  dbMigrateAllPlansToNewTiers,
  dbCleanCorruptedLeadFields,
  invalidateBandStateCache,
} from '../db.js';
import {
  sendTransactionalEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendMemberInvitationEmail,
  getProductionAppUrl,
} from '../services/transactionalEmail.js';

// Run asynchronous migration & cleanup checks on database records
dbMigrateAllPlansToNewTiers().catch(() => {});
dbCleanCorruptedLeadFields().catch(() => {});

// Normaliza un band_id para comparar/ordenar (quita el prefijo band-/reg-). Se usa sobre datos
// ya en memoria (listas de bandas disponibles, band_order), no como filtro de escritura en
// Supabase. Antes, un bandId vacío devolvía una banda por defecto en silencio, así que un registro legado
// sin band_id podía terminar agrupado/ordenado como si fuera de esa banda. Usamos un
// centinela que no coincide con ningún band_id real en vez de fallar aquí, porque esta función
// se llama en bucles .map()/.sort() sobre listas completas donde un solo registro corrupto no
// debe tumbar el listado entero de bandas de un usuario.
export function cleanBandId(bandId?: string): string {
  if (!bandId || typeof bandId !== 'string' || !bandId.trim())
    return '__sin_banda__';
  return bandId.replace(/^(band|reg)-/, '');
}

export async function buildAvailableBandsForUser(
  state: any,
  targetUser: any
): Promise<any[]> {
  if (!targetUser) return [];
  if (!state.userBands) state.userBands = [];

  const availableBands: any[] = [];
  const seenCleanBandIds = new Set<string>();

  const getLogoForBand = (bandId: string, defaultName: string) => {
    const epk = getEpkConfigForBand(state, bandId, defaultName);
    if (epk?.logoUrl && epk.logoUrl.trim().length > 0) return epk.logoUrl;
    // Comparación case-insensitive: el badge de plan (getPlanForBand, más abajo) ya normaliza a
    // minúsculas antes de comparar; esta buscaba con match exacto, así que una banda cuyo band_id
    // llevara mayúsculas (p. ej. registrada como "STOMP") no encontraba su propia fila en
    // registeredBands aquí, aunque sí la encontraba para el plan. Resultado: el badge de plan salía
    // bien pero el logo se quedaba vacío para cualquier banda.
    const cleanId = bandId
      .replace(/^(band|reg)-/, '')
      .toLowerCase()
      .trim();
    const bandInfo = (state.registeredBands || []).find((b: any) => {
      const bBid = (b.band_id || '')
        .replace(/^(band|reg)-/, '')
        .toLowerCase()
        .trim();
      const bId = (b.id || '')
        .replace(/^(band|reg)-/, '')
        .toLowerCase()
        .trim();
      return (
        b.band_id === bandId ||
        b.id === bandId ||
        bBid === cleanId ||
        bId === cleanId
      );
    });
    if (bandInfo?.logo_url && bandInfo.logo_url.trim().length > 0)
      return bandInfo.logo_url;
    if (bandInfo?.imagen_url && bandInfo.imagen_url.trim().length > 0)
      return bandInfo.imagen_url;
    return '';
  };

  const userEmail = (
    targetUser.email ||
    targetUser.username ||
    ''
  ).toLowerCase();

  const getPlanForBand = (bid: string, fallbackPlan?: string) => {
    if (!bid) return normalizePlan(fallbackPlan || 'ensayo');
    const cleanId = bid
      .replace(/^(band|reg)-/, '')
      .toLowerCase()
      .trim();
    const regBand = (state.registeredBands || []).find((b: any) => {
      const bBid = (b.band_id || '')
        .replace(/^(band|reg)-/, '')
        .toLowerCase()
        .trim();
      const bId = (b.id || '')
        .replace(/^(band|reg)-/, '')
        .toLowerCase()
        .trim();
      const bName = (b.nombre_banda || b.bandName || b.name || '')
        .toLowerCase()
        .trim();
      return (
        b.band_id === bid ||
        b.id === bid ||
        bBid === cleanId ||
        bId === cleanId ||
        (cleanId.length > 1 && bName === cleanId)
      );
    });
    return normalizePlan(regBand?.plan || fallbackPlan || 'ensayo');
  };

  // cleanBandId ya resuelve el caso de un usuario sin main_band_id NI band_id con un centinela
  // que no coincide con ninguna banda real (ver su comentario más arriba), en vez de caer en
  // una banda por defecto: una cuenta rota sin banda asignada no debe etiquetarse como
  // perteneciente a ninguna banda real.
  const mainClean = cleanBandId(targetUser.main_band_id || targetUser.band_id);

  // 1. Bands from state.userBands
  const userBandsList = state.userBands.filter(
    (ub: any) =>
      ub.user_id === targetUser.id ||
      (state.users &&
        state.users.some(
          (u: any) =>
            u.id === ub.user_id &&
            userEmail &&
            (u.email?.toLowerCase() === userEmail ||
              u.username?.toLowerCase() === userEmail)
        ))
  );

  userBandsList.forEach((ub: any) => {
    if (!ub.band_id) return;
    const cleanId = ub.band_id.replace(/^(band|reg)-/, '');
    if (seenCleanBandIds.has(cleanId)) return;
    seenCleanBandIds.add(cleanId);

    const cleanCheck = cleanId.toLowerCase().trim();
    const bandInfo = (state.registeredBands || []).find((b: any) => {
      const bBid = (b.band_id || '')
        .replace(/^(band|reg)-/, '')
        .toLowerCase()
        .trim();
      const bId = (b.id || '')
        .replace(/^(band|reg)-/, '')
        .toLowerCase()
        .trim();
      const bName = (b.nombre_banda || b.bandName || b.name || '')
        .toLowerCase()
        .trim();
      return (
        b.band_id === ub.band_id ||
        b.id === ub.band_id ||
        bBid === cleanCheck ||
        bId === cleanCheck ||
        (cleanCheck.length > 1 && bName === cleanCheck)
      );
    });
    const formattedFallback = cleanId
      ? cleanId.charAt(0).toUpperCase() + cleanId.slice(1)
      : 'Banda';
    const bandName =
      bandInfo?.nombre_banda ||
      (ub.band_id === targetUser.band_id ? targetUser.bandName : null) ||
      formattedFallback;
    const resolvedPlan = normalizePlan(
      bandInfo?.plan ||
        getPlanForBand(
          ub.band_id,
          ub.band_id === targetUser.band_id ? targetUser.plan : 'ensayo'
        )
    );
    availableBands.push({
      band_id: ub.band_id,
      bandName,
      nombre_banda: bandName,
      role: ub.role || 'member',
      userId: targetUser.id,
      plan: resolvedPlan,
      logoUrl: getLogoForBand(ub.band_id, bandName),
      is_main: cleanId === mainClean,
    });
  });

  // 2. Bands from state.registeredBands
  const registeredBandsForUser = (state.registeredBands || []).filter(
    (b: any) =>
      b.user_id === targetUser.id ||
      (b.email && b.email.toLowerCase() === userEmail)
  );
  registeredBandsForUser.forEach((b: any) => {
    const bid = b.band_id || b.id;
    if (!bid) return;
    const cleanId = bid.replace(/^(band|reg)-/, '');
    if (seenCleanBandIds.has(cleanId)) return;
    seenCleanBandIds.add(cleanId);

    const bName = b.nombre_banda || 'Banda';

    availableBands.push({
      band_id: bid,
      bandName: bName,
      nombre_banda: bName,
      role: 'leader',
      userId: targetUser.id,
      plan: normalizePlan(b.plan) || getPlanForBand(bid, 'ensayo'),
      logoUrl: getLogoForBand(bid, bName),
      is_main: cleanId === mainClean,
    });
  });

  // 3. Bands from other accounts matching same email/username
  (state.users || []).forEach((u: any) => {
    if (!u.band_id) return;
    if (
      u.id === targetUser.id ||
      (userEmail &&
        (u.email?.toLowerCase() === userEmail ||
          u.username?.toLowerCase() === userEmail))
    ) {
      const cleanId = u.band_id.replace(/^(band|reg)-/, '');
      if (seenCleanBandIds.has(cleanId)) return;
      seenCleanBandIds.add(cleanId);

      const bName = u.bandName || u.name || 'Banda';

      availableBands.push({
        band_id: u.band_id,
        bandName: bName,
        nombre_banda: bName,
        role: u.role || 'leader',
        userId: targetUser.id,
        plan: getPlanForBand(u.band_id, 'ensayo'),
        logoUrl: getLogoForBand(u.band_id, bName),
        is_main: cleanId === mainClean,
      });
    }
  });

  // 4. Current active band
  const currentBid = targetUser.band_id || `band-${cleanBandId(undefined)}`;
  const cleanCurrent = cleanBandId(currentBid);
  if (!seenCleanBandIds.has(cleanCurrent)) {
    seenCleanBandIds.add(cleanCurrent);
    const bName = targetUser.bandName || targetUser.name || 'Banda';

    availableBands.push({
      band_id: currentBid,
      bandName: bName,
      nombre_banda: bName,
      role: targetUser.role || 'leader',
      userId: targetUser.id,
      plan: getPlanForBand(currentBid, 'ensayo'),
      logoUrl: getLogoForBand(currentBid, bName),
      is_main: cleanCurrent === mainClean,
    });
  }

  // 5. If user is platform superadmin / admin, grant access to ALL registered and stored bands
  if (targetUser.role === 'admin') {
    const allBandsList = [
      ...(state.registeredBands || []),
      ...(state.bands || []),
    ];
    allBandsList.forEach((b: any) => {
      const bid = b.band_id || b.id;
      if (!bid) return;
      const cleanId = cleanBandId(bid);
      if (seenCleanBandIds.has(cleanId)) return;
      seenCleanBandIds.add(cleanId);

      const bName = b.nombre_banda || b.bandName || b.name || 'Banda';
      availableBands.push({
        band_id: bid,
        bandName: bName,
        nombre_banda: bName,
        role: 'admin',
        userId: targetUser.id,
        plan: normalizePlan(b.plan) || getPlanForBand(bid, 'cabeza_de_cartel'),
        logoUrl: getLogoForBand(bid, bName),
        is_main: cleanId === mainClean,
      });
    });
  }

  // Trae de Supabase, de una sola vez, el logo real de cada banda de la lista. getLogoForBand ya
  // resuelve casi todos los casos con lo que hay en memoria (state.epkConfigsByBand/registeredBands),
  // pero ese caché en memoria solo tiene una banda si ya ha sido la activa en ESTE proceso: recién
  // logueado, tras un redeploy, o si el usuario nunca la ha tenido activa en esta instancia, se
  // quedaba vacío aunque el logo existiera en Supabase. Esta consulta no depende de ese caché.
  try {
    const logosMap = await dbGetEpkLogosMap(
      availableBands.map((b) => b.band_id)
    );
    availableBands.forEach((b) => {
      const clean = b.band_id
        .replace(/^(band|reg)-/, '')
        .toLowerCase()
        .trim();
      if (logosMap[clean]) {
        b.logoUrl = logosMap[clean];
      }
    });
  } catch (_) {
    // Non-blocking: si Supabase falla aquí, se queda con lo que ya había resuelto getLogoForBand.
  }

  // Sort available bands:
  // 1. If band_order exists, use that order.
  // 2. Otherwise, main band comes first.
  const orderList = Array.isArray(targetUser.band_order)
    ? targetUser.band_order.map((id: string) => cleanBandId(id))
    : [];
  availableBands.sort((a, b) => {
    const aClean = cleanBandId(a.band_id);
    const bClean = cleanBandId(b.band_id);
    if (orderList.length > 0) {
      const aIdx = orderList.indexOf(aClean);
      const bIdx = orderList.indexOf(bClean);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
    }
    if (a.is_main && !b.is_main) return -1;
    if (!a.is_main && b.is_main) return 1;
    return 0;
  });

  return availableBands;
}
import { loginRateLimiter, registroRateLimiter } from '../middleware/rateLimiter.js';
import { verificarAccessTokenDeGoogle } from '../utils/googleVerify.js';
import {
  getTargetBandId,
  puedeEscribirEnBanda,
  bandaSolicitada,
} from '../utils/bandAccess.js';

/**
 * ¿Comparte este usuario alguna banda con quien hace la petición?
 *
 * Las rutas que buscan al usuario por id lo hacen sobre state.users entero, que es la lista de
 * TODA la plataforma. Sin esta comprobación, el id de alguien de otra banda bastaba para
 * editarlo (y en /users/:id, para ponerle una contraseña nueva).
 */
function compartenBanda(
  state: any,
  usuarioObjetivo: any,
  req: express.Request
): boolean {
  if (!usuarioObjetivo) return false;
  const bandas = new Set<string>();
  if (usuarioObjetivo.band_id) bandas.add(usuarioObjetivo.band_id);
  (state.userBands || []).forEach((ub: any) => {
    if (ub.user_id === usuarioObjetivo.id && ub.band_id) bandas.add(ub.band_id);
  });
  return Array.from(bandas).some((b) => puedeEscribirEnBanda(req, b));
}
/**
 * ¿Puede quien hace la petición fijar la contraseña de OTRO usuario?
 *
 * Antes bastaba compartir banda con él, y compartir banda se conseguía a voluntad: un líder
 * (todo el mundo lo es en su banda) añadía a la víctima a la suya con POST /users y le cambiaba
 * la contraseña. Ahora solo se puede si la cuenta es de la banda y de nadie más: una invitación
 * aún sin activar, o un miembro cuya ÚNICA banda es esta. Una cuenta con banda propia (o admin)
 * nunca se resetea desde fuera.
 */
function puedeRestablecerContrasenaDe(state: any, usuarioObjetivo: any, req: express.Request): boolean {
  if (!usuarioObjetivo || usuarioObjetivo.role === 'admin') return false;
  const bandas = new Set<string>();
  const anotar = (id?: string) => {
    if (id) bandas.add(cleanBandId(id));
  };
  anotar(usuarioObjetivo.band_id);
  anotar(usuarioObjetivo.main_band_id);
  (Array.isArray(usuarioObjetivo.band_order) ? usuarioObjetivo.band_order : []).forEach(anotar);
  (state.userBands || []).forEach((ub: any) => {
    if (ub.user_id === usuarioObjetivo.id) anotar(ub.band_id);
  });
  if (bandas.size === 0) return false;
  // Todas sus bandas tienen que ser bandas donde quien pide puede escribir.
  return Array.from(bandas).every((b) => puedeEscribirEnBanda(req, b)) &&
    // ...y no puede ser dueño de una banda registrada aparte.
    !(state.registeredBands || []).some(
      (rb: any) => rb.user_id === usuarioObjetivo.id && !puedeEscribirEnBanda(req, rb.band_id || rb.id)
    );
}
import { generateUniqueSlugId, slugify } from '../utils/slug.js';

const router = express.Router();

// Register new band & user
router.post('/auth/register', registroRateLimiter, async (req, res) => {
  const { bandName, email, password, plan, leaderName } = req.body;

  if (!bandName || !email || !password) {
    return res
      .status(400)
      .json({ error: 'Nombre de banda, email y contraseña son requeridos' });
  }

  const state = loadState();
  const cleanEmail = email.trim().toLowerCase();
  const rawBandName = bandName.trim();

  // Sync users from Supabase to ensure fresh state across restarts
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
    }
  } catch (err) {
    // Non-blocking
  }
  ensureValidUserEmails(state);

  // Check if existing users exist for this email
  const existingUsersWithEmail = state.users.filter(
    (u: any) =>
      u.username.toLowerCase() === cleanEmail ||
      u.email?.toLowerCase() === cleanEmail
  );

  if (existingUsersWithEmail.length > 0) {
    // If user exists, check if password matches existing account
    const matchesAnyPassword = existingUsersWithEmail.some((u: any) =>
      verifyPassword(password, u.passwordHash, u.salt)
    );

    if (!matchesAnyPassword) {
      return res.status(400).json({
        error:
          'Este correo electrónico ya está registrado. Introduce la contraseña correcta de tu cuenta para añadir una nueva banda.',
      });
    }

    // Check if this exact band name is already registered for this user
    const alreadyRegisteredSameBand = existingUsersWithEmail.some(
      (u: any) =>
        (u.bandName || u.name || '').toLowerCase() === rawBandName.toLowerCase()
    );

    if (alreadyRegisteredSameBand) {
      return res.status(400).json({
        error: `Ya tienes una banda registrada con el nombre "${rawBandName}".`,
      });
    }
  }

  const isExistingUser = existingUsersWithEmail.length > 0;
  const selectedPlan = 'promo'; // Toda nueva banda se registra exclusivamente en plan promo

  // Gather existing IDs across state to prevent duplicate collisions
  const existingIds = new Set<string>();
  (state.users || []).forEach((u: any) => {
    if (u.id) existingIds.add(u.id);
    if (u.band_id) existingIds.add(u.band_id);
  });
  (state.registeredBands || []).forEach((b: any) => {
    if (b.id) existingIds.add(b.id);
    if (b.band_id) existingIds.add(b.band_id);
  });

  // Generate clean, personalized IDs
  const bandId = generateUniqueSlugId('band', rawBandName, existingIds);
  existingIds.add(bandId);

  const regId = generateUniqueSlugId('reg', rawBandName, existingIds);
  existingIds.add(regId);

  let userToUse: any;
  let isNewUserCreated = false;

  if (isExistingUser) {
    userToUse = existingUsersWithEmail[0];
    // Update active band to the newly created one
    userToUse.band_id = bandId;
    userToUse.bandName = rawBandName;
    if (!userToUse.main_band_id) {
      userToUse.main_band_id = bandId;
    }
    if (Array.isArray(userToUse.band_order)) {
      const cleanBId = cleanBandId(bandId);
      userToUse.band_order = [
        cleanBId,
        ...userToUse.band_order.filter(
          (b: string) => cleanBandId(b) !== cleanBId
        ),
      ];
    } else {
      userToUse.band_order = [cleanBandId(bandId)];
    }
  } else {
    const { hash, salt } = hashPassword(password);
    const emailUserPart = cleanEmail.split('@')[0] || rawBandName;
    const defaultName =
      emailUserPart.charAt(0).toUpperCase() + emailUserPart.slice(1);
    const userId = generateUniqueSlugId(
      'user',
      `${emailUserPart}-${slugify(rawBandName)}`,
      existingIds
    );
    existingIds.add(userId);

    userToUse = {
      id: userId,
      username: cleanEmail,
      name: leaderName ? leaderName.trim() : defaultName,
      bandName: rawBandName,
      email: cleanEmail,
      role: 'leader',
      plan: selectedPlan,
      instrument: `Líder de ${rawBandName}`,
      avatarColor: '#f2ca50',
      passwordHash: hash,
      salt: salt,
      band_id: bandId,
      main_band_id: bandId,
      band_order: [cleanBandId(bandId)],
      createdAt: new Date().toISOString(),
    };

    state.users.push(userToUse);
    isNewUserCreated = true;
  }

  // Generate session token
  const token = crypto.randomBytes(32).toString('hex');
  const sessionObj = { userId: userToUse.id, createdAt: Date.now() };
  ACTIVE_SESSIONS[token] = sessionObj;
  if (!state.sessions) state.sessions = {};
  state.sessions[token] = sessionObj;

  saveState(state);

  // Save band register data to Supabase in correct foreign key order
  try {
    const newRegisteredBandRecord = {
      id: regId,
      band_id: bandId,
      user_id: userToUse.id,
      fecha_registro: new Date().toISOString(),
      nombre_banda: rawBandName,
      email: cleanEmail,
      plan: selectedPlan,
      contacto_nombre: rawBandName,
      estilo_musical: 'Por definir',
      localizacion: 'España',
      telefono: '',
      instagram: '',
      spotify_youtube: '',
      aforo_promedio: 0,
      estado_cuenta: 'activo',
      notas: `Plan seleccionado: ${selectedPlan}. Registrado desde BANDMANAGER.io web app.`,
    };
    if (!state.registeredBands) state.registeredBands = [];
    state.registeredBands.push(newRegisteredBandRecord);

    if (!state.userBands) state.userBands = [];
    const hasUB = state.userBands.some(
      (ub: any) => ub.user_id === userToUse.id && ub.band_id === bandId
    );
    const newUB = hasUB
      ? state.userBands.find(
          (ub: any) => ub.user_id === userToUse.id && ub.band_id === bandId
        )
      : {
          id: `ub-${userToUse.id}-${bandId}`,
          user_id: userToUse.id,
          band_id: bandId,
          role: 'leader',
          createdAt: new Date().toISOString(),
        };
    if (!hasUB) {
      state.userBands.push(newUB);
    }

    saveState(state);

    // 1. Upsert registered band
    await dbUpsertRegisteredBand(newRegisteredBandRecord);
    // 2. Upsert user (ensures user exists in users table)
    await dbUpsertUser(userToUse);
    // 3. Upsert userBand relationship
    await dbUpsertUserBand(newUB);
  } catch (sheetErr) {
    console.warn(
      'Notice: Band registration saved locally, Supabase update skipped or pending:',
      sheetErr
    );
  }

  // Calculate availableBands dynamically
  const availableBands = await buildAvailableBandsForUser(state, userToUse);

  res.cookie('bandmanager_token', token, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    // httpOnly=false A PROPÓSITO: el cliente también lee/escribe el token (localStorage + cookie, ver sessionCookie.ts);
    // pasar a httpOnly exige migrar todo el cliente a sesión solo por cookie (BACKLOG.md).
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  // Enviar email de bienvenida y confirmación de registro
  if (cleanEmail && cleanEmail.includes('@')) {
    try {
      console.log(
        `[Registro] Despachando email de bienvenida a ${cleanEmail} para la banda "${rawBandName}"...`
      );
      const emailResult = await sendWelcomeEmail(
        cleanEmail,
        userToUse.name,
        rawBandName
      );
      if (emailResult.success) {
        console.log(
          `[Registro] Email de bienvenida entregado con éxito a ${cleanEmail} (ID: ${emailResult.id})`
        );
      } else {
        console.warn(
          `[Registro] Aviso: No se pudo entregar el email de bienvenida a ${cleanEmail}: ${emailResult.error}`
        );
      }
    } catch (err: any) {
      console.error(
        `[Registro] Error al enviar email de bienvenida a ${cleanEmail}:`,
        err?.message || err
      );
    }
  }

  const { passwordHash, salt: _, ...safeUser } = userToUse;
  res.status(201).json({
    token,
    user: safeUser,
    availableBands,
    multipleBands: availableBands.length > 1,
  });
});

// Endpoint to fetch all registered bands from Supabase
const handleGetRegisteredBands = async (req: any, res: any) => {
  try {
    const userBandId = req.user?.band_id;
    // Antes, cualquier miembro (no solo admins) de la banda insignia veía la lista completa de
    // TODAS las bandas registradas en la plataforma -de cualquier cliente-, no solo la suya.
    const isAdmin = req.user?.role === 'admin';

    const bands = await dbGetRegisteredBands();

    const filteredBands = isAdmin
      ? bands
      : bands.filter(
          (b: any) =>
            b.band_id === userBandId ||
            b.id === userBandId ||
            b.id === `reg-${userBandId.replace('band-', '')}` ||
            (req.user?.email &&
              b.email?.toLowerCase() === req.user.email.toLowerCase())
        );

    res.json({ registeredBands: filteredBands });
  } catch (err: any) {
    console.error('Error fetching registered bands:', err);
    res
      .status(500)
      .json({ error: 'No se pudieron obtener las bandas registradas.' });
  }
};

router.get('/registered-bands', requireAuth, handleGetRegisteredBands);
router.get('/users/registered-bands', requireAuth, handleGetRegisteredBands);

// Check invitation for activating added members
// loginRateLimiter: es una ruta abierta que responde por email, o sea un comprobador de si un
// correo está registrado. Con el límite, al menos no se puede repasar una lista entera.
router.post('/auth/check-invitation', loginRateLimiter, async (req, res) => {
  const { email, token } = req.body;
  if (!email) {
    return res
      .status(400)
      .json({ error: 'El correo electrónico es requerido.' });
  }

  const state = loadState();
  const cleanEmail = email.trim().toLowerCase();

  const user = state.users.find(
    (u: any) =>
      (u.email && u.email.toLowerCase() === cleanEmail) ||
      u.username.toLowerCase() === cleanEmail
  );

  // Solo se contesta por invitaciones sin estrenar. Antes contestaba por cualquier usuario
  // registrado y devolvía su nombre, su usuario y las bandas a las que pertenece, que es más de
  // lo que hace falta para activar una cuenta y bastante de lo que hace falta para suplantarla.
  // Además del correo hace falta el token que solo viaja en el enlace de la invitación: saber el
  // correo de alguien ya no basta para activar (ni para ver) su cuenta.
  if (!user || !invitacionPendiente(user) || !tokenInvitacionValido(user, token)) {
    return res.status(404).json({
      error:
        'No se ha encontrado ninguna invitación válida para este correo. Usa el enlace de tu correo de invitación, o pide al director de tu banda que te la reenvíe desde el apartado de Miembros.',
    });
  }

  // Find all bands this user belongs to
  if (!state.userBands) state.userBands = [];
  const userBandsList = state.userBands.filter(
    (ub: any) => ub.user_id === user.id
  );

  const bands = userBandsList.map((ub: any) => {
    const bandInfo = (state.registeredBands || []).find(
      (b: any) => b.band_id === ub.band_id
    );
    return {
      band_id: ub.band_id,
      bandName: bandInfo?.nombre_banda || user.bandName || 'Tu banda',
      role: ub.role || 'member',
    };
  });

  res.json({
    success: true,
    name: user.name,
    username: user.username,
    email: user.email || cleanEmail,
    bands,
  });
});

// Activate added member (set password & username)
router.post('/auth/activate-member', loginRateLimiter, async (req, res) => {
  const { email, username, name, password, token: tokenInvitacion } = req.body;

  if (!email || !username || !name || !password) {
    return res.status(400).json({
      error: 'Todos los campos son requeridos para activar tu cuenta.',
    });
  }

  const state = loadState();
  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim().toLowerCase();

  const user = state.users.find(
    (u: any) =>
      (u.email && u.email.toLowerCase() === cleanEmail) ||
      u.username.toLowerCase() === cleanEmail
  );

  if (!user) {
    return res
      .status(404)
      .json({ error: 'Usuario no encontrado para activación.' });
  }

  // Solo se activa lo que está sin activar. Esta ruta sobrescribe la contraseña de la cuenta y
  // devuelve una sesión abierta, y no comprobaba nada más que el email: bastaba con saber el de
  // cualquiera (el del director de la banda, por ejemplo) para quedarse con su cuenta.
  if (!invitacionPendiente(user)) {
    return res.status(409).json({
      error:
        'Esta cuenta ya está activada. Si has olvidado tu contraseña, usa la opción de recuperarla en la pantalla de acceso.',
    });
  }
  // El token del enlace de invitación es lo que prueba que quien activa es la persona invitada.
  if (!tokenInvitacionValido(user, tokenInvitacion)) {
    return res.status(403).json({
      error:
        'El enlace de invitación no es válido o ha caducado. Pide al director de tu banda que te la reenvíe.',
    });
  }

  // Check if chosen username is already taken by a different user
  const usernameTaken = state.users.some(
    (u: any) => u.id !== user.id && u.username.toLowerCase() === cleanUsername
  );

  if (usernameTaken) {
    return res.status(400).json({
      error: 'El nombre de usuario ya está registrado por otra persona.',
    });
  }

  // Hash new password
  const { hash, salt } = hashPassword(password);

  user.name = name.trim();
  user.username = cleanUsername;
  user.email = cleanEmail;
  user.passwordHash = hash;
  user.salt = salt;
  limpiarInvitacion(user);

  // Generate session token
  const token = crypto.randomBytes(32).toString('hex');
  const sessionObj = { userId: user.id, createdAt: Date.now() };
  ACTIVE_SESSIONS[token] = sessionObj;
  if (!state.sessions) state.sessions = {};
  state.sessions[token] = sessionObj;

  saveState(state);

  // Sync to Supabase asynchronously
  try {
    await dbUpsertUser(user);
  } catch (err) {
    console.warn(
      'Notice: Activated user updated locally, Supabase sync pending:',
      err
    );
  }

  // Compute available bands
  if (!state.userBands) state.userBands = [];
  const userBandsList = state.userBands.filter(
    (ub: any) => ub.user_id === user.id
  );
  const availableBands = userBandsList.map((ub: any) => {
    const bandInfo = (state.registeredBands || []).find(
      (b: any) => b.band_id === ub.band_id
    );
    return {
      band_id: ub.band_id,
      bandName: bandInfo?.nombre_banda || 'Banda',
      role: ub.role || 'member',
      userId: user.id,
    };
  });

  res.cookie('bandmanager_token', token, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    // httpOnly=false A PROPÓSITO: el cliente también lee/escribe el token (localStorage + cookie, ver sessionCookie.ts);
    // pasar a httpOnly exige migrar todo el cliente a sesión solo por cookie (BACKLOG.md).
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  const { passwordHash: _, salt: __, ...safeUser } = user;
  res.json({ token, user: safeUser, availableBands });
});

// Google Social OAuth Login / Registration
router.post('/auth/google', loginRateLimiter, async (req, res) => {
  const {
    email,
    name,
    uid: uidDelCliente,
    accessToken,
    bandName: inputBandName,
    leaderName,
  } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email de Google es requerido' });
  }

  // SEGURIDAD: el email y el uid del cuerpo no valen nada por sí solos (cualquiera puede escribir
  // el email de otra cuenta). Solo se acepta lo que Google confirma sobre el access token.
  let uid: string;
  let cleanEmail: string;
  try {
    const identidad = await verificarAccessTokenDeGoogle(accessToken, {
      emailDeclarado: email,
      subDeclarado: uidDelCliente,
    });
    uid = identidad.sub;
    cleanEmail = identidad.email;
  } catch (e: any) {
    console.warn('[auth/google] Verificación rechazada:', e?.message || e);
    return res.status(401).json({ error: 'No se pudo verificar tu cuenta de Google. Inténtalo de nuevo.' });
  }

  const state = loadState();

  // Sync users from Supabase
  try {
    const dbUsers = await dbGetUsers();
    if (dbUsers && dbUsers.length > 0) {
      dbUsers.forEach((su: any) => {
        const idx = state.users.findIndex(
          (u: any) =>
            u.id === su.id ||
            (u.email && u.email.toLowerCase() === su.email?.toLowerCase())
        );
        if (idx !== -1) {
          state.users[idx] = { ...state.users[idx], ...su };
        } else {
          state.users.push(su);
        }
      });
      saveState(state);
    }
  } catch (err) {
    // Continue with state
  }

  // Find existing user by email or google uid
  let user = state.users.find(
    (u: any) =>
      (u.email && u.email.toLowerCase() === cleanEmail) ||
      (u.secondary_email && u.secondary_email.toLowerCase() === cleanEmail) ||
      (u.username && u.username.toLowerCase() === cleanEmail) ||
      (uid && u.googleUid === uid)
  );

  const customBandName =
    inputBandName?.trim() || (leaderName ? `Banda de ${leaderName}` : null);

  if (user) {
    // Update existing user with googleUid / authProvider if not set
    user.googleUid = uid || user.googleUid;
    user.authProvider = 'google';
    if (name && (!user.name || user.name === user.username)) {
      user.name = name;
    }

    // If a new band name was explicitly requested during registration with existing email
    if (customBandName) {
      const existingIds = new Set<string>();
      (state.users || []).forEach((u: any) => {
        if (u.id) existingIds.add(u.id);
        if (u.band_id) existingIds.add(u.band_id);
      });
      (state.registeredBands || []).forEach((b: any) => {
        if (b.id) existingIds.add(b.id);
        if (b.band_id) existingIds.add(b.band_id);
      });

      const bandId = generateUniqueSlugId('band', customBandName, existingIds);

      const regBand = {
        id: `reg-${bandId.replace('band-', '')}`,
        band_id: bandId,
        nombre_banda: customBandName,
        contacto_nombre: user.name || leaderName || cleanEmail.split('@')[0],
        email: cleanEmail,
        plan: 'promo',
        fecha_registro: new Date().toISOString(),
        estado_cuenta: 'activo',
        notas: 'Registrado con Google OAuth (Nueva Banda)',
      };
      if (!state.registeredBands) state.registeredBands = [];
      state.registeredBands.push(regBand);

      user.bandName = customBandName;
      user.band_id = bandId;
      user.role = 'leader';

      if (!state.userBands) state.userBands = [];
      const newUB = {
        id: `ub-${user.id}-${bandId}`,
        user_id: user.id,
        band_id: bandId,
        role: 'leader',
      };
      state.userBands.push(newUB);

      try {
        await dbUpsertUserBand(newUB);
        await dbUpsertRegisteredBand(regBand);
        await dbUpsertUser(user);
      } catch (e) {
        console.warn('Notice: Supabase sync warning:', e);
      }
    } else {
      // Regular Google Login: default to main or favorite band. Antes, sin ninguna banda propia
      // todavía, se caía en una banda por defecto en silencio.
      const preferredBandId =
        user.main_band_id ||
        (Array.isArray(user.band_order) && user.band_order.length > 0
          ? user.band_order[0]
          : null) ||
        user.band_id;

      const normalizedBandId = preferredBandId
        ? preferredBandId.startsWith('band-') ||
          preferredBandId.startsWith('reg-')
          ? preferredBandId
          : `band-${preferredBandId}`
        : undefined;
      user.band_id = normalizedBandId;
      if (!user.main_band_id) {
        user.main_band_id = normalizedBandId;
      }

      const cleanPref = normalizedBandId
        ? cleanBandId(normalizedBandId)
        : undefined;
      const bandInfo = !cleanPref
        ? undefined
        : (state.registeredBands || []).find(
            (b: any) =>
              b.band_id === user.band_id ||
              b.id === user.band_id ||
              cleanBandId(b.band_id) === cleanPref ||
              cleanBandId(b.id) === cleanPref
          ) ||
          (state.bands || []).find(
            (b: any) =>
              b.band_id === user.band_id ||
              b.id === user.band_id ||
              cleanBandId(b.band_id) === cleanPref ||
              cleanBandId(b.id) === cleanPref
          );

      if (bandInfo) {
        user.bandName =
          bandInfo.nombre_banda ||
          bandInfo.bandName ||
          bandInfo.name ||
          user.bandName;
        if (bandInfo.plan) {
          user.plan = normalizePlan(bandInfo.plan);
        }
      }
    }
  } else {
    // Auto-register new user authenticated with Google OAuth
    const newUserId = uid || `user-google-${Date.now()}`;
    const cleanName =
      leaderName || name || cleanEmail.split('@')[0] || 'Miembro Banda';
    const finalBandName = customBandName || `Banda de ${cleanName}`;

    // Gather existing IDs across state to prevent collisions
    const existingIds = new Set<string>();
    (state.users || []).forEach((u: any) => {
      if (u.id) existingIds.add(u.id);
      if (u.band_id) existingIds.add(u.band_id);
    });
    (state.registeredBands || []).forEach((b: any) => {
      if (b.id) existingIds.add(b.id);
      if (b.band_id) existingIds.add(b.band_id);
    });

    const bandId = generateUniqueSlugId('band', finalBandName, existingIds);
    existingIds.add(bandId);

    // Register new band
    const regBand = {
      id: `reg-${bandId.replace('band-', '')}`,
      band_id: bandId,
      nombre_banda: finalBandName,
      contacto_nombre: cleanName,
      email: cleanEmail,
      plan: 'promo',
      fecha_registro: new Date().toISOString(),
      estado_cuenta: 'activo',
      notas: 'Registrado con Google OAuth',
    };
    if (!state.registeredBands) state.registeredBands = [];
    state.registeredBands.push(regBand);

    user = {
      id: newUserId,
      username: cleanEmail,
      email: cleanEmail,
      name: cleanName,
      bandName: finalBandName,
      band_id: bandId,
      main_band_id: bandId,
      band_order: [cleanBandId(bandId)],
      role: 'leader',
      plan: 'promo',
      createdAt: new Date().toISOString(),
      googleUid: uid,
      authProvider: 'google',
    };

    if (!state.users) state.users = [];
    state.users.push(user);

    // Sync user-band relationship
    if (!state.userBands) state.userBands = [];
    const newUB = {
      id: `ub-${user.id}-${bandId}`,
      user_id: user.id,
      band_id: bandId,
      role: 'leader',
    };
    state.userBands.push(newUB);

    try {
      await dbUpsertUserBand(newUB);
      await dbUpsertRegisteredBand(regBand);
      await dbUpsertUser(user);
    } catch (err) {
      console.warn('Could not sync new Google user and band to Supabase:', err);
    }
  }

  if (accessToken) {
    user.googleAccessToken = accessToken;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const sessionObj = {
    userId: user.id,
    googleAccessToken: accessToken,
    createdAt: Date.now(),
  };
  ACTIVE_SESSIONS[token] = sessionObj;
  if (!state.sessions) state.sessions = {};
  state.sessions[token] = sessionObj;

  saveState(state);

  const availableBands = await buildAvailableBandsForUser(state, user);
  const { passwordHash: _, salt: __, ...safeUser } = user;

  res.cookie('bandmanager_token', token, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    // httpOnly=false A PROPÓSITO: el cliente también lee/escribe el token (localStorage + cookie, ver sessionCookie.ts);
    // pasar a httpOnly exige migrar todo el cliente a sesión solo por cookie (BACKLOG.md).
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  res.json({ token, user: safeUser, availableBands });
});

/**
 * Garantiza la cuenta de administración global.
 *
 * La contraseña sale SOLO de `ADMIN_PASSWORD` (variable de entorno). Antes estaba escrita en el
 * código y se reimponía en cada arranque y en cada login «admin»: quien la leyera en el repositorio
 * entraba como admin y ningún cambio de contraseña duraba. Ahora:
 *  - con `ADMIN_PASSWORD` (≥ 12 caracteres): crea el admin si falta, o actualiza su contraseña
 *    únicamente si ha cambiado la variable (así se rota la clave);
 *  - sin ella: NO crea ningún admin y NO toca las credenciales del existente.
 */
export async function ensureAdminUserExists(state: any) {
  try {
    const adminPass = process.env.ADMIN_PASSWORD || '';
    const hayClaveValida = adminPass.length >= 12;
    if (adminPass && !hayClaveValida) {
      console.warn('[admin] ADMIN_PASSWORD es demasiado corta (mínimo 12 caracteres): se ignora.');
    }

    let adminUser = (state.users || []).find(
      (u: any) =>
        (u.username && u.username.toLowerCase() === 'admin') ||
        (u.email && u.email.toLowerCase() === 'admin@bandmanager.ai')
    );

    if (!adminUser && !hayClaveValida) {
      console.warn('[admin] No hay cuenta admin y ADMIN_PASSWORD no está definida: no se crea ninguna.');
      return null;
    }

    let cambiado = false;
    if (adminUser) {
      if (hayClaveValida && !(adminUser.passwordHash && adminUser.salt && verifyPassword(adminPass, adminUser.passwordHash, adminUser.salt))) {
        const { hash, salt } = hashPassword(adminPass);
        adminUser.passwordHash = hash;
        adminUser.salt = salt;
        cambiado = true;
      } else if (!hayClaveValida) {
        console.warn('[admin] ADMIN_PASSWORD no está definida: las credenciales del admin no se modifican.');
      }
      if (adminUser.role !== 'admin') {
        adminUser.role = 'admin';
        cambiado = true;
      }
    } else {
      const { hash, salt } = hashPassword(adminPass);
      adminUser = {
        id: 'user-admin-global',
        username: 'Admin',
        email: 'admin@bandmanager.ai',
        name: 'Administrador Global',
        role: 'admin',
        plan: 'cabeza_de_cartel',
        bandName: 'Vértice',
        band_id: 'band-vertice',
        main_band_id: 'band-vertice',
        band_order: ['vertice'],
        avatarColor: '#ec4899',
        passwordHash: hash,
        salt: salt,
        createdAt: new Date().toISOString(),
      };
      if (!state.users) state.users = [];
      state.users.push(adminUser);
      cambiado = true;
    }

    if (cambiado) {
      try {
        const { getSupabase } = await import('../db/core.js');
        const sb = getSupabase();
        const { data: dbAdmin } = await sb
          .from('users')
          .select('id')
          .or('username.ilike.admin,email.ilike.admin@bandmanager.ai')
          .maybeSingle();
        if (dbAdmin?.id) {
          adminUser.id = dbAdmin.id;
        }
      } catch {
        // Ignorar si Supabase no está disponible en este momento
      }

      saveState(state);
      await dbUpsertUser(adminUser).catch((err: any) =>
        console.warn('Supabase admin upsert notice:', err)
      );
    }
    return adminUser;
  } catch (err) {
    console.warn('Could not ensure admin user:', err);
    return null;
  }
}

// Login
router.post('/auth/login', loginRateLimiter, async (req, res) => {
  const { username, password, band_id } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: 'Usuario y contraseña son requeridos' });
  }

  const state = loadState();
  const cleanInput = username.trim().toLowerCase();

  // Sync users from Supabase to support persistent logins across serverless restarts
  try {
    const dbUsers = await dbGetUsers();
    if (dbUsers && dbUsers.length > 0) {
      dbUsers.forEach((su: any) => {
        const idx = state.users.findIndex(
          (u: any) =>
            u.id === su.id ||
            (u.username &&
              u.username.toLowerCase() === su.username?.toLowerCase())
        );
        if (idx !== -1) {
          if (su.passwordHash) state.users[idx].passwordHash = su.passwordHash;
          if (su.salt) state.users[idx].salt = su.salt;
          if (su.plan) state.users[idx].plan = normalizePlan(su.plan);
          if (su.role) state.users[idx].role = su.role;
          if (su.band_id) state.users[idx].band_id = su.band_id;
          if (su.bandName) state.users[idx].bandName = su.bandName;
          if (su.main_band_id) state.users[idx].main_band_id = su.main_band_id;
          // Las preferencias de interfaz (disposición del dashboard...) viven también en Supabase:
          // tras un redeploy el estado local arranca vacío y, sin esto, /auth/me devolvía el
          // usuario sin ellas y el panel volvía al de por defecto. Lo local manda por clave.
          if (su.ui_preferences && Object.keys(su.ui_preferences).length > 0) {
            state.users[idx].ui_preferences = {
              ...su.ui_preferences,
              ...(state.users[idx].ui_preferences || {}),
            };
          }
        } else {
          state.users.push(su);
        }
      });
      saveState(state);
    }
  } catch (err) {
    // Continue with memory state if database call fails
  }

  // Find all user records matching this username or email
  const matchingUsers = state.users.filter(
    (u: any) =>
      (u.username && u.username.toLowerCase() === cleanInput) ||
      (u.email && u.email.toLowerCase() === cleanInput) ||
      (u.secondary_email && u.secondary_email.toLowerCase() === cleanInput)
  );

  if (matchingUsers.length === 0) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }

  // Filter those that pass password check
  const validUsers = matchingUsers.filter((u: any) => {
    return verifyPassword(password, u.passwordHash, u.salt);
  });

  if (validUsers.length === 0) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }

  // Choose target user profile & default to main or favorite band.
  const userMainBand =
    validUsers.find((u: any) => u.main_band_id)?.main_band_id ||
    validUsers[0]?.main_band_id ||
    (Array.isArray(validUsers[0]?.band_order) &&
    validUsers[0].band_order.length > 0
      ? validUsers[0].band_order[0]
      : null) ||
    validUsers[0]?.band_id;

  // SEGURIDAD: `band_id` viene del cuerpo. Solo se respeta si es una banda DE ESE USUARIO; antes
  // cualquiera con una cuenta propia podía iniciar sesión «dentro» de la banda de otro (y como su
  // líder) mandando su band_id en el login.
  const bandasDelUsuario = new Set<string>();
  const anotarBanda = (id?: string) => {
    if (id) bandasDelUsuario.add(cleanBandId(id));
  };
  validUsers.forEach((u: any) => {
    anotarBanda(u.band_id);
    anotarBanda(u.main_band_id);
    (Array.isArray(u.band_order) ? u.band_order : []).forEach(anotarBanda);
  });
  (state.userBands || []).forEach((ub: any) => {
    if (validUsers.some((u: any) => u.id === ub.user_id)) anotarBanda(ub.band_id);
  });
  const esAdminGlobal = validUsers.some((u: any) => u.role === 'admin');
  const puedeElegirBanda = (id?: string) =>
    !!id && (esAdminGlobal || bandasDelUsuario.has(cleanBandId(id)));
  if (band_id && !puedeElegirBanda(band_id)) {
    console.warn('[auth/login] band_id ajeno ignorado en el login.');
  }

  const preferredBandId = band_id && puedeElegirBanda(band_id) ? band_id : userMainBand;
  const preferredClean = preferredBandId
    ? cleanBandId(preferredBandId)
    : undefined;

  const foundMatching = validUsers.find(
    (u: any) =>
      u.band_id === preferredBandId ||
      (preferredClean && cleanBandId(u.band_id) === preferredClean)
  );
  let selectedUser = foundMatching || validUsers[0];

  // Ensure active band on login is the preferred / favorite band
  if (preferredBandId) {
    selectedUser.band_id =
      preferredBandId.startsWith('band-') || preferredBandId.startsWith('reg-')
        ? preferredBandId
        : `band-${preferredBandId}`;
    if (!selectedUser.main_band_id) {
      selectedUser.main_band_id = selectedUser.band_id;
    }
  }

  // Look up band info for name and plan
  const cleanPref = cleanBandId(selectedUser.band_id);
  const bandInfo =
    (state.registeredBands || []).find(
      (b: any) =>
        b.band_id === selectedUser.band_id ||
        b.id === selectedUser.band_id ||
        cleanBandId(b.band_id) === cleanPref ||
        cleanBandId(b.id) === cleanPref
    ) ||
    (state.bands || []).find(
      (b: any) =>
        b.band_id === selectedUser.band_id ||
        b.id === selectedUser.band_id ||
        cleanBandId(b.band_id) === cleanPref ||
        cleanBandId(b.id) === cleanPref
    );

  if (bandInfo) {
    selectedUser.bandName =
      bandInfo.nombre_banda ||
      bandInfo.bandName ||
      bandInfo.name ||
      selectedUser.bandName;
    selectedUser.plan = normalizePlan(bandInfo.plan || 'promo');
  }

  const token = crypto.randomBytes(32).toString('hex');
  const sessionObj = { userId: selectedUser.id, createdAt: Date.now() };
  ACTIVE_SESSIONS[token] = sessionObj;
  if (!state.sessions) state.sessions = {};
  state.sessions[token] = sessionObj;
  saveState(state);

  // Recalculate availableBands
  const availableBands = await buildAvailableBandsForUser(state, selectedUser);

  res.cookie('bandmanager_token', token, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    // httpOnly=false A PROPÓSITO: el cliente también lee/escribe el token (localStorage + cookie, ver sessionCookie.ts);
    // pasar a httpOnly exige migrar todo el cliente a sesión solo por cookie (BACKLOG.md).
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  const { passwordHash, salt, ...safeUser } = selectedUser;
  res.json({
    token,
    user: safeUser,
    availableBands,
    multipleBands: availableBands.length > 1,
  });
});

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
    } catch (err) {
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
      } catch (e) {
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
    } catch (err) {
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

// Verify current session
router.get('/auth/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  let token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (req.headers['x-auth-token'] as string);

  if (!token && req.headers.cookie) {
    const match = req.headers.cookie.match(/bandmanager_token=([^;]+)/);
    if (match) token = match[1];
  }

  const state = loadState();

  // Refresh registered bands and users from Supabase if possible so plans are real-time
  try {
    const [freshRegBands, freshUsers] = await Promise.all([
      dbGetRegisteredBands(),
      dbGetUsers(),
    ]);
    if (Array.isArray(freshRegBands) && freshRegBands.length > 0) {
      state.registeredBands = freshRegBands;
    }
    if (Array.isArray(freshUsers) && freshUsers.length > 0) {
      freshUsers.forEach((su: any) => {
        const idx = state.users.findIndex(
          (u: any) =>
            u.id === su.id ||
            (u.username &&
              u.username.toLowerCase() === su.username?.toLowerCase())
        );
        if (idx !== -1) {
          if (su.plan) state.users[idx].plan = normalizePlan(su.plan);
          if (su.role) state.users[idx].role = su.role;
          if (su.band_id) state.users[idx].band_id = su.band_id;
          if (su.bandName) state.users[idx].bandName = su.bandName;
          if (su.main_band_id) state.users[idx].main_band_id = su.main_band_id;
        } else {
          state.users.push(su);
        }
      });
    }
  } catch (e) {
    // Non-blocking fallback to state.registeredBands
  }

  const session =
    (token && ACTIVE_SESSIONS[token]) ||
    (token && state.sessions && state.sessions[token]);
  const user = session
    ? state.users.find((u: any) => u.id === session.userId)
    : null;

  if (!user) {
    return res.status(401).json({ error: 'Sesión no iniciada o expirada' });
  }

  if (token && session) {
    session.createdAt = Date.now();
    ACTIVE_SESSIONS[token] = session;
    if (state.sessions && state.sessions[token]) {
      state.sessions[token].createdAt = Date.now();
      saveState(state);
    }
  }

  // Set/Refresh 30-day session cookie
  if (token) {
    res.cookie('bandmanager_token', token, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      // httpOnly=false A PROPÓSITO: el cliente también lee/escribe el token (localStorage + cookie, ver sessionCookie.ts);
      // pasar a httpOnly exige migrar todo el cliente a sesión solo por cookie (BACKLOG.md).
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

  // Sync active band plan
  if (user.band_id && state.registeredBands) {
    const cleanCurrent = user.band_id
      .replace(/^(band|reg)-/, '')
      .toLowerCase()
      .trim();
    const regBand = state.registeredBands.find((b: any) => {
      const bBid = (b.band_id || '')
        .replace(/^(band|reg)-/, '')
        .toLowerCase()
        .trim();
      const bId = (b.id || '')
        .replace(/^(band|reg)-/, '')
        .toLowerCase()
        .trim();
      const bName = (b.nombre_banda || b.bandName || b.name || '')
        .toLowerCase()
        .trim();
      return (
        b.band_id === user.band_id ||
        b.id === user.band_id ||
        bBid === cleanCurrent ||
        bId === cleanCurrent ||
        (cleanCurrent.length > 1 && bName === cleanCurrent)
      );
    });
    if (regBand) {
      user.plan = normalizePlan(regBand.plan || 'promo');
    }
  }

  // Recalculate availableBands
  const availableBands = await buildAvailableBandsForUser(state, user);

  const { passwordHash, salt, ...safeUser } = user;
  res.json({
    token,
    user: safeUser,
    availableBands,
    multipleBands: availableBands.length > 1,
  });
});

// Switch Active Band
router.post('/auth/switch-band', async (req, res) => {
  const authHeader = req.headers.authorization;
  let token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (req.headers['x-auth-token'] as string);

  if (!token && req.headers.cookie) {
    const match = req.headers.cookie.match(/bandmanager_token=([^;]+)/);
    if (match) token = match[1];
  }

  const state = loadState();

  // Refresh registered bands from Supabase if possible
  try {
    const freshRegBands = await dbGetRegisteredBands();
    if (Array.isArray(freshRegBands) && freshRegBands.length > 0) {
      state.registeredBands = freshRegBands;
    }
  } catch (e) {
    // Non-blocking
  }

  let session =
    (token && ACTIVE_SESSIONS[token]) ||
    (token && state.sessions && state.sessions[token]);
  const currentUser = session
    ? state.users.find((u: any) => u.id === session.userId)
    : null;

  if (!currentUser) {
    return res.status(401).json({ error: 'Sesión no válida o expirada' });
  }

  const { band_id } = req.body;
  if (!band_id) {
    return res.status(400).json({ error: 'band_id es requerido' });
  }

  const userEmail =
    currentUser.email?.toLowerCase() || currentUser.username.toLowerCase();
  const cleanTargetBand = band_id.replace(/^(band|reg)-/, '');

  // Check if they have access to this band (either via userBands, registeredBands or legacy duplicates)
  if (!state.userBands) state.userBands = [];
  const hasAccessInUserBands = state.userBands.some(
    (ub: any) =>
      (ub.user_id === currentUser!.id ||
        (userEmail && ub.email?.toLowerCase() === userEmail)) &&
      ub.band_id &&
      ub.band_id.replace(/^(band|reg)-/, '') === cleanTargetBand
  );

  const hasAccessInRegisteredBands = (state.registeredBands || []).some(
    (b: any) =>
      (b.user_id === currentUser!.id || b.email?.toLowerCase() === userEmail) &&
      ((b.band_id &&
        b.band_id.replace(/^(band|reg)-/, '') === cleanTargetBand) ||
        (b.id && b.id.replace(/^(band|reg)-/, '') === cleanTargetBand))
  );

  const legacyTargetUser = state.users.find(
    (u: any) =>
      u.band_id &&
      u.band_id.replace(/^(band|reg)-/, '') === cleanTargetBand &&
      ((u.email && u.email.toLowerCase() === userEmail) ||
        u.username.toLowerCase() === userEmail)
  );

  const isGlobalAdmin = currentUser.role === 'admin';

  // Ninguna banda es una excepción legítima aquí: cualquier cuenta autenticada podía
  // cambiarse a una banda sin tener vínculo real vía userBands,
  // registeredBands ni legacyTargetUser, con acceso de lectura/escritura completo a partir de
  // ahí — y el band_id que quedaba asignado era el crudo del body, sin normalizar al prefijo
  // canónico (ver bandInfo más abajo). Solo el admin global salta el chequeo de pertenencia,
  // igual que con cualquier otra banda.
  if (
    !hasAccessInUserBands &&
    !hasAccessInRegisteredBands &&
    !legacyTargetUser &&
    !isGlobalAdmin
  ) {
    return res.status(404).json({ error: 'No tienes acceso a esta banda' });
  }

  let targetUser = currentUser;
  if (legacyTargetUser && !isGlobalAdmin) {
    targetUser = legacyTargetUser;
  }

  const cleanCheck = cleanTargetBand.toLowerCase().trim();
  const bandInfo =
    (state.registeredBands || []).find((b: any) => {
      const bBid = (b.band_id || '')
        .replace(/^(band|reg)-/, '')
        .toLowerCase()
        .trim();
      const bId = (b.id || '')
        .replace(/^(band|reg)-/, '')
        .toLowerCase()
        .trim();
      const bName = (b.nombre_banda || b.bandName || b.name || '')
        .toLowerCase()
        .trim();
      return (
        b.band_id === band_id ||
        b.id === band_id ||
        bBid === cleanCheck ||
        bId === cleanCheck ||
        (cleanCheck.length > 1 && bName === cleanCheck)
      );
    }) ||
    (state.bands || []).find((b: any) => {
      const bBid = (b.band_id || '')
        .replace(/^(band|reg)-/, '')
        .toLowerCase()
        .trim();
      const bId = (b.id || '')
        .replace(/^(band|reg)-/, '')
        .toLowerCase()
        .trim();
      const bName = (b.nombre_banda || b.bandName || b.name || '')
        .toLowerCase()
        .trim();
      return (
        b.band_id === band_id ||
        b.id === band_id ||
        bBid === cleanCheck ||
        bId === cleanCheck ||
        (cleanCheck.length > 1 && bName === cleanCheck)
      );
    });

  const resolvedName = bandInfo
    ? bandInfo.nombre_banda || bandInfo.bandName || bandInfo.name
    : targetUser.bandName || 'Banda';
  const resolvedPlan = normalizePlan(
    bandInfo?.plan || targetUser.plan || 'ensayo'
  );
  // El id CANÓNICO del registro encontrado (bandInfo.band_id), no el crudo del body: si alguien
  // manda "mi-banda" sin prefijo pero el registro real es "band-mi-banda", guardar el crudo
  // creaba un band_id gemelo sin datos la próxima vez que algo hiciera ensureRegisteredBandExists
  // con ese id suelto. Solo cae al crudo si no hay bandInfo (caso legacy sin registro).
  const canonicalBandId = bandInfo?.band_id || band_id;

  targetUser.band_id = canonicalBandId;
  targetUser.bandName = resolvedName;
  targetUser.plan = isGlobalAdmin ? 'cabeza_de_cartel' : resolvedPlan;
  if (isGlobalAdmin) {
    targetUser.role = 'admin';
  }

  // Sync band_id and plan on all user records matching email
  if (state.users) {
    state.users.forEach((u: any) => {
      if (
        u.id === targetUser.id ||
        (userEmail &&
          (u.email?.toLowerCase() === userEmail ||
            u.username?.toLowerCase() === userEmail))
      ) {
        u.band_id = canonicalBandId;
        u.bandName = resolvedName;
        u.plan = isGlobalAdmin ? 'cabeza_de_cartel' : resolvedPlan;
        if (isGlobalAdmin) u.role = 'admin';
      }
    });
  }

  // Update session
  const effectiveToken = token || `session-${Date.now()}`;
  session = { userId: targetUser.id, createdAt: Date.now() };
  ACTIVE_SESSIONS[effectiveToken] = session;
  if (!state.sessions) state.sessions = {};
  state.sessions[effectiveToken] = session;
  saveState(state);
  // Sin esto, el cambio de banda solo vivía en el data.json local (efímero, no compartido entre
  // instancias/redeploys de Railway): cualquier ruta que releyera al usuario desde Supabase después
  // (login, /auth/me sirviendo desde otra instancia, etc.) devolvía band_id sin actualizar, y la
  // app "volvía sola" a la banda anterior aunque el switch hubiera funcionado un momento antes.
  try {
    await dbUpsertUser(targetUser);
  } catch (err) {
    console.warn('Could not sync switched band to Supabase:', err);
  }

  res.cookie('bandmanager_token', effectiveToken, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    // httpOnly=false A PROPÓSITO: el cliente también lee/escribe el token (localStorage + cookie, ver sessionCookie.ts);
    // pasar a httpOnly exige migrar todo el cliente a sesión solo por cookie (BACKLOG.md).
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  // Recalculate availableBands dynamically using userBands
  const availableBands = await buildAvailableBandsForUser(state, targetUser);

  const { passwordHash, salt, ...safeUser } = targetUser;
  res.json({ token: effectiveToken, user: safeUser, availableBands });
});

// Logout
router.post('/auth/logout', (req, res) => {
  const { token } = req.body;
  if (token) {
    delete ACTIVE_SESSIONS[token];
    const state = loadState();
    if (state.sessions && state.sessions[token]) {
      delete state.sessions[token];
      saveState(state);
    }
  }
  res.clearCookie('bandmanager_token', { path: '/' });
  res.json({ success: true });
});

// Set main / primary band
router.post(
  ['/set-main-band', '/users/set-main-band'],
  requireAuth,
  async (req, res) => {
    try {
      const user_id = (req as any).user.id;
      const { band_id } = req.body;
      if (!band_id) {
        return res.status(400).json({ error: 'band_id es requerido' });
      }
      // Antes se aceptaba cualquier band_id del body sin comprobar que el usuario perteneciera a
      // ella: cualquier cuenta autenticada podía convertirse en leader de una banda ajena con solo
      // conocer su id. set-main-band solo puede fijar como principal una banda a la que ya perteneces.
      if (!puedeEscribirEnBanda(req, band_id)) {
        return res.status(403).json({ error: 'No perteneces a esa banda.' });
      }

      const state = loadState();
      const cleanTarget = band_id.replace(/^(band|reg)-/, '');
      const reqEmail = (
        (req as any).user?.email ||
        (req as any).user?.username ||
        ''
      ).toLowerCase();
      const user = state.users?.find(
        (u: any) =>
          u.id === user_id ||
          (reqEmail &&
            (u.email?.toLowerCase() === reqEmail ||
              u.username?.toLowerCase() === reqEmail))
      );
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const bandInfo =
        (state.registeredBands || []).find(
          (b: any) =>
            b.band_id === band_id ||
            b.id === band_id ||
            (b.band_id &&
              b.band_id.replace(/^(band|reg)-/, '') === cleanTarget) ||
            (b.id && b.id.replace(/^(band|reg)-/, '') === cleanTarget)
        ) ||
        (state.bands || []).find(
          (b: any) =>
            b.band_id === band_id ||
            b.id === band_id ||
            (b.band_id &&
              b.band_id.replace(/^(band|reg)-/, '') === cleanTarget) ||
            (b.id && b.id.replace(/^(band|reg)-/, '') === cleanTarget)
        );

      const resolvedName = bandInfo
        ? bandInfo.nombre_banda || bandInfo.bandName || bandInfo.name
        : user.bandName || 'Banda';
      const resolvedPlan = normalizePlan(
        bandInfo?.plan || user.plan || 'ensayo'
      );

      user.band_id = band_id;
      user.main_band_id = band_id;
      user.bandName = resolvedName;
      user.plan = resolvedPlan;

      const cleanBId = cleanBandId(band_id);
      if (Array.isArray(user.band_order)) {
        user.band_order = [
          cleanBId,
          ...user.band_order.filter((b: string) => cleanBandId(b) !== cleanBId),
        ];
      } else {
        user.band_order = [cleanBId];
      }

      // Update on all user records sharing this email/username
      const userEmail = (user.email || user.username || reqEmail).toLowerCase();
      if (state.users) {
        state.users.forEach((u: any) => {
          if (
            u.id === user.id ||
            (userEmail &&
              (u.email?.toLowerCase() === userEmail ||
                u.username?.toLowerCase() === userEmail))
          ) {
            u.band_id = band_id;
            u.main_band_id = band_id;
            u.bandName = resolvedName;
            u.plan = resolvedPlan;
            u.band_order = user.band_order;
          }
        });
      }

      saveState(state);
      try {
        await dbUpsertUser(user);
      } catch (err) {
        console.warn('Could not sync main band to Supabase:', err);
      }

      const availableBands = await buildAvailableBandsForUser(state, user);
      const { passwordHash, salt, ...safeUser } = user;
      res.json({ success: true, user: safeUser, availableBands });
    } catch (err: any) {
      res.status(500).json({
        error: err.message || 'Error al establecer la banda principal',
      });
    }
  }
);

// Set custom band order for user
router.post(
  ['/set-band-order', '/users/set-band-order'],
  requireAuth,
  async (req, res) => {
    try {
      const user_id = (req as any).user.id;
      const { band_order } = req.body;
      if (!Array.isArray(band_order)) {
        return res
          .status(400)
          .json({ error: 'band_order debe ser un array de IDs de banda' });
      }

      const state = loadState();
      const user = state.users?.find((u: any) => u.id === user_id);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      user.band_order = band_order;

      const userEmail = (user.email || user.username || '').toLowerCase();
      if (state.users) {
        state.users.forEach((u: any) => {
          if (
            u.id === user.id ||
            (userEmail &&
              (u.email?.toLowerCase() === userEmail ||
                u.username?.toLowerCase() === userEmail))
          ) {
            u.band_order = band_order;
          }
        });
      }

      saveState(state);
      try {
        await dbUpsertUser(user);
      } catch (err) {
        console.warn('Could not sync band order to Supabase:', err);
      }

      const availableBands = await buildAvailableBandsForUser(state, user);
      const { passwordHash, salt, ...safeUser } = user;
      res.json({ success: true, user: safeUser, availableBands });
    } catch (err: any) {
      console.error('Error setting band order:', err);
      res
        .status(500)
        .json({ error: err.message || 'Error al guardar el orden de bandas' });
    }
  }
);

// Guardar preferencias de interfaz de usuario (ej. vista de meses del calendario por tipo de dispositivo)
router.post(
  ['/ui-preferences', '/users/ui-preferences'],
  requireAuth,
  async (req, res) => {
    try {
      const user_id = (req as any).user.id;
      const { calendar_default_months, ...otherPrefs } = req.body || {};

      const state = loadState();
      const reqEmail = (
        (req as any).user?.email ||
        (req as any).user?.username ||
        ''
      ).toLowerCase();
      const user = state.users?.find(
        (u: any) =>
          u.id === user_id ||
          (reqEmail &&
            (u.email?.toLowerCase() === reqEmail ||
              u.username?.toLowerCase() === reqEmail))
      );
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const currentPrefs = user.ui_preferences || {};
      const updatedCalendarMonths = {
        ...(currentPrefs.calendar_default_months || {}),
        ...(calendar_default_months || {}),
      };

      const updatedPrefs = {
        ...currentPrefs,
        ...otherPrefs,
        calendar_default_months: updatedCalendarMonths,
      };

      user.ui_preferences = updatedPrefs;

      const userEmail = (user.email || user.username || reqEmail).toLowerCase();
      if (state.users) {
        state.users.forEach((u: any) => {
          if (
            u.id === user.id ||
            (userEmail &&
              (u.email?.toLowerCase() === userEmail ||
                u.username?.toLowerCase() === userEmail))
          ) {
            u.ui_preferences = updatedPrefs;
          }
        });
      }

      saveState(state);
      try {
        await dbUpsertUser(user);
      } catch (err) {
        console.warn('Could not sync ui_preferences to Supabase:', err);
      }

      const { passwordHash, salt, ...safeUser } = user;
      res.json({ success: true, ui_preferences: updatedPrefs, user: safeUser });
    } catch (err: any) {
      console.error('Error saving ui-preferences:', err);
      res.status(500).json({
        error: err.message || 'Error al guardar preferencias de usuario',
      });
    }
  }
);

// Obtener preferencias de interfaz de usuario
router.get(
  ['/ui-preferences', '/users/ui-preferences'],
  requireAuth,
  async (req, res) => {
    try {
      const user_id = (req as any).user.id;
      const state = loadState();
      const reqEmail = (
        (req as any).user?.email ||
        (req as any).user?.username ||
        ''
      ).toLowerCase();
      const user = state.users?.find(
        (u: any) =>
          u.id === user_id ||
          (reqEmail &&
            (u.email?.toLowerCase() === reqEmail ||
              u.username?.toLowerCase() === reqEmail))
      );
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      res.json({ success: true, ui_preferences: user.ui_preferences || {} });
    } catch (err: any) {
      res
        .status(500)
        .json({ error: err.message || 'Error al obtener preferencias' });
    }
  }
);

// Upload / Update Band Logo
router.post(
  ['/upload-logo', '/users/upload-logo', '/bands/upload-logo', '/bands/logo'],
  requireAuth,
  async (req, res) => {
    try {
      const { logoUrl } = req.body;
      // La banda salía del body o de la cabecera sin mirarla, así que se le cambiaba el logo del
      // EPK a la banda que se quisiera.
      const solicitada = bandaSolicitada(req);
      if (solicitada && !puedeEscribirEnBanda(req, solicitada)) {
        return res
          .status(403)
          .json({ error: 'No tienes acceso a esta banda.' });
      }
      const targetBandId = getTargetBandId(req);

      if (!logoUrl || typeof logoUrl !== 'string' || !logoUrl.trim()) {
        return res.status(400).json({ error: 'logoUrl es requerido' });
      }

      const cleanTarget = targetBandId.replace(/^(band|reg)-/, '');
      const state = loadState();

      // 1. Update in Supabase
      await dbUpsertEpkConfig(targetBandId, { logoUrl: logoUrl.trim() });

      // 2. Update local state registeredBands
      if (!state.registeredBands) state.registeredBands = [];
      let foundReg = false;
      state.registeredBands.forEach((b: any) => {
        const bClean = (b.band_id || b.id || '').replace(/^(band|reg)-/, '');
        if (
          bClean === cleanTarget ||
          b.band_id === targetBandId ||
          b.id === targetBandId
        ) {
          b.logo_url = logoUrl.trim();
          b.imagen_url = logoUrl.trim();
          foundReg = true;
        }
      });

      // 3. Update epkConfigsByBand in local state
      if (!state.epkConfigsByBand) state.epkConfigsByBand = {};
      const possibleKeys = [
        targetBandId,
        cleanTarget,
        `band-${cleanTarget}`,
        `reg-${cleanTarget}`,
      ];
      possibleKeys.forEach((k) => {
        if (state.epkConfigsByBand[k]) {
          state.epkConfigsByBand[k].logoUrl = logoUrl.trim();
        } else {
          state.epkConfigsByBand[k] = { logoUrl: logoUrl.trim() };
        }
      });

      if (
        (req as any).user?.band_id &&
        cleanBandId((req as any).user.band_id) === cleanTarget
      ) {
        if (!state.epkConfig) state.epkConfig = {};
        state.epkConfig.logoUrl = logoUrl.trim();
      }

      saveState(state);
      invalidateBandStateCache(targetBandId);
      invalidateBandStateCache(cleanTarget);
      invalidateBandStateCache(`band-${cleanTarget}`);

      res.json({
        success: true,
        bandId: targetBandId,
        logoUrl: logoUrl.trim(),
      });
    } catch (err: any) {
      console.error('Error updating band logo:', err);
      res.status(500).json({
        error: err.message || 'Error al actualizar el logotipo de la banda',
      });
    }
  }
);

// Create/Add a new band for current logged in user
router.post(
  ['/create-band', '/users/create-band'],
  requireAuth,
  async (req, res) => {
    try {
      const user_id = (req as any).user.id;
      const {
        bandName,
        plan,
        estilo_musical,
        localizacion,
        leaderName,
        contacto_nombre,
      } = req.body;

      if (!bandName || !bandName.trim()) {
        return res
          .status(400)
          .json({ error: 'El nombre del proyecto o banda es obligatorio' });
      }

      const state = loadState();
      const user = state.users?.find((u: any) => u.id === user_id);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const rawBandName = bandName.trim();
      const cleanEmail = (user.email || user.username || '').toLowerCase();
      const selectedPlan = 'promo'; // Toda nueva banda se crea exclusivamente en plan promo
      const leaderDisplayName = (
        leaderName ||
        contacto_nombre ||
        user.name ||
        user.username ||
        rawBandName
      ).trim();

      const existingIds = new Set<string>();
      (state.users || []).forEach((u: any) => {
        if (u.id) existingIds.add(u.id);
        if (u.band_id) existingIds.add(u.band_id);
      });
      (state.registeredBands || []).forEach((b: any) => {
        if (b.id) existingIds.add(b.id);
        if (b.band_id) existingIds.add(b.band_id);
      });

      const bandId = generateUniqueSlugId('band', rawBandName, existingIds);
      existingIds.add(bandId);

      const regId = generateUniqueSlugId('reg', rawBandName, existingIds);
      existingIds.add(regId);

      const newRegisteredBandRecord = {
        id: regId,
        band_id: bandId,
        user_id: user.id,
        fecha_registro: new Date().toISOString(),
        nombre_banda: rawBandName,
        email: cleanEmail,
        plan: selectedPlan,
        contacto_nombre: leaderDisplayName,
        estilo_musical: estilo_musical?.trim() || 'Por definir',
        localizacion: localizacion?.trim() || 'España',
        telefono: '',
        instagram: '',
        spotify_youtube: '',
        aforo_promedio: 0,
        estado_cuenta: 'activo',
        notas: `Creada desde BandSwitcherModal por ${user.name || user.username}`,
      };

      if (!state.registeredBands) state.registeredBands = [];
      state.registeredBands.push(newRegisteredBandRecord);

      if (!state.userBands) state.userBands = [];
      const newUB = {
        id: `ub-${user.id}-${bandId}`,
        user_id: user.id,
        band_id: bandId,
        role: 'leader',
        createdAt: new Date().toISOString(),
      };
      state.userBands.push(newUB);

      // Switch active band to the new band
      user.band_id = bandId;
      user.bandName = rawBandName;
      user.plan = selectedPlan;
      if (!user.main_band_id) {
        user.main_band_id = bandId;
      }
      if (Array.isArray(user.band_order)) {
        user.band_order = [
          bandId,
          ...user.band_order.filter(
            (id: string) =>
              id !== bandId &&
              id.replace(/^(band|reg)-/, '') !== cleanBandId(bandId)
          ),
        ];
      } else {
        user.band_order = [bandId];
      }

      // Sync to all user records with matching email
      if (state.users) {
        state.users.forEach((u: any) => {
          if (
            u.id === user.id ||
            (cleanEmail &&
              (u.email?.toLowerCase() === cleanEmail ||
                u.username?.toLowerCase() === cleanEmail))
          ) {
            u.band_id = bandId;
            u.bandName = rawBandName;
            u.plan = selectedPlan;
            if (!u.main_band_id) u.main_band_id = bandId;
            if (Array.isArray(u.band_order)) {
              u.band_order = [
                bandId,
                ...u.band_order.filter(
                  (id: string) =>
                    id !== bandId &&
                    id.replace(/^(band|reg)-/, '') !== cleanBandId(bandId)
                ),
              ];
            }
          }
        });
      }

      // Inicializar configuración EPK limpia y aislada para la nueva banda
      if (!state.epkConfigsByBand) {
        state.epkConfigsByBand = {};
      }
      const cleanBandIdStr = cleanBandId(bandId);
      const freshEpkConfig = {
        biografia: '',
        logoUrl: '',
        bandPhotos: [],
        miembros: [
          {
            id: 'leader',
            nombre: leaderDisplayName,
            rol: user.instrument || 'Voz / Guitarra',
            email: cleanEmail,
            instagram: '',
            isLeader: true,
          },
        ],
        riderTecnico: '',
        enlacesRedes: {
          spotify: '',
          youtube: '',
          instagram: '',
          tiktok: '',
          website: '',
        },
        contactoBooking: {
          nombre: leaderDisplayName,
          email: cleanEmail,
          telefono: '',
        },
        temasDestacadosIds: [],
        incentivoFans: {
          mensajeAgradecimiento: `¡Muchas gracias por unirte a la comunidad de ${rawBandName}!`,
          enlaceDescarga: '',
          codigoDescuento: '',
        },
      };
      state.epkConfigsByBand[bandId] = freshEpkConfig;
      state.epkConfigsByBand[cleanBandIdStr] = freshEpkConfig;
      state.epkConfigsByBand[`band-${cleanBandIdStr}`] = freshEpkConfig;
      state.epkConfigsByBand[`reg-${cleanBandIdStr}`] = freshEpkConfig;

      saveState(state);

      try {
        await dbUpsertRegisteredBand(newRegisteredBandRecord);
        await dbUpsertUser(user);
        await dbUpsertUserBand(newUB);
      } catch (err) {
        console.warn('Notice: Band saved locally, Supabase sync pending:', err);
      }

      const availableBands = await buildAvailableBandsForUser(state, user);
      const { passwordHash, salt, ...safeUser } = user;

      res.status(201).json({
        success: true,
        message: `¡Proyecto "${rawBandName}" creado con éxito!`,
        band_id: bandId,
        bandName: rawBandName,
        user: safeUser,
        availableBands,
      });
    } catch (err: any) {
      console.error('Error creating new band:', err);
      res
        .status(500)
        .json({ error: err.message || 'Error al crear el nuevo proyecto' });
    }
  }
);

router.delete(
  ['/leave-band/:bandId', '/users/leave-band/:bandId'],
  requireAuth,
  async (req, res) => {
    try {
      const user_id = (req as any).user.id;
      const rawBandId = req.params.bandId;

      if (!user_id || !rawBandId) {
        return res
          .status(400)
          .json({ error: 'ID de usuario o banda faltante' });
      }

      const state = loadState();
      const cleanTarget = rawBandId.replace(/^(band|reg)-/, '');
      const user = state.users?.find((u: any) => u.id === user_id);
      const userEmail = (
        user?.email ||
        (req as any).user?.email ||
        ''
      ).toLowerCase();
      const userUsername = (user?.username || '').toLowerCase();

      // 1. Remove relationship from state.userBands
      if (state.userBands && Array.isArray(state.userBands)) {
        state.userBands = state.userBands.filter((ub: any) => {
          const ubClean = ub.band_id
            ? ub.band_id.replace(/^(band|reg)-/, '')
            : '';
          const isUserMatch =
            ub.user_id === user_id ||
            (userEmail &&
              state.users?.some(
                (u: any) =>
                  u.id === ub.user_id &&
                  (u.email?.toLowerCase() === userEmail ||
                    u.username?.toLowerCase() === userEmail)
              ));
          return !(isUserMatch && ubClean === cleanTarget);
        });
      }

      // 2. Remove / unlink on state.registeredBands if matching
      if (state.registeredBands && Array.isArray(state.registeredBands)) {
        state.registeredBands = state.registeredBands.filter((rb: any) => {
          const rbClean = rb.band_id
            ? rb.band_id.replace(/^(band|reg)-/, '')
            : rb.id
              ? rb.id.replace(/^(band|reg)-/, '')
              : '';
          if (rbClean === cleanTarget) {
            if (
              rb.user_id === user_id ||
              (userEmail && rb.email?.toLowerCase() === userEmail)
            ) {
              // Delete registered band completely if owned by this user
              return false;
            }
            if (rb.user_id === user_id) rb.user_id = null;
            if (userEmail && rb.email?.toLowerCase() === userEmail)
              rb.email = '';
          }
          return true;
        });
      }

      // 3. Clear from any other accounts of the same user with that band_id
      if (state.users && Array.isArray(state.users)) {
        // for...of (no .forEach) porque el cuerpo necesita await buildAvailableBandsForUser: un
        // callback de .forEach no se puede esperar, así que el resto de la ruta seguiría antes de
        // que la promesa resolviera.
        for (const u of state.users) {
          const matchesUser =
            u.id === user_id ||
            (userEmail &&
              (u.email?.toLowerCase() === userEmail ||
                u.username?.toLowerCase() === userEmail));
          if (matchesUser) {
            const uBandClean = u.band_id
              ? u.band_id.replace(/^(band|reg)-/, '')
              : '';
            const uMainClean = u.main_band_id
              ? u.main_band_id.replace(/^(band|reg)-/, '')
              : '';
            if (Array.isArray(u.band_order)) {
              u.band_order = u.band_order.filter(
                (id: string) =>
                  typeof id === 'string' &&
                  id.replace(/^(band|reg)-/, '') !== cleanTarget
              );
            }
            if (uBandClean === cleanTarget || uMainClean === cleanTarget) {
              const remBands = (
                await buildAvailableBandsForUser(state, u)
              ).filter(
                (b: any) =>
                  b &&
                  b.band_id &&
                  typeof b.band_id === 'string' &&
                  b.band_id.replace(/^(band|reg)-/, '') !== cleanTarget
              );
              if (uMainClean === cleanTarget) {
                u.main_band_id =
                  remBands.length > 0 ? remBands[0].band_id : undefined;
              }
              if (uBandClean === cleanTarget) {
                if (remBands.length > 0) {
                  u.band_id = u.main_band_id || remBands[0].band_id;
                  const chosen =
                    remBands.find((b: any) => b.band_id === u.band_id) ||
                    remBands[0];
                  u.bandName = chosen.bandName || chosen.nombre_banda;
                } else {
                  // Antes, un usuario que se quedaba sin bandas se reasignaba en silencio a la
                  // banda insignia. Sin bandas, se queda sin band_id: la app debe pedirle crear o
                  // unirse a una, no meterlo en la banda del fundador.
                  u.band_id = undefined;
                  u.bandName = undefined;
                }
              }
            }
          }
        }
      }

      // 4. Update current user instance
      if (user) {
        const activeClean = user.band_id
          ? user.band_id.replace(/^(band|reg)-/, '')
          : '';
        const mainClean = user.main_band_id
          ? user.main_band_id.replace(/^(band|reg)-/, '')
          : '';
        const remainingBands = (
          await buildAvailableBandsForUser(state, user)
        ).filter(
          (b: any) =>
            b &&
            b.band_id &&
            typeof b.band_id === 'string' &&
            b.band_id.replace(/^(band|reg)-/, '') !== cleanTarget
        );

        if (Array.isArray(user.band_order)) {
          user.band_order = user.band_order.filter(
            (id: string) =>
              typeof id === 'string' &&
              id.replace(/^(band|reg)-/, '') !== cleanTarget
          );
        }

        if (mainClean === cleanTarget) {
          user.main_band_id =
            remainingBands.length > 0 ? remainingBands[0].band_id : undefined;
        }

        if (activeClean === cleanTarget) {
          if (remainingBands.length > 0) {
            user.band_id = user.main_band_id || remainingBands[0].band_id;
            const chosenBand =
              remainingBands.find((b: any) => b.band_id === user.band_id) ||
              remainingBands[0];
            user.bandName = chosenBand.bandName || chosenBand.nombre_banda;
          } else {
            user.band_id = undefined;
            user.bandName = undefined;
          }
        }

        try {
          await dbUpsertUser(user);
        } catch (err) {
          console.warn(
            'Notice updating user active band in Supabase after leaving:',
            err
          );
        }
      }

      saveState(state);

      // 5. Delete from Supabase user_bands & registered_bands
      try {
        await dbDeleteUserFromBand(user_id, rawBandId);
        await dbDeleteRegisteredBand(rawBandId);
      } catch (sbErr) {
        console.warn('Notice deleting from Supabase:', sbErr);
      }

      const updatedUser = user
        ? state.users?.find((u: any) => u.id === user_id) || user
        : null;
      const updatedAvailableBands = updatedUser
        ? await buildAvailableBandsForUser(state, updatedUser)
        : [];

      res.json({
        success: true,
        message: 'Has abandonado la banda correctamente',
        user: updatedUser ? getSafeUsers([updatedUser])[0] : null,
        availableBands: updatedAvailableBands,
      });
    } catch (error) {
      console.error('Error al abandonar banda:', error);
      res.status(500).json({ error: 'Error al procesar la solicitud' });
    }
  }
);

// Upload and persist band logo
router.post('/users/upload-logo', requireAuth, async (req, res) => {
  try {
    const { bandId, logoUrl } = req.body;
    if (!bandId || !logoUrl) {
      return res.status(400).json({ error: 'bandId y logoUrl son requeridos' });
    }

    if (!puedeEscribirEnBanda(req, bandId)) {
      return res
        .status(403)
        .json({
          error: 'No tienes permiso para modificar el logo de esta banda.',
        });
    }

    const state = loadState();
    const cleanId = cleanBandId(bandId);

    // Update in registeredBands
    if (!state.registeredBands) state.registeredBands = [];
    let regBand = state.registeredBands.find((b: any) => {
      const bBid = cleanBandId(b.band_id || b.id);
      return bBid === cleanId;
    });

    if (regBand) {
      regBand.logo_url = logoUrl;
      regBand.imagen_url = logoUrl;
      try {
        await dbUpsertRegisteredBand(regBand);
      } catch (e) {
        console.warn('Could not sync registeredBand logo to DB:', e);
      }
    }

    // Update in epkConfigsByBand
    if (!state.epkConfigsByBand) state.epkConfigsByBand = {};
    const existingEpk = getEpkConfigForBand(
      state,
      bandId,
      regBand?.nombre_banda || 'Banda'
    );
    const updatedEpk = { ...existingEpk, logoUrl };
    const possibleKeys = [bandId, cleanId, `band-${cleanId}`, `reg-${cleanId}`];
    possibleKeys.forEach((k) => {
      state.epkConfigsByBand[k] = updatedEpk;
    });

    try {
      await dbUpsertEpkConfig(bandId, { logoUrl });
    } catch (e) {
      console.warn('Could not sync EPK logo to DB:', e);
    }

    saveState(state);

    res.json({ success: true, bandId, logoUrl });
  } catch (err: any) {
    console.error('Error in /users/upload-logo:', err);
    res
      .status(500)
      .json({ error: err?.message || 'Error al actualizar el logotipo' });
  }
});

// Associate an existing user to the leader's band using exact email match
router.post(
  '/users/associate',
  requireAuth,
  requireLeader,
  async (req, res) => {
    try {
      const { email, role, instrument } = req.body;

      if (!email) {
        return res
          .status(400)
          .json({ error: 'El email del músico es requerido' });
      }

      const targetBandId = (req as any).user?.band_id;
      if (!targetBandId) {
        return res.status(401).json({
          error: 'Acceso no autorizado. Inicie sesión para continuar.',
        });
      }
      const state = loadState();
      const cleanSearch = email.trim().toLowerCase();

      const targetUser = state.users.find(
        (u: any) =>
          (u.email && u.email.toLowerCase() === cleanSearch) ||
          (u.username && u.username.toLowerCase() === cleanSearch)
      );

      if (!targetUser) {
        return res.status(404).json({
          error: 'No existe ningún usuario registrado con este email.',
        });
      }

      if (!state.userBands) state.userBands = [];
      const relationExists = state.userBands.some(
        (ub: any) => ub.user_id === targetUser.id && ub.band_id === targetBandId
      );

      if (relationExists) {
        return res
          .status(400)
          .json({ error: 'Este músico ya es miembro de tu banda.' });
      }

      // Add the relationship
      const newUB = {
        id: `ub-${targetUser.id}-${targetBandId}`,
        user_id: targetUser.id,
        band_id: targetBandId,
        role: role === 'leader' ? 'leader' : 'member',
        createdAt: new Date().toISOString(),
      };
      state.userBands.push(newUB);
      try {
        await dbUpsertUserBand(newUB);
      } catch (e) {
        console.warn('Failed to append userBand to Supabase', e);
      }

      if (instrument) {
        targetUser.instrument = instrument.trim();
      }

      saveState(state);

      try {
        await dbUpsertUser(targetUser);
      } catch (err) {
        console.warn('Notice: Sync pending:', err);
      }

      const { passwordHash, salt, ...safeUser } = targetUser;
      res.status(201).json(safeUser);
    } catch (err: any) {
      console.error('Error in /users/associate:', err);
      res.status(500).json({
        error: err?.message || 'Error al asociar el músico a la banda',
      });
    }
  }
);

// Get all band users (without password hashes)
router.get('/users', requireAuth, async (req, res) => {
  const bandId = (req as any).user?.band_id;
  if (!bandId) {
    return res
      .status(401)
      .json({ error: 'Acceso no autorizado. Inicie sesión para continuar.' });
  }
  const state = loadState();

  if (!state.userBands) state.userBands = [];
  const bandUserIds = new Set(
    state.userBands
      .filter((ub: any) => ub.band_id === bandId)
      .map((ub: any) => ub.user_id)
  );

  const bandUsers = state.users
    .filter((u: any) => bandUserIds.has(u.id))
    .map((u: any) => {
      const ub = state.userBands.find(
        (ub: any) => ub.user_id === u.id && ub.band_id === bandId
      );
      return { ...u, role: ub?.role || 'member' };
    });

  try {
    const dbUsers = await dbGetUsers(bandId);
    if (dbUsers && dbUsers.length > 0) {
      const mergedUsers = dbUsers.map((u: any) => {
        const ub = state.userBands.find(
          (ub: any) => ub.user_id === u.id && ub.band_id === bandId
        );
        return { ...u, role: ub?.role || 'member' };
      });
      return res.json(getSafeUsers(mergedUsers));
    }
    res.json(getSafeUsers(bandUsers));
  } catch (_) {
    res.json(getSafeUsers(bandUsers));
  }
});

// Create new user (Leader operation)
router.post('/users', requireAuth, requireLeader, async (req, res) => {
  const { username, name, password, role, instrument, avatarColor, email } =
    req.body;

  if (!username || !name || !password) {
    return res.status(400).json({
      error: 'Nombre de usuario, nombre real y contraseña son requeridos',
    });
  }

  const state = loadState();
  const cleanUsername = username.trim().toLowerCase();
  const cleanEmail = email ? email.trim().toLowerCase() : cleanUsername;
  // Dar de alta a alguien en la banda de otro no es un despiste que se pueda arreglar por
  // dentro: el band_id venía del body sin validar.
  const solicitada = bandaSolicitada(req);
  if (solicitada && !puedeEscribirEnBanda(req, solicitada)) {
    return res.status(403).json({ error: 'No tienes acceso a esta banda.' });
  }
  const targetBandId = getTargetBandId(req);

  // Check if a user with this email or username already exists
  const existingUser = state.users.find(
    (u: any) =>
      u.username.toLowerCase() === cleanUsername ||
      (u.email && u.email.toLowerCase() === cleanEmail)
  );

  if (existingUser) {
    if (!state.userBands) state.userBands = [];
    const relationExists = state.userBands.some(
      (ub: any) => ub.user_id === existingUser.id && ub.band_id === targetBandId
    );

    if (relationExists) {
      // Invitación aún sin estrenar (o perdida): se genera un token nuevo y se reenvía el correo,
      // que invalida el anterior.
      if (invitacionPendiente(existingUser) && existingUser.email?.includes('@')) {
        const tokenNuevo = asignarInvitacion(existingUser);
        saveState(state);
        try {
          await dbUpsertUser(existingUser);
        } catch (e) {
          console.warn('No se pudo persistir la invitación reenviada:', e);
        }
        const bandInfo = (state.registeredBands || []).find(
          (b: any) => b.band_id === targetBandId || b.id === targetBandId
        );
        sendMemberInvitationEmail({
          toEmail: existingUser.email,
          memberName: existingUser.name,
          bandName: bandInfo?.nombre_banda || 'tu banda',
          instrument: existingUser.instrument,
          username: existingUser.username,
          activationToken: tokenNuevo,
        }).catch((err) =>
          console.error('[Miembros] Error reenviando invitación:', err?.message || err)
        );
        return res.status(200).json({
          id: existingUser.id,
          username: existingUser.username,
          name: existingUser.name,
          role: 'member',
          instrument: existingUser.instrument,
          reinvitado: true,
        });
      }
      return res
        .status(400)
        .json({ error: 'Este usuario ya está registrado en esta banda.' });
    }

    // Un admin de la plataforma no se añade a bandas desde fuera.
    if (existingUser.role === 'admin') {
      return res.status(403).json({ error: 'No se puede añadir esa cuenta.' });
    }

    // Se vincula SIEMPRE como miembro: el rol de líder no se concede a una cuenta ajena.
    const newUB = {
      id: `ub-${existingUser.id}-${targetBandId}`,
      user_id: existingUser.id,
      band_id: targetBandId,
      role: 'member',
      createdAt: new Date().toISOString(),
    };
    state.userBands.push(newUB);
    try {
      await dbUpsertUserBand(newUB);
    } catch (e) {
      console.warn('Failed to append userBand to Supabase', e);
    }

    saveState(state);

    // No se devuelve la ficha de una cuenta ajena (email, banda...): solo lo mínimo para la lista.
    return res.status(201).json({
      id: existingUser.id,
      username: existingUser.username,
      name: existingUser.name,
      role: 'member',
      instrument: existingUser.instrument,
    });
  }

  // Create new user record
  const { hash, salt } = hashPassword(password);
  const existingIds = new Set<string>(
    (state.users || []).map((u: any) => u.id)
  );
  const newUserId = generateUniqueSlugId('user', cleanUsername, existingIds);

  const newUser = {
    id: newUserId,
    username: cleanUsername,
    name: name.trim(),
    email: cleanEmail,
    role: role === 'leader' ? 'leader' : 'member',
    instrument: instrument ? instrument.trim() : 'Músico',
    avatarColor: avatarColor || '#3b82f6',
    passwordHash: hash,
    salt: salt,
    band_id: targetBandId,
    // La cuenta la crea el director con una contraseña provisional y el miembro la termina de
    // activar poniendo la suya en /auth/activate-member. Esta marca es lo que distingue "cuenta
    // recién invitada" de "cuenta ya en uso": sin ella, esa ruta valía para cambiarle la
    // contraseña a cualquiera con solo saber su email.
    createdAt: new Date().toISOString(),
  };
  // La invitación pendiente (con su token de un solo uso) se guarda en ui_preferences para que
  // sobreviva a un reinicio del servidor; el token en claro solo viaja en el correo.
  const tokenInvitacion = asignarInvitacion(newUser);

  state.users.push(newUser);

  const newUB = {
    id: `ub-${newUserId}-${targetBandId}`,
    user_id: newUserId,
    band_id: targetBandId,
    role: role === 'leader' ? 'leader' : 'member',
    createdAt: new Date().toISOString(),
  };
  if (!state.userBands) state.userBands = [];
  state.userBands.push(newUB);

  saveState(state);

  try {
    await dbUpsertUser(newUser);
    await dbUpsertUserBand(newUB);
  } catch (err) {
    console.warn(
      'Notice: User saved locally, Supabase update skipped or pending:',
      err
    );
  }

  // Enviar email de invitación al nuevo miembro si tiene email válido
  if (cleanEmail && cleanEmail.includes('@')) {
    const appUrl = getProductionAppUrl(process.env.APP_URL);
    const bandInfo = (state.registeredBands || []).find(
      (b: any) => b.band_id === targetBandId || b.id === targetBandId
    );
    const bName = bandInfo?.nombre_banda || 'tu banda';
    sendMemberInvitationEmail({
      toEmail: cleanEmail,
      memberName: name.trim(),
      bandName: bName,
      instrument: instrument ? instrument.trim() : undefined,
      username: cleanUsername,
      activationToken: tokenInvitacion,
    }).catch((err) => {
      console.error(
        `[Miembros] Error enviando email de invitación a ${cleanEmail}:`,
        err?.message || err
      );
    });
  }

  res.status(201).json(getSafeUsers([newUser])[0]);
});

// Update user (Leader or self)
router.put('/users/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const loggedUser = (req as any).user;
  if (loggedUser.role !== 'leader' && loggedUser.id !== id) {
    return res.status(403).json({
      error: 'Acceso denegado. Solo puedes modificar tu propia cuenta.',
    });
  }
  const {
    name,
    role,
    instrument,
    avatarColor,
    newPassword,
    googleOAuth,
    plan,
  } = req.body;

  const state = loadState();
  const userIndex = state.users.findIndex((u: any) => u.id === id);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  const user = state.users[userIndex];

  // El id se busca sobre state.users, que es la lista de toda la plataforma, y el permiso de
  // arriba se conforma con ser 'leader' —que en esta app lo es casi todo el mundo en su propia
  // banda—. Es decir: con el id de alguien de otra banda se le cambiaba el nombre, el rol y,
  // más abajo, la contraseña. Editar a otro exige compartir banda con él.
  if (loggedUser.id !== id && !compartenBanda(state, user, req)) {
    return res
      .status(403)
      .json({ error: 'Acceso denegado. Ese usuario no pertenece a tu banda.' });
  }

  // Un admin de la plataforma no se edita desde una banda.
  if (loggedUser.id !== id && user.role === 'admin') {
    return res.status(403).json({ error: 'Acceso denegado.' });
  }

  // Fijar la contraseña de otra persona solo se permite sobre cuentas que son SOLO de esta banda
  // (ver puedeRestablecerContrasenaDe). Se comprueba antes de aplicar ningún cambio.
  if (newPassword && newPassword.trim().length > 0 && loggedUser.id !== id && !puedeRestablecerContrasenaDe(state, user, req)) {
    return res.status(403).json({
      error: 'No puedes cambiar la contraseña de una cuenta que pertenece a otras bandas.',
    });
  }

  if (name) user.name = name.trim();
  if (googleOAuth !== undefined) user.googleOAuth = googleOAuth;

  if (plan !== undefined) {
    const targetBandId = req.body.band_id || user.band_id;
    const loggedUserEmail = (
      loggedUser.email ||
      loggedUser.username ||
      ''
    ).toLowerCase();
    const cleanTargetCheck = targetBandId
      ? targetBandId.replace(/^(band|reg)-/, '')
      : '';

    // Antes esto era `role === 'leader' || role === 'admin'`, y como en esta app todos los
    // usuarios reales son 'leader', anulaba las dos comprobaciones correctas de más abajo:
    // cualquiera podía cambiar el plan de suscripción de cualquier banda. El único escape
    // global legítimo es el admin de la plataforma.
    const isPlatformAdmin = loggedUser.role === 'admin';
    const isBandLeaderInUserBands = (state.userBands || []).some(
      (ub: any) =>
        (ub.user_id === loggedUser.id ||
          (loggedUserEmail && ub.email?.toLowerCase() === loggedUserEmail)) &&
        ub.band_id &&
        ub.band_id.replace(/^(band|reg)-/, '') === cleanTargetCheck &&
        (ub.role === 'leader' || ub.role === 'admin')
    );
    const isBandOwner = (state.registeredBands || []).some(
      (b: any) =>
        (b.user_id === loggedUser.id ||
          (loggedUserEmail && b.email?.toLowerCase() === loggedUserEmail)) &&
        ((b.band_id &&
          b.band_id.replace(/^(band|reg)-/, '') === cleanTargetCheck) ||
          (b.id && b.id.replace(/^(band|reg)-/, '') === cleanTargetCheck))
    );

    // El plan de pago solo cambia por el flujo de Stripe (webhook / confirm-success). Que el
    // líder pudiera escribir `plan` aquí le daba un plan de pago sin pagar.
    void isBandLeaderInUserBands;
    void isBandOwner;
    if (!isPlatformAdmin) {
      return res.status(403).json({
        error: 'El plan de suscripción solo se cambia desde la facturación.',
      });
    }

    if (targetBandId) {
      const cleanTarget = targetBandId.replace(/^(band|reg)-/, '');
      const cleanCheck = cleanTarget.toLowerCase().trim();
      if (!state.registeredBands) state.registeredBands = [];
      let regBand = state.registeredBands.find((b: any) => {
        const bBid = (b.band_id || '')
          .replace(/^(band|reg)-/, '')
          .toLowerCase()
          .trim();
        const bId = (b.id || '')
          .replace(/^(band|reg)-/, '')
          .toLowerCase()
          .trim();
        const bName = (b.nombre_banda || b.bandName || b.name || '')
          .toLowerCase()
          .trim();
        return (
          b.band_id === targetBandId ||
          b.id === targetBandId ||
          bBid === cleanCheck ||
          bId === cleanCheck ||
          (cleanCheck.length > 1 && bName === cleanCheck)
        );
      });
      const normPlan = normalizePlan(plan);
      if (!regBand) {
        regBand = {
          id: `reg-${cleanTarget}`,
          band_id: targetBandId,
          nombre_banda:
            user.band_id === targetBandId
              ? user.bandName || 'Banda'
              : cleanTarget,
          email: user.email || '',
          plan: normPlan,
          user_id: user.id,
          fecha_registro: new Date().toISOString(),
        };
        state.registeredBands.push(regBand);
      } else {
        regBand.plan = normPlan;
      }
      try {
        await dbUpsertRegisteredBand(regBand);
      } catch (e) {}
    }

    const cleanUserBand = user.band_id
      ? user.band_id.replace(/^(band|reg)-/, '')
      : '';
    const cleanTarget = targetBandId
      ? targetBandId.replace(/^(band|reg)-/, '')
      : '';
    if (!targetBandId || cleanUserBand === cleanTarget) {
      user.plan = normalizePlan(plan);
    }
  }

  // Security guard: Only leaders can change the role property.
  if (role !== undefined) {
    if (loggedUser.role === 'leader') {
      // loggedUser ya viene validado por requireAuth más arriba en este mismo handler: band_id
      // nunca falta aquí, así que no hace falta (ni conviene) un valor por defecto.
      const targetBandId = loggedUser.band_id;
      if (!state.userBands) state.userBands = [];
      const userBand = state.userBands.find(
        (ub: any) => ub.user_id === id && ub.band_id === targetBandId
      );
      if (userBand) {
        userBand.role = role === 'leader' ? 'leader' : 'member';
      }
      user.role = role === 'leader' ? 'leader' : 'member';
    } else {
      console.warn(
        `[Security Guard] Non-leader user ${loggedUser.username} (${loggedUser.id}) attempted to set role to '${role}' on user ${id}. Field ignored.`
      );
    }
  }

  if (instrument !== undefined) user.instrument = instrument.trim();
  if (avatarColor) user.avatarColor = avatarColor;
  if (req.body.main_band_id !== undefined) {
    // Antes se aceptaba cualquier main_band_id del body sin comprobar que quien hace la
    // petición perteneciera a esa banda: bastaba editar el propio perfil para auto-asignarse
    // como leader de una banda ajena con solo conocer su id.
    if (
      req.body.main_band_id &&
      !puedeEscribirEnBanda(req, req.body.main_band_id)
    ) {
      return res.status(403).json({ error: 'No perteneces a esa banda.' });
    }
    user.main_band_id = req.body.main_band_id;
    if (req.body.main_band_id) user.band_id = req.body.main_band_id;
  }

  if (newPassword && newPassword.trim().length > 0) {
    const { hash, salt } = hashPassword(newPassword.trim());
    user.passwordHash = hash;
    user.salt = salt;
  }

  saveState(state);

  try {
    await dbUpsertUser(user);
  } catch (err) {
    console.warn(
      'Notice: User updated locally, Supabase update skipped or pending:',
      err
    );
  }

  const { passwordHash, salt, ...safeUser } = user;
  res.json(safeUser);
});

// Delete user (Leader operation)
router.delete('/users/:id', requireAuth, requireLeader, async (req, res) => {
  const { id } = req.params;
  const targetBandId = (req as any).user?.band_id;
  if (!targetBandId) {
    return res
      .status(401)
      .json({ error: 'Acceso no autorizado. Inicie sesión para continuar.' });
  }
  const state = loadState();
  const cleanTarget = targetBandId.replace(/^(band|reg)-/, '');

  if (!state.userBands) state.userBands = [];

  const targetUserObj = state.users?.find((u: any) => u.id === id);
  const targetEmail = (targetUserObj?.email || '').toLowerCase();

  const userBandRelation = state.userBands.find(
    (ub: any) =>
      ub.user_id === id &&
      ub.band_id?.replace(/^(band|reg)-/, '') === cleanTarget
  );

  if (
    !userBandRelation &&
    (!targetUserObj ||
      targetUserObj.band_id?.replace(/^(band|reg)-/, '') !== cleanTarget)
  ) {
    return res
      .status(404)
      .json({ error: 'Usuario no encontrado en esta banda' });
  }

  if (userBandRelation?.role === 'leader') {
    const leaderCount = state.userBands.filter(
      (ub: any) =>
        ub.band_id?.replace(/^(band|reg)-/, '') === cleanTarget &&
        ub.role === 'leader'
    ).length;
    if (leaderCount <= 1) {
      return res
        .status(400)
        .json({ error: 'No se puede eliminar al único líder de la banda' });
    }
  }

  // Remove relationship from userBands
  state.userBands = state.userBands.filter(
    (ub: any) =>
      !(
        ub.user_id === id &&
        ub.band_id?.replace(/^(band|reg)-/, '') === cleanTarget
      )
  );

  // Clear from registeredBands
  if (state.registeredBands && Array.isArray(state.registeredBands)) {
    state.registeredBands.forEach((rb: any) => {
      const rbClean = rb.band_id
        ? rb.band_id.replace(/^(band|reg)-/, '')
        : rb.id
          ? rb.id.replace(/^(band|reg)-/, '')
          : '';
      if (rbClean === cleanTarget) {
        if (rb.user_id === id) rb.user_id = null;
        if (targetEmail && rb.email?.toLowerCase() === targetEmail)
          rb.email = '';
      }
    });
  }

  // Check if user is in any other band
  const otherBandsExist = state.userBands.some((ub: any) => ub.user_id === id);
  if (!otherBandsExist) {
    state.users = state.users.filter((u: any) => u.id !== id);
  } else if (targetUserObj) {
    const activeClean = targetUserObj.band_id
      ? targetUserObj.band_id.replace(/^(band|reg)-/, '')
      : '';
    const mainClean = targetUserObj.main_band_id
      ? targetUserObj.main_band_id.replace(/^(band|reg)-/, '')
      : '';
    const remainingBands = await buildAvailableBandsForUser(
      state,
      targetUserObj
    );

    if (Array.isArray(targetUserObj.band_order)) {
      targetUserObj.band_order = targetUserObj.band_order.filter(
        (bId: string) => bId.replace(/^(band|reg)-/, '') !== cleanTarget
      );
    }

    if (mainClean === cleanTarget) {
      targetUserObj.main_band_id =
        remainingBands.length > 0 ? remainingBands[0].band_id : undefined;
    }

    if (activeClean === cleanTarget) {
      if (remainingBands.length > 0) {
        targetUserObj.band_id =
          targetUserObj.main_band_id || remainingBands[0].band_id;
        const chosen =
          remainingBands.find(
            (b: any) => b.band_id === targetUserObj.band_id
          ) || remainingBands[0];
        targetUserObj.bandName = chosen.bandName || chosen.nombre_banda;
      } else {
        targetUserObj.band_id = undefined;
        targetUserObj.bandName = undefined;
      }
    }
    try {
      await dbUpsertUser(targetUserObj);
    } catch (err) {
      console.warn('Notice syncing user active band after removal:', err);
    }
  }

  saveState(state);

  try {
    await dbDeleteUserFromBand(id, targetBandId);
    if (!otherBandsExist) {
      await dbDeleteUser(id);
    }
  } catch (err) {
    console.warn(
      'Notice: User deleted locally, Supabase update skipped or pending:',
      err
    );
  }

  res.json({ success: true, id });
});

export default router;
