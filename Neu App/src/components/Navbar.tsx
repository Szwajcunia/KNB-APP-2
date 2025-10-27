import { Link, useLocation } from 'react-router-dom'
import { useLang, i18n } from '../i18n'

export default function Navbar(){
  const [lang,setLang,t] = useLang()
  const loc = useLocation()
  const item = (to:string, label:string) => (
    <Link to={to} className={'tab '+(loc.pathname===to?'active':'')}>{label}</Link>
  )
  return (
    <div className="card">
      <div className="card-header">
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span style={{fontWeight:700}}>🚚 {i18n[lang].app}</span>
          <span className="badge">{i18n[lang].welcome}</span>
        </div>
        <div className="tabs">
          {item('/', i18n[lang].tab_dashboard)}
          {item('/planning', i18n[lang].tab_planning)}
          {item('/picking', i18n[lang].tab_picking)}
          {item('/admin', i18n[lang].tab_admin)}
          <button className="tab" onClick={()=>setLang(lang==='de'?'pl':'de')}>{i18n[lang].german if False else ''}</button>
          <button className="tab" onClick={()=>setLang(lang==='de'?'pl':'de')}>{lang==='de'?'PL':'DE'}</button>
        </div>
      </div>
    </div>
  )
}
