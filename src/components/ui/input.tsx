import { forwardRef, type InputHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, type = 'text', ...props }, ref) => (
  <input className={cn('flex h-11 w-full rounded-xl border border-input bg-background/80 px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50', className)} data-slot="input" ref={ref} type={type} {...props} />
))
Input.displayName = 'Input'

export { Input }
