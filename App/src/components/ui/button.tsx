import * as React from 'react'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'sm' | 'md' | 'icon'
}

const base = 'inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm shadow-sm transition active:scale-[.98]'
const variants = {
  default: 'bg-black text-white hover:bg-black/90',
  outline: 'border border-gray-300 hover:bg-gray-50',
  ghost: 'hover:bg-gray-100',
  secondary: 'bg-gray-200 hover:bg-gray-300'
}
const sizes = {
  sm: 'h-8 px-2',
  md: 'h-9',
  icon: 'h-9 w-9 p-0'
}

export const Button = React.forwardRef<HTMLButtonElement, Props>(
  ({ className='', variant='default', size='md', ...props }, ref) => {
    return <button ref={ref} className={[base, variants[variant], sizes[size], className].join(' ')} {...props} />
  }
)
Button.displayName = 'Button'
