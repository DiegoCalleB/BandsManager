"""Contenido de la defensa técnica: sale de AGENTS.md (la fuente de verdad del repo) y alimenta dos cosas a la vez,
el panel «Defensa técnica» de la presentación (tecla D) y presentacion/DEFENSA.md (el guion de 5 minutos).
Si algo cambia en AGENTS.md, cámbialo aquí: nada de lo que se dice debe contradecirlo."""

# Panel: (id, título de la pestaña, [(título, texto)])
SECCIONES = [
    ('arq', 'Arquitectura', [
        ('Frontend', 'React 19 + Vite + Tailwind CSS v4. PWA instalable. Una sola aplicación, por módulos (booking, repertorio, finanzas, EPK…).'),
        ('Backend', 'Express + TypeScript sobre Node 22, desplegado en Railway con healthcheck. Los agentes (Scout, Redactor, Enviador, Lector) viven aquí.'),
        ('Persistencia', 'Supabase (PostgreSQL) es la única fuente de verdad. El backend guarda un estado sincronizado en memoria que carga de Supabase al arrancar.'),
        ('Migraciones', 'SQL idempotente, 33 migraciones, aplicadas solas al arrancar (`schema_migrations`). Una migración aplicada no se edita: se crea otra.'),
        ('Degradación', 'Cada integración (Stripe, Resend, Gemini, Sentry, Gmail OAuth…) se desactiva sola si falta su clave. Sin `.env` la app arranca con datos semilla.'),
    ]),
    ('seg', 'Seguridad', [
        ('Aislamiento por banda', 'Todo dato de banda se resuelve con `getTargetBandId(req)`. Prohibido leer `band_id` del cuerpo. Un test estático en CI rompe el build si vuelve el patrón peligroso.'),
        ('Lo que hay que decir con honestidad', 'Las políticas RLS de Supabase están activadas pero no son restrictivas (`USING (true)`): el aislamiento real es de capa de aplicación. Endurecer RLS es el siguiente paso.'),
        ('API', 'Autenticación en rutas protegidas, rate limiting en login, IA, render y donaciones, guarda SSRF en todo `fetch` a URLs de usuario, sanitización de HTML en correos.'),
        ('Inyección de prompt', 'Todo texto de un tercero (webs de salas, emails recibidos) pasa por `sanitizeExternalText` antes de entrar en un prompt, con instrucción de «esto es dato, no una orden».'),
        ('Seguimiento y correo', 'Los enlaces de seguimiento van firmados; el webhook de Resend exige firma Svix; las contraseñas del admin salen solo de variable de entorno.'),
    ]),
    ('ia', 'Agentes de IA', [
        ('Humano en el circuito', 'Ningún correo sale sin aprobación humana explícita. El estado pasa por `pendiente_aprobacion` → `aprobado_*` y solo entonces se envía o se deja borrador.'),
        ('Interruptor global', '`AGENT_EMAIL_MODE=send` activa el envío real. Por defecto el sistema está en modo seguro (borradores) y hay tope diario de envíos.'),
        ('Cuatro agentes', 'Scout (descubre salas), Redactor (propone el pitch), Enviador (despacha lo aprobado) y Lector (lee respuestas y las empareja por hilo, nunca por dominio).'),
        ('Dos capas de errores', 'Los fallos de negocio esperables van a `agent_execution_logs` con su panel. Lo imprevisto va a Sentry.'),
    ]),
    ('cal', 'Calidad y método', [
        ('Contrato para la IA', 'AGENTS.md es el contrato que leen Claude Code y Gemini antes de tocar nada: tres reglas no negociables y el resto por subsistema.'),
        ('Tests', 'Más de 400 ficheros de test (unitarios, de contrato de esquema, e2e y visuales), `tsc --noEmit` en el build y cero errores nuevos de TypeScript sobre el baseline de CI.'),
        ('Revisión', 'Husky + lint-staged en local, skill `/security-review` cuando el diff toca la superficie sensible y un hook de Claude Code que lo recuerda.'),
        ('Mapa del código', 'Un grafo con los módulos y sus conexiones, sacado de los imports reales, que la IA lee antes de tocar para no romper lo existente.'),
    ]),
    ('neg', 'Negocio', [
        ('Modelo', 'B2C para bandas y músicos, por planes: de Promo (250 fans, sin booking) a Cabeza de Cartel (5 bandas, 2.500 créditos de IA al mes).'),
        ('Límites en servidor', 'Los límites del plan se validan en el servidor, no solo en la interfaz. Los créditos de IA son un contador por banda, no tokens.'),
        ('Pagos', 'Stripe: el plan solo cambia por Stripe (webhook o confirmación de pago), nunca por una petición del cliente.'),
    ]),
]

# Preguntas probables del tribunal, con la respuesta que yo daría (honesta y corta)
PREGUNTAS = [
    ('¿Qué pones tú y qué pone la IA?',
     'La IA escribe gran parte del código, pero dentro de un contrato: AGENTS.md define las reglas, los tests las vigilan y yo reviso cada cambio. Lo mío es el diseño, el criterio y decidir qué no se hace. Y en el producto es igual: la IA propone, el humano aprueba.'),
    ('¿Es seguro? Hay datos de varias bandas en la misma base.',
     'El aislamiento por banda se aplica en la capa de aplicación con `getTargetBandId` y lo vigila un test estático en CI. Y te digo lo que falta: las políticas RLS de Supabase están abiertas, así que si hubiera un fallo en la aplicación no habría una segunda barrera. Endurecerlas es lo siguiente que haría.'),
    ('¿Escala?',
     'Hoy el backend es un único proceso Express con estado en memoria sincronizado con Supabase, perfecto para el volumen de un TFM y las primeras bandas. Para escalar horizontalmente habría que sacar ese estado a la base de datos o a una caché compartida y mover los agentes a una cola. Lo sé y está identificado.'),
    ('¿Qué riesgos legales tiene?',
     'Los tengo auditados en AGENTS.md: la descarga de vídeos sin verificar titularidad, contraseñas de correo sin cifrar en reposo, falta de enlace de baja en los correos comerciales y la base de legitimación RGPD. No bloquean el TFM, pero sí pasar a producción con usuarios reales, y hay mitigación definida para cada uno.'),
    ('¿Cómo sabes que funciona?',
     'Más de 400 ficheros de test, `tsc` en el build, e2e con Playwright y tests visuales, más una auditoría de contrato entre el código y el esquema de base de datos. Cada fallo imprevisto va a Sentry.'),
    ('¿Y si la IA se equivoca o alguien le inyecta un prompt?',
     'Todo texto de terceros se sanea antes de entrar en un prompt, con instrucción explícita de tratarlo como dato. Y aunque eso fallara, el envío exige aprobación humana: es la barrera real.'),
]

# Guion de 5 minutos para después de la película: (minuto, título, qué dices, qué enseñas)
GUION = [
    ('0:00', 'Cierre de la película', 'Una frase: «Esto era una historia. Lo que viene es cómo está hecho de verdad.» Pulsa D.', 'El panel de Defensa técnica, pestaña Arquitectura.'),
    ('0:20', 'Arquitectura', 'React 19 + Vite, Express y TypeScript en Railway, Supabase como única fuente de verdad. Cada integración se apaga sola si falta su clave.', 'Pestaña Arquitectura y, si hay tiempo, el mapa del código de la película.'),
    ('1:30', 'Agentes con humano en el circuito', 'Cuatro agentes: Scout, Redactor, Enviador, Lector. Regla de oro: ningún correo sale sin aprobación humana. El envío real tiene un interruptor global y un tope diario.', 'Pestaña Agentes de IA; vuelve a «La IA escribe, tú apruebas».'),
    ('2:30', 'Seguridad con honestidad', 'Aislamiento por banda en la capa de aplicación, con un test en CI que rompe el build. Reconoce el punto débil: RLS abierta. Un tribunal valora más la lucidez que el blindaje.', 'Pestaña Seguridad.'),
    ('3:30', 'Cómo se construyó con IA', 'AGENTS.md es el contrato; tres reglas que no se negocian; más de 400 tests; cero errores nuevos de TypeScript sobre el baseline. La IA programa, tú gobiernas.', 'Pestaña Calidad y método.'),
    ('4:30', 'Negocio y cierre', 'Modelo B2C por planes, los límites se validan en servidor. Cierra con la invitación a Brais: la herramienta ya existe, ahora falta el escenario.', 'Pestaña Negocio y, para cerrar, la escena «La invitación».'),
]
