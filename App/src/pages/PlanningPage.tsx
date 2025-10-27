import { useEffect, useMemo, useState } from "react"
import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Ciezarowka, ListaZaladunkowa, getCiezarowki, getListy, saveCiezarowki, saveListy } from "../lib/store"

function NewRow({ onAdd }: { onAdd: (r: ListaZaladunkowa) => void }) {
  const [f, setF] = useState<Partial<ListaZaladunkowa>>({})
  return (
    <div className="grid grid-cols-7 gap-2">
      {["numer", "nazwa", "miejsceRozladunku", "planowanyCzas"].map(k => (
        <Input key={k} placeholder={k} onChange={e => setF(p => ({ ...p, [k]: e.target.value }))} />
      ))}
      <Input placeholder="planowanaIlosc" type="number" onChange={e => setF(p => ({ ...p, planowanaIlosc: Number(e.target.value || 0) }))} />
      <Button
        onClick={() =>
          onAdd({
            id: crypto.randomUUID(),
            numer: f.numer || "",
            nazwa: f.nazwa || "",
            miejsceRozladunku: f.miejsceRozladunku || "",
            planowanyCzas: f.planowanyCzas || "",
            planowanaIlosc: f.planowanaIlosc || 0,
            rzeczywistaIlosc: 0,
            uwagi: "",
          })
        }
      >
        Dodaj
      </Button>
    </div>
  )
}

export default function PlanningPage() {
  const [listy, setListy] = useState<ListaZaladunkowa[]>([])
  const [trucks, setTrucks] = useState<Ciezarowka[]>([])
  const [q, setQ] = useState("")

  useEffect(() => {
    setListy(getListy())
    setTrucks(getCiezarowki())
  }, [])

  const filt = useMemo(
    () => listy.filter(l => [l.numer, l.nazwa, l.miejsceRozladunku].join(" ").toLowerCase().includes(q.toLowerCase())),
    [listy, q]
  )

  function connect(truckId: string, listId: string | "") {
    setTrucks(prev => prev.map(t => (t.id === truckId ? { ...t, przypisanaListaId: listId || undefined } : t)))
  }
  function saveAll() {
    saveListy(listy)
    saveCiezarowki(trucks)
  }

  return (
    <div className="grid grid-cols-2 gap-4 p-3">
      <Card>
        <CardContent>
          <div className="mb-2 flex items-center justify-between">
            <div className="font-semibold">Listy załadunkowe (z zakładki 3)</div>
            <Input placeholder="Szukaj..." value={q} onChange={e => setQ(e.target.value)} className="h-8 w-56" />
          </div>
          <div className="space-y-2">
            {filt.map(l => (
              <div key={l.id} className="rounded-xl border bg-white p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-medium">{l.numer} — {l.nazwa}</div>
                    <div className="text-gray-500">{l.miejsceRozladunku} • plan: {l.planowanyCzas} • ilość: {l.planowanaIlosc}</div>
                  </div>
                </div>
              </div>
            ))}
            {filt.length === 0 && <div className="p-4 text-sm text-gray-500">Brak list.</div>}
          </div>
          <div className="mt-4">
            <NewRow onAdd={r => setListy(p => [...p, r])} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="mb-2 font-semibold">Ciężarówki czekające</div>
          <div className="space-y-2">
            {trucks.map(t => (
              <div key={t.id} className="rounded-xl border bg-white p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-medium">{t.rejestracja}</div>
                    <div className="text-gray-500">{t.spedycja || "—"} • status: {t.status || "czeka"}</div>
                    <div className="text-gray-600">
                      {t.przypisanaListaId
                        ? `Przypisana lista: ${(listy.find(l => l.id === t.przypisanaListaId)?.numer) || t.przypisanaListaId}`
                        : "Brak przypisania"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="h-9 rounded-xl border px-2"
                      value={t.przypisanaListaId ?? ""}
                      onChange={e => connect(t.id, e.target.value)}
                    >
                      <option value="">— Wybierz listę —</option>
                      {listy.map(l => (
                        <option key={l.id} value={l.id}>{l.numer} • {l.nazwa}</option>
                      ))}
                    </select>
                    <Button onClick={() => connect(t.id, "")}>Odłącz</Button>
                  </div>
                </div>
              </div>
            ))}
            {trucks.length === 0 and <div className="p-4 text-sm text-gray-500">Brak ciężarówek w kolejce.</div>}
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={saveAll}>Zapisz</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}