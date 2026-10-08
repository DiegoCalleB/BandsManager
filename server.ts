import express from "express";
import compression from "compression";
import helmet from "helmet";
import path from "path";
import * as XLSX from "xlsx";

import { resolveResendApiKey } from "./server/services/transactionalEmail.js";
import { Lead, Concert, SocialPost, Payment, Rehearsal, Song, Setlist } from "./src/types";

import { getSafeUsers, getUserFromRequest } from "./server/auth.js";
import { jsonSegunSesion } from "./server/middleware/limiteCuerpo.js";
import { mismaBanda } from "./server/utils/bandAccess.js";
import { loadState, saveState, getEpkConfigForBand, ensureUniqueIdsInState } from "./server/state.js";
import { loadStateFromSupabase, invalidarCachePorEscritura } from "./server/db.js";
import { avisarGuardadoParcial } from "./server/utils/guardadoParcial.js";
import { startSocialRadarScheduler } from "./server/services/socialRadarService.js";
import { startAgentScheduler } from "./server/services/agentScheduler.js";
import { startCalendarConflictScheduler } from "./server/services/calendarConflictService.js";
import { iniciarColaLetras } from "./server/services/colaLetras.js";
import { initErrorTracking, captureError } from "./server/utils/errorTracking.js";
import { getAppInfo } from "./server/utils/version.js";

import usersRouter, { ensureAdminUserExists } from "./server/routes/users.js";
import postsRouter from "./server/routes/posts.js";
import metricsRouter from "./server/routes/metrics.js";
import chatRouter from "./server/routes/chat.js";
import leadsRouter from "./server/routes/leads.js";
import concertsRouter from "./server/routes/concerts.js";
import bandsRouter from "./server/routes/bands.js";
import bandMusicRouter from "./server/routes/bandMusic.js";
import toursRouter from "./server/routes/tours.js";
import agentRouter from "./server/routes/agent.js";
import agentQueueRouter from "./server/routes/agentQueue.js";
import reelsRouter from "./server/routes/reels.js";
import repertorioRouter from "./server/routes/repertorio.js";
import epkFansRouter from "./server/routes/epk_fans.js";
import uploadRouter from "./server/routes/upload.js";
import concertToAlbumRouter from "./server/routes/concert_to_album.js";
import billingRouter from "./server/routes/billing.js";
import donationsRouter from "./server/routes/donations.js";
import spotifyRouter from "./server/routes/spotify.js";
import aiMusicRouter from "./server/routes/ai_music.js";
import campaignsRouter from "./server/routes/campaigns.js";
import gmailOAuthRouter from "./server/routes/gmailOAuth.js";
import songsRouter from "./server/routes/songs/index.js";
import transposeRouter from "./server/routes/transposeRoute.js";
import trackingRouter from "./server/routes/tracking.js";
import paginaConciertoRouter from "./server/routes/paginaConcierto.js";
import { enlacesCortosApiRouter, enlacesCortosPublicoRouter } from "./server/routes/enlacesCortos.js";
import { referidosRouter } from "./server/routes/referidos.js";
import { campanaConciertoRouter } from "./server/routes/campanaConcierto.js";
import { dealsRouter } from "./server/routes/deals.js";

import dotenv from "dotenv";
dotenv.config(); // No sobreescribir variables de entorno inyectadas por Railway / producción

// Pasivo sin SENTRY_DSN en el entorno - ver server/utils/errorTracking.ts.
initErrorTracking();

// Red de seguridad: en Node 22, una promesa rechazada sin capturar (p. ej. un
// fallo de Supabase dentro de un handler async sin try/catch) tumba TODO el
// proceso por defecto -> caída del servidor para TODAS las bandas, no solo
// para esa petición. Auditoría 2026-08-21: varios routers (bands.ts, posts.ts
// y probablemente otros) tienen handlers async sin try/catch alrededor de
// llamadas a Supabase. Loguear y seguir vivo es mucho mejor que un outage
// total por un solo request fallido; la petición concreta que falló seguirá
// sin responder, pero el resto de la app sigue funcionando.
process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection] Promesa rechazada sin capturar:", reason);
  captureError(reason instanceof Error ? reason : new Error(String(reason)));
});

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// CSP y COEP desactivados: el panel embebe Stripe Checkout, reproductores de Spotify/YouTube
// y el widget de Google Translate (inyecta <script>/<style> inline), todos ajenos al origen
// propio. El resto de cabeceras de helmet (HSTS, X-Frame-Options, nosniff, X-Powered-By oculto)
// no rompen nada de eso y sí cierran clickjacking y fuga de metadata.
//
// Referrer-Policy SÍ hay que fijarlo a mano: el "no-referrer" por defecto de helmet hace que el
// navegador no mande cabecera Referer al pedir el iframe de YouTube del EPK público, y el
// reproductor de YouTube necesita ese referrer para validar la carga - sin él responde con un
// "Error 153 / error de configuración" en vez de reproducir el vídeo (visto en producción tras
// añadir helmet). "strict-origin-when-cross-origin" es el valor por defecto que ya usan los
// navegadores modernos: manda el origen (no la URL completa) a otros sitios, nada a HTTP en
// claro, y es suficiente para que YouTube/Vimeo/Spotify carguen bien.
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xContentTypeOptions: true,
  xFrameOptions: { action: "sameorigin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(compression());

app.use(jsonSegunSesion((req) => !!getUserFromRequest(req, loadState)));
app.use(express.urlencoded({ limit: "1mb", extended: true }));

// Tras cualquier escritura correcta en /api se invalida la caché de estado de la banda: sin esto,
// /api/state devolvía la versión anterior de lo que acababas de guardar (ver server/db/sync.ts).
app.use("/api", avisarGuardadoParcial());
app.use("/api", invalidarCachePorEscritura());

// Mount modular Express routers
app.use("/api", usersRouter);
app.use("/api", postsRouter);
app.use("/api", metricsRouter);
app.use("/api", chatRouter);
app.use("/api", leadsRouter);
app.use("/api", concertsRouter);
app.use("/api", bandMusicRouter);
app.use("/api", bandsRouter);
app.use("/api", toursRouter);
app.use("/api", agentRouter);
app.use("/api/agent-queue", agentQueueRouter);
app.use("/api", reelsRouter);
app.use("/api", repertorioRouter);
app.use("/api", epkFansRouter);
app.use("/api", billingRouter);
app.use("/api", donationsRouter);
app.use("/api/spotify", spotifyRouter);
app.use("/api", aiMusicRouter);
app.use("/api/concert-to-album", concertToAlbumRouter);
app.use("/api/upload", uploadRouter);
app.use("/api", campaignsRouter);
app.use("/api/gmail-oauth", gmailOAuthRouter);
app.use("/api", songsRouter);
app.use("/api", trackingRouter);
app.use("/api", enlacesCortosApiRouter);
app.use("/api", referidosRouter);
app.use("/api", campanaConciertoRouter);
app.use("/api", dealsRouter);
app.use(transposeRouter);
// Superficies públicas fuera de /api: enlaces cortos (/r/:code), página indexable de cada concierto
// (/e/:slug), sitemap.xml y robots.txt. Van ANTES del fallback de la SPA, que si no devolvería index.html.
app.use(enlacesCortosPublicoRouter);
app.use(paginaConciertoRouter);
// nosniff: sin esto, un navegador puede intentar adivinar el tipo real de un archivo servido
// aquí en vez de confiar en su extensión, ampliando la superficie de un XSS almacenado si algún
// archivo subido se cuela sin pasar por la validación de tipo de server/routes/upload.ts.
app.use("/uploads", (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
}, express.static(path.join(process.cwd(), "public", "uploads")));

app.use("/audio", (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
}, express.static(path.join(process.cwd(), "public", "audio")));

app.use("/transposed", (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
}, express.static(path.join(process.cwd(), "public", "transposed")));

// Healthcheck endpoints for Railway, Cloud Run and deployment monitoring
app.get(["/health", "/api/health"], (req, res) => {
  // Endpoint público (lo consulta Railway): solo lo imprescindible. Antes devolvía el nombre de la
  // variable de la clave, su longitud y los nombres de todas las variables con «RESEND».
  res.status(200).json({
    status: "ok",
    version: getAppInfo().version,
    commit: getAppInfo().commit,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    emailService: { configured: Boolean(resolveResendApiKey()) }
  });
});

// Privacy Policy endpoint required for Google OAuth verification
app.get("/privacy", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Política de Privacidad - BandManager.io</title>
        <style>
          body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1e293b; background: #f8fafc; }
          h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
          h2 { color: #334155; margin-top: 30px; }
          p, li { color: #475569; }
          .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Política de Privacidad de BandManager.io</h1>
          <p><strong>Última actualización:</strong> Agosto de 2026</p>
          <p>En <strong>BandManager.io</strong> (desarrollado en el marco del TFM de Gestión Agéntica para Músicos), nos tomamos muy en serio la privacidad y la protección de los datos de las bandas y músicos independientes.</p>
          
          <h2>1. Información que Recopilamos</h2>
          <p>Para el correcto funcionamiento de las herramientas de booking, CRM y automatización de correos, la aplicación puede solicitar autorización de acceso a tu cuenta de Google (Gmail API). Los datos accedidos se limitan estrictamente a:</p>
          <ul>
            <li>Dirección de correo electrónico de la cuenta conectada.</li>
            <li>Permisos para redactar borradores y enviar correos de booking a salas bajo tu supervisión directa (Human-in-the-Loop).</li>
            <li>Lectura de mensajes de correo relacionados exclusivamente con respuestas de salas de conciertos.</li>
          </ul>

          <h2>2. Uso de la Información</h2>
          <p>Los datos y tokens de acceso de OAuth de Google se utilizan exclusivamente en el lado del cliente y del servidor proxy para permitir a los artistas gestionar sus giras, repertorios y comunicaciones. <strong>Nunca compartimos, vendemos ni cedemos datos personales o credenciales de correo a terceros.</strong></p>

          <h2>3. Seguridad de los Datos</h2>
          <p>Todas las comunicaciones están cifradas mediante protocolos seguros (HTTPS). Las credenciales de acceso se gestionan de forma segura cumpliendo con los estándares de Google OAuth 2.0.</p>

          <h2>4. Contacto</h2>
          <p>Para cualquier duda relativa a esta política de privacidad, puedes contactar con el equipo de desarrollo a través de la propia plataforma del TFM.</p>
        </div>
      </body>
    </html>
  `);
});

// Terms of Service endpoint required for Google OAuth verification
app.get("/terms", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Términos de Servicio - BandManager.io</title>
        <style>
          body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1e293b; background: #f8fafc; }
          h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
          h2 { color: #334155; margin-top: 30px; }
          p, li { color: #475569; }
          .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Términos de Servicio de BandManager.io</h1>
          <p><strong>Última actualización:</strong> Agosto de 2026</p>
          <p>Bienvenido a <strong>BandManager.io</strong>. Al utilizar nuestra plataforma de gestión musical y booking automatizado, aceptas los siguientes términos y condiciones:</p>

          <h2>1. Uso Académico y Profesional</h2>
          <p>BandManager.io es una herramienta integral diseñada para la optimización logística, financiera y de contratación de bandas musicales. Su uso implica el cumplimiento de las normativas de comunicación comercial y uso legítimo de APIs de terceros.</p>

          <h2>2. Responsabilidad de Envío (Human-in-the-Loop)</h2>
          <p>La plataforma genera propuestas y borradores de correo mediante inteligencia artificial. El usuario es el único responsable de revisar y aprobar el contenido antes de que se produzca cualquier envío oficial a salas o promotores.</p>

          <h2>3. Modificaciones y Disponibilidad</h2>
          <p>Al encontrarse en entorno de desarrollo e investigación (TFM), la aplicación se ofrece tal cual, sin garantías absolutas de disponibilidad continua.</p>
        </div>
      </body>
    </html>
  `);
});

app.get("/api/download-excel", (req, res) => {
  try {
    // Antes esta ruta no exigía sesión y exportaba en un Excel los datos de TODAS las bandas del
    // sistema (leads, pagos, fans con RGPD, usuarios y bandas registradas de cualquier cliente),
    // descargables por cualquiera que conociera la URL. Ahora exige sesión y filtra cada hoja a
    // la banda del usuario autenticado.
    const authUser = getUserFromRequest(req, loadState);
    if (!authUser) {
      return res.status(401).json({ error: "No autorizado. Inicia sesión para continuar." });
    }
    if (!authUser.band_id) {
      return res.status(409).json({ error: "Tu cuenta todavía no tiene ninguna banda asignada." });
    }
    const bandId = authUser.band_id;
    const isOwn = (recordBandId: any) => {
      if (!recordBandId) return false;
      return mismaBanda(String(recordBandId), bandId);
    };

    const state = loadState();
    const wb = XLSX.utils.book_new();

    const rehearsalsData = (state.rehearsals || []).filter((r: any) => isOwn(r.band_id || r.bandId)).map((r: Rehearsal) => ({
      ID: r.id,
      Fecha: r.fecha,
      Hora: r.hora,
      Lugar: r.lugar,
      Asistentes: Array.isArray(r.asistentes) ? r.asistentes.join(", ") : r.asistentes,
      Estado: r.estado,
      Notas: r.notas || ""
    }));
    const wsRehearsals = XLSX.utils.json_to_sheet(rehearsalsData);
    XLSX.utils.book_append_sheet(wb, wsRehearsals, "Ensayos");

    const concertsData = (state.concerts || []).filter((c: any) => isOwn(c.band_id || c.bandId)).map((c: Concert) => ({
      ID: c.id,
      Fecha: c.fecha,
      Ciudad: c.ciudad,
      Sala: c.sala,
      Caché: c.cache,
      "Aforo Vendido": c.aforo_vendido,
      "Aforo Total": c.aforo_total,
      "Contrato Firmado": c.contrato_firmado ? "SÍ" : "NO",
      "Estado Pago": c.estado_pago,
      Tipo: c.tipo,
      Notas: c.notas || "",
      band_id: (c as any).band_id || (c as any).bandId || "band-1"
    }));
    const wsConcerts = XLSX.utils.json_to_sheet(concertsData);
    XLSX.utils.book_append_sheet(wb, wsConcerts, "Conciertos");

    const leadsData = (state.leads || []).filter((l: any) => isOwn(l.band_id || l.bandId)).map((l: Lead) => ({
      ID: l.id,
      "Nombre Sala": l.nombre_sala,
      Ciudad: l.ciudad,
      Región: l.region,
      Aforo: l.aforo,
      Género: l.genero,
      Email: l.email_contacto,
      Teléfono: l.telefono,
      Web: l.website,
      Instagram: l.instagram,
      Fuente: l.fuente,
      Estado: l.estado,
      Notas: l.notas || "",
      band_id: (l as any).band_id || (l as any).bandId || "band-1"
    }));
    const wsLeads = XLSX.utils.json_to_sheet(leadsData);
    XLSX.utils.book_append_sheet(wb, wsLeads, "Salas_Leads");

    const paymentsData = (state.payments || []).filter((p: any) => isOwn(p.band_id || p.bandId)).map((p: Payment) => ({
      ID: p.id,
      Fecha: p.fecha,
      Concepto: p.concepto,
      Importe: p.importe,
      Tipo: p.tipo,
      Categoría: p.categoria,
      Estado: p.estado,
      band_id: (p as any).band_id || (p as any).bandId || "band-1"
    }));
    const wsPayments = XLSX.utils.json_to_sheet(paymentsData);
    XLSX.utils.book_append_sheet(wb, wsPayments, "Finanzas_Pagos");

    const postsData = (state.posts || []).filter((p: any) => isOwn(p.band_id || p.bandId)).map((p: SocialPost) => ({
      ID: p.id,
      Fecha: p.fecha,
      Plataforma: p.plataforma,
      Contenido: p.contenido,
      Responsable: p.responsable,
      Estado: p.estado,
      band_id: (p as any).band_id || (p as any).bandId || "band-1"
    }));
    const wsPosts = XLSX.utils.json_to_sheet(postsData);
    XLSX.utils.book_append_sheet(wb, wsPosts, "Redes_Sociales");

    const runOfShowRows: any[] = [];
    if (state.runOfShow) {
      Object.entries(state.runOfShow).forEach(([dateKey, items]: [string, any]) => {
        if (Array.isArray(items)) {
          items.forEach((item: any) => {
            if (!isOwn(item.band_id || item.bandId)) return;
            runOfShowRows.push({
              Fecha: dateKey,
              ID: item.id,
              Hora: item.time,
              "Actividad / Horario": item.activity,
              Completado: item.done ? "SÍ" : "NO",
              band_id: item.band_id || item.bandId || "band-1"
            });
          });
        }
      });
    }
    const wsRunOfShow = XLSX.utils.json_to_sheet(runOfShowRows);
    XLSX.utils.book_append_sheet(wb, wsRunOfShow, "Logistica_Horarios");

    const gearRows: any[] = [];
    if (state.gearChecklists) {
      Object.entries(state.gearChecklists).forEach(([dateKey, items]: [string, any]) => {
        if (Array.isArray(items)) {
          items.forEach((item: any) => {
            if (!isOwn(item.band_id || item.bandId)) return;
            gearRows.push({
              Fecha: dateKey,
              ID: item.id,
              "Material / Equipo a Llevar": item.label,
              "Cargado / Listo": item.checked ? "SÍ" : "NO",
              band_id: item.band_id || item.bandId || "band-1"
            });
          });
        }
      });
    }
    const wsGear = XLSX.utils.json_to_sheet(gearRows);
    XLSX.utils.book_append_sheet(wb, wsGear, "Logistica_Equipo");

    const songsData = (state.songs || []).filter((s: any) => isOwn(s.band_id || s.bandId)).map((s: Song) => ({
      ID: s.id,
      Título: s.titulo,
      Duración: s.duracion,
      Tonalidad: s.tonalidad,
      BPM: s.bpm,
      Afinación: s.afinacion || "",
      Álbum: s.albumDisco || "",
      Estado: s.estadoTema || "listo",
      "Es Cover": s.esVersionCovers ? "SÍ" : "NO",
      Acordes: s.enlaceAcordes || "",
      Notas: s.notasInternas || "",
      band_id: (s as any).band_id || (s as any).bandId || "band-1"
    }));
    const wsSongs = XLSX.utils.json_to_sheet(songsData);
    XLSX.utils.book_append_sheet(wb, wsSongs, "Canciones");

    const setlistsData = (state.setlists || []).filter((st: any) => isOwn(st.band_id || st.bandId)).map((st: Setlist) => ({
      ID: st.id,
      Nombre: st.nombre,
      Descripción: st.descripcion || "",
      Formato: st.tipoFormato || "",
      "Duración (min)": st.duracionTotalEstimadaMinutos || 0,
      "Fecha Creación": st.fechaCreacion,
      "Última Edición": st.fechaUltimaEdicion,
      "Número Temas": st.items?.length || 0,
      band_id: (st as any).band_id || (st as any).bandId || "band-1"
    }));
    const wsSetlists = XLSX.utils.json_to_sheet(setlistsData);
    XLSX.utils.book_append_sheet(wb, wsSetlists, "Repertorios");

    const fansData = (state.fans || []).filter((f: any) => isOwn(f.band_id || f.bandId)).map((f: any) => ({
      ID: f.id,
      Nombre: f.nombre,
      Email: f.email,
      Ciudad: f.ciudad || "",
      "Cómo conoció": f.comoConocio || "",
      Concierto: f.conciertoOrigenNombre || "",
      "Fecha Captura": f.fechaCaptura || "",
      RGPD: f.consentimientoRGPD ? "SÍ" : "NO",
      band_id: f.band_id || f.bandId || "band-1"
    }));
    const wsFans = XLSX.utils.json_to_sheet(fansData);
    XLSX.utils.book_append_sheet(wb, wsFans, "Fans_Tribu");

    const toursData = (state.tours || []).filter((t: any) => isOwn(t.band_id || t.bandId)).map((t: any) => ({
      ID: t.id,
      Nombre: t.nombre,
      Vehículo: t.vehiculo,
      Estado: t.estado,
      "Fecha Inicio": t.fechaInicio,
      "Fecha Fin": t.fechaFin,
      "Presupuesto Logística": t.presupuestoLogistica || 0,
      "Número Paradas": t.stops?.length || 0,
      band_id: t.band_id || t.bandId || "band-1"
    }));
    const wsTours = XLSX.utils.json_to_sheet(toursData);
    XLSX.utils.book_append_sheet(wb, wsTours, "Giras");

    const registeredBandsData = (state.registeredBands || state.users || [])
      .filter((b: any) => isOwn(b.band_id || b.bandId || b.id))
      .map((b: any) => ({
      ID: b.id || b.band_id,
      "Fecha Registro": b.fecha_registro || b.createdAt || "",
      "Nombre Banda": b.nombre_banda || b.bandName || b.name || "",
      Email: b.email || b.username || "",
      Plan: b.plan || b.selectedPlan || "emergente",
      Contacto: b.contacto_nombre || b.name || "",
      "Estilo Musical": b.estilo_musical || b.style || "",
      Localización: b.localizacion || b.city || "España",
      Teléfono: b.telefono || "",
      Instagram: b.instagram || "",
      "Spotify/YouTube": b.spotify_youtube || "",
      "Estado Cuenta": b.estado_cuenta || "activo",
      Notas: b.notas || "",
      band_id: b.band_id || b.bandId || b.id || "band-1"
    }));
    const wsRegisteredBands = XLSX.utils.json_to_sheet(registeredBandsData);
    XLSX.utils.book_append_sheet(wb, wsRegisteredBands, "Registro_Bandas");

    const usersData = (state.users || []).filter((u: any) => isOwn(u.band_id || u.bandId)).map((u: any) => ({
      ID: u.id,
      "Usuario/Email": u.username || u.email,
      Nombre: u.name || u.bandName,
      Rol: u.role,
      Plan: u.plan || "emergente",
      Instrumento: u.instrument || "Músico",
      "Fecha Creación": u.createdAt || "",
      band_id: u.band_id || u.bandId || u.id || "band-1"
    }));
    const wsUsers = XLSX.utils.json_to_sheet(usersData);
    XLSX.utils.book_append_sheet(wb, wsUsers, "Usuarios");

    const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="band_data.xlsx"');
    return res.send(excelBuffer);
  } catch (e: any) {
    console.error("Error generating band_data.xlsx:", e);
    return res.status(500).json({ error: "Fallo al generar band_data.xlsx" });
  }
});

// Full state GET endpoint - Pure Supabase PostgreSQL data
app.get("/api/state", async (req, res) => {
  try {
    const user = getUserFromRequest(req, loadState);
    // Antes, sin sesión válida (o con sesión pero sin banda asignada), esta ruta devolvía en
    // silencio los datos reales de Bakandeya (leads, conciertos, fans con datos RGPD, etc.) a
    // cualquiera. Es la ruta que alimenta toda la app: hay que exigir sesión y banda de verdad.
    if (!user) {
      return res.status(401).json({ error: "No autorizado. Inicia sesión para continuar." });
    }
    if (!user.band_id) {
      return res.status(409).json({ error: "Tu cuenta todavía no tiene ninguna banda asignada." });
    }
    const isLeader = user.role === "leader";
    const userBandId = user.band_id;

    const state = await loadStateFromSupabase(userBandId, user);

    if (!isLeader) {
      state.payments = [];
    }

    res.json(state);
  } catch (err: any) {
    console.error("Error in /api/state:", err);
    res.status(500).json({ error: "Error al cargar datos desde Supabase PostgreSQL" });
  }
});

// Static clip serving
app.use("/clips", (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
}, express.static(path.join(process.cwd(), "public", "clips")));

// 404 catch-all for API endpoints to prevent returning index.html for missing routes
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: `Ruta de API no encontrada: ${req.method} ${req.originalUrl}` });
});

// Red de errores para /api/*: hasta ahora, un throw síncrono o un next(err) en cualquier router
// caía en el manejador por defecto de Express (responde 500 pero no deja ningún rastro propio,
// ni en consola con contexto ni en Sentry). Va DESPUÉS de las rutas para que Express lo enrute
// aquí en cuanto algo llama a next(err) o lanza de forma síncrona.
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(`[UnhandledRouteError] ${req.method} ${req.originalUrl}:`, err);
  captureError(err, { method: req.method, url: req.originalUrl });
  if (res.headersSent) return;
  res.status(500).json({ error: "Error interno del servidor." });
});

// Vite middleware integration for full-stack SPA
async function startServer() {
  if (process.env.VERCEL) {
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
        allowedHosts: true,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // index.html nunca debe cachearse en el navegador: es el único archivo del build sin hash
    // en el nombre, así que si el navegador lo sirve de caché tras un deploy, sigue apuntando a
    // bundles JS/CSS con hash viejo que el servidor ya no tiene (fueron sustituidos por el build
    // nuevo) — la SPA se queda "atascada" en la versión anterior indefinidamente aunque el
    // deploy en sí haya sido correcto. Los assets con hash (bajo /assets) sí pueden cachearse
    // agresivamente: su nombre cambia en cada build, así que cachearlos para siempre es seguro.
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, {
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-store");
        }
      }
    }));
    app.get("*", (req, res) => {
      res.setHeader("Cache-Control", "no-store");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`BandManager.io v${getAppInfo().version} server running on http://localhost:${PORT}`);
    // Ampliación de socket timeout para procesos de inferencia pesados (GPU neural)
    server.timeout = 420000;
    server.keepAliveTimeout = 430000;
    server.headersTimeout = 440000;
    // Comprobación de seguridad en arranque: Webhook secret de Replicate
    if (!process.env.REPLICATE_WEBHOOK_SECRET) {
      console.error("[Seguridad Webhook] ❌ REPLICATE_WEBHOOK_SECRET no está configurado en las variables de entorno. Las peticiones a /api/webhooks/replicate-stems serán rechazadas con HTTP 401 (Fail-Closed).");
    }
    // Initialize Admin SuperUser Account
    try {
      ensureAdminUserExists(loadState()).catch(e => console.warn("Notice: Admin account init:", e));
    } catch (e) {
      console.warn("Notice: Admin account init:", e);
    }
    // Start background autonomous Social Radar Agent
    try {
      startSocialRadarScheduler();
    } catch (e) {
      console.error("Error starting Social Radar Scheduler:", e);
    }
    // Start booking agents scheduler (Enviador/Lector, ver server/services/agentScheduler.ts)
    try {
      startAgentScheduler();
    } catch (e) {
      console.error("Error starting Agent Scheduler:", e);
    }
    // Barrido diario de choques de calendario (aviso por email, ver server/services/calendarConflictService.ts)
    try {
      startCalendarConflictScheduler();
    } catch (e) {
      console.error("Error starting Calendar Conflict Scheduler:", e);
    }
    // Cola de letras del audio en segundo plano (ver server/services/colaLetras.ts)
    try {
      iniciarColaLetras();
    } catch (e) {
      console.error("Error starting Letras Queue:", e);
    }
  });

  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Exiting process so process manager can restart.`);
      process.exit(1);
    } else {
      console.error("Server error:", err);
    }
  });
}

if (process.env.BUILDING !== "true") {
  startServer();
}

export default app;