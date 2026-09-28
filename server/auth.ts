import express from "express";
import crypto from "crypto";
import { normalizePlan } from "./db.js";

// Active sessions stored in memory and persisted
export const ACTIVE_SESSIONS: Record<string, { userId: string; createdAt: number }> = {};

export function hashPassword(password: string, salt?: string, iterations = 100000) {
  const actualSalt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, actualSalt, iterations, 64, "sha512").toString("hex");
  return { hash, salt: actualSalt, iterations };
}

export function verifyPassword(password: string, hash: string, salt: string) {
  if (!password) return false;

  if (!hash || !salt) return false;

  try {
    // Try OWASP standard 100,000 iterations first
    const verifyHash100k = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
    if (hash.length === verifyHash100k.length && crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(verifyHash100k))) {
      return true;
    }

    // Fallback for legacy hashes generated with 1000 iterations
    const verifyHash1k = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    if (hash.length === verifyHash1k.length && crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(verifyHash1k))) {
      return true;
    }
  } catch (e) {
    return false;
  }

  return false;
}

export function getSafeUsers(users: any[]) {
  if (!Array.isArray(users)) return [];
  return users.map(u => {
    const { passwordHash, salt, ...safeUser } = u;
    return safeUser;
  });
}

// Extract user & role from incoming request with multi-band isolation validation
export function getUserFromRequest(req: express.Request, loadStateFn: () => any): { id: string; role: string; username: string; email?: string; name?: string; bandName?: string; band_id?: string; allowedBandIds?: string[]; plan?: string } | null {
  const authHeader = req.headers.authorization;
  // El token NO se acepta por la URL. Un `?token=` acaba en los logs del servidor, en el
  // historial del navegador y en la cabecera Referer de cualquier recurso externo que cargue la
  // página, y estas sesiones duran 30 días. Cabecera o cookie.
  let token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : (req.headers["x-auth-token"] as string);

  if (!token && req.headers.cookie) {
    const match = req.headers.cookie.match(/bakandeya_token=([^;]+)/);
    if (match) token = match[1];
  }

  const state = loadStateFn ? loadStateFn() : null;
  let foundUser: any = null;

  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  if (token) {
    const session = ACTIVE_SESSIONS[token] || (state?.sessions && state.sessions[token]);
    if (session) {
      // Validate 30-day session expiration
      if (session.createdAt && (Date.now() - session.createdAt > THIRTY_DAYS_MS)) {
        delete ACTIVE_SESSIONS[token];
        if (state?.sessions) delete state.sessions[token];
      } else {
        ACTIVE_SESSIONS[token] = session;
        foundUser = state?.users?.find((u: any) => u.id === session.userId);
      }
    }
  }

  if (!foundUser) return null;

  // Determine all allowed band IDs for this user
  const allowedBandIds = new Set<string>();
  const addBandIdAndVariants = (bid: string) => {
    if (!bid || typeof bid !== 'string') return;
    allowedBandIds.add(bid);
    const clean = bid.replace(/^(band|reg)-/, '');
    allowedBandIds.add(clean);
    allowedBandIds.add(`band-${clean}`);
    allowedBandIds.add(`reg-${clean}`);
  };

  const userEmail = (foundUser.email || foundUser.username || "").toLowerCase();

  if (foundUser.band_id) addBandIdAndVariants(foundUser.band_id);

  const isBraisMoureUser =
    foundUser.id === 'user-mouredev' ||
    userEmail.includes('mouredev') ||
    userEmail.includes('brais');

  if (isBraisMoureUser) {
    foundUser.instrument = 'Batería';
    addBandIdAndVariants('band-os-herdeiros-do-codigo');
    addBandIdAndVariants('band-master-of-prompts');
    allowedBandIds.delete('bakandeya');
    allowedBandIds.delete('band-bakandeya');
    allowedBandIds.delete('reg-bakandeya');

    const cleanUserCurrent = (foundUser.band_id || '').replace(/^(band|reg)-/, '').toLowerCase();
    if (cleanUserCurrent === 'master-of-prompts') {
      foundUser.band_id = 'band-master-of-prompts';
      foundUser.bandName = 'Master of Prompts';
    } else if (cleanUserCurrent === 'os-herdeiros-do-codigo') {
      foundUser.band_id = 'band-os-herdeiros-do-codigo';
      foundUser.bandName = 'Os Herdeiros do Código';
    } else if (!foundUser.band_id || cleanUserCurrent === 'bakandeya') {
      foundUser.band_id = 'band-master-of-prompts';
      foundUser.bandName = 'Master of Prompts';
    }
  }

  if (foundUser.role === 'admin') {
    addBandIdAndVariants('vertice');
    addBandIdAndVariants('bakandeya');
  }

  if (state?.userBands) {
    state.userBands.forEach((ub: any) => {
      if ((ub.user_id === foundUser.id || (userEmail && ub.email?.toLowerCase() === userEmail)) && ub.band_id) {
        addBandIdAndVariants(ub.band_id);
      }
    });
  }

  if (state?.registeredBands) {
    state.registeredBands.forEach((rb: any) => {
      if ((rb.user_id === foundUser.id || (rb.email && rb.email.toLowerCase() === userEmail))) {
        if (rb.band_id) addBandIdAndVariants(rb.band_id);
        if (rb.id) addBandIdAndVariants(rb.id);
      }
    });
  }

  if (state?.users) {
    state.users.forEach((u: any) => {
      if ((u.id === foundUser.id || (userEmail && (u.email?.toLowerCase() === userEmail || u.username?.toLowerCase() === userEmail))) && u.band_id) {
        addBandIdAndVariants(u.band_id);
      }
    });
  }

  // Antes, un usuario sin ninguna banda asociada se quedaba con 'band-bakandeya' en la lista de
  // permitidas. Eso venía de cuando la app era de una sola banda; hoy significa que cualquier
  // cuenta a la que le falte su vínculo entra en la banda insignia y ve sus leads y sus
  // finanzas. Sin banda no hay sesión válida: más abajo, un activeBandId vacío devuelve null.

  // Check requested active band from headers / query / body
  const requestedBandId = (
    req.headers['x-band-id'] ||
    req.headers['x-active-band-id'] ||
    req.query.band_id ||
    req.body?.band_id
  ) as string | undefined;

  let activeBandId = foundUser.band_id;

  // Allow active band override if user belongs to requested band or is platform superadmin
  if (requestedBandId && typeof requestedBandId === 'string' && requestedBandId.trim()) {
    const cleanRequested = requestedBandId.trim();
    const cleanNoPrefix = cleanRequested.replace(/^(band|reg)-/, '');
    if (
      allowedBandIds.has(cleanRequested) ||
      allowedBandIds.has(cleanNoPrefix) ||
      allowedBandIds.has(`band-${cleanNoPrefix}`) ||
      allowedBandIds.has(`reg-${cleanNoPrefix}`) ||
      foundUser.role === 'admin'
    ) {
      activeBandId = cleanRequested;
    }
  }
  
  if (!activeBandId && foundUser.role === 'admin') {
    activeBandId = 'band-vertice';
  }

  if (isBraisMoureUser && (!activeBandId || activeBandId.includes('bakandeya'))) {
    activeBandId = foundUser.band_id || 'band-master-of-prompts';
  }

  if (!activeBandId) return null;

  // Determine user's role for this active band
  const cleanActive = activeBandId.replace(/^(band|reg)-/, '');
  const userBand = state?.userBands?.find((ub: any) =>
    ub.user_id === foundUser.id && ub.band_id && ub.band_id.replace(/^(band|reg)-/, '') === cleanActive
  );
  // El rol es POR BANDA. El `|| foundUser.role` que había de repuesto se applied cuando
  // el usuario es admin global o cuando la banda activa es la suya principal.
  const esSuBandaPrincipal = (foundUser.band_id || '').replace(/^(band|reg)-/, '') === cleanActive;
  const role = foundUser.role === 'admin' ? 'admin' : (userBand?.role || (esSuBandaPrincipal ? foundUser.role : null) || 'member');

  // Retrieve band name for this active band
  let activeBandName = foundUser.bandName;
  const bandObj = (state?.registeredBands || []).find((rb: any) =>
    rb.band_id === activeBandId || rb.id === activeBandId ||
    (rb.band_id && rb.band_id.replace(/^(band|reg)-/, '') === cleanActive) ||
    (rb.id && rb.id.replace(/^(band|reg)-/, '') === cleanActive)
  ) || (state?.bands || []).find((b: any) =>
    b.band_id === activeBandId || b.id === activeBandId ||
    (b.band_id && b.band_id.replace(/^(band|reg)-/, '') === cleanActive) ||
    (b.id && b.id.replace(/^(band|reg)-/, '') === cleanActive)
  );

  if (bandObj) {
    activeBandName = bandObj.nombre_banda || bandObj.bandName || bandObj.name || activeBandName;
  }

  return {
    id: foundUser.id,
    role,
    username: foundUser.username,
    email: foundUser.email,
    name: foundUser.name || activeBandName || foundUser.bandName,
    bandName: activeBandName,
    band_id: activeBandId,
    plan: normalizePlan(bandObj?.plan || foundUser.plan || 'promo'),
    allowedBandIds: Array.from(allowedBandIds)
  };
}

// Middleware: Requires valid authenticated user
export function createAuthMiddleware(loadStateFn: () => any) {
  return function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
    const user = getUserFromRequest(req, loadStateFn);
    if (!user) {
      return res.status(401).json({ error: "Acceso no autorizado. Inicie sesión para continuar." });
    }
    (req as any).user = user;
    next();
  };
}

// Middleware: Requires leader/admin user
export function createLeaderMiddleware(loadStateFn: () => any) {
  return function requireLeader(req: express.Request, res: express.Response, next: express.NextFunction) {
    const user = (req as any).user || getUserFromRequest(req, loadStateFn);
    if (!user) {
      return res.status(401).json({ error: "Acceso no autorizado. Inicie sesión para continuar." });
    }
    if (user.role !== 'leader' && user.role !== 'admin') {
      return res.status(403).json({ error: "Acceso denegado. Se requieren permisos de dirección/leader o administrador." });
    }
    (req as any).user = user;
    next();
  };
}

// Middleware: Allows request if valid CRON secret header is present OR user is authenticated
export function createCronOrAuthMiddleware(loadStateFn: () => any) {
  return function requireCronOrAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
    const cronSecretHeader = req.headers['x-cron-secret'];
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret && cronSecretHeader === expectedSecret) {
      return next();
    }

    const user = getUserFromRequest(req, loadStateFn);
    if (user) {
      (req as any).user = user;
      return next();
    }

    return res.status(401).json({
      error: "Acceso denegado. Se requiere sesión activa o cabecera X-Cron-Secret válida."
    });
  };
}
