import { rpc } from "../../../../lib/db";
import { secretFromRequest } from "../../../../lib/admin";

export async function POST(req) {
  const secret = await secretFromRequest(req);
  if (!secret) return Response.json({ error: "Nicht angemeldet" }, { status: 401 });
  const { waveId, status } = await req.json();
  if (!["open", "closed"].includes(status)) return Response.json({ error: "Ungültig" }, { status: 400 });
  try { await rpc("admin_set_status", { p_secret: secret, p_wave: waveId, p_status: status }); return Response.json({ ok: true }); }
  catch (e) { return Response.json({ error: e.message }, { status: 400 }); }
}
