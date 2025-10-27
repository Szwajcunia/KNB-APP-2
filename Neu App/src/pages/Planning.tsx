import { useLang, i18n } from '../i18n'

export default function Planning(){
  const [lang] = useLang()
  return (
    <div className="card">
      <div className="card-header">{i18n[lang].tab_planning}</div>
      <div className="card-body">
        <p style={{color:'#64748b'}}>Hier verbinden Sie geplante LKW mit bereits vorbereiteten Lade-Listen (Panel 3). Diese Seite ist ein Skelett – logika planowania zostanie dołączona po zaakceptowaniu bazy danych.</p>
      </div>
    </div>
  )
}
