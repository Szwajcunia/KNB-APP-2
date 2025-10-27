import { useEffect, useState } from "react"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"
import { ListaZaladunkowa, getListy, saveListy } from "../lib/store"

export default function KomisjonerzyPage() {
  const [listy, setListy] = useState<ListaZaladunkowa[]>([])

  useEffect(() => setListy(getListy()), [])

  function onChangeRow(id: string, patch: Partial<ListaZaladunkowa>) {
    setListy(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)))
  }
  function save() {
    saveListy(listy)
  }

  return (
    <div className="p-3">
      <div className="mb-3 text-lg font-semibold">Listy załadunkowe</div>
      <Card>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="p-2">Numer</th>
                  <th className="p-2">Nazwa</th>
                  <th className="p-2">Miejsce rozładunku</th>
                  <th className="p-2">Planowany czas</th>
                  <th className="p-2">Planowana ilość</th>
                  <th className="p-2">Rzeczywista ilość</th>
                  <th className="p-2">Uwagi</th>
                </tr>
              </thead>
              <tbody>
                {listy.map(row => (
                  <tr key={row.id} className="border-t">
                    <td className="p-2">{row.numer}</td>
                    <td className="p-2">{row.nazwa}</td>
                    <td className="p-2">{row.miejsceRozladunku}</td>
                    <td className="p-2">{row.planowanyCzas}</td>
                    <td className="p-2">{row.planowanaIlosc}</td>
                    <td className="p-2">
                      <Input
                        type="number"
                        value={row.rzeczywistaIlosc}
                        onChange={e => onChangeRow(row.id, { rzeczywistaIlosc: Number(e.target.value || 0) })}
                        className="h-8 w-24"
                      />
                    </td>
                    <td className="p-2">
                      <Input value={row.uwagi ?? ""} onChange={e => onChangeRow(row.id, { uwagi: e.target.value })} />
                    </td>
                  </tr>
                ))}
                {listy.length === 0 && (
                  <tr>
                    <td className="p-4 text-gray-500" colSpan={7}>
                      Brak danych. Import z Excela/DB lub dodaj ręcznie w Planowaniu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={save}>Zapisz zmiany</Button>
          </div>
        </CardContent>
      </Card>
      <div className="mt-4 text-xs text-gray-500">
        Import automatyczny: po podłączeniu DB/API backend wypełni tę tabelę. Wersja demo używa localStorage.
      </div>
    </div>
  )
}