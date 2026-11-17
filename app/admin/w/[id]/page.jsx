import { headers } from "next/headers";
import { rpc } from "../../../../lib/db";
import { getSecret } from "../../../../lib/admin";
import { analyzeWave, STATUS } from "../../../../lib/analyze";
import { FIELDS, ITEMS } from "../../../../lib/items";
import { Login, CopyLink, WaveActions } from "../../../../components/AdminClient";

export const dynamic = "force-dynamic";

const pct = (x) => (x == null ? "–" : `${Math.round(x * 100)} %`);

function Tag({ s }) {
  if (!s) return <span className="tag grey">offen</span>;
  return <span className={`tag ${STATUS[s].tone}`}>{STATUS[s].label}</span>;
}

function Dist({ item, res }) {
  const def = ITEMS.find((i) => i.id === item.id);
  const n = item.n || 1;
  const opts = def.type === "R" ? ["1", "2", "3", "4", "5"] : def.options;
  return (
    <table>
      <tbody>
        {opts.map((o) => {
          const c = item.dist?.[o] || 0;
          const isSoll = item.soll === o;
          const isNebel = def.nebel?.includes(o) || def.bad?.includes(o);
          const color = isSoll ? "var(--green)" : isNebel ? "var(--red)" : "#9a9a9a";
          return (
            <tr key={o}>
              <td style={{ width: "42%" }} className="small">{o}{isSoll ? " · Soll" : ""}</td>
              <td><div className="bar" style={{ height: 14 }}><span style={{ width: `${(c / n) * 100}%`, background: color }} /></div></td>
              <td className="small" style={{ width: 60, textAlign: "right" }}>{Math.round((c / n) * 100)} %</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function explain(item) {
  switch (item.status) {
    case "fuehrung": return `Die Führung hat unterschiedliche Soll-Antworten gegeben. Bevor Teams etwas wissen können, muss die Führung sich einigen.`;
    case "nebel": return `${pct(item.nebelShare)} geben keine Regel an. Hier fehlt die Regel oder sie ist unbekannt.`;
    case "andere": return `Das Team ist sich weitgehend einig (${pct(item.konsens)} sagen „${item.mode}“), aber nicht mit dem Soll („${item.soll}“).`;
    case "uneinig": return item.soll ? `Nur ${pct(item.kongruenz)} geben die Soll-Antwort. Es gibt keine gemeinsame Antwort.` : `Es gibt keine gemeinsame Antwort, und noch kein Soll.`;
    case "reibung": return item.type === "R" ? `Mittelwert ${item.mean?.toFixed(1)} von 5.` : `${pct(item.bad)} berichten Reibung.`;
    case "einig": return `Einig auf „${item.mode}“ (${pct(item.konsens)}), aber es fehlt ein Soll zum Vergleich.`;
    default: return item.soll ? `${pct(item.kongruenz)} geben die Soll-Antwort.` : "";
  }
}

export default async function WavePage({ params }) {
  const { id } = await params;
  const secret = await getSecret();
  if (!secret) return (<><h1>Admin</h1><Login /></>);
  let data = null;
  try { data = await rpc("admin_wave", { p_secret: secret, p_wave: id }); } catch {}
  if (!data) return (<><h1>Nicht gefunden</h1><p><a href="/admin">Zurück</a></p></>);

  const h = await headers();
  const base = `https://${h.get("host")}`;
  const r = analyzeWave(data);
  const cl = data.clusters;
  const clByField = Object.fromEntries((cl?.fields || []).map((f) => [f.key, f]));
  const perTeam = Object.fromEntries((data.teams || []).map((t) => [t.id, (data.responses || []).filter((x) => x.team_id === t.id).length]));

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <p className="small"><a href="/admin">← Alle Runden</a></p>
      <div className="spread"><div><p className="muted small" style={{ margin: 0 }}>{data.wave.org}</p><h1 style={{ marginTop: 0 }}>{data.wave.name}</h1></div><WaveActions waveId={id} status={data.wave.status} /></div>

      <details className="card">
        <summary>Links zum Verteilen</summary>
        <h3>Soll-Setzung Führung (jede Führungskraft einzeln)</h3>
        <CopyLink url={`${base}/f/${data.wave.lead_token}`} />
        <h3>Teams</h3>
        {data.teams.map((t) => (<div key={t.id} style={{ marginBottom: 10 }}><div className="small"><strong>{t.name}</strong>{t.headcount ? ` · ${t.headcount} Personen` : ""} · {perTeam[t.id]} Antworten</div><CopyLink url={`${base}/t/${t.token}`} /></div>))}
      </details>

      <div className="kpis">
        <div className="kpi"><div className="v">{r.n}</div><div className="l">Antworten (Ergebnisse ab {r.minN})</div></div>
        <div className="kpi"><div className="v">{r.leaders}</div><div className="l">Soll-Setzungen der Führung</div></div>
      </div>

      {!r.org && (
        <div className="notice">Noch zu wenige Antworten für eine anonyme Auswertung: {r.n} von mindestens {r.minN}. Es werden keine Ergebnisse angezeigt.</div>
      )}

      {r.org && (
        <>
          {r.leaders === 0 && <div className="notice">Noch keine Soll-Setzung der Führung. Ohne Soll kann das Instrument nur Einigkeit messen, nicht Übereinstimmung mit dem, was gelten soll.</div>}
          <h2>Auf einen Blick</h2>
          <div className="kpis">
            <div className="kpi"><div className="v">{pct(r.org.klarheitsquote)}</div><div className="l">Klarheitsquote: Anteil der Regeln, bei denen mind. 70 % die Soll-Antwort geben ({r.org.klarCount} von {r.org.sollCount})</div></div>
            <div className="kpi"><div className="v">{r.org.gefuehlt ?? "–"}</div><div className="l">Gefühlte Klarheit (0 bis 100), Mittel über 9 Felder</div></div>
            <div className="kpi"><div className="v">{pct(r.org.scheinklarheit)}</div><div className="l">Scheinklarheit: fühlen sich klar (5 bis 7), weichen aber vom Soll ab oder wählen „weiß nicht“</div></div>
            <div className="kpi"><div className="v">{r.bruchstellen.length}</div><div className="l">Bruchstellen von {ITEMS.length} Fragen</div></div>
          </div>
          {cl?.overall && <div className="notice"><strong>KI-Lesart der Kommentare:</strong> {cl.overall}</div>}

          <h2>Die 9 Felder</h2>
          <div className="fields">
            {r.org.fields.map((f) => (
              <div className="fieldbox" key={f.key}>
                <div className="spread"><strong>{f.name}</strong><Tag s={f.status} /></div>
                <div className="small muted" style={{ marginTop: 6 }}>Gefühlt: {f.feltIndex ?? "–"} / 100 · Scheinklarheit: {pct(f.scheinShare)}</div>
              </div>
            ))}
          </div>

          <h2>Bruchstellen</h2>
          {r.bruchstellen.length === 0 && <p>Keine Bruchstellen.</p>}
          {r.bruchstellen.map((it) => (
            <div className="card" key={it.id}>
              <div className="spread"><span className="small muted">{FIELDS.find((f) => f.key === it.field).name} · {it.id}</span><Tag s={it.status} /></div>
              <p className="q" style={{ marginTop: 8 }}>{it.q}</p>
              <p className="small">{explain(it)}</p>
              <Dist item={it} />
              {it.status === "fuehrung" && it.sollInfo && (
                <p className="small muted">Soll-Antworten der Führung: {Object.entries(it.sollInfo.dist).filter(([, c]) => c > 0).map(([o, c]) => `${o} (${c})`).join(" · ")}</p>
              )}
            </div>
          ))}

          {r.teams.length > 0 && (
            <>
              <h2>Teams im Vergleich</h2>
              <div className="card" style={{ overflowX: "auto" }}>
                <table>
                  <thead><tr><th>Frage</th>{r.teams.map((t) => <th key={t.id}>{t.name} (n={t.n})</th>)}</tr></thead>
                  <tbody>
                    {ITEMS.map((i) => (
                      <tr key={i.id}><td className="small">{i.id} · {i.q.slice(0, 70)}{i.q.length > 70 ? "…" : ""}</td>{r.teams.map((t) => <td key={t.id}><Tag s={t.items[i.id].status} /></td>)}</tr>
                    ))}
                    <tr><td><strong>Klarheitsquote</strong></td>{r.teams.map((t) => <td key={t.id}><strong>{pct(t.klarheitsquote)}</strong></td>)}</tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
          {r.hidden.length > 0 && <p className="small muted">Nicht einzeln ausgewiesen (unter {r.minN} Antworten oder Schutz gegen Herausrechnen): {r.hidden.join(", ")}. Diese Antworten zählen im Gesamtbild.</p>}

          <h2>Alle Felder im Detail</h2>
          {r.org.fields.map((f) => {
            const c = clByField[f.key];
            return (
              <details className="card" key={f.key}>
                <summary><span className="spread" style={{ display: "inline-flex", width: "95%" }}><span>{f.name}</span><Tag s={f.status} /></span></summary>
                <p className="small muted">Gefühlte Klarheit {f.felt?.toFixed(1)} von 7 · {f.feltClear} fühlen sich klar, davon {f.schein} mit Abweichung bei den Faktfragen</p>
                {c && (
                  <div className="notice small">
                    {c.regel && c.regel.consensus !== "keine Daten" && (<p><strong>Regel-Check der „Klaren“:</strong> {c.regel.note} {c.regel.rules?.length ? `(${c.regel.rules.join(" · ")})` : ""}</p>)}
                    {(c.themes || []).map((t, k) => (<div key={k}><strong>{t.title}</strong> ({t.count}): {t.summary}{t.quote ? <div className="quote">„{t.quote}“</div> : null}</div>))}
                  </div>
                )}
                {f.items.map((it) => (
                  <div key={it.id} style={{ marginTop: 14 }}>
                    <div className="spread"><span className="q" style={{ margin: 0 }}>{it.id} · {it.q}</span><Tag s={it.status} /></div>
                    <p className="small">{explain(it)}</p>
                    <Dist item={it} />
                  </div>
                ))}
              </details>
            );
          })}

          <details className="card">
            <summary>Rohkommentare (nur THX, nicht an Kunden weitergeben)</summary>
            {FIELDS.map((f) => {
              const cs = (data.responses || []).map((x) => x.comments?.[f.key]).filter((c) => c && c.text);
              if (!cs.length) return null;
              return (<div key={f.key}><h3>{f.name}</h3>{cs.map((c, k) => <div className="quote small" key={k}>[{c.band}] {c.text}</div>)}</div>);
            })}
          </details>
          <p className="small muted">Schwellen (Annahmen, nach den ersten Kunden zu kalibrieren): Nicht geregelt ab 33 % Nebel · Uneinig unter 40 % Konsens · Klar ab 70 % Soll · Führung uneinig unter 50 % · Reibung ab 30 %.</p>
        </>
      )}
    </div>
  );
}
