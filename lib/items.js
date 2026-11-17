// ClarityOS® Check: Itemkatalog v1.2 (Spezifikation 17.11.2026)
// Typen: F = Faktfrage mit Soll, V = Verhalten im Zeitfenster, R = Referent-Shift-Einschätzung 1-5
// nebel: Antworten, die keine Regel beschreiben, sondern ihr Fehlen
// bad (V): Antworten, die Reibung anzeigen

export const FIELDS = [
  {
    key: "purpose", name: "Purpose",
    felt: "In meiner täglichen Arbeit erkenne ich klar, wie Entscheidungen und Prioritäten mit unserem Zweck zusammenhängen.",
    rule: "Wofür sind wir da? Schreib es in einem Satz auf.",
  },
  {
    key: "strategie", name: "Strategie",
    felt: "Ich habe ein klares Verständnis unserer aktuellen strategischen Prioritäten.",
    rule: "Was ist gerade unsere wichtigste Priorität? Ein Satz.",
  },
  {
    key: "ziele", name: "Ziele",
    felt: "Ich weiß, woran Erfolg in meiner Arbeit erkennbar ist.",
    rule: "Woran wird Erfolg in deinem Team gemessen? Ein Satz.",
  },
  {
    key: "wachstum", name: "Persönliches Wachstum",
    felt: "Ich habe ein klares Bild davon, wie ich mich in meiner Rolle weiterentwickeln kann.",
    rule: "Was ist dein nächster konkreter Entwicklungsschritt? Ein Satz.",
  },
  {
    key: "leadership", name: "Leadership",
    felt: "Führung gibt mir Orientierung und unterstützt wirksame Entscheidungen im Alltag.",
    rule: "Welche Entscheidungen darfst du selbst treffen? Ein Satz.",
  },
  {
    key: "struktur", name: "Struktur",
    felt: "Verantwortlichkeiten und Entscheidungskompetenzen sind so klar, dass Arbeit ohne Reibung vorangeht.",
    rule: "Wer entscheidet bei euch was? Nenne die wichtigste Regel in einem Satz.",
  },
  {
    key: "workflows", name: "Workflows",
    felt: "Übergaben und Abläufe zwischen Personen und Teams funktionieren klar und ohne Umwege.",
    rule: "Welcher Ablauf ist bei euch klar geregelt? Ein Satz.",
  },
  {
    key: "routinen", name: "Routinen",
    felt: "Unsere Meetings und Routinen helfen, Arbeit und Entscheidungen zu koordinieren, ohne unnötigen Aufwand.",
    rule: "Welche Routine sorgt bei euch für Klarheit? Ein Satz.",
  },
  {
    key: "technologie", name: "Technologie",
    felt: "Digitale Tools unterstützen meine Arbeit, statt sie komplizierter zu machen.",
    rule: "Welche Regel gilt bei euch für den Einsatz von KI? Ein Satz.",
  },
];

export const FOLLOWUP = {
  low: "Beschreib die letzte Situation, in der das gefehlt hat. Was genau war unklar?",
  mid: "Beschreib eine Situation aus den letzten 4 Wochen, in der es nicht klar war.",
};

const NW = "Weiß ich nicht";
const NG = "Ist nicht geregelt";
const FREQ = ["nie", "einmal", "zwei- bis dreimal", "etwa wöchentlich", "mehrmals pro Woche"];
const WHO = ["Die betroffene Person", "Das Team gemeinsam", "Teamleitung", "Bereichsleitung", "Geschäftsführung", NG, NW];

export const ITEMS = [
  { id: "U1", field: "purpose", type: "V", q: "Wie oft wurde in deinem Team in den letzten 4 Wochen eine Entscheidung ausdrücklich mit unserem Zweck begründet?", options: FREQ, bad: ["nie", "einmal"] },
  { id: "U2", field: "purpose", type: "R", q: "In meinem Team könnten die meisten in einem Satz sagen, wofür wir da sind.", scale: 5 },

  { id: "P1", field: "strategie", type: "F", q: "Zwei Dinge brennen gleichzeitig, für beide reicht die Zeit nicht. Was gewinnt bei euch?", options: ["Das Anliegen der Kund:innen", "Qualität", "Termintreue", "Wirtschaftlichkeit", "Wer am lautesten ruft", NW], nebel: ["Wer am lautesten ruft", NW] },
  { id: "P2", field: "strategie", type: "F", q: "Wenn Kapazität fehlt: Was wird bei euch als Erstes zurückgestellt?", options: ["Interne Projekte", "Neue Vorhaben", "Weiterentwicklung und Lernen", "Administration", "Nichts, es läuft alles parallel weiter", NW], nebel: ["Nichts, es läuft alles parallel weiter", NW] },
  { id: "P3", field: "strategie", type: "F", q: "Gibt es einen schriftlichen Plan für die nächsten 2 bis 3 Jahre?", options: ["Ja, und ich kenne ihn", "Ja, aber ich kenne ihn nicht", "Nein", NW], nebel: ["Ja, aber ich kenne ihn nicht", NW] },

  { id: "Z1", field: "ziele", type: "F", q: "Welche eine Zahl entscheidet, ob dein Team dieses Quartal erfolgreich war?", options: ["Umsatz", "Ergebnis oder Deckungsbeitrag", "Kundenzufriedenheit", "Auslastung oder Produktivität", "Qualität oder Fehlerquote", "Termintreue", "Es gibt nicht die eine Zahl", NW], nebel: ["Es gibt nicht die eine Zahl", NW] },
  { id: "Z2", field: "ziele", type: "F", q: "Wie viele Ziele hat dein Team für dieses Quartal?", options: ["Keine", "1 bis 3", "4 bis 6", "Mehr als 6", NW], nebel: [NW] },

  { id: "G1", field: "wachstum", type: "V", q: "Wann hattest du zuletzt ein Gespräch über deine Entwicklung, bei dem etwas Konkretes vereinbart wurde?", options: ["In den letzten 3 Monaten", "Vor 3 bis 6 Monaten", "Vor 6 bis 12 Monaten", "Länger her", "Noch nie"], bad: ["Länger her", "Noch nie"] },
  { id: "G2", field: "wachstum", type: "F", q: "Gibt es für deine Rolle schriftlich festgehaltene Erwartungen?", options: ["Ja", "Nein", NW], nebel: [NW] },

  { id: "L1", field: "leadership", type: "V", q: "Wie oft hast du in den letzten 4 Wochen eine Entscheidung nach oben gegeben, die du selbst hättest treffen dürfen?", options: [...FREQ, "Ich weiß nicht, was ich selbst entscheiden darf"], bad: ["etwa wöchentlich", "mehrmals pro Woche", "Ich weiß nicht, was ich selbst entscheiden darf"] },
  { id: "L2", field: "leadership", type: "F", q: "Eine Entscheidung steht an, deine Führungskraft ist nicht erreichbar. Was passiert meistens?", options: ["Ich entscheide selbst", "Eine Vertretung entscheidet", "Wir warten", "Unterschiedlich", NW], nebel: ["Unterschiedlich", NW] },
  { id: "L3", field: "leadership", type: "F", q: "Eine Entscheidung betrifft dein Team. Wie wird sie bei euch getroffen?", options: ["Führung entscheidet allein", "Führung entscheidet nach Anhörung des Teams", "Gemeinsam im Team", "Unterschiedlich", NW], nebel: ["Unterschiedlich", NW] },

  { id: "S1", field: "struktur", type: "F", q: "Der Arbeits- oder Einsatzplan muss kurzfristig geändert werden. Wer entscheidet?", options: WHO, nebel: [NG, NW] },
  { id: "S2", field: "struktur", type: "F", q: "Jemand braucht für die Arbeit einmalig etwas um bis zu 2.000 €. Wer gibt frei?", options: WHO, nebel: [NG, NW] },
  { id: "S3", field: "struktur", type: "F", q: "Zwei Teams sind sich bei einer Übergabe uneinig. Wer entscheidet?", options: ["Die beiden Teamleitungen gemeinsam", "Die nächsthöhere Führungskraft", "Geschäftsführung", "Wer zuerst eskaliert", NG, NW], nebel: ["Wer zuerst eskaliert", NG, NW] },
  { id: "S4", field: "struktur", type: "F", q: "Wer ist für euer wichtigstes Kundenthema letztverantwortlich?", options: ["Eine benannte Person", "Ein Team gemeinsam", "Mehrere Personen parallel", NW], nebel: ["Mehrere Personen parallel", NW] },

  { id: "W1", field: "workflows", type: "V", q: "Wie oft hast du letzte Woche etwas abgetippt, das schon woanders stand?", options: ["nie", "einmal", "mehrmals", "täglich"], bad: ["mehrmals", "täglich"] },
  { id: "W2", field: "workflows", type: "V", q: "Wie oft musstest du letzte Woche nacharbeiten, weil bei einer Übergabe etwas fehlte?", options: ["nie", "einmal", "mehrmals", "täglich"], bad: ["mehrmals", "täglich"] },
  { id: "W3", field: "workflows", type: "F", q: "Du hast ein IT-Problem. Was machst du als Erstes?", options: ["Ticket erstellen", "IT anrufen", "Eine Kollegin oder einen Kollegen fragen", "Selbst lösen", NW], nebel: [NW] },

  { id: "R1", field: "routinen", type: "V", q: "Wie viele deiner wiederkehrenden Meetings letzte Woche endeten mit einer Entscheidung oder einer Aufgabe mit Namen dran?", options: ["keine", "wenige", "etwa die Hälfte", "die meisten", "alle", "Ich hatte keine"], bad: ["keine", "wenige"] },
  { id: "R2", field: "routinen", type: "F", q: "Gibt es in deinem Team einen festen Termin, in dem die Prioritäten für die nächste Woche festgelegt werden?", options: ["Ja", "Nein", NW], nebel: [NW] },

  { id: "T1", field: "technologie", type: "F", q: "Dürfen Daten von Kund:innen in ein KI-Tool wie ChatGPT eingegeben werden?", options: ["Ja, frei", "Nur in ein freigegebenes Tool", "Nein", NW], nebel: [NW] },
  { id: "T2", field: "technologie", type: "F", q: "Welches System ist bei euch die gültige Quelle für Kundendaten?", options: ["CRM", "ERP", "Excel oder Listen", "E-Mail-Postfach", "Mehrere gleichzeitig", NW], nebel: ["Mehrere gleichzeitig", NW] },
];

export const LIKERT5 = ["stimmt gar nicht", "stimmt eher nicht", "teils, teils", "stimmt eher", "stimmt völlig"];

export const itemsByField = (key) => ITEMS.filter((i) => i.field === key);
export const fieldByKey = (key) => FIELDS.find((f) => f.key === key);
