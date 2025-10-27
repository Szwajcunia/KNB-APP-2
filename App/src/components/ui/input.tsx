import * as React from 'react'

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={['h-9 w-full rounded-xl border px-3 text-sm outline-none focus:ring-2 ring-gray-300', props.className||''].join(' ')} />
}
