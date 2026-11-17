import { rpc } from "../../../../lib/db";
import { secretFromRequest } from "../../../../lib/admin";

export async function POST(req) {
  const secret = await secretFromRequest(req);
  if (!secret) return Response.json({ error: "Nicht angemeldet" }, { status: 401 });
  const { waveId } = await req.json();
  try { await rpc("admin_delete_wave", { p_secret: secret, p_wave: waveId }); return Response.json({ ok: true }); }
  catch (e) { return Response.json({ error: e.message }, { status: 400 }); }
}
