export function toast(msg:string){
  const el = document.createElement('div')
  el.className = 'toast'
  el.textContent = msg
  document.body.appendChild(el)
  setTimeout(()=>el.remove(), 2200)
}
