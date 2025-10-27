import { Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'
import { useLang, i18n } from './i18n'
import { supabase } from './supabaseClient'
import { useEffect, useState } from 'react'

export default function App(){
  const [lang, , t] = useLang()
  const [user,setUser] = useState<any>(null)

  useEffect(()=>{
    const get = async()=>{
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    get()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e,s)=> setUser(s?.user ?? null))
    return ()=>subscription.unsubscribe()
  },[])

  async function signIn(){
    const email = window.prompt('E-Mail:')
    const password = window.prompt('Passwort:')
    if(!email || !password) return
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if(error) alert(error.message)
  }
  async function signOut(){
    await supabase.auth.signOut()
  }

  return (
    <div className="container">
      <div className="topbar">
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <strong>Yard App</strong>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button className="btn outline" onClick={()=>location.reload()}>{i18n[lang].german==='DE'?'Neu laden':'Odśwież'}</button>
          {!user ? <button className="btn" onClick={signIn}>{i18n[lang].login}</button> :
            <>
              <span className="badge">{user.email}</span>
              <button className="btn" onClick={signOut}>{i18n[lang].logout}</button>
            </>
          }
        </div>
      </div>
      <Navbar/>
      <Outlet/>
      <div className="footer">© {new Date().getFullYear()} Yard App • Router + Supabase Auth • Standard: Deutsch</div>
    </div>
  )
}
