import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { Check, ChevronRight, Circle } from 'lucide-react'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'

import { cn } from '@/lib/utils'

const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
const DropdownMenuGroup = DropdownMenuPrimitive.Group
const DropdownMenuPortal = DropdownMenuPrimitive.Portal
const DropdownMenuSub = DropdownMenuPrimitive.Sub
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = forwardRef<ElementRef<typeof DropdownMenuPrimitive.SubTrigger>, ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & { inset?: boolean }>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger className={cn('flex cursor-default select-none items-center gap-2 rounded-xl px-2 py-2 text-sm outline-none transition-colors focus:bg-accent/10 data-[state=open]:bg-accent/10 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0', inset && 'pl-8', className)} data-slot="dropdown-menu-sub-trigger" ref={ref} {...props}>
    {children}
    <ChevronRight className="ml-auto" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = forwardRef<ElementRef<typeof DropdownMenuPrimitive.SubContent>, ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent className={cn('z-50 min-w-32 overflow-hidden rounded-2xl border border-border/70 bg-popover p-1 text-popover-foreground shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out', className)} data-slot="dropdown-menu-sub-content" ref={ref} {...props} />
))
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = forwardRef<ElementRef<typeof DropdownMenuPrimitive.Content>, ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content className={cn('z-50 min-w-32 overflow-hidden rounded-2xl border border-border/70 bg-popover p-1 text-popover-foreground shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out', className)} data-slot="dropdown-menu-content" ref={ref} sideOffset={sideOffset} {...props} />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = forwardRef<ElementRef<typeof DropdownMenuPrimitive.Item>, ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & { inset?: boolean }>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item className={cn('relative flex cursor-default select-none items-center gap-2 rounded-xl px-2 py-2 text-sm text-white/80 outline-none transition-colors focus:bg-accent/10 focus:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0', inset && 'pl-8', className)} data-slot="dropdown-menu-item" ref={ref} {...props} />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = forwardRef<ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>, ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem className={cn('relative flex cursor-default select-none items-center gap-2 rounded-xl py-2 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent/10 focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50', className)} checked={checked} data-slot="dropdown-menu-checkbox-item" ref={ref} {...props}>
    <span className="absolute left-2 flex size-4 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="size-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = forwardRef<ElementRef<typeof DropdownMenuPrimitive.RadioItem>, ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem className={cn('relative flex cursor-default select-none items-center gap-2 rounded-xl py-2 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent/10 focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50', className)} data-slot="dropdown-menu-radio-item" ref={ref} {...props}>
    <span className="absolute left-2 flex size-4 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="size-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = forwardRef<ElementRef<typeof DropdownMenuPrimitive.Label>, ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & { inset?: boolean }>(({ className, inset, ...props }, ref) => <DropdownMenuPrimitive.Label className={cn('px-2 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground', inset && 'pl-8', className)} data-slot="dropdown-menu-label" ref={ref} {...props} />)
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = forwardRef<ElementRef<typeof DropdownMenuPrimitive.Separator>, ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>>(({ className, ...props }, ref) => <DropdownMenuPrimitive.Separator className={cn('my-1 h-px bg-border/70', className)} data-slot="dropdown-menu-separator" ref={ref} {...props} />)
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
}
