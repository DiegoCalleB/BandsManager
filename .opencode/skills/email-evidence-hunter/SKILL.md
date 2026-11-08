---
name: email-evidence-hunter
description: Política y herramientas para conseguir, verificar y puntuar emails de festivales, salas y contactos de booking en BandManager.io sin inventar ninguno. Usar al tocar el Scout, el enriquecimiento, el Enviador, el agente nocturno de emails o al cargar contactos en la base de datos.
---

# Skill: cazador de emails con evidencia

**Regla única: sin evidencia no entra.** Un email solo se guarda si está escrito en una página de la propia web del
lugar (o en una ficha oficial) y se guarda con la página donde se leyó. Ninguna IA, buscador ni lista escrita a mano
"completa" un email. AGENTS.md §3 manda sobre esta skill.

## Fiabilidad 0-100 (`src/utils/fiabilidadEmail.ts`)

| Puntos | Nivel | Cuándo |
|---|---|---|
| 100 | confirmado | El festival respondió desde ese buzón (`confirmado_por_respuesta`) |
| 90 | publicado | Leído en su web hace menos de 90 días (`verificado_en` o `en`) |
| 80 | banda | Lo escribió una persona (sin procedencia) |
| 75 | institucional | Ficha oficial (turismo, ayuntamiento) o catálogo |
| 50 | caducado | Leído en su web hace más de 90 días y nadie lo ha vuelto a ver |
| 0 | descartado | IA o buscador sin comprobar, rebote, dominio sin MX |

El Enviador no escribe por debajo de 75 (`emailsNoEnviables`, `server/utils/procedenciaDatos.ts`).

## Qué buzón vale (`server/utils/emailsDeContacto.ts`)
- Rol booking (booking, programacion, artistas, contratacion…) antes que general (info, hola, contacto…).
- Nunca prensa, entradas, RRHH, legal ni personas.
- Solo del dominio del lugar o de su misma marca (madcool.es ↔ madcoolfestival.es). Un dominio ajeno (ticketera, agencia, otro negocio con nombre parecido) no vale.

## Herramientas
| Qué | Dónde |
|---|---|
| Leer la web oficial con navegador real (email, Instagram, teléfono, fechas, formulario, convocatoria) | `scripts/lib/lectorWebFestival.ts` |
| Enriquecer una lista a mano (JSONL revisable, no escribe en BD) | `npm run enriquecer:festivales -- --lista=f.txt` |
| Descubrir la web oficial por dominios derivados del nombre | `npm run descubrir:webs-festivales -- --lista=f.txt` |
| Decidir cambios tras releer una web (función pura con tests) | `server/utils/reverificarEmail.ts` |
| Agente nocturno (re-verifica, añade, confirma, MX) | `npm run agente:emails -- --apply` · `.github/workflows/agente-emails.yml` |
| Auditar los ya guardados | `npm run auditar:emails` |

## Trampas conocidas
- **Otro negocio con el mismo nombre:** `riobabel.com` es un estudio de diseño y `babelterraza.com` una terraza, no el Río Babel Festival. Una web solo vale si, al abrirla, nombra el festival.
- **Dominios aparcados** (GoDaddy, HugeDomains, Sedo) responden 200: no son la web.
- **Los buscadores sirven resultados señuelo a los bots:** no los uses para extraer emails; como mucho para encontrar la web, que luego se valida.
- **JSON-LD con la dirección de la promotora** (Latitude → Londres): no guardes ciudad ni dirección salvo que aparezca escrita en la web del festival.
- **Nunca pises ni borres un email:** si desaparece de la web, su fiabilidad caduca sola.
