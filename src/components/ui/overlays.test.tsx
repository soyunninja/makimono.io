import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer'
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

  it('does not render a built-in close button for drawer content', () => {
    render(
      <Drawer open>
        <DrawerContent closeLabel="Cerrar">
          <DrawerTitle>Drawer title</DrawerTitle>
          Drawer body
        </DrawerContent>
      </Drawer>,
    )

    expect(screen.queryByRole('button', { name: 'Cerrar' })).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Drawer title' })).toBeInTheDocument()
  })
})
