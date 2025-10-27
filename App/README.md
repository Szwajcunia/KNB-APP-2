# Yard App (Netlify-ready)

1) Wklej treść aktualnego pliku z Canvasa **`Plac Załadunkowy – Mvp (react)`** do: `src/PlacZaladunkowyApp.tsx`
   - Zastąp cały placeholder `REPLACE_WITH_CANVAS_CODE` właściwym kodem.
2) Zainstaluj: `npm install`
3) Lokalnie: `npm run dev -- --host` (podgląd) / `npm run build` (build).
4) Netlify (Git): ustaw Build: `npm run build`, Publish: `dist`.
5) Netlify (Drop): użyj `npm run build`, a następnie przeciągnij folder `dist/` do https://app.netlify.com/drop

> W projekcie są minimalne komponenty UI (zastępstwo dla shadcn/ui), alias `@ -> src`, SPA redirect i plik `netlify.toml`.


## Zakładki
Aplikacja ma 4 zakładki: /place, /planning, /pick, /admin. Dane demo trzymane w localStorage. SQL: `db_schema_postgres.sql`.
