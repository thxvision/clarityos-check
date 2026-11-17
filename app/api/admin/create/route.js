import { rpc } from "../../../../lib/db";
import { secretFromRequest } from "../../../../lib/admin";

export async function POST(req) {
  const secret = await secretFromRequest(req);
  if (!secret) return Response.json({ error: "Nicht angemeldet" }, { status: 401 });
  const { org, wave, teams } = await req.json();
  const list = String(teams || "")
    .split("\n").map((l) => l.trim()).filter(Boolean)
    .map((l) => { const [name, hc] = l.split(";").map((x) => x.trim()); return { name: name.slice(0, 80), headcount: hc && /^\d+$/.test(hc) ? hc : "" }; });
  if (!org || !wave || list.length === 0) return Response.json({ error: "Organisation, Runde und mindestens ein Team angeben" }, { status: 400 });
  try {
    const r = await rpc("admin_create_wave", { p_secret: secret, p_org: String(org).slice(0, 120), p_wave: String(wave).slice(0, 120), p_teams: list });
    return Response.json(r);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 400 });
  }
}
