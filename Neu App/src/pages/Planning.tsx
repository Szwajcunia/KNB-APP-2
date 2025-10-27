import React from "react";

export default function Planning({ lang }: { lang: "de" | "pl" }) {
  return (
    <div style={{ padding: 16 }}>
      <h2>{lang === "de" ? "Planung" : "Planowanie"}</h2>
    </div>
  );
}
