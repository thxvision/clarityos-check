# ClarityOS® Check

Messinstrument für geteilte operative Klarheit (THX). Next.js auf Vercel, Datenbank Supabase (Frankfurt).

- `/t/<token>`: Befragung pro Team (anonym, nur Team und Antworten)
- `/f/<token>`: Soll-Setzung der Führung
- `/admin`: Runden anlegen, Links, Ergebnisse, KI-Gruppierung der Kommentare

Umgebungsvariablen (Vercel): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`, optional `ANTHROPIC_MODEL`.
Anonymität: Tabellen ohne direkten Zugriff (RLS ohne Policies), Zugriff nur über geprüfte Datenbankfunktionen, Ergebnisse erst ab 5 Antworten pro Gruppe.
Spezifikation: siehe Claude-Doc „ClarityOS Messinstrument: Spezifikation v1“.
