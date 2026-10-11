/**
 * Bandas que ve un usuario en el selector (propias, compartidas y registradas) y normalización de band_id para compararlas.
 */
import { getEpkConfigForBand } from '../../state.js';
import { dbGetEpkLogosMap, normalizePlan } from '../../db.js';

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
  } catch {
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
