"use client";
import { useState, useMemo } from "react";
import { FIELDS, ITEMS, FOLLOWUP, LIKERT5, itemsByField } from "../lib/items";

function Choice({ item, value, onChange }) {
  if (item.type === "R") {
    return (
      <>
        <div className="scale scale5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button type="button" key={n} className={"opt" + (String(value) === String(n) ? " sel" : "")} onClick={() => onChange(String(n))}>{n}</button>
          ))}
        </div>
        <div className="scale-labels"><span>{LIKERT5[0]}</span><span>{LIKERT5[4]}</span></div>
      </>
    );
  }
  return (
    <div className="opts">
      {item.options.map((o) => (
        <button type="button" key={o} className={"opt" + (value === o ? " sel" : "")} onClick={() => onChange(o)}>{o}</button>
      ))}
    </div>
  );
}

export default function Survey({ token, info }) {
  const [step, setStep] = useState(0); // 0 intro, 1..9 Felder, 10 fertig
  const [answers, setAnswers] = useState({});
  const [felt, setFelt] = useState({});
  const [comments, setComments] = useState({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const field = step >= 1 && step <= FIELDS.length ? FIELDS[step - 1] : null;
  const items = useMemo(() => (field ? itemsByField(field.key) : []), [field]);
  const rating = field ? felt[field.key] : null;
  const band = rating ? (rating <= 2 ? "low" : rating <= 5 ? "mid" : "high") : null;
  const followQ = band === "high" ? field.rule : band ? FOLLOWUP[band] : null;
  const complete = field && rating && items.every((i) => answers[i.id]);

  function scrollTop() { if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" }); }

  async function submit() {
    setSending(true); setError(null);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, answers, felt, comments }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Fehler");
      setStep(FIELDS.length + 1); scrollTop();
    } catch (e) {
      setError("Senden hat nicht geklappt. Bitte nochmal versuchen. (" + e.message + ")");
    } finally { setSending(false); }
  }

  if (step === 0) {
    return (
      <>
        <p className="muted small">{info.org} · {info.wave} · Team {info.team}</p>
        <h1>Wie klar ist, was bei euch gilt?</h1>
        <p className="lead">Neun kurze Abschnitte. Pro Abschnitt sagst du, wie klar sich ein Thema anfühlt, und beantwortest zwei bis vier Fragen dazu, was bei euch tatsächlich gilt.</p>
        <div className="card">
          <p><strong>Anonym.</strong> Wir speichern weder Namen noch E-Mail noch IP-Adresse, nur Team und Antworten. Ergebnisse erscheinen erst ab 5 Antworten pro Gruppe. Niemand sieht deine Einzelantworten.</p>
          <p><strong>Es gibt keine falschen Antworten.</strong> „Weiß ich nicht“ ist eine wertvolle Antwort, keine Schwäche.</p>
          <p className="muted small">Dauer etwa 10 bis 12 Minuten. Freitexte sind freiwillig. Bitte keine Namen in Freitexte schreiben.</p>
        </div>
        <button className="btn" onClick={() => { setStep(1); scrollTop(); }}>Los geht’s</button>
      </>
    );
  }

  if (step === FIELDS.length + 1) {
    return (
      <>
        <h1>Danke.</h1>
        <p className="lead">Deine Antworten sind angekommen. Die Ergebnisse werden gemeinsam besprochen, sobald genug Antworten da sind.</p>
      </>
    );
  }

  return (
    <>
      <div className="spread small muted"><span>{field.name}</span><span>{step} von {FIELDS.length}</span></div>
      <div className="progress"><div style={{ width: `${(step / FIELDS.length) * 100}%` }} /></div>

      <div className="card">
        <p className="q">{field.felt}</p>
        <div className="scale">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button type="button" key={n} className={"opt" + (rating === n ? " sel" : "")} onClick={() => setFelt({ ...felt, [field.key]: n })}>{n}</button>
          ))}
        </div>
        <div className="scale-labels"><span>trifft gar nicht zu</span><span>trifft völlig zu</span></div>
      </div>

      {items.map((it) => (
        <div className="card" key={it.id}>
          <p className="q">{it.q}</p>
          <Choice item={it} value={answers[it.id]} onChange={(v) => setAnswers({ ...answers, [it.id]: v })} />
        </div>
      ))}

      {followQ && (
        <div className="card">
          <p className="q">{followQ}</p>
          <textarea
            value={comments[field.key]?.text || ""}
            onChange={(e) => setComments({ ...comments, [field.key]: { band, text: e.target.value } })}
            placeholder="Freiwillig. Bitte ohne Namen."
            maxLength={1200}
          />
        </div>
      )}

      {error && <p className="err">{error}</p>}
      <div className="spread">
        <button className="btn ghost" onClick={() => { setStep(step - 1); scrollTop(); }}>Zurück</button>
        {step < FIELDS.length ? (
          <button className="btn" disabled={!complete} onClick={() => { setStep(step + 1); scrollTop(); }}>Weiter</button>
        ) : (
          <button className="btn" disabled={!complete || sending} onClick={submit}>{sending ? "Sende …" : "Absenden"}</button>
        )}
      </div>
      {!complete && <p className="muted small">Bitte alle Fragen in diesem Abschnitt beantworten.</p>}
    </>
  );
}
