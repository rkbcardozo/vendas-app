// Recebe o aviso de depósito do backoffice (via webhook -> repository_dispatch)
// e manda push "Venda aprovada!" para os celulares inscritos.
import webpush from "web-push";

const env = process.env;
for (const k of ["VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY"]) if (!env[k]) { console.error(`Falta o secret ${k}`); process.exit(1); }
webpush.setVapidDetails(env.VAPID_SUBJECT || "mailto:admin@example.com", env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);

const subs = Object.keys(env).filter((k) => /^PUSH_SUB_\d+$/.test(k) && env[k].trim())
  .map((k) => { try { return { k, sub: JSON.parse(env[k]) }; } catch { console.error(`${k} inválido`); return null; } })
  .filter(Boolean);
if (!subs.length) { console.error("Nenhum celular cadastrado (PUSH_SUB_1...)"); process.exit(1); }

const money = (v, code) => {
  try { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: code || "BRL" }).format(Number(v) || 0); }
  catch { return `${code} ${v}`; }
};

const test = env.MODE === "test";
const valor = test ? money(50, "BRL") + " (teste)" : money(env.AMOUNT, env.CURRENCY);
const payload = {
  title: env.NOTIFY_TITLE || "Venda aprovada!",
  body: (env.NOTIFY_BODY || "Valor: {valor}").replace("{valor}", valor),
};

let ok = 0;
for (const { k, sub } of subs) {
  try { await webpush.sendNotification(sub, JSON.stringify(payload), { TTL: 3600, urgency: "high" }); ok++; }
  catch (e) { console.error(`Falha ao enviar para ${k}: ${e.statusCode || ""} ${e.body || e.message}`); }
}
console.log(`${payload.title} — ${payload.body} → ${ok}/${subs.length} aparelho(s)`);
if (!ok) process.exit(1);
