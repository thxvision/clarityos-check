// Keep-alive: Vercel Cron ruft diese Route täglich auf, damit Supabase (Free Tier)
// das Projekt nicht nach 7 Tagen Inaktivität pausiert. Harmlose Lese-Abfrage.
import { rpc } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }
  try {
    await rpc("get_lead", { p_token: "keepalive" });
    return Response.json({ ok: true, at: new Date().toISOString() });
  } catch (e) {
    // Auch ein Fehler der Funktion bedeutet: Die Datenbank wurde erreicht.
    return Response.json({ ok: !!e.status, status: e.status || null, at: new Date().toISOString() });
  }
}
