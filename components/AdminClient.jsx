"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

async function post(url, body) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Fehler");
  return j;
}

export function Login() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(null);
  const router = useRouter();
  return (
    <form className="card" onSubmit={async (e) => { e.preventDefault(); setErr(null); try { await post("/api/admin/login", { password: pw }); router.refresh(); } catch (x) { setErr(x.message); } }}>
      <p className="q">THX-Admin</p>
      <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Passwort" autoFocus />
      {err && <p className="err small">{err}</p>}
      <p><button className="btn" type="submit">Anmelden</button></p>
    </form>
  );
}

export function Logout() {
  const router = useRouter();
  return <button className="btn ghost small" onClick={async () => { await post("/api/admin/logout"); router.refresh(); }}>Abmelden</button>;
}

export function CreateWave() {
  const [org, setOrg] = useState("");
  const [wave, setWave] = useState("");
  const [teams, setTeams] = useState("");
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <form className="card" onSubmit={async (e) => {
      e.preventDefault(); setErr(null); setBusy(true);
      try { const r = await post("/api/admin/create", { org, wave, teams }); router.push(`/admin/w/${r.wave_id}`); }
      catch (x) { setErr(x.message); setBusy(false); }
    }}>
      <p className="q">Neue Runde anlegen</p>
      <div className="row" style={{ alignItems: "stretch" }}>
        <div style={{ flex: 1, minWidth: 220 }}><label className="small muted">Organisation</label><input type="text" value={org} onChange={(e) => setOrg(e.target.value)} placeholder="z. B. AWS Prototyping Workshop" /></div>
        <div style={{ flex: 1, minWidth: 220 }}><label className="small muted">Runde</label><input type="text" value={wave} onChange={(e) => setWave(e.target.value)} placeholder="z. B. Test 18.11.2026" /></div>
      </div>
      <p className="small muted" style={{ marginBottom: 4 }}>Teams, eines pro Zeile, optional mit Kopfzahl: <code>Name;Kopfzahl</code></p>
      <textarea value={teams} onChange={(e) => setTeams(e.target.value)} placeholder={"Workshop-Gruppe;6"} />
      {err && <p className="err small">{err}</p>}
      <p><button className="btn" disabled={busy} type="submit">{busy ? "Lege an …" : "Anlegen"}</button></p>
    </form>
  );
}

export function CopyLink({ url }) {
  const [ok, setOk] = useState(false);
  return (
    <span className="row">
      <code style={{ wordBreak: "break-all" }}>{url}</code>
      <button className="btn ghost small" onClick={async () => { await navigator.clipboard.writeText(url); setOk(true); setTimeout(() => setOk(false), 1500); }}>{ok ? "Kopiert" : "Kopieren"}</button>
    </span>
  );
}

export function WaveActions({ waveId, status }) {
  const router = useRouter();
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);
  async function act(name, url, body) {
    setBusy(name); setErr(null);
    try { await post(url, body); if (name === "delete") router.push("/admin"); else router.refresh(); }
    catch (x) { setErr(x.message); } finally { setBusy(null); }
  }
  return (
    <div>
      <div className="row">
        <button className="btn small" disabled={!!busy} onClick={() => act("cluster", "/api/admin/cluster", { waveId })}>{busy === "cluster" ? "KI gruppiert … (bis 60 s)" : "Kommentare mit KI gruppieren"}</button>
        <button className="btn ghost small" disabled={!!busy} onClick={() => act("status", "/api/admin/status", { waveId, status: status === "open" ? "closed" : "open" })}>{status === "open" ? "Befragung schließen" : "Wieder öffnen"}</button>
        <button className="btn ghost small" disabled={!!busy} onClick={() => { if (confirm("Runde mit allen Antworten endgültig löschen?")) act("delete", "/api/admin/delete", { waveId }); }}>Löschen</button>
      </div>
      {err && <p className="err small">{err}</p>}
    </div>
  );
}
