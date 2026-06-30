import { forwardRef, type ComponentProps, type ComponentPropsWithoutRef, type ElementRef, type HTMLAttributes } from 'react'
import { Drawer as DrawerPrimitive } from 'vaul'

import { cn } from '@/lib/utils'

function Drawer({ shouldScaleBackground = true, ...props }: ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root data-slot="drawer" shouldScaleBackground={shouldScaleBackground} {...props} />
}

const DrawerTrigger = DrawerPrimitive.Trigger
const DrawerPortal = DrawerPrimitive.Portal
const DrawerClose = DrawerPrimitive.Close

type DrawerContentProps = ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> & {
  closeLabel?: string
}

const DrawerOverlay = forwardRef<ElementRef<typeof DrawerPrimitive.Overlay>, ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>>(({ className, ...props }, ref) => <DrawerPrimitive.Overlay className={cn('fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out', className)} data-slot="drawer-overlay" ref={ref} {...props} />)
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

const DrawerContent = forwardRef<ElementRef<typeof DrawerPrimitive.Content>, DrawerContentProps>(({ className, children, closeLabel, ...props }, ref) => {
  void closeLabel

  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content className={cn('fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[92vh] flex-col rounded-t-3xl border-x border-t border-border/70 bg-card p-4 text-card-foreground shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:p-6', className)} data-slot="drawer-content" ref={ref} {...props}>
        <DrawerPrimitive.Handle className="mx-auto mb-4 h-2 w-[100px] rounded-full bg-muted" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
})
DrawerContent.displayName = DrawerPrimitive.Content.displayName

function DrawerHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('grid gap-1.5 p-4 text-center sm:text-left', className)} data-slot="drawer-header" {...props} />
}

function DrawerFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-auto flex flex-col gap-2 p-4', className)} data-slot="drawer-footer" {...props} />
}

const DrawerTitle = forwardRef<ElementRef<typeof DrawerPrimitive.Title>, ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>>(({ className, ...props }, ref) => <DrawerPrimitive.Title className={cn('text-lg font-semibold leading-none tracking-tight', className)} data-slot="drawer-title" ref={ref} {...props} />)
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = forwardRef<ElementRef<typeof DrawerPrimitive.Description>, ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>>(({ className, ...props }, ref) => <DrawerPrimitive.Description className={cn('text-sm text-muted-foreground', className)} data-slot="drawer-description" ref={ref} {...props} />)
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerOverlay, DrawerPortal, DrawerTitle, DrawerTrigger }
