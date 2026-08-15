import express from "express";
import crypto from "crypto";
import { ACTIVE_SESSIONS, verifyPassword, hashPassword, getSafeUsers } from "../auth.js";
import { loadState, saveState, requireAuth, requireLeader, getEpkConfigForBand, BAKANDEYA_BAND_ID, getUserFromRequestLocal } from "../state.js";
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
  normalizePlan,
  dbMigrateAllPlansToNewTiers
} from "../db.js";

// Run asynchronous migration check on database records
dbMigrateAllPlansToNewTiers().catch(() => {});

export function cleanBandId(bandId?: string): string {
  if (!bandId) return 'bakandeya';
  return bandId.replace(/^(band|reg)-/, '');
}

export function buildAvailableBandsForUser(state: any, targetUser: any): any[] {
  if (!targetUser) return [];
  if (!state.userBands) state.userBands = [];
  
  const availableBands: any[] = [];
  const seenCleanBandIds = new Set<string>();

  const getLogoForBand = (bandId: string, defaultName: string) => {
    const epk = getEpkConfigForBand(state, bandId, defaultName);
    if (epk?.logoUrl && epk.logoUrl.trim().length > 0) return epk.logoUrl;
    const bandInfo = (state.registeredBands || []).find((b: any) =>
      b.band_id === bandId || b.id === bandId ||
      (b.band_id && b.band_id.replace(/^(band|reg)-/, '') === bandId.replace(/^(band|reg)-/, '')) ||
      (b.id && b.id.replace(/^(band|reg)-/, '') === bandId.replace(/^(band|reg)-/, ''))
    );
    if (bandInfo?.logo_url && bandInfo.logo_url.trim().length > 0) return bandInfo.logo_url;
    if (bandInfo?.imagen_url && bandInfo.imagen_url.trim().length > 0) return bandInfo.imagen_url;
    const clean = bandId.replace(/^(band|reg)-/, '');
    if (clean === 'bakandeya') return '/logo_bakandeya_bueno_sin_fondo.png';
    return '';
  };

  const userEmail = (targetUser.email || targetUser.username || "").toLowerCase();

  const getPlanForBand = (bid: string, fallbackPlan?: string) => {
    if (!bid) return normalizePlan(fallbackPlan || 'ensayo');
    const cleanId = bid.replace(/^(band|reg)-/, '');
    const regBand = (state.registeredBands || []).find((b: any) =>
      b.band_id === bid || b.id === bid ||
      (b.band_id && b.band_id.replace(/^(band|reg)-/, '') === cleanId) ||
      (b.id && b.id.replace(/^(band|reg)-/, '') === cleanId)
    );
    return normalizePlan(regBand?.plan || fallbackPlan || 'ensayo');
  };

  const mainClean = (targetUser.main_band_id || targetUser.band_id || BAKANDEYA_BAND_ID).replace(/^(band|reg)-/, '');

  // 1. Bands from state.userBands
  const userBandsList = state.userBands.filter((ub: any) =>
    ub.user_id === targetUser.id ||
    (state.users && state.users.some((u: any) => u.id === ub.user_id && userEmail && (u.email?.toLowerCase() === userEmail || u.username?.toLowerCase() === userEmail)))
  );

  userBandsList.forEach((ub: any) => {
    if (!ub.band_id) return;
    const cleanId = ub.band_id.replace(/^(band|reg)-/, '');
    if (seenCleanBandIds.has(cleanId)) return;
    seenCleanBandIds.add(cleanId);

    const bandInfo = (state.registeredBands || []).find((b: any) =>
      b.band_id === ub.band_id || b.id === ub.band_id ||
      (b.band_id && b.band_id.replace(/^(band|reg)-/, '') === cleanId) ||
      (b.id && b.id.replace(/^(band|reg)-/, '') === cleanId)
    );
    const formattedFallback = cleanId ? cleanId.charAt(0).toUpperCase() + cleanId.slice(1) : "Banda";
    const bandName = bandInfo?.nombre_banda || (ub.band_id === targetUser.band_id ? targetUser.bandName : null) || formattedFallback;
    availableBands.push({
      band_id: ub.band_id,
      bandName,
      nombre_banda: bandName,
      role: ub.role || "member",
      userId: targetUser.id,
      plan: getPlanForBand(ub.band_id, targetUser.band_id === ub.band_id ? targetUser.plan : 'ensayo'),
      logoUrl: getLogoForBand(ub.band_id, bandName),
      is_main: cleanId === mainClean
    });
  });

  // 2. Bands from state.registeredBands
  const registeredBandsForUser = (state.registeredBands || []).filter(
    (b: any) => b.user_id === targetUser.id || (b.email && b.email.toLowerCase() === userEmail)
  );
  registeredBandsForUser.forEach((b: any) => {
    const bid = b.band_id || b.id;
    if (!bid) return;
    const cleanId = bid.replace(/^(band|reg)-/, '');
    if (seenCleanBandIds.has(cleanId)) return;
    seenCleanBandIds.add(cleanId);

    const bName = b.nombre_banda || "Banda";
    availableBands.push({
      band_id: bid,
      bandName: bName,
      nombre_banda: bName,
      role: "leader",
      userId: targetUser.id,
      plan: normalizePlan(b.plan) || getPlanForBand(bid, 'ensayo'),
      logoUrl: getLogoForBand(bid, bName),
      is_main: cleanId === mainClean
    });
  });

  // 3. Bands from other accounts matching same email/username
  (state.users || []).forEach((u: any) => {
    if (!u.band_id) return;
    if (u.id === targetUser.id || (userEmail && (u.email?.toLowerCase() === userEmail || u.username?.toLowerCase() === userEmail))) {
      const cleanId = u.band_id.replace(/^(band|reg)-/, '');
      if (seenCleanBandIds.has(cleanId)) return;
      seenCleanBandIds.add(cleanId);

      const bName = u.bandName || u.name || "Banda";
      availableBands.push({
        band_id: u.band_id,
        bandName: bName,
        nombre_banda: bName,
        role: u.role || "leader",
        userId: targetUser.id,
        plan: getPlanForBand(u.band_id, 'ensayo'),
        logoUrl: getLogoForBand(u.band_id, bName),
        is_main: cleanId === mainClean
      });
    }
  });

  // 4. Current active band
  const currentBid = targetUser.band_id || BAKANDEYA_BAND_ID;
  const cleanCurrent = currentBid.replace(/^(band|reg)-/, '');
  if (!seenCleanBandIds.has(cleanCurrent)) {
    seenCleanBandIds.add(cleanCurrent);
    const bName = targetUser.bandName || targetUser.name || "BAKANDEYA";
    availableBands.push({
      band_id: currentBid,
      bandName: bName,
      role: targetUser.role || "leader",
      userId: targetUser.id,
      plan: getPlanForBand(currentBid, targetUser.plan || 'ensayo'),
      logoUrl: getLogoForBand(currentBid, bName),
      is_main: cleanCurrent === mainClean
    });
  }

  // Sort available bands:
  // 1. If band_order exists, use that order.
  // 2. Otherwise, main band comes first.
  const orderList = Array.isArray(targetUser.band_order) ? targetUser.band_order.map((id: string) => cleanBandId(id)) : [];
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
import { loginRateLimiter } from "../middleware/rateLimiter.js";
import { generateUniqueSlugId, slugify } from "../utils/slug.js";

const router = express.Router();

// Register new band & user
router.post("/auth/register", async (req, res) => {
  const { bandName, email, password, plan, leaderName } = req.body;

  if (!bandName || !email || !password) {
    return res.status(400).json({ error: "Nombre de banda, email y contraseña son requeridos" });
  }

  const state = loadState();
  const cleanEmail = email.trim().toLowerCase();
  const rawBandName = bandName.trim();

  // Check if existing users exist for this email
  const existingUsersWithEmail = state.users.filter(
    (u: any) => u.username.toLowerCase() === cleanEmail || u.email?.toLowerCase() === cleanEmail
  );

  if (existingUsersWithEmail.length > 0) {
    // If user exists, check if password matches existing account
    const matchesAnyPassword = existingUsersWithEmail.some((u: any) =>
      verifyPassword(password, u.passwordHash, u.salt)
    );

    if (!matchesAnyPassword) {
      return res.status(400).json({
        error: "Este correo electrónico ya está registrado. Introduce la contraseña correcta de tu cuenta para añadir una nueva banda."
      });
    }

    // Check if this exact band name is already registered for this user
    const alreadyRegisteredSameBand = existingUsersWithEmail.some(
      (u: any) => (u.bandName || u.name || "").toLowerCase() === rawBandName.toLowerCase()
    );

    if (alreadyRegisteredSameBand) {
      return res.status(400).json({
        error: `Ya tienes una banda registrada con el nombre "${rawBandName}".`
      });
    }
  }

  const isExistingUser = existingUsersWithEmail.length > 0;
  const selectedPlan = normalizePlan(plan || 'ensayo');

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
  const bandId = generateUniqueSlugId("band", rawBandName, existingIds);
  existingIds.add(bandId);

  const regId = generateUniqueSlugId("reg", rawBandName, existingIds);
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
      userToUse.band_order = [cleanBId, ...userToUse.band_order.filter((b: string) => cleanBandId(b) !== cleanBId)];
    } else {
      userToUse.band_order = [cleanBandId(bandId)];
    }
  } else {
    const { hash, salt } = hashPassword(password);
    const emailUserPart = cleanEmail.split("@")[0] || rawBandName;
    const defaultName = emailUserPart.charAt(0).toUpperCase() + emailUserPart.slice(1);
    const userId = generateUniqueSlugId("user", `${emailUserPart}-${slugify(rawBandName)}`, existingIds);
    existingIds.add(userId);

    userToUse = {
      id: userId,
      username: cleanEmail,
      name: leaderName ? leaderName.trim() : defaultName,
      bandName: rawBandName,
      email: cleanEmail,
      role: "leader",
      plan: selectedPlan,
      instrument: `Líder de ${rawBandName}`,
      avatarColor: "#f2ca50",
      passwordHash: hash,
      salt: salt,
      band_id: bandId,
      main_band_id: bandId,
      band_order: [cleanBandId(bandId)],
      createdAt: new Date().toISOString()
    };

    state.users.push(userToUse);
    isNewUserCreated = true;
  }

  // Generate session token
  const token = crypto.randomBytes(32).toString("hex");
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
      estilo_musical: "Por definir",
      localizacion: "España",
      telefono: "",
      instagram: "",
      spotify_youtube: "",
      aforo_promedio: 0,
      estado_cuenta: "activo",
      notas: `Plan seleccionado: ${selectedPlan}. Registrado desde BANDMANAGER.ai web app.`
    };
    if (!state.registeredBands) state.registeredBands = [];
    state.registeredBands.push(newRegisteredBandRecord);

    if (!state.userBands) state.userBands = [];
    const hasUB = state.userBands.some((ub: any) => ub.user_id === userToUse.id && ub.band_id === bandId);
    const newUB = hasUB ? state.userBands.find((ub: any) => ub.user_id === userToUse.id && ub.band_id === bandId) : {
      id: `ub-${userToUse.id}-${bandId}`,
      user_id: userToUse.id,
      band_id: bandId,
      role: "leader",
      createdAt: new Date().toISOString()
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
    console.warn("Notice: Band registration saved locally, Supabase update skipped or pending:", sheetErr);
  }

  // Calculate availableBands dynamically
  const availableBands = buildAvailableBandsForUser(state, userToUse);

  res.cookie("bakandeya_token", token, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: false,
    sameSite: "lax",
    path: "/"
  });

  const { passwordHash, salt: _, ...safeUser } = userToUse;
  res.status(201).json({ token, user: safeUser, availableBands, multipleBands: availableBands.length > 1 });
});

// Endpoint to fetch all registered bands from Supabase
const handleGetRegisteredBands = async (req: any, res: any) => {
  try {
    const userBandId = req.user?.band_id ;
    const isBakandeyaOrAdmin = userBandId === 'band-bakandeya' || userBandId === 'reg-bakandeya' || req.user?.role === 'admin';

    const bands = await dbGetRegisteredBands();

    const filteredBands = isBakandeyaOrAdmin
      ? bands
      : bands.filter((b: any) =>
          b.band_id === userBandId ||
          b.id === userBandId ||
          b.id === `reg-${userBandId.replace('band-', '')}` ||
          (req.user?.email && b.email?.toLowerCase() === req.user.email.toLowerCase())
        );

    res.json({ registeredBands: filteredBands });
  } catch (err: any) {
    console.error("Error fetching registered bands:", err);
    res.status(500).json({ error: "No se pudieron obtener las bandas registradas." });
  }
};

router.get("/registered-bands", requireAuth, handleGetRegisteredBands);
router.get("/users/registered-bands", requireAuth, handleGetRegisteredBands);

// Endpoint to force assign Bakandeya
router.all("/sync-bakandeya", async (req, res) => {
  res.json({ success: true, message: "Banda Bakandeya asignada y sincronizada en Supabase PostgreSQL." });
});

// Check invitation for activating added members
router.post("/auth/check-invitation", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "El correo electrónico es requerido." });
  }

  const state = loadState();
  const cleanEmail = email.trim().toLowerCase();

  const user = state.users.find(
    (u: any) => (u.email && u.email.toLowerCase() === cleanEmail) || u.username.toLowerCase() === cleanEmail
  );

  if (!user) {
    return res.status(404).json({
      error: "No se ha encontrado ninguna invitación o registro para este correo. Pide al director de tu banda que te agregue primero en el apartado de Miembros."
    });
  }

  // Find all bands this user belongs to
  if (!state.userBands) state.userBands = [];
  const userBandsList = state.userBands.filter((ub: any) => ub.user_id === user.id);

  const bands = userBandsList.map((ub: any) => {
    const bandInfo = (state.registeredBands || []).find((b: any) => b.band_id === ub.band_id);
    return {
      band_id: ub.band_id,
      bandName: bandInfo?.nombre_banda || user.bandName || "Bakandeya",
      role: ub.role || "member"
    };
  });

  res.json({
    success: true,
    name: user.name,
    username: user.username,
    email: user.email || cleanEmail,
    bands
  });
});

// Activate added member (set password & username)
router.post("/auth/activate-member", async (req, res) => {
  const { email, username, name, password } = req.body;

  if (!email || !username || !name || !password) {
    return res.status(400).json({ error: "Todos los campos son requeridos para activar tu cuenta." });
  }

  const state = loadState();
  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim().toLowerCase();

  const user = state.users.find(
    (u: any) => (u.email && u.email.toLowerCase() === cleanEmail) || u.username.toLowerCase() === cleanEmail
  );

  if (!user) {
    return res.status(404).json({ error: "Usuario no encontrado para activación." });
  }

  // Check if chosen username is already taken by a different user
  const usernameTaken = state.users.some(
    (u: any) => u.id !== user.id && u.username.toLowerCase() === cleanUsername
  );

  if (usernameTaken) {
    return res.status(400).json({ error: "El nombre de usuario ya está registrado por otra persona." });
  }

  // Hash new password
  const { hash, salt } = hashPassword(password);

  user.name = name.trim();
  user.username = cleanUsername;
  user.email = cleanEmail;
  user.passwordHash = hash;
  user.salt = salt;

  // Generate session token
  const token = crypto.randomBytes(32).toString("hex");
  const sessionObj = { userId: user.id, createdAt: Date.now() };
  ACTIVE_SESSIONS[token] = sessionObj;
  if (!state.sessions) state.sessions = {};
  state.sessions[token] = sessionObj;

  saveState(state);

  // Sync to Supabase asynchronously
  try {
    await dbUpsertUser(user);
  } catch (err) {
    console.warn("Notice: Activated user updated locally, Supabase sync pending:", err);
  }

  // Compute available bands
  if (!state.userBands) state.userBands = [];
  const userBandsList = state.userBands.filter((ub: any) => ub.user_id === user.id);
  const availableBands = userBandsList.map((ub: any) => {
    const bandInfo = (state.registeredBands || []).find((b: any) => b.band_id === ub.band_id);
    return {
      band_id: ub.band_id,
      bandName: bandInfo?.nombre_banda || "Banda",
      role: ub.role || "member",
      userId: user.id
    };
  });

  res.cookie("bakandeya_token", token, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: false,
    sameSite: "lax",
    path: "/"
  });

  const { passwordHash: _, salt: __, ...safeUser } = user;
  res.json({ token, user: safeUser, availableBands });
});

// Google Social OAuth Login / Registration
router.post("/auth/google", loginRateLimiter, async (req, res) => {
  const { email, name, uid, accessToken, bandName: inputBandName, leaderName } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email de Google es requerido" });
  }

  const state = loadState();
  const cleanEmail = email.trim().toLowerCase();

  // Sync users from Supabase
  try {
    const dbUsers = await dbGetUsers();
    if (dbUsers && dbUsers.length > 0) {
      dbUsers.forEach((su: any) => {
        const idx = state.users.findIndex(
          (u: any) => u.id === su.id || (u.email && u.email.toLowerCase() === su.email?.toLowerCase())
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
      (u.username && u.username.toLowerCase() === cleanEmail) ||
      (uid && u.googleUid === uid)
  );

  const customBandName = inputBandName?.trim() || (leaderName ? `Banda de ${leaderName}` : null);

  if (user) {
    // Update existing user with googleUid / authProvider if not set
    user.googleUid = uid || user.googleUid;
    user.authProvider = "google";
    if (name && (!user.name || user.name === user.username)) {
      user.name = name;
    }

    // If a new band name was explicitly requested during registration with existing email
    if (customBandName) {
      const existingIds = new Set<string>();
      (state.users || []).forEach((u: any) => { if (u.id) existingIds.add(u.id); if (u.band_id) existingIds.add(u.band_id); });
      (state.registeredBands || []).forEach((b: any) => { if (b.id) existingIds.add(b.id); if (b.band_id) existingIds.add(b.band_id); });

      const bandId = generateUniqueSlugId("band", customBandName, existingIds);

      const regBand = {
        id: `reg-${bandId.replace('band-', '')}`,
        band_id: bandId,
        nombre_banda: customBandName,
        contacto_nombre: user.name || leaderName || cleanEmail.split('@')[0],
        email: cleanEmail,
        plan: normalizePlan(user.plan || 'ensayo'),
        fecha_registro: new Date().toISOString(),
        estado_cuenta: 'activo',
        notas: 'Registrado con Google OAuth (Nueva Banda)'
      };
      if (!state.registeredBands) state.registeredBands = [];
      state.registeredBands.push(regBand);

      user.bandName = customBandName;
      user.band_id = bandId;
      user.role = "leader";

      if (!state.userBands) state.userBands = [];
      const newUB = {
        id: `ub-${user.id}-${bandId}`,
        user_id: user.id,
        band_id: bandId,
        role: "leader"
      };
      state.userBands.push(newUB);

      try {
        await dbUpsertUserBand(newUB);
        await dbUpsertRegisteredBand(regBand);
        await dbUpsertUser(user);
      } catch (e) {
        console.warn("Notice: Supabase sync warning:", e);
      }
    } else {
      // Regular Google Login: default to main or favorite band
      const preferredBandId =
        user.main_band_id ||
        (Array.isArray(user.band_order) && user.band_order.length > 0 ? user.band_order[0] : null) ||
        user.band_id ||
        'band-bakandeya';

      const normalizedBandId = preferredBandId.startsWith('band-') ? preferredBandId : (preferredBandId === 'bakandeya' ? 'band-bakandeya' : `band-${preferredBandId}`);
      user.band_id = normalizedBandId;
      if (!user.main_band_id) {
        user.main_band_id = normalizedBandId;
      }

      const cleanPref = cleanBandId(normalizedBandId);
      const bandInfo = (state.registeredBands || []).find((b: any) =>
        b.band_id === user.band_id || b.id === user.band_id ||
        cleanBandId(b.band_id) === cleanPref || cleanBandId(b.id) === cleanPref
      ) || (state.bands || []).find((b: any) =>
        b.band_id === user.band_id || b.id === user.band_id ||
        cleanBandId(b.band_id) === cleanPref || cleanBandId(b.id) === cleanPref
      );

      if (bandInfo) {
        user.bandName = bandInfo.nombre_banda || bandInfo.bandName || bandInfo.name || user.bandName;
        if (bandInfo.plan) {
          user.plan = normalizePlan(bandInfo.plan);
        }
      }
    }
  } else {
    // Auto-register new user authenticated with Google OAuth
    const newUserId = uid || `user-google-${Date.now()}`;
    const cleanName = leaderName || name || cleanEmail.split("@")[0] || "Miembro Banda";
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

    const bandId = generateUniqueSlugId("band", finalBandName, existingIds);
    existingIds.add(bandId);

    // Register new band
    const regBand = {
      id: `reg-${bandId.replace('band-', '')}`,
      band_id: bandId,
      nombre_banda: finalBandName,
      contacto_nombre: cleanName,
      email: cleanEmail,
      plan: 'ensayo',
      fecha_registro: new Date().toISOString(),
      estado_cuenta: 'activo',
      notas: 'Registrado con Google OAuth'
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
      role: "leader",
      plan: "ensayo",
      createdAt: new Date().toISOString(),
      googleUid: uid,
      authProvider: "google"
    };

    if (!state.users) state.users = [];
    state.users.push(user);

    // Sync user-band relationship
    if (!state.userBands) state.userBands = [];
    const newUB = {
      id: `ub-${user.id}-${bandId}`,
      user_id: user.id,
      band_id: bandId,
      role: "leader"
    };
    state.userBands.push(newUB);

    try {
      await dbUpsertUserBand(newUB);
      await dbUpsertRegisteredBand(regBand);
      await dbUpsertUser(user);
    } catch (err) {
      console.warn("Could not sync new Google user and band to Supabase:", err);
    }
  }

  if (accessToken) {
    user.googleAccessToken = accessToken;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const sessionObj = { userId: user.id, googleAccessToken: accessToken, createdAt: Date.now() };
  ACTIVE_SESSIONS[token] = sessionObj;
  if (!state.sessions) state.sessions = {};
  state.sessions[token] = sessionObj;

  saveState(state);

  const availableBands = buildAvailableBandsForUser(state, user);
  const { passwordHash: _, salt: __, ...safeUser } = user;

  res.cookie("bakandeya_token", token, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: false,
    sameSite: "lax",
    path: "/"
  });

  res.json({ token, user: safeUser, availableBands });
});

// Login
router.post("/auth/login", loginRateLimiter, async (req, res) => {
  const { username, password, band_id } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Usuario y contraseña son requeridos" });
  }

  const state = loadState();
  const cleanInput = username.trim().toLowerCase();

  // Sync users from Supabase to support persistent logins across serverless restarts
  try {
    const dbUsers = await dbGetUsers();
    if (dbUsers && dbUsers.length > 0) {
      dbUsers.forEach((su: any) => {
        const idx = state.users.findIndex((u: any) => u.id === su.id || (u.username && u.username.toLowerCase() === su.username?.toLowerCase()));
        if (idx !== -1) {
          if (su.passwordHash) state.users[idx].passwordHash = su.passwordHash;
          if (su.salt) state.users[idx].salt = su.salt;
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
    (u: any) => (u.username && u.username.toLowerCase() === cleanInput) || (u.email && u.email.toLowerCase() === cleanInput)
  );

  if (matchingUsers.length === 0) {
    return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
  }

  // Filter those that pass password check
  const validUsers = matchingUsers.filter((u: any) => verifyPassword(password, u.passwordHash, u.salt));

  if (validUsers.length === 0) {
    return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
  }

  // Choose target user profile & default to main or favorite band
  const userMainBand =
    validUsers.find((u: any) => u.main_band_id)?.main_band_id ||
    validUsers[0]?.main_band_id ||
    (Array.isArray(validUsers[0]?.band_order) && validUsers[0].band_order.length > 0 ? validUsers[0].band_order[0] : null) ||
    validUsers[0]?.band_id ||
    'band-bakandeya';

  const preferredBandId = band_id || userMainBand;
  const cleanPref = cleanBandId(preferredBandId);

  const foundMatching = validUsers.find((u: any) => u.band_id === preferredBandId || cleanBandId(u.band_id) === cleanPref);
  let selectedUser = foundMatching || validUsers[0];

  // Ensure active band on login is the preferred / favorite band
  selectedUser.band_id = preferredBandId.startsWith('band-') ? preferredBandId : (preferredBandId === 'bakandeya' ? 'band-bakandeya' : `band-${preferredBandId}`);
  if (!selectedUser.main_band_id) {
    selectedUser.main_band_id = selectedUser.band_id;
  }

  // Look up band info for name and plan
  const bandInfo = (state.registeredBands || []).find((b: any) =>
    b.band_id === selectedUser.band_id || b.id === selectedUser.band_id ||
    cleanBandId(b.band_id) === cleanPref || cleanBandId(b.id) === cleanPref
  ) || (state.bands || []).find((b: any) =>
    b.band_id === selectedUser.band_id || b.id === selectedUser.band_id ||
    cleanBandId(b.band_id) === cleanPref || cleanBandId(b.id) === cleanPref
  );

  if (bandInfo) {
    selectedUser.bandName = bandInfo.nombre_banda || bandInfo.bandName || bandInfo.name || selectedUser.bandName;
    if (bandInfo.plan) {
      selectedUser.plan = normalizePlan(bandInfo.plan);
    }
  }

  const token = crypto.randomBytes(32).toString("hex");
  const sessionObj = { userId: selectedUser.id, createdAt: Date.now() };
  ACTIVE_SESSIONS[token] = sessionObj;
  if (!state.sessions) state.sessions = {};
  state.sessions[token] = sessionObj;
  saveState(state);

  // Recalculate availableBands
  const availableBands = buildAvailableBandsForUser(state, selectedUser);

  res.cookie("bakandeya_token", token, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: false,
    sameSite: "lax",
    path: "/"
  });

  const { passwordHash, salt, ...safeUser } = selectedUser;
  res.json({ token, user: safeUser, availableBands, multipleBands: availableBands.length > 1 });
});

// Request password reset code
router.post("/auth/reset-password/request", loginRateLimiter, async (req, res) => {
  const { emailOrUsername } = req.body;
  if (!emailOrUsername || !emailOrUsername.trim()) {
    return res.status(400).json({ error: "Indica tu correo electrónico o nombre de usuario" });
  }

  const state = loadState();
  const cleanInput = emailOrUsername.trim().toLowerCase();

  const user = (state.users || []).find(
    (u: any) => u.username.toLowerCase() === cleanInput || u.email?.toLowerCase() === cleanInput
  );

  if (!user) {
    return res.status(404).json({ error: "No se encontró ningún usuario con ese correo o usuario." });
  }

  // Generate cryptographically secure 6 digit code
  const code = crypto.randomInt(100000, 1000000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

  // Store reset code on user object(s) with matching email/username
  (state.users || []).forEach((u: any) => {
    if (u.username.toLowerCase() === cleanInput || u.email?.toLowerCase() === cleanInput) {
      u.resetCode = code;
      u.resetCodeExpires = expiresAt;
    }
  });

  saveState(state);

  // Mask email for privacy display
  const userEmail = user.email || user.username;
  const parts = userEmail.split("@");
  let maskedEmail = userEmail;
  if (parts.length === 2) {
    const name = parts[0];
    const domain = parts[1];
    const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}***`;
    maskedEmail = `${maskedName}@${domain}`;
  }

  return res.json({
    success: true,
    message: `Código de verificación enviado a ${maskedEmail}`,
    emailMasked: maskedEmail
  });
});

// Confirm password reset with code and new password
router.post("/auth/reset-password/confirm", loginRateLimiter, async (req, res) => {
  const { emailOrUsername, code, newPassword } = req.body;

  if (!emailOrUsername || !code || !newPassword) {
    return res.status(400).json({ error: "Todos los campos son obligatorios." });
  }

  if (newPassword.trim().length < 6) {
    return res.status(400).json({ error: "La nueva contraseña debe tener al menos 6 caracteres." });
  }

  const state = loadState();
  const cleanInput = emailOrUsername.trim().toLowerCase();
  const cleanCode = String(code).trim();

  const matchingUsers = (state.users || []).filter(
    (u: any) => u.username.toLowerCase() === cleanInput || u.email?.toLowerCase() === cleanInput
  );

  if (matchingUsers.length === 0) {
    return res.status(404).json({ error: "Usuario no encontrado." });
  }

  const validUser = matchingUsers.find((u: any) => u.resetCode && String(u.resetCode) === cleanCode && u.resetCodeExpires > Date.now());

  if (!validUser) {
    return res.status(400).json({ error: "El código de verificación es incorrecto o ha caducado. Solicita un nuevo código." });
  }

  // Hash new password
  const { hash, salt } = hashPassword(newPassword.trim());

  // Update password for all user records sharing this email/username
  matchingUsers.forEach((u: any) => {
    u.passwordHash = hash;
    u.salt = salt;
    delete u.resetCode;
    delete u.resetCodeExpires;
  });

  saveState(state);

  return res.json({
    success: true,
    message: "Contraseña restablecida con éxito. Ya puedes iniciar sesión con tu nueva contraseña."
  });
});

// Verify current session
router.get("/auth/me", (req, res) => {
  const authHeader = req.headers.authorization;
  let token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : (req.headers["x-auth-token"] as string || req.query.token as string);

  if (!token && req.headers.cookie) {
    const match = req.headers.cookie.match(/bakandeya_token=([^;]+)/);
    if (match) token = match[1];
  }

  const state = loadState();
  let session = (token && ACTIVE_SESSIONS[token]) || (token && state.sessions && state.sessions[token]);
  let user = session ? state.users.find((u: any) => u.id === session.userId) : null;

  if (!user && token) {
    user = state.users.find((u: any) =>
      u.id === token ||
      (u.email && u.email.toLowerCase() === token.toLowerCase()) ||
      (u.username && u.username.toLowerCase() === token.toLowerCase())
    );
  }

  if (!user) {
    return res.status(401).json({ error: "Sesión no iniciada o expirada" });
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
    res.cookie("bakandeya_token", token, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: false,
      sameSite: "lax",
      path: "/"
    });
  }

  // Sync active band plan
  if (user.band_id && state.registeredBands) {
    const cleanCurrent = user.band_id.replace(/^(band|reg)-/, '');
    const regBand = state.registeredBands.find(
      (b: any) => b.band_id === user.band_id || b.id === user.band_id ||
      (b.band_id && b.band_id.replace(/^(band|reg)-/, '') === cleanCurrent) ||
      (b.id && b.id.replace(/^(band|reg)-/, '') === cleanCurrent)
    );
    if (regBand && regBand.plan) {
      user.plan = regBand.plan;
    }
  }

  // Recalculate availableBands
  const availableBands = buildAvailableBandsForUser(state, user);

  const { passwordHash, salt, ...safeUser } = user;
  res.json({ token, user: safeUser, availableBands, multipleBands: availableBands.length > 1 });
});

// Switch Active Band
router.post("/auth/switch-band", (req, res) => {
  const authHeader = req.headers.authorization;
  let token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : (req.headers["x-auth-token"] as string || req.query.token as string);

  if (!token && req.headers.cookie) {
    const match = req.headers.cookie.match(/bakandeya_token=([^;]+)/);
    if (match) token = match[1];
  }

  const state = loadState();
  let session = (token && ACTIVE_SESSIONS[token]) || (token && state.sessions && state.sessions[token]);
  let currentUser = session ? state.users.find((u: any) => u.id === session.userId) : null;

  if (!currentUser && token) {
    currentUser = state.users.find((u: any) =>
      u.id === token ||
      (u.email && u.email.toLowerCase() === token.toLowerCase()) ||
      (u.username && u.username.toLowerCase() === token.toLowerCase())
    );
  }

  if (!currentUser) {
    return res.status(401).json({ error: "Sesión no válida o expirada" });
  }

  const { band_id } = req.body;
  if (!band_id) {
    return res.status(400).json({ error: "band_id es requerido" });
  }

  const userEmail = currentUser.email?.toLowerCase() || currentUser.username.toLowerCase();
  const cleanTargetBand = band_id.replace(/^(band|reg)-/, '');

  // Check if they have access to this band (either via userBands, registeredBands or legacy duplicates)
  if (!state.userBands) state.userBands = [];
  const hasAccessInUserBands = state.userBands.some(
    (ub: any) => (ub.user_id === currentUser!.id || (userEmail && ub.email?.toLowerCase() === userEmail)) && ub.band_id && ub.band_id.replace(/^(band|reg)-/, '') === cleanTargetBand
  );

  const hasAccessInRegisteredBands = (state.registeredBands || []).some(
    (b: any) =>
      (b.user_id === currentUser!.id || b.email?.toLowerCase() === userEmail) &&
      ((b.band_id && b.band_id.replace(/^(band|reg)-/, '') === cleanTargetBand) ||
       (b.id && b.id.replace(/^(band|reg)-/, '') === cleanTargetBand))
  );

  const legacyTargetUser = state.users.find(
    (u: any) =>
      u.band_id && u.band_id.replace(/^(band|reg)-/, '') === cleanTargetBand &&
      ((u.email && u.email.toLowerCase() === userEmail) || u.username.toLowerCase() === userEmail)
  );

  const isBakandeyaBand = cleanTargetBand === 'bakandeya';

  if (!hasAccessInUserBands && !hasAccessInRegisteredBands && !legacyTargetUser && !isBakandeyaBand) {
    return res.status(404).json({ error: "No tienes acceso a esta banda" });
  }

  let targetUser = currentUser;
  if (legacyTargetUser) {
    targetUser = legacyTargetUser;
  }
  
  const bandInfo = (state.registeredBands || []).find(
    (b: any) => b.band_id === band_id || b.id === band_id ||
    (b.band_id && b.band_id.replace(/^(band|reg)-/, '') === cleanTargetBand) ||
    (b.id && b.id.replace(/^(band|reg)-/, '') === cleanTargetBand)
  ) || (state.bands || []).find(
    (b: any) => b.band_id === band_id || b.id === band_id ||
    (b.band_id && b.band_id.replace(/^(band|reg)-/, '') === cleanTargetBand) ||
    (b.id && b.id.replace(/^(band|reg)-/, '') === cleanTargetBand)
  );

  const resolvedName = bandInfo ? (bandInfo.nombre_banda || bandInfo.bandName || bandInfo.name) : (cleanTargetBand === 'bakandeya' ? 'BAKANDEYA' : targetUser.bandName || 'Banda');
  const resolvedPlan = normalizePlan(bandInfo?.plan || targetUser.plan || 'ensayo');

  targetUser.band_id = band_id;
  targetUser.bandName = resolvedName;
  targetUser.plan = resolvedPlan;

  // Sync band_id and plan on all user records matching email
  if (state.users) {
    state.users.forEach((u: any) => {
      if (u.id === targetUser.id || (userEmail && (u.email?.toLowerCase() === userEmail || u.username?.toLowerCase() === userEmail))) {
        u.band_id = band_id;
        u.bandName = resolvedName;
        u.plan = resolvedPlan;
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

  res.cookie("bakandeya_token", effectiveToken, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: false,
    sameSite: "lax",
    path: "/"
  });

  // Recalculate availableBands dynamically using userBands
  const availableBands = buildAvailableBandsForUser(state, targetUser);

  const { passwordHash, salt, ...safeUser } = targetUser;
  res.json({ token: effectiveToken, user: safeUser, availableBands });
});

// Logout
router.post("/auth/logout", (req, res) => {
  const { token } = req.body;
  if (token) {
    delete ACTIVE_SESSIONS[token];
    const state = loadState();
    if (state.sessions && state.sessions[token]) {
      delete state.sessions[token];
      saveState(state);
    }
  }
  res.clearCookie("bakandeya_token", { path: "/" });
  res.json({ success: true });
});

// Set main / primary band
router.post(['/set-main-band', '/users/set-main-band'], requireAuth, async (req, res) => {
  try {
    const user_id = (req as any).user.id;
    const { band_id } = req.body;
    if (!band_id) {
      return res.status(400).json({ error: 'band_id es requerido' });
    }

    const state = loadState();
    const cleanTarget = band_id.replace(/^(band|reg)-/, '');
    const reqEmail = ((req as any).user?.email || (req as any).user?.username || '').toLowerCase();
    const user = state.users?.find((u: any) => u.id === user_id || (reqEmail && (u.email?.toLowerCase() === reqEmail || u.username?.toLowerCase() === reqEmail)));
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const bandInfo = (state.registeredBands || []).find((b: any) =>
      b.band_id === band_id || b.id === band_id ||
      (b.band_id && b.band_id.replace(/^(band|reg)-/, '') === cleanTarget) ||
      (b.id && b.id.replace(/^(band|reg)-/, '') === cleanTarget)
    ) || (state.bands || []).find((b: any) =>
      b.band_id === band_id || b.id === band_id ||
      (b.band_id && b.band_id.replace(/^(band|reg)-/, '') === cleanTarget) ||
      (b.id && b.id.replace(/^(band|reg)-/, '') === cleanTarget)
    );

    const resolvedName = bandInfo ? (bandInfo.nombre_banda || bandInfo.bandName || bandInfo.name) : (cleanTarget === 'bakandeya' ? 'BAKANDEYA' : user.bandName || 'Banda');
    const resolvedPlan = normalizePlan(bandInfo?.plan || user.plan || 'ensayo');

    user.band_id = band_id;
    user.main_band_id = band_id;
    user.bandName = resolvedName;
    user.plan = resolvedPlan;

    const cleanBId = cleanBandId(band_id);
    if (Array.isArray(user.band_order)) {
      user.band_order = [cleanBId, ...user.band_order.filter((b: string) => cleanBandId(b) !== cleanBId)];
    } else {
      user.band_order = [cleanBId];
    }

    // Update on all user records sharing this email/username
    const userEmail = (user.email || user.username || reqEmail).toLowerCase();
    if (state.users) {
      state.users.forEach((u: any) => {
        if (u.id === user.id || (userEmail && (u.email?.toLowerCase() === userEmail || u.username?.toLowerCase() === userEmail))) {
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
      console.warn("Could not sync main band to Supabase:", err);
    }

    const availableBands = buildAvailableBandsForUser(state, user);
    const { passwordHash, salt, ...safeUser } = user;
    res.json({ success: true, user: safeUser, availableBands });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al establecer la banda principal' });
  }
});

// Set custom band order for user
router.post(['/set-band-order', '/users/set-band-order'], requireAuth, async (req, res) => {
  try {
    const user_id = (req as any).user.id;
    const { band_order } = req.body;
    if (!Array.isArray(band_order)) {
      return res.status(400).json({ error: 'band_order debe ser un array de IDs de banda' });
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
        if (u.id === user.id || (userEmail && (u.email?.toLowerCase() === userEmail || u.username?.toLowerCase() === userEmail))) {
          u.band_order = band_order;
        }
      });
    }

    saveState(state);
    try {
      await dbUpsertUser(user);
    } catch (err) {
      console.warn("Could not sync band order to Supabase:", err);
    }

    const availableBands = buildAvailableBandsForUser(state, user);
    const { passwordHash, salt, ...safeUser } = user;
    res.json({ success: true, user: safeUser, availableBands });
  } catch (err: any) {
    console.error('Error setting band order:', err);
    res.status(500).json({ error: err.message || 'Error al guardar el orden de bandas' });
  }
});

// Create/Add a new band for current logged in user
router.post(['/create-band', '/users/create-band'], requireAuth, async (req, res) => {
  try {
    const user_id = (req as any).user.id;
    const { bandName, plan, estilo_musical, localizacion, leaderName, contacto_nombre } = req.body;

    if (!bandName || !bandName.trim()) {
      return res.status(400).json({ error: 'El nombre del proyecto o banda es obligatorio' });
    }

    const state = loadState();
    const user = state.users?.find((u: any) => u.id === user_id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const rawBandName = bandName.trim();
    const cleanEmail = (user.email || user.username || '').toLowerCase();
    const selectedPlan = normalizePlan(plan || user.plan || 'ensayo');
    const leaderDisplayName = (leaderName || contacto_nombre || user.name || user.username || rawBandName).trim();

    const existingIds = new Set<string>();
    (state.users || []).forEach((u: any) => {
      if (u.id) existingIds.add(u.id);
      if (u.band_id) existingIds.add(u.band_id);
    });
    (state.registeredBands || []).forEach((b: any) => {
      if (b.id) existingIds.add(b.id);
      if (b.band_id) existingIds.add(b.band_id);
    });

    const bandId = generateUniqueSlugId("band", rawBandName, existingIds);
    existingIds.add(bandId);

    const regId = generateUniqueSlugId("reg", rawBandName, existingIds);
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
      estilo_musical: estilo_musical?.trim() || "Por definir",
      localizacion: localizacion?.trim() || "España",
      telefono: "",
      instagram: "",
      spotify_youtube: "",
      aforo_promedio: 0,
      estado_cuenta: "activo",
      notas: `Creada desde BandSwitcherModal por ${user.name || user.username}`
    };

    if (!state.registeredBands) state.registeredBands = [];
    state.registeredBands.push(newRegisteredBandRecord);

    if (!state.userBands) state.userBands = [];
    const newUB = {
      id: `ub-${user.id}-${bandId}`,
      user_id: user.id,
      band_id: bandId,
      role: "leader",
      createdAt: new Date().toISOString()
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
      user.band_order = [bandId, ...user.band_order.filter((id: string) => id !== bandId && id.replace(/^(band|reg)-/, '') !== cleanBandId(bandId))];
    } else {
      user.band_order = [bandId];
    }

    // Sync to all user records with matching email
    if (state.users) {
      state.users.forEach((u: any) => {
        if (u.id === user.id || (cleanEmail && (u.email?.toLowerCase() === cleanEmail || u.username?.toLowerCase() === cleanEmail))) {
          u.band_id = bandId;
          u.bandName = rawBandName;
          u.plan = selectedPlan;
          if (!u.main_band_id) u.main_band_id = bandId;
          if (Array.isArray(u.band_order)) {
            u.band_order = [bandId, ...u.band_order.filter((id: string) => id !== bandId && id.replace(/^(band|reg)-/, '') !== cleanBandId(bandId))];
          }
        }
      });
    }

    saveState(state);

    try {
      await dbUpsertRegisteredBand(newRegisteredBandRecord);
      await dbUpsertUser(user);
      await dbUpsertUserBand(newUB);
    } catch (err) {
      console.warn("Notice: Band saved locally, Supabase sync pending:", err);
    }

    const availableBands = buildAvailableBandsForUser(state, user);
    const { passwordHash, salt, ...safeUser } = user;

    res.status(201).json({
      success: true,
      message: `¡Proyecto "${rawBandName}" creado con éxito!`,
      band_id: bandId,
      bandName: rawBandName,
      user: safeUser,
      availableBands
    });
  } catch (err: any) {
    console.error('Error creating new band:', err);
    res.status(500).json({ error: err.message || 'Error al crear el nuevo proyecto' });
  }
});

router.delete(['/leave-band/:bandId', '/users/leave-band/:bandId'], requireAuth, async (req, res) => {
  try {
    const user_id = (req as any).user.id;
    const rawBandId = req.params.bandId;

    if (!user_id || !rawBandId) {
      return res.status(400).json({ error: 'ID de usuario o banda faltante' });
    }

    const state = loadState();
    const cleanTarget = rawBandId.replace(/^(band|reg)-/, '');
    const user = state.users?.find((u: any) => u.id === user_id);
    const userEmail = (user?.email || (req as any).user?.email || '').toLowerCase();
    const userUsername = (user?.username || '').toLowerCase();

    // 1. Remove relationship from state.userBands
    if (state.userBands && Array.isArray(state.userBands)) {
      state.userBands = state.userBands.filter((ub: any) => {
        const ubClean = ub.band_id ? ub.band_id.replace(/^(band|reg)-/, '') : '';
        const isUserMatch = ub.user_id === user_id ||
          (userEmail && state.users?.some((u: any) => u.id === ub.user_id && (u.email?.toLowerCase() === userEmail || u.username?.toLowerCase() === userEmail)));
        return !(isUserMatch && ubClean === cleanTarget);
      });
    }

    // 2. Remove / unlink on state.registeredBands if matching
    if (state.registeredBands && Array.isArray(state.registeredBands)) {
      state.registeredBands = state.registeredBands.filter((rb: any) => {
        const rbClean = rb.band_id ? rb.band_id.replace(/^(band|reg)-/, '') : (rb.id ? rb.id.replace(/^(band|reg)-/, '') : '');
        if (rbClean === cleanTarget) {
          if (rb.user_id === user_id || (userEmail && rb.email?.toLowerCase() === userEmail)) {
            // Delete registered band completely if owned by this user
            return false;
          }
          if (rb.user_id === user_id) rb.user_id = null;
          if (userEmail && rb.email?.toLowerCase() === userEmail) rb.email = '';
        }
        return true;
      });
    }

    // 3. Clear from any other accounts of the same user with that band_id
    if (state.users && Array.isArray(state.users)) {
      state.users.forEach((u: any) => {
        const matchesUser = u.id === user_id || (userEmail && (u.email?.toLowerCase() === userEmail || u.username?.toLowerCase() === userEmail));
        if (matchesUser) {
          const uBandClean = u.band_id ? u.band_id.replace(/^(band|reg)-/, '') : '';
          const uMainClean = u.main_band_id ? u.main_band_id.replace(/^(band|reg)-/, '') : '';
          if (Array.isArray(u.band_order)) {
            u.band_order = u.band_order.filter((id: string) => id.replace(/^(band|reg)-/, '') !== cleanTarget);
          }
          if (uBandClean === cleanTarget || uMainClean === cleanTarget) {
            const remBands = buildAvailableBandsForUser(state, u).filter((b: any) => b.band_id.replace(/^(band|reg)-/, '') !== cleanTarget);
            if (uMainClean === cleanTarget) {
              u.main_band_id = remBands.length > 0 ? remBands[0].band_id : undefined;
            }
            if (uBandClean === cleanTarget) {
              if (remBands.length > 0) {
                u.band_id = u.main_band_id || remBands[0].band_id;
                const chosen = remBands.find((b: any) => b.band_id === u.band_id) || remBands[0];
                u.bandName = chosen.bandName || chosen.nombre_banda;
              } else {
                u.band_id = 'band-bakandeya';
                u.bandName = 'BAKANDEYA';
              }
            }
          }
        }
      });
    }

    // 4. Update current user instance
    if (user) {
      const activeClean = user.band_id ? user.band_id.replace(/^(band|reg)-/, '') : '';
      const mainClean = user.main_band_id ? user.main_band_id.replace(/^(band|reg)-/, '') : '';
      const remainingBands = buildAvailableBandsForUser(state, user).filter((b: any) => b.band_id.replace(/^(band|reg)-/, '') !== cleanTarget);

      if (Array.isArray(user.band_order)) {
        user.band_order = user.band_order.filter((id: string) => id.replace(/^(band|reg)-/, '') !== cleanTarget);
      }

      if (mainClean === cleanTarget) {
        user.main_band_id = remainingBands.length > 0 ? remainingBands[0].band_id : undefined;
      }

      if (activeClean === cleanTarget) {
        if (remainingBands.length > 0) {
          user.band_id = user.main_band_id || remainingBands[0].band_id;
          const chosenBand = remainingBands.find((b: any) => b.band_id === user.band_id) || remainingBands[0];
          user.bandName = chosenBand.bandName || chosenBand.nombre_banda;
        } else {
          user.band_id = 'band-bakandeya';
          user.bandName = 'BAKANDEYA';
        }
      }

      try {
        await dbUpsertUser(user);
      } catch (err) {
        console.warn('Notice updating user active band in Supabase after leaving:', err);
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

    const updatedUser = user ? state.users?.find((u: any) => u.id === user_id) || user : null;
    const updatedAvailableBands = updatedUser ? buildAvailableBandsForUser(state, updatedUser) : [];

    res.json({
      success: true,
      message: 'Has abandonado la banda correctamente',
      user: updatedUser ? getSafeUsers([updatedUser])[0] : null,
      availableBands: updatedAvailableBands
    });
  } catch (error) {
    console.error('Error al abandonar banda:', error);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});

// Associate an existing user to the leader's band using exact email match
router.post("/users/associate", requireAuth, requireLeader, async (req, res) => {
  try {
    const { email, role, instrument } = req.body;

    if (!email) {
      return res.status(400).json({ error: "El email del músico es requerido" });
    }

    const state = loadState();
    const targetBandId = (req as any).user?.band_id || "band-bakandeya";
    const cleanSearch = email.trim().toLowerCase();

    const targetUser = state.users.find((u: any) => 
      (u.email && u.email.toLowerCase() === cleanSearch) ||
      (u.username && u.username.toLowerCase() === cleanSearch)
    );

    if (!targetUser) {
      return res.status(404).json({ error: "No existe ningún usuario registrado con este email." });
    }

    if (!state.userBands) state.userBands = [];
    const relationExists = state.userBands.some(
      (ub: any) => ub.user_id === targetUser.id && ub.band_id === targetBandId
    );

    if (relationExists) {
      return res.status(400).json({ error: "Este músico ya es miembro de tu banda." });
    }

    // Add the relationship
    const newUB = {
      id: `ub-${targetUser.id}-${targetBandId}`,
      user_id: targetUser.id,
      band_id: targetBandId,
      role: role === "leader" ? "leader" : "member",
      createdAt: new Date().toISOString()
    };
    state.userBands.push(newUB);
    try {
      await dbUpsertUserBand(newUB);
    } catch (e) {
      console.warn("Failed to append userBand to Supabase", e);
    }

    if (instrument) {
      targetUser.instrument = instrument.trim();
    }

    saveState(state);

    try {
      await dbUpsertUser(targetUser);
    } catch (err) {
      console.warn("Notice: Sync pending:", err);
    }

    const { passwordHash, salt, ...safeUser } = targetUser;
    res.status(201).json(safeUser);
  } catch (err: any) {
    console.error("Error in /users/associate:", err);
    res.status(500).json({ error: err?.message || "Error al asociar el músico a la banda" });
  }
});

// Get all band users (without password hashes)
router.get("/users", requireAuth, async (req, res) => {
  const state = loadState();
  const bandId = (req as any).user?.band_id || "band-bakandeya";

  if (!state.userBands) state.userBands = [];
  const bandUserIds = new Set(
    state.userBands.filter((ub: any) => ub.band_id === bandId).map((ub: any) => ub.user_id)
  );

  const bandUsers = state.users.filter((u: any) => bandUserIds.has(u.id)).map((u: any) => {
    const ub = state.userBands.find((ub: any) => ub.user_id === u.id && ub.band_id === bandId);
    return { ...u, role: ub?.role || 'member' };
  });

  try {
    const dbUsers = await dbGetUsers(bandId);
    if (dbUsers && dbUsers.length > 0) {
      const mergedUsers = dbUsers.map((u: any) => {
        const ub = state.userBands.find((ub: any) => ub.user_id === u.id && ub.band_id === bandId);
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
router.post("/users", requireAuth, requireLeader, async (req, res) => {
  const { username, name, password, role, instrument, avatarColor, email, band_id } = req.body;

  if (!username || !name || !password) {
    return res.status(400).json({ error: "Nombre de usuario, nombre real y contraseña son requeridos" });
  }

  const state = loadState();
  const cleanUsername = username.trim().toLowerCase();
  const cleanEmail = email ? email.trim().toLowerCase() : cleanUsername;
  const targetBandId = band_id || (req as any).user?.band_id || "band-bakandeya";

  // Check if a user with this email or username already exists
  const existingUser = state.users.find(
    (u: any) => u.username.toLowerCase() === cleanUsername || (u.email && u.email.toLowerCase() === cleanEmail)
  );

  if (existingUser) {
    if (!state.userBands) state.userBands = [];
    const relationExists = state.userBands.some(
      (ub: any) => ub.user_id === existingUser.id && ub.band_id === targetBandId
    );

    if (relationExists) {
      return res.status(400).json({ error: "Este usuario ya está registrado en esta banda." });
    }

    // Just create the relationship in state.userBands
    const newUB = {
      id: `ub-${existingUser.id}-${targetBandId}`,
      user_id: existingUser.id,
      band_id: targetBandId,
      role: role === "leader" ? "leader" : "member",
      createdAt: new Date().toISOString()
    };
    state.userBands.push(newUB);
    try {
      await dbUpsertUserBand(newUB);
    } catch (e) {
      console.warn("Failed to append userBand to Supabase", e);
    }

    if (instrument) existingUser.instrument = instrument.trim();
    saveState(state);

    const { passwordHash, salt: _, ...safeUser } = existingUser;
    return res.status(201).json(safeUser);
  }

  // Create new user record
  const { hash, salt } = hashPassword(password);
  const existingIds = new Set<string>((state.users || []).map((u: any) => u.id));
  const newUserId = generateUniqueSlugId("user", cleanUsername, existingIds);

  const newUser = {
    id: newUserId,
    username: cleanUsername,
    name: name.trim(),
    email: cleanEmail,
    role: role === "leader" ? "leader" : "member",
    instrument: instrument ? instrument.trim() : "Músico",
    avatarColor: avatarColor || "#3b82f6",
    passwordHash: hash,
    salt: salt,
    band_id: targetBandId,
    createdAt: new Date().toISOString()
  };

  state.users.push(newUser);

  const newUB = {
    id: `ub-${newUserId}-${targetBandId}`,
    user_id: newUserId,
    band_id: targetBandId,
    role: role === "leader" ? "leader" : "member",
    createdAt: new Date().toISOString()
  };
  if (!state.userBands) state.userBands = [];
  state.userBands.push(newUB);

  saveState(state);

  try {
    await dbUpsertUser(newUser);
    await dbUpsertUserBand(newUB);
  } catch (err) {
    console.warn("Notice: User saved locally, Supabase update skipped or pending:", err);
  }

  const { passwordHash, salt: _, ...safeUser } = newUser;
  res.status(201).json(safeUser);
});

// Update user (Leader or self)
router.put("/users/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const loggedUser = (req as any).user;
  if (loggedUser.role !== 'leader' && loggedUser.id !== id) {
    return res.status(403).json({ error: "Acceso denegado. Solo puedes modificar tu propia cuenta." });
  }
  const { name, role, instrument, avatarColor, newPassword, googleOAuth, plan } = req.body;

  const state = loadState();
  const userIndex = state.users.findIndex((u: any) => u.id === id);

  if (userIndex === -1) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }

  const user = state.users[userIndex];
  if (name) user.name = name.trim();
  if (googleOAuth !== undefined) user.googleOAuth = googleOAuth;

  if (plan !== undefined) {
    const targetBandId = req.body.band_id || user.band_id;
    const loggedUserEmail = (loggedUser.email || loggedUser.username || '').toLowerCase();
    const cleanTargetCheck = targetBandId ? targetBandId.replace(/^(band|reg)-/, '') : '';
    
    const isGlobalLeader = loggedUser.role === 'leader' || loggedUser.role === 'admin';
    const isBandLeaderInUserBands = (state.userBands || []).some((ub: any) =>
      (ub.user_id === loggedUser.id || (loggedUserEmail && ub.email?.toLowerCase() === loggedUserEmail)) &&
      ub.band_id && ub.band_id.replace(/^(band|reg)-/, '') === cleanTargetCheck &&
      (ub.role === 'leader' || ub.role === 'admin')
    );
    const isBandOwner = (state.registeredBands || []).some((b: any) =>
      (b.user_id === loggedUser.id || (loggedUserEmail && b.email?.toLowerCase() === loggedUserEmail)) &&
      ((b.band_id && b.band_id.replace(/^(band|reg)-/, '') === cleanTargetCheck) || (b.id && b.id.replace(/^(band|reg)-/, '') === cleanTargetCheck))
    );

    if (!isGlobalLeader && !isBandLeaderInUserBands && !isBandOwner) {
      return res.status(403).json({ error: "Sólo los administradores o líderes de la banda pueden cambiar el plan de suscripción." });
    }

    if (targetBandId) {
      const cleanTarget = targetBandId.replace(/^(band|reg)-/, '');
      if (!state.registeredBands) state.registeredBands = [];
      let regBand = state.registeredBands.find((b: any) =>
        b.band_id === targetBandId || b.id === targetBandId ||
        (b.band_id && b.band_id.replace(/^(band|reg)-/, '') === cleanTarget) ||
        (b.id && b.id.replace(/^(band|reg)-/, '') === cleanTarget)
      );
      const normPlan = normalizePlan(plan);
      if (!regBand) {
        regBand = {
          id: `reg-${cleanTarget}`,
          band_id: targetBandId,
          nombre_banda: user.band_id === targetBandId ? (user.bandName || 'Banda') : cleanTarget,
          email: user.email || '',
          plan: normPlan,
          user_id: user.id,
          fecha_registro: new Date().toISOString()
        };
        state.registeredBands.push(regBand);
      } else {
        regBand.plan = normPlan;
      }
      try { await dbUpsertRegisteredBand(regBand); } catch(e) {}
    }

    const cleanUserBand = user.band_id ? user.band_id.replace(/^(band|reg)-/, '') : '';
    const cleanTarget = targetBandId ? targetBandId.replace(/^(band|reg)-/, '') : '';
    if (!targetBandId || cleanUserBand === cleanTarget) {
      user.plan = normalizePlan(plan);
    }
  }

  // Security guard: Only leaders can change the role property.
  if (role !== undefined) {
    if (loggedUser.role === 'leader') {
      const targetBandId = (req as any).user?.band_id || "band-bakandeya";
      if (!state.userBands) state.userBands = [];
      const userBand = state.userBands.find((ub: any) => ub.user_id === id && ub.band_id === targetBandId);
      if (userBand) {
        userBand.role = role === "leader" ? "leader" : "member";
      }
      user.role = role === "leader" ? "leader" : "member";
    } else {
      console.warn(`[Security Guard] Non-leader user ${loggedUser.username} (${loggedUser.id}) attempted to set role to '${role}' on user ${id}. Field ignored.`);
    }
  }

  if (instrument !== undefined) user.instrument = instrument.trim();
  if (avatarColor) user.avatarColor = avatarColor;
  if (req.body.main_band_id !== undefined) {
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
    console.warn("Notice: User updated locally, Supabase update skipped or pending:", err);
  }

  const { passwordHash, salt, ...safeUser } = user;
  res.json(safeUser);
});

// Delete user (Leader operation)
router.delete("/users/:id", requireAuth, requireLeader, async (req, res) => {
  const { id } = req.params;
  const state = loadState();
  const targetBandId = (req as any).user?.band_id || "band-bakandeya";
  const cleanTarget = targetBandId.replace(/^(band|reg)-/, '');

  if (!state.userBands) state.userBands = [];

  const targetUserObj = state.users?.find((u: any) => u.id === id);
  const targetEmail = (targetUserObj?.email || '').toLowerCase();

  const userBandRelation = state.userBands.find(
    (ub: any) => ub.user_id === id && ub.band_id?.replace(/^(band|reg)-/, '') === cleanTarget
  );

  if (!userBandRelation && (!targetUserObj || targetUserObj.band_id?.replace(/^(band|reg)-/, '') !== cleanTarget)) {
    return res.status(404).json({ error: "Usuario no encontrado en esta banda" });
  }

  if (userBandRelation?.role === "leader") {
    const leaderCount = state.userBands.filter(
      (ub: any) => ub.band_id?.replace(/^(band|reg)-/, '') === cleanTarget && ub.role === "leader"
    ).length;
    if (leaderCount <= 1) {
      return res.status(400).json({ error: "No se puede eliminar al único líder de la banda" });
    }
  }

  // Remove relationship from userBands
  state.userBands = state.userBands.filter(
    (ub: any) => !(ub.user_id === id && ub.band_id?.replace(/^(band|reg)-/, '') === cleanTarget)
  );

  // Clear from registeredBands
  if (state.registeredBands && Array.isArray(state.registeredBands)) {
    state.registeredBands.forEach((rb: any) => {
      const rbClean = rb.band_id ? rb.band_id.replace(/^(band|reg)-/, '') : (rb.id ? rb.id.replace(/^(band|reg)-/, '') : '');
      if (rbClean === cleanTarget) {
        if (rb.user_id === id) rb.user_id = null;
        if (targetEmail && rb.email?.toLowerCase() === targetEmail) rb.email = '';
      }
    });
  }

  // Check if user is in any other band
  const otherBandsExist = state.userBands.some((ub: any) => ub.user_id === id);
  if (!otherBandsExist) {
    state.users = state.users.filter((u: any) => u.id !== id);
  } else if (targetUserObj) {
    const activeClean = targetUserObj.band_id ? targetUserObj.band_id.replace(/^(band|reg)-/, '') : '';
    const mainClean = targetUserObj.main_band_id ? targetUserObj.main_band_id.replace(/^(band|reg)-/, '') : '';
    const remainingBands = buildAvailableBandsForUser(state, targetUserObj);

    if (Array.isArray(targetUserObj.band_order)) {
      targetUserObj.band_order = targetUserObj.band_order.filter((bId: string) => bId.replace(/^(band|reg)-/, '') !== cleanTarget);
    }

    if (mainClean === cleanTarget) {
      targetUserObj.main_band_id = remainingBands.length > 0 ? remainingBands[0].band_id : undefined;
    }

    if (activeClean === cleanTarget) {
      if (remainingBands.length > 0) {
        targetUserObj.band_id = targetUserObj.main_band_id || remainingBands[0].band_id;
        const chosen = remainingBands.find((b: any) => b.band_id === targetUserObj.band_id) || remainingBands[0];
        targetUserObj.bandName = chosen.bandName || chosen.nombre_banda;
      } else {
        targetUserObj.band_id = 'band-bakandeya';
        targetUserObj.bandName = 'BAKANDEYA';
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
    console.warn("Notice: User deleted locally, Supabase update skipped or pending:", err);
  }

  res.json({ success: true, id });
});

export default router;
