import { useEffect, useState } from "react"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"

type Account = {
  id: string
  name: string
  role: "dispatcher" | "versand" | "komisjon" | "admin"
  pin?: string
}

const LSK = "admin_accounts_v1"

export default function AdminPage() {
  const [users, setUsers] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ls = localStorage.getItem(LSK)
    if (ls) {
      setUsers(JSON.parse(ls))
      setLoading(false)
    } else {
      fetch("/accounts.json")
        .then(r => r.json())
        .then((arr: Account[]) => setUsers(arr))
        .finally(() => setLoading(false))
    }
  }, [])

  function save() {
    localStorage.setItem(LSK, JSON.stringify(users))
  }
  function add() {
    setUsers(p => [...p, { id: crypto.randomUUID(), name: "", role: "komisjon", pin: "" }])
  }
  function remove(id: string) {
    setUsers(p => p.filter(u => u.id !== id))
  }
  function setField(id: string, k: keyof Account, v: any) {
    setUsers(p => p.map(u => (u.id === id ? { ...u, [k]: v } : u)))
  }

  if (loading) return <div className="p-4 text-sm text-gray-500">Wczytywanie…</div>

  return (
    <div className="p-3">
      <div className="mb-2 text-lg font-semibold">Użytkownicy i uprawnienia</div>
      <Card>
        <CardContent>
          <div className="space-y-3">
            {users.map(u => (
              <div key={u.id} className="grid grid-cols-5 items-center gap-2 rounded-xl border bg-white p-3">
                <Input value={u.name} onChange={e => setField(u.id, "name", e.target.value)} placeholder="Nazwa" />
                <select className="h-9 rounded-xl border px-2" value={u.role} onChange={e => setField(u.id, "role", e.target.value as Account["role"])}>
                  <option value="dispatcher">dispatcher</option>
                  <option value="versand">versand</option>
                  <option value="komisjon">komisjon</option>
                  <option value="admin">admin</option>
                </select>
                <Input value={u.pin ?? ""} onChange={e => setField(u.id, "pin", e.target.value)} placeholder="PIN/hasło" />
                <div className="text-xs text-gray-500">ID: {u.id.slice(0, 8)}…</div>
                <div className="flex justify-end">
                  <Button onClick={() => remove(u.id)}>Usuń</Button>
                </div>
              </div>
            ))}
            {users.length === 0 && <div className="p-4 text-sm text-gray-500">Brak kont.</div>}
          </div>
          <div className="mt-4 flex justify-between">
            <Button onClick={add}>Dodaj konto</Button>
            <Button onClick={save}>Zapisz</Button>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Produkcyjnie: zamień na API „/admin/users” (GET/POST/PUT/DELETE). PIN przechowuj jako hash.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}