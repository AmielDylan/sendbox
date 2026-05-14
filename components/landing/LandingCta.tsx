'use client'

import Link from 'next/link'
import { IconMapPin, IconPlaneDeparture } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

interface LandingCtaProps {
  className?: string
  registerClassName?: string
  searchClassName?: string
}

export function LandingCta({
  className,
  registerClassName,
  searchClassName,
}: LandingCtaProps) {
  const { user, loading } = useAuth()
  const showRegister = !loading && !user

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {showRegister ? (
        <Button asChild className={registerClassName}>
          <Link href="/register">
            <IconPlaneDeparture className="h-4 w-4" />
            Je voyage
          </Link>
        </Button>
      ) : (
        <Button asChild className={registerClassName}>
          <Link href="/dashboard/annonces/new">
            <IconPlaneDeparture className="h-4 w-4" />
            Enregistrer un voyage
          </Link>
        </Button>
      )}

      <Button asChild className={searchClassName} variant="outline">
        <Link href="/recherche">
          <IconMapPin className="h-4 w-4" />
          Rechercher un trajet
        </Link>
      </Button>
    </div>
  )
}
