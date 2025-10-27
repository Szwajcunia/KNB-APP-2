// src/components/Navbar.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";

const i18n = {
  de: {
    tab_yard: "Plätze & LKW",
    tab_planning: "Planung",
    tab_picking: "Kommissionierung",
    tab_admin: "Admin",
  },
  pl: {
    tab_yard: "Place i ciężarówki",
    tab_planning: "Planowanie",
    tab_picking: "Komisjonowanie",
    tab_admin: "Admin",
  },
} as const;

export default function Navbar({
  lang,
  setLang,
}: {
  lang: "de" | "pl";
  setLang: (v: "de" | "pl") => void;
}) {
  const { pathname } = useLocation();

  // ⬇⬇⬇ kluczowa linijka – fallback na DE jeśli `lang` z jakiegoś powodu jest inny
  const L = i18n[lang] ?? i18n.de;

  const item = (to: string, label: string) => (
    <Link key={to} to={to} className={`tab ${pathname === to ? "active" : ""}`}>
      {label}
    </Link>
  );

  return (
    <div className="navbar">
      <div className="tab-group">
        {item("/", L.tab_yard)}
        {item("/planning", L.tab_planning)}
        {item("/picking", L.tab_picking)}
        {item("/admin", L.tab_admin)}
        <button
          className="tab"
          onClick={() => setLang(lang === "de" ? "pl" : "de")}
        >
          {lang === "de" ? "PL" : "DE"}
        </button>
      </div>
    </div>
  );
}
