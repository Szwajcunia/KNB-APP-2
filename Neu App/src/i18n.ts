export type Lang = 'de' | 'pl'

export const i18n = {
  de: {
    app: 'Yard App',
    logout: 'Abmelden',
    login: 'Anmelden',
    tab_dashboard: 'Plätze & LKW',
    tab_planning: 'Planung',
    tab_picking: 'Kommissionierung',
    tab_admin: 'Administration',
    language: 'Sprache',
    german: 'DE',
    polish: 'PL',
    welcome: 'Willkommen',
    search: 'Suchen...',
    add_manual: 'Manuell hinzufügen',
    import_excel: 'Excel/CSV importieren',
    no_data: 'Keine Daten vorhanden',
  },
  pl: {
    app: 'Yard App',
    logout: 'Wyloguj',
    login: 'Zaloguj',
    tab_dashboard: 'Place & ciężarówki',
    tab_planning: 'Planowanie',
    tab_picking: 'Komisjonowanie',
    tab_admin: 'Administracja',
    language: 'Język',
    german: 'DE',
    polish: 'PL',
    welcome: 'Witaj',
    search: 'Szukaj...',
    add_manual: 'Dodaj ręcznie',
    import_excel: 'Import Excel/CSV',
    no_data: 'Brak danych',
  }
} as const

export function useLang(): ['de'|'pl', (v:'de'|'pl')=>void, (k: keyof typeof i18n['de']) => string]{
  const key = 'yard_lang'
  const stored = (localStorage.getItem(key) as Lang) || 'de'
  let lang: Lang = stored
  const t = (k: keyof typeof i18n['de']) => (i18n[lang][k] as string)
  const setLang = (v: Lang) => {
    lang = v
    localStorage.setItem(key, v)
    window.location.reload()
  }
  return [lang, setLang, t]
}
