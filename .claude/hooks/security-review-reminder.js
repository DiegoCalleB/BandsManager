#!/usr/bin/env node
// PostToolUse hook (Edit|Write|NotebookEdit): recuerda /security-review cuando el archivo
// tocado cae en la superficie que AGENTS.md §2.2 punto 5 marca como disparador (no es un
// checklist universal en cada edit - solo un aviso cuando la superficie es la sensible). No
// bloquea nada: exit 2 solo hace que el mensaje llegue a la conversación como contexto extra.
const SENSITIVE_PATTERNS = [
  /bandAccess/i,
  /ssrfGuard/i,
  /promptSafety/i,
  /\bauth\.ts$/i,
  /gmailOAuth/i,
  /emailAgentClient/i,
  /agentEngine/i,
  /lectorAgent/i,
  /server\/routes\/leads\//i,
  /server\/routes\/billing/i,
  /server\/routes\/donations/i,
  /server\/db\/aiLedger/i,
  /rateLimiter/i
];

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  let filePath = "";
  try {
    const data = JSON.parse(input);
    filePath = data?.tool_input?.file_path || "";
  } catch {
    process.exit(0);
  }

  if (SENSITIVE_PATTERNS.some((re) => re.test(filePath))) {
    console.error(
      `[security-review-reminder] "${filePath}" cae en superficie sensible (band_id/auth/SSRF/emails de agentes/dinero). ` +
      `Antes de mergear, pasa /security-review (AGENTS.md §2.2 punto 5) - no es obligatorio en cada edit, pero sí antes de cerrar el cambio.`
    );
    process.exit(2);
  }
  process.exit(0);
});
