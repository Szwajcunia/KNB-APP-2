import React from "react";

export default function Admin({ lang }: { lang: "de" | "pl" }) {
  return (
    <div style={{ padding: 16 }}>
      <h2>{lang === "de" ? "Administration" : "Administracja"}</h2>
    </div>
  );
}
