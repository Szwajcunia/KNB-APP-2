export type ListaZaladunkowa = {
  id: string
  numer: string
  nazwa: string
  miejsceRozladunku: string
  planowanyCzas: string
  planowanaIlosc: number
  rzeczywistaIlosc: number
  uwagi?: string
}

export type Ciezarowka = {
  id: string
  rejestracja: string
  spedycja?: string
  status?: "czeka" | "wTrakcie" | "zaladowana"
  przypisanaListaId?: string | null
}

const K1 = "lists_v1"
const K2 = "trucks_v1"

function lsGet<T>(k: string, def: T): T {
  try {
    const raw = localStorage.getItem(k)
    return raw ? (JSON.parse(raw) as T) : def
  } catch {
    return def
  }
}
function lsSet<T>(k: string, val: T) {
  localStorage.setItem(k, JSON.stringify(val))
}

export function getListy(): ListaZaladunkowa[] {
  return lsGet<ListaZaladunkowa[]>(K1, [])
}
export function saveListy(arr: ListaZaladunkowa[]) {
  lsSet(K1, arr)
}

export function getCiezarowki(): Ciezarowka[] {
  return lsGet<Ciezarowka[]>(K2, [])
}
export function saveCiezarowki(arr: Ciezarowka[]) {
  lsSet(K2, arr)
}

// WERSJA API (do podmiany w przyszłości):
// export async function getListy(): Promise<ListaZaladunkowa[]> { const r = await fetch('/api/listy'); return r.json(); }