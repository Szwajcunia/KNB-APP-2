import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import "../style.css";

type Lang = "de" | "pl";
type BayState = "FREI" | "WARTET" | "START" | "ENDE";

type Truck = {
  id: string;
  plate: string;
  dept?: "Versand" | "Wareneingang" | "Möbel" | "Werkzeugbau" | null;
  forwarder?: string | null;
  goods?: string | null;
  cnt?: string | null;
  eta?: string | null;
  notes?: string | null;
  created_at?: string;
};

type Bay = {
  id: number;
  name: string;
  status: BayState;
  truck_id: string | null;
  operators: string[];
  assigned_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  updated_at?: string;
  truck?: Truck | null; // joined
};

type DoneTruck = Truck & {
  id: string;
  completed_at: string;
  bay_id: number;
  bay_name: string;
  duration_ms?: number | null;
  operators?: string[] | null;
};

type OpPresence = {
  name: string;
  status: string; // "Frei" | "Pause" | "Lädt …" | "Wolny" | "Przerwa" | "Ładuje …"
  func?: "load" | "unload";
  updated_at?: string;
};

const BAY_LIST = [
  { id: 1, name: "Silo" },
  { id: 2, name: "Kalthalle" },
  { id: 3, name: "Wareneingang" },
  { id: 4, name: "Tor 3 + Werkzeug" },
  { id: 5, name: "Versand Platz 1" },
  { id: 6, name: "Versand Platz 2" },
  { id: 7, name: "Versand Platz 3" },
  { id: 8, name: "Möbel" },
];

const ORDER: BayState[] = ["FREI", "WARTET", "START", "ENDE"];
const next = (s: BayState) => (s === "ENDE" ? "FREI" : ORDER[ORDER.indexOf(s) + 1]);
const prev = (s: BayState) => (s === "FREI" ? "ENDE" : ORDER[ORDER.indexOf(s) - 1]);

const i18n = {
  de: {
    hdr: "Plätze & LKW",
    ops: "Operatorstatus",
    name: "Name",
    func: "Funktion",
    load: "Beladung",
    unload: "Entladung",
    status: "Status",
    action: "Aktion",
    pause: "Status: Pause",
    toFree: "Zurück: Frei",
    noOps: "Keine Operatoren. Bitte anmelden.",
    noAssign: "Keine Zuweisung",
    ready: "Bereit",
    avail: "Verfügbare LKW",
    search: "Suchen…",
    done: "Bereits beladen",
    fillAfter: "Liste füllt sich nach Abschluss (ENDE → FREI).",
    assignTruck: "LKW zuweisen",
    operators: "Operatoren",
    dept: "Abteilung:",
    fwd: "Spedition:",
    goods: "Ware:",
    cnt: "Behälter:",
    eta: "ETA:",
    notes: "Hinweise:",
    state: "Status:",
    started: "Beladung gestartet",
    ended: "Beendet + Dokumente",
    waiting: "Wartet",
    free: "Frei",
    confirm: "Bestätigen",
    cancel: "Abbrechen",
    pickOps: "Operatoren (max. 3, nur Frei)",
    pickTruck: "LKW",
    move: "Verschieben",
    confirmAssign: (b: string) => `Zuweisung bestätigen — ${b}`,
    confirmMove: (a: string, b: string) => `Verschieben — ${a} → ${b}`,
    sla: "SLA",
    addManual: "Manuell hinzufügen",
    dragHandle: "Ziehen",
  },
  pl: {
    hdr: "Place i ciężarówki",
    ops: "Status operatorów",
    name: "Imię",
    func: "Funkcja",
    load: "Załadunek",
    unload: "Rozładunek",
    status: "Status",
    action: "Akcja",
    pause: "Ustaw: Przerwa",
    toFree: "Wróć: Wolny",
    noOps: "Brak operatorów. Zaloguj operatora.",
    noAssign: "Brak przypisania",
    ready: "Gotowe",
    avail: "Dostępne ciężarówki",
    search: "Szukaj…",
    done: "Już załadowane",
    fillAfter: "Lista zapełni się po zakończeniu (KONIEC → WOLNE).",
    assignTruck: "Przypisz ciężarówkę",
    operators: "Operatorzy",
    dept: "Dział:",
    fwd: "Spedycja:",
    goods: "Towar:",
    cnt: "Ilość pojemników:",
    eta: "ETA:",
    notes: "Uwagi:",
    state: "Status:",
    started: "Rozpoczęto załadunek",
    ended: "Zakończono + dokumenty",
    waiting: "Czeka",
    free: "Wolne",
    confirm: "Potwierdź",
    cancel: "Anuluj",
    pickOps: "Wybierz operatorów (max 3, tylko Wolni)",
    pickTruck: "Ciężarówka",
    move: "Przenieś",
    confirmAssign: (b: string) => `Potwierdź przydział — ${b}`,
    confirmMove: (a: string, b: string) => `Przenieś — ${a} → ${b}`,
    sla: "SLA",
    addManual: "Dodaj ręcznie",
    dragHandle: "Przeciągnij",
  },
} as const;

const Dot = ({ color }: { color: "green" | "blue" | "red" | "gray" }) => (
  <span
    style={{
      display: "inline-block",
      width: 10,
      height: 10,
      borderRadius: "50%",
      background:
        color === "green"
          ? "#16a34a"
          : color === "blue"
          ? "#2563eb"
          : color === "red"
          ? "#dc2626"
          : "#9ca3af",
      marginRight: 8,
    }}
  />
);

export default function Yard({ lang }: { lang: Lang }) {
  const t = i18n[lang];
  const FREE = lang === "de" ? "Frei" : "Wolny";
  const PAUSE = lang === "de" ? "Pause" : "Przerwa";
  const LOAD_PREFIX = lang === "de" ? "Lädt" : "Ładuje na";

  const [bays, setBays] = useState<Bay[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [done, setDone] = useState<DoneTruck[]>([]);
  const [ops, setOps] = useState<OpPresence[]>([]);
  const [search, setSearch] = useState("");

  type Confirm =
    | { open: false }
    | { open: true; kind: "assign"; toBay: number; truck: Truck }
    | { open: true; kind: "move"; from: number; to: number; truck: Truck };
  const [confirm, setConfirm] = useState<Confirm>({ open: false });
  const [confirmOps, setConfirmOps] = useState<string[]>([]);

  const [pickBay, setPickBay] = useState<Bay | null>(null);
  const [pickTruckId, setPickTruckId] = useState<string>("");
  const [pickOps, setPickOps] = useState<string[]>([]);

  // === init / fetch ===
  const ensureBays = async () => {
    const { data: existing } = await supabase.from("bays").select("id").limit(1);
    if (!existing || existing.length === 0) {
      await supabase.from("bays").insert(
        BAY_LIST.map((b) => ({
          id: b.id,
          name: b.name,
          status: "FREI",
          truck_id: null,
          operators: [],
          assigned_at: null,
          started_at: null,
          ended_at: null,
        }))
      );
    }
  };

  const fetchBays = async () => {
    const { data, error } = await supabase
      .from("bays")
      .select("*, truck:trucks(*)")
      .order("id", { ascending: true });
    if (!error && data) {
      setBays(
        data.map((b: any) => ({
          ...b,
          truck: b.truck ?? null,
          operators: (b.operators || []) as string[],
        }))
      );
    }
  };

  const fetchTrucks = async () => {
    const { data, error } = await supabase
      .from("trucks")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setTrucks(data);
  };

  const fetchDone = async () => {
    const { data, error } = await supabase
      .from("done_trucks")
      .select("*")
      .order("completed_at", { ascending: false })
      .limit(50);
    if (!error && data) setDone(data as any);
  };

  const fetchOps = async () => {
    const { data, error } = await supabase
      .from("ops_presence")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error && data) setOps(data as any);
  };

  useEffect(() => {
    (async () => {
      await ensureBays();
      await Promise.all([fetchBays(), fetchTrucks(), fetchDone(), fetchOps()]);
    })();

    const ch1 = supabase
      .channel("public:bays")
      .on("postgres_changes", { event: "*", schema: "public", table: "bays" }, fetchBays)
      .subscribe();
    const ch2 = supabase
      .channel("public:trucks")
      .on("postgres_changes", { event: "*", schema: "public", table: "trucks" }, fetchTrucks)
      .subscribe();
    const ch3 = supabase
      .channel("public:done_trucks")
      .on("postgres_changes", { event: "*", schema: "public", table: "done_trucks" }, fetchDone)
      .subscribe();
    const ch4 = supabase
      .channel("public:ops_presence")
      .on("postgres_changes", { event: "*", schema: "public", table: "ops_presence" }, fetchOps)
      .subscribe();

    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
      supabase.removeChannel(ch3);
      supabase.removeChannel(ch4);
    };
  }, []);

  // === derive ===
  const assignedTrucks = useMemo(() => new Set(bays.filter((b) => b.truck_id).map((b) => b.truck_id!)), [bays]);

  const available = useMemo(() => {
    const list = trucks.filter((t) => !assignedTrucks.has(t.id));
    if (!search.trim()) return list;
    const s = search.toLowerCase();
    return list.filter(
      (t) =>
        t.plate.toLowerCase().includes(s) ||
        (t.forwarder || "").toLowerCase().includes(s) ||
        (t.goods || "").toLowerCase().includes(s)
    );
  }, [trucks, bays, search]);

  const freeOps = useMemo(
    () => ops.filter((o) => o.status === FREE).map((o) => o.name),
    [ops, FREE]
  );

  // === actions (wszystko async!) ===
  const assignTruck = async (bay: Bay, truck: Truck, operators: string[]) => {
    const chosen = operators.slice(0, 3).filter((n) => freeOps.includes(n));

    const prev = bays;
    setBays((p) =>
      p.map((b) =>
        b.id === bay.id
          ? {
              ...b,
              truck_id: truck.id,
              truck,
              operators: chosen,
              status: "WARTET",
              assigned_at: new Date().toISOString(),
              started_at: null,
              ended_at: null,
            }
          : b
      )
    );

    try {
      const { error } = await supabase
        .from("bays")
        .update({
          truck_id: truck.id,
          operators: chosen,
          status: "WARTET",
          assigned_at: new Date().toISOString(),
          started_at: null,
          ended_at: null,
        })
        .eq("id", bay.id);
      if (error) throw error;

      for (const name of chosen) {
        await supabase.from("ops_presence").upsert({
          name,
          status: `${LOAD_PREFIX} ${bay.name}`,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (e: any) {
      alert("Błąd przypisania: " + (e.message || e));
      setBays(prev); // rollback
    }
  };

  const unassign = async (bay: Bay) => {
    const prev = bays;
    setBays((p) =>
      p.map((b) =>
        b.id === bay.id
          ? {
              ...b,
              truck_id: null,
              truck: null,
              operators: [],
              status: "FREI",
              assigned_at: null,
              started_at: null,
              ended_at: null,
            }
          : b
      )
    );

    try {
      for (const name of bay.operators || []) {
        await supabase.from("ops_presence").upsert({
          name,
          status: FREE,
          updated_at: new Date().toISOString(),
        });
      }
      const { error } = await supabase
        .from("bays")
        .update({
          truck_id: null,
          operators: [],
          status: "FREI",
          assigned_at: null,
          started_at: null,
          ended_at: null,
        })
        .eq("id", bay.id);
      if (error) throw error;
    } catch (e: any) {
      alert("Błąd odpięcia: " + (e.message || e));
      setBays(prev);
    }
  };

  const cycle = async (bay: Bay, dir: "next" | "prev") => {
    const ns = dir === "next" ? next(bay.status) : prev(bay.status);
    const nowIso = new Date().toISOString();
    const prevState = bays;

    setBays((p) =>
      p.map((b) => {
        if (b.id !== bay.id) return b;
        if (b.status !== "START" && ns === "START")
          return { ...b, status: ns, started_at: nowIso, ended_at: null };
        if (b.status !== "ENDE" && ns === "ENDE")
          return { ...b, status: ns, ended_at: nowIso };
        if (b.truck_id && b.status === "ENDE" && ns === "FREI")
          return {
            ...b,
            status: "FREI",
            truck_id: null,
            truck: null,
            operators: [],
            assigned_at: null,
            started_at: null,
            ended_at: null,
          };
        return { ...b, status: ns };
      })
    );

    try {
      if (bay.status !== "START" && ns === "START") {
        const { error } = await supabase
          .from("bays")
          .update({ status: ns, started_at: nowIso, ended_at: null })
          .eq("id", bay.id);
        if (error) throw error;
        return;
      }

      if (bay.status !== "ENDE" && ns === "ENDE") {
        const { error } = await supabase
          .from("bays")
          .update({ status: ns, ended_at: nowIso })
          .eq("id", bay.id);
        if (error) throw error;
        return;
      }

      if (bay.truck_id && bay.status === "ENDE" && ns === "FREI") {
        const st = bay.started_at ? +new Date(bay.started_at) : undefined;
        const en = bay.ended_at ? +new Date(bay.ended_at) : undefined;
        const duration = st && en ? Math.max(0, en - st) : null;
        const truck = bay.truck!;

        const [d1, d2] = await Promise.all([
          supabase.from("done_trucks").insert({
            id: truck.id,
            plate: truck.plate,
            dept: truck.dept,
            forwarder: truck.forwarder,
            goods: truck.goods,
            cnt: truck.cnt,
            eta: truck.eta,
            notes: truck.notes,
            completed_at: new Date().toISOString(),
            bay_id: bay.id,
            bay_name: bay.name,
            duration_ms: duration,
            operators: bay.operators,
          }),
          supabase.from("trucks").delete().eq("id", truck.id),
        ]);
        if (d1.error) throw d1.error;
        if (d2.error) throw d2.error;

        for (const name of bay.operators || []) {
          await supabase.from("ops_presence").upsert({
            name,
            status: FREE,
            updated_at: new Date().toISOString(),
          });
        }

        const { error } = await supabase
          .from("bays")
          .update({
            truck_id: null,
            operators: [],
            status: "FREI",
            assigned_at: null,
            started_at: null,
            ended_at: null,
          })
          .eq("id", bay.id);
        if (error) throw error;
        return;
      }

      const { error } = await supabase.from("bays").update({ status: ns }).eq("id", bay.id);
      if (error) throw error;
    } catch (e: any) {
      alert("Błąd zmiany statusu: " + (e.message || e));
      setBays(prevState);
    }
  };

  const setOpBreak = async (name: string, toPause: boolean) => {
    await supabase.from("ops_presence").upsert({
      name,
      status: toPause ? PAUSE : FREE,
      updated_at: new Date().toISOString(),
    });
  };

  const addDemoTruck = async () => {
    const id = String(Date.now());
    await supabase.from("trucks").insert({
      id,
      plate: "WGM " + Math.floor(Math.random() * 90000 + 10000),
      dept: "Versand",
      forwarder: "DHL",
      goods: "Mix",
      cnt: String(Math.floor(Math.random() * 20 + 10)),
      eta: "12:30",
      notes: "",
    });
  };

  // === drag/drop tylko na rączkach ===
  const onDragAvail = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ kind: "available", id }));
  };
  const onDragBay = (e: React.DragEvent, from: number, id: string) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ kind: "bay", from, id }));
  };
  const onDropBay = (e: React.DragEvent, to: number) => {
    e.preventDefault();
    try {
      const p = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (p.kind === "available") {
        const tk = trucks.find((x) => x.id === p.id);
        if (!tk) return;
        setConfirm({ open: true, kind: "assign", toBay: to, truck: tk });
        setConfirmOps([]);
      } else if (p.kind === "bay") {
        const src = bays.find((b) => b.id === p.from);
        if (!src || !src.truck_id || p.from === to) return;
        setConfirm({ open: true, kind: "move", from: p.from, to, truck: src.truck! });
      }
    } catch {}
  };

  const move = async (from: number, to: number) => {
    const src = bays.find((b) => b.id === from);
    const dst = bays.find((b) => b.id === to);
    if (!src || !dst || !src.truck_id) return;

    const srcPayload = dst.truck_id
      ? {
          truck_id: dst.truck_id,
          operators: dst.operators,
          status: dst.status,
          assigned_at: dst.assigned_at,
          started_at: dst.started_at,
          ended_at: dst.ended_at,
        }
      : {
          truck_id: null,
          operators: [],
          status: "FREI" as BayState,
          assigned_at: null,
          started_at: null,
          ended_at: null,
        };

    const dstPayload = {
      truck_id: src.truck_id,
      operators: src.operators,
      status: src.status,
      assigned_at: src.assigned_at ?? new Date().toISOString(),
      started_at: src.started_at,
      ended_at: src.ended_at,
    };

    await supabase.from("bays").update(srcPayload).eq("id", from);
    await supabase.from("bays").update(dstPayload).eq("id", to);
  };

  const TLABEL = (s: BayState) =>
    s === "FREI" ? t.free : s === "WARTET" ? t.waiting : s === "START" ? t.started : t.ended;

  const statusClass = (s: BayState) =>
    s === "FREI"
      ? { badge: "badge text-free", wrap: "" }
      : s === "WARTET"
      ? { badge: "badge text-wait", wrap: "bg-wait" }
      : s === "START"
      ? { badge: "badge text-start", wrap: "bg-start" }
      : { badge: "badge text-end", wrap: "bg-end" };

  const togglePickOp = (name: string) =>
    setPickOps((p) => (p.includes(name) ? p.filter((n) => n !== name) : p.length >= 3 ? p : [...p, name]));

  // === UI ===
  return (
    <div className="container">
      <div className="page-header">
        <h2>{t.hdr}</h2>
      </div>

      {/* Operatorzy */}
      <div className="card">
        <div className="card-header">
          <b>{t.ops}</b>
        </div>
        <div className="card-body">
          {ops.length === 0 ? (
            <div className="center-muted">{t.noOps}</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t.name}</th>
                  <th>{t.func}</th>
                  <th>{t.status}</th>
                  <th>{t.action}</th>
                </tr>
              </thead>
              <tbody>
                {ops.map((o) => {
                  const dot: "green" | "blue" | "red" | "gray" =
                    o.status === FREE
                      ? "green"
                      : o.status === PAUSE
                      ? "red"
                      : o.status.startsWith(LOAD_PREFIX)
                      ? "blue"
                      : "gray";
                  return (
                    <tr key={o.name}>
                      <td>
                        <Dot color={dot} />
                        <b>{o.name}</b>
                      </td>
                      <td>{o.func === "unload" ? t.unload : t.load}</td>
                      <td>{o.status}</td>
                      <td>
                        <button
                          className="btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpBreak(o.name, !(o.status === PAUSE));
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          {o.status === PAUSE ? t.toFree : t.pause}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Place */}
      <div className="grid-bays">
        {bays.map((b) => {
          const meta = statusClass(b.status);
          const warn =
            (b.status === "START" && b.started_at && Date.now() - +new Date(b.started_at) > 45 * 60 * 1000) ||
            (b.status === "WARTET" && b.assigned_at && Date.now() - +new Date(b.assigned_at) > 30 * 60 * 1000);

          return (
            <div key={b.id} className="card">
              <div className={`card-header ${b.truck_id ? meta.wrap : ""}`}>
                <b>{b.name}</b>
                <span className={meta.badge}>
                  {TLABEL(b.status)} {warn && <span style={{ color: "#dc2626", marginLeft: 6 }}>⚠ {t.sla}</span>}
                </span>
              </div>

              <div
                className="card-body"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDropBay(e, b.id)}
              >
                {!b.truck ? (
                  <div className="center-muted">
                    <div className="mb-8">{t.noAssign}</div>
                    <button
                      className="btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPickBay(b);
                        setPickTruckId("");
                        setPickOps([]);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      {t.assignTruck}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="row justify-between items-center mb-8">
                      <div className="fw-600">{b.truck?.plate}</div>
                      <div className="row gap-8">
                        <button
                          className="btn ghost drag-handle"
                          draggable
                          onDragStart={(e) => onDragBay(e, b.id, b.truck_id!)}
                          onClick={(e) => e.preventDefault()}
                          onMouseDown={(e) => e.stopPropagation()}
                          title={t.dragHandle}
                          aria-label={t.dragHandle}
                        >
                          ⠿
                        </button>
                        <button
                          className="btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            unassign(b);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          title="x"
                        >
                          ✖
                        </button>
                      </div>
                    </div>

                    <div className="muted mb-8 fs-12">
                      {t.operators}: {b.operators.length ? b.operators.join(", ") : "—"}
                    </div>

                    <div className="fs-12">
                      {b.truck?.dept && (
                        <div>
                          <span className="muted">{t.dept}</span> {b.truck.dept}
                        </div>
                      )}
                      {b.truck?.forwarder && (
                        <div>
                          <span className="muted">{t.fwd}</span> {b.truck.forwarder}
                        </div>
                      )}
                      {b.truck?.goods && (
                        <div>
                          <span className="muted">{t.goods}</span> {b.truck.goods}
                        </div>
                      )}
                      {(b.truck?.cnt || b.truck?.eta) && (
                        <div className="row gap-12 mt-8">
                          {b.truck?.cnt && (
                            <span>
                              <span className="muted">{t.cnt}</span> {b.truck.cnt}
                            </span>
                          )}
                          {b.truck?.eta && (
                            <span>
                              <span className="muted">{t.eta}</span> {b.truck.eta}
                            </span>
                          )}
                        </div>
                      )}
                      {b.truck?.notes && <div className="muted mt-8">{t.notes} {b.truck.notes}</div>}
                    </div>

                    <div className="row justify-between items-center mt-8">
                      <div className="fs-12">
                        {t.state} <b>{TLABEL(b.status)}</b>
                      </div>
                      <div className="row gap-8">
                        <button
                          className="btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            cycle(b, "prev");
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          ←
                        </button>
                        <button
                          className="btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            cycle(b, "next");
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          →
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dostępne LKW */}
      <div className="card mt-16">
        <div className="card-header">
          <span className="card-title">
            {t.avail} ({available.length})
          </span>
          <div className="row gap-8 items-center">
            <button
              className="btn"
              onClick={(e) => {
                e.stopPropagation();
                addDemoTruck();
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {t.addManual}
            </button>
            <input
              className="input"
              placeholder={t.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="card-body">
          {available.length === 0 ? (
            <div className="center-muted">{t.noAssign}</div>
          ) : (
            <div className="col gap-10">
              {available.map((tk) => (
                <div key={tk.id} className="card p-10">
                  <div className="row justify-between items-center">
                    <div>
                      <div className="fw-600">{tk.plate}</div>
                      <div className="muted fs-12">
                        {(tk.dept ? tk.dept + " • " : "")}
                        {tk.forwarder || "—"} {tk.goods ? "• " + tk.goods : ""} {tk.eta ? "• ETA " + tk.eta : ""}
                      </div>
                    </div>
                    <button
                      className="btn ghost drag-handle"
                      draggable
                      onDragStart={(e) => onDragAvail(e, tk.id)}
                      onClick={(e) => e.preventDefault()}
                      onMouseDown={(e) => e.stopPropagation()}
                      title={t.dragHandle}
                      aria-label={t.dragHandle}
                    >
                      ⠿
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* DONE */}
      <div className="card mt-16">
        <div className="card-header">
          <span className="card-title">{t.done}</span>
        </div>
        <div className="card-body">
          {done.length === 0 ? (
            <div className="center-muted">{t.fillAfter}</div>
          ) : (
            <div className="col gap-10">
              {done.map((tk) => (
                <div key={tk.id + "-" + tk.completed_at} className="card p-10">
                  <div className="row justify-between items-center">
                    <div className="fw-600">{tk.plate}</div>
                    <span className="badge">{tk.bay_name}</span>
                  </div>
                  <div className="muted mt-8 fs-12">
                    {(tk.dept ? tk.dept + " • " : "")}
                    {tk.forwarder || "—"} {tk.goods ? "• " + tk.goods : ""} {tk.cnt ? "• " + tk.cnt + " Stk." : ""}
                  </div>
                  <div className="muted mt-8 fs-12">
                    {lang === "de" ? "Operatoren" : "Operatorzy"}:{" "}
                    {tk.operators?.length ? tk.operators.join(", ") : "—"}
                  </div>
                  <div className="muted mt-8 fs-12">
                    {new Date(tk.completed_at).toLocaleString()}{" "}
                    {tk.duration_ms ? "• " + Math.round(tk.duration_ms / 60000) + " min" : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: przypisanie z listy przy pustym placu */}
      {pickBay && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setPickBay(null)}>
          <div className="modal">
            <button className="modal-close" onClick={() => setPickBay(null)} aria-label="Close">
              ✕
            </button>
            <div className="card-title mb-8">
              {t.assignTruck} – {pickBay.name}
            </div>

            <div className="mb-8">
              <div className="muted fs-12 mb-6">{t.pickTruck}</div>
              <select className="select" value={pickTruckId} onChange={(e) => setPickTruckId(e.target.value)}>
                <option value="">{lang === "de" ? "— auswählen —" : "— wybierz —"}</option>
                {available.map((tk) => (
                  <option key={tk.id} value={tk.id}>
                    {tk.plate} {tk.forwarder ? `• ${tk.forwarder}` : ""} {tk.goods ? `• ${tk.goods}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-8">
              <div className="muted fs-12 mb-6">{t.pickOps}</div>
              <div className="row wrap" style={{ gap: 8 }}>
                {freeOps.length === 0 ? (
                  <div className="muted fs-12">{lang === "de" ? "Keine freien Operatoren" : "Brak wolnych operatorów"}</div>
                ) : (
                  freeOps.map((n) => {
                    const sel = pickOps.includes(n);
                    return (
                      <button
                        key={n}
                        className={`pill ${sel ? "is-selected" : ""}`}
                        onClick={() => togglePickOp(n)}
                      >
                        {n}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="row justify-between mt-8">
              <button className="btn" onClick={() => setPickBay(null)}>
                {t.cancel}
              </button>
              <button
                className="btn"
                onClick={async () => {
                  const truck = available.find((x) => x.id === pickTruckId);
                  if (!truck) return;
                  await assignTruck(pickBay, truck, pickOps);
                  setPickBay(null);
                  setPickTruckId("");
                  setPickOps([]);
                }}
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: potwierdzenie dla DnD (assign/move) */}
      {confirm.open && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setConfirm({ open: false })}>
          <div className="modal">
            <button className="modal-close" onClick={() => setConfirm({ open: false })} aria-label="Close">
              ✕
            </button>
            {confirm.kind === "assign" ? (
              <>
                <div className="card-title mb-8">
                  {t.confirmAssign(bays.find((x) => x.id === (confirm as any).toBay)?.name || "")}
                </div>
                <div className="muted fs-12 mb-8">
                  {t.pickTruck}: {(confirm as any).truck.plate}
                </div>
                <div className="muted fs-12 mb-6">{t.pickOps}</div>
                <div className="row wrap" style={{ gap: 8, marginBottom: 12 }}>
                  {freeOps.length === 0 ? (
                    <div className="muted fs-12">
                      {lang === "de" ? "Keine freien Operatoren" : "Brak wolnych operatorów"}
                    </div>
                  ) : (
                    freeOps.map((n) => {
                      const sel = confirmOps.includes(n);
                      return (
                        <button
                          key={n}
                          className={`pill ${sel ? "is-selected" : ""}`}
                          onClick={() =>
                            setConfirmOps((p) => (p.includes(n) ? p.filter((x) => x !== n) : p.length >= 3 ? p : [...p, n]))
                          }
                        >
                          {n}
                        </button>
                      );
                    })
                  )}
                </div>
                <div className="row justify-between mt-8">
                  <button className="btn" onClick={() => setConfirm({ open: false })}>
                    {t.cancel}
                  </button>
                  <button
                    className="btn"
                    onClick={async () => {
                      await assignTruck(
                        bays.find((x) => x.id === (confirm as any).toBay)!,
                        (confirm as any).truck,
                        confirmOps
                      );
                      setConfirm({ open: false });
                      setConfirmOps([]);
                    }}
                  >
                    {t.confirm}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="card-title mb-8">
                  {t.confirmMove(
                    bays.find((x) => x.id === (confirm as any).from)?.name || "",
                    bays.find((x) => x.id === (confirm as any).to)?.name || ""
                  )}
                </div>
                <div className="row justify-between mt-8">
                  <button className="btn" onClick={() => setConfirm({ open: false })}>
                    {t.cancel}
                  </button>
                  <button
                    className="btn"
                    onClick={async () => {
                      await move((confirm as any).from, (confirm as any).to);
                      setConfirm({ open: false });
                    }}
                  >
                    {t.move}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
