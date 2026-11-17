import { rpc } from "../../../../lib/db";
import { secretFromRequest } from "../../../../lib/admin";
import { commentsForClustering } from "../../../../lib/analyze";
import { FIELDS } from "../../../../lib/items";

export const maxDuration = 60;

const SYSTEM = `Du bist Organisationspsychologin bei THX und wertest anonyme Freitexte aus einer Mitarbeitendenbefragung (ClarityOS® Check) aus.
Regeln:
- Antworte ausschließlich mit gültigem JSON nach dem vorgegebenen Schema, ohne Erklärtext.
- Schreibe auf Deutsch, klar und sachlich, ohne Gedankenstriche.
- Zitate nur als bereinigte Kurzparaphrase (max. 20 Wörter): keine Namen, keine Funktionsbezeichnungen einzelner Personen, keine Details, die eine Person identifizierbar machen.
- Erfinde nichts. Wenn es zu wenige Kommentare gibt, sag das.`;

function prompt(byField) {
  const blocks = FIELDS.map((f) => {
    const cs = byField[f.key] || [];
    const lines = cs.map((c, i) => `${i + 1}. [${c.band === "high" ? "fühlt sich klar, nennt die Regel" : c.band === "low" ? "sehr unklar" : "teils unklar"}] ${c.text.replace(/\s+/g, " ")}`);
    return `## Feld: ${f.name} (key: ${f.key})\nFrage bei hoher Klarheit: ${f.rule}\n${lines.length ? lines.join("\n") : "(keine Kommentare)"}`;
  }).join("\n\n");
  return `Werte die Kommentare je Feld aus.
Für jedes Feld:
1. themes: 1 bis 4 Themen über alle Kommentare, je mit title (max. 6 Wörter), summary (1 Satz), count (Anzahl Kommentare), quote (bereinigte Kurzparaphrase).
2. regel: Nur für Kommentare mit Kennzeichnung "fühlt sich klar, nennt die Regel". Prüfe, ob diese Personen inhaltlich DIESELBE Regel oder Priorität nennen.
   distinct = Anzahl inhaltlich verschiedener Regeln, consensus = "hoch" | "mittel" | "niedrig" | "keine Daten", rules = Liste der verschiedenen Regeln in je einem kurzen Satz, note = 1 Satz Deutung (z. B. "Drei Personen fühlen sich klar, nennen aber drei verschiedene Prioritäten.").
Schema:
{"fields":[{"key":"...","themes":[{"title":"","summary":"","count":0,"quote":""}],"regel":{"distinct":0,"consensus":"","rules":[""],"note":""}}],"overall":"2 Sätze: die wichtigste Erkenntnis über alle Felder"}

${blocks}`;
}

export async function POST(req) {
  const secret = await secretFromRequest(req);
  if (!secret) return Response.json({ error: "Nicht angemeldet" }, { status: 401 });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return Response.json({ error: "ANTHROPIC_API_KEY ist in Vercel noch nicht eingetragen." }, { status: 400 });
  const { waveId } = await req.json();
  let data;
  try { data = await rpc("admin_wave", { p_secret: secret, p_wave: waveId }); } catch (e) { return Response.json({ error: e.message }, { status: 400 }); }
  const byField = commentsForClustering(data, data.wave.min_n);
  if (!byField) return Response.json({ error: "Zu wenige Antworten für eine anonyme Auswertung." }, { status: 400 });
  const total = Object.values(byField).reduce((a, b) => a + b.length, 0);
  if (total === 0) return Response.json({ error: "Noch keine Kommentare." }, { status: 400 });

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
      max_tokens: 4000,
      system: SYSTEM,
      messages: [{ role: "user", content: prompt(byField) }],
    }),
  });
  const j = await r.json();
  if (!r.ok) return Response.json({ error: j?.error?.message || "KI-Aufruf fehlgeschlagen" }, { status: 400 });
  const text = (j.content || []).map((c) => c.text || "").join("");
  let parsed;
  try { parsed = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)); }
  catch { return Response.json({ error: "KI-Antwort war kein gültiges JSON. Bitte erneut versuchen." }, { status: 400 }); }
  parsed.generated_at = new Date().toISOString();
  parsed.comment_count = total;
  await rpc("admin_save_clusters", { p_secret: secret, p_wave: waveId, p_payload: parsed });
  return Response.json({ ok: true });
}
