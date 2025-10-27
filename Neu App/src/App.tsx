// src/App.tsx
import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
// importuj swoje ekrany:
import Yard from "./pages/Yard";
import Planning from "./pages/Planning";
import Picking from "./pages/Picking";
import Admin from "./pages/Admin";

// ✅ helper – JEDNA para {}
const normalizeLang = (v: string | null): "de" | "pl" =>
  v === "de" || v === "pl" ? v : "de";

// ✅ komponent – otwierająca { po deklaracji i JEDNA zamykająca } PRZED export default
export default function App() {
  const [langState, setLangState] = useState<"de" | "pl">(
    normalizeLang(localStorage.getItem("lang"))
  );

  const setLang = (v: "de" | "pl") => {
    setLangState(v);
    localStorage.setItem("lang", v);
  };

  return (
    <BrowserRouter>
      <Navbar lang={langState} setLang={setLang} />
      <Routes>
        <Route path="/" element={<Yard lang={langState} />} />
        <Route path="/planning" element={<Planning lang={langState} />} />
        <Route path="/picking" element={<Picking lang={langState} />} />
        <Route path="/admin" element={<Admin lang={langState} />} />
      </Routes>
    </BrowserRouter>
  );
}


  async function signIn(){
    const email = window.prompt('E-Mail:')
    const password = window.prompt('Passwort:')
    if(!email || !password) return
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if(error) alert(error.message)
  }
  async function signOut(){
    await supabase.auth.signOut()
  }

  return (
    <div className="container">
      <div className="topbar">
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <strong>Yard App</strong>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button className="btn outline" onClick={()=>location.reload()}>{i18n[lang].german==='DE'?'Neu laden':'Odśwież'}</button>
          {!user ? <button className="btn" onClick={signIn}>{i18n[lang].login}</button> :
            <>
              <span className="badge">{user.email}</span>
              <button className="btn" onClick={signOut}>{i18n[lang].logout}</button>
            </>
          }
        </div>
      </div>
      <Navbar/>
      <Outlet/>
      <div className="footer">© {new Date().getFullYear()} Yard App • Router + Supabase Auth • Standard: Deutsch</div>
    </div>
  )
}
