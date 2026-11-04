// Consulta depósitos concluídos no backoffice e manda push "Venda aprovada!" para os celulares inscritos.
import fs from "fs";
import webpush from "web-push";

const env = process.env;
const BASE = (env.BACKOFFICE_API_URL || "").replace(/\/$/, "");
const STATE = "state/seen.json";
const need = ["BACKOFFICE_API_URL", "BACKOFFICE_TOKEN", "VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY"];
for (const k of need) if (!env[k]) { console.error(`Falta o secret ${k}`); process.exit(1); }

webpush.setVapidDetails(env.VAPID_SUBJECT || "mailto:admin@example.com", env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);

const subs = Object.keys(env).filter((k) => /^PUSH_SUB_\d+$/.test(k) && env[k].trim())
  .map((k) => { try { return { k, sub: JSON.parse(env[k]) }; } catch { console.error(`${k} inválido`); return null; } })
  .filter(Boolean);

const money = (v, code = "BRL") => {
  try { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: code }).format(Number(v) || 0); }
  catch { return `${code} ${v}`; }
};

async function deposits() {
  const qs = new URLSearchParams({ type: "DEPOSIT", status: "COMPLETED", limit: "50", page: "1" });
  const res = await fetch(`${BASE}/admin/transactions?${qs}`, {
    headers: { accept: "application/json", [env.BACKOFFICE_AUTH_HEADER || "Authorization"]: env.BACKOFFICE_TOKEN },
  });
  if (!res.ok) throw new Error(`Backoffice respondeu ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()).data || [];
}

async function push(payload) {
  for (const { k, sub } of subs) {
    try { await webpush.sendNotification(sub, JSON.stringify(payload), { TTL: 3600, urgency: "high" }); }
    catch (e) { console.error(`Falha ao enviar para ${k}: ${e.statusCode || ""} ${e.body || e.message}`); }
  }
}

const mode = env.MODE || "check";
if (mode === "test") {
  await push({ title: env.NOTIFY_TITLE || "Venda aprovada!", body: "Valor: R$ 50,00 (teste)" });
  console.log(`Teste enviado para ${subs.length} aparelho(s)`);
  process.exit(0);
}

const list = await deposits();
let seen = null;
try { seen = JSON.parse(fs.readFileSync(STATE, "utf8")); } catch {}

if (!Array.isArray(seen)) {
  // primeira execução: só marca o que já existe, sem notificar depósitos antigos
  fs.mkdirSync("state", { recursive: true });
  fs.writeFileSync(STATE, JSON.stringify(list.map((t) => t.id)));
  console.log(`Primeira execução: ${list.length} depósitos marcados como vistos.`);
  process.exit(0);
}

const seenSet = new Set(seen);
const fresh = list.filter((t) => !seenSet.has(t.id)).reverse(); // mais antigo primeiro
const title = env.NOTIFY_TITLE || "Venda aprovada!";
const body = env.NOTIFY_BODY || "Valor: {valor}";
for (const t of fresh) {
  await push({ title, body: body.replace("{valor}", money(t.amount, t.currency?.code)), tag: t.id });
}
const next = [...fresh.map((t) => t.id), ...seen].slice(0, 1000);
fs.writeFileSync(STATE, JSON.stringify(next));
console.log(`${fresh.length} depósito(s) novo(s), ${subs.length} aparelho(s).`);
