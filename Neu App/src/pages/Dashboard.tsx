import React, { useEffect, useMemo, useState } from "react";
import "./style.css";
import accounts from "./accounts.json";
import {
  fetchTrucks,
  fetchBays,
  fetchDone,
  subscribeRealtime,
  addTruck as addTruckSupa,
  assignToBay,
  setBayOperators,
  unassignBay,
  cycleBay as cycleBaySupa,
  moveBetweenBays,
  fetchPresenceActive,
  subscribePresence,
  startPresenceHeartbeat,
  upsertPresence,
  deletePresence,
} from "./supaStore";
import type { Truck, Bay, DoneTruck } from "./supaStore";

type Role = "dispatcher" | "versand" | "wareneingang" | "mobel";
type Fn = "load" | "unload";
const ORDER = ["PUSTE", "OCZEKUJE", "START", "KONIEC"] as const;
type BayState = (typeof ORDER)[number];
const next = (s: BayState) => (s === "KONIEC" ? "PUSTE" : ORDER[ORDER.indexOf(s) + 1]);
const prev = (s: BayState) => (s === "PUSTE" ? "KONIEC" : ORDER[ORDER.indexOf(s) - 1]);

const I = {
  pl: {
    notLogged: "Niezalogowany",
    login: "Zaloguj",
    logout: "Wyloguj",
    reset: "Reset",
    opsStatus: "Status operatorów",
    noOps: "Brak operatorów. Zaloguj operatora.",
    name: "Imię",
    status: "Status",
    fn: "Funkcja",
    actions: "Akcje",
    setBreak: "Ustaw: Przerwa",
    backFree: "Wróć: Wolny",
    available: "Dostępne ciężarówki",
    search: "Szukaj...",
    ready: "Gotowe do przypisania",
    done: "Już załadowane ciężarówki",
    doneHint: "Lista zapełni się po przejściu przez cały proces (KONIEC → PUSTE).",
    bays: "Place",
    noAssign: "Brak przypisania",
    assignTruck: "Przypisz ciężarówkę",
    assignOps: "Przypisz operatora",
    operators: "Operatorzy",
    dept: "Dział:",
    sped: "Spedycja:",
    cargo: "Towar:",
    cnt: "Ilość pojemników:",
    eta: "ETA:",
    notes: "Uwagi:",
    loadTime: "Czas załadunku:",
    state: "Status:",
    free: "Wolne",
    await: "Czeka na przyjazd",
    start: "Rozpoczęto załadunek",
    end: "Zakończono + dokumenty",
    addManual: "Dodaj ręcznie",
    regReq: "Rejestracja *",
    cargoShort: "Towar",
    cntShort: "Ilość pojemników",
    notesShort: "Uwagi",
    cancel: "Anuluj",
    add: "Dodaj",
    left: "←",
    right: "→",
    loginTitle: "Logowanie",
    roleDisp: "Dyspozytor",
    roleVersand: "Versand",
    roleWE: "Wareneingang",
    roleMobel: "Möbel",
    firstName: "Imię",
    password: "Hasło",
    pin: "PIN (4)",
    opFunc: "Załadunek / Rozładunek",
    load: "Załadunek",
    unload: "Rozładunek",
    badName: "Nieprawidłowe imię / rola",
    badPwd: "Nieprawidłowe hasło / PIN",
    loggedDisp: "Zalogowano jako dyspozytor",
    loggedOp: "Zalogowano",
    confirm: "Potwierdź",
    move: "Przenieś",
    pickOps: "Wybierz operatorów (max 3, tylko Wolni)",
    youCan: "Zadanie tylko dla operatora o statusie 'Wolny'.",
    sla: "SLA",
    popupAssign: "Przydział do załadunku",
    popupMsg: "Zostałeś przydzielony do załadunku na",
  },
  de: {
    notLogged: "Nicht angemeldet",
    login: "Anmelden",
    logout: "Abmelden",
    reset: "Zurücksetzen",
    opsStatus: "Operatorstatus",
    noOps: "Keine Operatoren. Bitte anmelden.",
    name: "Name",
    status: "Status",
    fn: "Funktion",
    actions: "Aktionen",
    setBreak: "Status: Pause",
    backFree: "Zurück: Frei",
    available: "Verfügbare LKW",
    search: "Suchen...",
    ready: "Bereit zur Zuweisung",
    done: "Bereits beladen",
    doneHint: "Liste füllt sich nach Abschluss (ENDE → FREI).",
    bays: "Plätze",
    noAssign: "Keine Zuweisung",
    assignTruck: "LKW zuweisen",
    assignOps: "Operator zuweisen",
    operators: "Operatoren",
    dept: "Abteilung:",
    sped: "Spedition:",
    cargo: "Ware:",
    cnt: "Anzahl Behälter:",
    eta: "ETA:",
    notes: "Hinweise:",
    loadTime: "Beladezeit:",
    state: "Status:",
    free: "Frei",
    await: "Wartet auf Ankunft",
    start: "Beladung gestartet",
    end: "Beladung beendet + Dokumente",
    addManual: "Manuell hinzufügen",
    regReq: "Kennzeichen *",
    cargoShort: "Ware",
    cntShort: "Anzahl Behälter",
    notesShort: "Hinweise",
    cancel: "Abbrechen",
    add: "Hinzufügen",
    left: "←",
    right: "→",
    loginTitle: "Anmeldung",
    roleDisp: "Disponent",
    roleVersand: "Versand",
    roleWE: "Wareneingang",
    roleMobel: "Möbel",
    firstName: "Name",
    password: "Passwort",
    pin: "PIN (4)",
    opFunc: "Beladung / Entladung",
    load: "Beladung",
    unload: "Entladung",
    badName: "Ungültiger Name / Rolle",
    badPwd: "Ungültiges Passwort / PIN",
    loggedDisp: "Als Disponent angemeldet",
    loggedOp: "Angemeldet",
    confirm: "Bestätigen",
    move: "Verschieben",
    pickOps: "Operatoren wählen (max. 3, nur Frei)",
    youCan: "Nur Bediener mit Status 'Frei'.",
    sla: "SLA",
    popupAssign: "Zuweisung zur Beladung",
    popupMsg: "Du wurdest der Beladung zugewiesen auf",
  },
} as const;

const toast = (msg: string) => {
  const el = document.createElement("div");
  el.textContent = msg;
  el.className = "toast";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
};

function Modal({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 18 }}>{title}</div>
          <button className="btn" onClick={onClose} aria-label="close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState<"pl" | "de">("de");
  const t = (k: keyof (typeof I)["pl"]) => I[lang][k] as string;
  const FREE_STATUS = lang === "pl" ? "Wolny" : "Frei";
  const BREAK_STATUS = lang === "pl" ? "Przerwa" : "Pause";
  const LOADING_PREFIX = lang === "pl" ? "Ładuje na" : "Lädt auf";

  // konta z pliku
  const getDispatchers = () => accounts?.dispatchers?.map((d: any) => d.name) || [];
  const checkDispatcher = (name: string, pwd: string) =>
    !!accounts?.dispatchers?.find((d: any) => d.name === name && d.password === pwd);
  const getOpRec = (name: string) => accounts?.operators?.find((o: any) => o.name === name);
  const opFnOf = (name: string) => (getOpRec(name)?.function as Fn | undefined) || "load";
  const opRoleOf = (name: string): Role | undefined => (getOpRec(name)?.role as Role | undefined);
  const opPinOk = (name: string, pin: string) => {
    const r = getOpRec(name);
    return !!r && String(r.pin || "") === String(pin);
  };

  const [us, setUs] = useState<{ name: string; role: Role; func?: Fn } | null>(null);
  const isDisp = us?.role === "dispatcher";
  const isWorker = !!us && us.role !== "dispatcher";

  const [ops, setOps] = useState<Record<string, string>>({});
  const [opsFn, setOpsFn] = useState<Record<string, Fn>>({});
  const ens = (n: string) => setOps((p) => ({ ...p, [n]: p[n] ?? FREE_STATUS }));
  const setOpSt = (n: string, s: string) => setOps((p) => ({ ...p, [n]: s }));

  const [presenceCtl, setPresenceCtl] = useState<null | { stop: () => void; update: (p: any) => void }>(null);

  const [tr, setTr] = useState<Truck[]>([]);
  const [by, setBy] = useState<Bay[]>([]);
  const [dn, setDn] = useState<DoneTruck[]>([]);
  const [search, setSearch] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [f, setF] = useState<Truck>({
    id: "",
    rejestracja: "",
    dzial: "Versand" as any,
    spedycja: "",
    towar: "",
    iloscPojemnikow: "",
    eta: "",
    uwagi: "",
  });

  const [dlgBay, setDlgBay] = useState<Bay | null>(null);
  const [opsSel, setOpsSel] = useState<string[]>([]);
  const [opsOnly, setOpsOnly] = useState(false);
  const [selTruckId, setSelTruckId] = useState<string>("");
  const [truckQuery, setTruckQuery] = useState("");

  type Confirm =
    | { open: false }
    | { open: true; kind: "assign"; toBay: number; truck: Truck }
    | { open: true; kind: "move"; from: number; to: number; truck: Truck };
  const [confirm, setConfirm] = useState<Confirm>({ open: false });

  const [loginOpen, setLoginOpen] = useState(false);
  const [role, setRole] = useState<Role>("versand");
  const [func, setFunc] = useState<Fn>("load");
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [pwd, setPwd] = useState("");

  const [notify, setNotify] = useState<{ open: boolean; bayName: string; truck: Truck } | null>(null);
  const [prevOpsByBay, setPrevOpsByBay] = useState<Record<number, string[]>>({});

  const [fabOpen, setFabOpen] = useState(false);

  // init + realtime
  useEffect(() => {
    (async () => {
      try {
        const [t0, b0, d0] = await Promise.all([fetchTrucks(), fetchBays(), fetchDone()]);
        setTr(t0);
        setBy(b0);
        setDn(d0);
      } catch (e) {
        console.error(e);
        toast("Błąd ładowania danych");
      }
    })();
    const off = subscribeRealtime(
      async () => setTr(await fetchTrucks()),
      async () => setBy(await fetchBays()),
      async () => setDn(await fetchDone())
    );
    return off;
  }, []);

  // presence live
  useEffect(() => {
    let mounted = true;
    async function refreshPresence() {
      try {
        const rows = await fetchPresenceActive();
        setOps((prev) => {
          const copy = { ...prev };
          for (const r of rows) copy[r.name] = r.status;
          return copy;
        });
        setOpsFn((prev) => {
          const copy = { ...prev };
          for (const r of rows) if (r.func) copy[r.name] = r.func as Fn;
          return copy;
        });
      } catch {}
    }
    refreshPresence();
    const off = subscribePresence(() => refreshPresence());
    return () => {
      off();
      mounted = false;
    };
  }, []);

  // start/stop heartbeat dla operatora
  useEffect(() => {
    if (!us || us.role === "dispatcher") {
      if (presenceCtl) {
        presenceCtl.stop();
        setPresenceCtl(null);
      }
      return;
    }
    const ctl = startPresenceHeartbeat({
      name: us.name,
      role: us.role,
      func: us.func,
      status: ops[us.name] ?? FREE_STATUS,
    });
    setPresenceCtl(ctl);
    ens(us.name);
    return () => {
      ctl.stop();
      setPresenceCtl(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [us?.name, us?.role]);

  // popup przy zdalnym przydziale operatora do placu
  useEffect(() => {
    if (!us || us.role === "dispatcher") return;
    const current: Record<number, string[]> = {};
    by.forEach((b) => (current[b.id] = b.operators || []));
    for (const b of by) {
      const prevList = prevOpsByBay[b.id] || [];
      const nowList = current[b.id] || [];
      const wasIn = prevList.includes(us.name);
      const isIn = nowList.includes(us.name);
      if (!wasIn && isIn && b.truck) {
        setNotify({ open: true, bayName: b.name, truck: b.truck });
        break;
      }
    }
    setPrevOpsByBay(current);
  }, [by, us?.name, us?.role, prevOpsByBay]);

  const assigned = new Set(by.filter((b) => b.truck).map((b) => b.truck!.id));
  const showBay = (name: string) => {
    const r = us?.role;
    if (!r) return false;
    const map: Record<Role, string[]> = {
      dispatcher: by.map((b) => b.name),
      versand: ["Silo", "Kalthalle", "Tor 3 + Werkzeug", "Versand Platz 1", "Versand Platz 2", "Versand Platz 3"],
      wareneingang: ["Wareneingang", "Silo", "Tor 3 + Werkzeug"],
      mobel: ["Möbel"],
    };
    return (map[r] || []).includes(name);
  };
  const filterByRole = (t: Truck) => {
    const r = us?.role;
    if (r === "versand") return t.dzial === "Versand";
    if (r === "wareneingang") return t.dzial === "Wareneingang";
    if (r === "mobel") return t.dzial === "Möbel";
    return true;
  };
  const avail = useMemo(() => {
    const L = tr.filter((t) => !assigned.has(t.id)).filter(filterByRole);
    if (!search.trim()) return L;
    const s = search.toLowerCase();
    return L.filter(
      (t) =>
        t.rejestracja.toLowerCase().includes(s) ||
        (t.spedycja || "").toLowerCase().includes(s) ||
        (t.towar || "").toLowerCase().includes(s)
    );
  }, [tr, search, by, us]);

  const TLABEL = (s: BayState) => (s === "PUSTE" ? I[lang].free : s === "OCZEKUJE" ? I[lang].await : s === "START" ? I[lang].start : I[lang].end);

  async function addTruck() {
    const plate = f.rejestracja.trim();
    if (!plate) {
      toast(lang === "pl" ? "Podaj rejestrację" : "Kennzeichen eingeben");
      return;
    }
    const T: Truck = {
      id: String(Date.now()),
      rejestracja: plate,
      dzial: f.dzial,
      spedycja: f.spedycja?.trim() || undefined,
      towar: f.towar?.trim() || undefined,
      iloscPojemnikow: f.iloscPojemnikow?.trim() || undefined,
      eta: f.eta?.trim() || undefined,
      uwagi: f.uwagi?.trim() || undefined,
    };
    try {
      await addTruckSupa(T);
      setF({ id: "", rejestracja: "", dzial: "Versand" as any, spedycja: "", towar: "", iloscPojemnikow: "", eta: "", uwagi: "" });
      setAddOpen(false);
      toast(lang === "pl" ? "Dodano ciężarówkę" : "LKW hinzugefügt");
    } catch (e) {
      console.error(e);
      toast("Błąd dodawania");
    }
  }

  async function doAssign(bayId: number, truck: Truck, opsA?: string[]) {
    if (isWorker && (ops[us!.name] ?? FREE_STATUS) !== FREE_STATUS) {
      toast(I[lang].youCan);
      return;
    }
    const O = (opsA && opsA.length ? opsA : isWorker ? [us!.name] : []).slice(0, 3);
    if (!O.every((n) => (ops[n] ?? FREE_STATUS) === FREE_STATUS)) {
      toast(I[lang].youCan);
      return;
    }
    try {
      const bayName = by.find((x) => x.id === bayId)?.name || "";
      await assignToBay(bayId, truck, O);
      O.forEach(ens);
      for (const n of O) {
        const r = opRoleOf(n) || "versand";
        const fn = opFnOf(n) || "load";
        await upsertPresence({ name: n, role: r, func: fn, status: `${LOADING_PREFIX} ${bayName}` });
      }
      if (isWorker && O.includes(us!.name)) {
        if (presenceCtl) presenceCtl.update({ status: `${LOADING_PREFIX} ${bayName}` });
        setNotify({ open: true, bayName, truck });
      }
      setDlgBay(null);
      setOpsSel([]);
      setOpsOnly(false);
      setSelTruckId("");
      setTruckQuery("");
    } catch (e) {
      console.error(e);
      toast("Błąd przydzielenia");
    }
  }

  async function saveOperators(bayId: number, opsA: string[]) {
    if (isWorker) {
      if ((ops[us!.name] ?? FREE_STATUS) !== FREE_STATUS) {
        toast(lang === "pl" ? "Musisz mieć status 'Wolny'" : "Du musst den Status 'Frei' haben");
        return;
      }
      if (opsA.length > 1 || (opsA[0] && opsA[0] !== us!.name)) {
        toast(lang === "pl" ? "Operator może dodać tylko siebie" : "Bediener kann nur sich selbst hinzufügen");
        return;
      }
    }
    const O = (opsA || []).slice(0, 3);
    if (!O.every((n) => (ops[n] ?? FREE_STATUS) === FREE_STATUS)) {
      toast(I[lang].youCan);
      return;
    }
    try {
      await setBayOperators(bayId, O);
      O.forEach(ens);
      if (isWorker && O.includes(us!.name)) {
        const b = by.find((x) => x.id === bayId);
        if (b && b.truck) setNotify({ open: true, bayName: b.name, truck: b.truck });
      }
      setDlgBay(null);
      setOpsSel([]);
      setOpsOnly(false);
      setSelTruckId("");
      setTruckQuery("");
      toast(lang === "pl" ? "Zapisano" : "Gespeichert");
    } catch (e) {
      console.error(e);
      toast("Błąd zapisu");
    }
  }

  async function unassign(bayId: number) {
    try {
      await unassignBay(bayId);
    } catch (e) {
      console.error(e);
      toast("Błąd");
    }
  }

  async function cycle(bayId: number, dir: "next" | "prev") {
    const b = by.find((x) => x.id === bayId);
    if (!b) return;
    if (b.status !== "START" && (dir === "next" ? next(b.status as BayState) : prev(b.status as BayState)) === "START") {
      for (const n of b.operators) {
        setOpSt(n, `${LOADING_PREFIX} ${b.name}`);
        const r = opRoleOf(n) || "versand";
        const fn = opFnOf(n) || "load";
        await upsertPresence({ name: n, role: r, func: fn, status: `${LOADING_PREFIX} ${b.name}` });
      }
    }
    await cycleBaySupa(b, dir);
    if (b.status === "KONIEC" && (dir === "next" ? next("KONIEC") : prev("KONIEC")) === "PUSTE") {
      for (const n of b.operators) {
        setOpSt(n, FREE_STATUS);
        const r = opRoleOf(n) || "versand";
        const fn = opFnOf(n) || "load";
        await upsertPresence({ name: n, role: r, func: fn, status: FREE_STATUS });
      }
    }
  }

  async function move(from: number, to: number) {
    try {
      await moveBetweenBays(from, to);
    } catch (e) {
      console.error(e);
      toast("Błąd przeniesienia");
    }
  }

  function dragAvail(e: React.DragEvent, id: string) {
    e.dataTransfer.setData("text/plain", JSON.stringify({ kind: "available", id }));
  }
  function dragBay(e: React.DragEvent, from: number, id: string) {
    e.dataTransfer.setData("text/plain", JSON.stringify({ kind: "bay", from, id }));
  }
  function dropBay(e: React.DragEvent, to: number) {
    e.preventDefault();
    try {
      const p = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (p.kind === "available") {
        const t = tr.find((x) => x.id === p.id);
        if (!t) return;
        setConfirm({ open: true, kind: "assign", toBay: to, truck: t });
        setOpsSel(isWorker ? [us!.name] : []);
      } else if (p.kind === "bay") {
        const src = by.find((b) => b.id === p.from);
        if (!src || !src.truck || p.from === to) return;
        setConfirm({ open: true, kind: "move", from: p.from, to, truck: src.truck });
      }
    } catch {}
  }

  function resetUI() {
    setOps((p) => Object.fromEntries(Object.keys(p).map((k) => [k, FREE_STATUS])));
    setOpsFn({});
    setSearch("");
    toast(lang === "pl" ? "Wyczyszczono stan UI" : "UI zurückgesetzt");
  }

  const dotColor = (st: string) =>
    st === FREE_STATUS ? "dot-green" : st === BREAK_STATUS ? "dot-red" : st.startsWith("Ładuje") || st.startsWith("Lädt") ? "dot-blue" : "dot-gray";

  // === RENDERERY LIST OPERATORÓW ===
  function renderOpsList(which: "load" | "unload") {
    const all = Object.keys(ops).map((n) => ({
      name: n,
      status: ops[n],
      fn: (opsFn[n] || opFnOf(n) || "load") as "load" | "unload",
      role: (opRoleOf(n) || "versand") as Role,
    }));
    const list = all.filter((x) => x.fn === which);

    if (list.length === 0) return <div className="center-muted">{t("noOps")}</div>;

    return (
      <table className="table slim">
        <thead>
          <tr>
            <th>{t("name")}</th>
            <th>{t("status")}</th>
            <th>{t("actions")}</th>
          </tr>
        </thead>
        <tbody>
          {list.map(({ name: n, status: st }) => {
            const me = us?.name === n;
            const can = me && (st === FREE_STATUS || st === BREAK_STATUS);
            const fn = (opsFn[n] || opFnOf(n) || "load") as "load" | "unload";
            return (
              <tr key={`${which}-${n}`}>
                <td>
                  <span className={`dot ${dotColor(st)}`} />
                  <b>{n}</b>
                </td>
                <td>{st}</td>
                <td>
                  {me ? (
                    <button
                      className="btn"
                      disabled={!can}
                      onClick={async () => {
                        const newStatus = st === BREAK_STATUS ? FREE_STATUS : BREAK_STATUS;
                        setOps((p) => ({ ...p, [n]: newStatus }));
                        if (presenceCtl && us && us.role !== "dispatcher" && us.name === n) {
                          presenceCtl.update({ status: newStatus });
                        } else {
                          const r = opRoleOf(n) || "versand";
                          await upsertPresence({ name: n, role: r, func: fn, status: newStatus }).catch(() => {});
                        }
                      }}
                    >
                      {st === BREAK_STATUS ? t("backFree") : t("setBreak")}
                    </button>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  function renderOpsByRole() {
    const all = Object.keys(ops).map((n) => ({
      name: n,
      status: ops[n],
      fn: (opsFn[n] || opFnOf(n) || "load") as "load" | "unload",
      role: (opRoleOf(n) || "versand") as Role,
    }));

    const roles: Role[] = ["wareneingang", "mobel", "versand"];
    const groups = roles.map((r) => ({ role: r, items: all.filter((x) => x.role === r) }));

    return (
      <div className="col" style={{ gap: 8 }}>
        {groups.map((g) => (
          <div key={g.role} className="oprole">
            <div className="muted fs-12" style={{ marginBottom: 6 }}>
              {g.role === "wareneingang" ? "Wareneingang" : g.role === "mobel" ? "Möbel" : "Versand"}
            </div>
            {g.items.length === 0 ? (
              <div className="center-muted">—</div>
            ) : (
              <div className="col" style={{ gap: 6 }}>
                {g.items.map((u) => (
                  <div key={`${g.role}-${u.name}`} className="row" style={{ justifyContent: "space-between" }}>
                    <div>
                      <span className={`dot ${dotColor(u.status)}`} />
                      <b>{u.name}</b>
                    </div>
                    <div className="muted fs-12">{u.status}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="container">
      <div className="toolbar" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="fw-600">{us ? `${us.name} (${us.role})` : I[lang].notLogged}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {isDisp && (
            <button className="btn" onClick={() => setAddOpen(true)}>
              {I[lang].addManual}
            </button>
          )}
          {!us ? (
            <button className="btn" onClick={() => setLoginOpen(true)}>
              {I[lang].login}
            </button>
          ) : (
            <button
              className="btn"
              onClick={async () => {
                if (presenceCtl) {
                  presenceCtl.stop();
                  setPresenceCtl(null);
                }
                if (us && us.role !== "dispatcher") {
                  await deletePresence(us.name).catch(() => {});
                }
                setUs(null);
              }}
            >
              {I[lang].logout}
            </button>
          )}
          <button className="btn" onClick={resetUI}>
            {I[lang].reset}
          </button>
        </div>
      </div>

      {/* Status operatorów — 3 sekcje */}
      <div className="card">
        <div className="row wrap" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div className="col opcol">
            <div className="opcol-title">{lang === "pl" ? "Załadunki" : "Beladung"}</div>
            {renderOpsList("load")}
          </div>
          <div className="col opcol">
            <div className="opcol-title">{lang === "pl" ? "Rozładunki" : "Entladung"}</div>
            {renderOpsList("unload")}
          </div>
          <div className="col opcol">
            <div className="opcol-title">Wareneingang / Möbel / Versand</div>
            {renderOpsByRole()}
          </div>
        </div>
      </div>

      {/* Place */}
      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>{I[lang].bays}</div>
        <div className="grid" style={{ gap: 12 }}>
          {by
            .filter((b) => showBay(b.name))
            .map((b) => {
              const st = b.startedAt ? +new Date(b.startedAt) : undefined;
              const en = b.endedAt ? +new Date(b.endedAt) : undefined;
              return (
                <div
                  key={b.id}
                  className="card"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => dropBay(e, b.id)}
                  draggable={!!b.truck}
                  onDragStart={(e) => b.truck && dragBay(e, b.id, b.truck.id)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <b>{b.name}</b>
                    <span className="badge">{TLABEL(b.status as BayState)}</span>
                  </div>

                  {!b.truck ? (
                    <div className="center-muted">
                      <div style={{ marginBottom: 8 }}>{I[lang].noAssign}</div>
                      <div className="col" style={{ gap: 8, alignItems: "center" }}>
                        <button
                          className="btn"
                          onClick={() => {
                            setDlgBay(b);
                            setOpsOnly(false);
                            setOpsSel(isWorker ? [us!.name] : []);
                            setSelTruckId("");
                          }}
                        >
                          {I[lang].assignTruck}
                        </button>
                        <button
                          className="btn"
                          onClick={() => {
                            setDlgBay(b);
                            setOpsOnly(true);
                            setOpsSel(isWorker ? [us!.name] : []);
                            setSelTruckId("");
                          }}
                        >
                          {I[lang].assignOps}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="row justify-between items-center mb-8" style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <div className="fw-600">{b.truck.rejestracja}</div>
                        <div className="row gap-8" style={{ display: "flex", gap: 8 }}>
                          <button
                            className="btn"
                            onClick={() => {
                              setDlgBay(b);
                              setOpsOnly(true);
                              setOpsSel(b.operators);
                            }}
                          >
                            {I[lang].operators}
                          </button>
                          <button className="btn" onClick={() => unassign(b.id)} title="x">
                            ✖
                          </button>
                        </div>
                      </div>

                      <div className="muted mb-8 fs-12" style={{ marginBottom: 8 }}>
                        {I[lang].operators}: {b.operators.length ? b.operators.join(", ") : "—"}
                      </div>

                      <div className="fs-12">
                        {b.truck.dzial && (
                          <div>
                            <span className="muted">{I[lang].dept}</span> {b.truck.dzial}
                          </div>
                        )}
                        {b.truck.spedycja && (
                          <div>
                            <span className="muted">{I[lang].sped}</span> {b.truck.spedycja}
                          </div>
                        )}
                        {b.truck.towar && (
                          <div>
                            <span className="muted">{I[lang].cargo}</span> {b.truck.towar}
                          </div>
                        )}
                        {(b.truck.iloscPojemnikow || b.truck.eta) && (
                          <div className="row gap-12 mt-8" style={{ display: "flex", gap: 12, marginTop: 8 }}>
                            {b.truck.iloscPojemnikow && (
                              <span>
                                <span className="muted">{I[lang].cnt}</span> {b.truck.iloscPojemnikow}
                              </span>
                            )}
                            {b.truck.eta && (
                              <span>
                                <span className="muted">{I[lang].eta}</span> {b.truck.eta}
                              </span>
                            )}
                          </div>
                        )}
                        {b.truck.uwagi && (
                          <div className="muted mt-8" style={{ marginTop: 8 }}>
                            {I[lang].notes} {b.truck.uwagi}
                          </div>
                        )}
                      </div>

                      {(b.status === "START" || b.status === "KONIEC") && (
                        <div className="muted mt-8 fs-12" style={{ marginTop: 8 }}>
                          {I[lang].loadTime} <b>{formatDur(b.status === "START" ? (st ? Date.now() - st : undefined) : st && en ? en - st : undefined)}</b>
                        </div>
                      )}

                      <div className="row justify-between items-center mt-8" style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                        <div className="fs-12">
                          {I[lang].state} <b>{TLABEL(b.status as BayState)}</b>
                        </div>
                        <div className="row gap-8" style={{ display: "flex", gap: 8 }}>
                          <button className="btn" onClick={() => cycle(b.id, "prev")}>
                            {I[lang].left}
                          </button>
                          <button className="btn" onClick={() => cycle(b.id, "next")}>
                            {I[lang].right}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Dostępne ciężarówki */}
      <div className="card" style={{ marginTop: 12 }}>
        <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="card-title" style={{ fontWeight: 600 }}>
            {I[lang].available} ({avail.length})
          </span>
          <div className="row gap-8 items-center" style={{ display: "flex", gap: 8 }}>
            {isDisp && (
              <button className="btn" onClick={() => setAddOpen(true)}>
                {I[lang].addManual}
              </button>
            )}
            <input className="input" placeholder={I[lang].search} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="card-body" style={{ marginTop: 8 }}>
          {avail.length === 0 ? (
            <div className="center-muted">{I[lang].noAssign}</div>
          ) : (
            <div className="col gap-10" style={{ display: "grid", gap: 10 }}>
              {avail.map((tk) => (
                <div key={tk.id} className="card p-10" draggable onDragStart={(e) => dragAvail(e, tk.id)}>
                  <div className="row justify-between items-center" style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div className="fw-600">{tk.rejestracja}</div>
                      <div className="muted fs-12">
                        {(tk.dzial ? tk.dzial + " • " : "")}
                        {tk.spedycja || "—"} {tk.towar ? `• ${tk.towar}` : ""} {tk.eta ? `• ETA ${tk.eta}` : ""}
                      </div>
                    </div>
                    <span className="badge">{I[lang].ready}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Już załadowane */}
      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>{I[lang].done}</div>
        {dn.length === 0 ? (
          <div className="center-muted">{I[lang].doneHint}</div>
        ) : (
          <div className="col gap-10" style={{ display: "grid", gap: 10 }}>
            {dn.map((tk) => (
              <div key={tk.id + "-" + tk.completedAt} className="card p-10">
                <div className="row justify-between items-center" style={{ display: "flex", justifyContent: "space-between" }}>
                  <div className="fw-600">{tk.rejestracja}</div>
                  <span className="badge">{tk.bayName}</span>
                </div>
                <div className="muted mt-8 fs-12" style={{ marginTop: 8 }}>
                  {(tk.dzial ? tk.dzial + " • " : "")}
                  {tk.spedycja || "—"} {tk.towar ? `• ${tk.towar}` : ""} {tk.iloscPojemnikow ? `• ${tk.iloscPojemnikow} ${lang === "pl" ? "szt." : "Stk."}` : ""}
                </div>
                <div className="muted mt-8 fs-12" style={{ marginTop: 8 }}>
                  {new Date(tk.completedAt).toLocaleString()} {tk.durationMs ? `• ${formatDur(tk.durationMs)}` : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal dodawania ciężarówki */}
      <Modal open={!!addOpen} onClose={() => setAddOpen(false)} title={I[lang].addManual}>
        <div className="col gap-8" style={{ display: "grid", gap: 8 }}>
          <input className="input" placeholder={I[lang].regReq} value={f.rejestracja} onChange={(e) => setF({ ...f, rejestracja: e.target.value })} />
          <select className="input" value={f.dzial} onChange={(e) => setF({ ...f, dzial: e.target.value as any })}>
            <option value="Versand">Versand</option>
            <option value="Wareneingang">Wareneingang</option>
            <option value="Möbel">Möbel</option>
            <option value="Werkzeugbau">Werkzeugbau</option>
          </select>
          <input className="input" placeholder={I[lang].sped.replace(":", "")} value={f.spedycja} onChange={(e) => setF({ ...f, spedycja: e.target.value })} />
          <input className="input" placeholder={I[lang].cargoShort} value={f.towar} onChange={(e) => setF({ ...f, towar: e.target.value })} />
          <input className="input" placeholder={I[lang].cntShort} value={f.iloscPojemnikow} onChange={(e) => setF({ ...f, iloscPojemnikow: e.target.value })} />
          <input className="input" placeholder={I[lang].eta.replace(":", "")} value={f.eta} onChange={(e) => setF({ ...f, eta: e.target.value })} />
          <input className="input" placeholder={I[lang].notesShort} value={f.uwagi} onChange={(e) => setF({ ...f, uwagi: e.target.value })} />
        </div>
        <div className="row justify-between mt-8" style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <button className="btn" onClick={() => setAddOpen(false)}>
            {I[lang].cancel}
          </button>
          <button className="btn" onClick={addTruck}>
            {I[lang].add}
          </button>
        </div>
      </Modal>

      {/* Modal logowania */}
      <Modal open={!us || loginOpen} onClose={() => (us ? setLoginOpen(false) : undefined)} title={I[lang].loginTitle}>
        <div className="col gap-8" style={{ display: "grid", gap: 8 }}>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="dispatcher">{I[lang].roleDisp}</option>
            <option value="versand">{I[lang].roleVersand}</option>
            <option value="wareneingang">{I[lang].roleWE}</option>
            <option value="mobel">{I[lang].roleMobel}</option>
          </select>
          <input className="input" placeholder={I[lang].firstName} value={name} onChange={(e) => setName(e.target.value)} />
          {role === "dispatcher" ? (
            <input className="input" type="password" placeholder={I[lang].password} value={pwd} onChange={(e) => setPwd(e.target.value)} />
          ) : (
            <>
              <input className="input" placeholder={I[lang].pin} value={pin} maxLength={4} onChange={(e) => setPin(e.target.value)} />
              <select className="input" value={func} onChange={(e) => setFunc(e.target.value as Fn)}>
                <option value="load">{I[lang].load}</option>
                <option value="unload">{I[lang].unload}</option>
              </select>
            </>
          )}
        </div>
        <div className="row justify-between mt-8" style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <button className="btn" onClick={() => (us ? setLoginOpen(false) : undefined)}>
            {I[lang].cancel}
          </button>
          <button
            className="btn"
            onClick={async () => {
              if (role === "dispatcher") {
                if (!name.trim() || !getDispatchers().includes(name)) {
                  toast(I[lang].badName);
                  return;
                }
                if (!checkDispatcher(name, pwd)) {
                  toast(I[lang].badPwd);
                  return;
                }
                setUs({ name, role: "dispatcher" });
                toast(I[lang].loggedDisp);
                setLoginOpen(false);
              } else {
                if (!name.trim()) {
                  toast(lang === "pl" ? "Podaj imię operatora" : "Bitte Name eingeben");
                  return;
                }
                const rec = getOpRec(name);
                if (!rec || rec.role !== role) {
                  toast(I[lang].badName);
                  return;
                }
                if (!pin || pin.length !== 4 || !opPinOk(name, pin)) {
                  toast(I[lang].badPwd);
                  return;
                }
                setUs({ name, role, func });
                ens(name);
                setOpsFn((p) => ({ ...p, [name]: func }));
                toast(I[lang].loggedOp);
                setLoginOpen(false);
              }
            }}
          >
            {I[lang].login}
          </button>
        </div>
      </Modal>

      {/* Modal: przypisanie ciężarówki / operatorów */}
      <Modal
        open={!!dlgBay}
        onClose={() => {
          setDlgBay(null);
          setOpsSel([]);
          setOpsOnly(false);
          setSelTruckId("");
          setTruckQuery("");
        }}
        title={
          dlgBay
            ? opsOnly
              ? lang === "pl"
                ? `Wybierz operatorów – ${dlgBay.name}`
                : `Operatoren wählen – ${dlgBay.name}`
              : lang === "pl"
                ? `Wybierz ciężarówkę i operatorów – ${dlgBay.name}`
                : `LKW und Operatoren wählen – ${dlgBay.name}`
            : ""
        }
      >
        {dlgBay && (
          <div className="col" style={{ gap: 10 }}>
            {!opsOnly && (
              <>
                <input className="input" placeholder={I[lang].search} value={truckQuery} onChange={(e) => setTruckQuery(e.target.value)} />
                <div className="col" style={{ gap: 8, maxHeight: 260, overflow: "auto" }}>
                  {avail
                    .filter((tk) => {
                      const q = truckQuery.trim().toLowerCase();
                      if (!q) return true;
                      return (
                        tk.rejestracja.toLowerCase().includes(q) ||
                        (tk.spedycja || "").toLowerCase().includes(q) ||
                        (tk.towar || "").toLowerCase().includes(q)
                      );
                    })
                    .map((tk) => (
                      <label
                        key={tk.id}
                        className="card"
                        style={{ padding: 8, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                        onClick={() => setSelTruckId(tk.id)}
                      >
                        <div>
                          <div className="fw-600">{tk.rejestracja}</div>
                          <div className="muted fs-12">
                            {(tk.dzial ? tk.dzial + " • " : "")}
                            {tk.spedycja || "—"} {tk.towar ? `• ${tk.towar}` : ""} {tk.eta ? `• ETA ${tk.eta}` : ""}
                          </div>
                        </div>
                        <input type="radio" checked={selTruckId === tk.id} readOnly />
                      </label>
                    ))}
                  {avail.length === 0 && <div className="center-muted">{I[lang].noAssign}</div>}
                </div>
              </>
            )}

            <div className="fs-12">{I[lang].pickOps}</div>
            <div className="row wrap" style={{ gap: 8 }}>
              {Object.entries(ops).map(([n, st]) => {
                const disabled = st !== FREE_STATUS;
                const selected = opsSel.includes(n);
                const fnL = (opsFn[n] || opFnOf(n) || "load") === "load" ? I[lang].load : I[lang].unload;
                return (
                  <button
                    key={n}
                    className={`pill ${selected ? "is-selected" : ""}`}
                    disabled={disabled}
                    onClick={() => setOpsSel((p) => (selected ? p.filter((x) => x !== n) : p.length >= 3 ? p : [...p, n]))}
                  >
                    {n}
                    <span className="muted fs-10" style={{ marginLeft: 4 }}>
                      {fnL}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="row" style={{ justifyContent: "space-between", marginTop: 8 }}>
              <button
                className="btn"
                onClick={() => {
                  setDlgBay(null);
                  setOpsSel([]);
                  setOpsOnly(false);
                  setSelTruckId("");
                  setTruckQuery("");
                }}
              >
                {I[lang].cancel}
              </button>

              {opsOnly ? (
                <button className="btn" onClick={() => saveOperators(dlgBay.id, opsSel)}>
                  {lang === "pl" ? "Zapisz operatorów" : "Operatoren speichern"}
                </button>
              ) : (
                <button
                  className="btn"
                  disabled={!selTruckId}
                  onClick={() => {
                    const tk = avail.find((x) => x.id === selTruckId);
                    if (!tk) return;
                    doAssign(dlgBay.id, tk, opsSel);
                  }}
                >
                  {I[lang].confirm}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Popup: przydział operatora */}
      <Modal open={!!notify} onClose={() => setNotify(null)} title={I[lang].popupAssign}>
        {notify && (
          <div className="col" style={{ gap: 10 }}>
            <div style={{ fontWeight: 600 }}>
              {lang === "pl" ? (
                <>
                  {I[lang].popupMsg} <u>{notify.bayName}</u>.
                </>
              ) : (
                <>
                  {I[lang].popupMsg} <u>{notify.bayName}</u>.
                </>
              )}
            </div>
            <div className="card">
              <div className="fw-600">{notify.truck.rejestracja}</div>
              <div className="muted fs-12">
                {(notify.truck.dzial ? notify.truck.dzial + " • " : "")}
                {notify.truck.spedycja || "—"}
                {notify.truck.towar ? ` • ${notify.truck.towar}` : ""}
                {notify.truck.iloscPojemnikow ? ` • ${notify.truck.iloscPojemnikow} ${lang === "pl" ? "szt." : "Stk."}` : ""}
                {notify.truck.eta ? ` • ETA ${notify.truck.eta}` : ""}
              </div>
              {notify.truck.uwagi && (
                <div className="muted fs-12" style={{ marginTop: 6 }}>
                  {lang === "pl" ? "Uwagi: " : "Hinweise: "}
                  {notify.truck.uwagi}
                </div>
              )}
            </div>
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button className="btn" onClick={() => setNotify(null)}>
                OK
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* FAB – pływający przycisk akcji */}
      <div style={{ position: "fixed", right: 16, bottom: 16, zIndex: 1000 }}>
        {fabOpen && (
          <div
            style={{
              background: "#fff",
              border: "1px solid #dbe4ff",
              borderRadius: 12,
              padding: 8,
              marginBottom: 8,
              boxShadow: "0 10px 24px rgba(2,8,23,.18)",
              minWidth: 180,
            }}
          >
            <div className="col" style={{ gap: 6 }}>
              <button
                className="btn"
                onClick={() => {
                  setLang((p) => (p === "pl" ? "de" : "pl"));
                  setFabOpen(false);
                }}
              >
                {lang === "pl" ? "🇩🇪 Przełącz na DE" : "🇵🇱 Weź PL"}
              </button>
              {isDisp && (
                <button
                  className="btn"
                  onClick={() => {
                    setAddOpen(true);
                    setFabOpen(false);
                  }}
                >
                  {I[lang].addManual}
                </button>
              )}
              {!us ? (
                <button
                  className="btn"
                  onClick={() => {
                    setLoginOpen(true);
                    setFabOpen(false);
                  }}
                >
                  {I[lang].login}
                </button>
              ) : (
                <button
                  className="btn"
                  onClick={async () => {
                    if (presenceCtl) {
                      presenceCtl.stop();
                      setPresenceCtl(null);
                    }
                    if (us && us.role !== "dispatcher") {
                      await deletePresence(us.name).catch(() => {});
                    }
                    setUs(null);
                    setFabOpen(false);
                  }}
                >
                  {I[lang].logout}
                </button>
              )}
            </div>
          </div>
        )}
        <button
          className="btn"
          onClick={() => setFabOpen((p) => !p)}
          aria-label="actions"
          style={{
            width: 56,
            height: 56,
            borderRadius: 999,
            display: "grid",
            placeItems: "center",
            fontSize: 22,
            boxShadow: "0 10px 24px rgba(29,78,216,.35)",
          }}
          title="Akcje"
        >
          {fabOpen ? "✕" : "+"}
        </button>
      </div>
    </div>
  );
}

function formatDur(ms?: number) {
  if (!ms || ms < 0) return "—";
  const s = Math.floor(ms / 1e3);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return h ? `${h} h ${m} min` : m ? `${m} min` : `${ss} s`;
}
