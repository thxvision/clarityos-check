"use client";
import { useState } from "react";
import { FIELDS, ITEMS } from "../lib/items";

const FACTS = ITEMS.filter((i) => i.type === "F");

export default function SollForm({ token, info }) {
  const [answers, setAnswers] = useState({});
  const isTeam = info.scope === "team";
  const [label, setLabel] = useState(isTeam ? info.leader || "" : "");
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const complete = FACTS.every((i) => answers[i.id]);

  async function submit() {
    setSending(true); setError(null);
    try {
      const res = await fetch("/api/soll", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, label, answers }) });
      if (!res.ok) throw new Error((await res.json()).error || "Fehler");
      setDone(true); window.scrollTo({ top: 0 });
    } catch (e) { setError(e.message); } finally { setSending(false); }
  }

  if (done) return (<><h1>Soll gespeichert.</h1><p className="lead">Danke. Deine Soll-Antworten sind die Messlatte, an der die Antworten der Teams gemessen werden.</p></>);

  return (
    <>
      <p className="muted small">{info.org} · {info.wave} · {isTeam ? `Soll-Setzung Teamleitung · ${info.area ? info.area + " · " : ""}${info.team}` : "Gesamt-Soll Geschäftsführung"}</p>
      <h1>{isTeam ? `Was soll in ${info.team} gelten?` : "Was soll bei euch gelten?"}</h1>
      <p className="lead">Beantworte jede Frage so, wie es bei euch <strong>gelten soll</strong>, nicht wie es gerade gelebt wird. Jede Führungskraft füllt das einzeln aus, ohne Absprache.</p>
      {isTeam && <p className="small muted">Deine Antworten werden mit dem Gesamt-Soll der Geschäftsführung und mit den Antworten deines Teams verglichen. Erneutes Absenden ersetzt deine bisherigen Antworten.</p>}
      <div className="notice small">Die Soll-Setzung ist keine anonyme Befragung, sondern ein Führungsakt. Einzelne Soll-Antworten sieht nur der Führungskreis. Weichen eure Antworten voneinander ab, ist das der erste Befund.</div>
      <div className="card">
        <p className="q">Kürzel oder Rolle (freiwillig)</p>
        <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder={isTeam ? "Name" : "z. B. GF, COO, Leitung Vertrieb"} maxLength={40} />
      </div>
      {FIELDS.map((f) => {
        const its = FACTS.filter((i) => i.field === f.key);
        if (!its.length) return null;
        return (
          <div key={f.key}>
            <h2>{f.name}</h2>
            {its.map((it) => (
              <div className="card" key={it.id}>
                <p className="q">{it.q}</p>
                <div className="opts">
                  {it.options.filter((o) => !it.nebel.includes(o)).map((o) => (
                    <button type="button" key={o} className={"opt" + (answers[it.id] === o ? " sel" : "")} onClick={() => setAnswers({ ...answers, [it.id]: o })}>{o}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })}
      {error && <p className="err">{error}</p>}
      <button className="btn" disabled={!complete || sending} onClick={submit}>{sending ? "Speichere …" : "Soll speichern"}</button>
      {!complete && <p className="muted small">Noch {FACTS.filter((i) => !answers[i.id]).length} Fragen offen.</p>}
    </>
  );
}
