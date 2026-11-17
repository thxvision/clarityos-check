import { rpc } from "../../../lib/db";
import { ITEMS } from "../../../lib/items";

export async function POST(req) {
  try {
    const { token, label, answers } = await req.json();
    if (typeof token !== "string" || token.length > 64) return Response.json({ error: "Ungültig" }, { status: 400 });
    const a = {};
    for (const it of ITEMS.filter((i) => i.type === "F")) {
      const v = answers?.[it.id];
      if (v && it.options.includes(v) && !it.nebel.includes(v)) a[it.id] = v;
    }
    await rpc("submit_soll", { p_token: token, p_label: String(label || "").slice(0, 40), p_answers: a });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: "Konnte nicht speichern" }, { status: 400 });
  }
}
