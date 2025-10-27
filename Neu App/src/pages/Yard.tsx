import React from "react";

export default function Yard({ lang }: { lang: "de" | "pl" }) {
  return (
    <div style={{ padding: 16 }}>
      <h2>{lang === "de" ? "Plätze & LKW" : "Place i ciężarówki"}</h2>
      <p style={{ opacity: 0.7 }}>
        {lang === "de"
          ? "Hier erscheinen später die Ladeplätze und LKW."
          : "Tutaj później pojawią się place załadunkowe i ciężarówki."}
      </p>
    </div>
  );
}
