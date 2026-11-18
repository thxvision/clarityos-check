import { rpc } from "../../../../lib/db";
import { secretFromRequest } from "../../../../lib/admin";
import { checkStructure, parseRows } from "../../../../lib/structure";

const cut = (x, n) => String(x || "").trim().slice(0, n);

export async function POST(req) {
  const secret = await secretFromRequest(req);
  if (!secret) return Response.json({ error: "Nicht angemeldet" }, { status: 401 });
  const { org, wave, rows, teams } = await req.json();
  // rows: [{ area, name, leader, headcount }]; teams (Text) bleibt als Altformat erlaubt
  const input = Array.isArray(rows) ? rows : parseRows(teams);
  const list = input
    .filter((r) => cut(r?.name, 80))
    .slice(0, 300)
    .map((r) => ({
      area: cut(r.area, 80),
      name: cut(r.name, 80),
      leader: cut(r.leader, 80),
      headcount: /^\d+$/.test(String(r.headcount || "").trim()) ? String(Number(r.headcount)) : "",
    }));
  if (!cut(org, 120) || !cut(wave, 120) || list.length === 0) return Response.json({ error: "Organisation, Runde und mindestens ein Team angeben" }, { status: 400 });
  const check = checkStructure(list);
  if (check.blocking) return Response.json({ error: check.issues.filter((i) => i.kind === "error").map((i) => i.text).join(" ") }, { status: 400 });
  try {
    const r = await rpc("admin_create_wave", { p_secret: secret, p_org: cut(org, 120), p_wave: cut(wave, 120), p_teams: list });
    return Response.json(r);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 400 });
  }
}
