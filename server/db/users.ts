import { getSupabase, cleanBandId, normalizePlan } from "./core.js";

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
      googleOauth: u.google_oauth || u.googleOauth || {},
      main_band_id: u.main_band_id || u.mainBandId,
      band_order: Array.isArray(u.band_order) ? u.band_order : (u.band_order ? JSON.parse(u.band_order) : undefined)
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
    googleOauth: u.google_oauth || u.googleOauth || {}
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
            googleOauth: ownerUser.google_oauth || ownerUser.googleOauth || {}
          });
        }
      } else if (regBand.email && !list.some(u => u.email?.toLowerCase() === regBand.email.toLowerCase() || u.username?.toLowerCase() === regBand.email.toLowerCase())) {
        const { data: ownerUser } = await sb.from("users").select("*").or(`email.eq.${regBand.email},username.eq.${regBand.email}`).maybeSingle();
        if (ownerUser) {
          list.unshift({
            ...ownerUser,
            band_id: cleanId,
            role: "leader",
            bandName: ownerUser.band_name || ownerUser.bandName,
            avatarColor: ownerUser.avatar_color || ownerUser.avatarColor,
            passwordHash: ownerUser.password_hash || ownerUser.passwordHash,
            googleOauth: ownerUser.google_oauth || ownerUser.googleOauth || {}
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
    googleOauth: data.google_oauth || data.googleOauth || {},
    main_band_id: data.main_band_id || data.mainBandId,
    band_order: Array.isArray(data.band_order) ? data.band_order : (data.band_order ? JSON.parse(data.band_order) : undefined)
  };
}

export async function dbUpsertUser(user: any) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(user.band_id || user.bandId);
  await ensureRegisteredBandExists(targetBandId, user.bandName || user.band_name);

  const payload: any = {
    id: user.id || `user-${Date.now()}`,
    username: user.username || user.email,
    name: user.name || user.username || "Usuario",
    role: user.role || "member",
    plan: normalizePlan(user.plan),
    band_name: user.bandName || user.band_name || "",
    band_id: targetBandId,
    email: user.email || user.username || "",
    instrument: user.instrument || "",
    avatar_color: user.avatarColor || user.avatar_color || "bg-amber-500",
    password_hash: user.passwordHash || user.password_hash || "",
    salt: user.salt || "",
    google_oauth: user.googleOauth || user.google_oauth || {},
    main_band_id: user.main_band_id || user.mainBandId || null,
    band_order: user.band_order || null
  };

  const { data, error } = await sb.from("users").upsert(payload).select().single();
  if (error) {
    // If columns like band_order or main_band_id are not yet migrated in Supabase table schema, fallback gracefully
    if (error.message && (error.message.includes('band_order') || error.message.includes('main_band_id'))) {
      const fallbackPayload = { ...payload };
      delete fallbackPayload.band_order;
      delete fallbackPayload.main_band_id;
      const { data: fbData, error: fbError } = await sb.from("users").upsert(fallbackPayload).select().single();
      if (fbError) throw new Error(`Supabase Error (upsert user fallback): ${fbError.message}`);
      return {
        ...fbData,
        bandName: fbData.band_name,
        avatarColor: fbData.avatar_color,
        passwordHash: fbData.password_hash,
        googleOauth: fbData.google_oauth,
        main_band_id: user.main_band_id,
        band_order: user.band_order
      };
    }
    throw new Error(`Supabase Error (upsert user): ${error.message}`);
  }
  return {
    ...data,
    bandName: data.band_name,
    avatarColor: data.avatar_color,
    passwordHash: data.password_hash,
    googleOauth: data.google_oauth,
    main_band_id: data.main_band_id || user.main_band_id,
    band_order: data.band_order || user.band_order
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

  // Delete matching user_bands for user_id and band_id
  const { error: ubErr } = await sb
    .from('user_bands')
    .delete()
    .eq('user_id', user_id)
    .or(`band_id.eq.${cleanId},band_id.eq.band-${cleanId},band_id.eq.reg-${cleanId}`);
  if (ubErr) console.warn('Supabase notice (delete user_band):', ubErr.message);

  // Unlink user on registered_bands if this user was registered owner/contact
  const { error: rbErr } = await sb
    .from('registered_bands')
    .update({ user_id: null, email: null })
    .or(`band_id.eq.${cleanId},band_id.eq.band-${cleanId},band_id.eq.reg-${cleanId}`)
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
