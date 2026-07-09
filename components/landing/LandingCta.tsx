'use client'

import Link from 'next/link'
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
  const { user } = useAuth()
  const travelerHref = user ? '/dashboard/annonces/new' : '/register'

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <Button asChild className={registerClassName}>
        <Link href="/recherche">Envoyer un colis</Link>
      </Button>

      <Button asChild className={searchClassName} variant="outline">
        <Link href={travelerHref}>Publier un trajet</Link>
      </Button>
    </div>
  )
}
