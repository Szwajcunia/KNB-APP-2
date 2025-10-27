import { BrowserRouter, NavLink, Route, Routes, Navigate } from "react-router-dom"
import PlacZaladunkowyPage from "./pages/PlacZaladunkowyPage"
import PlanningPage from "./pages/PlanningPage"
import KomisjonerzyPage from "./pages/KomisjonerzyPage"
import AdminPage from "./pages/AdminPage"
import "./app.css"

function TabLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "px-4 py-2 rounded-xl text-sm font-medium transition border",
          isActive ? "bg-white border-gray-300 shadow-sm" : "bg-gray-50 border-transparent hover:bg-white",
        ].join(" ")
      }
    >
      {label}
    </NavLink>
  )
}

export default function AppShell() {
  return (
    <BrowserRouter>
      <div className="mx-auto max-w-[1200px] p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">Jakub (dispatcher)</div>
          <div className="flex gap-2">
            <TabLink to="/place" label="1. Miejsca + ciężarówki" />
            <TabLink to="/planning" label="2. Planowanie załadunków" />
            <TabLink to="/pick" label="3. Panel komisjonerów" />
            <TabLink to="/admin" label="4. Administracja" />
          </div>
        </div>

        <div className="rounded-2xl bg-gray-50 p-3">
          <Routes>
            <Route path="/" element={<Navigate to="/place" replace />} />
            <Route path="/place" element={<PlacZaladunkowyPage />} />
            <Route path="/planning" element={<PlanningPage />} />
            <Route path="/pick" element={<KomisjonerzyPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}