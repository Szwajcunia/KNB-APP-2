import { useEffect, useState } from 'react'
import { useLang, i18n } from '../i18n'

type Bay = { id:number; name:string; status:'PUSTE'|'OCZEKUJE'|'START'|'KONIEC'; truck?:string|null }
const BAY_NAMES = ['Silo','Kalthalle','Wareneingang','Tor 3 + Werkzeug','Versand Platz 1','Versand Platz 2','Versand Platz 3','Möbel']

export default function Dashboard(){
  const [lang] = useLang()
  const [bays,setBays] = useState<Bay[]>(BAY_NAMES.map((n,i)=>({id:i+1,name:n,status:'PUSTE',truck:null})))

  return (
    <div className="card">
      <div className="card-header">{i18n[lang].tab_dashboard}</div>
      <div className="card-body">
        <div className="grid">
          {bays.map(b=>(
            <div key={b.id} className="card" style={{gridColumn:'span 4'}}>
              <div className="card-header">
                <span>{b.name}</span>
                <span className="badge">{b.status==='PUSTE'?'Frei':b.status}</span>
              </div>
              <div className="card-body">
                <div style={{color:'#64748b',fontSize:14}}>{b.truck?`LKW: ${b.truck}`:'Keine Zuweisung'}</div>
                <div style={{display:'flex',gap:8,marginTop:8}}>
                  <button className="btn outline" onClick={()=>setBays(prev=>prev.map(x=>x.id===b.id?{...x,truck:'WGM 20202',status:'OCZEKUJE'}:x))}>LKW zuweisen</button>
                  <button className="btn outline" onClick={()=>setBays(prev=>prev.map(x=>x.id===b.id?{...x,truck:null,status:'PUSTE'}:x))}>Leeren</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
