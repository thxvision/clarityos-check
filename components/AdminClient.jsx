"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { checkStructure, parseRows } from "../lib/structure";

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

const EMPTY = () => ({ area: "", name: "", leader: "", headcount: "" });

export function CreateWave() {
  const [org, setOrg] = useState("");
  const [wave, setWave] = useState("");
  const [rows, setRows] = useState([EMPTY(), EMPTY(), EMPTY()]);
  const [paste, setPaste] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [ack, setAck] = useState(false);
  const router = useRouter();
  const check = checkStructure(rows);
  const warns = check.issues.filter((i) => i.kind === "warn");
  const set = (i, k, v) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const clean = rows.filter((r) => r.name.trim());
  const idxMap = rows.map((r, i) => (r.name.trim() ? i : -1)).filter((i) => i >= 0);

  function merge(m) {
    const a = rows[idxMap[m.from]], b = rows[idxMap[m.into]];
    const leader = [b.leader, a.leader].map((x) => x.trim()).filter(Boolean).join(" und ");
    const merged = { area: b.area, name: `${b.name.trim()} und ${a.name.trim()}`, leader, headcount: String((Number(a.headcount) || 0) + (Number(b.headcount) || 0)) };
    setRows(rows.map((r, j) => (j === idxMap[m.into] ? merged : r)).filter((_, j) => j !== idxMap[m.from]));
    setAck(false);
  }

  return (
    <form className="card" onSubmit={async (e) => {
      e.preventDefault(); setErr(null);
      if (warns.length && !ack) { setErr("Bitte die Hinweise zur Mindestgruppe bestätigen oder Teams zusammenlegen."); return; }
      setBusy(true);
      try { const r = await post("/api/admin/create", { org, wave, rows: clean }); router.push(`/admin/w/${r.wave_id}`); }
      catch (x) { setErr(x.message); setBusy(false); }
    }}>
      <p className="q">Neue Runde anlegen</p>
      <div className="row" style={{ alignItems: "stretch" }}>
        <div style={{ flex: 1, minWidth: 220 }}><label className="small muted">Organisation</label><input type="text" value={org} onChange={(e) => setOrg(e.target.value)} placeholder="z. B. Seewerk GmbH" /></div>
        <div style={{ flex: 1, minWidth: 220 }}><label className="small muted">Runde</label><input type="text" value={wave} onChange={(e) => setWave(e.target.value)} placeholder="z. B. Welle 1 · Nov 2026" /></div>
      </div>

      <p className="small muted" style={{ margin: "18px 0 6px" }}>Struktur. Jedes Team bekommt einen anonymen Team-Link und einen Soll-Link für seine Führungskraft. Die Geschäftsführung setzt das Gesamt-Soll über einen eigenen Link.</p>
      <div style={{ overflowX: "auto" }}>
        <table className="struct">
          <thead><tr><th>Bereich</th><th>Team</th><th>Führungskraft</th><th style={{ width: 90 }}>Kopfzahl</th><th style={{ width: 36 }}></th></tr></thead>
          <tbody>
            {rows.map((r, i) => {
              const small = r.name.trim() && r.headcount && Number(r.headcount) < 5;
              return (
                <tr key={i} className={small ? "warnrow" : ""}>
                  <td><input type="text" value={r.area} onChange={(e) => set(i, "area", e.target.value)} placeholder="Vertrieb" list="areas" /></td>
                  <td><input type="text" value={r.name} onChange={(e) => set(i, "name", e.target.value)} placeholder="Innendienst" /></td>
                  <td><input type="text" value={r.leader} onChange={(e) => set(i, "leader", e.target.value)} placeholder="Maria Kern" /></td>
                  <td><input type="number" min="0" value={r.headcount} onChange={(e) => set(i, "headcount", e.target.value.replace(/\D/g, ""))} placeholder="9" /></td>
                  <td><button type="button" className="x" aria-label="Zeile entfernen" onClick={() => setRows(rows.length > 1 ? rows.filter((_, j) => j !== i) : [EMPTY()])}>×</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <datalist id="areas">{[...new Set(rows.map((r) => r.area.trim()).filter(Boolean))].map((a) => <option key={a} value={a} />)}</datalist>
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <button type="button" className="btn ghost small" onClick={() => setRows([...rows, { ...EMPTY(), area: rows[rows.length - 1]?.area || "" }])}>Zeile hinzufügen</button>
        <button type="button" className="btn ghost small" onClick={() => setPaste(paste == null ? "" : null)}>Aus Excel einfügen</button>
      </div>
      {paste != null && (
        <div style={{ marginTop: 10 }}>
          <p className="small muted" style={{ margin: "0 0 4px" }}>Spalten aus Excel kopieren und hier einfügen: Bereich, Team, Führungskraft, Kopfzahl. Ersetzt die Tabelle.</p>
          <textarea value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={"Vertrieb\tInnendienst\tMaria Kern\t9\nVertrieb\tAußendienst\tJonas Berg\t7"} />
          <p><button type="button" className="btn small" onClick={() => { const p = parseRows(paste); if (p.length) { setRows(p); setPaste(null); setAck(false); } }}>Übernehmen</button></p>
        </div>
      )}

      {clean.length > 0 && (
        <div className="check">
          <p className="small" style={{ margin: 0 }}><strong>Prüfung:</strong> {check.summary.teams} Teams{check.summary.areas >= 2 ? ` in ${check.summary.areas} Bereichen` : ""}, davon {check.summary.visibleTeams} einzeln sichtbar{check.summary.areas >= 2 ? `, ${check.summary.visibleAreas} Bereiche sichtbar` : ""}, bei vollem Rücklauf · {check.summary.leaders + 1} Soll-Links</p>
          {check.issues.map((it, k) => (
            <p key={k} className={"small issue " + it.kind}>{it.text}{it.merge && <> <button type="button" className="linkbtn" onClick={() => merge(it.merge)}>{it.merge.label}</button></>}</p>
          ))}
          {warns.length > 0 && (
            <label className="small" style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
              <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} /> Verstanden, trotzdem so anlegen
            </label>
          )}
        </div>
      )}
      {err && <p className="err small">{err}</p>}
      <p><button className="btn" disabled={busy || check.blocking} type="submit">{busy ? "Lege an …" : "Anlegen"}</button></p>
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
