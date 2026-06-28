import * as TogglePrimitive from '@radix-ui/react-toggle'
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'

import { cn } from '@/lib/utils'

const toggleVariants = cva('inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors hover:bg-accent/10 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent/15 data-[state=on]:text-foreground [&_svg]:pointer-events-none [&_svg]:size-4 shrink-0', {
  variants: {
    variant: { default: 'bg-transparent', outline: 'border border-border bg-background/80' },
    size: { default: 'h-11 px-4', sm: 'h-9 rounded-lg px-3 text-xs', lg: 'h-12 px-6' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
})

const Toggle = forwardRef<ElementRef<typeof TogglePrimitive.Root>, ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>>(({ className, variant, size, ...props }, ref) => <TogglePrimitive.Root className={cn(toggleVariants({ variant, size }), className)} data-slot="toggle" ref={ref} {...props} />)
Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }
