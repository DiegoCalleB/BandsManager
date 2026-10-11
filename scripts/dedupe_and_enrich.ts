import { getSupabase } from "../server/db/core.js";
import { findDuplicateLeads, mergeTwoLeads, normalizeEmail, normalizeVenueName, normalizeText } from "../src/utils/duplicateLeads.js";
import { Lead } from "../src/types.js";

// Master dictionary for high quality logos of iconic Spanish venues / festivals / media
const VENUE_IMAGE_OVERRIDES: Record<string, { logo: string; website?: string; email?: string }> = {
  "la riviera": {
    logo: "https://salariviera.com/wp-content/uploads/2020/05/cropped-LOGO1-180x180.png",
    website: "https://salariviera.com",
    email: "booking@salariviera.com"
  },
  "sala la riviera": {
    logo: "https://salariviera.com/wp-content/uploads/2020/05/cropped-LOGO1-180x180.png",
    website: "https://salariviera.com",
    email: "booking@salariviera.com"
  },
  "sala siroco": {
    logo: "https://siroco.es/wp-content/uploads/2019/02/logo_negro_72px.png",
    website: "https://siroco.es",
    email: "booking@salasiroco.es"
  },
  "siroco": {
    logo: "https://siroco.es/wp-content/uploads/2019/02/logo_negro_72px.png",
    website: "https://siroco.es",
    email: "booking@salasiroco.es"
  },
  "sala clamores": {
    logo: "https://salaclamores.es/wp-content/uploads/2021/09/logo-clamores.png",
    website: "https://salaclamores.es",
    email: "booking@salaclamores.es"
  },
  "ochoymedio club": {
    logo: "https://www.google.com/s2/favicons?domain=ochoymedioclub.com&sz=128",
    website: "https://ochoymedioclub.com",
    email: "info@ochoymedioclub.com"
  },
  "wizink center": {
    logo: "https://www.google.com/s2/favicons?domain=wizinkcenter.es&sz=128",
    website: "https://wizinkcenter.es",
    email: "info@wizinkcenter.es"
  },
  "sala el sol": {
    logo: "https://www.google.com/s2/favicons?domain=salaelsol.com&sz=128",
    website: "https://salaelsol.com",
    email: "programacion@salaelsol.com"
  },
  "industrial copera": {
    logo: "https://www.google.com/s2/favicons?domain=industrialcopera.net&sz=128",
    website: "https://industrialcopera.net",
    email: "booking@industrialcopera.net"
  },
  "propaganda pel fet": {
    logo: "https://www.google.com/s2/favicons?domain=ppf.cat&sz=128",
    website: "https://ppf.cat",
    email: "booking@ppf.cat"
  },
  "sala copérnico": {
    logo: "https://www.google.com/s2/favicons?domain=salacopernico.es&sz=128",
    website: "https://salacopernico.es",
    email: "conciertos@salacopernico.es"
  },
  "viña rock": {
    logo: "https://www.google.com/s2/favicons?domain=vina-rock.com&sz=128",
    website: "https://vina-rock.com",
    email: "info@vina-rock.com"
  },
  "el rincón del arte nuevo": {
    logo: "https://www.google.com/s2/favicons?domain=rincondelartenuevo.com&sz=128",
    website: "https://rincondelartenuevo.com",
    email: "agm_sara@hotmail.com"
  },
  "factory fm 102.4": {
    logo: "https://www.google.com/s2/favicons?domain=factoryfm.es&sz=128",
    website: "https://factoryfm.es",
    email: "radiofactory102.4@hotmail.com"
  },
  "lone star": {
    logo: "https://www.google.com/s2/favicons?domain=salalonestar.com&sz=128",
    website: "https://salalonestar.com"
  },
  "sala corleone": {
    logo: "https://www.google.com/s2/favicons?domain=salacorleone.es&sz=128",
    website: "https://salacorleone.es"
  },
  "berdigón 14": {
    logo: "https://www.google.com/s2/favicons?domain=berdigon14.es&sz=128",
    website: "https://berdigon14.es"
  },
  "mojo music club": {
    logo: "https://www.google.com/s2/favicons?domain=mojomusicclub.com&sz=128",
    website: "https://mojomusicclub.com"
  },
  "sala coraje": {
    logo: "https://www.google.com/s2/favicons?domain=salacoraje.es&sz=128",
    website: "https://salacoraje.es"
  },
  "sala estense": {
    logo: "https://www.google.com/s2/favicons?domain=comune.fe.it&sz=128",
    website: "https://www.comune.fe.it"
  }
};

function getDomainFromUrl(urlStr?: string): string {
  if (!urlStr) return "";
  try {
    let clean = urlStr.trim();
    if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
      clean = "https://" + clean;
    }
    const u = new URL(clean);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function deriveLogoForLead(lead: Lead): string {
  const normName = (lead.nombre_sala || "").toLowerCase().trim();
  if (VENUE_IMAGE_OVERRIDES[normName]?.logo) {
    return VENUE_IMAGE_OVERRIDES[normName].logo;
  }

  // If existing image is a valid URL and not "null" or "undefined" or generic clearbit
  if (lead.imagen_url && typeof lead.imagen_url === "string") {
    const trimmed = lead.imagen_url.trim();
    if (
      trimmed &&
      trimmed !== "null" &&
      trimmed !== "undefined" &&
      !trimmed.includes("clearbit.com") &&
      !trimmed.includes("ui-avatars.com") &&
      (trimmed.startsWith("http://") || trimmed.startsWith("https://"))
    ) {
      return trimmed;
    }
  }

  // Try instagram handle unavatar
  if (lead.instagram && lead.instagram.trim()) {
    const handle = lead.instagram
      .replace(/.*instagram\.com\//, "")
      .replace(/^@/, "")
      .split("/")[0]
      .trim();
    if (handle.length >= 2) {
      return `https://unavatar.io/instagram/${handle}`;
    }
  }

  // Try website domain favicon
  if (lead.website) {
    const domain = getDomainFromUrl(lead.website);
    if (domain && domain.includes(".")) {
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    }
  }

  // Try email domain favicon
  if (lead.email_contacto && lead.email_contacto.includes("@")) {
    const domain = lead.email_contacto.split("@")[1]?.toLowerCase().trim();
    if (
      domain &&
      domain.includes(".") &&
      !domain.includes("gmail") &&
      !domain.includes("hotmail") &&
      !domain.includes("yahoo") &&
      !domain.includes("outlook")
    ) {
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    }
  }

  return "";
}

async function run() {
  console.log("=== INICIANDO LIMPIEZA Y ENRIQUECIMIENTO DE LEADS ===");
  const sb = getSupabase();

  // 1. Cargar todos los leads de la banda indicada (argumento: band_id)
  const bandId = process.argv[2];
  if (!bandId) throw new Error("Uso: tsx scripts/dedupe_and_enrich.ts <band_id>");
  const { data: rawLeads, error: fetchErr } = await sb
    .from("leads")
    .select("*")
    .eq("band_id", bandId);

  if (fetchErr || !rawLeads) {
    console.error("Error al cargar leads:", fetchErr);
    return;
  }

  console.log(`Leads cargados inicialmente: ${rawLeads.length}`);

  let leads: Lead[] = rawLeads as Lead[];

  // 1.5 Correcciones iniciales de nombres o datos corruptos
  for (const l of leads) {
    // Corrige lead con nombre "Sala" que es Sala El Sol
    if (l.nombre_sala === "Sala" && l.email_contacto?.includes("salaelsol.com")) {
      l.nombre_sala = "Sala El Sol";
      l.website = "https://salaelsol.com";
    }

    // Corrige emails con prefijos erróneos
    if (l.email_contacto?.startsWith("-")) {
      l.email_contacto = l.email_contacto.replace(/^-+/, "").trim();
    }

    // Corrige sitio web de Industrial Copera que venía con texto largo de notas
    if (l.website && l.website.includes("Icono del clubbing")) {
      if (!l.notas) l.notas = l.website;
      else l.notas += "\n" + l.website;
      l.website = "https://industrialcopera.net";
    }
  }

  // 2. Iterativo: Detectar y Fusionar Duplicados
  let passCount = 0;
  while (passCount < 5) {
    passCount++;
    const dupGroups = findDuplicateLeads(leads);
    if (dupGroups.length === 0) {
      console.log(`Pase ${passCount}: No se detectaron más grupos duplicados.`);
      break;
    }

    console.log(`Pase ${passCount}: Se encontraron ${dupGroups.length} grupos de duplicados.`);

    const idsToDeleteAllPass: string[] = [];

    for (const group of dupGroups) {
      if (group.leads.length < 2) continue;

      // Eliges la mejor manteniéndola
      const targetId = group.suggestedKeepId || group.leads[0].id;
      const targetLead = group.leads.find(l => l.id === targetId) || group.leads[0];

      let merged = { ...targetLead };
      const secondaries = group.leads.filter(l => l.id !== merged.id);

      for (const sec of secondaries) {
        merged = mergeTwoLeads(merged, sec);
      }

      // Reemplaza en la lista local de leads
      leads = leads.filter(l => !secondaries.some(s => s.id === l.id));
      const idx = leads.findIndex(l => l.id === merged.id);
      if (idx !== -1) {
        leads[idx] = merged;
      }

      // Guardar ids a borrar en BD
      secondaries.forEach(s => idsToDeleteAllPass.push(s.id));
    }

    if (idsToDeleteAllPass.length > 0) {
      console.log(`Eliminando ${idsToDeleteAllPass.length} IDs duplicados de Supabase...`);
      const { error: delErr } = await sb
        .from("leads")
        .delete()
        .in("id", idsToDeleteAllPass);

      if (delErr) {
        console.error("Error borrando duplicados en Supabase:", delErr);
      }
    }
  }

  console.log(`Tras fusión de duplicados, quedan ${leads.length} leads únicos.`);

  // 3. Rellenar datos faltantes y logos para TODOS los leads
  let enrichedCount = 0;
  for (const l of leads) {
    const rawLower = (l.nombre_sala || "").toLowerCase().trim();
    const cleanNorm = normalizeVenueName(l.nombre_sala);

    const matchKey = Object.keys(VENUE_IMAGE_OVERRIDES).find(
      k => k === rawLower || normalizeVenueName(k) === cleanNorm || rawLower.includes(k)
    );

    // Aplicar manual overrides si existen para este recinto
    if (matchKey && VENUE_IMAGE_OVERRIDES[matchKey]) {
      const ov = VENUE_IMAGE_OVERRIDES[matchKey];
      if (ov.logo) l.imagen_url = ov.logo;
      if (ov.website && (!l.website || l.website.length < 5)) l.website = ov.website;
      if (ov.email && (!l.email_contacto || !l.email_contacto.includes("@"))) l.email_contacto = ov.email;
    }

    // Normalizar sitio web
    if (l.website && !l.website.startsWith("http://") && !l.website.startsWith("https://")) {
      l.website = "https://" + l.website;
    }

    // Derivar logo si sigue vacío o "null"
    const derivedLogo = deriveLogoForLead(l);
    if (derivedLogo && (!l.imagen_url || l.imagen_url === "null" || l.imagen_url === "undefined" || l.imagen_url.includes("clearbit.com"))) {
      l.imagen_url = derivedLogo;
      enrichedCount++;
    }

    // Asegurar región
    if (!l.region) {
      l.region = l.ciudad || "España";
    }

    // Asegurar género por defecto
    if (!l.genero || l.genero === "null") {
      l.genero = "Música en Directo / Variado";
    }

    // Asegurar aforo por defecto
    if (!l.aforo || isNaN(l.aforo)) {
      l.aforo = 300;
    }

    // Asegurar icono por defecto
    if (!l.icono || l.icono === "null") {
      l.icono = l.tipo === "festival" ? "🎪" : l.tipo === "discoteca" ? "🪩" : l.tipo === "ayuntamiento" ? "🏛️" : "🎸";
    }
  }

  console.log(`Logos/datos enriquecidos en ${enrichedCount} recintos.`);

  // 4. Guardar todos los leads limpios y enriquecidos de nuevo en Supabase
  console.log("Guardando leads limpios y enriquecidos en Supabase...");
  for (const l of leads) {
    const { error: upsertErr } = await sb.from("leads").upsert(l);
    if (upsertErr) {
      console.error(`Error guardando lead "${l.nombre_sala}" [${l.id}]:`, upsertErr);
    }
  }

  console.log("✓ PROCESO COMPLETADO EN SUPABASE CON ÉXITO.");
}

run().catch(console.error);
