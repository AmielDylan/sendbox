'use client'

import Link from 'next/link'
import { IconArrowRight, IconMapPin } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

interface LandingCtaProps {
  className?: string
  registerClassName?: string
  searchClassName?: string
  arrowClassName?: string
  mapClassName?: string
}

export function LandingCta({
  className,
  registerClassName,
  searchClassName,
  arrowClassName,
  mapClassName,
}: LandingCtaProps) {
  const { user, loading } = useAuth()
  const showRegister = !loading && !user

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {showRegister && (
        <Button asChild className={registerClassName}>
          <Link href="/register">
            S'inscrire gratuitement
            <IconArrowRight className={cn('h-4 w-4', arrowClassName)} />
          </Link>
        </Button>
      )}
      <Button asChild variant="outline" className={searchClassName}>
        <Link href="/recherche">
          <IconMapPin className={cn('h-4 w-4', mapClassName)} />
          Rechercher un trajet
        </Link>
      </Button>
    </div>
  )
}
