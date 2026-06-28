import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'

import { cn } from '@/lib/utils'

const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

const SelectTrigger = forwardRef<ElementRef<typeof SelectPrimitive.Trigger>, ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger className={cn('flex h-11 w-full items-center justify-between rounded-xl border border-input bg-background/80 px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 [&_span]:line-clamp-1', className)} data-slot="select-trigger" ref={ref} {...props}>
    {children}
    <SelectPrimitive.Icon asChild><ChevronDown className="size-4 opacity-60" /></SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectContent = forwardRef<ElementRef<typeof SelectPrimitive.Content>, ComponentPropsWithoutRef<typeof SelectPrimitive.Content>>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content className={cn('relative z-50 max-h-80 min-w-[8rem] overflow-hidden rounded-2xl border border-border/70 bg-popover text-popover-foreground shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out', position === 'popper' && 'translate-y-1', className)} data-slot="select-content" position={position} ref={ref} {...props}>
      <SelectPrimitive.Viewport className={cn('p-1', position === 'popper' && 'min-w-[var(--radix-select-trigger-width)]')}>
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = forwardRef<ElementRef<typeof SelectPrimitive.Label>, ComponentPropsWithoutRef<typeof SelectPrimitive.Label>>(({ className, ...props }, ref) => <SelectPrimitive.Label className={cn('px-2 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground', className)} data-slot="select-label" ref={ref} {...props} />)
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = forwardRef<ElementRef<typeof SelectPrimitive.Item>, ComponentPropsWithoutRef<typeof SelectPrimitive.Item>>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item className={cn('relative flex w-full cursor-default select-none items-center rounded-xl py-2 pl-8 pr-3 text-sm outline-none transition-colors focus:bg-accent/10 focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50', className)} data-slot="select-item" ref={ref} {...props}>
    <span className="absolute left-2 flex size-4 items-center justify-center"><SelectPrimitive.ItemIndicator><Check className="size-4" /></SelectPrimitive.ItemIndicator></span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = forwardRef<ElementRef<typeof SelectPrimitive.Separator>, ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>>(({ className, ...props }, ref) => <SelectPrimitive.Separator className={cn('my-1 h-px bg-border/70', className)} data-slot="select-separator" ref={ref} {...props} />)
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue }
