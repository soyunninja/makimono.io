import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import { Sheet, SheetContent } from '@/components/ui/sheet'

describe('overlay close labels', () => {
  it('uses the provided accessible close label for dialog content', () => {
    render(
      <Dialog open>
        <DialogContent closeLabel="Cerrar">Dialog body</DialogContent>
      </Dialog>,
    )

    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument()
  })

  it('uses the provided accessible close label for sheet content', () => {
    render(
      <Sheet open>
        <SheetContent closeLabel="Cerrar">Sheet body</SheetContent>
      </Sheet>,
    )

    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument()
  })

  it('uses the provided accessible close label for drawer content', () => {
    render(
      <Drawer open>
        <DrawerContent closeLabel="Cerrar">Drawer body</DrawerContent>
      </Drawer>,
    )

    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument()
    expect(document.querySelector('[data-slot="drawer-content"]')).toBeInTheDocument()
  })
})
