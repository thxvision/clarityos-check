import { rpc } from "../../../lib/db";
import { ITEMS, FIELDS } from "../../../lib/items";

export async function POST(req) {
  try {
    const { token, answers, felt, comments } = await req.json();
    if (typeof token !== "string" || token.length > 64) return Response.json({ error: "Ungültig" }, { status: 400 });
    // Nur bekannte Items und erlaubte Werte speichern
    const a = {};
    for (const it of ITEMS) {
      const v = answers?.[it.id];
      if (v == null) continue;
      if (it.type === "R" ? ["1", "2", "3", "4", "5"].includes(String(v)) : it.options.includes(v)) a[it.id] = String(v);
    }
    const f = {};
    for (const fl of FIELDS) {
      const v = Number(felt?.[fl.key]);
      if (v >= 1 && v <= 7) f[fl.key] = v;
    }
    const c = {};
    for (const fl of FIELDS) {
      const x = comments?.[fl.key];
      if (x && typeof x.text === "string" && x.text.trim()) c[fl.key] = { band: ["low", "mid", "high"].includes(x.band) ? x.band : "mid", text: x.text.trim().slice(0, 1200) };
    }
    if (Object.keys(a).length < ITEMS.length || Object.keys(f).length < FIELDS.length) return Response.json({ error: "Unvollständig" }, { status: 400 });
    await rpc("submit_response", { p_token: token, p_answers: a, p_felt: f, p_comments: c });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message === "closed" ? "Befragung geschlossen" : "Konnte nicht speichern" }, { status: 400 });
  }
}
