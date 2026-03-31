'use client'

import Link from 'next/link'
import {
  IconArrowRight,
  IconMapPin,
  IconPlaneDeparture,
  IconLuggage,
} from '@tabler/icons-react'
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
      {/* Voyageur CTA */}
      {showRegister ? (
        <Button asChild className={registerClassName}>
          <Link href="/register">
            <IconPlaneDeparture className={cn('h-4 w-4', arrowClassName)} />
            Je transporte
          </Link>
        </Button>
      ) : (
        <Button asChild className={registerClassName}>
          <Link href="/dashboard/annonces/new">
            <IconPlaneDeparture className={cn('h-4 w-4', arrowClassName)} />
            Enregistrer un voyage
          </Link>
        </Button>
      )}

      {/* Sendbox service CTA */}
      <Button asChild variant="outline" className={searchClassName}>
        <Link href="/sendbox">
          <IconLuggage className={cn('h-4 w-4', mapClassName)} stroke={1.5} />
          Envoyer avec Sendbox
        </Link>
      </Button>

      {/* P2P CTA */}
      <Button asChild variant="ghost" size="sm">
        <Link href="/recherche" className="text-muted-foreground">
          <IconMapPin className="h-4 w-4" />
          Trouver un voyageur
          <IconArrowRight className="h-3 w-3" />
        </Link>
      </Button>
    </div>
  )
}
