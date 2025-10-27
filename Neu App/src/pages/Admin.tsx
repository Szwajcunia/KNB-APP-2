import { useLang } from '../i18n'

export default function Admin(){
  const [lang] = useLang()
  return (
    <div className="card">
      <div className="card-header">Administration</div>
      <div className="card-body">
        <p style={{color:'#64748b'}}>Benutzerverwaltung erfolgt über Supabase Auth. Lege Rollen im user_metadata an, z.B. <code>{`{ role: 'dispatcher' | 'versand' | 'wareneingang' | 'mobel' }`}</code>. In nächstem Schritt możemy dodać UI do zarządzania rolami.</p>
        <ul>
          <li>— Login: Supabase Auth (E-Mail/Passwort)</li>
          <li>— Rollen: user_metadata.role</li>
          <li>— Wkrótce: GUI do resetu PIN/hasła i edycji ról</li>
        </ul>
      </div>
    </div>
  )
}
