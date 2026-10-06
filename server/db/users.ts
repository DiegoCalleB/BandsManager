// Usuarios (`users`) y su pertenencia a bandas (`user_bands`).

import { getSupabase, cleanBandId, normalizePlan } from "./core.js";
import { ensureRegisteredBandExists } from "./bands.js";

export async function dbGetUsers(bandId?: string) {
  const sb = getSupabase();
  if (!bandId) {
    const { data, error } = await sb.from("users").select("*").order("created_at", { ascending: true });
    if (error) throw new Error(`Supabase Error (users): ${error.message}`);
    return (data || []).map(u => ({
      ...u,
      bandName: u.band_name || u.bandName,
      avatarColor: u.avatar_color || u.avatarColor,
      passwordHash: u.password_hash || u.passwordHash,
      googleOAuth: u.google_oauth || u.googleOAuth || {},
      main_band_id: u.main_band_id || u.mainBandId,
      band_order: Array.isArray(u.band_order) ? u.band_order : (u.band_order ? JSON.parse(u.band_order) : undefined),
      ui_preferences: u.ui_preferences || u.uiPreferences || {}
    }));
  }

  const cleanId = cleanBandId(bandId);
  const { data: directUsers, error } = await sb.from("users").select("*").eq("band_id", cleanId).order("created_at", { ascending: true });
  if (error) throw new Error(`Supabase Error (users): ${error.message}`);
  
  const list = (directUsers || []).map(u => ({
    ...u,
    bandName: u.band_name || u.bandName,
    avatarColor: u.avatar_color || u.avatarColor,
    passwordHash: u.password_hash || u.passwordHash,
    googleOAuth: u.google_oauth || u.googleOAuth || {},
    main_band_id: u.main_band_id || u.mainBandId,
    band_order: Array.isArray(u.band_order) ? u.band_order : (u.band_order ? JSON.parse(u.band_order) : undefined),
    ui_preferences: u.ui_preferences || u.uiPreferences || {}
  }));

  // Also include the band owner/leader from registered_bands if not already in list
  try {
    const { data: regBand } = await sb.from("registered_bands").select("user_id, email").eq("band_id", cleanId).maybeSingle();
    if (regBand) {
      if (regBand.user_id && !list.some(u => u.id === regBand.user_id)) {
        const { data: ownerUser } = await sb.from("users").select("*").eq("id", regBand.user_id).maybeSingle();
        if (ownerUser) {
          list.unshift({
            ...ownerUser,
            band_id: cleanId,
            role: "leader",
            bandName: ownerUser.band_name || ownerUser.bandName,
            avatarColor: ownerUser.avatar_color || ownerUser.avatarColor,
            passwordHash: ownerUser.password_hash || ownerUser.passwordHash,
            googleOAuth: ownerUser.google_oauth || ownerUser.googleOAuth || {}
          });
        }
      } else if (regBand.email && !list.some(u => u.email?.toLowerCase() === regBand.email.toLowerCase() || u.username?.toLowerCase() === regBand.email.toLowerCase())) {
        // Antes se interpolaba regBand.email sin escapar dentro del DSL de filtros de
        // PostgREST (.or()): un email con una coma (la validación de registro solo exige
        // "algo@algo.algo", que la permite) podía añadir condiciones OR arbitrarias a la
        // consulta. Dos .eq() por separado no tienen ese problema.
        const { data: byEmail } = await sb.from("users").select("*").eq("email", regBand.email).maybeSingle();
        const { data: byUsername } = byEmail ? { data: null } : await sb.from("users").select("*").eq("username", regBand.email).maybeSingle();
        const ownerUser = byEmail || byUsername;
        if (ownerUser) {
          list.unshift({
            ...ownerUser,
            band_id: cleanId,
            role: "leader",
            bandName: ownerUser.band_name || ownerUser.bandName,
            avatarColor: ownerUser.avatar_color || ownerUser.avatarColor,
            passwordHash: ownerUser.password_hash || ownerUser.passwordHash,
            googleOAuth: ownerUser.google_oauth || ownerUser.googleOAuth || {}
          });
        }
      }
    }
  } catch (err) {
    console.warn("Could not check registered band owner for users:", err);
  }

  return list;
}

export async function dbGetUserById(userId: string) {
  const sb = getSupabase();
  const { data, error } = await sb.from("users").select("*").eq("id", userId).maybeSingle();
  if (error) throw new Error(`Supabase Error (getUserById): ${error.message}`);
  if (!data) return null;
  return {
    ...data,
    plan: normalizePlan(data.plan),
    bandName: data.band_name || data.bandName,
    avatarColor: data.avatar_color || data.avatarColor,
    passwordHash: data.password_hash || data.passwordHash,
    googleOAuth: data.google_oauth || data.googleOAuth || {},
    main_band_id: data.main_band_id || data.mainBandId,
    band_order: Array.isArray(data.band_order) ? data.band_order : (data.band_order ? JSON.parse(data.band_order) : undefined),
    ui_preferences: data.ui_preferences || data.uiPreferences || {}
  };
}

export async function dbUpsertUser(user: any) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(user.band_id || user.bandId);
  await ensureRegisteredBandExists(targetBandId, user.bandName || user.band_name);

  const rawUsername = (user.username || user.email || "").trim();
  const rawEmail = (user.email || user.username || "").trim();

  // Comprobar si ya existe en Supabase un usuario con este username o email para reutilizar su ID
  let resolvedId = user.id;
  if (!resolvedId) {
    try {
      const { data: existingUser } = await sb
        .from("users")
        .select("id")
        .or(`username.ilike.${rawUsername},email.ilike.${rawEmail}`)
        .maybeSingle();
      if (existingUser?.id) {
        resolvedId = existingUser.id;
      }
    } catch {
      // Continuar con ID generado si la consulta falla
    }
  }

  const payload: any = {
    id: resolvedId || `user-${Date.now()}`,
    username: rawUsername,
    name: user.name || user.username || "Usuario",
    role: user.role || "member",
    plan: normalizePlan(user.plan),
    band_name: user.bandName || user.band_name || "",
    band_id: targetBandId,
    email: rawEmail,
    instrument: user.instrument || "",
    avatar_color: user.avatarColor || user.avatar_color || "bg-amber-500",
    password_hash: user.passwordHash || user.password_hash || "",
    salt: user.salt || "",
    google_oauth: user.googleOAuth || user.google_oauth || {},
    main_band_id: user.main_band_id || user.mainBandId || null,
    band_order: user.band_order || null,
    ui_preferences: user.ui_preferences || user.uiPreferences || {}
  };

  let res = await sb.from("users").upsert(payload).select().single();

  // Si da error de clave única por username duplicado (por id distinto), actualizar directamente por username
  if (res.error && res.error.message && res.error.message.includes('users_username_key')) {
    const updatePayload = { ...payload };
    delete updatePayload.id;
    res = await sb.from("users").update(updatePayload).eq("username", rawUsername).select().single();
  }

  const { data, error } = res;
  if (error) {
    // If columns like band_order, main_band_id or ui_preferences are not yet migrated in Supabase table schema, fallback gracefully
    if (error.message && (error.message.includes('band_order') || error.message.includes('main_band_id') || error.message.includes('ui_preferences'))) {
      const fallbackPayload = { ...payload };
      delete fallbackPayload.band_order;
      delete fallbackPayload.main_band_id;
      delete fallbackPayload.ui_preferences;
      let fbRes = await sb.from("users").upsert(fallbackPayload).select().single();
      if (fbRes.error && fbRes.error.message && fbRes.error.message.includes('users_username_key')) {
        const updateFbPayload = { ...fallbackPayload };
        delete updateFbPayload.id;
        fbRes = await sb.from("users").update(updateFbPayload).eq("username", rawUsername).select().single();
      }
      if (fbRes.error) throw new Error(`Supabase Error (upsert user fallback): ${fbRes.error.message}`);
      const fbData = fbRes.data;
      return {
        ...fbData,
        bandName: fbData.band_name,
        avatarColor: fbData.avatar_color,
        passwordHash: fbData.password_hash,
        googleOAuth: fbData.google_oauth,
        main_band_id: user.main_band_id,
        band_order: user.band_order,
        ui_preferences: user.ui_preferences
      };
    }
    throw new Error(`Supabase Error (upsert user): ${error.message}`);
  }
  return {
    ...data,
    bandName: data.band_name,
    avatarColor: data.avatar_color,
    passwordHash: data.password_hash,
    googleOAuth: data.google_oauth,
    main_band_id: data.main_band_id || user.main_band_id,
    band_order: data.band_order || user.band_order,
    ui_preferences: data.ui_preferences || user.ui_preferences
  };
}

export async function dbDeleteUser(userId: string) {
  const sb = getSupabase();
  const { error } = await sb.from("users").delete().eq("id", userId);
  if (error) throw new Error(`Supabase Error (delete user): ${error.message}`);
  return true;
}

export async function dbDeleteUserFromBand(user_id: string, band_id: string) {
  const sb = getSupabase();
  const cleanId = cleanBandId(band_id);

  // Antes se interpolaba cleanId sin escapar dentro del DSL de .or(); .in() con un array de
  // valores no pasa por ese parser de filtros y es seguro frente a la misma clase de inyección.
  const candidateBandIds = [cleanId, `band-${cleanId}`, `reg-${cleanId}`];

  // Delete matching user_bands for user_id and band_id
  const { error: ubErr } = await sb
    .from('user_bands')
    .delete()
    .eq('user_id', user_id)
    .in('band_id', candidateBandIds);
  if (ubErr) console.warn('Supabase notice (delete user_band):', ubErr.message);

  // Unlink user on registered_bands if this user was registered owner/contact
  const { error: rbErr } = await sb
    .from('registered_bands')
    .update({ user_id: null, email: null })
    .in('band_id', candidateBandIds)
    .eq('user_id', user_id);
  if (rbErr) console.warn('Supabase notice (unlink registered_band):', rbErr.message);

  return { success: true };
}

export async function dbGetUserBands(userId?: string, bandId?: string) {
  const sb = getSupabase();
  let query = sb.from("user_bands").select("*");
  if (userId) query = query.eq("user_id", userId);
  if (bandId) query = query.eq("band_id", cleanBandId(bandId));

  const { data, error } = await query;
  if (error) throw new Error(`Supabase Error (user_bands): ${error.message}`);
  return data || [];
}

export async function dbUpsertUserBand(userBand: any) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(userBand.band_id || userBand.bandId);
  await ensureRegisteredBandExists(targetBandId);

  const payload = {
    id: userBand.id || `ub-${userBand.user_id || userBand.userId}-${targetBandId}`,
    user_id: userBand.user_id || userBand.userId,
    band_id: targetBandId,
    role: userBand.role || "member"
  };

  const { data, error } = await sb.from("user_bands").upsert(payload).select().single();
  if (error) throw new Error(`Supabase Error (upsert user_band): ${error.message}`);
  return data;
}

export async function dbDeleteUserBand(id: string) {
  const sb = getSupabase();
  const { error } = await sb.from("user_bands").delete().eq("id", id);
  if (error) throw new Error(`Supabase Error (delete user_band): ${error.message}`);
  return true;
}

// --- BAND CONTACTS / BANDAS COLABORADORAS ---
