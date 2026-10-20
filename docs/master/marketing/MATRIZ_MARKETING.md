# Matriz de marketing: del Máster en Marketing Digital con IA a BandManager.io

Qué enseña el [Máster en Marketing Digital con IA](./TEMARIO_MARKETING_DIGITAL_IA.md) y qué de eso **tiene sentido aplicar** en BandManager.io: la presentación del TFM, las landings y todo lo que haga que el producto se venda solo.

> Principio: igual que en la [matriz del máster de desarrollo](../MATRIZ_APLICACION.md), solo se adopta lo que resuelve un problema real de este proyecto con un coste proporcionado (una persona con IA, producto en fase temprana, sin presupuesto publicitario). El máster cubre mucho canal de pago y de comercio electrónico que no encaja con un SaaS para músicos independientes.

## Lo esencial: 8 conceptos que sí se aplican (alcance acordado)

Decisión del 13/10/2026: aplicar **lo más importante y lo más útil**, de forma que se note que se estudia el máster de marketing, sin convertirlo en un segundo proyecto. Todo lo demás de este documento es detalle de consulta.

| # | Concepto del máster | Dónde se nota en la app | En la película del TFM |
|---|---|---|---|
| 1 | **Buyer persona** | Perfil de banda con público objetivo; los textos y reels lo usan. Landings con mensaje por audiencia (ya hay cuatro). | Iago *es* el buyer persona hecho personaje: líder de banda que lo lleva todo con una hoja de cálculo. |
| 2 | **Propuesta de valor** | Una frase y tres beneficios en landing, EPK y dossier («el mánager que llevas en el bolsillo»). | La frase que cierra el capítulo «Cómo lo hacemos». |
| 3 | **Embudo / customer journey** | Visita → registro gratuito → primer EPK publicado → compartido → plan de pago. | Capítulo 5, con las cifras reales de cada paso. |
| 4 | **Copywriting** (PAS, AIDA, ganchos) | Hero y llamadas a la acción de las landings; «hook doctor» y campaña de cuenta atrás de los reels. | Los ganchos de cierre de cada capítulo ya son esta técnica. |
| 5 | **SEO básico y GEO**, en español e inglés | `title`/`description`/`h1`, `hreflang` es/en, `FAQPage` y `MusicEvent`, Search Console. Fuera la valoración falsa. | Una línea en «Para el tribunal»: cómo se encuentra el producto. |
| 6 | **Analítica y KPIs** | Analítica web sin cookies, 5 eventos, una métrica estrella y un panel de 4 indicadores por banda. | Solo cifras que existan. Sin datos inventados. |
| 7 | **Inbound y email** | Incentivo para fans (ya existe) y correo de bienvenida con Resend. | Capítulo 3, «Que te conozcan». |
| 8 | **IA en marketing, con honestidad** | Todo es borrador revisable; nada falso; contenido de IA etiquetado. Un experimento por semana (Growth). | La regla del guion: «todo lo que se promete existe». |

---

## «BandManager tiene que venderse solo»: qué significa aquí

El producto crece sin que nadie lo empuje cuando **cada uso genera visibilidad y nuevos registros**. Hay tres condiciones, y las tres se pueden comprobar:

1. **El producto se enseña solo:** cada EPK, página de concierto, setlist o landing de fans que una banda comparte lleva la marca y un enlace de vuelta.
2. **Alguien lo recomienda:** los usuarios tienen un motivo y un mecanismo para traer a otros (referidos).
3. **Se mide:** sin números no se sabe qué canal funciona. Hoy esto es lo que falta.

---

## La película del TFM (presentación estilo Netflix)

La presentación (`presentacion/`, guion en `GUION.md`) ya sigue una estructura narrativa: tráiler, tres actos, ganchos al cierre de cada capítulo y la regla de que todo lo que se promete existe. El marketing aplicado **no debe interrumpir la historia**: aparece como parte de ella.

| Dónde en el guion | Qué aporta el máster | Cómo se hace sin romper el relato |
|---|---|---|
| **Acto I:** la banda y el Excel | Buyer persona | Iago ya es el personaje: no hay que explicarlo, se nota. |
| **Cap. 3 «Que te conozcan»:** dossier, QR de fans, reels | Branding, copywriting, lead magnet, embudo de fans | Se enseñan en pantalla: el gancho del reel, el QR del setlist, el alta con incentivo. |
| **Cap. 5 «Cómo lo hacemos»:** a quién se lo vendemos, cómo ganamos dinero | Propuesta de valor, embudo, KPIs, canales | Una sola diapositiva de embudo con **cifras reales** y una frase de propuesta de valor. |
| **«Para el tribunal»:** técnica y siguientes pasos | Método de marketing aplicado | Una diapositiva «Marketing aplicado» con los 8 conceptos en una línea cada uno y el dato que lo respalda. |

Reglas para la película:
- **Cifras solo reales.** Si un número no se puede medir hoy, se dice «lo vamos a medir así» en vez de inventarlo. Es coherente con la regla del guion y con haber quitado la valoración falsa.
- **El máster es método, no clase.** Se nombra el concepto una vez y se ve funcionando; no se explica la teoría.
- **El marketing de la película es el del producto:** el propio generador de Reels y las páginas públicas son la prueba.

*Esto es una propuesta: no se ha tocado la presentación.*

---

## 1. Hallazgos antes de nada

| # | Hallazgo | Estado | Evidencia |
|---|---|:-:|---|
| 1 | **Valoración fija en los datos estructurados de la landing** (`ratingValue: '4.9'`, `ratingCount: '312'`, sin fuente real: una reseña inventada). | ✅ Resuelto: ya no hay `aggregateRating`; solo `SoftwareApplication` y `FAQPage`. | `src/components/PublicLanding.tsx` |
| 2 | **Sin analítica web.** | 🟡 Implementada (Plausible sin cookies, cinco eventos del embudo) pero **apagada por defecto**: falta activarla en producción y mirar los números. | `src/utils/analitica.ts` |
| 3 | **Las landings no declaraban idiomas alternativos.** | ✅ Resuelto: `/` y `/en` llevan `canonical` y `hreflang` desde el servidor; las guías y la plantilla de rider también. | `server/utils/cabeceraIdioma.ts` |
| 4 | **/musicos y sus tres alias servían la misma pantalla sin título propio ni canónica.** | ✅ Resuelto: título, descripción y canónica única servidos desde el servidor, con par `hreflang` vía `?lang=en`. | `server/utils/cabeceraIdioma.ts` |

## 2. Lo que ya existe (verificado en el repositorio)

| Pieza | Dónde | Qué aporta |
|---|---|---|
| **Insignia «Powered by BandManager.io»** en planes gratuitos | `server/utils/referidos.ts`, `src/components/ui/InsigniaBandManager.tsx` | Aparece en el EPK, la captura de fans y la página de concierto, y registra la superficie (`origen`) en la UTM para saber cuál convierte más. Documentado como «el canal de crecimiento del producto». |
| **Referidos entre bandas** | `server/routes/referidos.ts`, `server/utils/referidos.ts` | Mecanismo de recomendación. |
| **Enlaces cortos con UTM** | `server/utils/enlacesCortos.ts` | `utm_source`, `utm_medium=enlace_corto`, `utm_campaign`: atribución por canal. |
| **QR con UTM en los PDF** de repertorio | `src/components/repertorio/pdf_export/buildHeaderFooter.ts` | `utm_source=setlist&utm_medium=qr`: cada setlist impreso trae visitas medibles. |
| **Páginas de concierto indexables** | `server/routes/paginaConcierto.ts` | HTML en servidor, `sitemap.xml` y `robots.txt`; vistas previas correctas en WhatsApp e Instagram. Solo conciertos publicables y con lista blanca de campos. |
| **Landing con SEO base** | `index.html`, `src/components/PublicLanding.tsx` | `title`, `description`, Open Graph, Twitter card, `og-cover.png` 1200×630, `FAQPage` JSON-LD, i18n. |
| **Guías y plantilla de rider en SEO** (es/en) | `server/routes/paginasSeo.ts`, `server/utils/seo/`, `server/utils/paginaRider.ts` | 20 guías y una plantilla editable bajo `/guides` (antes `/guias`, con 301) y `/en/guides`: contenido para búsquedas reales de bandas, con `Article`, `BreadcrumbList` y `FAQPage`, resumen, índice con anclas, `hreflang` recíproco, UTM por guía y sitemap. |
| **Tres landings por audiencia** | `PublicLanding`, `PublicMusiciansLanding`, `PublicTfmLanding`, `FansLanding` | Mensaje distinto para cada público. |
| **Planes y precios** | `src/components/Planes.tsx` | Tres niveles gratuitos y de pago. |
| **Chat de conversión en la landing** | `src/components/LandingChatWidget.tsx` | Respuestas guionizadas, sin backend ni coste. |
| **Generador de Reels y radar social** | `server/routes/reels.ts`, `server/services/socialRadarService.ts` | El propio producto fabrica el contenido para redes: la mejor demostración posible. |
| **Correo transaccional** | `resend` en `package.json` | Base para bienvenida y activación. |
| **Presentación del TFM** | `presentacion/` (`GUION.md`, `deck.js`) | Guion con estructura narrativa y regla de que nada se promete sin existir. |
| **Identidad visual** | skill `visual-identity` («Espectro») | Marca coherente; sirve de brand book. |

---

## 3. Matriz por bloque del máster

**Aplica a:** TFM = presentación del TFM · Web = landings y SEO · Prod = producto que se vende solo · — = ninguno.
**Decisión:** 🟢 aplicar ahora · 🔵 cuando duela (con disparador) · ⚪ no aplicar (con motivo) · ➖ no es código.
**Progreso** = el de tu plataforma (Introducción y Primeros pasos completados, Negocios digitales al 85 %, el resto sin empezar). **Abre** = «Disponible desde» del índice.

### 3.1 Fundamentos

| Módulo | Abre | Aplica a | Estado en el repo | Decisión |
|---|---|:-:|---|---|
| Introducción al Marketing Digital (datos, buyer persona, customer journey, KPIs) | ya | TFM, Web | Sin analítica; sin buyer persona escrito | 🟢 Definir 3–4 buyer personas (líder de banda, mánager, sala, fan) y 5 KPIs (§6). |
| Negocios digitales (conversión, B2B/B2C, ejemplos) | ya | TFM | SaaS con modelo gratuito + planes; el comprador (banda) y el destinatario del pitch (sala) son distintos | 🟢 Dejar escrito quién paga y quién recibe valor. |
| Introducción a la IA (chat → agente, Projects, Skills, flujos) | — | — | `AGENTS.md`, skills | ➖ Ya aplicado en el flujo de desarrollo. |
| Buyer persona (tipos, cómo definirlo, con IA) | 0 % | TFM, Web | No existe | 🟢 Un documento de una página por persona, con evidencia de usuarios reales (Bakandeya, otras bandas). |
| Propuesta de valor (qué problema, por qué tú, competencia) | 0 % | TFM, Web | `og:title` «el mánager que llevas en el bolsillo»; hero de la landing | 🟢 Una frase + tres beneficios, validados contra el uso real; alimenta landing y presentación. |

### 3.2 Branding y redes sociales

| Módulo | Abre | Aplica a | Estado en el repo | Decisión |
|---|---|:-:|---|---|
| Branding e identidad corporativa | 0 % | Web, TFM | Sistema «Espectro» en `visual-identity` | 🟢 Mantener coherencia entre producto, landing y deck. ⚪ Rehacer la marca. |
| Estrategia RRSS (marca, competencia, audiencia, CM, contenidos) | 30/10 | Prod | El producto genera Reels | 🟢 **Dos canales como máximo**, elegidos por dónde están los músicos. |
| Instagram | 16/10 | Prod, Web | Reels generator | 🟢 Canal principal candidato; usar el propio generador como demostración. |
| TikTok | 16/10 | Prod | — | 🔵 Segundo canal si el contenido de Instagram funciona. ⚪ TikTok Shop. |
| YouTube | 23/10 | Web, TFM | `public/login-animation.mp4` y vídeo de la presentación | 🔵 Un vídeo de demostración reutilizable; canal propio cuando haya contenido recurrente. |
| LinkedIn | 30/10 | TFM | — | 🔵 Para la presentación y para llegar a salas, promotores y agencias; no como canal principal. |
| Comunidades | 30/10 | Prod | `FansCommunityView` (comunidad de fans de cada banda) | 🔵 Comunidad de usuarios (bandas) cuando haya masa crítica. |
| Facebook, X, Pinterest, Twitch | 16/10–19/02 | — | — | ⚪ Fuera de los canales donde se mueve el público objetivo. |
| Marketing de influencers, herramientas de RRSS (Canva, Linktree…) | 19/02 | — | — | ⚪ Sin presupuesto; el producto ya crea sus enlaces cortos. |

### 3.3 SEO

| Módulo | Abre | Aplica a | Estado en el repo | Decisión |
|---|---|:-:|---|---|
| Introducción y keyword research | 06/11 | Web | Sin investigación de palabras clave | 🟢 Una investigación corta: «software para bandas», «cómo conseguir bolos», «EPK para músicos», «rider técnico plantilla». |
| Arquitectura SEO, URLs, headings, metadatos, enlazado interno | 13/11 | Web | `title`/`description` únicos solo en `index.html` y en `PublicLanding`; rutas con hash en parte de la SPA | 🟢 `title`, `description` y un solo `h1` por landing; URLs limpias en las páginas públicas. |
| Robots y sitemap | 20/11 | Web | ✅ `robots.txt` y `sitemap.xml` servidos desde `server.ts` | 🟢 Verificar la propiedad en Search Console y enviar el sitemap. |
| Datos estructurados | 20/11 | Web | `SoftwareApplication` y `FAQPage` ✅ en la landing; `MusicEvent` ✅ en la página de concierto (`paginaConcierto.ts`). La landing lleva además la **valoración falsa** (§1) | 🟢 Quitar el `aggregateRating` falso y comprobar los datos de evento con la prueba de resultados enriquecidos de Google. |
| Indexación (Search Console, crawl budget) | 27/11 | Web | Sin Search Console verificado | 🟢 Alta de la propiedad. |
| Contenidos y blog | 27/11 | Web | Sin blog | 🔵 Páginas de herramientas gratuitas (plantilla de EPK, de rider, calculadora de caché) como imán de captación. ⚪ Blog con calendario editorial semanal: no hay capacidad. |
| Perfil de enlaces, link building, link baiting | 04/12 | Web | — | ⚪ Esfuerzo desproporcionado; las páginas de concierto y los EPK compartidos ya generan enlaces de forma natural. |
| Estrategia SEO | 04/12 | TFM | — | 🟢 Resumen de una página para la presentación. |
| SEO avanzado: imágenes, local, internacional, e-commerce | 19/02 | Web | — | 🔵 Internacional (`hreflang`) cuando se decida competir en más de un idioma. ⚪ Local, e-commerce: no aplican. |
| Herramientas (Search Console, Ahrefs, Screaming Frog) | 19/02 | Web | — | 🟢 Search Console (gratuito). ⚪ Ahrefs y Screaming Frog de pago. |
| SEO con IA / posicionamiento en LLMs (GEO) | 29/01 | Web | `FAQPage` con respuestas directas ✅ | 🟢 Barato y a favor: revisar que `robots.txt` permita los rastreadores de IA que interesen y que las FAQ respondan en dos frases. |

### 3.4 SEM (publicidad de pago)

| Módulo | Abre | Aplica a | Decisión |
|---|---|:-:|---|
| Tipos de publicidad, Google Ads (Search, Display, PMax, Shopping, Demand Gen), YouTube Ads, Meta Ads, Retargeting | 11/12–18/12 | TFM | 🔵 No antes de tener analítica, un embudo medido y una conversión conocida. Disparador: coste de adquisición orgánico conocido y presupuesto asignado. Para el TFM: plan teórico con presupuesto simulado. |
| SEM avanzado: Display, descargas (Apple Search Ads), Bing, LinkedIn/TikTok/Pinterest/X/Twitch/Snapchat/Amazon Ads, programática, Ads para e-commerce, PPC para B2B, extensiones | 19/02 | — | ⚪ No aplica a este producto hoy. PPC para B2B/SaaS (lead generation): 🔵 solo si se vende a salas o agencias. |
| IA para SEM | 05/01 | — | ⚪ Hasta que haya campañas. |

### 3.5 Inbound, copywriting y analítica

| Módulo | Abre | Aplica a | Estado en el repo | Decisión |
|---|---|:-:|---|---|
| Content marketing, plan de contenidos, inbound (4 fases) | 08/01 | Web, TFM | Sin plan de contenidos | 🟢 Un plan de contenidos de una página con 3 pilares (conseguir bolos, ensayar mejor, que te conozcan) y calendario mensual. |
| Funnel | 15/01 | Web, Prod | Embudo implícito: landing → registro gratuito → uso | 🟢 Dibujarlo con cifras reales: visita → registro → primer EPK publicado → plan de pago. |
| Marketing automation y herramienta (ActiveCampaign) | 15/01 | Prod | `resend` presente | 🔵 Secuencia de bienvenida de 3–4 correos con Resend. ⚪ ActiveCampaign y similares. |
| Email marketing (tipos, secuencias, ejemplos) | 15/01 | Prod | Correo transaccional ✅ | 🟢 Bienvenida y activación (primer EPK, primera sala). 🔵 Reactivación y limpieza. |
| Copywriting: email, RRSS, landing pages | 22/01 | Web | Copy en las landings | 🟢 Revisar hero y llamadas a la acción con PAS/AIDA; copy de los correos. |
| Copywriting para Ads | 22/01 | — | — | ⚪ Sin campañas. |
| Google Analytics 4 y Google Tag Manager | 22/01 | Web, Prod | **Nada instalado** | 🟢 Medición mínima (§6). ⚪ GTM: añade complejidad sin necesidad. |
| Looker Studio | 19/02 | — | — | 🔵 Cuando haya datos suficientes para un panel. |
| CRM (HubSpot, Salesforce), gestión de clientes y proyectos | 19/02 | — | El propio producto es un CRM de salas | ⚪ El marketing se lleva con una hoja y las métricas del producto. |
| CRO y UX/UI | 19/02 | Web | Sin pruebas de conversión | 🟢 Formulario de registro corto y una sola llamada a la acción principal por landing. |
| Closer de ventas (5 módulos) | 19/02 | — | Producto de autoservicio | 🔵 Solo si aparecen ventas a mano (agencias, salas con varios locales). |

### 3.6 Marketing con IA

| Módulo | Abre | Aplica a | Estado en el repo | Decisión |
|---|---|:-:|---|---|
| Imágenes y vídeos con IA; avatares; voz y doblaje | 29/01 | TFM, Web | Vídeos propios en `public/` y en `presentacion/video` | 🔵 Para el vídeo de la landing y piezas del TFM, con licencia clara. ⚪ Avatares para sustituir a las personas reales. |
| Redes sociales con IA | 05/02 | Prod | Reels generator | 🟢 Ya aplicado: usar el propio generador como contenido. |
| SEO con IA | 05/02 | Web | — | 🔵 Para el brief y el calendario, sin contenido masivo generado. |
| Email marketing con IA | 12/02 | Prod | — | 🟢 Asuntos y borradores revisados a mano. |
| Automatizaciones con IA (Make, Telegram) | 12/02 | — | Agentes propios | ⚪ Ya hay agentes y cola propios. |
| Creación de webs con IA (Lovable) | 12/02 | — | Landing en React propio | ⚪ Sin necesidad. |
| Agentes de IA para marketing | 12/02 | Prod | Scout, Redactor, Enviador, Lector con aprobación humana (ADR 0005) | 🟢 Ya aplicado. |

### 3.7 TFM de marketing y extras

| Módulo | Abre | Aplica a | Decisión |
|---|---|:-:|---|
| **Estrategia de Marketing Digital (TFM)**: kick off con cliente, SEO (KWR, arquitectura, calendario, técnica), SEM, funnel y buyer persona, RRSS | 12/02 | TFM | 🟢 Si BandManager.io es el caso del TFM de marketing, **esta matriz es el esqueleto**: cada entregable (SEO, SEM, funnel, RRSS) tiene su fila. Confirmar con la dirección del máster qué formato y qué datos exige antes de escribir nada. |
| Trabajo Final de Máster (entregables SEO, SEM, funnel, RRSS) | 12/02 | TFM | 🟢 Ver arriba. |
| Business cases (27 casos de empresas) | 19/02 | — | ➖ Lectura de referencia. |
| Bonus 6: Growth Marketing (experimentación, North Star, retención, monetización) | 19/02 | Prod | 🟢 **Ligero**: una métrica estrella (por ejemplo «bandas con un EPK publicado y compartido en 7 días») y un experimento por semana. |
| Bonus (CV, LinkedIn, gestión de clientes, marca personal, kit de herramientas) | 19/02 | — | ➖ Desarrollo profesional. |
| Directos, bolsa de empleo, masterclass SEM | — | — | ➖ |

---

## 4. Marketing para las bandas clientes (lo que el producto hace por ellas)

Hay un segundo uso del máster, más importante que el primero: **BandManager.io es una herramienta de marketing para bandas**. Cada banda cliente tiene el mismo problema que este proyecto (darse a conocer con una persona y poco presupuesto), y el máster enseña cómo resolverlo. Si el producto aplica bien esas ideas, ayuda a sus clientes y, de paso, se vende solo (§1).

### 4.1 Qué ofrece ya el producto (verificado)

| Función | Dónde | Qué hace |
|---|---|---|
| **Generador de Reels** | `server/routes/reels.ts`, `src/components/reels_center/` | Analiza vídeos, busca los mejores momentos, corta clips y revisa el gancho con el «hook doctor» (`/reels/ai-hook-doctor`). |
| **Campaña de cuenta atrás de un concierto** | `server/routes/campanaConcierto.ts`, `src/utils/campanaConcierto.ts` | Textos de cada publicación con su enlace corto. Plantillas gratis y deterministas; con IA, validadas (`sanearVarianteIA`); son borradores que la persona revisa. |
| **Publicaciones programadas** | `server/routes/posts.ts` | Calendario de contenidos, cuentas sociales conectadas y publicador. |
| **Métricas sociales** | `server/services/socialRadarService.ts` | Seguidores, visualizaciones y oyentes por plataforma. |
| **Plan de crecimiento por tipo de banda** | `src/utils/growthPlanEngine.ts`, `src/utils/bandGrowthTiers.ts` | Detecta el nivel de la banda (`garage_debut` → `national_headliner`) y propone acciones con objetivo medible (por ejemplo «más de 1.000 visualizaciones orgánicas por Reel», «retención >60 % en los 5 primeros segundos»). |
| **Página de concierto indexable** | `server/routes/paginaConcierto.ts` | HTML en servidor, datos estructurados `MusicEvent`, vista previa correcta en WhatsApp e Instagram, entrada en el `sitemap.xml`. |
| **Enlaces cortos con UTM** | `server/utils/enlacesCortos.ts` | Atribución por canal en cada publicación. |
| **Captura de fans con consentimiento** | `src/components/PublicFanCapture.tsx` | Alta con casilla RGPD obligatoria; base de la comunidad. |
| **Incentivo para fans** (descarga o cupón) | `src/components/fans_landing/FansLandingSuccess.tsx` | Tras el alta, la banda puede ofrecer un enlace de descarga o un código de descuento: ya es un imán de captación; solo se muestra si la banda lo rellena. |
| **Panel de fans y comunidad** | `src/components/fans_panel/`, `FansCommunityView` | Gestión de la comunidad de cada banda. |
| **EPK / dossier público** | `src/components/PublicEPK.tsx` | Carta de presentación para salas y promotores. |
| **Tono y perfil de banda** | `server/utils/bandProfile.ts` (`baseHashtags`, perfil) | La IA escribe con el tono de la banda, no con uno genérico. |

### 4.2 Qué enseña el máster y cómo se aplica a una banda cliente

| Idea del máster | Módulo | En una banda cliente | Estado | Decisión |
|---|---|---|:-:|---|
| **Buyer persona** = el fan (no el músico) | Buyer persona | Perfil de público objetivo de la banda en el perfil: quién va a sus conciertos, dónde está, qué le hace compartir | ❌ (el perfil recoge estilo, tono y energía, pero no encuentro un campo de público objetivo) | 🟢 Un campo breve en el perfil de banda que alimente el tono y los textos. |
| **Propuesta de valor** | Propuesta de valor | Una frase que diga por qué esa banda (el «qué la hace distinta»), reutilizable en EPK, bio y publicaciones | 🟡 | 🟢 Proponerla desde el perfil y dejar que la banda la edite. |
| **Branding y coherencia** | Branding | Misma voz, mismos colores y misma bio en el EPK, la página de concierto y las redes | 🟡 | 🟢 Que los textos de IA lean siempre el perfil de banda. |
| **Estrategia de contenidos y plan de contenidos** (pilares, calendario) | Plan de contenidos, Estrategia RRSS | Tres pilares (música, detrás de cámaras, concierto) y un calendario de 4 semanas alrededor de cada fecha | 🟡 | 🟢 Ya existe la campaña de cuenta atrás; ampliar a «antes / durante / después» del concierto. |
| **Instagram: reels, carruseles, stories, métricas** | Instagram | Plantillas por formato y objetivos según el nivel de la banda | 🟡 | 🟢 Ya hay Reels y plan por nivel. 🔵 Carruseles y stories cuando haya demanda. |
| **TikTok: algoritmo, retención, SEO** | TikTok | Retención en los 3–5 primeros segundos (el hook doctor ya lo mide) | 🟡 | 🟢 Mantener el foco en el gancho. ⚪ TikTok Shop. |
| **YouTube: CTR, títulos, miniatura** | YouTube | Título y miniatura del directo o videoclip | ❌ | 🔵 Asistente de título y descripción cuando una banda suba directos. |
| **Embudo de fans** (atraer → convencer → vender → fidelizar) | Inbound, Funnel | Alcance (reel) → visita (enlace corto) → alta con consentimiento (QR) → comunidad → asistencia | 🟡 | 🟢 Medirlo de principio a fin en el panel de la banda. |
| **Lead magnet** | Funnel, Inbound avanzado | Algo gratuito a cambio del alta del fan (descarga de una canción, acceso a un ensayo, sorteo de entradas) | 🟡 | 🟢 Ya existe el incentivo opcional (descarga o cupón). Falta ayudar a la banda a elegir uno bueno: sugerencias y ejemplos en la pantalla donde lo configura. |
| **Email marketing y automatización** (bienvenida, segmentación, reactivación) | Email marketing, Marketing automation | Correo de bienvenida al fan y aviso de nuevos conciertos por cercanía | ❌ (no encuentro un envío a fans; sin verificar a fondo) | 🟢 Bienvenida y aviso de concierto, con consentimiento. 🔵 Segmentación por ciudad. ⚪ Automatizaciones avanzadas. |
| **Copywriting** (PAS, AIDA, ganchos, disparadores) | Copywriting RRSS, Ads | Textos de conciertos, reels y newsletters con ganchos probados | 🟡 | 🟢 Incorporar las fórmulas al generador de textos y al «hook doctor». |
| **UTM y atribución** | Analítica | Saber qué publicación llenó la sala | 🟡 | 🟢 Panel de clics por publicación a partir de los enlaces cortos que ya existen. |
| **Analítica y KPIs** | GA4, Looker Studio | Cuadro de mando sencillo: alcance, clics, altas de fans, asistencia | 🟡 | 🟢 Un panel de 4 indicadores. ⚪ Informes personalizados al estilo Looker. |
| **SEO local y de eventos** | SEO, SEO local | Que la página de concierto aparezca al buscar «concierto + ciudad + banda» | ✅ | 🟢 `MusicEvent`, HTML en servidor y sitemap ya están. Mantener y comprobar en Search Console y en la prueba de resultados enriquecidos. |
| **GEO / aparecer en las respuestas de IA** | Posicionamiento en LLMs | Que un asistente de IA pueda citar a la banda con datos claros (bio, fechas, enlaces) | ❌ | 🔵 Estructura clara y datos verificables en la página pública. |
| **Comunidad: de seguidores a embajadores** | Comunidades | Fans que invitan a otros (referidos entre fans) y roles | 🟡 | 🔵 Cuando una comunidad supere un tamaño mínimo. |
| **Publicidad de pago (Meta, Google, TikTok)** | SEM | Anuncio de un concierto a la gente de la zona | ❌ | ⚪ Fuera del producto: gestión de dinero ajeno y de políticas de plataforma. 🔵 Guía y texto del anuncio, sin crearlo desde el producto. |
| **Marketing de influencers** | Marketing de influencers | Colaboraciones con otras bandas y medios locales | ❌ | 🔵 Aprovechar el CRM de salas para colaboraciones. |
| **Crecimiento: experimentos y métrica estrella** | Growth Marketing | Una prueba semanal (hora de publicación, tipo de gancho) con resultado | ❌ | 🔵 Cuando haya métricas suficientes por banda. |
| **IA para contenidos** (imagen, vídeo, voz) | Marketing con IA | Imágenes y vídeo de apoyo para el cartel o el reel | 🟡 | 🔵 Solo con las reglas de §4.3. ⚪ Avatares o voces que suplanten a los músicos. |

### 4.3 Reglas del producto cuando hace marketing por una banda

Son límites que el máster no siempre subraya y que protegen a la banda cliente y al propio producto:

1. **Nada se publica sin que la persona lo revise** (AGENTS.md §3, aprobación humana). Todo lo que sale es borrador.
2. **Nada falso:** ni métricas, ni valoraciones, ni seguidores, ni entradas «agotadas» inventadas. El producto no ofrece comprar seguidores ni interacciones.
3. **El contenido generado con IA se declara cuando la plataforma lo exige** (etiquetas de contenido sintético de Meta y TikTok) y no suplanta a personas reales.
4. **Datos de fans con consentimiento y finalidad clara:** casilla RGPD obligatoria (ya está), solo para lo que se informó, con baja sencilla y sin ceder datos a terceros. Los correos a fans necesitan base legal y enlace de baja.
5. **Cada banda ve solo lo suyo:** todo lo anterior pasa por `getTargetBandId` y el aislamiento por banda.
6. **Respeto a derechos de autor** en vídeos, música y fotos que se suban o se generen.

### 4.4 Qué priorizar (bandas clientes)

| Orden | Cambio | Por qué primero |
|---|---|---|
| 1 | Panel de 4 indicadores por banda (alcance, clics por publicación, altas de fans, asistencia) | Sin medir no se sabe qué reel llena la sala; ya existen los enlaces cortos con UTM. |
| 2 | Perfil de banda con público objetivo y propuesta de valor, que alimente todos los textos | Mejora a la vez el EPK, los reels y las campañas sin una pantalla nueva. |
| 3 | Fórmulas de copy (PAS, AIDA, ganchos) en la campaña de cuenta atrás y en el «hook doctor» | Es el cambio de mayor efecto con menor código. |
| 4 | Lead magnet y correo de bienvenida a fans | Convierte seguidores en una lista propia, que no depende del algoritmo. |
| 5 | Datos estructurados de evento en la página de concierto | Visibilidad en buscadores y respuestas de IA. |

---

## 5. Plan de marketing para que BandManager.io se venda solo

Mismas fases cortas que el plan técnico. Cada una cabe en uno o dos PR pequeños.

### Fase M0 — Honestidad y medición (esta semana)
1. **Quitar el `aggregateRating` falso** de la landing (§1, hallazgo 1).
2. **Medición mínima:** Plausible y 5 eventos (visita a landing, registro, primer EPK publicado, enlace corto compartido, plan de pago). Pendiente de crear la cuenta (§6).
3. **Search Console:** verificar la propiedad y enviar `sitemap.xml`.

### Fase M1 — La landing convierte (2 semanas)
4. Propuesta de valor y buyer personas escritos (documentos de una página).
5. Revisar hero, llamada a la acción y FAQ con copy PAS/AIDA; una sola llamada principal por landing.
6. `title`, `description` y `h1` únicos; FAQ con respuestas de dos frases (útil también para los buscadores de IA).
7. Registro corto.

### Fase M2 — Los bucles de crecimiento (4 semanas)
8. **Medir la insignia:** ya está en EPK, fans y concierto y registra su `origen`; falta verlo en un panel de conversión por superficie.
9. **Referidos visibles** en el panel, con motivo claro para recomendar.
10. Atribución de registro por UTM: guardar de dónde viene cada alta y ver qué canal produce activación.
11. **Secuencia de bienvenida** de 3–4 correos con Resend (activación: primer EPK, primera sala).

### Fase M3 — Contenido y canales (continuo, con límite)
12. **Un canal de redes**, usando el generador de Reels del propio producto; el segundo solo si funciona.
13. 1–2 **herramientas gratuitas** que atraigan búsquedas (plantilla de EPK, de rider, calculadora de caché) y lleven al registro.
14. Un experimento por semana con una métrica estrella.

### Fuera del plan (⚪, con motivo)
Publicidad de pago, link building, CRM comercial, ActiveCampaign o similares, webs generadas con IA, canales sin audiencia musical, automatización con Make. Se reabren solo con datos de conversión y presupuesto.

---

## 6. Decisiones tomadas (13/10/2026)

| # | Tema | Decisión | Motivo |
|---|---|---|---|
| 1 | **Analítica** | Plausible (sin cookies, alojado en la UE) o Umami; recomendado **Plausible**. Cinco eventos: visita a landing, registro, primer EPK publicado, enlace corto compartido, plan de pago. | No exige banner de cookies, es sencilla y encaja con el RGPD. Queda pendiente crear la cuenta; con ella se añade el script en una línea. |
| 2 | **Valoración de la landing** | **Se quita** el `aggregateRating` hasta tener valoraciones reales y enlazables. | No tiene fuente de datos; es un riesgo con Google y de publicidad engañosa. |
| 3 | **Alcance** | Los **8 conceptos esenciales** de arriba. El resto es consulta. | Que se note el máster sin convertirlo en otro proyecto. |
| 4 | **Publicidad de pago** | Sin campañas ahora. Hay presupuesto disponible, pero 🔵 **cuando el embudo esté medido** (al menos 4 semanas de datos de registro → activación) y se haya fijado un coste máximo por alta. Primero Meta Ads a pequeña escala para retargeting. | Gastar antes de medir no enseña nada. |
| 5 | **Idiomas** | **Español e inglés.** `hreflang` es/en, textos de landing y de correos en ambos, y `og:locale` por idioma. | Las landings ya tienen i18n; falta declararlo a los buscadores. |

---

## Cómo mantener esta matriz
1. Cuando un módulo se abra, léelo antes de decidir: esta matriz parte de **títulos**, no de contenido.
2. Cada 🔵 tiene un disparador; cuando ocurra, pasa a 🟢 con un ADR corto.
3. Cada ⚪ se reabre si cambia el contexto (presupuesto, equipo, mercado), no por haberlo estudiado.
4. Cifras de analítica y conversión solo con datos reales; las promesas del producto solo si existen en el repositorio (regla del guion del TFM).

*Última revisión: 2026-10-13. Estado de las filas tomado del repositorio en `main` tras el PR #240.*
