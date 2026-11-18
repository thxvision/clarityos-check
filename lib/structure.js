// Struktur-Logik: Bereiche, Teams, Sichtbarkeit (Mindestgruppe + Schutz gegen Herausrechnen).
// Wird im Admin-Formular (Vorschau mit Kopfzahl) und in der Auswertung (echte Antworten) genutzt.

export const NO_AREA = "";

// units: [{ key, size }]. Gibt die Menge der sichtbaren keys zurück.
// Regel 1: sichtbar nur ab minN.
// Regel 2: Ist genau eine Einheit mit Daten verborgen und mindestens eine sichtbar, ließe sie
// sich aus Summe minus Rest berechnen. Dann wird zusätzlich die kleinste sichtbare verborgen.
export function protect(units, minN) {
  let visible = units.filter((u) => u.size >= minN);
  const hidden = units.filter((u) => u.size > 0 && u.size < minN);
  if (hidden.length === 1 && visible.length >= 1) {
    const smallest = [...visible].sort((a, b) => a.size - b.size)[0];
    visible = visible.filter((u) => u !== smallest);
  }
  return new Set(visible.map((u) => u.key));
}

// teams: [{ key, area, size }]. Liefert sichtbare Teams und Bereiche.
// Teams werden erst je Bereich geschützt, dann über alle Teams; Bereiche über alle Bereiche.
export function visibility(teams, minN) {
  const withData = teams.filter((t) => t.size > 0);
  const areas = groupAreas(withData);
  let visibleTeams = new Set();
  for (const list of Object.values(areas)) {
    const v = protect(list.map((t) => ({ key: t.key, size: t.size })), minN);
    v.forEach((k) => visibleTeams.add(k));
  }
  // globale Runde: alle nicht sichtbaren Teams gelten als verborgen
  const units = withData.map((t) => ({ key: t.key, size: visibleTeams.has(t.key) ? t.size : Math.min(t.size, minN - 1) }));
  const global = protect(units, minN);
  visibleTeams = new Set([...visibleTeams].filter((k) => global.has(k)));
  // Nur ein Team mit Daten: identisch mit Gesamt, keine eigene Anzeige
  if (withData.length <= 1) visibleTeams = new Set();

  const areaNames = Object.keys(areas).filter((a) => a !== NO_AREA);
  let visibleAreas = new Set();
  if (areaNames.length >= 2) {
    const aunits = Object.entries(areas).map(([a, list]) => ({ key: a, size: list.reduce((s, t) => s + t.size, 0) }));
    visibleAreas = protect(aunits, minN);
    visibleAreas.delete(NO_AREA);
  }
  return { visibleTeams, visibleAreas, areaNames };
}

export function groupAreas(teams) {
  const out = {};
  for (const t of teams) {
    const a = (t.area || "").trim();
    (out[a] = out[a] || []).push(t);
  }
  return out;
}

// Prüfung der Struktur vor dem Anlegen (Kopfzahl als Annahme für vollen Rücklauf)
export function checkStructure(rows, minN = 5) {
  const issues = [];
  const clean = rows.filter((r) => (r.name || "").trim());
  const names = new Map();
  for (const r of clean) {
    const k = r.name.trim().toLowerCase();
    if (names.has(k)) issues.push({ kind: "error", text: `Team „${r.name.trim()}“ kommt doppelt vor.` });
    names.set(k, true);
  }
  const units = clean.map((r, i) => ({ key: String(i), area: r.area, size: Number(r.headcount) || 0, row: r }));
  const missing = units.filter((u) => !u.size);
  if (missing.length) issues.push({ kind: "info", text: `Ohne Kopfzahl: ${missing.map((u) => u.row.name.trim()).join(", ")}. Für diese Teams ist keine Prüfung möglich.` });
  const noLeader = clean.filter((r) => !(r.leader || "").trim());
  if (noLeader.length) issues.push({ kind: "info", text: `Ohne Führungskraft: ${noLeader.map((r) => r.name.trim()).join(", ")}. Diese Teams werden nur am Gesamt-Soll gemessen.` });

  const known = units.filter((u) => u.size > 0);
  const { visibleTeams, visibleAreas, areaNames } = visibility(known, minN);
  const merges = [];
  for (const u of known) {
    if (u.size >= minN) continue;
    const partner = known
      .filter((o) => o !== u && (o.area || "") === (u.area || ""))
      .sort((a, b) => a.size - b.size)[0];
    issues.push({
      kind: "warn",
      text: `${u.row.name.trim()} hat ${u.size} Personen und wird nie einzeln ausgewiesen.`,
      merge: partner ? { from: Number(u.key), into: Number(partner.key), label: `Mit ${partner.row.name.trim()} zusammenlegen` } : null,
    });
  }
  const collateral = known.filter((u) => u.size >= minN && !visibleTeams.has(u.key) && known.length > 1);
  if (collateral.length) issues.push({ kind: "warn", text: `Zusätzlich verborgen, damit sich kleine Teams nicht herausrechnen lassen: ${collateral.map((u) => u.row.name.trim()).join(", ")}.` });
  const smallAreas = areaNames.filter((a) => !visibleAreas.has(a));
  if (areaNames.length >= 2 && smallAreas.length) issues.push({ kind: "warn", text: `Bereich nicht einzeln ausgewiesen: ${smallAreas.join(", ")}.` });

  return {
    issues,
    summary: {
      teams: clean.length,
      areas: areaNames.length,
      visibleTeams: visibleTeams.size,
      visibleAreas: visibleAreas.size,
      leaders: clean.length - noLeader.length,
    },
    blocking: issues.some((i) => i.kind === "error"),
  };
}

// Zeilen aus Excel/Text parsen: Tab oder Semikolon getrennt.
// 4 Spalten: Bereich, Team, Führungskraft, Kopfzahl. 2 Spalten: Team, Kopfzahl. 1 Spalte: Team.
export function parseRows(text) {
  const lines = String(text || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rows = [];
  for (const l of lines) {
    const p = l.split(/\t|;/).map((x) => x.trim());
    if (/^bereich$/i.test(p[0]) || /^team$/i.test(p[0])) continue; // Kopfzeile
    if (p.length >= 4) rows.push({ area: p[0], name: p[1], leader: p[2], headcount: digits(p[3]) });
    else if (p.length === 3) rows.push(digits(p[2]) ? { area: p[0], name: p[1], leader: "", headcount: digits(p[2]) } : { area: p[0], name: p[1], leader: p[2], headcount: "" });
    else if (p.length === 2) rows.push({ area: "", name: p[0], leader: "", headcount: digits(p[1]) });
    else rows.push({ area: "", name: p[0], leader: "", headcount: "" });
  }
  return rows;
}

function digits(x) {
  return /^\d+$/.test(String(x || "").trim()) ? String(x).trim() : "";
}
