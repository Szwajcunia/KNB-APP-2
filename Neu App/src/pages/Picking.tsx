import React from "react";

export default function Picking({ lang }: { lang: "de" | "pl" }) {
  return (
    <div style={{ padding: 16 }}>
      <h2>{lang === "de" ? "Kommissionierung" : "Komisjonowanie"}</h2>
    </div>
  );
}
