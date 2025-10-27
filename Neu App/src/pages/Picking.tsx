import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useLang, i18n } from '../i18n'
import { toast } from '../components/toast'

type PickingRow = {
  id: string
  list_no: string
  list_name: string
  unload_place: string
  planned_time: string | null
  planned_qty: number | null
  actual_qty: number | null
  notes: string | null
  status: 'open'|'in_progress'|'done'
  created_at?: string
}

export default function Picking(){
  const [lang] = useLang()
  const [rows,setRows] = useState<PickingRow[]>([])
  const [q,setQ] = useState('')

  async function load(){
    const { data, error } = await supabase.from('picking_lists')
      .select('*').order('planned_time', { ascending: true })
    if(error){ toast(error.message); return }
    setRows(data as any||[])
  }
  useEffect(()=>{ load()
    const ch = supabase.channel('realtime:picking')
      .on('postgres_changes',{event:'*',schema:'public',table:'picking_lists'},load)
      .subscribe()
    return ()=>{ supabase.removeChannel(ch) }
  },[])

  async function addDemo(){
    const { error } = await supabase.from('picking_lists').insert({
      list_no: 'PL-'+Math.floor(10000+Math.random()*89999),
      list_name: 'Kommissionierliste',
      unload_place: 'Versand',
      planned_time: new Date().toISOString(),
      planned_qty: 120,
      actual_qty: 0,
      status: 'open',
      notes: null
    })
    if(error) toast(error.message); else toast('Liste hinzugefügt')
  }
  async function updateQty(id:string, delta:number){
    const row = rows.find(r=>r.id===id); if(!row) return
    const next = Math.max(0,(row.actual_qty||0)+delta)
    const { error } = await supabase.from('picking_lists').update({ actual_qty: next }).eq('id',id)
    if(error) toast(error.message)
  }
  async function setStatus(id:string,status:PickingRow['status']){
    const { error } = await supabase.from('picking_lists').update({ status }).eq('id',id)
    if(error) toast(error.message)
  }
  async function remove(id:string){
    if(!confirm('Diese Liste löschen?')) return
    const { error } = await supabase.from('picking_lists').delete().eq('id',id)
    if(error) toast(error.message)
  }

  const filtered = useMemo(()=>{
    const s = q.toLowerCase().trim()
    if(!s) return rows
    return rows.filter(r=> [r.list_no,r.list_name,r.unload_place].some(x=> (x||'').toLowerCase().includes(s)))
  },[q,rows])

  return (
    <div className="card">
      <div className="card-header">
        <span>{i18n[lang].tab_picking}</span>
        <div style={{display:'flex',gap:8}}>
          <input className="input" placeholder={i18n[lang].search} value={q} onChange={e=>setQ(e.target.value)} style={{width:260}}/>
          <button className="btn" onClick={addDemo}>Demo hinzufügen</button>
        </div>
      </div>
      <div className="card-body">
        {filtered.length===0? <div style={{color:'#64748b'}}>{i18n[lang].no_data}</div> : (
          <table className="table">
            <thead>
              <tr>
                <th>Nr</th><th>Name</th><th>Ort</th><th>Plan-Zeit</th><th>Plan</th><th>Ist</th><th>Status</th><th>Notiz</th><th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r=> (
                <tr key={r.id}>
                  <td>{r.list_no}</td>
                  <td>{r.list_name}</td>
                  <td>{r.unload_place}</td>
                  <td>{r.planned_time? new Date(r.planned_time).toLocaleString(): '—'}</td>
                  <td>{r.planned_qty??'—'}</td>
                  <td>
                    <div style={{display:'flex',gap:6,alignItems:'center'}}>
                      <button className="btn outline" onClick={()=>updateQty(r.id,-1)}>-</button>
                      <b>{r.actual_qty??0}</b>
                      <button className="btn outline" onClick={()=>updateQty(r.id,1)}>+</button>
                    </div>
                  </td>
                  <td>
                    <select className="select" value={r.status} onChange={e=>setStatus(r.id,e.target.value as any)}>
                      <option value="open">offen</option>
                      <option value="in_progress">in Arbeit</option>
                      <option value="done">fertig</option>
                    </select>
                  </td>
                  <td>
                    <input className="input" defaultValue={r.notes||''} onBlur={async(e)=>{
                      const { error } = await supabase.from('picking_lists').update({ notes: e.target.value }).eq('id',r.id)
                      if(error) toast(error.message)
                    }}/>
                  </td>
                  <td>
                    <button className="btn outline" onClick={()=>remove(r.id)}>Löschen</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
