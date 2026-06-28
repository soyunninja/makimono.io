import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import type { VariantProps } from 'class-variance-authority'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'

import { cn } from '@/lib/utils'

import { toggleVariants } from '@/components/ui/toggle'

const ToggleGroup = forwardRef<ElementRef<typeof ToggleGroupPrimitive.Root>, ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>>(({ className, ...props }, ref) => <ToggleGroupPrimitive.Root className={cn('inline-flex items-center gap-2', className)} data-slot="toggle-group" ref={ref} {...props} />)
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

const ToggleGroupItem = forwardRef<ElementRef<typeof ToggleGroupPrimitive.Item>, ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> & VariantProps<typeof toggleVariants>>(({ className, variant, size, ...props }, ref) => <ToggleGroupPrimitive.Item className={cn(toggleVariants({ variant, size }), className)} data-slot="toggle-group-item" ref={ref} {...props} />)
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }
