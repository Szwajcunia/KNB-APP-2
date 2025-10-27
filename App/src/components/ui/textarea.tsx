import * as React from 'react'
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={['min-h-[96px] w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 ring-gray-300', props.className||''].join(' ')} />
}
