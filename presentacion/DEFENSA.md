# Defensa técnica · guion de 5 minutos

Para después de la película. Pulsa **D** en la presentación para abrir el panel de apoyo (pestañas por tema y preguntas del tribunal). Todo sale de `AGENTS.md`; si algo cambia allí, se cambia en `tools/guion/defensa.py` y se regenera.

## Guion

**0:00 · Cierre de la película**
- Dices: Una frase: «Esto era una historia. Lo que viene es cómo está hecho de verdad.» Pulsa D.
- Enseñas: El panel de Defensa técnica, pestaña Arquitectura.

**0:20 · Arquitectura**
- Dices: React 19 + Vite, Express y TypeScript en Railway, Supabase como única fuente de verdad. Cada integración se apaga sola si falta su clave.
- Enseñas: Pestaña Arquitectura y, si hay tiempo, el mapa del código de la película.

**1:30 · Agentes con humano en el circuito**
- Dices: Cuatro agentes: Scout, Redactor, Enviador, Lector. Regla de oro: ningún correo sale sin aprobación humana. El envío real tiene un interruptor global y un tope diario.
- Enseñas: Pestaña Agentes de IA; vuelve a «La IA escribe, tú apruebas».

**2:30 · Seguridad con honestidad**
- Dices: Aislamiento por banda en la capa de aplicación, con un test en CI que rompe el build. Reconoce el punto débil: RLS abierta. Un tribunal valora más la lucidez que el blindaje.
- Enseñas: Pestaña Seguridad.

**3:30 · Cómo se construyó con IA**
- Dices: AGENTS.md es el contrato; tres reglas que no se negocian; más de 400 tests; cero errores nuevos de TypeScript sobre el baseline. La IA programa, tú gobiernas.
- Enseñas: Pestaña Calidad y método.

**4:30 · Negocio y cierre**
- Dices: Modelo B2C por planes, los límites se validan en servidor. Cierra con la invitación a Brais: la herramienta ya existe, ahora falta el escenario.
- Enseñas: Pestaña Negocio y, para cerrar, la escena «La invitación».

## Preguntas probables del tribunal

**¿Qué pones tú y qué pone la IA?**

La IA escribe gran parte del código, pero dentro de un contrato: AGENTS.md define las reglas, los tests las vigilan y yo reviso cada cambio. Lo mío es el diseño, el criterio y decidir qué no se hace. Y en el producto es igual: la IA propone, el humano aprueba.

**¿Es seguro? Hay datos de varias bandas en la misma base.**

El aislamiento por banda se aplica en la capa de aplicación con `getTargetBandId` y lo vigila un test estático en CI. Y te digo lo que falta: las políticas RLS de Supabase están abiertas, así que si hubiera un fallo en la aplicación no habría una segunda barrera. Endurecerlas es lo siguiente que haría.

**¿Escala?**

Hoy el backend es un único proceso Express con estado en memoria sincronizado con Supabase, perfecto para el volumen de un TFM y las primeras bandas. Para escalar horizontalmente habría que sacar ese estado a la base de datos o a una caché compartida y mover los agentes a una cola. Lo sé y está identificado.

**¿Qué riesgos legales tiene?**

Los tengo auditados en AGENTS.md: la descarga de vídeos sin verificar titularidad, contraseñas de correo sin cifrar en reposo, falta de enlace de baja en los correos comerciales y la base de legitimación RGPD. No bloquean el TFM, pero sí pasar a producción con usuarios reales, y hay mitigación definida para cada uno.

**¿Cómo sabes que funciona?**

Más de 400 ficheros de test, `tsc` en el build, e2e con Playwright y tests visuales, más una auditoría de contrato entre el código y el esquema de base de datos. Cada fallo imprevisto va a Sentry.

**¿Y si la IA se equivoca o alguien le inyecta un prompt?**

Todo texto de terceros se sanea antes de entrar en un prompt, con instrucción explícita de tratarlo como dato. Y aunque eso fallara, el envío exige aprobación humana: es la barrera real.

## Una idea por tema

- **Arquitectura** · Frontend: React 19 + Vite + Tailwind CSS v4. PWA instalable. Una sola aplicación, por módulos (booking, repertorio, finanzas, EPK…).
- **Seguridad** · Aislamiento por banda: Todo dato de banda se resuelve con `getTargetBandId(req)`. Prohibido leer `band_id` del cuerpo. Un test estático en CI rompe el build si vuelve el patrón peligroso.
- **Agentes de IA** · Humano en el circuito: Ningún correo sale sin aprobación humana explícita. El estado pasa por `pendiente_aprobacion` → `aprobado_*` y solo entonces se envía o se deja borrador.
- **Calidad y método** · Contrato para la IA: AGENTS.md es el contrato que leen Claude Code y Gemini antes de tocar nada: tres reglas no negociables y el resto por subsistema.
- **Negocio** · Modelo: B2C para bandas y músicos, por planes: de Promo (250 fans, sin booking) a Cabeza de Cartel (5 bandas, 2.500 créditos de IA al mes).
