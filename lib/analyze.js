// Auswertungs-Engine ClarityOS® Check v1.2
// Grundsätze: Zelle = Team (bzw. Organisation gesamt), Mindestgröße min_n (>= 5),
// keine Einzelwerte, Uneinigkeit ist ein Befund. Schwellen sind Annahmen [A] laut Spezifikation.
import { FIELDS, ITEMS } from "./items";
import { visibility, groupAreas, NO_AREA } from "./structure";

export const T = {
  NEBEL: 1 / 3,      // Anteil Nebel-Antworten -> "Nicht geregelt"
  KONSENS: 0.4,      // Anteil häufigste Antwort -> darunter "Uneinig"
  KLAR: 0.7,         // Anteil Soll-Antwort -> "Klar"
  FUEHRUNG: 0.5,     // Einigkeit der Führung bei der Soll-Setzung
  REIBUNG: 0.3,      // Anteil Reibungs-Antworten bei Verhaltensitems
  R_SD: 1.2,         // Streuung bei 1-5-Items -> "Uneinig"
};

export const STATUS = {
  fuehrung: { label: "Führung uneinig", rank: 6, tone: "red" },
  nebel: { label: "Nicht geregelt", rank: 5, tone: "red" },
  uneinig: { label: "Uneinig", rank: 4, tone: "red" },
  andere: { label: "Andere Wahrheit", rank: 3, tone: "orange" },
  reibung: { label: "Reibung", rank: 2, tone: "orange" },
  einig: { label: "Einig, kein Soll", rank: 1, tone: "grey" },
  klar: { label: "Klar", rank: 0, tone: "green" },
};

function counts(values, options) {
  const c = Object.fromEntries((options || []).map((o) => [o, 0]));
  for (const v of values) if (v != null && v !== "") c[v] = (c[v] || 0) + 1;
  return c;
}

function sollFor(item, sollList) {
  const vals = sollList.map((s) => s.answers?.[item.id]).filter((v) => v != null && v !== "");
  if (vals.length === 0) return { soll: null, leaders: 0, split: false, dist: {} };
  const dist = counts(vals, item.options);
  const [mode, m] = Object.entries(dist).sort((a, b) => b[1] - a[1])[0];
  const share = m / vals.length;
  const split = vals.length >= 2 && share <= T.FUEHRUNG; // Patt zählt als uneinig
  return { soll: split ? null : mode, leaders: vals.length, split, dist, share };
}

function analyzeItem(item, rows, sollInfo) {
  const vals = rows.map((r) => r.answers?.[item.id]).filter((v) => v != null && v !== "");
  const n = vals.length;
  const out = { id: item.id, field: item.field, type: item.type, q: item.q, n };
  if (n === 0) return { ...out, status: null };

  if (item.type === "R") {
    const nums = vals.map(Number);
    const mean = nums.reduce((a, b) => a + b, 0) / n;
    const sd = n > 1 ? Math.sqrt(nums.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)) : 0;
    const dist = counts(nums.map(String), ["1", "2", "3", "4", "5"]);
    let status = "klar";
    if (sd > T.R_SD) status = "uneinig";
    else if (mean < 3) status = "reibung";
    return { ...out, dist, mean, sd, status };
  }

  const dist = counts(vals, item.options);
  if (item.type === "V") {
    const bad = vals.filter((v) => item.bad.includes(v)).length / n;
    return { ...out, dist, bad, status: bad >= T.REIBUNG ? "reibung" : "klar" };
  }

  // F
  const nebelShare = vals.filter((v) => item.nebel.includes(v)).length / n;
  const clean = vals.filter((v) => !item.nebel.includes(v));
  let mode = null, konsens = 0;
  if (clean.length) {
    const cd = counts(clean, item.options);
    const [m, c] = Object.entries(cd).sort((a, b) => b[1] - a[1])[0];
    mode = m; konsens = c / n;
  }
  const soll = sollInfo?.soll ?? null;
  const kongruenz = soll ? vals.filter((v) => v === soll).length / n : null;
  let status;
  if (sollInfo?.split) status = "fuehrung";
  else if (nebelShare >= T.NEBEL) status = "nebel";
  else if (soll) {
    if (kongruenz >= T.KLAR) status = "klar";
    else if (konsens >= T.KONSENS && mode !== soll) status = "andere";
    else status = "uneinig";
  } else status = konsens >= T.KLAR ? "einig" : "uneinig";
  return { ...out, dist, nebelShare, mode, konsens, soll, kongruenz, sollInfo, status };
}

function worst(statuses) {
  const s = statuses.filter(Boolean);
  if (!s.length) return null;
  return s.sort((a, b) => STATUS[b].rank - STATUS[a].rank)[0];
}

function analyzeCell(rows, sollMap) {
  const items = Object.fromEntries(ITEMS.map((it) => [it.id, analyzeItem(it, rows, sollMap[it.id])]));
  const fields = FIELDS.map((f) => {
    const its = ITEMS.filter((i) => i.field === f.key).map((i) => items[i.id]);
    const felt = rows.map((r) => Number(r.felt?.[f.key])).filter((x) => x >= 1 && x <= 7);
    const feltMean = felt.length ? felt.reduce((a, b) => a + b, 0) / felt.length : null;
    // Scheinklarheit: fühlt sich klar (5-7), weicht aber bei einer Faktfrage vom Soll ab oder wählt Nebel
    const facts = ITEMS.filter((i) => i.field === f.key && i.type === "F");
    let feltClear = 0, schein = 0;
    for (const r of rows) {
      const fv = Number(r.felt?.[f.key]);
      if (!(fv >= 5)) continue;
      feltClear++;
      const off = facts.some((it) => {
        const a = r.answers?.[it.id];
        if (!a) return false;
        if (it.nebel.includes(a)) return true;
        const s = sollMap[it.id]?.soll;
        return s ? a !== s : false;
      });
      if (off) schein++;
    }
    return {
      key: f.key, name: f.name,
      status: worst(its.map((i) => i.status)),
      felt: feltMean, feltIndex: feltMean != null ? Math.round(((feltMean - 1) / 6) * 100) : null,
      feltClear, schein, scheinShare: feltClear ? schein / feltClear : null,
      items: its,
    };
  });
  const factWithSoll = ITEMS.filter((i) => i.type === "F" && items[i.id].soll);
  const klarCount = factWithSoll.filter((i) => items[i.id].status === "klar").length;
  const klarheitsquote = factWithSoll.length ? klarCount / factWithSoll.length : null;
  const fc = fields.reduce((a, f) => a + f.feltClear, 0);
  const sc = fields.reduce((a, f) => a + f.schein, 0);
  const feltAll = fields.filter((f) => f.felt != null);
  return {
    n: rows.length, items, fields, klarheitsquote, klarCount, sollCount: factWithSoll.length,
    scheinklarheit: fc ? sc / fc : null,
    gefuehlt: feltAll.length ? Math.round(feltAll.reduce((a, f) => a + f.feltIndex, 0) / feltAll.length) : null,
  };
}

export function analyzeWave(data) {
  const minN = Math.max(5, data.wave.min_n || 5);
  const rows = data.responses || [];
  const allSoll = data.soll || [];
  // Gesamt-Soll: Soll-Setzungen ohne Team (Geschäftsführung, Führungskreis).
  // Gibt es keine, gelten alle Soll-Setzungen gemeinsam (Verhalten wie bisher).
  const orgSoll = allSoll.filter((s) => !s.team_id);
  const sollBase = orgSoll.length ? orgSoll : allSoll;
  const FACTS = ITEMS.filter((i) => i.type === "F");
  const sollMap = Object.fromEntries(FACTS.map((i) => [i.id, sollFor(i, sollBase)]));
  const leaders = allSoll.length;
  const teamsById = Object.fromEntries((data.teams || []).map((t) => [t.id, t]));
  const result = { minN, n: rows.length, leaders, orgLeaders: orgSoll.length, sollMap, org: null, teams: [], areas: [], hidden: [], hiddenAreas: [], leaderGaps: [] };

  // Abweichung Teamleitung vom Gesamt-Soll (Führungsakt, nicht anonym, unabhängig von Antworten)
  if (orgSoll.length) {
    for (const s of allSoll.filter((x) => x.team_id)) {
      const t = teamsById[s.team_id];
      for (const it of FACTS) {
        const own = s.answers?.[it.id];
        const org = sollMap[it.id];
        if (!own || !org) continue;
        if (org.split) continue;
        if (org.soll && own !== org.soll) result.leaderGaps.push({ team: t?.name || "Team", leader: s.label || t?.leader_name || "Teamleitung", area: t?.area || "", id: it.id, q: it.q, field: it.field, org: org.soll, own });
      }
    }
  }

  if (rows.length < minN) return result;
  result.org = analyzeCell(rows, sollMap);

  const byTeam = (data.teams || []).map((t) => ({ team: t, rows: rows.filter((r) => r.team_id === t.id) }));
  const { visibleTeams, visibleAreas, areaNames } = visibility(
    byTeam.map((x) => ({ key: x.team.id, area: x.team.area || NO_AREA, size: x.rows.length })), minN);

  result.teams = byTeam.filter((x) => visibleTeams.has(x.team.id)).map((x) => {
    const cell = analyzeCell(x.rows, sollMap);
    // Übereinstimmung mit der eigenen Teamleitung
    const own = allSoll.find((s) => s.team_id === x.team.id);
    let ownLeader = null;
    if (own) {
      const ownMap = Object.fromEntries(FACTS.map((i) => [i.id, own.answers?.[i.id] ? { soll: own.answers[i.id], split: false } : null]));
      const withSoll = FACTS.filter((i) => ownMap[i.id]);
      const shared = withSoll.filter((i) => {
        const vals = x.rows.map((r) => r.answers?.[i.id]).filter(Boolean);
        return vals.length && vals.filter((v) => v === ownMap[i.id].soll).length / vals.length >= T.KLAR;
      });
      ownLeader = { leader: own.label || x.team.leader_name || "Teamleitung", shared: shared.length, total: withSoll.length };
    }
    return { id: x.team.id, name: x.team.name, area: x.team.area || "", ownLeader, ...cell };
  });
  const withData = byTeam.filter((x) => x.rows.length > 0);
  result.hidden = withData.length <= 1 ? [] : byTeam.filter((x) => !visibleTeams.has(x.team.id)).map((x) => x.team.name);

  if (areaNames.length >= 2) {
    const areas = groupAreas(byTeam.map((x) => ({ ...x, area: x.team.area || NO_AREA })));
    for (const a of areaNames) {
      if (!visibleAreas.has(a)) { result.hiddenAreas.push(a); continue; }
      const arows = areas[a].flatMap((x) => x.rows);
      const cell = analyzeCell(arows, sollMap);
      result.areas.push({ name: a, bruch: Object.values(cell.items).filter((i) => i.status && i.status !== "klar").length, ...cell });
    }
  }

  // Bruchstellen: alle Items ohne "Klar", sortiert nach Schwere
  result.bruchstellen = Object.values(result.org.items)
    .filter((i) => i.status && i.status !== "klar")
    .sort((a, b) => STATUS[b.status].rank - STATUS[a.status].rank);
  return result;
}

// Kommentare nur auf Organisationsebene und nur ab minN Antworten
export function commentsForClustering(data, minN) {
  const rows = data.responses || [];
  if (rows.length < Math.max(5, minN)) return null;
  const byField = {};
  for (const f of FIELDS) byField[f.key] = [];
  for (const r of rows) {
    for (const [k, c] of Object.entries(r.comments || {})) {
      if (c && c.text && c.text.trim().length > 2 && byField[k]) byField[k].push({ band: c.band, text: c.text.trim().slice(0, 1200) });
    }
  }
  return byField;
}
