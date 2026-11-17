import { rpc, ADMIN_COOKIE } from "../../../../lib/db";

export async function POST(req) {
  const { password } = await req.json().catch(() => ({}));
  if (!password || typeof password !== "string") return Response.json({ error: "Passwort fehlt" }, { status: 400 });
  try {
    await rpc("admin_list", { p_secret: password });
  } catch {
    await new Promise((r) => setTimeout(r, 800));
    return Response.json({ error: "Passwort falsch" }, { status: 401 });
  }
  const res = Response.json({ ok: true });
  res.headers.append("Set-Cookie", `${ADMIN_COOKIE}=${encodeURIComponent(password)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=43200`);
  return res;
}
