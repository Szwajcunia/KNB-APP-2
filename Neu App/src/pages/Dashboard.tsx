import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import "../style.css";

type BayState = "FREI" | "WARTET" | "START" | "ENDE";
type Truck = {
  id: string;
  plate: string;
  dept?: "Versand" | "Wareneingang" | "Möbel" | "Werkzeugbau";
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
  operators: string[]; // names
  assigned_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  updated_at?: string;
  truck?: Truck | null; // joined
};

type DoneTruck = Truck & {
  id: string; // same as truck id
  completed_at: string;
  bay_id: number;
  bay_name: string;
  duration_ms?: number | null;
  operators?: string[] | null;
};

type OpPresence = {
  name: string;
  status: string; // "Frei" | "Pause" | "Lädt …"
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

export default function Dashboard() {
  const [bays, setBays] = useState<Bay[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [done, setDone] = useState<DoneTruck[]>([]);
  const [ops, setOps] = useState<OpPresence[]>([]);
  const [search, setSearch] = useState("");

  const FREE = "Frei";
  const PAUSE = "Pause";
  const LOAD_PREFIX = "Lädt";

  // ---------- fetch ----------
  async function ensureBays() {
    const { data: existing } = await supabase.from("bays").select("id");
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
  }

  async function fetchBays() {
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
  }

  async function fetchTrucks() {
    const { data, error } = await supabase
      .from("trucks")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setTrucks(data);
  }

  async function fetchDone() {
    const { data, error } = await supabase
      .from("done_trucks")
      .select("*")
      .order("completed_at", { ascending: false })
      .limit(50);
    if (!error && data) setDone(data as any);
  }

  async function fetchOps() {
    const { data, error } = await supabase
      .from("ops_presence")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error && data) setOps(data as any);
  }

  // ---------- init & realtime ----------
  useEffect(() => {
    (async () => {
      await ensureBays();
      await Promise.all([fetchBays(), fetchTrucks(), fetchDone(), fetchOps()]);
    })();

    const ch1 = supabase
      .channel("public:bays")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bays" },
        () => fetchBays()
      )
      .subscribe();

    const ch2 = supabase
      .channel("public:trucks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trucks" },
        () => fetchTrucks()
      )
      .subscribe();

    const ch3 = supabase
      .channel("public:done_trucks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "done_trucks" },
        () => fetchDone()
      )
      .subscribe();

    const ch4 = supabase
      .channel("public:ops_presence")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ops_presence" },
        () => fetchOps()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
      supabase.removeChannel(ch3);
      supabase.removeChannel(ch4);
    };
  }, []);

  const assignedTrucks = new Set(bays.filter((b) => b.truck_id).map((b) => b.truck_id!));
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
    [ops]
  );

  // ---------- actions ----------
  async function assignTruck(bay: Bay, truck: Truck, operators: string[]) {
    // verify operators are free now
    const chosen = operators.slice(0, 3).filter((n) => freeOps.includes(n));
    await supabase
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

    // set op presence to "Lädt …"
    for (const name of chosen) {
      await supabase.from("ops_presence").upsert({
        name,
        status: `${LOAD_PREFIX} ${bay.name}`,
        updated_at: new Date().toISOString(),
      });
    }
  }

  async function unassign(bay: Bay) {
    // ops back to FREE
    for (const name of bay.operators || []) {
      await supabase.from("ops_presence").upsert({
        name,
        status: FREE,
        updated_at: new Date().toISOString(),
      });
    }
    await supabase
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
  }

  async function cycle(bay: Bay, dir: "next" | "prev") {
    const ns = dir === "next" ? next(bay.status) : prev(bay.status);

    if (bay.status !== "START" && ns === "START") {
      await supabase
        .from("bays")
        .update({ status: ns, started_at: new Date().toISOString(), ended_at: null })
        .eq("id", bay.id);
      // ops set to "Lädt…" already on assign — utrzymujemy label
      return;
    }

    if (bay.status !== "ENDE" && ns === "ENDE") {
      await supabase
        .from("bays")
        .update({ status: ns, ended_at: new Date().toISOString() })
        .eq("id", bay.id);
      return;
    }

    if (bay.truck_id && bay.status === "ENDE" && ns === "FREI") {
      // move to done_trucks
      const st = bay.started_at ? +new Date(bay.started_at) : undefined;
      const en = bay.ended_at ? +new Date(bay.ended_at) : undefined;
      const duration = st && en ? Math.max(0, en - st) : null;

      const truck = bay.truck!;
      await supabase.from("done_trucks").insert({
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
      });

      // free ops
      for (const name of bay.operators || []) {
        await supabase.from("ops_presence").upsert({
          name,
          status: FREE,
          updated_at: new Date().toISOString(),
        });
      }
      // clear bay + remove truck from 'trucks'
      await supabase.from("trucks").delete().eq("id", truck.id);
      await supabase
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

      return;
    }

    await supabase.from("bays").update({ status: ns }).eq("id", bay.id);
  }

  async function setOpBreak(name: string, toPause: boolean) {
    await supabase.from("ops_presence").upsert({
      name,
      status: toPause ? PAUSE : FREE,
      updated_at: new Date().toISOString(),
    });
  }

  // demo add truck
  async function addDemoTruck() {
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
  }

  // simple assign modal (inline)
  const [pickBay, setPickBay] = useState<Bay | null>(null);
  const [pickTruckId, setPickTruckId] = useState<string>("");
  const [pickOps, setPickOps] = useState<string[]>([]);

  function toggleOp(name: string) {
    setPickOps((p) => (p.includes(name) ? p.filter((n) => n !== name) : p.length >= 3 ? p : [...p, name]));
  }

  return (
    <div className="container">
      {/* Operatorzy */}
      <div className="card">
        <div className="card-header">
          <b>Operatorstatus</b>
        </div>
        <div className="card-body">
          {ops.length === 0 ? (
            <div className="center-muted">Keine Operatoren. Bitte anmelden.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Operator</th>
                  <th>Funktion</th>
                  <th>Status</th>
                  <th>Aktion</th>
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
                      <td>{o.func === "unload" ? "Entladung" : "Beladung"}</td>
                      <td>{o.status}</td>
                      <td>
                        <button className="btn" onClick={() => setOpBreak(o.name, !(o.status === PAUSE))}>
                          {o.status === PAUSE ? "Zurück: Frei" : "Status: Pause"}
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

      {/* BAYS */}
      <div className="grid-bays">
        {bays.map((b) => {
          const warn =
            (b.status === "START" && b.started_at && Date.now() - +new Date(b.started_at) > 45 * 60 * 1000) ||
            (b.status === "WARTET" && b.assigned_at && Date.now() - +new Date(b.assigned_at) > 30 * 60 * 1000);
          const badgeClass =
            b.status === "FREI"
              ? "badge text-free"
              : b.status === "WARTET"
              ? "badge text-wait"
              : b.status === "START"
              ? "badge text-start"
              : "badge text-end";
          const wrapClass =
            b.status === "FREI"
              ? ""
              : b.status === "WARTET"
              ? "bg-wait"
              : b.status === "START"
              ? "bg-start"
              : "bg-end";

          return (
            <div key={b.id} className="card">
              <div className={`card-header ${wrapClass}`}>
                <b>{b.name}</b>
                <span className={badgeClass}>
                  {b.status === "FREI"
                    ? "Frei"
                    : b.status === "WARTET"
                    ? "Wartet"
                    : b.status === "START"
                    ? "Beladung gestartet"
                    : "Beendet + Dokumente"}
                  {warn && <span style={{ color: "#dc2626", marginLeft: 8 }}>⚠ SLA</span>}
                </span>
              </div>
              <div className="card-body">
                {!b.truck ? (
                  <div className="center-muted">
                    <div className="mb-8">Keine Zuweisung</div>
                    <div className="row" style={{ gap: 8, justifyContent: "center" }}>
                      <button className="btn" onClick={() => { setPickBay(b); setPickTruckId(""); setPickOps([]); }}>
                        LKW zuweisen
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="row justify-between items-center mb-8">
                      <div className="fw-600">{b.truck?.plate}</div>
                      <div className="row gap-8">
                        <button className="btn" onClick={() => unassign(b)} title="Lösen">
                          ✖
                        </button>
                      </div>
                    </div>
                    <div className="muted mb-8 fs-12">Operatoren: {b.operators.length ? b.operators.join(", ") : "—"}</div>
                    <div className="fs-12">
                      {b.truck?.dept && (
                        <div>
                          <span className="muted">Abteilung:</span> {b.truck.dept}
                        </div>
                      )}
                      {b.truck?.forwarder && (
                        <div>
                          <span className="muted">Spedition:</span> {b.truck.forwarder}
                        </div>
                      )}
                      {b.truck?.goods && (
                        <div>
                          <span className="muted">Ware:</span> {b.truck.goods}
                        </div>
                      )}
                      {(b.truck?.cnt || b.truck?.eta) && (
                        <div className="row gap-12 mt-8">
                          {b.truck?.cnt && (
                            <span>
                              <span className="muted">Behälter:</span> {b.truck.cnt}
                            </span>
                          )}
                          {b.truck?.eta && (
                            <span>
                              <span className="muted">ETA:</span> {b.truck.eta}
                            </span>
                          )}
                        </div>
                      )}
                      {b.truck?.notes && <div className="muted mt-8">{b.truck.notes}</div>}
                    </div>

                    <div className="row justify-between items-center mt-8">
                      <div className="fs-12">
                        Status: <b>
                          {b.status === "FREI"
                            ? "Frei"
                            : b.status === "WARTET"
                            ? "Wartet"
                            : b.status === "START"
                            ? "Beladung gestartet"
                            : "Beendet + Dokumente"}
                        </b>
                      </div>
                      <div className="row gap-8">
                        <button className="btn" onClick={() => cycle(b, "prev")}>
                          ←
                        </button>
                        <button className="btn" onClick={() => cycle(b, "next")}>
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
          <span className="card-title">Verfügbare LKW ({available.length})</span>
          <div className="row gap-8 items-center">
            <button className="btn" onClick={addDemoTruck}>
              Manuell hinzufügen
            </button>
            <input
              className="input"
              placeholder="Suchen…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="card-body">
          {available.length === 0 ? (
            <div className="center-muted">Keine Zuweisung</div>
          ) : (
            <div className="col gap-10">
              {available.map((t) => (
                <div key={t.id} className="card p-10">
                  <div className="row justify-between items-center">
                    <div>
                      <div className="fw-600">{t.plate}</div>
                      <div className="muted fs-12">
                        {(t.dept ? t.dept + " • " : "")}
                        {t.forwarder || "—"} {t.goods ? "• " + t.goods : ""} {t.eta ? "• ETA " + t.eta : ""}
                      </div>
                    </div>
                    <span className="badge">Bereit</span>
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
          <span className="card-title">Bereits beladen</span>
        </div>
        <div className="card-body">
          {done.length === 0 ? (
            <div className="center-muted">Liste füllt sich nach Abschluss (ENDE → FREI).</div>
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
                    {tk.forwarder || "—"} {tk.goods ? "• " + tk.goods : ""}{" "}
                    {tk.cnt ? "• " + tk.cnt + " Stk." : ""}
                  </div>
                  <div className="muted mt-8 fs-12">
                    Operatoren: {tk.operators?.length ? tk.operators.join(", ") : "—"}
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

      {/* Assign modal */}
      {pickBay && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setPickBay(null)}>
          <div className="modal">
            <button className="modal-close" onClick={() => setPickBay(null)} aria-label="Close">
              ✕
            </button>
            <div className="card-title mb-8">LKW & Operatoren zuweisen – {pickBay.name}</div>

            <div className="mb-8">
              <div className="muted fs-12 mb-6">LKW</div>
              <select
                className="select"
                value={pickTruckId}
                onChange={(e) => setPickTruckId(e.target.value)}
              >
                <option value="">— auswählen —</option>
                {available.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.plate} {t.forwarder ? `• ${t.forwarder}` : ""} {t.goods ? `• ${t.goods}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-8">
              <div className="muted fs-12 mb-6">Operatoren (max 3, nur Frei)</div>
              <div className="row wrap" style={{ gap: 8 }}>
                {freeOps.length === 0 ? (
                  <div className="muted fs-12">Keine freien Operatoren</div>
                ) : (
                  freeOps.map((n) => {
                    const sel = pickOps.includes(n);
                    return (
                      <button
                        key={n}
                        className={`pill ${sel ? "is-selected" : ""}`}
                        onClick={() => toggleOp(n)}
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
                Abbrechen
              </button>
              <button
                className="btn"
                onClick={async () => {
                  const truck = available.find((t) => t.id === pickTruckId);
                  if (!truck) return;
                  await assignTruck(pickBay, truck, pickOps);
                  setPickBay(null);
                  setPickTruckId("");
                  setPickOps([]);
                }}
              >
                Bestätigen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
