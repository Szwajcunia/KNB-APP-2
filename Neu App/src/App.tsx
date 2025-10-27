// src/App.tsx
import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

// Twoje ekrany
import Yard from "./pages/Yard";
import Planning from "./pages/Planning";
import Picking from "./pages/Picking";
import Admin from "./pages/Admin";

type Lang = "de" | "pl";

// Bezpieczne pobranie języka z localStorage; fallback = 'de'
const normalizeLang = (v: string | null): Lang => (v === "de" || v === "pl" ? (v as Lang) : "de");

export default function App() {
  const [lang, setLangState] = useState<Lang>(normalizeLang(localStorage.getItem("lang")));

  const setLang = (v: Lang) => {
    setLangState(v);
    localStorage.setItem("lang", v);
  };

  return (
    <BrowserRouter>
      <Navbar lang={lang} setLang={setLang} />
      <Routes>
        <Route path="/" element={<Yard lang={lang} />} />
        <Route path="/planning" element={<Planning lang={lang} />} />
        <Route path="/picking" element={<Picking lang={lang} />} />
        <Route path="/admin" element={<Admin lang={lang} />} />
      </Routes>
    </BrowserRouter>
  );
}
