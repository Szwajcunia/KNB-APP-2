// src/App.tsx
import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

// Twoje ekrany
import Yard from "./pages/Yard";
import Planning from "./pages/Planning";
import Picking from "./pages/Picking";
import Admin from "./pages/Admin";

type Lang = "de" | "pl";
type Role = "dispatcher" | "versand" | "wareneingang" | "mobel";
type User = { name: string; role: Role };

const normalizeLang = (v: string | null): Lang => (v === "de" || v === "pl" ? (v as Lang) : "de");

const i18n = {
  de: {
    app: "Yard App",
    login_title: "Anmeldung",
    role: "Rolle",
    operator_name: "Name",
    password: "Passwort",
    login: "Anmelden",
    logout: "Abmelden",
    dispatcher: "Disponent",
    versand: "Versand",
    wareneingang: "Wareneingang",
    mobel: "Möbel",
    footer: "• Router + Login • Standard: Deutsch",
    err_name: "Bitte Name eingeben",
    err_pwd: "Ungültiges Passwort",
    hint_disp: "Für Disponenten ist ein Passwort erforderlich.",
  },
  pl: {
    app: "Yard App",
    login_title: "Logowanie",
    role: "Rola",
    operator_name: "Imię",
    password: "Hasło",
    login: "Zaloguj",
    logout: "Wyloguj",
    dispatcher: "Dyspozytor",
    versand: "Versand",
    wareneingang: "Wareneingang",
    mobel: "Möbel",
    footer: "• Router + Logowanie • Domyślnie: Niemiecki",
    err_name: "Podaj imię",
    err_pwd: "Nieprawidłowe hasło",
    hint_disp: "Dla dyspozytorów wymagane jest hasło.",
  },
} as const;

// Prosty ekran logowania w tym samym pliku (żeby nie ruszać innych)
function LoginScreen({
  lang,
  onLogin,
}: {
  lang: Lang;
  onLogin: (u: User) => void;
}) {
  const t = i18n[lang];
  const [role, setRole] = useState<Role>("versand");
  const [name, setName] = useState("");
  const [pwd, setPwd] = useState("");

  function submit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!name.trim()) {
      alert(t.err_name);
      return;
    }
    if (role === "dispatcher") {
      if (pwd !== "Versand123") {
        alert(t.err_pwd);
        return;
      }
    }
    onLogin({ name: name.trim(), role });
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#f0f6ff,#e6f0ff)" }}>
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "48px 16px" }}>
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 10px 24px rgba(0,0,0,0.08)",
            padding: 24,
            border: "1px solid #e5e7eb",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <strong style={{ fontSize: 18, color: "#1f2937" }}>{t.app}</strong>
          </div>
          <h2 style={{ margin: 0, fontSize: 20, color: "#111827", textAlign: "center" }}>
            {t.login_title}
          </h2>
          <p style={{ marginTop: 6, textAlign: "center", color: "#6b7280", fontSize: 12 }}>
            {t.hint_disp}
          </p>

          <form onSubmit={submit} style={{ marginTop: 16 }}>
            <label style={{ display: "block", fontSize: 12, color: "#374151", marginBottom: 4 }}>
              {t.role}
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="select"
              style={{ width: "100%", marginBottom: 12 }}
            >
              <option value="dispatcher">{t.dispatcher}</option>
              <option value="versand">{t.versand}</option>
              <option value="wareneingang">{t.wareneingang}</option>
              <option value="mobel">{t.mobel}</option>
            </select>

            <label style={{ display: "block", fontSize: 12, color: "#374151", marginBottom: 4 }}>
              {t.operator_name}
            </label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.operator_name}
              style={{ width: "100%", marginBottom: 12 }}
            />

            {role === "dispatcher" && (
              <>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    color: "#374151",
                    marginBottom: 4,
                  }}
                >
                  {t.password}
                </label>
                <input
                  className="input"
                  type="password"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  placeholder={t.password}
                  style={{ width: "100%", marginBottom: 16 }}
                />
              </>
            )}

            <button type="submit" className="btn" style={{ width: "100%" }}>
              {t.login}
            </button>
          </form>
        </div>

        <div style={{ textAlign: "center", color: "#6b7280", fontSize: 12, marginTop: 12 }}>
          © {new Date().getFullYear()} {t.app} {t.footer}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  // język
  const [lang, setLangState] = useState<Lang>(normalizeLang(localStorage.getItem("lang")));
  const setLang = (v: Lang) => {
    setLangState(v);
    localStorage.setItem("lang", v);
  };

  // user
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return null;
      const u = JSON.parse(raw);
      if (u && u.name && u.role) return u as User;
      return null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  const logout = () => setUser(null);

  // jeśli nie zalogowany -> pokaż ekran logowania
  if (!user) {
    return <LoginScreen lang={lang} onLogin={setUser} />;
  }

  return (
    <BrowserRouter>
      {/* Możesz rozszerzyć Navbar o pokazanie usera/wylogowanie, ale nie zmieniamy jego interfejsu */}
      <Navbar lang={lang} setLang={setLang} />

      {/* Pasek info (user + logout) */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          justifyContent: "flex-end",
          padding: "8px 16px",
          borderBottom: "1px solid #e5e7eb",
          background: "#f8fafc",
        }}
      >
        <span className="badge">{user.name} • {user.role}</span>
        <button className="btn outline" onClick={logout}>
          {i18n[lang].logout}
        </button>
      </div>

      <Routes>
        <Route path="/" element={<Yard lang={lang} />} />
        <Route path="/planning" element={<Planning lang={lang} />} />
        <Route path="/picking" element={<Picking lang={lang} />} />
        <Route path="/admin" element={<Admin lang={lang} />} />
      </Routes>

      <div
        style={{
          textAlign: "center",
          color: "#6b7280",
          fontSize: 12,
          padding: "16px 0",
          borderTop: "1px solid #e5e7eb",
          background: "#f8fafc",
          marginTop: 24,
        }}
      >
        © {new Date().getFullYear()} {i18n[lang].app} {i18n[lang].footer}
      </div>
    </BrowserRouter>
  );
}
