import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

const logoSources = ['/favicon-tarjetas.png', '/favicon-listado.png', '/favicon-caratulas.png'] as const

type MakimonoAnimatedLogoProps = {
  className?: string
}

export function MakimonoAnimatedLogo({ className }: MakimonoAnimatedLogoProps) {
  const [activeLogoIndex, setActiveLogoIndex] = useState(0)

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveLogoIndex((currentIndex) => (currentIndex + 1) % logoSources.length)
    }, 750)

    return () => window.clearInterval(intervalId)
  }, [])

  return (
    <span className={cn('relative block h-28 w-28', className)}>
      {logoSources.map((src, index) => (
        <img
          alt=""
          aria-hidden="true"
          className={cn(
            'absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ease-in-out',
            activeLogoIndex === index ? 'opacity-100' : 'opacity-0',
          )}
          key={src}
          src={src}
        />
      ))}
    </span>
  )
}
