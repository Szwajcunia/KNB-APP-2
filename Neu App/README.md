# Yard App (Tabs) — Router + Supabase Auth (DE als Standard)

Dieses Paket enthält 4 Reiter (Router):
- **Plätze & LKW** (`/`) – Minimaler Überblick (Skelett, bereit, um Euren bestehenden Code zu wstawić).
- **Planung** (`/planning`) – Skelett.
- **Kommissionierung** (`/picking`) – *Voll integriert* mit Supabase (Tabelle `picking_lists` + Live-Updates).
- **Administration** (`/admin`) – Hinweise für Auth/Rollen (Supabase Auth).

## Schnellstart lokal
```bash
npm i
npm run dev
```

### .env
Legen Sie im Netlify oder lokal `.env` an:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Supabase Schema (Panel 3)
Führen Sie in Supabase SQL Editor die Datei **schema_picking_lists.sql** aus.

**Tabelle**: `public.picking_lists`  
Spalten: `list_no, list_name, unload_place, planned_time, planned_qty, actual_qty, notes, status`

RLS ist aktiv – alle authentifizierten Nutzer dürfen CRUD (später per Rollen einschränken).

## Netlify
- `netlify.toml` & `public/_redirects` konfigurieren das SPA-Routing.
- Setzen Sie Umgebungsvariablen (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) in den Site Settings.
- Deploy: Upload der ZIP oder Git-Repo verbinden.

## Wo Euren bestehenden Dashboard-Code einfügen?
Ersetzen Sie den Inhalt von **src/pages/Dashboard.tsx** durch den Canvas-Code (Plätze, Operatoren, Statusy, Drag&Drop).  
Die Architektur (Tabs + Router + Auth) bleibt unverändert.

## Standard-Sprache
Standard ist **Deutsch (DE)**. Umschalten PL/DE im Header (persistiert in `localStorage`).

Viel Erfolg! 🚀
