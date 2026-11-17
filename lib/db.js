// Serverseitiger Zugriff auf Supabase. Nur RPC-Funktionen, keine direkten Tabellenzugriffe.
// Der Schlüssel bleibt auf dem Server (keine NEXT_PUBLIC-Variable).
const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_ANON_KEY;

export async function rpc(fn, args) {
  if (!URL || !KEY) throw new Error("Supabase ist nicht konfiguriert");
  const res = await fetch(`${URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(args || {}),
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try { msg = JSON.parse(text).message || text; } catch {}
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return text ? JSON.parse(text) : null;
}

export const ADMIN_COOKIE = "cos_admin";
