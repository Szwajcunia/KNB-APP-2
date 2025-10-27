import * as React from 'react'

export function Card({ className='', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={['rounded-2xl border bg-white', className].join(' ')} {...props} />
}
export function CardHeader({ className='', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={['p-4', className].join(' ')} {...props} />
}
export function CardTitle({ className='', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <h3 className={['text-base font-semibold', className].join(' ')} {...props} />
}
export function CardContent({ className='', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={['p-4 pt-0', className].join(' ')} {...props} />
}
