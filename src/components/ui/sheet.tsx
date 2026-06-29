import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetClose = DialogPrimitive.Close
const SheetPortal = DialogPrimitive.Portal

const SheetOverlay = forwardRef<ElementRef<typeof DialogPrimitive.Overlay>, ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>>(({ className, ...props }, ref) => <DialogPrimitive.Overlay className={cn('fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out', className)} data-slot="sheet-overlay" ref={ref} {...props} />)
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName

const sheetVariants = cva('fixed z-50 gap-4 border-border/70 bg-card p-4 text-card-foreground shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out sm:p-6', {
  variants: {
    side: {
      top: 'inset-x-0 top-0 border-b',
      bottom: 'inset-x-0 bottom-0 border-t',
      left: 'inset-y-0 left-0 h-full w-[min(100%,28rem)] border-r',
      right: 'inset-y-0 right-0 h-full w-[min(100%,28rem)] border-l',
    },
  },
  defaultVariants: { side: 'right' },
})

type SheetContentProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Content> &
  VariantProps<typeof sheetVariants> & {
    closeLabel: string
  }

const SheetContent = forwardRef<ElementRef<typeof DialogPrimitive.Content>, SheetContentProps>(({ className, children, closeLabel, side, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content className={cn(sheetVariants({ side }), className)} data-slot="sheet-content" ref={ref} {...props}>
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"><X className="size-4" /><span className="sr-only">{closeLabel}</span></DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = DialogPrimitive.Content.displayName

function SheetHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cn('flex flex-col gap-2 text-left', className)} data-slot="sheet-header" {...props} /> }
function SheetFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cn('mt-auto flex flex-col-reverse gap-3 sm:flex-row sm:justify-end', className)} data-slot="sheet-footer" {...props} /> }

const SheetTitle = DialogPrimitive.Title
const SheetDescription = DialogPrimitive.Description

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetOverlay, SheetPortal, SheetTitle, SheetTrigger }
